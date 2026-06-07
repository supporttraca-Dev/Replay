import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { DeviceOrientationControls } from './DeviceOrientationControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';
import { MapIntro } from './MapIntro.js';
import { tracaAudio } from '../../src/js/core/TracaAudio.js';
import { Analytics } from '../../src/js/core/Analytics.js';

/* ══════════════════════════════════════════════════════════
   SCÉNARIO CASBAH — DONNÉES STATIQUES INTÉGRÉES EN DUR
   Source de vérité unique. Ne pas modifier manuellement.
   Pour mettre à jour : utiliser l'éditeur + Exporter JSON,
   puis coller le contenu de "pois" ci-dessous.
══════════════════════════════════════════════════════════ */
const CASBAH_SCENARIO = {
    settings: {
        startCam: { az: 1.5856460275171018, pol: 1.3762056082747058 }
    },
    pois: [
        {
            id: 'poi_ain_sebaa',
            position: { x: 75.11435879621929, y: -73.5111009784146, z: -487.98100573597793 },
            audio: 'narration/01_narration.mp3',
            poiType: 'object',
            timeMode: 'day',
            replicas: [],
            _replicaIndex: 0,
            content: {
                fr: {
                    title: '\u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639',
                    description: 'Cette porte de villa \u00e0 A\u00efn Seba\u00e2 est une pi\u00e8ce unique issue de l\'artisanat traditionnel. Fabriqu\u00e9e en bois robuste avec des d\u00e9tails en fer forg\u00e9, elle incarne l\'identit\u00e9 et l\'\u00e2me de la maison. Elle m\u00eale modernit\u00e9 et tradition, offrant intimit\u00e9 et annonc\u00e7ant une nouvelle histoire \u00e0 chaque visiteur.',
                    transcript: '\u0641\u064a \u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639\u060c \u0647\u0627\u062f \u0627\u0644\u0628\u0627\u0628 \u062f \u0627\u0644\u0641\u064a\u0644\u0651\u0627 \u0639\u0646\u062f\u0648 \u062d\u0643\u0627\u064a\u0629 \u062e\u0627\u0635\u0629 \u0628\u064a\u0647. \u062a\u0635\u0627\u0648\u0628 \u0628\u0627\u0644\u062d\u0631\u0641\u0629 \u0645\u0646 \u062e\u0634\u0628 \u0642\u0648\u064a \u0648\u0645\u0639\u0627\u0647 \u062a\u0641\u0627\u0635\u064a\u0644 \u0645\u0646 \u062d\u062f\u064a\u062f \u0645\u062e\u062f\u0648\u0645\u064a\u0646 \u0628\u0627\u0644\u062f\u0642\u0629\u060c \u0645\u0633\u062a\u0648\u062d\u064a \u0645\u0646 \u0627\u0644\u0635\u0646\u0627\u0639\u0629 \u0627\u0644\u062a\u0642\u0644\u064a\u062f\u064a\u0629.'
                },
                en: {
                    title: '\u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639',
                    description: 'Traditional handcrafted villa door combining wood and forged iron, representing identity, privacy and the beginning of a new story.',
                    transcript: ''
                },
                ar: {
                    title: '\u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639',
                    description: '',
                    transcript: '\u0641\u064a \u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639\u060c \u0647\u0627\u062f \u0627\u0644\u0628\u0627\u0628 \u062f \u0627\u0644\u0641\u064a\u0644\u0651\u0627 \u0639\u0646\u062f\u0648 \u062d\u0643\u0627\u064a\u0629 \u062e\u0627\u0635\u0629 \u0628\u064a\u0647...'
                }
            }
        },
        {
            id: 'poi_fawara',
            position: { x: -356.32605921840184, y: -350.3443533765454, z: 3.6971606671478394 },
            audio: 'narration/01_narration_fawara.mp3',
            poiType: 'object',
            timeMode: 'day',
            replicas: [],
            _replicaIndex: 0,
            content: {
                fr: {
                    title: '\u0641\u0648\u0627\u0631\u0629',
                    description: 'La fw\u0101ra est le c\u0153ur battant de la maison. Fontaine en marbre et zellige, elle apporte fra\u00eecheur et s\u00e9r\u00e9nit\u00e9. Son murmure apaise l\'esprit et rassemble la famille.',
                    transcript: '\u0648\u0633\u0637 \u0627\u0644\u062f\u0627\u0631\u060c \u0643\u0627\u064a\u0646 \u0642\u0644\u0628 \u064a\u0646\u0628\u0636 \u0628\u0627\u0644\u062d\u064a\u0627\u0629.. \u0647\u064a \u0627\u0644\u0641\u0648\u0627\u0631\u0629.\n\n\u0645\u062d\u0637\u0648\u0637\u0629 \u062a\u0645\u0627 \u0641\u064a \u0646\u0635 \u0627\u0644\u0628\u0627\u062a\u064a\u0648...'
                },
                en: {
                    title: '\u0641\u0648\u0627\u0631\u0629',
                    description: 'Central fountain bringing calm, freshness and family gathering.',
                    transcript: ''
                },
                ar: {
                    title: '\u0641\u0648\u0627\u0631\u0629',
                    description: '',
                    transcript: '\u0648\u0633\u0637 \u0627\u0644\u062f\u0627\u0631\u060c \u0643\u0627\u064a\u0646 \u0642\u0644\u0628 \u064a\u0646\u0628\u0636 \u0628\u0627\u0644\u062d\u064a\u0627\u0629.. \u0647\u064a \u0627\u0644\u0641\u0648\u0627\u0631\u0629.'
                }
            }
        },
        {
            id: 'poi_zahra',
            position: { x: -251.55933693635822, y: -264.9734933434627, z: -340.91325525149335 },
            audio: '',
            poiType: 'character',
            timeMode: 'night',
            replicas: [
                {
                    audio: 'expression/01_zahra_replique_01.mp3',
                    description: 'La porte par laquelle te vient le vent, bouche-la et tu te reposeras.\n\nCoupe la source du probl\u00e8me \u00e0 la racine pour retrouver la paix.',
                    transcript: '\u0627\u0644\u0628\u0627\u0628 \u0644\u064a \u064a\u062c\u064a\u0643 \u0645\u0646\u0648 \u0627\u0644\u0631\u064a\u062d \u0633\u062f\u0648 \u0648 \u0633\u062a\u0631\u064a\u062d'
                },
                {
                    audio: 'expression/01_zahra_replique_02.mp3',
                    description: 'Celui que la chance trahit dit : \"La sorcellerie m\'a trahi.\"\n\nCelui qui manque de chance accuse le mauvais \u0153il au lieu de se remettre en question.',
                    transcript: '\u0644\u064a \u062e\u0627\u0646\u0648 \u0627\u0644\u0632\u0647\u0631 \u064a\u0642\u0648\u0644 \u0627\u0644\u0633\u062d\u0648\u0631 \u0628\u064a\u0627'
                }
            ],
            _replicaIndex: 0,
            content: {
                fr: { title: '\u0632\u064f\u0647\u0631\u0629', description: '', transcript: '' },
                en: { title: 'Zahra', description: '', transcript: '' },
                ar: { title: '\u0632\u064f\u0647\u0631\u0629', description: '', transcript: '' }
            }
        },
        {
            id: 'poi_aicha',
            position: { x: -121.33867479629063, y: -292.79912179175983, z: -386.4468992940637 },
            audio: '',
            poiType: 'character',
            timeMode: 'night',
            replicas: [
                {
                    audio: 'expression/03_aicha_replique_01.mp3',
                    description: 'C\'est quelle chorba qui t\'a br\u00fbl\u00e9 les l\u00e8vres ?\n\nPourquoi te sens-tu concern\u00e9 par cette affaire ?',
                    transcript: '\u0648\u0627\u0634 \u0645\u0646 \u0634\u0631\u0628\u0629 \u062d\u0631\u0642\u062a\u0644\u0643 \u0634\u0648\u0627\u0631\u0628\u0643'
                }
            ],
            _replicaIndex: 0,
            content: {
                fr: { title: '\u0639\u0627\u0626\u0634\u0629', description: '', transcript: '' },
                en: { title: 'Aicha', description: '', transcript: '' },
                ar: { title: '\u0639\u0627\u0626\u0634\u0629', description: '', transcript: '' }
            }
        }
    ]
};

class CasbahExperience {
    constructor() {
        // UI Refs
        this.els = {
            webglWrap: document.getElementById('c-canvas-wrap'),
            cssWrap: document.getElementById('c-css2d'),
            loader: document.getElementById('c-loader'),
            bar: document.getElementById('c-loader-bar'),
            pct: document.getElementById('c-loader-pct'),
            menu: document.getElementById('c-menu'),
            scrHome: document.getElementById('s-menu'),
            scrOpts: document.getElementById('s-options'),
            hud: document.getElementById('c-hud'),
            editor: document.getElementById('c-editor'),
            btnSetCam: document.getElementById('btn-set-startcam'),

            // Audio UX Config
            vmusic: document.getElementById('vol-music'),
            vvoice: document.getElementById('vol-voice'),
            vamb: document.getElementById('vol-ambience'),
            btnStop: document.getElementById('btn-hud-stopvoice'),

            // Time Travel
            btnTime: document.getElementById('btn-time-travel'),
            timeFlash: document.getElementById('time-flash'),

            // Editor
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

            // Replicas dynamiques
            dynRepBox: document.getElementById('dynamic-replicas-container'),
            btnAddReplica: document.getElementById('btn-add-replica'),

            edStatus: document.getElementById('ced-status'),
            btnEdTime: document.getElementById('btn-ed-time'),
            // POI Compass
            poiCompass: document.getElementById('poi-compass'),
            poiCompassArrow: document.getElementById('poi-compass-arrow'),
            
            // Gyroscope
            btnGyro: document.getElementById('btn-hud-gyro'),
            eagleCanvas: document.getElementById('eagle-vision-canvas'),
            rewardPopup: document.getElementById('hidden-reward-popup')
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
            // Volumes normalisés (plus doux par défaut)
            v_music: 0.35,
            v_amb: 0.45,
            v_voice: 1.0,
            audioUnlocked: false,  // Guard autoplay
            visitedPois: new Set(),
            gyroMode: false,
            hiddenObjectFound: false,
            hiddenObjectTimer: 0,
            isFocusing: false,
            targetFov: null
        };

        // Eagle Vision Canvas 2D context
        this.eagleCtx = null;

        this._initThree();
        this._bindEvents();
        this._loadEnvironment();
    }

    /* ══════════════════════════════════════════════════════════
       THREE.JS SETUP
    ══════════════════════════════════════════════════════════ */
    _initThree() {
        this.scene = new THREE.Scene();
        // FOV adaptatif : plus large sur mobile pour voir plus de la scène
        const isMobile = window.innerWidth < 768;
        this.baseFov = isMobile ? 95 : 75;
        this.camera = new THREE.PerspectiveCamera(this.baseFov, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 0.1);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.els.webglWrap.appendChild(this.renderer.domElement);

        this.cssRenderer = new CSS2DRenderer();
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.els.cssWrap.appendChild(this.cssRenderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.15;
        this.controls.minPolarAngle = Math.PI * 0.25;
        this.controls.maxPolarAngle = Math.PI * 0.75;

        // On ne crée pas les contrôles Gyro ici pour éviter que DeviceOrientationControls
        // ne demande la permission sur iOS 13+ sans geste utilisateur (ce qui cause un blocage).
        this.gyroControls = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this._initLights();
        this._initParticles();

        this.renderer.domElement.addEventListener('pointerdown', this._onCanvasClick.bind(this));
        window.addEventListener('resize', this._onResize.bind(this));
    }

    _initLights() {
        // En Time Travel Mode, nous repassons sur des BasicMaterials sans lumière.
        // On coupe donc _initLights() du scope 3D inutile.
    }

    _initParticles() {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Spherical distribution around user
            const radius = 5 + Math.random() * 150;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.cos(phi);
            positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xddccaa, // Teinte sable/poussière très neutre et mate
            size: 1.2,       // Taille légèrement réduite
            map: this._createDustTexture(),
            transparent: true,
            opacity: 0.2,    // Fortement transparent pour un effet extrêmement subtil
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    _createDustTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Dégradé simple blanc vers transparent (la couleur est gérée par le matériel)
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        return new THREE.CanvasTexture(canvas);
    }

    _onResize() {
        const isMobile = window.innerWidth < 768;
        this.baseFov = isMobile ? 95 : 75;
        this.camera.fov = this.baseFov;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    /* ══════════════════════════════════════════════════════════
       BOOT & LOADING
    ══════════════════════════════════════════════════════════ */
    async _loadEnvironment() {
        this.preloadedAudios = {};
        this._setProg(0);

        // Extraction dynamique des chemins audio uniques des narrations et répliques
        const audioPaths = [];
        CASBAH_SCENARIO.pois.forEach(poi => {
            if (poi.audio && !audioPaths.includes(poi.audio)) {
                audioPaths.push(poi.audio);
            }
            if (poi.replicas) {
                poi.replicas.forEach(rep => {
                    if (rep.audio && !audioPaths.includes(rep.audio)) {
                        audioPaths.push(rep.audio);
                    }
                });
            }
        });

        const audioProgress = new Array(audioPaths.length).fill(0);
        let prog1 = 0, prog2 = 0, prog3 = 0;

        const updateProgress = () => {
            const audioSum = audioProgress.reduce((a, b) => a + b, 0);
            const totalItems = 3 + audioPaths.length;
            const currentSum = prog1 + prog2 + prog3 + audioSum;
            // Moyenne globale plafonnée à 95% jusqu'à résolution finale
            const avg = Math.round((currentSum / totalItems) * 95);
            this._setProg(avg);
        };

        const withTimeout = (promise, ms) => Promise.race([
            promise, 
            new Promise(resolve => setTimeout(() => {
                console.warn("[Traca] Timeout de sécurité atteint (" + ms + "ms). Déblocage forcé d'un asset.");
                resolve();
            }, ms))
        ]);

        try {
            const [texDay, texNight] = await Promise.all([
                this._loadTextureWithProgress(
                    '../../assets/images/casbah assasin.png?v=2.0',
                    (p) => { prog1 = p; updateProgress(); }
                ),
                this._loadTextureWithProgress(
                    '../../assets/images/04_bg.png?v=2.0',
                    (p) => { prog2 = p; updateProgress(); }
                ),
                // On inclut explicitement l'image de la carte pour éviter qu'elle soit invisible au 1er rendu de la MapIntro.
                withTimeout(new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => { prog3 = 1; updateProgress(); resolve(); };
                    img.onerror = resolve;
                    img.src = '../../assets/images/map.png';
                }), 8000),
                // On attend que la vidéo du menu principal soit prête à être jouée
                withTimeout(new Promise((resolve) => {
                    const vid = document.getElementById('menu-bg-video');
                    if (!vid || vid.readyState >= 3) {
                        resolve();
                    } else {
                        vid.addEventListener('canplay', resolve, { once: true });
                        vid.addEventListener('error', resolve, { once: true });
                    }
                }), 8000),
                // Chargement en arrière-plan des audios narratifs et répliques
                ...audioPaths.map((path, idx) => {
                    return withTimeout(new Promise((resolve) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', '/assets/audio/' + path, true);
                        xhr.responseType = 'blob';
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                this.preloadedAudios[path] = URL.createObjectURL(xhr.response);
                            }
                            audioProgress[idx] = 1;
                            updateProgress();
                            resolve();
                        };
                        xhr.onerror = () => {
                            audioProgress[idx] = 1;
                            updateProgress();
                            resolve();
                        };
                        xhr.send();
                    }), 8000);
                })
            ]);

            this._setProg(100);

            texDay.colorSpace   = THREE.SRGBColorSpace;
            texNight.colorSpace = THREE.SRGBColorSpace;

            const geo = new THREE.SphereGeometry(500, 60, 40);
            geo.scale(-1, 1, 1);

            // Multivers Sphere 1 : JOUR
            const matDay = new THREE.MeshBasicMaterial({ map: texDay, side: THREE.FrontSide });
            this.sphereDay = new THREE.Mesh(geo, matDay);
            this.scene.add(this.sphereDay);

            // Multivers Sphere 2 : NUIT (Invisible au début)
            const matNight = new THREE.MeshBasicMaterial({ map: texNight, side: THREE.FrontSide, transparent: true, opacity: 0 });
            this.sphereNight = new THREE.Mesh(geo, matNight);
            this.scene.add(this.sphereNight);

            setTimeout(() => this._onLoadComplete(), 800);

        } catch (err) {
            console.error(err);
            this.els.pct.innerText = 'Erreur textures';
        }
    }

    /**
     * Charge une texture avec progression réelle via XHR (bytes reçus / total).
     * @param {string} url - Chemin de la texture
     * @param {function} onProgress - Callback(0..1) avancée du téléchargement
     * @returns {Promise<THREE.Texture>}
     */
    _loadTextureWithProgress(url, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'blob';

            let fakeProgress = 0;
            let fakeInterval = null;

            xhr.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    if (fakeInterval) { clearInterval(fakeInterval); fakeInterval = null; }
                    onProgress(e.loaded / e.total);
                } else if (!fakeInterval && onProgress) {
                    // Si le serveur Vercel masque le Content-Length (souvent le cas sur mobile / CDN), on simule une avancée.
                    fakeInterval = setInterval(() => {
                        fakeProgress += (0.9 - fakeProgress) * 0.05; // monte doucement vers 90%
                        onProgress(fakeProgress);
                    }, 200);
                }
            };

            xhr.onload = () => {
                if (fakeInterval) clearInterval(fakeInterval);
                if (xhr.status >= 400) {
                    reject(new Error(`HTTP ${xhr.status} — ${url}`));
                    return;
                }
                const objectUrl = URL.createObjectURL(xhr.response);
                const img = new Image();
                img.onload = () => {
                    const tex = new THREE.Texture(img);
                    tex.needsUpdate = true;
                    URL.revokeObjectURL(objectUrl);
                    if (onProgress) onProgress(1); // Force 100% à la fin
                    resolve(tex);
                };
                img.onerror = () => reject(new Error(`Image decode error — ${url}`));
                img.src = objectUrl;
            };

            xhr.onerror = () => {
                if (fakeInterval) clearInterval(fakeInterval);
                reject(new Error(`Network error — ${url}`));
            };
            xhr.send();
        });
    }

    _setProg(v) {
        this.els.bar.style.width = v + '%';
        this.els.pct.innerText = Math.round(v) + '%';
    }

    async _onLoadComplete() {
        await this._loadSavedPois();

        // Créer l'instance MapIntro (sans l'afficher encore)
        this.mapIntro = new MapIntro(this);

        // Mettre à jour le label et montrer le bouton d'entrée
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
                // ✅ Ce clic utilisateur débloque l'autoplay sur tous les navigateurs
                this.state.audioUnlocked = true;
                Analytics.trackExperienceEntry('casbah');
                // ✅ Initialiser + déverrouiller le contexte audio singleton (Web Audio API)
                tracaAudio.unlockAudioContext();
                // ✅ Charger les préférences utilisateur AVANT de lancer la musique
                // (priorité préférences utilisateur > niveaux de base v1.0)
                tracaAudio.restoreFromPrefs();
                tracaAudio.setVolume('music', this.state.v_music);
                tracaAudio.setVolume('ambience', this.state.v_amb);

                // Fade Out du loader
                const loader = document.getElementById('c-loader');
                loader.style.transition = 'opacity 0.8s';
                loader.style.opacity = '0';
                setTimeout(() => { loader.style.display = 'none'; }, 850);

                // Zapper le menu si direct=true
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('direct') === 'true') {
                    this._setMode('VIEW');
                } else {
                    // Afficher le Menu Principal
                    this._setMode('MENU');
                }
                this._animate();
            }, { once: true });
            // Hover effect
            enterBtn.addEventListener('mouseenter', () => enterBtn.style.transform = 'scale(1.05)');
            enterBtn.addEventListener('mouseleave', () => enterBtn.style.transform = 'scale(1)');
        } else {
            // Fallback : pas de bouton dans le HTML, affichage direct
            const loader = document.getElementById('c-loader');
            loader.style.transition = 'opacity 0.8s';
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 850);
            
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('direct') === 'true') {
                this._setMode('VIEW');
            } else {
                this._setMode('MENU');
            }
            this._animate();
        }
    }

    _populateAudioDropdown() {
        // Scan automatique de TOUS les fichiers audio via Vite import.meta.glob
        // Fonctionne pour n'importe quel nom de fichier (.mp3, .wav, .ogg, .m4a)
        let allFiles = {};
        try {
            allFiles = import.meta.glob(
                '../../assets/audio/**/*.{mp3,wav,ogg,m4a,mp4,MP3,WAV,OGG,M4A,MP4}',
                { eager: true, as: 'url' }
            );
        } catch (e) {
            console.warn('[Audio Scan] import.meta.glob non disponible (hors Vite), fallback liste statique.', e);
        }

        // Convertir les paths en chemins relatifs propres par dossier
        const byFolder = {};
        for (const absPath of Object.keys(allFiles)) {
            // absPath: ../../assets/audio/narration/voix.mp3
            // On extrait le chemin relatif depuis assets/audio/
            const match = absPath.match(/assets\/audio\/(.+)$/);
            if (!match) continue;
            const relPath = match[1]; // narration/voix.mp3
            const parts = relPath.split('/');
            const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'racine';
            if (!byFolder[folder]) byFolder[folder] = [];
            byFolder[folder].push(relPath);
        }

        // Si aucun fichier trouvé (mode non-Vite), utiliser une liste de secours
        if (Object.keys(byFolder).length === 0) {
            byFolder['narration'] = ['narration/01_narration.mp3'];
            byFolder['music'] = ['music/menu.mp3'];
            byFolder['ambience'] = ['ambience/day/ambiance day 1.mp3', 'ambience/night/ambiance night 1.mp3'];
        }

        // Sauvegarder l'arborescence pour les UI dynamiques
        this.state.audioFolders = byFolder;

        // Peupler le sélecteur POI Audio si présent
        const selectPoi = document.getElementById('poi-audio'); // MAJ V8
        if (selectPoi) {
            selectPoi.innerHTML = '<option value="">— Aucun —</option>';
            for (const [folder, files] of Object.entries(byFolder).sort()) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = folder;
                files.sort().forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f;
                    opt.innerText = f.split('/').pop();
                    optgroup.appendChild(opt);
                });
                selectPoi.appendChild(optgroup);
            }
        }

        // Peupler le sélecteur de sons spatiaux (éditeur audio nodes — si présent)
        const selectAudio = document.getElementById('audionode-file-select');
        if (selectAudio) {
            selectAudio.innerHTML = '<option value="">— Sélectionner un son —</option>';
            for (const [folder, files] of Object.entries(byFolder).sort()) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = folder;
                files.sort().forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f;
                    opt.innerText = f.split('/').pop();
                    optgroup.appendChild(opt);
                });
                selectAudio.appendChild(optgroup);
            }
        }
    }

    /* ══════════════════════════════════════════════════════════
       STATE MACHINE (Modes)
    ══════════════════════════════════════════════════════════ */
    _setMode(mode) {
        this.state.mode = mode;
        this._closeAllPopups();

        // Toujours fermer la map si on revient à un autre mode
        if (mode !== 'MAP' && this.mapIntro) {
            this.mapIntro.hide();
        }

        if (mode === 'MENU') {
            this.els.hud.style.display = 'none';
            this.els.editor.style.display = 'none';
            this.els.webglWrap.style.opacity = '0';
            this.els.cssWrap.style.opacity = '0';
            this.els.menu.removeAttribute('hidden');
            this.els.menu.style.display = 'flex';
            this._switchScreen(this.els.scrHome);
            this.controls.autoRotate = false;

            // Force video playback to bypass potential autoplay issues
            const bgVideo = document.getElementById('menu-bg-video');
            if (bgVideo) bgVideo.play().catch(() => { });

            // Mode MENU: stop all and play menu music (uniquement après unlock audio)
            if (this.state.audioUnlocked) {
                tracaAudio.stopAll();
                tracaAudio.playMusic('menu.mp3', 3);
            }
            this._poiInteraction(false);

        } else if (mode === 'VIEW') {
            this.els.menu.style.opacity = '0';
            this.els.editor.style.display = 'none';

            // Révéler la scène 3D
            this.els.webglWrap.style.transition = 'opacity 1s';
            this.els.cssWrap.style.transition = 'opacity 1s';
            this.els.webglWrap.style.opacity = '1';
            this.els.cssWrap.style.opacity = '1';

            // ✅ Appliquer la caméra initiale si définie (restauration robuste)
            const startCam = this.state.scenarioData?.settings?.startCam;
            if (startCam?.az !== undefined && startCam?.pol !== undefined) {
                // Désactiver le damping temporairement pour placement immédiat
                this.controls.enableDamping = false;
                this.camera.position.setFromSphericalCoords(0.1, startCam.pol, startCam.az);
                this.controls.target.set(0, 0, 0);
                this.controls.update();
                // Rétablir le damping après
                setTimeout(() => { this.controls.enableDamping = true; }, 100);
            }

            setTimeout(() => {
                this.els.menu.style.display = 'none';
                this.els.menu.style.opacity = '1';
                this.els.hud.style.display = 'flex';
                this.controls.autoRotate = true;

                const ttBtn = document.getElementById('btn-time-travel');
                if (ttBtn) { ttBtn.classList.remove('is-night'); ttBtn.classList.add('is-day'); }

                // Crossfade progressif (4s) vers la musique de jeu
                const music = this.state.isNight ? 'casbah_night_music_01.mp3' : 'casbah_day_music_01.mp3';
                const amb = this.state.isNight ? 'night/02_ambience_night.mp3' : 'day/01_ambience_day.mp3';
                tracaAudio.playMusic(music, 7);
                tracaAudio.playAmbience(amb, 7);

                this._poiInteraction(true);
            }, 500);

        } else if (mode === 'EDIT') {
            this.els.menu.style.display = 'none';
            this.els.hud.style.display = 'none';
            this.els.editor.style.display = 'flex';
            this.els.editor.removeAttribute('hidden'); // Double sécurité

            this.els.webglWrap.style.opacity = '1';
            this.els.cssWrap.style.opacity = '1';
            this.controls.autoRotate = false;

            // In Edit Mode, reduce music/ambience but don't stop them completely if coming from view
            tracaAudio.setVolume('music', this.state.v_music * 0.4);
            tracaAudio.setVolume('ambience', this.state.v_amb * 0.4);

            this._poiInteraction(false);
            this._renderEditorList();
            this._resetEdForm();
            this.els.fCol.style.display = 'none';
            this._populateAudioDropdown();
            this._updatePoiVisibility(); // Synchroniser avec le mode temporel actuel
        }
    }

    _switchScreen(scr) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        scr.classList.add('active');
    }

    /* ══════════════════════════════════════════════════════════
       UI EVENTS BINDING
    ══════════════════════════════════════════════════════════ */
    _bindEvents() {
        if (this.els.btnGyro) {
            this.els.btnGyro.addEventListener('click', () => {
                this._toggleGyro();
            });
        }
        
        // --- System UI SFX ---
        // Préchargement du son UI pour éliminer la latence
        const globalClickSfx = new Audio('/assets/audio/ui/click.mp3');
        globalClickSfx.volume = 0.6;
        globalClickSfx.load();

        document.querySelectorAll('.c-btn, .c-hud-btn, .c-lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sfx = globalClickSfx.cloneNode();
                sfx.volume = 0.6;
                sfx.play().catch(() => { });
            });
        });

        // --- Menu ---
        document.getElementById('btn-start').onclick = () => {
            // Ouvrir la Map (pas la Casbah directement)
            if (this.mapIntro) {
                // Cacher le menu
                this.els.menu.style.transition = 'opacity .5s';
                this.els.menu.style.opacity = '0';
                setTimeout(() => {
                    this.els.menu.style.display = 'none';
                    this.els.menu.style.opacity = '1';
                    this.els.menu.style.transition = '';
                    this.mapIntro.show();
                }, 500);
            } else {
                // Fallback : aller directement en VIEW si pas de map
                this._setMode('VIEW');
            }
        };
        // document.getElementById('btn-options').onclick = () => this._switchScreen(this.els.scrOpts);
        // Géré par le nouveau UI HTML

        const btnEd = document.getElementById('btn-editor');
        if (btnEd) btnEd.onclick = () => this._setMode('EDIT');

        // document.getElementById('btn-opts-back').onclick = () => this._switchScreen(this.els.scrHome);

        const btnSetCam = document.getElementById('btn-set-startcam');
        if (btnSetCam) {
            btnSetCam.onclick = () => {
                // Dans un visionneur 360°, c'est l'ORIENTATION (azimut + angle polaire)
                // qui définit le regard, pas la position de la caméra.
                const az = this.controls.getAzimuthalAngle();
                const pol = this.controls.getPolarAngle();

                if (!this.state.scenarioData) this.state.scenarioData = {};
                if (!this.state.scenarioData.settings) this.state.scenarioData.settings = {};
                this.state.scenarioData.settings.startCam = { az, pol };

                // Sauvegarde en RAM
                this._msg('📸 Position caméra initiale enregistrée (Exportez pour confirmer) !', 3000);
            };
        }

        // Langs
        document.querySelectorAll('.c-lang-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.c-lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.lang = btn.dataset.lang;
                this._updateAllPoiTexts();
            };
        });

        // Volumes
        if (this.els.vmusic) {
            this.els.vmusic.oninput = (e) => {
                this.state.v_music = parseFloat(e.target.value);
                document.getElementById('lbl-music').innerText = Math.round(this.state.v_music * 100) + '%';
                tracaAudio.setVolume('music', this.state.v_music);
            };
        }
        if (this.els.vvoice) {
            this.els.vvoice.oninput = (e) => {
                this.state.v_voice = parseFloat(e.target.value);
                document.getElementById('lbl-voice').innerText = Math.round(this.state.v_voice * 100) + '%';
                tracaAudio.setVolume('narration', this.state.v_voice);
            };
        }
        if (this.els.vamb) {
            this.els.vamb.oninput = (e) => {
                this.state.v_amb = parseFloat(e.target.value);
                document.getElementById('lbl-ambience').innerText = Math.round(this.state.v_amb * 100) + '%';
                tracaAudio.setVolume('ambience', this.state.v_amb);
            };
        }

        // --- HUD ---
        const btnMute = document.getElementById('btn-hud-mute');
        if (btnMute) btnMute.onclick = () => {
            // SNAPSHOT v1.0 : ancien comportement coupait ambiances + narration.
            // Nouveau comportement : coupe UNIQUEMENT la musique (Casbah mute partiel).
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
        };
        if (this.els.btnStop) {
            this.els.btnStop.onclick = () => this._stopVoice();
        }

        // --- Time Travel ---
        const ttBtnEl = document.getElementById('btn-time-travel');
        if (ttBtnEl) {
            ttBtnEl.onclick = () => this._timeTravelToggle();
            // Prise en charge des écrans tactiles mobiles pour assurer le déclenchement
            ttBtnEl.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Empêche l'émulation d'un 'click' fantôme
                this._timeTravelToggle();
            }, { passive: false });
        }

        // --- Smart Zoom (double-clic / double-tap) ---
        this._initSmartZoom();

        // --- Editor ---
        if (this.els.btnEdTime) this.els.btnEdTime.onclick = () => this._timeTravelToggle();
        document.getElementById('btn-ed-exit').onclick = () => this._setMode('VIEW');
        document.getElementById('btn-add-poi').onclick = () => {
            this.state.isPlacingAudio = false;
            this.state.isPlacingPoi = true;
            this._resetEdForm();
            this.els.fCol.style.display = 'block';
        };
        this.els.btnCancel.onclick = () => {
            this.state.isPlacingPoi = false;
            this._resetEdForm();
            this.els.fCol.style.display = 'none';
            this._renderEditorList(); // clear selections
        };
        this.els.btnSave.onclick = () => this._saveFormPoi();
        this.els.btnDel.onclick = () => this._deleteFormPoi();

        const btnEdSave = document.getElementById('btn-ed-save');
        if (btnEdSave) btnEdSave.onclick = () => this._apiSaveScenario();

        // --- Tabs ---
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const tab = document.getElementById('tab-' + btn.dataset.tab);
                if (tab) tab.classList.add('active');

                this.state.isPlacingPoi = false;
                this.state.isPlacingAudio = false;
                if (this._tempSphere) { this.scene.remove(this._tempSphere); this._tempSphere = null; }
            });
        });

        // Removed spatial audio logic

        // ══ V10 : Gestion du Type (Objet / Personnage) custom
        const typeSelectHidden = document.getElementById('poi-type-hidden');
        const wrapChar = document.getElementById('wrap-poi-character');
        const wrapObj = document.getElementById('wrap-poi-object');
        const lblTitle = document.getElementById('lbl-poi-title');

        document.querySelectorAll('.poi-type-toggle .type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.poi-type-toggle .type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const val = btn.dataset.val;
                if (typeSelectHidden) typeSelectHidden.value = val;

                if (val === 'character') {
                    wrapChar.style.display = 'block';
                    wrapObj.style.display = 'none';
                    lblTitle.innerText = "Nom du Personnage (Affiché en jeu)";
                } else {
                    wrapChar.style.display = 'none';
                    wrapObj.style.display = 'block';
                    lblTitle.innerText = "Titre de l'Objet / Anecdote";
                }
            });
        });

        // ══ V10 : Boutons Export & Importation Statique
        const btnExport = document.getElementById('btn-export-scenario');
        if (btnExport) btnExport.onclick = () => this._exportJSON();

        const btnImportTrigger = document.getElementById('btn-import-scenario');
        const fileImport = document.getElementById('file-import');
        if (btnImportTrigger && fileImport) {
            btnImportTrigger.onclick = () => fileImport.click();
            fileImport.addEventListener('change', (e) => this._importLocalJSON(e));
        }

        const btnAddReplica = document.getElementById('btn-add-replica');
        if (btnAddReplica) {
            btnAddReplica.onclick = () => {
                this.state.editorReplicas.push({ audio: '', description: '', transcript: '' });
                this._renderReplicasUI();
            };
        }
    }

    _onCanvasClick(e) {
        if (this.state.mode === 'VIEW') {
            const somethingWasOpen = !!this.state.playingVoicePoi;
            this._stopVoice();
            this._closeAllPopups();

            // Réafficher les points
            this._updatePoiVisibility();

            this.controls.autoRotate = !somethingWasOpen; // restart rotation if we closed something
            return;
        }

        if (this.state.mode !== 'EDIT') return;

        // If we are placing something
        if (this.state.isPlacingPoi || this.state.isPlacingAudio) {
            const canvas = this.renderer.domElement;
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = - ((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const hits = this.raycaster.intersectObject(this.sphereDay || this.sphereNight);

            if (hits.length > 0) {
                const pt = hits[0].point;
                // Affiche sphère viz
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

                    // If moving an existing POI
                    const id = this.els.fId.value;
                    if (id) {
                        const poi = this.state.pois.find(p => p.id === id);
                        if (poi && poi._cssObj) {
                            poi.position = { x: pt.x, y: pt.y, z: pt.z };
                            poi._cssObj.position.set(pt.x, pt.y, pt.z);
                            // La sauvegarde n'est plus implicite. Le POI se met à jour en RAM, et c'est l'Export qui statifie.
                        }
                    }
                } else if (this.state.isPlacingAudio) {
                    const audioForm = document.getElementById('ced-audio-form');
                    audioForm.hidden = false;
                    document.getElementById('audionode-temp-x').value = pt.x;
                    document.getElementById('audionode-temp-y').value = pt.y;
                    document.getElementById('audionode-temp-z').value = pt.z;

                    document.getElementById('ced-audio-hint').innerHTML = `📍 Son virtuel placé. Choisissez le fichier.`;

                    // If moving an existing AudioNode
                    const id = document.getElementById('audionode-edit-id').value;
                    if (id) {
                        const an = this.state.audioNodes.find(a => a.id === id);
                        if (an && window._audioNodeCSSObjects && window._audioNodeCSSObjects[id]) {
                            an.position = { x: pt.x, y: pt.y, z: pt.z };
                            window._audioNodeCSSObjects[id].position.set(pt.x, pt.y, pt.z);
                        }
                    }

                    // live preview pos
                    this._updateRealtimePreview('position', { x: pt.x, y: pt.y, z: pt.z });

                    this.state.isPlacingAudio = false;
                }
            }
        }
    }

    /* ══════════════════════════════════════════════════════════
       EDITOR LOGIC
    ══════════════════════════════════════════════════════════ */
    _renderEditorList() {
        this.els.poiList.innerHTML = '';

        // Filtrer les POIS par mode temporel
        const currentMode = this.state.isNight ? 'night' : 'day';
        const filteredPois = this.state.pois.filter(p => (p.timeMode || 'day') === currentMode);

        if (filteredPois.length === 0) {
            this.els.poiList.innerHTML = '<li class="poi-empty">Aucun point dans ce mode temporel.</li>';
            return;
        }

        const currentEditId = this.els.fId.value;
        filteredPois.forEach(p => {
            const li = document.createElement('li');
            li.className = 'poi-item';
            if (p.id === currentEditId) li.classList.add('selected');

            const titleFr = p.content.fr.title || 'Sans titre';
            li.innerHTML = `
                <div style="flex:1; overflow:hidden">
                    <span class="poi-item-tit">${titleFr}</span>
                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.4)">${p.audio ? '🔊 ' + p.audio : '🔇 Muet'}</span>
                </div>
            `;
            li.onclick = () => this._loadPoiToForm(p);
            this.els.poiList.appendChild(li);
        });

        this.state.pois.forEach(p => {
            if (p._uiObj && p._uiObj.dot) {
                if (p.id === currentEditId) p._uiObj.dot.classList.add('editor-active');
                else p._uiObj.dot.classList.remove('editor-active');
            }
        });
    }

    _renderReplicasUI() {
        if (!this.els.dynRepBox) return;
        this.els.dynRepBox.innerHTML = '';
        const folders = this.state.audioFolders || {};

        let audioOptionsHTML = '<option value="">-- Aucun audio --</option>';
        for (const [folder, files] of Object.entries(folders).sort()) {
            audioOptionsHTML += `<optgroup label="${folder}">`;
            files.sort().forEach(f => {
                audioOptionsHTML += `<option value="${f}">${f.split('/').pop()}</option>`;
            });
            audioOptionsHTML += `</optgroup>`;
        }

        this.state.editorReplicas.forEach((rep, index) => {
            const div = document.createElement('div');
            div.className = 'replica-card';
            div.style.cssText = 'background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px; border-left: 2px solid #e7ba80; position:relative;';
            div.innerHTML = `
                <div style="font-size:0.75rem; color:#e7ba80; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <b>Séquence #${index + 1}</b>
                    <button class="c-btn danger sm" onclick="window.casbah._removeReplica(${index})" style="padding:2px 6px; font-size:0.6rem;">✕</button>
                </div>
                <div class="ced-field" style="margin-bottom:8px;">
                    <label>📝 Description (Popup UI statique)</label>
                    <textarea class="dyn-rep-desc" rows="2">${rep.description || ''}</textarea>
                </div>
                <div class="ced-field" style="margin-bottom:8px;">
                    <label>🗣 Transcription (Sous-titres synchronisés)</label>
                    <textarea class="dyn-rep-trans" rows="2">${rep.transcript || ''}</textarea>
                </div>
                <div class="ced-field">
                    <label>🎵 Audio</label>
                    <select class="rep-audio dyn-rep-audio">
                        ${audioOptionsHTML}
                    </select>
                </div>
            `;
            this.els.dynRepBox.appendChild(div);
            // Sélecteur audio
            div.querySelector('.dyn-rep-audio').value = rep.audio || '';
            // Update le textarea lors de la frappe pour sauvegarder l'état
            div.querySelector('.dyn-rep-desc').oninput = (e) => this.state.editorReplicas[index].description = e.target.value;
            div.querySelector('.dyn-rep-trans').oninput = (e) => this.state.editorReplicas[index].transcript = e.target.value;
            div.querySelector('.dyn-rep-audio').onchange = (e) => this.state.editorReplicas[index].audio = e.target.value;
        });
    }

    _removeReplica(idx) {
        this.state.editorReplicas.splice(idx, 1);
        this._renderReplicasUI();
    }

    _importLocalJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Nettoyage immédiat de la scène 3D existante
                if (this.state.pois) {
                    this.state.pois.forEach(p => {
                        if (p._cssObj) this.scene.remove(p._cssObj);
                    });
                }

                this._processLoadedData(data);
                if (this.state.mode === 'EDIT') {
                    this._renderEditorList();
                    this._resetEdForm();
                    this.els.fCol.style.display = 'none';
                }

                this._msg('✅ JSON importé. Scène mise à jour.', 4000);
            } catch (err) {
                console.error("Erreur de parsing JSON", err);
                this._msg('❌ Erreur de lecture du JSON', 4000);
            }
        };
        reader.readAsText(file);

        // Reset the input so the same file could be loaded again
        event.target.value = '';
    }

    _exportJSON() {
        const scenario = {
            metadata: {
                exportedAt: new Date().toISOString(),
                description: "Export Static Editor Casbah V10",
                version: "10.0"
            },
            settings: this.state.scenarioData?.settings || {},
            pois: this.state.pois.map(p => {
                const { _uiObj, _cssObj, ...cleanPoi } = p;
                return cleanPoi;
            })
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 4));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "scenario_casbah_poi.json");
        dlAnchorElem.click();

        this._msg('📥 Fichier JSON exporté ! Copiez-le dans /src/data/', 4000);
    }

    _loadPoiToForm(p) {
        this.els.fCol.style.display = 'block';
        this.els.btnDel.style.display = 'inline-flex';

        this.els.fId.value = p.id;
        this.els.fX.value = p.position.x;
        this.els.fY.value = p.position.y;
        this.els.fZ.value = p.position.z;
        this.els.fTitle.value = p.content?.fr?.title || '';

        const inputDesc = document.getElementById('poi-desc');
        const inputTrans = document.getElementById('poi-trans');
        const inputAudio = document.getElementById('poi-audio');

        if (inputDesc) inputDesc.value = p.content?.fr?.description || '';
        if (inputTrans) inputTrans.value = p.content?.fr?.transcript || '';
        if (inputAudio) inputAudio.value = p.audio || '';

        // Charger les répliques
        this.state.editorReplicas = p.replicas && Array.isArray(p.replicas)
            ? JSON.parse(JSON.stringify(p.replicas))
            : [];
        this._renderReplicasUI();

        const typeSelectHidden = document.getElementById('poi-type-hidden');
        if (typeSelectHidden) {
            const poiType = p.poiType || 'object';
            typeSelectHidden.value = poiType;
            // Activate the corresponding button
            const btn = document.querySelector(`.poi-type-toggle .type-btn[data-val="${poiType}"]`);
            if (btn) btn.click();
        }

        this.els.fHint.style.background = 'transparent';
        this.els.fHint.style.border = '1px dashed #4ade80';
        this.els.fHint.style.color = '#4ade80';
        this.els.fHint.innerHTML = `👉 Cliquez sur la scène pour DÉPLACER ce point.`;

        this._renderEditorList();
    }

    _resetEdForm() {
        this.els.fId.value = '';
        this.els.fX.value = '';
        this.els.fY.value = '';
        this.els.fZ.value = '';
        this.els.fTitle.value = '';
        this.els.btnDel.style.display = 'none';

        const inputDesc = document.getElementById('poi-desc');
        const inputTrans = document.getElementById('poi-trans');
        const inputAudio = document.getElementById('poi-audio');

        if (inputDesc) inputDesc.value = '';
        if (inputTrans) inputTrans.value = '';
        if (inputAudio) inputAudio.value = '';

        this.state.editorReplicas = [];
        this._renderReplicasUI();

        const typeSelectHidden = document.getElementById('poi-type-hidden');
        if (typeSelectHidden) {
            typeSelectHidden.value = 'object';
            const btn = document.querySelector(`.poi-type-toggle .type-btn[data-val="object"]`);
            if (btn) btn.click();
        }

        this.els.fHint.style.background = 'rgba(74, 222, 128, 0.05)';
        this.els.fHint.style.border = '1px dashed #4ade80';
        this.els.fHint.style.color = '#4ade80';
        this.els.fHint.innerHTML = `📍 Cliquez sur l'image 360 pour fixer l'emplacement du NOUVEAU point.`;
    }

    _saveFormPoi() {
        const id = this.els.fId.value;
        const x = parseFloat(this.els.fX.value), y = parseFloat(this.els.fY.value), z = parseFloat(this.els.fZ.value);
        const title = this.els.fTitle.value.trim();

        const typeSelectHidden = document.getElementById('poi-type-hidden');
        const poiType = typeSelectHidden ? typeSelectHidden.value : 'object';

        if (isNaN(x) || isNaN(y)) { alert("Veuillez d'abord cliquer sur la scène pour fixer une position."); return; }
        if (!title) { alert("Le titre / nom du point est obligatoire"); return; }

        const inputDesc = document.getElementById('poi-desc');
        const inputTrans = document.getElementById('poi-trans');
        const inputAudio = document.getElementById('poi-audio');

        const descText = inputDesc ? inputDesc.value.trim() : '';
        const transText = inputTrans ? inputTrans.value.trim() : '';
        const audioFile = inputAudio ? inputAudio.value : '';

        // Objets stockent description + transcription
        // Personnage stockent sa réplique courante (description via replicas)
        const cObj = {
            title: title,
            description: poiType === 'object' ? descText : '',
            transcript: poiType === 'object' ? transText : ''
        };

        const currentReplicas = poiType === 'character' ? JSON.parse(JSON.stringify(this.state.editorReplicas)) : [];

        let poi;

        if (id) {
            poi = this.state.pois.find(p => p.id === id);
            if (!poi) return;
            poi.position = { x, y, z };
            poi.audio = poiType === 'object' ? audioFile : '';
            poi.poiType = poiType;
            poi.timeMode = this.state.isNight ? 'night' : 'day';
            poi._replicaIndex = 0; // reset index

            poi.content = { fr: { ...cObj }, en: { ...cObj }, ar: { ...cObj } };
            poi.replicas = currentReplicas;

            if (poi._cssObj) poi._cssObj.position.set(x, y, z);

            if (poi._uiObj && poi._uiObj.dot) {
                poi._uiObj.dot.className = 'poi-marker';
                if (poiType === 'character') poi._uiObj.dot.classList.add('type-character');
                else poi._uiObj.dot.classList.add('type-object');
            }

            this._msg(`✔ Point modifié : ${title}`);
        } else {
            poi = {
                id: 'poi_' + Date.now(),
                position: { x, y, z },
                audio: poiType === 'object' ? audioFile : '',
                poiType: poiType,
                timeMode: this.state.isNight ? 'night' : 'day',
                replicas: currentReplicas,
                _replicaIndex: 0,
                content: {
                    fr: { ...cObj },
                    en: { ...cObj },
                    ar: { ...cObj }
                }
            };
            this.state.pois.push(poi);
            this._buildHtmlPoi(poi);
            this._msg(`✔ Point créé : ${title}`);
        }
        this._updateAllPoiTexts();
        this._updatePoiVisibility();

        // Rafraîchit l'UI
        this._resetEdForm();
        this.els.fCol.style.display = 'none';
        this._renderEditorList();
    }

    _deleteFormPoi() {
        const id = this.els.fId.value;
        if (!id) return;
        if (confirm("Supprimer ce point d'intérêt définitivement ?")) {
            const idx = this.state.pois.findIndex(p => p.id === id);
            if (idx > -1) {
                const p = this.state.pois[idx];
                if (p._cssObj) this.scene.remove(p._cssObj);
                this.state.pois.splice(idx, 1);
            }
            this._resetEdForm();
            this.els.fCol.style.display = 'none';
            this._renderEditorList();
            this._msg("🗑 Point supprimé.");
            this._apiSaveScenario(); // AUTO-SAVE transparent
        }
    }

    _msg(txt, isErr = false) {
        this.els.edStatus.style.color = isErr ? 'var(--c-danger)' : '#4ade80';
        this.els.edStatus.innerText = txt;
        setTimeout(() => this.els.edStatus.innerText = '', 3500);
    }

    _saveAudioNodeForm() {
        const id = document.getElementById('audionode-edit-id').value;
        const x = parseFloat(document.getElementById('audionode-temp-x').value);
        const y = parseFloat(document.getElementById('audionode-temp-y').value);
        const z = parseFloat(document.getElementById('audionode-temp-z').value);
        const file = document.getElementById('audionode-file-select').value;
        const vol = parseFloat(document.getElementById('audionode-vol').value);
        const dist = parseFloat(document.getElementById('audionode-dist').value);

        if (isNaN(x) || isNaN(y)) { alert("Cliquez sur la scène d'abord."); return; }
        if (!file) { alert("Sélectionnez un fichier audio."); return; }

        let node;
        if (id) {
            node = this.state.audioNodes.find(a => a.id === id);
            node.position = { x, y, z };
            node.file = file; node.volume = vol; node.distance = dist;
            if (window._audioNodeCSSObjects && window._audioNodeCSSObjects[id]) {
                window._audioNodeCSSObjects[id].position.set(x, y, z);
            }
            this._msg(`✔ Son modifié : ${file}`);
        } else {
            node = { id: 'aud_' + Date.now(), position: { x, y, z }, file, volume: vol, distance: dist };
            this.state.audioNodes.push(node);
            this._buildHtmlAudioNode(node);
            this._msg(`✔ Son placé : ${file}`);
        }

        document.getElementById('ced-audio-form').hidden = true;
        this._renderAudioNodeList();
    }

    _deleteAudioNodeForm() {
        const id = document.getElementById('audionode-edit-id').value;
        if (!id) return;
        if (confirm("Supprimer ce son spatial ?")) {
            const idx = this.state.audioNodes.findIndex(a => a.id === id);
            if (idx > -1) {
                if (window._audioNodeCSSObjects && window._audioNodeCSSObjects[id]) {
                    this.scene.remove(window._audioNodeCSSObjects[id]);
                    delete window._audioNodeCSSObjects[id];
                }
                this.state.audioNodes.splice(idx, 1);
            }
            document.getElementById('ced-audio-form').hidden = true;
            this._renderAudioNodeList();
            this._msg("🗑 Son supprimé.");
        }
    }

    _renderAudioNodeList() {
        const list = document.getElementById('audionode-list');
        if (!list) return;
        list.innerHTML = '';
        if (this.state.audioNodes.length === 0) {
            list.innerHTML = '<li class="poi-empty">Aucun son — Cliquez sur "+ Son"</li>';
            return;
        }

        const currentEditId = document.getElementById('audionode-edit-id').value;
        this.state.audioNodes.forEach(a => {
            const li = document.createElement('li');
            li.className = 'poi-item';
            if (a.id === currentEditId) li.classList.add('selected');

            li.innerHTML = `
                <div style="flex:1; overflow:hidden">
                    <span class="poi-item-tit">${a.file}</span>
                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.4)">Vol: ${Math.round(a.volume * 100)}% | Dist: ${a.distance}</span>
                </div>
            `;
            li.onclick = () => this._loadAudioNodeToForm(a);
            list.appendChild(li);
        });
    }

    _loadAudioNodeToForm(a) {
        document.getElementById('ced-audio-form').hidden = false;
        document.getElementById('btn-audio-delete').hidden = false;

        document.getElementById('audionode-edit-id').value = a.id;
        document.getElementById('audionode-temp-x').value = a.position.x;
        document.getElementById('audionode-temp-y').value = a.position.y;
        document.getElementById('audionode-temp-z').value = a.position.z;
        document.getElementById('audionode-file-select').value = a.file || '';
        document.getElementById('audionode-vol').value = a.volume !== undefined ? a.volume : 1;
        document.getElementById('audionode-dist').value = a.distance !== undefined ? a.distance : 150;

        document.getElementById('lbl-audio-vol').innerText = Math.round((a.volume !== undefined ? a.volume : 1) * 100) + '%';
        document.getElementById('lbl-audio-dist').innerText = (a.distance !== undefined ? a.distance : 150) + 'm';
        document.getElementById('ced-audio-hint').innerHTML = `👉 Cliquez sur la scène pour DÉPLACER ce son.`;

        this._destroyRealtimePreview(); // Reset before loading
        this._updateRealtimePreview('file', a.file);
        this._updateRealtimePreview('position', a.position);
        this._updateRealtimePreview('volume', a.volume !== undefined ? a.volume : 1);
        this._updateRealtimePreview('distance', a.distance !== undefined ? a.distance : 150);

        this._renderAudioNodeList();
    }

    _destroyRealtimePreview() {
        if (this._realtimePreviewNode) {
            if (this._realtimePreviewNode.el) {
                this._realtimePreviewNode.el.pause();
                this._realtimePreviewNode.el.src = '';
            }
            this._realtimePreviewNode = null;
        }
    }

    _updateRealtimePreview(prop, value) {
        if (!this.audioCtx) this._initSpatialAudio();
        if (!this.audioCtx) return;

        // Ensure preview node exists
        if (!this._realtimePreviewNode) {
            const el = document.createElement('audio');
            el.loop = true;
            const src = this.audioCtx.createMediaElementSource(el);
            const panner = this.audioCtx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 150;
            panner.rolloffFactor = 0.8;
            panner.coneInnerAngle = 360;

            panner.positionX.value = 0;
            panner.positionY.value = 0;
            panner.positionZ.value = -100;

            src.connect(panner);
            panner.connect(this.audioCtx.destination);

            this._realtimePreviewNode = { el, panner };
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        }

        const node = this._realtimePreviewNode;
        if (prop === 'file' && value) {
            node.el.src = '../../assets/audio/' + value;
            node.el.play().catch(e => console.warn('Preview Autoplay:', e));
        }
        if (prop === 'volume') node.el.volume = value;

        if (prop === 'distance') node.dist = value;
        if (prop === 'position' && value.x !== undefined) {
            node.dir = new THREE.Vector3(value.x, value.y, value.z).normalize();
        }

        // Appliquer la normalisation (Direction * Distance) pour replacer le son
        // littéralement à "Distance" mètres des oreilles de l'utilisateur.
        if (node.dir) {
            const d = node.dist || 150;
            node.panner.positionX.value = node.dir.x * d;
            node.panner.positionY.value = node.dir.y * d;
            node.panner.positionZ.value = node.dir.z * d;
        }
    }

    /* ══════════════════════════════════════════════════════════
       CSS2D HTML POIs
    ══════════════════════════════════════════════════════════ */
    _buildHtmlAudioNode(data) {
        const dot = document.createElement('div');
        dot.className = 'c-audio-node';
        dot.onclick = (e) => {
            e.stopPropagation();
            if (this.state.mode === 'EDIT') this._loadAudioNodeToForm(data);
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

        // Caption animée (sous-titres synchronisés à la narration)
        const caption = document.createElement('div');
        caption.className = 'poi-pop-caption';
        // Style désormais géré par .poi-pop-caption dans style.css

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
            tracaAudio.playSFX('ui/click.mp3');

            if (this.state.mode === 'EDIT') {
                this._loadPoiToForm(data);
            } else {
                // Track POI click
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

                    // Increment the counter for the next click
                    data._replicaIndex++;
                    if (data._replicaIndex >= data.replicas.length) data._replicaIndex = 0;
                } else {
                    // Rétrocompatibilité : S'il y a des anciennes séquences sans .audio
                    if (data.replicas && data.replicas.length > 0 && !data.audio) {
                        const rep = data.replicas[0];
                        currentAudio = rep.audio || currentAudio;
                        data.audio = currentAudio; // Fix rétroactif 
                        currentTrans = rep.transcript || currentTrans;
                        if (!currentDesc) {
                            currentDesc = rep.description || currentTrans;
                        }
                    }
                }

                // Rafraîchir le texte fixe de l'UI
                if (data._uiObj && data._uiObj.desc) {
                    data._uiObj.desc.innerText = currentDesc;
                }

                // Effet FOCUS : Masquer tous les autres points
                this.state.pois.forEach(p => {
                    if (p !== data && p._uiObj) {
                        p._uiObj.dot.style.opacity = '0';
                        p._uiObj.dot.style.pointerEvents = 'none';
                    }
                });

                pop.classList.add('visible');
                this.controls.autoRotate = false;

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
                    }, 2000); // 2s de lecture fictive
                }
            }
        };

        btnCls.onclick = (e) => {
            e.stopPropagation();
            pop.classList.remove('visible');
            this.controls.autoRotate = true;
            this._stopVoice();

            // Réafficher tous les points
            this.state.pois.forEach(p => {
                if (p._uiObj && (!p.timeMode || p.timeMode === (this.state.isNight ? 'night' : 'day'))) {
                    p._uiObj.dot.style.opacity = '1';
                    p._uiObj.dot.style.pointerEvents = 'auto';
                }
            });
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
        
        // Ajouter la classe visuelle sur le marqueur DOM pour un feedback premium direct
        const poi = this.state.pois.find(p => p.id === poiId);
        if (poi && poi._uiObj && poi._uiObj.dot) {
            poi._uiObj.dot.classList.add('visited');
        }
        
        // Check if all POIs visited (excluding characters with no content if any, but let's count all standard POIs)
        // Ensure we don't divide by zero
        if (this.state.pois.length > 0 && this.state.visitedPois.size >= this.state.pois.length) {
            this._showScanNextButton();
        }
    }

    _showScanNextButton() {
        const btn = document.getElementById('btn-scan-next');
        if (btn && btn.style.display === 'none') {
            btn.style.display = 'flex';
            // Animation d'apparition
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px)';
            setTimeout(() => {
                btn.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, 50);
            
            btn.onclick = () => {
                // Redirection vers l'accueil avec action scan (pour bypass onboarding et ouvrir caméra)
                window.location.href = '../../index.html?scanner=true';
            };
        }
    }

    _updateAllPoiTexts() {
        this.state.pois.forEach(p => {
            if (!p._uiObj) return;
            const c = p.content[this.state.lang] || p.content.fr;
            p._uiObj.tit.innerText = c.title || '';
            p._uiObj.desc.innerText = c.description || '';

            // RTL support for Arabic
            if (this.state.lang === 'ar') {
                p._uiObj.pop.style.direction = 'rtl';
                p._uiObj.pop.style.textAlign = 'right';
            } else {
                p._uiObj.pop.style.direction = 'ltr';
                this.state.lang === 'en' ? p._uiObj.pop.style.textAlign = 'left' : p._uiObj.pop.style.textAlign = 'left';
            }
        });
    }

    _poiInteraction(enable) {
        this.state.pois.forEach(p => {
            if (p._uiObj && p._cssObj.element) {
                p._cssObj.element.style.pointerEvents = enable ? 'auto' : 'none';
            }
        });
    }

    _closeAllPopups() {
        this.state.pois.forEach(p => {
            if (p._uiObj) {
                p._uiObj.pop.classList.remove('visible');
            }
        });
    }

    _updatePoiVisibility() {
        const currentMode = this.state.isNight ? 'night' : 'day';
        this.state.pois.forEach(p => {
            if (p._cssObj && p._cssObj.element) {
                if ((p.timeMode || 'day') === currentMode) {
                    p._cssObj.element.style.display = 'block';
                } else {
                    p._cssObj.element.style.display = 'none';
                    if (p._uiObj) p._uiObj.pop.classList.remove('visible'); // Cacher le panneau si c'était ouvert
                }
            }
        });
    }

    /* ════════════════════════════════════════════════════════
       SMART ZOOM (Double-clic / Double-tap)
    ════════════════════════════════════════════════════════ */
    _initSmartZoom() {
        this._zoomActive = false;
        this._lastTap = 0;
        const canvas = this.renderer.domElement;

        const doZoom = (clientX, clientY) => {
            if (this.state.mode !== 'VIEW') return;
            
            // Zoom cible en FOV (15% de zoom par rapport à la vue initiale)
            const targetZoomFov = this.baseFov * 0.85;

            // Calcule le point visé par raycast
            const rect = canvas.getBoundingClientRect();
            const mx = ((clientX - rect.left) / rect.width) * 2 - 1;
            const my = -((clientY - rect.top) / rect.height) * 2 + 1;
            const tmpMouse = new THREE.Vector2(mx, my);
            this.raycaster.setFromCamera(tmpMouse, this.camera);
            const hits = this.raycaster.intersectObject(this.sphereDay || this.sphereNight);
            if (!hits.length) return;

            // Pour que la caméra regarde le point `pt` tout en regardant l'origine (OrbitControls),
            // elle doit être positionnée exactement de l'autre côté de la sphère par rapport à ce point.
            const ptOpposite = hits[0].point.clone().negate().normalize();
            const targetSpherical = new THREE.Spherical().setFromVector3(ptOpposite);
            this.controls.target.set(0, 0, 0);

            // Lerp smooth vers le point double-cliqué
            const startAz = this.controls.getAzimuthalAngle();
            const startPol = this.controls.getPolarAngle();
            const endAz = targetSpherical.theta;
            const endPol = targetSpherical.phi;
            let t = 0;
            if (this._zoomLerpId) cancelAnimationFrame(this._zoomLerpId);

            const lerp = () => {
                t = Math.min(t + 0.06, 1);
                const ease = 1 - Math.pow(1 - t, 3); // Ease-out cubic
                const az = startAz + (endAz - startAz) * ease;
                const pol = Math.max(Math.PI * 0.25, Math.min(Math.PI * 0.75, startPol + (endPol - startPol) * ease));
                // Déplace le target en sphérique
                this.camera.position.setFromSphericalCoords(0.1, pol, az);
                this.controls.update();

                // Zoom FOV
                this.camera.fov = this.camera.fov + (targetZoomFov - this.camera.fov) * ease;
                this.camera.updateProjectionMatrix();
                if (t < 1) this._zoomLerpId = requestAnimationFrame(lerp);
            };
            lerp();
            this._zoomActive = true;
        };

        // Desktop : double-clic
        canvas.addEventListener('dblclick', (e) => {
            if (this._zoomActive) {
                // Dézoom au deuxième double-clic
                this._zoomActive = false;
                return;
            }
            doZoom(e.clientX, e.clientY);
        });

        // Mobile : detection double-tap avec délai < 300ms
        canvas.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - this._lastTap < 300 && e.changedTouches.length === 1) {
                if (this._zoomActive) { this._zoomActive = false; return; }
                doZoom(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
            this._lastTap = now;
        });

        // Retour au FOV normal dès que l'utilisateur bouge la caméra manuellement
        this.controls.addEventListener('start', () => {
            if (this._zoomActive) {
                this._zoomActive = false;
            }
        });
    }




    _playVoice(poi, explicitTrans = null, explicitAudio = null, onComplete = null) {
        this.state.playingVoicePoi = poi;
        if (poi._uiObj) {
            poi._uiObj.audUI.style.display = 'flex';
            // Modifier dynamiquement le texte par la version arabe
            const speakerName = (poi.content && poi.content.fr && poi.content.fr.title) ? poi.content.fr.title : "Inconnu";
            const audText = poi._uiObj.audUI.querySelector('.aud-ui-text');
            if (audText) {
                if (poi.poiType === 'character') {
                    audText.innerText = speakerName + " قالت";
                } else {
                    audText.innerText = "الراوي قال";
                }
            }

            // Afficher la caption
            if (poi._uiObj.caption) {
                poi._uiObj.caption.style.display = 'block';
                poi._uiObj.caption.textContent = '';
            }
        }
        if (this.els.btnStop) this.els.btnStop.style.display = 'inline-flex';

        // Utilisation du chemin complet (peut être dans un sous-dossier ou specifié dans la réplique)
        const audioPath = explicitAudio !== null ? explicitAudio : poi.audio;
        const narCh = tracaAudio.channels.narration;
        
        // Utilisation du Blob URL préchargé si disponible pour zéro latence
        if (this.preloadedAudios && this.preloadedAudios[audioPath]) {
            narCh.src = this.preloadedAudios[audioPath];
        } else {
            narCh.src = '/assets/audio/' + audioPath;
        }
        
        narCh.volume = tracaAudio.volumes.narration;
        narCh.play().catch(e => console.warn('Narration bloquée:', e));
        tracaAudio.currentNarration = audioPath;
        tracaAudio._duckMusic();

        // Caption animée (Transcription narrative)
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

        // Arrêt propre via TracaAudio
        const narCh = tracaAudio.channels.narration;
        narCh.onended = null; // Prevent false completions
        tracaAudio.stopNarration();

        if (this.els.btnStop) this.els.btnStop.style.display = 'none';
        this.state.playingVoicePoi = null;

        this._stopCaption();

        // ✅ Réafficher TOUS les autres points après fin de lecture
        const currentMode = this.state.isNight ? 'night' : 'day';
        this.state.pois.forEach(p => {
            if (p._uiObj && (p.timeMode || 'day') === currentMode) {
                p._uiObj.dot.style.opacity = '1';
                p._uiObj.dot.style.pointerEvents = 'auto';
                p._uiObj.dot.style.display = 'block';
            }
        });
    }

    /* ══════════════════════════════════════════════════════════
       CAPTION ANIMÉE (sous-titres synchronisés)
    ══════════════════════════════════════════════════════════ */
    _startCaption(poi, text, audioEl) {
        this._stopCaption();
        if (!poi._uiObj?.caption || !text) return;

        const caption = poi._uiObj.caption;
        const words = text.trim().split(/\s+/);
        if (!words.length) return;

        caption.innerHTML = '';
        caption.style.opacity = '1';

        let wordIdx = 0;
        const baseMsPerWord = 350;

        const advanceWord = () => {
            if (wordIdx >= words.length || audioEl.ended) {
                this._stopCaption();
                return;
            }

            if (audioEl.paused) {
                // Si en pause, on réessaie un peu plus tard sans avancer l'index
                this._captionTimer = setTimeout(advanceWord, 100);
                return;
            }

            const s = document.createElement('span');
            const word = words[wordIdx];
            s.textContent = word + ' ';

            // Animation d'apparition du mot
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

            // Scroll vers le bas si nécessaire
            const targetScroll = caption.scrollHeight;
            if (caption.scrollTop < targetScroll) {
                caption.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }

            // Calcul du délai pour le prochain mot basé sur la ponctuation
            let bonusDelay = 0;
            if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) bonusDelay = 400;
            else if (word.endsWith(',')) bonusDelay = 200;

            wordIdx++;
            
            // Planifier le prochain mot
            this._captionTimer = setTimeout(advanceWord, baseMsPerWord + bonusDelay);
        };

        const startLoop = () => {
            tracaAudio.unlockAudioContext();
            advanceWord(); // Démarre le cycle
        };

        if (audioEl.readyState >= 1) {
            startLoop();
        } else {
            audioEl.addEventListener('loadedmetadata', startLoop, { once: true });
            // Fallback si l'événement ne s'assure pas
            setTimeout(() => { if (wordIdx === 0) startLoop(); }, 500);
        }
    }

    _stopCaption() {
        if (this._captionTimer) { clearTimeout(this._captionTimer); this._captionTimer = null; }
        if (this._captionRaf) { cancelAnimationFrame(this._captionRaf); this._captionRaf = null; }
        // CORRIGÉ v2 : Plus de AudioContext local à fermer ici.
        // Le contexte audio est géré exclusivement par TracaAudio (singleton).
        // ANCIENNE LOGIQUE (commentée pour référence) :
        // if(this._captionAudioCtx && this._captionAudioCtx.state !== 'closed') {
        //     try { this._captionAudioCtx.close(); } catch(e) {}
        //     this._captionAudioCtx = null;
        // }
    }

    // (Compass APIs removed as per V6 requirements)

    /* ══════════════════════════════════════════════════════════
       TIME TRAVEL CINEMATIC (MULTIVERS)
    ══════════════════════════════════════════════════════════ */
    _updatePoiVisibility() {
        const curTime = this.state.isNight ? 'night' : 'day';
        this.state.pois.forEach(p => {
            if (p._uiObj && p._uiObj.dot) {
                const pTime = p.timeMode || 'day';
                if (pTime === curTime) {
                    // ✅ Réactiver complètement
                    p._uiObj.dot.style.display = 'block';
                    p._uiObj.dot.style.opacity = '1';
                    p._uiObj.dot.style.pointerEvents = 'auto';
                } else {
                    // ❌ Masquer et désactiver
                    p._uiObj.dot.style.display = 'none';
                    p._uiObj.dot.style.opacity = '0';
                    p._uiObj.dot.style.pointerEvents = 'none';
                    // Fermer la popup si elle était ouverte
                    if (p._uiObj.pop) p._uiObj.pop.classList.remove('visible');
                }
            }
        });
    }

    _timeTravelToggle() {
        if (!this.sphereDay || !this.sphereNight) return;
        if (this.state.isTraveling) return; // Anti-double clic
        this.state.isTraveling = true;

        const ttBtn = document.getElementById('btn-time-travel');
        const ttLabel = ttBtn?.querySelector('.tt-label');
        const flash = this.els.timeFlash;

        // Nettoie tout filtre CSS résiduel sur le canvas
        this.els.webglWrap.style.transition = '';
        this.els.webglWrap.style.filter = '';

        // --- Blocage du bouton pendant TOUTE la transition ---
        if (ttBtn) ttBtn.style.pointerEvents = 'none';

        // --- 1. SFX Time Warp (une seule fois) ---
        tracaAudio.playSFX('time_warp.mp3');

        // --- 2. Fade NOIR cinématique vers 1 (600ms) ---
        flash.style.transition = 'opacity 0.6s ease';
        flash.style.opacity = '1';

        // --- 3. Swap à 600ms (pic du noir total) ---
        setTimeout(() => {
            this.state.isNight = !this.state.isNight;
            Analytics.trackTimeTravel(this.state.isNight ? 'night' : 'day');

            // Mise à jour de UI Editor
            if (this.els.btnEdTime) {
                this.els.btnEdTime.innerHTML = this.state.isNight ? '🌙 Nuit' : '☀️ Jour';
            }

            if (this.state.isNight) {
                this.sphereDay.material.opacity = 0;
                this.sphereNight.material.opacity = 1;
                if (ttBtn) { ttBtn.classList.remove('is-day'); ttBtn.classList.add('is-night'); }
                if (ttLabel) ttLabel.textContent = 'Mode Nuit';
                this.els.hud.classList.add('night-mode');

                // Crossfade audio vers Nuit
                if (this.state.mode === 'VIEW') {
                    tracaAudio.playMusic('casbah_night_music_01.mp3', 3);
                    tracaAudio.playAmbience('night/02_ambience_night.mp3', 3);
                }
            } else {
                this.sphereDay.material.opacity = 1;
                this.sphereNight.material.opacity = 0;
                if (ttBtn) { ttBtn.classList.remove('is-night'); ttBtn.classList.add('is-day'); }
                if (ttLabel) ttLabel.textContent = 'Mode Jour';
                this.els.hud.classList.remove('night-mode');

                // Crossfade audio vers Jour
                if (this.state.mode === 'VIEW') {
                    tracaAudio.playMusic('casbah_day_music_01.mp3', 3);
                    tracaAudio.playAmbience('day/01_ambience_day.mp3', 3);
                }
            }

            // Met à jour la visibilité 3D et reconstruit la sidebar éditeur
            this._updatePoiVisibility();
            if (this.state.mode === 'EDIT') this._renderEditorList();

            // --- 4. Fade de révélation (noir → transparent, 800ms) ---
            flash.style.transition = 'opacity 0.8s ease';
            flash.style.opacity = '0';

            // Libère le guard et réactive le bouton après la fin complète
            setTimeout(() => {
                this.state.isTraveling = false;
                if (ttBtn) ttBtn.style.pointerEvents = 'auto'; // Réactivation du bouton
            }, 900);

        }, 600);
    }

    // Outil pour charger le format day/night en `this.state.pois` unifié
    _processLoadedData(data) {
        this.state.scenarioData = data;
        let pArray = [];

        // Format root .pois (Static Export V10)
        if (data.pois && Array.isArray(data.pois)) {
            data.pois.forEach(p => pArray.push(p));
        }

        // Nouveau format day/night (si résiduel)
        if (data.day && Array.isArray(data.day.points)) {
            data.day.points.forEach(p => { p.timeMode = 'day'; pArray.push(p); });
        }
        if (data.night && Array.isArray(data.night.points)) {
            data.night.points.forEach(p => { p.timeMode = 'night'; pArray.push(p); });
        }

        // Backward compatibility: ancien format chapters -> on les force en jour
        if (data.chapters && Array.isArray(data.chapters)) {
            data.chapters.forEach(p => { p.timeMode = 'day'; pArray.push(p); });
        }

        if (pArray.length > 0) {
            this.state.pois = pArray;
            this.state.pois.forEach(p => this._buildHtmlPoi(p));
            this._updateAllPoiTexts();
            this._updatePoiVisibility(); // Cache les POI de nuit si isNight = false
        }

        if (data.audioNodes) {
            this.state.audioNodes = data.audioNodes;
            this.state.audioNodes.forEach(a => this._buildHtmlAudioNode(a));
        }
    }

    async _loadSavedPois() {
        // --- 1. DONNÉES HARDCODÉES — ZÉRO DÉPENDANCE EXTERNE ---
        // Le scénario est intégré directement dans le code source via
        // la constante CASBAH_SCENARIO définie en haut de ce fichier.
        // Aucun fetch, aucun JSON, aucun cache. Les POI sont TOUJOURS présents.
        // --- 1. DONNÉES HARDCODÉES — ZÉRO DÉPENDANCE EXTERNE ---
        try {
            this._processLoadedData(CASBAH_SCENARIO);
            if (!this.state.scenarioData) this.state.scenarioData = {};
            if (!this.state.scenarioData.settings) this.state.scenarioData.settings = CASBAH_SCENARIO.settings || {};
            console.info('[POI] Scénario Casbah chargé. ' + CASBAH_SCENARIO.pois.length + ' POI(s) prêts.');
        } catch (e) {
            console.error('[POI] Erreur critique lors du chargement du scénario Casbah !', e);
            if (!this.state.scenarioData) this.state.scenarioData = { chapters: [], audioNodes: [], settings: {} };
        }

        // --- 2. Peupler les dropdowns audio ---
        this._populateAudioDropdown();
    }


    _toggleGyro() {
        if (!this.state.gyroMode) {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') { this._enableGyro(); }
                        else { alert("Permission refusée pour le gyroscope."); }
                    })
                    .catch(console.error);
            } else {
                this._enableGyro();
            }
        } else {
            this.state.gyroMode = false;
            this.gyroControls.enabled = false;
            this.controls.enabled = true;
            if (this.els.btnGyro) this.els.btnGyro.style.color = 'currentColor';
        }
    }

    _enableGyro() {
        if (!this.gyroControls) {
            this.gyroControls = new DeviceOrientationControls(this.camera);
        }
        this.state.gyroMode = true;
        this.controls.enabled = false;
        this.gyroControls.enabled = true;
        if (this.els.btnGyro) this.els.btnGyro.style.color = '#e7ba80';
    }

    _closeRewardPopup(addToInventory) {
        const popup = this.els.rewardPopup;
        if (popup) {
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -50%) scale(0.85)';
            setTimeout(() => popup.style.display = 'none', 500);
        }
        this.state.targetFov = this.baseFov;
        if (addToInventory) console.log('Artéfact ajouté à l’inventaire !');
    }

    /* ══════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════ */
    _animate() {
        requestAnimationFrame(this._animate.bind(this));

        if (this.state.gyroMode && this.gyroControls && this.gyroControls.enabled) {
            this.gyroControls.update();
        } else if (this.controls && this.controls.enabled) {
            this.controls.update();
        }

        // --- Eagle Vision: Canvas-based organic effect ---
        if (!this.state.hiddenObjectFound && this.els.eagleCanvas) {
            const targetAz = 2.5, targetPol = 1.3;
            const tx = Math.sin(targetPol) * Math.cos(targetAz);
            const ty = Math.cos(targetPol);
            const tz = Math.sin(targetPol) * Math.sin(targetAz);
            const targetDir = new THREE.Vector3(tx, ty, tz).normalize();

            const camDir = new THREE.Vector3();
            this.camera.getWorldDirection(camDir);
            const dot = camDir.normalize().dot(targetDir);

            if (dot > 0.82) {
                const intensity = Math.min(1, (dot - 0.82) / (0.98 - 0.82));
                this._drawEagleVision(intensity);
                this.els.eagleCanvas.classList.add('active');

                if (dot > 0.98) {
                    if (!this.state.isFocusing) {
                        this.state.isFocusing = true;
                        // Utilise tracaAudio (canal loop pré-débloqué) au lieu de new Audio()
                        tracaAudio.playLoopSFX('sfx_magical_focus.mp3', 0.5);
                    }
                    this.state.hiddenObjectTimer += 16;
                    if (this.state.hiddenObjectTimer > 2000) {
                        this._triggerReveal();
                    }
                } else {
                    this.state.hiddenObjectTimer = 0;
                    this._stopFocusAudio();
                }
            } else {
                this.state.hiddenObjectTimer = 0;
                this._stopFocusAudio();
                this.els.eagleCanvas.classList.remove('active');
                this._clearEagleCanvas();
            }
        }

        // Smooth FOV transition
        if (this.state.targetFov !== null) {
            this.camera.fov += (this.state.targetFov - this.camera.fov) * 0.08;
            if (Math.abs(this.camera.fov - this.state.targetFov) < 0.1) {
                this.camera.fov = this.state.targetFov;
                if (Math.abs(this.state.targetFov - this.baseFov) < 0.1) {
                    this.state.targetFov = null;
                }
            }
            this.camera.updateProjectionMatrix();
        }

        if (this.particles) {
            this.particles.rotation.y += 0.0003;
            this.particles.rotation.z += 0.0001;
        }

        // Smart Zoom: retour progressif au FOV original
        if (!this._zoomActive && this.state.targetFov === null && this.camera.fov !== this.baseFov) {
            this.camera.fov += (this.baseFov - this.camera.fov) * 0.05;
            if (Math.abs(this.camera.fov - this.baseFov) < 0.1) this.camera.fov = this.baseFov;
            this.camera.updateProjectionMatrix();
        }

        if (this.renderer) this.renderer.render(this.scene, this.camera);
        if (this.cssRenderer) this.cssRenderer.render(this.scene, this.camera);
    }

    _stopFocusAudio() {
        if (this.state.isFocusing) {
            tracaAudio.stopLoopSFX(); // Utilise tracaAudio (canal loop pré-débloqué)
            this.state.isFocusing = false;
        }
    }

    _clearEagleCanvas() {
        if (!this.eagleCtx) return;
        const c = this.els.eagleCanvas;
        this.eagleCtx.clearRect(0, 0, c.width, c.height);
    }

    /**
     * Dessine l'effet Eagle Vision organique sur le canvas 2D.
     * Couches : vignette noir, masque BW (via saturation simulée en noir-blanc avec du noir),
     * anneaux de concentration animés, particules dorées, halo pulsant central.
     */
    _drawEagleVision(intensity) {
        const c = this.els.eagleCanvas;
        if (!this.eagleCtx) {
            c.width = window.innerWidth;
            c.height = window.innerHeight;
            this.eagleCtx = c.getContext('2d');
        }
        if (c.width !== window.innerWidth || c.height !== window.innerHeight) {
            c.width = window.innerWidth;
            c.height = window.innerHeight;
        }

        const ctx = this.eagleCtx;
        const W = c.width, H = c.height;
        const cx = W / 2, cy = H / 2;
        const t = performance.now();

        ctx.clearRect(0, 0, W, H);

        // 1. Vignette noire radiale — s'intensifie au bord
        const vRadius = Math.min(W, H) * (0.7 - intensity * 0.35);
        const vGrad = ctx.createRadialGradient(cx, cy, vRadius * 0.2, cx, cy, Math.max(W, H) * 0.75);
        vGrad.addColorStop(0, `rgba(0,0,0,0)`);
        vGrad.addColorStop(0.5, `rgba(0,0,0,${intensity * 0.5})`);
        vGrad.addColorStop(1, `rgba(0,0,0,${0.55 + intensity * 0.4})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, W, H);

        // 2. Noir & Blanc simulé: surcouche noire sur les bords pour "brûler" les couleurs
        const bwGrad = ctx.createRadialGradient(cx, cy, vRadius * 0.3, cx, cy, Math.max(W, H) * 0.6);
        bwGrad.addColorStop(0, `rgba(0,0,0,0)`);
        bwGrad.addColorStop(0.6, `rgba(0,0,0,0)`);
        bwGrad.addColorStop(1, `rgba(20,15,5,${intensity * 0.85})`);
        ctx.fillStyle = bwGrad;
        ctx.fillRect(0, 0, W, H);

        if (intensity < 0.05) return; // Pas d'effets décoratifs si à peine visible

        // 3. Anneaux de concentration pulsants (organiques, légèrement décalés)
        const numRings = 3;
        for (let i = 0; i < numRings; i++) {
            const speed = 0.0008 + i * 0.0003;
            const phase = (t * speed + i * 0.6) % 1;
            const ringR = vRadius * (0.15 + phase * 0.85);
            const alpha = (1 - phase) * intensity * 0.25;
            if (alpha < 0.005) continue;

            const pulse = 1 + Math.sin(t * 0.003 + i) * 0.015;
            ctx.beginPath();
            ctx.arc(
                cx + Math.sin(t * 0.0007 + i) * 4,
                cy + Math.cos(t * 0.0009 + i) * 4,
                ringR * pulse, 0, Math.PI * 2
            );
            ctx.strokeStyle = `rgba(231, 186, 128, ${alpha})`;
            ctx.lineWidth = 1.5 - phase;
            ctx.stroke();
        }

        // 4. Halo doré central pulsant (fort = proche de la cible)
        const haloR = vRadius * (0.12 + Math.sin(t * 0.004) * 0.03);
        const haloAlpha = intensity * (0.3 + Math.sin(t * 0.004) * 0.15);
        const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
        haloGrad.addColorStop(0, `rgba(231,186,128,${haloAlpha})`);
        haloGrad.addColorStop(0.5, `rgba(181,136,78,${haloAlpha * 0.4})`);
        haloGrad.addColorStop(1, `rgba(0,0,0,0)`);
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
        ctx.fill();

        // 5. Particules dorées (spirale lente vers le centre)
        if (!this._eagleParticles) {
            this._eagleParticles = Array.from({ length: 28 }, (_, i) => ({
                angle: Math.random() * Math.PI * 2,
                radius: 0.3 + Math.random() * 0.65,
                speed: (0.0004 + Math.random() * 0.0006) * (Math.random() > 0.5 ? 1 : -1),
                size: 1.5 + Math.random() * 2.5,
                opacity: 0.3 + Math.random() * 0.5,
                offset: Math.random() * Math.PI * 2
            }));
        }
        this._eagleParticles.forEach(p => {
            p.angle += p.speed;
            const r = vRadius * p.radius * (1 - intensity * 0.3);
            const px = cx + Math.cos(p.angle) * r;
            const py = cy + Math.sin(p.angle) * r;
            const flicker = 0.6 + Math.sin(t * 0.005 + p.offset) * 0.4;
            ctx.beginPath();
            ctx.arc(px, py, p.size * intensity, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(231,186,128,${p.opacity * intensity * flicker})`;
            ctx.fill();
        });

        // 6. Barre de progression verticale (si en cours de "lock")
        if (this.state.hiddenObjectTimer > 0) {
            const progress = Math.min(1, this.state.hiddenObjectTimer / 2000);
            const barH = H * 0.3;
            const barY = cy - barH / 2;
            const barX = W - 28;
            const barW = 4;

            // Track
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW, barH, 2);
            ctx.fillStyle = `rgba(100,80,50,0.3)`;
            ctx.fill();

            // Fill
            const fillH = barH * progress;
            ctx.beginPath();
            ctx.roundRect(barX, barY + barH - fillH, barW, fillH, 2);
            const barGrad = ctx.createLinearGradient(0, barY + barH - fillH, 0, barY + barH);
            barGrad.addColorStop(0, `rgba(231,186,128,0.9)`);
            barGrad.addColorStop(1, `rgba(255,220,140,1)`);
            ctx.fillStyle = barGrad;
            ctx.fill();

            // Glow tip
            ctx.beginPath();
            ctx.arc(barX + barW / 2, barY + barH - fillH, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,220,140,0.8)`;
            ctx.fill();
        }
    }

    _triggerReveal() {
        this.state.hiddenObjectFound = true;
        this._stopFocusAudio();

        // Effacer le canvas proprement
        this.els.eagleCanvas.classList.remove('active');
        this._clearEagleCanvas();

        // Shake cinématique
        document.body.classList.add('shake-active');
        setTimeout(() => document.body.classList.remove('shake-active'), 700);

        // Zoom in spectaculaire → dézoom doux géré par targetFov
        this.camera.fov = this.baseFov - 20;
        this.camera.updateProjectionMatrix();
        this.state.targetFov = this.baseFov;

        // Son de révélation
        tracaAudio.playSFX('sfx_reveal_artifact.mp3');

        // Popup apparaît avec délai léger
        const popup = this.els.rewardPopup;
        if (popup) {
            popup.style.display = 'block';
            setTimeout(() => {
                popup.style.opacity = '1';
                popup.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
        }
    }
}




document.addEventListener('DOMContentLoaded', () => {
    const app = new CasbahExperience();
    window.__casbahApp = app;
    window.app = app; // Pour les boutons inline du popup
});
