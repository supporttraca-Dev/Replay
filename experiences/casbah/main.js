import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { DeviceOrientationControls } from './DeviceOrientationControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';
import { tracaAudio } from '../../src/js/core/TracaAudio.js';
import { Analytics } from '../../src/js/core/Analytics.js';
import { CASBAH_SCENARIO } from '../../src/js/levels/Level_01_Casbah.js';
import { swManager } from '../../src/js/core/SWManager.js';
import { localStore } from '../../src/js/core/db/localStore.js';
import { SceneAudioDirector } from '../../src/js/core/SceneAudioDirector.js';

import {
    InventoryModule,
    EagleVisionModule,
    TimeTravelModule,
    CompassModule,
    NodeNavigator,
    EditorModule,
    TutorialModule
} from './modules/index.js';

import { SceneEngine } from '../../src/js/engine/SceneEngine.js';
import { ControlsManager } from '../../src/js/engine/ControlsManager.js';
import { ParticleManager } from '../../src/js/engine/ParticleManager.js';

// ═══ BASE DE DONNÉES DES ARTÉFACTS ═══
const ARTIFACTS_DB = {
    // ─ Rez-de-chaussée Jour : Journal Intime ─
    'patio': {
        id: 'journal',
        icon: '📔',
        image: '../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/artefact/journal intime.png',
        iconImg: '../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/artefact/journal intime.png',
        name: 'Journal Intime',
        subtitle: 'Découverte · Rez-de-chaussée',
        desc: 'Un carnet personnel appartenant à la maîtresse de maison. Ses pages semblent renfermer des souvenirs et des secrets enfouis.',
        fonction: 'Contient des indices narratifs sur l\'histoire de la maison.',
        // Position sphérique cible (X:-241, Y:-152, Z:-411 → converties en Az/Pol)
        targetAz: -2.12,
        targetPol: 1.93,
        hint: 'Activez la Vision d\'Aigle et cherchez un objet personnel oublié dans le patio…',
        // Visible uniquement en mode JOUR (pas la nuit)
        dayOnly: true,
        usable: true
    },

    // ─ Chambre Mauresque : Clé de la Matmoura ─
    'room': {
        id: 'key_matmoura',
        icon: '🗝️',
        image: '../../assets/levels/level_01_casbah/scenes/04_chambre/elements/objects/04_key.png',
        iconImg: '../../assets/levels/level_01_casbah/scenes/04_chambre/elements/objects/04_key.png',
        name: 'Clé de la Matmoura',
        subtitle: 'Découverte · Chambre Mauresque',
        desc: 'Une clé en bronze finement ouvragée, datant du XIIe siècle. Elle ouvrirait une porte secrète menant à la Matmoura.',
        fonction: 'Déverrouille la porte donnant accès au niveau inférieur (La Matmoura).',
        targetAz: 4.29,
        targetPol: 1.96,
        hint: 'Inspectez les recoins de la chambre mauresque, à côté du coffre.'
    }
};

class CasbahExperience {
    get baseFov() {
        return this.sceneEngine ? this.sceneEngine.baseFov : (window.innerWidth < 768 ? 95 : 75);
    }

    constructor() {
        // UI Refs
        this.els = {
            webglWrap: document.getElementById('c-canvas-wrap'),
            cssWrap: document.getElementById('c-css2d'),
            loader: document.getElementById('c-loader'),
            bar: document.getElementById('c-loader-bar'),
            pct: document.getElementById('c-loader-pct'),
            hud: document.getElementById('c-hud'),
            editor: document.getElementById('c-editor'),
            btnSetCam: document.getElementById('btn-set-startcam'),

            vmusic: document.getElementById('vol-music'),
            vvoice: document.getElementById('vol-voice'),
            vamb: document.getElementById('vol-ambience'),
            btnStop: document.getElementById('btn-hud-stopvoice'),

            btnTime: document.getElementById('btn-time-travel'),
            timeFlash: document.getElementById('time-flash'),

            poiList: document.getElementById('poi-list'),
            fHint: document.getElementById('ced-hint'),
            fTitle: document.getElementById('poi-title'),
            fX: document.getElementById('poi-temp-x'),
            fY: document.getElementById('poi-temp-y'),
            fZ: document.getElementById('poi-temp-z'),
            fId: document.getElementById('poi-edit-id'),
            fCol: document.getElementById('ced-form'),
            btnSave: document.getElementById('btn-poi-save'),
            btnDel: document.getElementById('btn-poi-delete'),
            btnCancel: document.getElementById('btn-poi-cancel'),

            dynRepBox: document.getElementById('dynamic-replicas-container'),
            btnAddReplica: document.getElementById('btn-add-replica'),

            edStatus: document.getElementById('ced-status'),
            btnEdTime: document.getElementById('btn-ed-time'),
            poiCompass: document.getElementById('poi-compass'),
            poiCompassArrow: document.getElementById('poi-compass-arrow'),
            
            btnGyro: document.getElementById('btn-hud-gyro'),
            btnEagle: document.getElementById('btn-hud-eagle'),
            btnHelp: document.getElementById('btn-hud-help'),
            eagleCanvas: document.getElementById('eagle-vision-canvas'),
            rewardPopup: document.getElementById('hidden-reward-popup'),
            
            inventoryBar: document.getElementById('c-inventory-bar'),
            inventoryModal: document.getElementById('c-inventory-modal'),
            chestDetailsPanel: document.getElementById('chest-details-panel')
        };

        // State
        this.state = {
            mode: 'VIEW', // 'VIEW' | 'EDIT' | 'MAP'
            lang: 'ar',
            isNight: false,
            pois: [],
            audioNodes: [],
            scenarioData: null,
            playingVoicePoi: null,
            editorReplicas: [],
            v_music: 0.35,
            v_amb: 0.45,
            v_voice: 1.0,
            audioUnlocked: false,
            visitedPois: new Set(),
            gyroMode: false,
            hiddenObjectFound: false,
            hiddenObjectTimer: 0,
            isFocusing: false,
            targetFov: null,
            currentNodeId: 'patio',
            debugMode: false,
            eagleVisionActive: false,
            foundArtifacts: new Set(),
            onboarding: {
                gyroTutorialTriggered: localStorage.getItem('traca_tuto_gyro') === '1',
                gyroTutorialCompleted: localStorage.getItem('traca_tuto_gyro') === '1',
                eagleTutorialTriggered: localStorage.getItem('traca_tuto_eagle') === '1',
                eagleTutorialCompleted: localStorage.getItem('traca_tuto_eagle') === '1',
                firstInteractDetected: false
            }
        };

        Object.defineProperty(this.state, 'baseFov', {
            get: () => this.baseFov,
            enumerable: true,
            configurable: true
        });

        this.eagleCtx = null;

        this._initThree();
        this._initModules();
        this._bindEvents();
        this._loadEnvironment();
    }

    _initThree() {
        this.sceneEngine = new SceneEngine(this.els.webglWrap, this.els.cssWrap);
        this.scene = this.sceneEngine.scene;
        this.camera = this.sceneEngine.camera;
        this.camera.position.set(0, 0, 0.1);
        this.renderer = this.sceneEngine.renderer;
        this.cssRenderer = this.sceneEngine.cssRenderer;

        // CRITICAL FIX (mobile): touch-action none
        this.renderer.domElement.style.touchAction = 'none';

        // Set up Orbit controls via ControlsManager
        this.controlsManager = new ControlsManager(this.camera, this.renderer.domElement);
        this.controls = this.controlsManager.orbit; // Exposed for index.html / MapIntro.js compatibility
        this.gyroControls = null;

        this.raycaster = this.sceneEngine.raycaster;
        this.mouse = this.sceneEngine.mouse;

        // Ambient particles
        this.particleManager = new ParticleManager(this.sceneEngine);
        this.particleManager.init();
        this.particles = this.particleManager.particles;

        // Click interaction setup
        let pointerDownX = 0;
        let pointerDownY = 0;
        let pointerDownTime = 0;
        const dom = this.renderer.domElement;

        dom.addEventListener('pointerdown', (e) => {
            pointerDownX = e.clientX;
            pointerDownY = e.clientY;
            pointerDownTime = performance.now();
        });

        dom.addEventListener('pointerup', (e) => {
            const distX = Math.abs(e.clientX - pointerDownX);
            const distY = Math.abs(e.clientY - pointerDownY);
            const duration = performance.now() - pointerDownTime;
            // Seuil mobile : 30px et 500ms pour bien différencier tap vs drag
            if (distX < 30 && distY < 30 && duration < 500) {
                this._onCanvasClick(e);
            }
        });
        window.addEventListener('resize', this.sceneEngine.onResize.bind(this.sceneEngine));
    }

    _initModules() {
        this.sceneAudioDirector = new SceneAudioDirector(tracaAudio, CASBAH_SCENARIO.nodes);

        // 0. Tutorial (doit être instancié avant les autres modules)
        this.tutorial = new TutorialModule({
            btnGyro:      document.getElementById('btn-hud-gyro'),
            btnEagle:     document.getElementById('btn-hud-eagle'),
            btnInventory: document.getElementById('btn-open-inventory'),
            onActivateGyro: () => this._toggleGyro()
        });

        // 1. Inventory & Codex
        this.inventory = new InventoryModule(
            ARTIFACTS_DB,
            tracaAudio,
            this._bindBtn.bind(this),
            this.state.foundArtifacts,
            () => this._updateQuestUI()
        );

        // Hook tutorial → inventaire ouvert
        const _origOpenModal = this.inventory.openModal.bind(this.inventory);
        this.inventory.openModal = () => {
            _origOpenModal();
            this.tutorial.onInventoryOpened();
        };

        window.addEventListener('traca_use_item', (e) => {
            if (e.detail === 'journal') {
                this.inventory.closeModal();
                this._showJournalReader();
            }
        });

        // 2. Eagle Vision
        this.eagleVision = new EagleVisionModule({
            camera: this.camera,
            tracaAudio,
            canvasEl: this.els.eagleCanvas,
            webglWrap: this.els.webglWrap,
            rewardPopup: this.els.rewardPopup,
            btnEagle: this.els.btnEagle,
            artifactsDB: ARTIFACTS_DB,
            foundArtifacts: this.state.foundArtifacts,
            inventory: this.inventory,
            onStopVoice: () => this._stopVoice(),
            onUpdatePois: () => this._updatePoiVisibility(),
            onArtifactFound: (artId) => {
                this._onArtifactFound(artId);
                const artData = ARTIFACTS_DB[this.state.currentNodeId];
                this.tutorial.onArtifactFound(artData?.name || 'Objet');
            },
            showToast: (txt) => this.inventory.showToast(txt),
            state: this.state
        });

        // 3. Time Travel
        this.timeTravel = new TimeTravelModule({
            sphereDay: null, // Wired dynamically in _loadEnvironment
            sphereNight: null,
            tracaAudio,
            Analytics,
            hudEl: this.els.hud,
            webglWrap: this.els.webglWrap,
            onToggle: (isNight) => {
                // Sync state
                this.state.isNight = isNight;

                // ── Ambience par scène selon le temps ──────────────────────
                this.sceneAudioDirector.onTimeTravel(isNight, this.state.currentNodeId);

                this._updatePoiVisibility();
                if (this.navigator) this.navigator.rebuildArrows();
                if (this.state.mode === 'EDIT' && this.editor) this.editor.renderEditorList();
            }
        });

        // 4. Compass
        this.compass = new CompassModule(this.els.poiCompass, this.els.poiCompassArrow);

        // 5. Node Navigator
        this.navigator = new NodeNavigator({
            scene: this.scene,
            sphereDay: null, // Wired dynamically in _loadEnvironment
            sphereNight: null,
            controls: this.controls,
            tracaAudio,
            flashEl: this.els.timeFlash,
            scenarioNodes: CASBAH_SCENARIO.nodes,
            state: this.state,
            onNodeLoaded: (nodeData) => {
                this.state.scenarioData = nodeData;
                this._processLoadedData(nodeData);
                this._updateQuestUI();

                // ── Ambience par scène ─────────────────────────────────────
                this.sceneAudioDirector.onNodeEnter(this.state.currentNodeId, this.state.isNight);

                // ── Tutorial step 2 : Vision d'Aigle ──────────────────────
                this.tutorial?.onNodeChanged();

                if (this.state.mode === 'EDIT' && this.editor) {
                    this.editor.renderEditorList();
                    this.editor.renderAudioNodeList();
                }
            },
            stopVoice: () => this._stopVoice(),
            closeAllPopups: () => this._closeAllPopups()
        });

        // 6. Editor
        this.editor = new EditorModule({
            scene: this.scene,
            state: this.state,
            tracaAudio,
            buildHtmlPoi: (poi) => this._buildHtmlPoi(poi),
            updatePoiVisibility: () => this._updatePoiVisibility(),
            updateAllPoiTexts: () => this._updateAllPoiTexts(),
            createGroundArrow: () => this.navigator.rebuildArrows(),
            onImportJSON: (data) => this._processLoadedData(data)
        });
    }

    _bindBtn(el, callback, options = {}) {
        if (!el) return;
        let lastTrigger = 0;
        const trigger = (e) => {
            const now = performance.now();
            if (now - lastTrigger < 300) return;
            lastTrigger = now;
            if (!options.allowDefault) {
                e.preventDefault();
            }
            e.stopPropagation();
            callback(e);
        };
        el.addEventListener('click', trigger);
        if (!options.clickOnly) {
            el.addEventListener('touchstart', trigger, { passive: false });
        }
    }

    _bindEvents() {
        const bindButton = (el, callback) => this._bindBtn(el, callback);

        if (this.els.btnGyro) {
            this._bindBtn(this.els.btnGyro, () => this._toggleGyro(), { allowDefault: true, clickOnly: true });
        }
        if (this.els.btnHelp) {
            this._bindBtn(this.els.btnHelp, () => this._showHelpHint(), { allowDefault: true, clickOnly: true });
        }

        const btnResetInv = document.getElementById('btn-reset-inv');
        if (btnResetInv) {
            bindButton(btnResetInv, () => {
                this.inventory.resetQuest(true);
                this._updateQuestUI();
                this._msg('🔄 Inventaire réinitialisé !', 2500);
            });
        }
        
        // System UI Click SFX
        const globalClickSfx = new Audio('/assets/levels/level_01_casbah/global/ui/click.mp3');
        globalClickSfx.volume = 0.6;
        globalClickSfx.load();

        document.querySelectorAll('.c-btn, .c-hud-btn, .c-lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sfx = globalClickSfx.cloneNode();
                sfx.volume = 0.6;
                sfx.play().catch(() => { });
            });
        });

        // Menu & Launch
        const btnStart = document.getElementById('btn-start');
        bindButton(btnStart, () => {
            if (this.mapIntro) {
                this.els.menu.style.transition = 'opacity .5s';
                this.els.menu.style.opacity = '0';
                setTimeout(() => {
                    this.els.menu.style.display = 'none';
                    this.els.menu.style.opacity = '1';
                    this.els.menu.style.transition = '';
                    this.mapIntro.show();
                }, 500);
            } else {
                this._setMode('VIEW');
            }
        });

        const btnEd = document.getElementById('btn-editor');
        if (btnEd) bindButton(btnEd, () => this._setMode('EDIT'));

        const btnEdExit = document.getElementById('btn-ed-exit');
        if (btnEdExit) bindButton(btnEdExit, () => this._setMode('VIEW'));

        if (this.els.btnSetCam) {
            bindButton(this.els.btnSetCam, () => {
                const az = this.controlsManager.getAzimuthalAngle();
                const pol = this.controlsManager.getPolarAngle();
                if (!this.state.scenarioData) this.state.scenarioData = {};
                if (!this.state.scenarioData.settings) this.state.scenarioData.settings = {};
                this.state.scenarioData.settings.startCam = { az, pol };
                this._msg('📸 Position caméra initiale enregistrée (Exportez pour confirmer) !', 3000);
            });
        }

        // Language Selectors
        document.querySelectorAll('.c-lang-btn').forEach(btn => {
            bindButton(btn, () => {
                document.querySelectorAll('.c-lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.lang = btn.dataset.lang;
                this._updateAllPoiTexts();
            });
        });

        // Volumes Sliders
        if (this.els.vmusic) {
            this.els.vmusic.oninput = (e) => {
                this.state.v_music = parseFloat(e.target.value);
                const lbl = document.getElementById('lbl-music');
                if (lbl) lbl.innerText = Math.round(this.state.v_music * 100) + '%';
                tracaAudio.setVolume('music', this.state.v_music);
            };
        }
        if (this.els.vvoice) {
            this.els.vvoice.oninput = (e) => {
                this.state.v_voice = parseFloat(e.target.value);
                const lbl = document.getElementById('lbl-voice');
                if (lbl) lbl.innerText = Math.round(this.state.v_voice * 100) + '%';
                tracaAudio.setVolume('narration', this.state.v_voice);
            };
        }
        if (this.els.vamb) {
            this.els.vamb.oninput = (e) => {
                this.state.v_amb = parseFloat(e.target.value);
                const lbl = document.getElementById('lbl-ambience');
                if (lbl) lbl.innerText = Math.round(this.state.v_amb * 100) + '%';
                tracaAudio.setVolume('ambience', this.state.v_amb);
            };
        }

        // HUD control buttons
        const btnMute = document.getElementById('btn-hud-mute');
        if (btnMute) {
            bindButton(btnMute, () => {
                const isMusicMuted = tracaAudio.toggleMusicOnly();
                const iconOn = btnMute.querySelector('.icon-vol-on');
                const iconOff = btnMute.querySelector('.icon-vol-off');
                if (isMusicMuted) {
                    btnMute.classList.add('is-muted');
                    if (iconOn) iconOn.style.display = 'none';
                    if (iconOff) iconOff.style.display = '';
                } else {
                    btnMute.classList.remove('is-muted');
                    if (iconOn) iconOn.style.display = '';
                    if (iconOff) iconOff.style.display = 'none';
                }
            });
        }

        const btnAudioDebug = document.getElementById('btn-hud-audiodebug');
        if (btnAudioDebug) {
            bindButton(btnAudioDebug, () => {
                if (this.sceneAudioDirector) {
                    this.sceneAudioDirector.toggleDebug();
                }
            });
        }
        
        if (this.els.btnStop) {
            bindButton(this.els.btnStop, () => this._stopVoice());
        }

        const btnDebugCoords = document.getElementById('btn-hud-debug-coords');
        if (btnDebugCoords) {
            bindButton(btnDebugCoords, () => this._toggleDebugCoords());
        }

        // Keyboard navigation for debugging coordinates
        window.addEventListener('keydown', (e) => {
            if (!this.state.debugMode) return;
            const arrows = this.navigator.getArrowMeshes();
            if (!arrows || arrows.length === 0) return;
            
            let activeMesh = arrows[0];
            if (this._lastClickedMesh && arrows.includes(this._lastClickedMesh)) {
                activeMesh = this._lastClickedMesh;
            }
            
            let angle = activeMesh.rotation.z;
            const step = 0.05;
            
            if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'a' || e.key === 'A' || e.key === 'Q') {
                angle -= step;
                e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'e' || e.key === 'E' || e.key === 'D') {
                angle += step;
                e.preventDefault();
            } else {
                return;
            }
            
            activeMesh.rotation.set(-Math.PI / 2, 0, angle);
            
            const overlay = document.getElementById('debug-coords-overlay');
            if (overlay) {
                const targetNode = activeMesh.userData.targetNode;
                const pos = activeMesh.position;
                overlay.innerHTML = `Coords pour [${this.state.currentNodeId} -> ${targetNode}] :<br>` +
                                    `X: ${pos.x.toFixed(2)}<br>` +
                                    `Y: ${pos.y.toFixed(2)}<br>` +
                                    `Z: ${pos.z.toFixed(2)}<br>` +
                                    `Rotation: [ -1.57, 0, ${angle.toFixed(2)} ]<br>` +
                                    `<span style="color:#4ade80; font-size:0.75rem; font-weight:bold;">← / → ou A / E pour pivoter</span>`;
            }
        });

        // Smart Zoom
        this._initSmartZoom();
    }

    _initSmartZoom() {
        this._zoomActive = false;
        this._lastTap = 0;
        const canvas = this.renderer.domElement;

        const doZoom = (clientX, clientY) => {
            if (this.state.mode !== 'VIEW') return;
            
            const targetZoomFov = this.baseFov * 0.85;
            const rect = canvas.getBoundingClientRect();
            const mx = ((clientX - rect.left) / rect.width) * 2 - 1;
            const my = -((clientY - rect.top) / rect.height) * 2 + 1;
            const tmpMouse = new THREE.Vector2(mx, my);
            this.raycaster.setFromCamera(tmpMouse, this.camera);
            const hits = this.raycaster.intersectObject(this.sphereDay || this.sphereNight);
            if (!hits.length) return;

            const ptOpposite = hits[0].point.clone().negate().normalize();
            const targetSpherical = new THREE.Spherical().setFromVector3(ptOpposite);
            this.controlsManager.setTarget(0, 0, 0);

            const startAz = this.controlsManager.getAzimuthalAngle();
            const startPol = this.controlsManager.getPolarAngle();
            const endAz = targetSpherical.theta;
            const endPol = targetSpherical.phi;
            let t = 0;
            if (this._zoomLerpId) cancelAnimationFrame(this._zoomLerpId);

            const lerp = () => {
                t = Math.min(t + 0.06, 1);
                const ease = 1 - Math.pow(1 - t, 3);
                const az = startAz + (endAz - startAz) * ease;
                const pol = Math.max(Math.PI * 0.25, Math.min(Math.PI * 0.75, startPol + (endPol - startPol) * ease));
                this.camera.position.setFromSphericalCoords(0.1, pol, az);
                this.controlsManager.orbit.update();

                this.camera.fov = this.camera.fov + (targetZoomFov - this.camera.fov) * ease;
                this.camera.updateProjectionMatrix();
                if (t < 1) this._zoomLerpId = requestAnimationFrame(lerp);
            };
            lerp();
            this._zoomActive = true;
        };

        canvas.addEventListener('dblclick', (e) => {
            if (this._zoomActive) { this._zoomActive = false; return; }
            doZoom(e.clientX, e.clientY);
        });

        canvas.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - this._lastTap < 300 && e.changedTouches.length === 1) {
                if (this._zoomActive) { this._zoomActive = false; return; }
                doZoom(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
            this._lastTap = now;
        });

        this.controlsManager.orbit.addEventListener('start', () => {
            if (this._zoomActive) this._zoomActive = false;
        });
    }

    async _loadEnvironment() {
        this._setProg(0);

        // -- Wait for Service Worker Preload --
        await new Promise((resolve) => {
            const checkProgress = (state) => {
                if (state.total > 0) {
                    const percent = (state.loaded / state.total) * 100;
                    this._setProg(Math.round(percent));
                }
                
                if (state.isComplete) {
                    swManager.removeListener(checkProgress);
                    this._setProg(100);
                    resolve();
                }
            };
            
            swManager.addListener(checkProgress);
            
            // Fallback s'il y a un souci avec le SW
            setTimeout(() => {
                console.warn('[Traca] SW Preload Timeout — forcing progression.');
                swManager.removeListener(checkProgress);
                this._setProg(100);
                resolve();
            }, 10000); // Temps max toléré si offline
        });

        // ── Load textures via THREE.TextureLoader ──
        const loadTex = (url) => new Promise((resolve) => {
            const loader = new THREE.TextureLoader();
            loader.load(url, resolve, undefined, () => resolve(new THREE.Texture()));
        });

        try {
            // Puisque le SW a tout préchargé, ceci est quasi instantané depuis le cache
            const [texDay, texNight] = await Promise.all([
                loadTex('../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/background/01_bg.png'),
                loadTex('../../assets/levels/level_01_casbah/scenes/02_rez_de_chaussee_nuit/background/02_bg.png')
            ]);

            texDay.colorSpace   = THREE.SRGBColorSpace;
            texNight.colorSpace = THREE.SRGBColorSpace;
            texDay.needsUpdate = true;
            texNight.needsUpdate = true;

            const geo = new THREE.SphereGeometry(500, 60, 40);
            geo.scale(-1, 1, 1);

            const matDay = new THREE.MeshBasicMaterial({ map: texDay, side: THREE.FrontSide });
            this.sphereDay = new THREE.Mesh(geo, matDay);
            this.scene.add(this.sphereDay);

            const matNight = new THREE.MeshBasicMaterial({ map: texNight, side: THREE.FrontSide, transparent: true, opacity: 0 });
            this.sphereNight = new THREE.Mesh(geo, matNight);
            this.scene.add(this.sphereNight);

            this.timeTravel.sphereDay = this.sphereDay;
            this.timeTravel.sphereNight = this.sphereNight;
            this.navigator.sphereDay = this.sphereDay;
            this.navigator.sphereNight = this.sphereNight;

            // Décodage natif WebAudio pour les musiques d'ambiance (0 latence)
            await tracaAudio.preloadCoreAudio();

            setTimeout(() => this._onLoadComplete(), 400);

        } catch (err) {
            console.error('[Traca] Critical load error:', err);
            this._setProg(100);
            setTimeout(() => this._onLoadComplete(), 400);
        }
    }

    // _loadTextureWithProgress removed — replaced by THREE.TextureLoader in _loadEnvironment

    _setProg(v) {
        this.els.bar.style.width = v + '%';
        this.els.pct.innerText = Math.round(v) + '%';
    }

    async _onLoadComplete() {
        await this._loadSavedPois();
        this.navigator.rebuildArrows();
        this._updateQuestUI();

        const label = document.getElementById('c-loader-label');
        const enterBtn = document.getElementById('c-loader-enter');
        if (label) label.innerText = 'Prêt — Bienvenue !';
        this._setProg(100);

        if (enterBtn) {
            enterBtn.style.display = 'inline-block';
            enterBtn.style.opacity = '1';
            enterBtn.style.pointerEvents = 'auto';
            enterBtn.style.filter = 'none';
            enterBtn.style.cursor = 'pointer';

            enterBtn.addEventListener('click', () => {
                this.state.audioUnlocked = true;
                Analytics.trackExperienceEntry('casbah');
                tracaAudio.unlockAudioContext();
                tracaAudio.restoreFromPrefs();
                tracaAudio.setVolume('music', this.state.v_music);
                tracaAudio.setVolume('ambience', this.state.v_amb);

                const loader = document.getElementById('c-loader');
                loader.style.transition = 'opacity 0.8s';
                loader.style.opacity = '0';
                setTimeout(() => { loader.style.display = 'none'; }, 850);

                this._setMode('VIEW');
                this._animate();
            }, { once: true });

            enterBtn.addEventListener('mouseenter', () => enterBtn.style.transform = 'scale(1.05)');
            enterBtn.addEventListener('mouseleave', () => enterBtn.style.transform = 'scale(1)');
        } else {
            const loader = document.getElementById('c-loader');
            loader.style.transition = 'opacity 0.8s';
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 850);
            
            this._setMode('VIEW');
            this._animate();
        }
    }

    _setMode(mode) {
        this.state.mode = mode;
        this._closeAllPopups();

        if (this.els.inventoryBar) {
            this.els.inventoryBar.style.display = (mode === 'VIEW') ? 'flex' : 'none';
        }

        if (this.els.inventoryModal && mode !== 'VIEW') {
            this.els.inventoryModal.style.display = 'none';
        }

        if (mode === 'VIEW') {
            this.els.editor.style.display = 'none';

            this.els.webglWrap.style.transition = 'opacity 1s';
            this.els.cssWrap.style.transition = 'opacity 1s';
            this.els.webglWrap.style.opacity = '1';
            this.els.cssWrap.style.opacity = '1';

            const startCam = this.state.scenarioData?.settings?.startCam;
            if (startCam?.az !== undefined && startCam?.pol !== undefined) {
                this.controlsManager.setAngles(startCam.az, startCam.pol);
            }

            // ─── CRITIQUE: play() DOIT être synchrone avec le geste utilisateur ───
            // setTimeout() > 0 casse la chaîne d'activation et le navigateur bloque
            const music = this.state.isNight ? 'casbah_night_music_01.mp3' : 'casbah_day_music_01.mp3';
            tracaAudio.playMusic(music, 3);
            this.sceneAudioDirector.onNodeEnter(this.state.currentNodeId, this.state.isNight, 3);

            setTimeout(() => {
                this.els.hud.style.display = 'flex';
                this.controlsManager.orbit.autoRotate = true;

                const ttBtn = document.getElementById('btn-time-travel');
                if (ttBtn) { ttBtn.classList.remove('is-night'); ttBtn.classList.add('is-day'); }

                this._poiInteraction(true);

                // ─── Lancer le tutoriel onboarding (une seule fois) ───
                if (!this.state.onboarding.firstInteractDetected) {
                    this.state.onboarding.firstInteractDetected = true;
                    this.tutorial?.onExperienceStart();
                }

                // ─── Tutorial step 1 : flèches de navigation ─────────────
                this.tutorial?.onArrowsShown();
            }, 500);

        } else if (mode === 'EDIT') {
            this.els.hud.style.display = 'none';
            this.els.editor.style.display = 'flex';
            this.els.editor.removeAttribute('hidden');

            this.els.webglWrap.style.opacity = '1';
            this.els.cssWrap.style.opacity = '1';
            this.controlsManager.orbit.autoRotate = false;

            tracaAudio.setVolume('music', this.state.v_music * 0.4);
            tracaAudio.setVolume('ambience', this.state.v_amb * 0.4);

            this._poiInteraction(false);
            this.editor.renderEditorList();
            this.editor.resetEdForm();
            this.els.fCol.style.display = 'none';
            this.editor.populateAudioDropdown();
            this._updatePoiVisibility();
        }
    }

    _switchScreen(scr) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        scr.classList.add('active');
    }

    _onCanvasClick(e) {
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = - ((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.state.mode === 'VIEW') {
            if (this.state.debugMode) {
                const hits = this.raycaster.intersectObject(this.sphereDay || this.sphereNight);
                if (hits.length > 0) {
                    const pt = hits[0].point;
                    const overlay = document.getElementById('debug-coords-overlay');
                    const arrows = this.navigator.getArrowMeshes();
                    
                    if (arrows && arrows.length > 0) {
                        // Trouver la flèche la plus proche
                        let closestMesh = arrows[0];
                        let minDist = pt.distanceTo(closestMesh.position);
                        for (let i = 1; i < arrows.length; i++) {
                            const dist = pt.distanceTo(arrows[i].position);
                            if (dist < minDist) {
                                minDist = dist;
                                closestMesh = arrows[i];
                            }
                        }
                        
                        // Placer la flèche à la position tapée (clamped)
                        const clampedPt = pt.clone();
                        if (clampedPt.length() > 400) clampedPt.setLength(400);
                        closestMesh.position.copy(clampedPt);
                        this._lastClickedMesh = closestMesh;
                        
                        const targetNode = closestMesh.userData.targetNode;
                        const angle = closestMesh.rotation.z;
                        if (overlay) {
                            overlay.innerHTML = [
                                `🎯 ${this.state.currentNodeId} → ${targetNode}`,
                                `X: ${pt.x.toFixed(0)} | Y: ${pt.y.toFixed(0)} | Z: ${pt.z.toFixed(0)}`,
                                `Rot Z: ${angle.toFixed(2)}`,
                                `<span style="font-size:0.75rem;color:#4ade80">←/→ clavier pour pivoter</span>`
                            ].join('<br>');
                        }
                    } else if (overlay) {
                        overlay.innerHTML = `📍 X:${pt.x.toFixed(0)} Y:${pt.y.toFixed(0)} Z:${pt.z.toFixed(0)}<br><span style="font-size:0.75rem">Aucune flèche dans ce node</span>`;
                    }
                }
                return;
            }

            const arrows = this.navigator.getArrowMeshes();
            if (arrows && arrows.length > 0) {
                // true = traverseChildren pour inclure la hitbox mobile invisible
                const hits = this.raycaster.intersectObjects(arrows, true);
                if (hits.length > 0) {
                    // Chercher le targetNode dans l'objet hit ou son parent
                    const hitObj = hits[0].object;
                    const targetNode = hitObj.userData.targetNode || hitObj.parent?.userData.targetNode;
                    if (!targetNode) return;
                    if (targetNode === 'basement' && !this.state.foundArtifacts.has('key_matmoura')) {
                        tracaAudio.playSFX('ui/error.mp3');
                        if (tracaAudio.channels?.sfx) tracaAudio.channels.sfx.volume = 1.0;
                        this._showLockedDoor();
                        
                        // Visual feedback on the arrow
                        const mesh = hitObj.isArrow ? hitObj : hitObj.parent;
                        if (mesh && mesh.material) {
                            mesh.material.color.setHex(0xff5555);
                            setTimeout(() => {
                                if (mesh.material) mesh.material.color.setHex(0xffffff);
                            }, 400);
                        }
                        return;
                    }
                    tracaAudio.playSFX('ui/enter.mp3');
                    if (tracaAudio.channels?.sfx) tracaAudio.channels.sfx.volume = 1.0;
                    this.tutorial?.onArrowUsed();
                    this.navigator.loadNode(targetNode);
                    return;
                }
            }

            const somethingWasOpen = !!this.state.playingVoicePoi;
            this._stopVoice();
            this._closeAllPopups();
            this._updatePoiVisibility();
            this.controlsManager.orbit.autoRotate = !somethingWasOpen;
            return;
        }

        if (this.state.mode !== 'EDIT') return;

        if (this.state.isPlacingPoi || this.state.isPlacingAudio) {
            const hits = this.raycaster.intersectObject(this.sphereDay || this.sphereNight);

            if (hits.length > 0) {
                const pt = hits[0].point;
                if (!this._tempSphere) {
                    const g = new THREE.SphereGeometry(15, 16, 16);
                    const m = new THREE.MeshBasicMaterial({
                        color: this.state.isPlacingAudio ? 0x64b4ff : 0xff0000,
                        wireframe: true
                    });
                    this._tempSphere = new THREE.Mesh(g, m);
                    this.scene.add(this._tempSphere);
                } else {
                    this._tempSphere.material.color.setHex(this.state.isPlacingAudio ? 0x64b4ff : 0xff0000);
                }
                this._tempSphere.position.copy(pt);

                if (this.state.isPlacingPoi) {
                    this.els.fCol.style.display = 'block';
                    this.els.fCol.hidden = false;
                    document.getElementById('poi-temp-x').value = pt.x;
                    document.getElementById('poi-temp-y').value = pt.y;
                    document.getElementById('poi-temp-z').value = pt.z;

                    this.els.fHint.innerHTML = `📍 Coordonnées capturées : X:${pt.x.toFixed(1)} Y:${pt.y.toFixed(1)} Z: ${pt.z.toFixed(1)}`;
                    this.els.fHint.style.color = '#fff';
                    this.els.fHint.style.background = 'var(--c-gold)';

                    this.state.isPlacingPoi = false;

                    const id = this.els.fId.value;
                    if (id) {
                        const poi = this.state.pois.find(p => p.id === id);
                        if (poi && poi._cssObj) {
                            poi.position = { x: pt.x, y: pt.y, z: pt.z };
                            poi._cssObj.position.set(pt.x, pt.y, pt.z);
                        }
                    }
                } else if (this.state.isPlacingAudio) {
                    const audioForm = document.getElementById('ced-audio-form');
                    audioForm.hidden = false;
                    document.getElementById('audionode-temp-x').value = pt.x;
                    document.getElementById('audionode-temp-y').value = pt.y;
                    document.getElementById('audionode-temp-z').value = pt.z;

                    document.getElementById('ced-audio-hint').innerHTML = `📍 Son virtuel placé. Choisissez le fichier.`;

                    const id = document.getElementById('audionode-edit-id').value;
                    if (id) {
                        const an = this.state.audioNodes.find(a => a.id === id);
                        if (an && window._audioNodeCSSObjects && window._audioNodeCSSObjects[id]) {
                            an.position = { x: pt.x, y: pt.y, z: pt.z };
                            window._audioNodeCSSObjects[id].position.set(pt.x, pt.y, pt.z);
                        }
                    }

                    this.editor.updateRealtimePreview('position', { x: pt.x, y: pt.y, z: pt.z });
                    this.state.isPlacingAudio = false;
                }
            }
        }
    }

    _msg(txt, isErr = false) {
        if (this.els.edStatus) {
            this.els.edStatus.style.color = isErr ? 'var(--c-danger)' : '#4ade80';
            this.els.edStatus.innerText = txt;
            setTimeout(() => { if (this.els.edStatus) this.els.edStatus.innerText = ''; }, 3500);
        } else if (this.inventory && this.inventory.showToast) {
            this.inventory.showToast(txt);
        } else {
            console.log(isErr ? '[Traca Error]' : '[Traca Info]', txt);
        }
    }

    _buildHtmlAudioNode(data) {
        const dot = document.createElement('div');
        dot.className = 'c-audio-node';
        dot.onclick = (e) => {
            e.stopPropagation();
            if (this.state.mode === 'EDIT') this.editor.loadAudioNodeToForm(data);
        };
        const csso = new CSS2DObject(dot);
        csso.position.set(data.position.x, data.position.y, data.position.z);
        csso.element.style.display = 'none';
        this.scene.add(csso);
        if (!window._audioNodeCSSObjects) window._audioNodeCSSObjects = {};
        window._audioNodeCSSObjects[data.id] = csso;
    }

    _buildHtmlPoi(data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'poi-wrapper';

        const dot = document.createElement('div');
        dot.className = 'poi-marker';
        if (data.poiType === 'character') dot.classList.add('type-character');
        else dot.classList.add('type-object');

        wrapper.appendChild(dot);

        const pop = document.createElement('div');
        pop.className = 'poi-popup';

        const head = document.createElement('div');
        head.className = 'poi-pop-head';

        const tit = document.createElement('h4');
        tit.className = 'poi-pop-title';

        const btnCls = document.createElement('button');
        btnCls.className = 'poi-pop-close';
        btnCls.setAttribute('aria-label', 'Fermer');
        btnCls.innerHTML = '✕';

        const desc = document.createElement('p');
        desc.className = 'poi-pop-desc';

        const caption = document.createElement('div');
        caption.className = 'poi-pop-caption';

        const audUI = document.createElement('div');
        audUI.className = 'poi-pop-audio';
        audUI.innerHTML = `<div class="eq-bars"><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div></div><span class="aud-ui-text">Lecture vocale...</span>`;
        audUI.style.display = 'none';

        head.appendChild(tit);
        head.appendChild(btnCls);
        pop.appendChild(head);
        pop.appendChild(desc);
        pop.appendChild(caption);
        pop.appendChild(audUI);
        wrapper.appendChild(pop);

        dot.onclick = (e) => {
            e.stopPropagation();

            // Intercept navigation POIs mapped to HTML elements
            if (data.poiType === 'navigation' && data.targetNode) {
                if (data.targetNode === 'basement' && !this.state.foundArtifacts.has('key_matmoura')) {
                    tracaAudio.playSFX('ui/error.mp3');
                    if (tracaAudio.channels?.sfx) tracaAudio.channels.sfx.volume = 1.0;
                    this._showLockedDoor();
                    dot.classList.add('shake-error');
                    setTimeout(() => dot.classList.remove('shake-error'), 500);
                    return;
                }
                tracaAudio.playSFX('ui/enter.mp3');
                if (tracaAudio.channels?.sfx) tracaAudio.channels.sfx.volume = 1.0;
                this.navigator.loadNode(data.targetNode);
                return;
            }

            tracaAudio.playSFX('ui/click.mp3');

            if (this.state.mode === 'EDIT') {
                this.editor.loadPoiToForm(data);
            } else {
                const poiTitle = data.content?.fr?.title || data.id;
                Analytics.trackPOIClick(data.id, poiTitle, data.poiType || 'object');

                this._stopVoice();
                this._closeAllPopups();

                let currentAudio = data.audio;
                let currentDesc = data.content?.fr?.description || '';
                let currentTrans = data.content?.fr?.transcript || '';
                
                let repIndexToMark = null;

                if (data.poiType === 'character' && data.replicas && data.replicas.length > 0) {
                    if (data._replicaIndex === undefined) data._replicaIndex = 0;
                    if (!data._seenReplicas) data._seenReplicas = new Set();
                    
                    repIndexToMark = data._replicaIndex;

                    const rep = data.replicas[data._replicaIndex];
                    currentAudio = rep.audio || '';
                    currentTrans = rep.transcript || '';
                    currentDesc = rep.description || '';

                    data._replicaIndex++;
                    if (data._replicaIndex >= data.replicas.length) data._replicaIndex = 0;
                } else {
                    if (data.replicas && data.replicas.length > 0 && !data.audio) {
                        const rep = data.replicas[0];
                        currentAudio = rep.audio || currentAudio;
                        data.audio = currentAudio;
                        currentTrans = rep.transcript || currentTrans;
                        if (!currentDesc) {
                            currentDesc = rep.description || currentTrans;
                        }
                    }
                }

                if (data._uiObj && data._uiObj.desc) {
                    data._uiObj.desc.innerText = currentDesc;
                }

                this.state.pois.forEach(p => {
                    if (p !== data && p._uiObj) {
                        p._uiObj.dot.style.opacity = '0';
                        p._uiObj.dot.style.pointerEvents = 'none';
                    }
                });

                pop.classList.add('visible');
                this.controlsManager.orbit.autoRotate = false;

                const markVisitedLogic = () => {
                    if (repIndexToMark !== null) {
                        data._seenReplicas.add(repIndexToMark);
                        if (data._seenReplicas.size >= data.replicas.length) {
                            this._markPoiVisited(data.id);
                        }
                    } else {
                        this._markPoiVisited(data.id);
                    }
                };

                if (currentAudio) {
                    this._playVoice(data, currentTrans, currentAudio, markVisitedLogic);
                } else {
                    this.state.playingVoicePoi = data;
                    if (this.fictiveTimeout) clearTimeout(this.fictiveTimeout);
                    this.fictiveTimeout = setTimeout(() => {
                        markVisitedLogic();
                        this.fictiveTimeout = null;
                        this._stopVoice();
                    }, 2000);
                }
            }
        };

        btnCls.onclick = (e) => {
            e.stopPropagation();
            pop.classList.remove('visible');
            this.controlsManager.orbit.autoRotate = true;
            this._stopVoice();

            if (!this.state.eagleVisionActive) {
                this.state.pois.forEach(p => {
                    if (p._uiObj && (!p.timeMode || p.timeMode === (this.state.isNight ? 'night' : 'day'))) {
                        p._uiObj.dot.style.opacity = '1';
                        p._uiObj.dot.style.pointerEvents = 'auto';
                    }
                });
            }
        };

        const csso = new CSS2DObject(wrapper);
        csso.position.set(data.position.x, data.position.y, data.position.z);
        this.scene.add(csso);

        data._uiObj = { dot, pop, tit, desc, audUI, caption };
        data._cssObj = csso;
    }

    _markPoiVisited(poiId) {
        if (!this.state.visitedPois) this.state.visitedPois = new Set();
        this.state.visitedPois.add(poiId);
        
        const poi = this.state.pois.find(p => p.id === poiId);
        if (poi && poi._uiObj && poi._uiObj.dot) {
            poi._uiObj.dot.classList.add('visited');
        }
        
        if (this.state.pois.length > 0 && this.state.visitedPois.size >= this.state.pois.length) {
            this._showScanNextButton();
        }
    }

    _showScanNextButton() {
        const btn = document.getElementById('btn-scan-next');
        if (btn && btn.style.display === 'none') {
            btn.style.display = 'flex';
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px)';
            setTimeout(() => {
                btn.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, 50);
            
            btn.onclick = () => {
                window.location.href = '../../index.html?scanner=true';
            };
        }
    }

    _playVoice(poi, explicitTrans = null, explicitAudio = null, onComplete = null) {
        this.state.playingVoicePoi = poi;
        if (poi._uiObj) {
            poi._uiObj.audUI.style.display = 'flex';
            const speakerName = (poi.content && poi.content.fr && poi.content.fr.title) ? poi.content.fr.title : "Inconnu";
            const audText = poi._uiObj.audUI.querySelector('.aud-ui-text');
            if (audText) {
                if (poi.poiType === 'character') {
                    audText.innerText = speakerName + " قالت";
                } else {
                    audText.innerText = "الراوي قال";
                }
            }
            if (poi._uiObj.caption) {
                poi._uiObj.caption.style.display = 'block';
                poi._uiObj.caption.textContent = '';
            }
        }
        if (this.els.btnStop) this.els.btnStop.style.display = 'inline-flex';

        const audioPath = explicitAudio !== null ? explicitAudio : poi.audio;
        const narCh = tracaAudio.channels.narration;
        
        if (this.preloadedAudios && this.preloadedAudios[audioPath]) {
            narCh.src = this.preloadedAudios[audioPath];
        } else {
            narCh.src = '/assets/audio/' + audioPath;
        }
        
        narCh.volume = tracaAudio.volumes.narration;
        narCh.play().catch(e => console.warn('Narration bloquée:', e));
        tracaAudio.currentNarration = audioPath;
        tracaAudio._duckMusic();

        const transText = explicitTrans !== null ? explicitTrans : (poi.content?.[this.state.lang]?.transcript || poi.content?.fr?.transcript || '');
        this._startCaption(poi, transText, narCh);

        narCh.onended = () => {
            if (onComplete) onComplete();
            this._stopVoice();
        };
    }

    _stopVoice() {
        if (this.fictiveTimeout) {
            clearTimeout(this.fictiveTimeout);
            this.fictiveTimeout = null;
        }
        if (!this.state.playingVoicePoi) return;

        const poi = this.state.playingVoicePoi;
        if (poi._uiObj) {
            poi._uiObj.audUI.style.display = 'none';
            if (poi._uiObj.caption) poi._uiObj.caption.style.display = 'none';
        }

        tracaAudio.stopNarration();
        if (this.els.btnStop) this.els.btnStop.style.display = 'none';
        this.state.playingVoicePoi = null;

        this._stopCaption();

        if (!this.state.eagleVisionActive) {
            const currentMode = this.state.isNight ? 'night' : 'day';
            this.state.pois.forEach(p => {
                if (p._uiObj && (p.timeMode || 'day') === currentMode) {
                    p._uiObj.dot.style.opacity = '1';
                    p._uiObj.dot.style.pointerEvents = 'auto';
                    p._uiObj.dot.style.display = 'block';
                }
            });
        }
    }

    _startCaption(poi, text, audioEl) {
        this._stopCaption();
        if (!poi._uiObj?.caption || !text) return;

        const caption = poi._uiObj.caption;
        const words = text.trim().split(/\s+/);
        if (!words.length) return;

        caption.innerHTML = '';
        caption.style.display = 'block';
        caption.style.opacity = '1';

        let wordIdx = 0;
        const baseMsPerWord = 350;

        const advanceWord = () => {
            if (wordIdx >= words.length || audioEl.ended) {
                this._stopCaption();
                return;
            }

            if (audioEl.paused) {
                this._captionTimer = setTimeout(advanceWord, 100);
                return;
            }

            const s = document.createElement('span');
            const word = words[wordIdx];
            s.textContent = word + ' ';

            s.style.transition = 'all 0.3s ease-out';
            s.style.opacity = '0';
            s.style.transform = 'translateY(5px)';
            
            caption.appendChild(s);

            requestAnimationFrame(() => {
                s.style.opacity = '1';
                s.style.transform = 'translateY(0)';
                s.style.color = '#e7ba80';
                
                setTimeout(() => {
                    if (s && s.parentNode) s.style.color = '#fff';
                }, 300);
            });

            const targetScroll = caption.scrollHeight;
            if (caption.scrollTop < targetScroll) {
                caption.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }

            let bonusDelay = 0;
            if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) bonusDelay = 400;
            else if (word.endsWith(',')) bonusDelay = 200;

            wordIdx++;
            this._captionTimer = setTimeout(advanceWord, baseMsPerWord + bonusDelay);
        };

        const startLoop = () => {
            tracaAudio.unlockAudioContext();
            advanceWord();
        };

        if (audioEl.readyState >= 1) {
            startLoop();
        } else {
            audioEl.addEventListener('loadedmetadata', startLoop, { once: true });
            setTimeout(() => { if (wordIdx === 0) startLoop(); }, 500);
        }
    }

    _stopCaption() {
        if (this._captionTimer) { clearTimeout(this._captionTimer); this._captionTimer = null; }
    }

    _closeAllPopups() {
        this.state.pois.forEach(p => {
            if (p._uiObj && p._uiObj.pop) {
                p._uiObj.pop.classList.remove('visible');
            }
        });
    }

    _updatePoiVisibility() {
        if (this.state.eagleVisionActive) {
            this.state.pois.forEach(p => {
                if (p._uiObj && p._uiObj.dot) {
                    p._uiObj.dot.style.display = 'none';
                    p._uiObj.dot.style.opacity = '0';
                    p._uiObj.dot.style.pointerEvents = 'none';
                    if (p._uiObj.pop) p._uiObj.pop.classList.remove('visible');
                }
            });
            return;
        }

        const curTime = this.state.isNight ? 'night' : 'day';
        this.state.pois.forEach(p => {
            if (p._uiObj && p._uiObj.dot) {
                const pTime = p.timeMode || 'day';
                if (pTime === curTime) {
                    p._uiObj.dot.style.display = 'block';
                    p._uiObj.dot.style.opacity = '1';
                    p._uiObj.dot.style.pointerEvents = 'auto';
                } else {
                    p._uiObj.dot.style.display = 'none';
                    p._uiObj.dot.style.opacity = '0';
                    p._uiObj.dot.style.pointerEvents = 'none';
                    if (p._uiObj.pop) p._uiObj.pop.classList.remove('visible');
                }
            }
        });
    }

    _updateAllPoiTexts() {
        this.state.pois.forEach(p => {
            if (!p._uiObj) return;
            const c = p.content[this.state.lang] || p.content.fr;
            p._uiObj.tit.innerText = c.title || '';
            p._uiObj.desc.innerText = c.description || '';

            if (this.state.lang === 'ar') {
                p._uiObj.pop.style.direction = 'rtl';
                p._uiObj.pop.style.textAlign = 'right';
            } else {
                p._uiObj.pop.style.direction = 'ltr';
                p._uiObj.pop.style.textAlign = 'left';
            }
        });
    }

    _poiInteraction(enable) {
        this.state.pois.forEach(p => {
            if (p._uiObj && p._cssObj.element) {
                if (enable && this.state.eagleVisionActive) {
                    p._cssObj.element.style.pointerEvents = 'none';
                } else {
                    p._cssObj.element.style.pointerEvents = enable ? 'auto' : 'none';
                }
            }
        });
    }

    _toggleDebugCoords() {
        this.state.debugMode = !this.state.debugMode;
        const btnDebug = document.getElementById('btn-hud-debug-coords');
        
        if (this.state.debugMode) {
            // Bouton actif
            if (btnDebug) {
                btnDebug.style.color = '#e7ba80';
                btnDebug.style.borderColor = '#e7ba80';
                btnDebug.style.background = 'rgba(231, 186, 128, 0.25)';
                btnDebug.style.boxShadow = '0 0 10px rgba(231,186,128,0.4)';
            }
            
            let overlay = document.getElementById('debug-coords-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'debug-coords-overlay';
                // Overlay optimisé pour mobile : grand, lisible, en bas
                overlay.style.cssText = [
                    'position:fixed',
                    'bottom:100px',
                    'left:50%',
                    'transform:translateX(-50%)',
                    'z-index:9999',
                    'background:rgba(0,0,0,0.9)',
                    'color:#e7ba80',
                    'padding:14px 18px',
                    'border:1px solid rgba(231,186,128,0.6)',
                    'font-family:monospace',
                    'font-size:0.9rem',
                    'border-radius:10px',
                    'pointer-events:none',
                    'text-align:center',
                    'line-height:1.8',
                    'max-width:90vw',
                    'backdrop-filter:blur(4px)'
                ].join(';');
                document.body.appendChild(overlay);
            }
            overlay.style.display = 'block';
            overlay.innerHTML = '📍 Tapez sur la scène pour placer une flèche';
        } else {
            // Bouton inactif
            if (btnDebug) {
                btnDebug.style.color = '';
                btnDebug.style.borderColor = '';
                btnDebug.style.background = '';
                btnDebug.style.boxShadow = '';
            }
            
            const overlay = document.getElementById('debug-coords-overlay');
            if (overlay) overlay.style.display = 'none';
            
            if (this.navigator) this.navigator.rebuildArrows();
        }
    }

    _toggleGyro() {
        if (!this.state.gyroMode) {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            this._enableGyro();
                        } else {
                            this._msg('🚫 Permission gyroscope refusée. Vérifiez les réglages iOS.', 4000);
                        }
                    })
                    .catch(err => {
                        console.warn('[Gyro] requestPermission error:', err);
                        this._enableGyro();
                    });
            } else {
                this._enableGyro();
            }
        } else {
            this._disableGyro();
        }
    }

    _enableGyro() {
        this.controlsManager.enableGyro();
        this.state.gyroMode = true;
        if (this.els.btnGyro) {
            this.els.btnGyro.classList.add('active');
        }
        this._msg('🔄 Gyroscope activé — bougez votre appareil', 2500);
    }

    _disableGyro() {
        this.controlsManager.disableGyro();
        this.state.gyroMode = false;
        if (this.els.btnGyro) {
            this.els.btnGyro.classList.remove('active');
        }
        this._msg('🔄 Gyroscope désactivé', 2500);
    }

    _closeRewardPopup() {
        const popup = this.els.rewardPopup;
        if (popup) {
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -50%) scale(0.85)';
            setTimeout(() => popup.style.display = 'none', 500);
        }
        this.state.targetFov = this.state.baseFov || 75;
    }

    async _loadSavedPois() {
        try {
            this._processLoadedData(CASBAH_SCENARIO);
            if (!this.state.scenarioData) this.state.scenarioData = {};
            if (!this.state.scenarioData.settings) this.state.scenarioData.settings = CASBAH_SCENARIO.settings || {};
            const numPois = CASBAH_SCENARIO.pois ? CASBAH_SCENARIO.pois.length : (CASBAH_SCENARIO.nodes && CASBAH_SCENARIO.nodes.patio ? CASBAH_SCENARIO.nodes.patio.pois.length : 0);
            console.info('[POI] Scénario Casbah chargé. ' + numPois + ' POI(s) prêts.');
        } catch (e) {
            console.error('[POI] Erreur critique lors du chargement du scénario Casbah !', e);
            if (!this.state.scenarioData) this.state.scenarioData = { chapters: [], audioNodes: [], settings: {} };
        }

        try {
            const saved = localStorage.getItem('traca_found_artifacts');
            this.state.foundArtifacts.clear();
            if (saved) {
                const list = JSON.parse(saved);
                for (const item of list) {
                    this.state.foundArtifacts.add(item);
                }
            }
        } catch (e) {
            this.state.foundArtifacts.clear();
        }
        this.inventory.updateUI();
    }

    async _saveRealTime() {
        try {
            // Sauvegarde de secours synchrone
            localStorage.setItem('traca_found_artifacts', JSON.stringify(Array.from(this.state.foundArtifacts)));
            
            // Sauvegarde robuste via IndexedDB
            const session = await localStore.getSession();
            if (session) {
                if (!session.progression.foundArtifacts) session.progression.foundArtifacts = [];
                session.progression.foundArtifacts = Array.from(this.state.foundArtifacts);
                
                if (!session.progression.unlockedNodes) session.progression.unlockedNodes = [];
                if (!session.progression.unlockedNodes.includes(this.state.currentNodeId)) {
                    session.progression.unlockedNodes.push(this.state.currentNodeId);
                }
                await localStore.saveSession(session);
            }
        } catch(e) {
            console.warn('[DB Local] Échec sauvegarde temps réel', e);
        }
    }

    _onArtifactFound(artId) {
        this._updateQuestUI();
        this._saveRealTime(); // Phase 5 : Sauvegarde Event-Driven

        // Trouver le Journal valide automatiquement le tutoriel Eagle Vision
        if (artId === 'journal' && !this.state.onboarding.eagleTutorialCompleted) {
            this._completeEagleOnboarding();
        }
    }

    _updateQuestUI() {
        // Désactivé pour éviter de spoil le joueur
        this._saveRealTime(); // Phase 5 : Sauvegarde Event-Driven
    }

    _showLockedDoor() {
        // Remove existing if any
        const existing = document.getElementById('traca-locked-door-notif');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = 'traca-locked-door-notif';
        el.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.85);
            z-index: 10000;
            background: linear-gradient(160deg, rgba(18,8,0,0.97) 0%, rgba(28,14,4,0.97) 100%);
            border: 1px solid rgba(231,186,128,0.4);
            border-radius: 16px;
            padding: 28px 32px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(231,186,128,0.08);
            backdrop-filter: blur(12px);
            max-width: 320px;
            width: calc(100% - 48px);
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: auto;
            font-family: 'Cinzel', serif;
        `;
        el.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 12px; filter: drop-shadow(0 0 12px rgba(231,120,60,0.6));">🔒</div>
            <div style="color: #e7ba80; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">Porte Verrouillée</div>
            <div style="color: rgba(255,255,255,0.85); font-size: 0.88rem; line-height: 1.6; font-family: 'Lora', serif; margin-bottom: 18px;">
                Cette porte mène à la Matmoura.<br>Elle est fermée à clé.<br><em style="color:#e7ba80;">Il me faut la Clé de la Matmoura.</em>
            </div>
            <button id="traca-locked-ok" style="
                border: 1px solid rgba(231,186,128,0.4);
                background: rgba(231,186,128,0.12);
                color: #e7ba80;
                padding: 8px 24px;
                border-radius: 30px;
                font-family: 'Cinzel', serif;
                font-size: 0.7rem;
                letter-spacing: 1.5px;
                cursor: pointer;
                transition: all 0.2s;
            ">Compris</button>
        `;
        document.body.appendChild(el);

        // Animate in
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        const close = () => {
            el.style.opacity = '0';
            el.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => el.remove(), 300);
        };

        document.getElementById('traca-locked-ok')?.addEventListener('click', close);
        // Auto-close after 4s
        setTimeout(close, 4000);
    }

    _showJournalReader() {
        // Remove existing if any
        const existing = document.getElementById('traca-journal-reader');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = 'traca-journal-reader';
        el.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: auto;
            backdrop-filter: blur(8px);
        `;

        el.innerHTML = `
            <div style="
                position: relative;
                width: 90vw;
                max-width: 800px;
                max-height: 90vh;
                background: url('../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/artefact/journal intime ouvert.png') center/contain no-repeat;
                aspect-ratio: 16/9;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                transform: scale(0.95) translateY(20px);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            " id="journal-inner-container">
                <button id="traca-journal-close" style="
                    position: absolute;
                    top: -40px;
                    right: 0;
                    background: none;
                    border: none;
                    color: rgba(231,186,128,0.9);
                    font-size: 2rem;
                    cursor: pointer;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
                    transition: color 0.2s, transform 0.2s;
                ">&times;</button>
                <div style="
                    width: 70%;
                    height: 60%;
                    margin-top: 5%;
                    padding: 20px;
                    color: #2b1f14;
                    font-family: 'Lora', serif;
                    font-size: clamp(0.9rem, 1.5vw, 1.1rem);
                    line-height: 1.6;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(43,31,20,0.3) transparent;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.2);
                ">
                    <p style="font-style: italic; text-align: center; margin-bottom: 1.5em; border-bottom: 1px solid rgba(43,31,20,0.2); padding-bottom: 10px;">
                        « Le secret de la Matmoura »
                    </p>
                    <p style="text-indent: 1.5em; text-align: justify; margin-bottom: 1em;">
                        Les ombres s'allongent sur le patio. Aujourd'hui encore, la clé m'échappe. 
                        J'ai entendu des bruits étranges sous la chambre mauresque, comme si les murs mêmes respiraient.
                        La Matmoura n'est pas seulement un cellier... elle cache quelque chose d'ancien.
                    </p>
                    <p style="text-indent: 1.5em; text-align: justify;">
                        Si jamais je venais à oublier, la clé repose toujours là où la lumière du soleil couchant ne l'atteint jamais.
                        Puissent ceux qui lisent ces lignes comprendre l'importance de ce lieu.
                    </p>
                </div>
            </div>
        `;
        document.body.appendChild(el);

        // Sound effect
        tracaAudio.playSFX('ui/click.mp3'); // Optionally change to a paper rustling sound if you have one

        // Animate in
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            document.getElementById('journal-inner-container').style.transform = 'scale(1) translateY(0)';
        });

        const close = () => {
            el.style.opacity = '0';
            document.getElementById('journal-inner-container').style.transform = 'scale(0.95) translateY(20px)';
            tracaAudio.playSFX('ui/click.mp3');
            setTimeout(() => el.remove(), 400);
        };

        document.getElementById('traca-journal-close')?.addEventListener('click', close);
        el.addEventListener('click', (e) => {
            if (e.target === el) close();
        });
    }

    _processLoadedData(data) {
        // Clear existing POI meshes from the scene
        if (this.state.pois && Array.isArray(this.state.pois)) {
            this.state.pois.forEach(p => {
                if (p._cssObj) {
                    this.scene.remove(p._cssObj);
                }
            });
        }
        // Clear existing AudioNode meshes from the scene
        if (this.state.audioNodes && Array.isArray(this.state.audioNodes)) {
            this.state.audioNodes.forEach(a => {
                if (window._audioNodeCSSObjects && window._audioNodeCSSObjects[a.id]) {
                    this.scene.remove(window._audioNodeCSSObjects[a.id]);
                    delete window._audioNodeCSSObjects[a.id];
                }
            });
        }

        this.state.scenarioData = data;
        let pArray = [];

        if (data.pois && Array.isArray(data.pois)) {
            data.pois.forEach(p => {
                if (p.poiType !== 'navigation') pArray.push(p);
            });
        } else if (data.nodes && data.nodes.patio && Array.isArray(data.nodes.patio.pois)) {
            data.nodes.patio.pois.forEach(p => {
                if (p.poiType !== 'navigation') pArray.push(p);
            });
        }

        if (data.day && Array.isArray(data.day.points)) {
            data.day.points.forEach(p => {
                if (p.poiType !== 'navigation') { p.timeMode = 'day'; pArray.push(p); }
            });
        }
        if (data.night && Array.isArray(data.night.points)) {
            data.night.points.forEach(p => {
                if (p.poiType !== 'navigation') { p.timeMode = 'night'; pArray.push(p); }
            });
        }

        if (data.chapters && Array.isArray(data.chapters)) {
            data.chapters.forEach(p => {
                if (p.poiType !== 'navigation') { p.timeMode = 'day'; pArray.push(p); }
            });
        }

        this.state.pois = pArray;
        this.state.pois.forEach(p => this._buildHtmlPoi(p));
        this._updateAllPoiTexts();
        this._updatePoiVisibility();

        if (data.audioNodes) {
            this.state.audioNodes = data.audioNodes;
            this.state.audioNodes.forEach(a => this._buildHtmlAudioNode(a));
        } else {
            this.state.audioNodes = [];
        }
    }

    async loadNode(nodeId) {
        return this.navigator.loadNode(nodeId);
    }

    // ═══ ONBOARDING TUTORIALS SYSTEM ═══
    _startGyroOnboardingTimer() {
        setTimeout(() => {
            if (this.state.mode === 'VIEW' && !this.state.gyroMode && !this.state.onboarding.gyroTutorialTriggered) {
                this._showGyroOnboarding();
            }
        }, 5000);
    }

    _showGyroOnboarding() {
        if (this.state.onboarding.gyroTutorialTriggered) return;
        this.state.onboarding.gyroTutorialTriggered = true;

        if (this.els.btnGyro) {
            this.els.btnGyro.classList.add('tutorial-highlight');
        }

        const panel = document.getElementById('c-tutorial-panel');
        const icon  = document.getElementById('c-tutorial-icon');
        const title = document.getElementById('c-tutorial-title');
        const text  = document.getElementById('c-tutorial-text');
        if (panel) {
            if (icon) icon.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e7ba80" stroke-width="1.8" stroke-linecap="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                    <path d="M12 2v2"/>
                </svg>`;
            if (title) title.textContent = 'Mode Gyroscope';
            if (text)  text.textContent  = 'Le bouton Gyroscope clignote en haut à droite. Appuie dessus pour explorer la Casbah en bougeant ton téléphone autour de toi.';
            panel.classList.add('active');
            panel.onclick = () => this._completeGyroOnboarding();
        }

        this._gyroTutoTimeout = setTimeout(() => {
            this._completeGyroOnboarding();
        }, 12000);
    }

    _completeGyroOnboarding() {
        if (this.state.onboarding.gyroTutorialCompleted) return;
        this.state.onboarding.gyroTutorialCompleted = true;
        localStorage.setItem('traca_tuto_gyro', '1');

        if (this.els.btnGyro) {
            this.els.btnGyro.classList.remove('tutorial-highlight');
        }

        if (this._gyroTutoTimeout) {
            clearTimeout(this._gyroTutoTimeout);
            this._gyroTutoTimeout = null;
        }

        this._hideOnboardingPanel();
        this._startEagleOnboardingTimer();
    }

    _startEagleOnboardingTimer() {
        setTimeout(() => {
            if (this.state.mode === 'VIEW' && !this.state.eagleVisionActive && !this.state.onboarding.eagleTutorialTriggered) {
                this._showEagleOnboarding();
            }
        }, 10000);
    }

    _showEagleOnboarding() {
        if (this.state.onboarding.eagleTutorialTriggered) return;
        this.state.onboarding.eagleTutorialTriggered = true;

        if (this.els.btnEagle) {
            this.els.btnEagle.classList.add('tutorial-highlight');
        }

        const panel = document.getElementById('c-tutorial-panel');
        const icon  = document.getElementById('c-tutorial-icon');
        const title = document.getElementById('c-tutorial-title');
        const text  = document.getElementById('c-tutorial-text');
        if (panel) {
            if (icon) icon.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e7ba80" stroke-width="1.8" stroke-linecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>`;
            if (title) title.textContent = "Vision d'Aigle";
            if (text)  text.textContent  = "Le bouton Vision d'Aigle clignote en bas à droite. C'est ton outil de recherche dans Traca Replay — il révèle objets cachés, artefacts et secrets narratifs entre personnages. N'hésite pas à l'utiliser si tu te sens bloqué.";
            panel.classList.add('active');
            panel.onclick = () => this._completeEagleOnboarding();
        }

        this._eagleTutoTimeout = setTimeout(() => {
            this._completeEagleOnboarding();
        }, 20000);
    }

    _completeEagleOnboarding() {
        if (this.state.onboarding.eagleTutorialCompleted) return;
        this.state.onboarding.eagleTutorialCompleted = true;
        localStorage.setItem('traca_tuto_eagle', '1');

        if (this.els.btnEagle) {
            this.els.btnEagle.classList.remove('tutorial-highlight');
        }

        if (this._eagleTutoTimeout) {
            clearTimeout(this._eagleTutoTimeout);
            this._eagleTutoTimeout = null;
        }

        this._hideOnboardingPanel();
    }

    _showHelpHint() {
        const panel = document.getElementById('c-tutorial-panel');
        const icon  = document.getElementById('c-tutorial-icon');
        const title = document.getElementById('c-tutorial-title');
        const text  = document.getElementById('c-tutorial-text');
        
        if (!panel) return;

        // Clean up tutorials in progress
        if (this._gyroTutoTimeout) clearTimeout(this._gyroTutoTimeout);
        if (this._eagleTutoTimeout) clearTimeout(this._eagleTutoTimeout);
        if (this.els.btnGyro) this.els.btnGyro.classList.remove('tutorial-highlight');
        if (this.els.btnEagle) this.els.btnEagle.classList.remove('tutorial-highlight');
        
        let hintTitle = "La Voix des Anciens";
        let hintText = "Voyageur, si l'espace te semble figé, active la Boussole Intérieure (en haut à droite). Elle te permettra d'explorer les murs de la Casbah en bougeant simplement ton esprit... ou ton appareil.";
        
        // Alternance de conseils / contextuel
        const rand = Math.random();
        if (rand > 0.5) {
            hintText = "Les djinns murmurent que des secrets invisibles se cachent dans l'ombre. Ouvre l'Œil du Fakir (en bas à droite). Cette Vision d'Aigle révèle les artefacts oubliés et les échos du passé. N'hésite pas à l'utiliser pour découvrir ta destinée et en récolter les trésors.";
        }

        if (icon) icon.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e7ba80" stroke-width="1.8" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`;
        if (title) title.textContent = hintTitle;
        if (text) text.textContent = hintText;

        panel.classList.add('active');
        
        panel.onclick = () => {
            panel.classList.remove('active');
            panel.onclick = null;
        };

        setTimeout(() => {
            if (panel.classList.contains('active')) panel.classList.remove('active');
        }, 15000);
    }

    _hideOnboardingPanel() {
        const panel = document.getElementById('c-tutorial-panel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    _animate() {
        requestAnimationFrame(this._animate.bind(this));

        // Gyro Onboarding completion check
        if (this.state.gyroMode && !this.state.onboarding.gyroTutorialCompleted) {
            this._completeGyroOnboarding();
        }

        // Eagle Vision Onboarding completion check
        if (this.state.eagleVisionActive && !this.state.onboarding.eagleTutorialCompleted) {
            this._completeEagleOnboarding();
        }

        // Update camera direction orientation controls
        if (this.controlsManager) {
            this.controlsManager.update();
        }

        // Update Eagle Vision organic effects and lock logic
        if (this.state.eagleVisionActive && this.eagleVision) {
            this.eagleVision.update();
        }

        // Update particles rotation
        if (this.particleManager) {
            this.particleManager.update();
        }

        // Update ground arrow pulse animations
        if (this.navigator) {
            this.navigator.animateArrows();
        }

        // Smart Zoom FOV restoration
        if (!this._zoomActive && this.state.targetFov === null && this.camera.fov !== this.baseFov) {
            this.camera.fov += (this.baseFov - this.camera.fov) * 0.05;
            if (Math.abs(this.camera.fov - this.baseFov) < 0.1) this.camera.fov = this.baseFov;
            this.camera.updateProjectionMatrix();
        }

        // Update Compass indicators
        if (this.compass && this.state.pois.length > 0 && this.state.mode === 'VIEW') {
            // Find next unvisited standard POI
            const nextPoi = this.state.pois.find(p => !this.state.visitedPois.has(p.id) && (p.timeMode || 'day') === (this.state.isNight ? 'night' : 'day'));
            if (nextPoi) {
                const wPos = new THREE.Vector3(nextPoi.position.x, nextPoi.position.y, nextPoi.position.z);
                this.compass.update(this.camera, wPos, this.state.eagleVisionActive);
            } else {
                this.compass.hide();
            }
        } else if (this.compass) {
            this.compass.hide();
        }

        if (this.sceneEngine) {
            this.sceneEngine.render();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new CasbahExperience();
    window.__casbahApp = app;
    window.app = app;
});
