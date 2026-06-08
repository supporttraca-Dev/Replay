/**
 * NodeNavigator — Traca Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Gère la navigation entre les nodes 360° de l'expérience :
 *   - Chargement des textures de fond (jour + nuit)
 *   - Swap de matériaux sur les sphères
 *   - Création / destruction des flèches de sol (chevrons)
 *   - Transition cinématique (flash noir + camera reset)
 *   - Rechargement des POIs via processLoadedData
 *
 * Dépendances : Three.js, scénario data, sphereDay, sphereNight, controls, tracaAudio
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/** Config hardcodée des positions/rotations des flèches de sol par chemin node */
const ARROW_CONFIGS = {
    'patio->upstairs': {
        position: { x: 331.55, y: -373.75, z: 2.97 },
        rotation: [-Math.PI / 2, 0, -1.60]
    },
    'upstairs->patio': {
        position: { x: 257.31, y: -214.01, z: 219.06 },
        rotation: [-Math.PI / 2, 0, -2.39]
    },
    'upstairs->room': {
        position: { x: 464.30, y: -98.32, z: 155.46 },
        rotation: [-Math.PI / 2, 0, -1.32]
    },
    'room->upstairs': {
        position: { x: -162.75, y: -174.24, z: 321.17 },
        rotation: [-Math.PI / 2, 0, -4.36]
    },
    'patio->basement': {
        position: { x: 217.51, y: -147.06, z: -301.77 },
        rotation: [-Math.PI / 2, 0, -1.40]
    },
    'basement->patio': {
        position: { x: -66.31, y: -171.87, z: -355.06 },
        rotation: [-Math.PI / 2, 0, -5.95]
    }
};

export class NodeNavigator {
    /**
     * @param {Object} deps
     * @param {THREE.Scene}        deps.scene
     * @param {THREE.Mesh}         deps.sphereDay
     * @param {THREE.Mesh}         deps.sphereNight
     * @param {OrbitControls}      deps.controls
     * @param {Object}             deps.tracaAudio
     * @param {HTMLElement}        deps.flashEl        — #time-flash
     * @param {Object}             deps.scenarioNodes  — CASBAH_SCENARIO.nodes
     * @param {Object}             deps.state          — { currentNodeId, isNight, isTraveling }
     * @param {Function}           deps.onNodeLoaded   — callback(nodeData) après le swap
     * @param {Function}           deps.stopVoice      — callback
     * @param {Function}           deps.closeAllPopups — callback
     */
    constructor(deps) {
        Object.assign(this, deps);
        this.groundArrowMeshes = [];
    }

    // ── API publique ──────────────────────────────────────────────────────────

    /**
     * Navigue vers un node avec transition cinématique.
     * Retourne une Promise résolue quand le node est pleinement chargé.
     */
    async loadNode(nodeId) {
        if (this.state.isTraveling) return;
        this.state.isTraveling = true;

        const nodeData = this.scenarioNodes[nodeId];
        if (!nodeData) {
            console.error(`[NodeNavigator] Node not found: ${nodeId}`);
            this.state.isTraveling = false;
            return;
        }

        // 1. SFX
        this.tracaAudio?.playSFX('time_warp.mp3');

        // 2. Fade noir
        if (this.flashEl) {
            this.flashEl.style.transition = 'opacity 0.6s ease';
            this.flashEl.style.opacity    = '1';
        }

        await new Promise(resolve => setTimeout(resolve, 600));

        // 3. Swap
        this.state.currentNodeId = nodeId;
        this.stopVoice?.();
        this.closeAllPopups?.();

        await this._swapTextures(nodeData);
        this._syncSphereOpacity();
        this.onNodeLoaded?.(nodeData);

        // Recréer les flèches de sol
        this.rebuildArrows();

        // Orienter la caméra
        if (nodeData.startCam) {
            this._applyCameraStart(nodeData.startCam);
        }

        // 4. Dévoilement
        if (this.flashEl) {
            this.flashEl.style.transition = 'opacity 0.8s ease';
            this.flashEl.style.opacity    = '0';
        }

        await new Promise(resolve => setTimeout(resolve, 900));
        this.state.isTraveling = false;
    }

    /** Reconstruit les flèches de sol pour le node courant */
    rebuildArrows() {
        this._clearArrows();

        // Pas de flèches en mode nuit
        if (this.state.isNight) return;

        const nodeData = this.scenarioNodes[this.state.currentNodeId];
        if (!nodeData?.pois) return;

        const navPois = nodeData.pois.filter(p => p.poiType === 'navigation');
        navPois.forEach(navPoi => {
            const target = navPoi.targetNode;
            if (!target) return;

            const key    = `${this.state.currentNodeId}->${target}`;
            const config = ARROW_CONFIGS[key] || { rotation: [-Math.PI / 2, 0, 0] };
            
            // On priorise la position du POI (si le joueur l'a modifiée/placée)
            const finalPosition = navPoi.position || config.position || { x: 0, y: -200, z: 200 };
            const isExit = navPoi.isExit || false;

            const mesh = this._buildArrowMesh(config.rotation, finalPosition, target, isExit);
            this.scene.add(mesh);
            this.groundArrowMeshes.push(mesh);
        });
    }

    /** Retourne les meshes de flèches pour le raycasting du controller */
    getArrowMeshes() {
        return this.groundArrowMeshes;
    }

    /** Animation pulse : à appeler dans chaque frame */
    animateArrows() {
        if (this.groundArrowMeshes.length === 0) return;
        const t = performance.now() * 0.002;
        const scale = 1.0 + Math.sin(t) * 0.05;
        this.groundArrowMeshes.forEach(mesh => {
            mesh.scale.set(scale, scale, 1.0);
            if (mesh.material) {
                mesh.material.opacity = 0.75 + Math.sin(t * 1.5) * 0.15;
            }
        });
    }

    // ── Interne ───────────────────────────────────────────────────────────────

    async _swapTextures(nodeData) {
        const dayPath   = nodeData.backgrounds?.day;
        const nightPath = nodeData.backgrounds?.night || dayPath;
        if (!dayPath) return;

        try {
            const [texDay, texNight] = await Promise.all([
                this._loadTexture(dayPath),
                this._loadTexture(nightPath)
            ]);
            texDay.colorSpace   = THREE.SRGBColorSpace;
            texNight.colorSpace = THREE.SRGBColorSpace;

            this.sphereDay.material.map   = texDay;
            this.sphereNight.material.map = texNight;
            this.sphereDay.material.needsUpdate   = true;
            this.sphereNight.material.needsUpdate = true;
        } catch (err) {
            console.error('[NodeNavigator] Error swapping textures:', err);
        }
    }

    _syncSphereOpacity() {
        this.sphereDay.material.opacity   = this.state.isNight ? 0 : 1;
        this.sphereNight.material.opacity = this.state.isNight ? 1 : 0;
    }

    _applyCameraStart(startCam) {
        this.controls.enableDamping = false;
        this.controls.object?.position.setFromSphericalCoords(0.1, startCam.pol, startCam.az);
        this.controls.target?.set(0, 0, 0);
        this.controls.update?.();
        setTimeout(() => { this.controls.enableDamping = true; }, 100);
    }

    _loadTexture(url) {
        return new Promise((resolve, reject) => {
            new THREE.TextureLoader().load(url, resolve, undefined, reject);
        });
    }

    _clearArrows() {
        this.groundArrowMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry?.dispose();
            if (mesh.material) {
                mesh.material.map?.dispose();
                mesh.material.dispose();
            }
        });
        this.groundArrowMeshes = [];
    }

    _buildArrowMesh(rotationArray, positionObj, targetNode, isExit = false) {
        // Dessiner le chevron sur un canvas
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);

        // Couleurs selon le type (sortie = rouge/rosé, normal = doré)
        const mainColor = isExit ? '#e76060' : '#e7ba80';
        const shadowColor = isExit ? 'rgba(231,96,96,0.95)' : 'rgba(231,186,128,0.95)';
        const innerShadowColor = isExit ? 'rgba(231,96,96,0.8)' : 'rgba(231,186,128,0.8)';

        // Contour sombre
        ctx.strokeStyle = 'rgba(15,10,5,0.9)';
        ctx.lineWidth   = 26;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath(); ctx.moveTo(50,150); ctx.lineTo(128,40); ctx.lineTo(206,150); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(70,200); ctx.lineTo(128,110); ctx.lineTo(186,200); ctx.stroke();

        // Chevron
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur  = 24;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth   = 14;
        ctx.beginPath(); ctx.moveTo(50,150); ctx.lineTo(128,40); ctx.lineTo(206,150); ctx.stroke();

        ctx.shadowBlur  = 12;
        ctx.strokeStyle = innerShadowColor;
        ctx.lineWidth   = 8;
        ctx.beginPath(); ctx.moveTo(70,200); ctx.lineTo(128,110); ctx.lineTo(186,200); ctx.stroke();

        const texture       = new THREE.CanvasTexture(canvas);
        texture.colorSpace  = THREE.SRGBColorSpace;

        // Flèche visible (grande pour mobile)
        const geo  = new THREE.PlaneGeometry(150, 150);
        const mat  = new THREE.MeshBasicMaterial({
            map: texture, transparent: true,
            side: THREE.DoubleSide, depthWrite: false
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.fromArray(rotationArray);

        // Hitbox invisible plus grand encore pour faciliter le tap mobile
        const hitGeo = new THREE.PlaneGeometry(250, 250);
        const hitMat = new THREE.MeshBasicMaterial({
            transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false
        });
        const hitbox = new THREE.Mesh(hitGeo, hitMat);
        hitbox.userData = { targetNode, isArrow: true };
        mesh.add(hitbox);

        const pos = new THREE.Vector3(positionObj.x, positionObj.y, positionObj.z);
        if (pos.length() > 400) pos.setLength(400);
        mesh.position.copy(pos);
        mesh.userData = { targetNode, isArrow: true, originalPoiPos: positionObj };

        return mesh;
    }
}
