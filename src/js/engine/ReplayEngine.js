import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { SceneEngine } from './SceneEngine.js';
import { ControlsManager } from './ControlsManager.js';
import { MultiverseSpheres } from './MultiverseSpheres.js';
import { UIManager } from './UIManager.js';
import { PoiManager } from './PoiManager.js';
import { ParticleManager } from './ParticleManager.js';
import { GameStateManager } from './GameStateManager.js';
import { MuseumManager } from './MuseumManager.js';
import { tracaAudio } from '../core/TracaAudio.js';

export class ReplayEngine {

    constructor() {
        const webglWrap = document.getElementById('c-canvas-wrap');
        const cssWrap   = document.getElementById('c-css2d');

        // — UI (toujours en premier pour afficher le loader dès le départ) —
        this.ui        = new UIManager();

        // — Game State & Museum —
        this.gameState = new GameStateManager();
        this.museum    = new MuseumManager(this.gameState, this.ui);

        // — Moteur 3D —
        this.sceneEngine = new SceneEngine(webglWrap, cssWrap);
        this.spheres     = new MultiverseSpheres(this.sceneEngine.scene);
        this.particles   = new ParticleManager(this.sceneEngine);
        this.particles.init();

        // — Contrôles —
        this.controls = new ControlsManager(
            this.sceneEngine.camera,
            this.sceneEngine.renderer.domElement
        );

        // — Audio —
        this.audio = tracaAudio;

        // — POIs (avec câblage vers loadNode) —
        this.poiManager = new PoiManager(this.sceneEngine, this.ui, this.audio);
        this.poiManager.onNavigate = (nodeId) => this.loadNode(nodeId);

        // — État interne —
        this.levelData = null;
        this.state = {
            isRunning:     false,
            currentNodeId: null,
            lang:          'fr'
        };

        this._loop = this._loop.bind(this);
    }

    // ─── Boucle de rendu ────────────────────────────────────────────────────

    startLoop() {
        if (this.state.isRunning) return;
        this.state.isRunning = true;
        this._loop();
    }

    _loop() {
        if (!this.state.isRunning) return;
        requestAnimationFrame(this._loop);
        this.controls.update();
        this.particles.update();
        this.sceneEngine.render();
    }

    // ─── Chargement d'un Niveau ─────────────────────────────────────────────

    /**
     * Charge un niveau (scénario complet avec nœuds).
     * La boucle de rendu ne démarre pas ici — c'est le bouton "Entrer" qui la déclenche.
     * @param {object} levelData - Données du niveau (ex: CASBAH_SCENARIO)
     * @returns {Promise<void>} Résolu quand les textures sont prêtes et le bouton activé.
     */
    async loadLevel(levelData) {
        this.levelData = levelData;

        // Démarrer la boucle de rendu dès maintenant (le Canvas est vide mais il tourne)
        this.startLoop();

        const startNodeId = levelData.settings?.startNode
            || Object.keys(levelData.nodes)[0];

        await this._loadNodeTextures(startNodeId);

        // À ce stade, tout est prêt. On retourne une Promise qui se résout
        // quand l'utilisateur clique sur "Entrer" (pour permettre à main_replay.js
        // d'enchaîner les actions post-entrée).
        return new Promise((resolve) => {
            this.ui.readyToEnter(() => {
                // 1. Déverrouiller l'audio (geste utilisateur obligatoire)
                try { tracaAudio.unlockAudioContext?.(); } catch (e) {}
                try { tracaAudio.restoreFromPrefs?.();  } catch (e) {}

                // 2. Résoudre la Promise pour que main_replay.js puisse afficher le menu
                resolve();
            });
        });
    }

    /**
     * Charge les textures d'un nœud et met à jour les sphères + POIs.
     * Utilisé pour la navigation interne entre nœuds.
     */
    async loadNode(nodeId) {
        const nodeData = this.levelData?.nodes[nodeId];
        if (!nodeData) {
            console.error(`[ReplayEngine] Nœud introuvable: "${nodeId}"`);
            return;
        }
        await this._loadNodeTextures(nodeId);
    }

    async _loadNodeTextures(nodeId) {
        const nodeData = this.levelData?.nodes[nodeId];
        if (!nodeData) return;

        this.state.currentNodeId = nodeId;

        const texLoader = new THREE.TextureLoader();

        // Progression XHR avec fallback fake-progress (comme l'original)
        const loadWithProgress = (url, startPct, endPct) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.responseType = 'blob';

                let fake = startPct;
                let ticker = null;

                xhr.onprogress = (e) => {
                    if (e.lengthComputable) {
                        if (ticker) { clearInterval(ticker); ticker = null; }
                        const pct = startPct + (e.loaded / e.total) * (endPct - startPct);
                        this.ui.setProgress(pct);
                    } else if (!ticker) {
                        ticker = setInterval(() => {
                            fake += (endPct - fake) * 0.06;
                            this.ui.setProgress(fake);
                        }, 150);
                    }
                };

                xhr.onload = () => {
                    if (ticker) clearInterval(ticker);
                    if (xhr.status >= 400) { reject(new Error(`HTTP ${xhr.status} — ${url}`)); return; }
                    const img = new Image();
                    img.onload = () => {
                        const tex = new THREE.Texture(img);
                        tex.needsUpdate = true;
                        tex.colorSpace  = THREE.SRGBColorSpace;
                        URL.revokeObjectURL(img.src);
                        this.ui.setProgress(endPct);
                        resolve(tex);
                    };
                    img.onerror = () => reject(new Error(`Decode error — ${url}`));
                    img.src = URL.createObjectURL(xhr.response);
                };

                xhr.onerror = () => { if (ticker) clearInterval(ticker); reject(new Error(`Network error — ${url}`)); };
                xhr.send();
            });
        };

        try {
            const dayPath   = nodeData.backgrounds.day;
            const nightPath = nodeData.backgrounds.night || nodeData.backgrounds.day;

            // Charger les deux textures séquentiellement avec progression 5→50 → 50→95
            const texDay   = await loadWithProgress(dayPath,   5,  50);
            const texNight = await loadWithProgress(nightPath, 50, 95);

            // Initialiser ou swapper les sphères
            if (!this.spheres.sphereDay) {
                this.spheres.init(texDay, texNight);
            } else {
                this.spheres.sphereDay.material.map   = texDay;
                this.spheres.sphereNight.material.map = texNight;
                this.spheres.sphereDay.material.needsUpdate   = true;
                this.spheres.sphereNight.material.needsUpdate = true;
                // Resynchroniser l'opacité avec le mode actuel
                this.spheres.sphereNight.material.opacity =
                    (this.spheres.timeMode === 'night') ? 1 : 0;
            }

            // Charger les POIs du nœud
            this.poiManager.loadPois(nodeData.pois || [], this.state.lang, this.spheres.timeMode);

            // Orienter la caméra
            if (nodeData.startCam) {
                this.controls.setAngles(nodeData.startCam.az, nodeData.startCam.pol);
            }

        } catch (err) {
            console.error('[ReplayEngine] Erreur chargement textures:', err);
            this.ui.setProgress(100); // Évite de rester bloqué
        }
    }

    /**
     * Appelé lors du voyage temporel pour cacher/afficher les POIs
     */
    updatePoiVisibility() {
        this.poiManager.updateVisibility(this.spheres.timeMode);
    }
}
