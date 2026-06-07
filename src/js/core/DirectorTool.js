/**
 * DirectorTool.js — TRACA Scene Editor v3 (robuste et fiable)
 *
 * FORMAT CAMÉRA UNIFIÉ avec ExperienceManager :
 *  { theta: DEG, phi: DEG, radius: METRES, tx: M, ty: M, tz: M, fov: DEG }
 *
 * Flow :
 *  1. Toggle EDIT → caméra libre dans model-viewer
 *  2. L'utilisateur cadre sa scène
 *  3. "Enregistrer ce cadrage" → lit getCameraOrbit(), stocke dans experience.config.chapters[i]
 *  4. Toggle VIEW → _syncCameraToScroll reprend, lit les nouvelles valeurs en live ✅
 *  5. "Sauvegarder Scénario" → POST /api/save-scenario → écrit le JSON sur disque
 */
export class DirectorTool {
    constructor(experience) {
        this.exp          = experience;
        this.modelViewer  = experience.modelViewer;

        // Dériver l'ID depuis l'ID du modèle (ex: "synagogue-model" → "synagogue")
        this.experienceId = experience.config.modelId.replace('-model', '').replace('mausoleum', 'tombeau');

        this.currentIndex = 0;
        this.isEditMode   = false;

        this._initAudioCtx();
        this._buildUI();
        this._startLiveTicker();
        // Démarrer en VIEW par défaut
        this._applyMode('VIEW');
    }

    // ─────────────────────────────────────────────────────────────────
    //  MODE TOGGLE
    // ─────────────────────────────────────────────────────────────────
    _applyMode(mode) {
        this.isEditMode      = (mode === 'EDIT');
        this.exp.isEditMode  = this.isEditMode;

        const btnView = document.getElementById('d-btn-view');
        const btnEdit = document.getElementById('d-btn-edit');
        const panel   = document.getElementById('d-panel');

        if (btnView) btnView.classList.toggle('d-mode-active', mode === 'VIEW');
        if (btnEdit) btnEdit.classList.toggle('d-mode-active', mode === 'EDIT');

        if (this.isEditMode) {
            // Libérer la caméra model-viewer
            this.modelViewer.setAttribute('camera-controls', '');
            this.modelViewer.removeAttribute('disable-zoom');
            this.modelViewer.removeAttribute('disable-pan');
            this.modelViewer.setAttribute('touch-action', 'pan-y');
            this.modelViewer.style.cursor = 'grab';
            if (panel) panel.style.display = 'flex';
        } else {
            // Verrouiller caméra → ExperienceManager reprend le contrôle au prochain scroll
            this.modelViewer.removeAttribute('camera-controls');
            this.modelViewer.setAttribute('disable-zoom', '');
            this.modelViewer.setAttribute('disable-pan', '');
            this.modelViewer.removeAttribute('touch-action');
            this.modelViewer.style.cursor = 'default';
            if (panel) panel.style.display = 'none';
            // Forcer une mise à jour immédiate de la caméra en VIEW
            this.exp._syncCameraToScroll();
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  LIRE LA CAMÉRA ACTUELLE DU MODEL-VIEWER
    //  Retourne { theta: DEG, phi: DEG, radius: M, tx: M, ty: M, tz: M, fov: DEG }
    // ─────────────────────────────────────────────────────────────────
    _readCamera() {
        if (!this.modelViewer || !this.modelViewer.getCameraOrbit) return null;
        try {
            const orb = this.modelViewer.getCameraOrbit();   // {theta: rad, phi: rad, radius: m}
            const tgt = this.modelViewer.getCameraTarget();  // {x, y, z} en mètres
            const fov = this.modelViewer.getFieldOfView();   // degrés

            if (!orb || orb.radius === undefined) return null;

            const toDeg = (r) => +(r * 180 / Math.PI).toFixed(1);

            return {
                theta:  toDeg(orb.theta),
                phi:    toDeg(orb.phi),
                radius: +orb.radius.toFixed(3),
                tx:     +tgt.x.toFixed(3),
                ty:     +tgt.y.toFixed(3),
                tz:     +tgt.z.toFixed(3),
                fov:    +fov.toFixed(1),
            };
        } catch (e) {
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  APPLIQUER UN ÉTAT CAMÉRA AU MODEL-VIEWER (preview)
    // ─────────────────────────────────────────────────────────────────
    _previewCam(cam) {
        if (!this.modelViewer) return;
        this.modelViewer.cameraOrbit  = `${cam.theta}deg ${cam.phi}deg ${cam.radius}m`;
        this.modelViewer.cameraTarget = `${cam.tx}m ${cam.ty}m ${cam.tz}m`;
        this.modelViewer.fieldOfView  = `${cam.fov}deg`;
    }

    // ─────────────────────────────────────────────────────────────────
    //  AUDIO FEEDBACK
    // ─────────────────────────────────────────────────────────────────
    _initAudioCtx() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { this.audioCtx = null; }
    }

    _playBeep(freq = 880, duration = 0.25, volume = 0.25) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc  = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.audioCtx.currentTime + duration * 0.5);
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    // ─────────────────────────────────────────────────────────────────
    //  BUILD UI
    // ─────────────────────────────────────────────────────────────────
    _buildUI() {
        const style = document.createElement('style');
        style.textContent = `
        /* ══ Director Switcher ═════════════════──────────────── */
        #d-switcher {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10001;
            display: flex;
            background: rgba(4,4,8,0.92);
            border: 1px solid rgba(212,168,83,0.45);
            border-radius: 10px;
            padding: 4px;
            gap: 4px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.55);
            backdrop-filter: blur(12px);
        }
        .d-mode-btn {
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.45);
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            padding: 8px 18px;
            border-radius: 7px;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            position: relative;
            z-index: 10002;   /* au-dessus de TOUT, y compris l’intro-overlay (2000) */
        }
        .d-mode-active {
            background: #e7ba80 !important;
            color: #06050a !important;
        }

        /* ── Director Panel ─────────────────────────────────────── */
        #d-panel {
            position: fixed;
            top: 16px;
            right: 16px;
            bottom: 16px;
            z-index: 10000;
            width: 300px;
            background: rgba(5,4,9,0.97);
            border: 1px solid rgba(212,168,83,0.35);
            border-radius: 12px;
            color: #e7ba80;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            display: none;              /* hidden until EDIT */
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 40px rgba(0,0,0,0.7);
        }
        #d-panel * { box-sizing: border-box; }

        .dp-header {
            padding: 12px 16px 10px;
            border-bottom: 1px solid rgba(212,168,83,0.15);
            background: rgba(212,168,83,0.07);
        }
        .dp-header h3 {
            margin: 0;
            font-size: 10px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            opacity: 0.85;
        }
        .dp-header p {
            margin: 4px 0 0;
            font-size: 10px;
            opacity: 0.4;
        }

        .dp-body {
            flex: 1;
            overflow-y: auto;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .dp-section-label {
            font-size: 9px;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: rgba(212,168,83,0.4);
            margin-bottom: 5px;
        }

        /* Chapter List */
        .dp-chapter-list { border: 1px solid rgba(212,168,83,0.1); border-radius: 6px; overflow: hidden; }
        .dp-ch-item {
            padding: 7px 10px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid rgba(212,168,83,0.05);
            cursor: pointer;
            transition: background 0.15s;
        }
        .dp-ch-item:last-child { border-bottom: none; }
        .dp-ch-item:hover { background: rgba(212,168,83,0.07); }
        .dp-ch-item.dp-ch-active { background: rgba(212,168,83,0.14); border-left: 3px solid #e7ba80; }
        .dp-ch-dot { font-size: 11px; flex-shrink: 0; }
        .dp-ch-dot.captured { color: #4ddb88; }
        .dp-ch-dot.empty { color: rgba(255,255,255,0.2); }
        .dp-ch-name { flex: 1; font-size: 11px; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dp-ch-preview { font-size: 10px; opacity: 0; transition: opacity 0.2s; color: rgba(212,168,83,0.7); }
        .dp-ch-item:hover .dp-ch-preview { opacity: 1; }

        /* Live readout */
        .dp-cam-grid {
            background: rgba(0,0,0,0.35);
            border: 1px solid rgba(212,168,83,0.1);
            border-radius: 6px;
            padding: 9px 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px 16px;
        }
        .dp-cam-row { display: flex; justify-content: space-between; align-items: baseline; gap: 4px; }
        .dp-cam-key { color: rgba(212,168,83,0.45); font-size: 10px; }
        .dp-cam-val { color: #fff; font-weight: 700; font-size: 11px; }

        /* Buttons */
        .dp-btn {
            width: 100%;
            padding: 11px 14px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }
        #d-capture-btn {
            background: rgba(212,168,83,0.12);
            border: 1px solid rgba(212,168,83,0.4);
            color: #e7ba80;
        }
        #d-capture-btn:hover { background: rgba(212,168,83,0.25); }
        #d-capture-btn.dp-success {
            background: rgba(77,219,136,0.2) !important;
            border-color: rgba(77,219,136,0.7) !important;
            color: #4ddb88 !important;
        }
        #d-save-btn {
            background: #e7ba80;
            color: #06050a;
        }
        #d-save-btn:hover { background: #fff; }
        #d-save-btn:disabled { opacity: 0.5; cursor: wait; }

        .dp-footer {
            padding: 8px 14px;
            border-top: 1px solid rgba(212,168,83,0.1);
            background: rgba(0,0,0,0.25);
        }
        #d-status-msg {
            font-size: 10px;
            color: rgba(212,168,83,0.5);
            text-align: center;
            min-height: 14px;
        }
        `;
        document.head.appendChild(style);

        // ── Switcher ──────────────────────────────────────────────
        const switcher = document.createElement('div');
        switcher.id = 'd-switcher';
        switcher.innerHTML = `
            <button class="d-mode-btn d-mode-active" id="d-btn-view">👁 View</button>
            <button class="d-mode-btn" id="d-btn-edit">✏️ Edit</button>
        `;
        document.body.appendChild(switcher);

        // ── Panel ─────────────────────────────────────────────────
        const panel = document.createElement('div');
        panel.id = 'd-panel';
        panel.innerHTML = `
            <div class="dp-header">
                <h3>✦ Scene Editor — ${this.experienceId}</h3>
                <p>Cadrez la scène · Enregistrez · Sauvegardez</p>
            </div>
            <div class="dp-body">
                <div>
                    <div class="dp-section-label">Chapitres</div>
                    <div class="dp-chapter-list" id="d-ch-list"></div>
                </div>
                <div>
                    <div class="dp-section-label">🎥 Caméra en direct</div>
                    <div class="dp-cam-grid">
                        <div class="dp-cam-row"><span class="dp-cam-key">theta</span><span class="dp-cam-val" id="d-v-theta">—</span></div>
                        <div class="dp-cam-row"><span class="dp-cam-key">phi</span><span class="dp-cam-val" id="d-v-phi">—</span></div>
                        <div class="dp-cam-row"><span class="dp-cam-key">radius</span><span class="dp-cam-val" id="d-v-radius">—</span></div>
                        <div class="dp-cam-row"><span class="dp-cam-key">fov</span><span class="dp-cam-val" id="d-v-fov">—</span></div>
                        <div class="dp-cam-row"><span class="dp-cam-key">tx</span><span class="dp-cam-val" id="d-v-tx">—</span></div>
                        <div class="dp-cam-row"><span class="dp-cam-key">ty</span><span class="dp-cam-val" id="d-v-ty">—</span></div>
                        <div class="dp-cam-row"><span class="dp-cam-key">tz</span><span class="dp-cam-val" id="d-v-tz">—</span></div>
                    </div>
                </div>
                <button class="dp-btn" id="d-capture-btn">🎥 Enregistrer ce cadrage</button>
                <button class="dp-btn" id="d-save-btn">💾 Sauvegarder le scénario</button>
            </div>
            <div class="dp-footer"><div id="d-status-msg">Prêt.</div></div>
        `;
        document.body.appendChild(panel);

        this._buildChapterList();
        this._bindEvents();
    }

    _buildChapterList() {
        const list = document.getElementById('d-ch-list');
        if (!list) return;
        list.innerHTML = '';

        const chapters  = this.exp.config.chapters;
        const domEls    = this.exp.chapterEls;

        chapters.forEach((ch, i) => {
            const hasData = ch && ch.radius !== undefined;
            const titleEl = domEls[i]?.querySelector('.chapter-title');
            const title   = titleEl
                ? titleEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 22)
                : `Chapitre ${i + 1}`;

            const item = document.createElement('div');
            item.className = `dp-ch-item${i === this.currentIndex ? ' dp-ch-active' : ''}`;
            item.dataset.index = i;
            item.innerHTML = `
                <span class="dp-ch-dot ${hasData ? 'captured' : 'empty'}">${hasData ? '●' : '○'}</span>
                <span class="dp-ch-name">${i+1}. ${title}</span>
                <span class="dp-ch-preview">▶ preview</span>
            `;
            item.addEventListener('click', () => this._selectChapter(i));
            list.appendChild(item);
        });
    }

    _selectChapter(i) {
        this.currentIndex = i;

        // Update active state in list
        document.querySelectorAll('.dp-ch-item').forEach((el, j) =>
            el.classList.toggle('dp-ch-active', j === i)
        );

        // Scroll page to the chapter section
        const targetEl = this.exp.chapterEls[i];
        if (targetEl && this.exp.lenis) {
            this.exp.lenis.scrollTo(targetEl, { duration: 1.2 });
        }

        // Preview the saved cam for this chapter (if it has data)
        const saved = this.exp.config.chapters[i];
        if (saved && saved.radius !== undefined) {
            this._previewCam(saved);
            this._setStatus(`Chapitre ${i+1} — cadrage sauvegardé appliqué.`);
        } else {
            this._setStatus(`Chapitre ${i+1} — pas encore de cadrage. Cadrez et capturez.`);
        }
    }

    _bindEvents() {
        document.getElementById('d-btn-view').addEventListener('click', () => this._applyMode('VIEW'));
        document.getElementById('d-btn-edit').addEventListener('click', () => this._applyMode('EDIT'));

        // ── Capture ───────────────────────────────────────────────
        document.getElementById('d-capture-btn').addEventListener('click', () => {
            const cam = this._readCamera();
            if (!cam) {
                this._setStatus('⚠ Modèle non prêt — le chargement est peut-être en cours.');
                return;
            }

            // Stocker dans config.chapters (ExperienceManager le lira en live)
            this.exp.config.chapters[this.currentIndex] = cam;

            // Mettre à jour la liste
            this._buildChapterList();
            document.querySelectorAll('.dp-ch-item').forEach((el, j) =>
                el.classList.toggle('dp-ch-active', j === this.currentIndex)
            );

            // Feedback
            this._playBeep(880, 0.2, 0.25);
            const btn = document.getElementById('d-capture-btn');
            btn.classList.add('dp-success');
            btn.textContent = `✔ Ch.${this.currentIndex + 1} enregistré !`;
            this._setStatus(`Cadrage du chapitre ${this.currentIndex + 1} enregistré en mémoire.`);
            setTimeout(() => {
                btn.classList.remove('dp-success');
                btn.textContent = '🎥 Enregistrer ce cadrage';
            }, 1800);

            // Auto-avancer au chapitre suivant
            const next = Math.min(this.currentIndex + 1, this.exp.config.chapters.length - 1);
            if (next !== this.currentIndex) {
                setTimeout(() => this._selectChapter(next), 600);
            }
        });

        // ── Save to disk ──────────────────────────────────────────
        document.getElementById('d-save-btn').addEventListener('click', async () => {
            const btn = document.getElementById('d-save-btn');
            btn.disabled = true;
            btn.textContent = '⏳ Écriture sur disque…';
            this._setStatus('Envoi au serveur Vite…');

            try {
                const resp = await fetch('/api/save-scenario', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({
                        experienceId: this.experienceId,
                        chapters:     this.exp.config.chapters,
                    })
                });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

                // Double beep = success
                this._playBeep(880, 0.15, 0.25);
                setTimeout(() => this._playBeep(1320, 0.2, 0.2), 120);

                btn.textContent = '✔ Scénario sauvegardé !';
                this._setStatus(`✔ src/data/scenario_${this.experienceId}.json mis à jour.`);
                setTimeout(() => { btn.textContent = '💾 Sauvegarder le scénario'; btn.disabled = false; }, 2500);

            } catch (err) {
                btn.textContent = '❌ Erreur — réessayez';
                this._setStatus(`Erreur: ${err.message}`);
                btn.disabled = false;
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────
    //  LIVE READOUT TICKER
    // ─────────────────────────────────────────────────────────────────
    _startLiveTicker() {
        const setVal = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };

        const tick = () => {
            if (this.isEditMode) {
                const cam = this._readCamera();
                if (cam) {
                    setVal('d-v-theta',  `${cam.theta}°`);
                    setVal('d-v-phi',    `${cam.phi}°`);
                    setVal('d-v-radius', `${cam.radius}m`);
                    setVal('d-v-fov',    `${cam.fov}°`);
                    setVal('d-v-tx',     `${cam.tx}m`);
                    setVal('d-v-ty',     `${cam.ty}m`);
                    setVal('d-v-tz',     `${cam.tz}m`);
                }
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    _setStatus(msg) {
        const el = document.getElementById('d-status-msg');
        if (el) el.textContent = msg;
    }
}
