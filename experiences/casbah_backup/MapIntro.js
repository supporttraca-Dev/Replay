/**
 * MapIntro — Séquence carte d'introduction (CSS/HTML pur)
 * 
 * Architecture :
 * - Overlay HTML fullscreen sur le canvas WebGL (zIndex élevé)
 * - POIs en coordonnées UV (0→1) relatives à l'image → jamais de flottement
 * - Parallaxe CSS simple sur la souris (transform: translate)
 * - Nuages en multicouches CSS animées
 * - Dive : animation CSS + fondu + lancement Casbah
 */
export class MapIntro {
    constructor(core) {
        this.core = core;
        this.active = false;
        this.isDiving = false;

        // Coefficients de parallaxe (px max de déplacement)
        this.PAR_MAP = 35;  // image de fond
        this.PAR_CLOUD1 = 55;  // couche 1 — plus lente
        this.PAR_CLOUD2 = 80;  // couche 2 — plus rapide

        // Mouse position normalisée -1 → +1
        this._mx = 0;
        this._my = 0;
        this._cx = 0; // current (lerped)
        this._cy = 0;

        // Animation frame
        this._raf = null;

        // POIs en coordonnées UV (left%, top%) relatives à l'image map
        // Ajustées pour coller exactement à la géographie de la carte
        this.poiData = [
            { id: 'casbah', uv: { l: 48, t: 45 }, locked: false, title: 'La Casbah' },
            { id: 'bab_el_oued', uv: { l: 33, t: 27 }, locked: true, title: 'Bab El Oued' },
            { id: 'bologhine', uv: { l: 73, t: 18 }, locked: true, title: 'Bologhine' },
            { id: 'ketchaoua', uv: { l: 36, t: 68 }, locked: true, title: 'Ketchaoua' },
            { id: 'pecherie', uv: { l: 60, t: 68 }, locked: true, title: 'La Pêcherie' },
            { id: 'el_djazair', uv: { l: 50, t: 31 }, locked: true, title: 'El Djazair' },
        ];

        this._buildDOM();
        this._bindEvents();

        // Audio
        this.audioWind = new Audio('../../assets/audio/ambience/night/ambiance night 1.mp3');
        this.audioWind.loop = true;
        this.audioWind.volume = 0;
        
        this.audioClick = new Audio('/assets/audio/ui/click.mp3');         // Clic UI standard
        this.audioClick.load();
        
        this.audioEnter = new Audio('/assets/audio/ui/enter.mp3');         // Clic POI valide (plongeon)
        this.audioEnter.load();
        
        this.audioError = new Audio('/assets/audio/ui/error.mp3');         // Clic POI verrouillé
        this.audioError.load();
        
        // S'assure que les fichiers optionnels ne bloquent pas si absents
        this.audioEnter.onerror = () => { this.audioEnter = this.audioClick; };
        this.audioError.onerror = () => { this.audioError = this.audioClick; };
    }

    // ─────────────────────────────────────────────────────────────────────
    //  DOM
    // ─────────────────────────────────────────────────────────────────────
    _buildDOM() {
        // --- Wrapper principal (fullscreen overlay) ---
        this.wrap = document.createElement('div');
        this.wrap.id = 'map-intro';
        this.wrap.style.cssText = `
            position:fixed; inset:0; z-index:5000;
            display:none; overflow:hidden;
            background:#0d1a2a;
            font-family:'Cinzel',serif;
        `;

        // --- Stage : contient map + nuages + POIs, pivoté par le parallaxe ---
        this.stage = document.createElement('div');
        this.stage.id = 'map-stage';
        this.stage.style.cssText = `
            position:absolute; inset:0;
            display:flex; align-items:center; justify-content:center;
        `;

        // --- Image map (zoomée 1.30 pour permettre le glissement sans bords blancs) ---
        this.imgMap = document.createElement('div');
        this.imgMap.id = 'map-image';
        this.imgMap.style.cssText = `
            position:absolute;
            width:130%; height:130%;
            top:-15%; left:-15%;
            background: url('../../assets/images/map.png') center/cover no-repeat;
            will-change:transform;
            transition: transform 0.08s linear;
        `;

        // --- Nuage layer 1 (lent — multiply rend le blanc transparent) ---
        this.cloud1 = document.createElement('div');
        this.cloud1.id = 'map-cloud1';
        this.cloud1.style.cssText = `
            position:absolute; inset:-20%;
            width:140%; height:140%;
            background: url('../../assets/images/clouds.png') center/55% repeat;
            opacity:0.6;
            mix-blend-mode:multiply;
            will-change:transform;
            pointer-events:none;
        `;

        // --- Nuage layer 2 (rapide, plùs grande — profondeur) ---
        this.cloud2 = document.createElement('div');
        this.cloud2.id = 'map-cloud2';
        this.cloud2.style.cssText = `
            position:absolute; inset:-20%;
            width:140%; height:140%;
            background: url('../../assets/images/clouds.png') 30% 50%/85% repeat;
            opacity:0.4;
            mix-blend-mode:multiply;
            will-change:transform;
            pointer-events:none;
        `;

        // --- Nuage layer 3 (voile atmospherique — teinte bleu-gris) ---
        this.cloud3 = document.createElement('div');
        this.cloud3.id = 'map-cloud3';
        this.cloud3.style.cssText = `
            position:absolute; inset:-20%;
            width:140%; height:140%;
            background: url('../../assets/images/clouds.png') 70% 20%/100% repeat;
            opacity:0.25;
            mix-blend-mode:multiply;
            filter: hue-rotate(190deg) saturate(3);
            will-change:transform;
            pointer-events:none;
        `;

        // --- Ombre nuages (layer en dessous, décalée, sombre) ---
        this.cloudShadow = document.createElement('div');
        this.cloudShadow.id = 'map-cloud-shadow';
        this.cloudShadow.style.cssText = `
            position:absolute; inset:-20%;
            width:140%; height:140%;
            background: url('../../assets/images/clouds.png') center/60% repeat;
            opacity:0.22;
            mix-blend-mode:multiply;
            filter:brightness(0.2) saturate(0);
            will-change:transform;
            pointer-events:none;
        `;

        // --- Container POIs (overlay sur la map, même taille que imgMap) ---
        this.poiLayer = document.createElement('div');
        this.poiLayer.id = 'map-poi-layer';
        this.poiLayer.style.cssText = `
            position:absolute;
            width:130%; height:130%;
            top:-15%; left:-15%;
            will-change:transform;
            pointer-events:none;
        `;

        // --- Vignette overlay (bords assombris) ---
        const vignette = document.createElement('div');
        vignette.style.cssText = `
            position:absolute; inset:0; pointer-events:none; z-index:10;
            background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 35%, rgba(13,26,42,0.7) 100%);
        `;

        // --- Titre en haut --- 
        const title = document.createElement('div');
        title.style.cssText = `
            position:absolute; top:0; left:0; right:0;
            z-index:20; text-align:center; pointer-events:none;
            padding: 24px 20px 40px;
            background: linear-gradient(to bottom, rgba(13,26,42,0.85) 0%, transparent 100%);
        `;
        title.innerHTML = `
            <div style="font-size:0.65rem; color:#e7ba80; letter-spacing:5px; text-transform:uppercase; opacity:.7; margin-bottom:6px;">
                Visite Virtuelle · Circuit Historique
            </div>
            <div style="font-size:1.8rem; font-weight:600; color:#fff; text-shadow:0 4px 20px rgba(0,0,0,0.8); letter-spacing:3px; font-family:'Cinzel',serif;">
                La Casbah <em style="font-style:italic; color:#e7ba80">d'Alger</em>
            </div>
            <div style="font-size:0.65rem; color:rgba(255,255,255,0.35); letter-spacing:3px; margin-top:5px; text-transform:uppercase; font-family:'Cinzel',serif;">
                Patrimoine Mondial de l'Humanité · UNESCO 1992
            </div>
        `;

        // --- Instruction bas ---
        const hint = document.createElement('div');
        hint.style.cssText = `
            position:absolute; bottom:6%; left:50%; transform:translateX(-50%);
            z-index:20; text-align:center; pointer-events:none;
            color:rgba(255,255,255,0.4); font-size:0.75rem; letter-spacing:3px;
            text-transform:uppercase;
            animation: hint-pulse 2.5s ease-in-out infinite;
        `;
        hint.innerText = 'Cliquez sur un point actif pour démarrer';

        // Ajouter les POIs
        this._buildPOIs();

        // --- Bouton retour au menu principal ---
        const btnBackMenu = document.createElement('button');
        btnBackMenu.id = 'map-btn-back-menu';
        btnBackMenu.style.cssText = `
            position: absolute;
            top: 20px; left: 20px;
            z-index: 30;
            display: flex; align-items: center; gap: 8px;
            padding: 10px 18px;
            font-family: 'Cinzel', serif;
            font-size: 0.72rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: rgba(231, 186, 128, 0.85);
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(231, 186, 128, 0.25);
            border-radius: 6px;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.2s ease;
        `;
        btnBackMenu.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
            </svg>
            Menu
        `;
        btnBackMenu.addEventListener('mouseenter', () => {
            btnBackMenu.style.color = '#e7ba80';
            btnBackMenu.style.borderColor = 'rgba(231,186,128,0.6)';
            btnBackMenu.style.background = 'rgba(0,0,0,0.7)';
        });
        btnBackMenu.addEventListener('mouseleave', () => {
            btnBackMenu.style.color = 'rgba(231,186,128,0.85)';
            btnBackMenu.style.borderColor = 'rgba(231,186,128,0.25)';
            btnBackMenu.style.background = 'rgba(0,0,0,0.5)';
        });
        btnBackMenu.addEventListener('click', () => this._returnToMenu());

        this.stage.appendChild(this.imgMap);
        this.stage.appendChild(this.poiLayer);
        this.stage.appendChild(vignette);
        this.stage.appendChild(title);
        this.stage.appendChild(hint);
        this.stage.appendChild(btnBackMenu);

        this.wrap.appendChild(this.stage);

        // --- CSS animations ---
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            @keyframes hint-pulse {
                0%,100% { opacity:.3; } 50% { opacity:.8; }
            }
            @keyframes cloud-scroll1 {
                from { background-position: 0% 0%; }
                to   { background-position: 100% 10%; }
            }
            @keyframes cloud-scroll2 {
                from { background-position: 30% 50%; }
                to   { background-position: 130% 60%; }
            }
            @keyframes cloud-shadow-scroll {
                from { background-position: 0% 0%; }
                to   { background-position: 100% 10%; }
            }
            @keyframes poi-active-pulse {
                0%,100% { box-shadow: 0 0 12px 4px rgba(231,76,60,0.6), inset 0 0 6px rgba(255,255,255,0.4); transform:scale(1); }
                50% { box-shadow: 0 0 24px 10px rgba(231,76,60,0.9), inset 0 0 12px rgba(255,255,255,0.7); transform:scale(1.15); }
            }
            @keyframes poi-ring-expand {
                0%  { transform:translate(-50%,-50%) scale(1); opacity:.7; }
                100%{ transform:translate(-50%,-50%) scale(3); opacity:0; }
            }
            @keyframes poi-shake {
                0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
                25% { transform: translate(-50%, -50%) rotate(-10deg) translateX(-4px); }
                50% { transform: translate(-50%, -50%) rotate(10deg) translateX(4px); }
                75% { transform: translate(-50%, -50%) rotate(-10deg) translateX(-4px); }
            }
            #map-cloud1 {
                animation: cloud-scroll1 90s linear infinite;
            }
            #map-cloud2 {
                animation: cloud-scroll2 60s linear infinite;
            }
            #map-cloud3 {
                animation: cloud-scroll2 75s linear infinite reverse;
            }
            #map-cloud-shadow {
                animation: cloud-shadow-scroll 90s linear infinite;
            }
            .map-poi-btn {
                position:absolute;
                transform: translate(-50%, -50%);
                cursor:pointer;
                pointer-events:all;
                display:flex; flex-direction:column; align-items:center;
                gap:8px;
                transition: transform .2s ease;
                user-select:none;
            }
            .map-poi-btn:hover { transform: translate(-50%, -50%) scale(1.1); }
            .map-poi-btn.shake {
                animation: poi-shake 0.4s ease-in-out;
            }
            .map-poi-dot {
                width:22px; height:22px; border-radius:50%;
                border:2px solid rgba(255,255,255,0.3);
                background:rgba(44,62,80,0.9);
                backdrop-filter:blur(4px);
                display: flex; align-items:center; justify-content:center;
                font-size: 10px; line-height: 1;
            }
            .map-poi-dot.is-active {
                background: radial-gradient(circle, #e74c3c 0%, #d35400 60%);
                border:2px solid #f1c40f;
                animation: poi-active-pulse 2.2s ease-in-out infinite;
            }
            .map-poi-dot.is-locked { 
                opacity: 0.85; 
                cursor: not-allowed; 
                border-color: rgba(255,255,255,0.1); 
            }
            .map-poi-dot.is-locked::after {
                content: '🔒';
                opacity: 0.8;
                font-size: 11px;
            }
            .map-poi-ring {
                position:absolute; top:50%; left:50%;
                width:22px; height:22px; border-radius:50%;
                border:2px solid rgba(231,76,60,0.8);
                animation: poi-ring-expand 2.2s ease-out infinite;
                pointer-events:none;
            }
            .map-poi-label {
                font-family:'Cinzel',serif;
                font-size:.7rem; letter-spacing:2px;
                text-transform:uppercase;
                color:#fff; opacity:.75;
                text-shadow:0 2px 8px rgba(0,0,0,0.9);
                white-space:nowrap;
                background:rgba(0,0,0,0.35);
                padding:3px 10px; border-radius:3px;
            }
            .map-poi-dot.is-active + .map-poi-label {
                color:#e7ba80; opacity:1;
            }
            .map-poi-dot.is-locked { opacity:0.5; cursor:not-allowed; }
            #map-intro-fadeout {
                position:fixed; inset:0; z-index:9999;
                background:#0d1a2a; opacity:0; pointer-events:none;
                transition: opacity .9s ease-in;
            }
            #map-intro-fadeout.show { opacity:1; }
        `;
        document.head.appendChild(styleEl);

        document.body.appendChild(this.wrap);
    }

    _buildPOIs() {
        this.poiEls = {};
        this.poiData.forEach(p => {
            const btn = document.createElement('div');
            btn.className = 'map-poi-btn';
            btn.style.left = p.uv.l + '%';
            btn.style.top = p.uv.t + '%';
            btn.dataset.id = p.id;

            const dot = document.createElement('div');
            dot.className = 'map-poi-dot' + (p.locked ? ' is-locked' : ' is-active');

            if (!p.locked) {
                // Anneau pulsant externe
                const ring = document.createElement('div');
                ring.className = 'map-poi-ring';
                dot.appendChild(ring);
            }

            const label = document.createElement('div');
            label.className = 'map-poi-label';
            label.innerText = p.title;

            btn.appendChild(dot);
            btn.appendChild(label);
            this.poiLayer.appendChild(btn);
            this.poiEls[p.id] = btn;

            btn.addEventListener('click', () => this._onPoiClick(p));
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────────────────────────
    _bindEvents() {
        this._onMouseMove = (e) => {
            if (!this.active || this.isDiving) return;
            this._mx = (e.clientX / window.innerWidth) * 2 - 1; // -1→+1
            this._my = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener('mousemove', this._onMouseMove);

        // Gyroscope mobile
        window.addEventListener('deviceorientation', (e) => {
            if (!this.active || this.isDiving) return;
            if (e.gamma !== null && e.beta !== null) {
                this._mx = Math.max(-1, Math.min(1, e.gamma / 30));
                this._my = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    //  SHOW / HIDE
    // ─────────────────────────────────────────────────────────────────────
    show() {
        this.active = true;
        this.isDiving = false;
        this._cx = this._cy = 0;
        this._mx = this._my = 0;

        this.wrap.style.display = 'block';

        // Cacher le menu et HUD du core
        if (this.core.els.menu) this.core.els.menu.removeAttribute('hidden');
        if (this.core.els.menu) this.core.els.menu.style.display = 'none';
        if (this.core.els.hud) this.core.els.hud.style.display = 'none';

        // Marquer le mode dans core
        this.core.state.mode = 'MAP';

        // Audio vent
        this.audioWind.currentTime = 0;
        this.audioWind.play().catch(() => { });
        this._fadeAudio(this.audioWind, 0.35);

        // Boucle d'animation CSS
        if (this._raf) cancelAnimationFrame(this._raf);
        this._loop();
    }

    hide() {
        this.active = false;
        if (this._raf) cancelAnimationFrame(this._raf);
        this.wrap.style.display = 'none';
    }

    // ─────────────────────────────────────────────────────────────────────
    //  BOUCLE — parallaxe + nuages
    // ─────────────────────────────────────────────────────────────────────
    _loop() {
        if (!this.active) return;
        this._raf = requestAnimationFrame(() => this._loop());

        // Lerp fluide — factor plus bas pour une glisse plus douce
        const k = 0.04;
        this._cx += (this._mx - this._cx) * k;
        this._cy += (this._my - this._cy) * k;

        // Parallaxe : imgMap et poiLayer bougent ENSEMBLE (pas de désalignement)
        const mapX = -this._cx * this.PAR_MAP;
        const mapY = -this._cy * this.PAR_MAP;
        const clX = -this._cx * this.PAR_CLOUD1;
        const clY = -this._cy * this.PAR_CLOUD1;
        const cl2X = -this._cx * this.PAR_CLOUD2;
        const cl2Y = -this._cy * this.PAR_CLOUD2;

        this.imgMap.style.transform = `translate3d(${mapX}px, ${mapY}px, 0)`;
        this.poiLayer.style.transform = `translate3d(${mapX}px, ${mapY}px, 0)`;
        
        // Nuages parallax
        this.cloud1.style.transform = `translate3d(${clX}px, ${clY}px, 0)`;
        this.cloud2.style.transform = `translate3d(${cl2X}px, ${cl2Y}px, 0)`;
        if (this.cloud3) this.cloud3.style.transform = `translate3d(${-cl2X * 0.7}px, ${-cl2Y * 0.5}px, 0)`;
        this.cloudShadow.style.transform = `translate3d(${clX + 12}px, ${clY + 14}px, 0)`;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  POI CLICK
    // ─────────────────────────────────────────────────────────────────────
    _onPoiClick(p) {
        if (!this.active || this.isDiving) return;

        if (p.locked) {
            // Son refusé (error.mp3 ou fallback click)
            this.audioError.currentTime = 0;
            this.audioError.play().catch(() => { });

            // Shake effect
            const btn = this.poiEls[p.id];
            btn.classList.add('shake');
            setTimeout(() => btn.classList.remove('shake'), 400);

            // Using core HUD message logic
            this.core._msg('Revenez après avoir débloqué les autres lieux', 3000);
            return;
        }

        // Son entrée valide (enter.mp3 ou fallback click)
        this.audioEnter.currentTime = 0;
        this.audioEnter.play().catch(() => { });
        this._startDive();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  DIVE TRANSITION
    // ─────────────────────────────────────────────────────────────────────
    _startDive() {
        if (this.isDiving) return;
        this.isDiving = true;

        // Cacher les POIs
        Object.values(this.poiEls).forEach(el => {
            el.style.transition = 'opacity .5s';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
        });

        // Fade audio vent
        this._fadeAudio(this.audioWind, 0);

        // Effet zoom + fondu (CSS)
        this.stage.style.transition = 'transform 2s cubic-bezier(0.4,0,1,1), opacity 1.5s ease-in 0.5s';
        this.stage.style.transform = 'scale(3)';
        this.stage.style.opacity = '0';

        // Fondu noir par-dessus
        const fadeEl = document.createElement('div');
        fadeEl.id = 'map-intro-fadeout';
        document.body.appendChild(fadeEl);
        setTimeout(() => fadeEl.classList.add('show'), 700);

        // Lancer Casbah après l'animation
        setTimeout(() => this._launchCasbah(fadeEl), 1900);
    }

    _returnToMenu() {
        if (this.isDiving) return;

        // Fade rapide vers le noir
        const fadeEl = document.createElement('div');
        fadeEl.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0d0a05;opacity:0;pointer-events:all;transition:opacity 0.4s ease;';
        document.body.appendChild(fadeEl);
        requestAnimationFrame(() => { fadeEl.style.opacity = '1'; });

        // SFX click
        this.audioClick.currentTime = 0;
        this.audioClick.play().catch(() => { });

        setTimeout(() => {
            // Arrêter le vent
            this._fadeAudio(this.audioWind, 0, 300);
            this.audioWind.pause();
            this.audioWind.currentTime = 0;

            this.hide();

            // Retour au menu principal
            this.core._setMode('MENU');

            // Retirer le fade après le passage
            fadeEl.style.transition = 'opacity 0.5s ease';
            fadeEl.style.opacity = '0';
            setTimeout(() => fadeEl.remove(), 550);
        }, 420);
    }

    _launchCasbah(fadeEl) {
        this.hide();

        // Réinitialiser le stage pour la prochaine utilisation éventuelle
        this.stage.style.transition = '';
        this.stage.style.transform = '';
        this.stage.style.opacity = '1';
        Object.values(this.poiEls).forEach(el => {
            el.style.opacity = '1';
            el.style.pointerEvents = 'all';
        });

        // Arrêt audio vent
        this.audioWind.pause();
        this.audioWind.currentTime = 0;

        // Lancer l'expérience Casbah via le nouveau système audio
        import('../../src/js/core/TracaAudio.js').then(({ tracaAudio }) => {
            const isNight = this.core.state.isNight;
            tracaAudio.playMusic(isNight ? 'casbah_night_music_01.mp3' : 'casbah_day_music_01.mp3', 3);
            tracaAudio.playAmbience(isNight
                ? 'night/02_ambience_night.mp3'
                : 'day/01_ambience_day.mp3', 3);
        }).catch(() => { });

        this.core._setMode('VIEW');

        // Révèle l'expérience
        fadeEl.style.transition = 'opacity 1.2s ease-out';
        fadeEl.style.opacity = '0';
        setTimeout(() => fadeEl.remove(), 1300);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  UTILITAIRES
    // ─────────────────────────────────────────────────────────────────────
    _fadeAudio(aud, target, duration = 1500) {
        if (!aud) return;
        clearInterval(aud._fadeIv);
        const start = aud.volume;
        const change = target - start;
        const steps = 30;
        let i = 0;
        aud._fadeIv = setInterval(() => {
            i++;
            aud.volume = Math.max(0, Math.min(1, start + change * (i / steps)));
            if (i >= steps) clearInterval(aud._fadeIv);
        }, duration / steps);
    }
}
