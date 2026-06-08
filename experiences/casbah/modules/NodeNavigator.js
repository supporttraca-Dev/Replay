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
import { CSS2DObject } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';

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
    },
    'patio->hub_rue': {
        position: { x: -191.99, y: -182.70, z: 299.60 },
        rotation: [-1.57, 0, -2.95]
    },
    'hub_rue->patio': {
        position: { x: 393.55, y: -71.24, z: 6.51 },
        rotation: [-1.57, 0, 0]
    },
    'hub_rue->rue_porte': {
        position: { x: -233.44, y: -323.80, z: -25.70 },
        rotation: [-1.57, 0, -4.90]
    },
    'hub_rue->hauteurs': {
        position: { x: 88, y: -182, z: 456 },
        rotation: [-1.57, 0, -9.25]
    },
    'hub_rue->marche': {
        position: { x: 75.48, y: -237.20, z: -313.11 },
        rotation: [-1.57, 0, -6.60]
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
            
            // On priorise la position du POI
            const finalPosition = navPoi.position || config.position || { x: 0, y: -200, z: 200 };
            const isExit   = navPoi.isExit   || false;
            const iconUrl  = navPoi.iconUrl  || null;
            // Label affiché sous la flèche (titre FR par défaut)
            const label    = navPoi.content?.fr?.title || '';

            let mesh;
            if (iconUrl) {
                mesh = this._buildIconMesh(config.rotation, finalPosition, target, iconUrl, label);
            } else {
                mesh = this._buildArrowMesh(config.rotation, finalPosition, target, isExit, label);
            }
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

    _buildArrowMesh(rotationArray, positionObj, targetNode, isExit = false, label = '') {
        // Dessiner le chevron sur un canvas
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);

        // Couleurs selon le type (sortie = rouge/rosé, normal = doré)
        const mainColor       = isExit ? '#e76060' : '#e7ba80';
        const shadowColor     = isExit ? 'rgba(231,96,96,0.95)' : 'rgba(231,186,128,0.95)';
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

        const texture      = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;

        const geo  = new THREE.PlaneGeometry(150, 150);
        const mat  = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.fromArray(rotationArray);

        // Hitbox pour faciliter le tap mobile
        const hitGeo = new THREE.PlaneGeometry(250, 250);
        const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
        const hitbox = new THREE.Mesh(hitGeo, hitMat);
        hitbox.userData = { targetNode, isArrow: true };
        mesh.add(hitbox);

        // Label CSS2D sous la flèche
        if (label) {
            const div = document.createElement('div');
            div.className = 'arrow-floor-label';
            div.textContent = label;
            div.style.cssText = 'color:#e7ba80;font-family:serif;font-size:13px;text-align:center;text-shadow:0 1px 4px rgba(0,0,0,0.9);pointer-events:none;margin-top:80px;white-space:nowrap;';
            const labelObj = new CSS2DObject(div);
            labelObj.position.set(0, -90, 0);
            mesh.add(labelObj);
        }

        const pos = new THREE.Vector3(positionObj.x, positionObj.y, positionObj.z);
        if (pos.length() > 400) pos.setLength(400);
        mesh.position.copy(pos);
        mesh.userData = { targetNode, isArrow: true, originalPoiPos: positionObj };

        return mesh;
    }

    /** Construit un marqueur avec icône SVG au sol (pas un chevron) */
    _buildIconMesh(rotationArray, positionObj, targetNode, iconUrl, label = '') {
        const canvas  = document.createElement('canvas');
        canvas.width  = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;

        const geo  = new THREE.PlaneGeometry(150, 150);
        const mat  = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.fromArray(rotationArray);

        // Charger le SVG et le dessiner sur le canvas
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, 256, 256);
            // Cercle de fond doré
            ctx.shadowColor = 'rgba(231,186,128,0.95)';
            ctx.shadowBlur  = 24;
            ctx.fillStyle   = 'rgba(231,186,128,0.2)';
            ctx.beginPath();
            ctx.arc(128, 128, 110, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Contour
            ctx.strokeStyle = '#e7ba80';
            ctx.lineWidth   = 6;
            ctx.stroke();
            // Icône SVG centrée
            ctx.drawImage(img, 48, 30, 160, 160);
            texture.needsUpdate = true;
        };
        img.src = iconUrl;

        // Hitbox
        const hitGeo = new THREE.PlaneGeometry(250, 250);
        const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
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
