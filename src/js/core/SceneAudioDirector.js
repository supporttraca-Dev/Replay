/**
 * SceneAudioDirector.js — Traça Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Chef d'orchestre audio par scène + Mixer Debug interactif.
 *
 * Fonctionnalités du Mixer Debug (bouton "Audio" en haut à gauche) :
 *   - Sliders de volume pour chaque canal (Music, Ambience, SFX, Narration)
 *   - Boutons Play / Stop par canal
 *   - Chargeur de fichier audio custom par canal
 *   - Statut en temps réel (état, volume réel de l'élément)
 *   - Export JSON de la configuration de mix courante
 */

export class SceneAudioDirector {

    /**
     * @param {Object} tracaAudio    — Instance TracaAudio (singleton)
     * @param {Object} scenarioNodes — CASBAH_SCENARIO.nodes
     */
    constructor(tracaAudio, scenarioNodes) {
        this.audio = tracaAudio;
        this.nodes = scenarioNodes;

        // État interne
        this._currentNodeId    = null;
        this._isNight          = false;
        this._expectedAmbience = null;

        // Mixer UI
        this._mixerEl      = null;
        this._mixerOpen    = false;
        this._rafId        = null;

        // Cache des fichiers custom chargés par canal
        this._customFiles = { music: null, ambience: null, sfx: null, narration: null };

        this._bindDebugShortcut();
    }

    // ── API publique ───────────────────────────────────────────────────────────

    onNodeEnter(nodeId, isNight, fadeDuration = 2) {
        this._currentNodeId = nodeId;
        this._isNight       = isNight;

        const nodeData = this.nodes[nodeId];
        if (!nodeData?.ambience) {
            console.warn(`[SceneAudioDirector] Pas d'ambience pour: "${nodeId}"`);
            return;
        }

        const src = this._resolveAmbience(nodeData, isNight);
        this._expectedAmbience = src;
        console.info(`[SceneAudioDirector] → "${nodeId}" | ${isNight ? '🌙 Nuit' : '☀️ Jour'} | ${src.split('/').pop()}`);
        this.audio.forcePlayAmbience(src, fadeDuration);
        this._preloadNeighbors(nodeId);
        this._refreshMixer();
    }

    onTimeTravel(isNight, nodeId, fadeDuration = 3) {
        this._isNight       = isNight;
        this._currentNodeId = nodeId || this._currentNodeId;

        const nodeData = this.nodes[this._currentNodeId];
        if (!nodeData?.ambience) return;

        const src = this._resolveAmbience(nodeData, isNight);
        this._expectedAmbience = src;
        console.info(`[SceneAudioDirector] ⏰ TT → ${isNight ? '🌙' : '☀️'} | ${src.split('/').pop()}`);
        this.audio.forcePlayAmbience(src, fadeDuration);
        this._refreshMixer();
    }

    toggleDebug() {
        if (this._mixerOpen) {
            this._closeMixer();
        } else {
            this._openMixer();
        }
    }

    // ── Résolution d'ambience ─────────────────────────────────────────────────

    _resolveAmbience(nodeData, isNight) {
        const key = isNight ? 'night' : 'day';
        return nodeData.ambience[key] || nodeData.ambience.day;
    }

    _preloadNeighbors(nodeId) {
        const nodeData = this.nodes[nodeId];
        if (!nodeData?.pois) return;
        nodeData.pois
            .filter(p => p.poiType === 'navigation')
            .forEach(poi => {
                const t = this.nodes[poi.targetNode];
                if (!t?.ambience) return;
                [t.ambience.day, t.ambience.night].filter(Boolean).forEach(p => {
                    this.audio.preloadSingle(p);
                });
            });
    }

    // ── Mixer UI ──────────────────────────────────────────────────────────────

    _openMixer() {
        this._mixerOpen = true;
        if (this._mixerEl) {
            this._mixerEl.style.display = 'block';
            this._startRefreshLoop();
            return;
        }
        this._buildMixer();
        this._startRefreshLoop();
    }

    _closeMixer() {
        this._mixerOpen = false;
        if (this._mixerEl) this._mixerEl.style.display = 'none';
        this._stopRefreshLoop();
    }

    _buildMixer() {
        const el = document.createElement('div');
        el.id = 'traca-audio-mixer';
        el.innerHTML = this._mixerHTML();
        el.style.cssText = [
            'position:fixed',
            'top:70px',
            'left:16px',
            'z-index:99999',
            'background:rgba(6,4,2,0.97)',
            'color:#e7ba80',
            'font-family:monospace',
            'font-size:0.72rem',
            'border:1px solid rgba(231,186,128,0.4)',
            'border-radius:12px',
            'min-width:320px',
            'max-width:340px',
            'backdrop-filter:blur(16px)',
            'box-shadow:0 12px 50px rgba(0,0,0,0.95)',
            'user-select:none',
        ].join(';');

        document.body.appendChild(el);
        this._mixerEl = el;
        this._bindMixerEvents(el);
    }

    _mixerHTML() {
        const channels = [
            { id: 'music',     label: '🎵 Musique',   vol: this.audio.volumes?.music     ?? 0.35 },
            { id: 'ambience',  label: '🌿 Ambiance',  vol: this.audio.volumes?.ambience  ?? 0.52 },
            { id: 'narration', label: '🎙 Narration', vol: this.audio.volumes?.narration ?? 1.0  },
            { id: 'sfx',       label: '⚡ SFX',       vol: this.audio.volumes?.sfx       ?? 1.0  },
        ];

        const channelBlocks = channels.map(ch => `
            <div class="mix-ch" data-ch="${ch.id}" style="border-bottom:1px solid rgba(231,186,128,0.12);padding:10px 14px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <span style="color:#e7ba80;font-weight:bold">${ch.label}</span>
                    <span class="mix-status" data-status="${ch.id}" style="font-size:0.65rem;color:#555">—</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <button class="mix-btn-play" data-play="${ch.id}" title="Play" style="${this._btnStyle('#4ade80')}">▶</button>
                    <button class="mix-btn-stop" data-stop="${ch.id}" title="Stop" style="${this._btnStyle('#f87171')}">■</button>
                    <input type="range" min="0" max="100" value="${Math.round(ch.vol * 100)}"
                        data-slider="${ch.id}"
                        style="flex:1;height:4px;accent-color:#e7ba80;cursor:pointer;">
                    <span class="mix-vol-label" data-vollabel="${ch.id}" style="width:30px;text-align:right;color:#aaa">${Math.round(ch.vol * 100)}%</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <label style="color:#555;cursor:pointer;border:1px dashed rgba(231,186,128,0.25);border-radius:4px;padding:2px 6px;white-space:nowrap;font-size:0.65rem;">
                        📂 <input type="file" accept="audio/*" data-filepick="${ch.id}" style="display:none">Charger fichier
                    </label>
                    <span class="mix-file-label" data-filelabel="${ch.id}" style="color:#555;font-size:0.65rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">—</span>
                </div>
            </div>`).join('');

        return `
            <div style="padding:10px 14px 6px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(231,186,128,0.2);">
                <span style="font-weight:bold;letter-spacing:1px;font-size:0.8rem">🎚 AUDIO MIXER</span>
                <div style="display:flex;gap:6px;align-items:center">
                    <span id="mix-scene-label" style="color:#aaa;font-size:0.65rem">—</span>
                    <button id="mix-close-btn" title="Fermer" style="${this._btnStyle('#555')}">✕</button>
                </div>
            </div>
            ${channelBlocks}
            <div style="padding:10px 14px;display:flex;gap:8px;align-items:center;justify-content:space-between">
                <button id="mix-export-btn" style="${this._btnStyle('#e7ba80','rgba(231,186,128,0.12)')}">💾 Exporter config</button>
                <button id="mix-mute-btn" style="${this._btnStyle('#f87171','rgba(248,113,113,0.1)')}">🔇 Tout Muter</button>
            </div>
            <div id="mix-export-output" style="display:none;padding:8px 14px;background:rgba(0,0,0,0.5);border-top:1px solid rgba(231,186,128,0.15);border-radius:0 0 12px 12px;max-height:120px;overflow:auto;font-size:0.65rem;white-space:pre;line-height:1.6;color:#4ade80"></div>`;
    }

    _btnStyle(color, bg = 'rgba(255,255,255,0.05)') {
        return `background:${bg};border:1px solid ${color}33;color:${color};border-radius:5px;padding:3px 8px;cursor:pointer;font-size:0.7rem;font-family:monospace`;
    }

    _bindMixerEvents(el) {
        // Close button
        el.querySelector('#mix-close-btn')?.addEventListener('click', () => this._closeMixer());

        // Volume sliders
        el.querySelectorAll('input[data-slider]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const ch = e.target.dataset.slider;
                const val = parseFloat(e.target.value) / 100;
                this.audio.setVolume(ch, val);
                const lbl = el.querySelector(`[data-vollabel="${ch}"]`);
                if (lbl) lbl.textContent = `${Math.round(val * 100)}%`;
            });
        });

        // Play buttons
        el.querySelectorAll('[data-play]').forEach(btn => {
            btn.addEventListener('click', () => {
                const ch = btn.dataset.play;
                this._playChannel(ch);
            });
        });

        // Stop buttons
        el.querySelectorAll('[data-stop]').forEach(btn => {
            btn.addEventListener('click', () => {
                const ch = btn.dataset.stop;
                this._stopChannel(ch);
            });
        });

        // File pickers
        el.querySelectorAll('input[data-filepick]').forEach(input => {
            input.addEventListener('change', (e) => {
                const ch = e.target.dataset.filepick;
                const file = e.target.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                this._customFiles[ch] = { url, name: file.name };
                const lbl = el.querySelector(`[data-filelabel="${ch}"]`);
                if (lbl) lbl.textContent = file.name;
                // Charger immédiatement dans le canal
                this._loadCustom(ch, url);
            });
        });

        // Export
        el.querySelector('#mix-export-btn')?.addEventListener('click', () => this._exportConfig());

        // Mute all
        el.querySelector('#mix-mute-btn')?.addEventListener('click', () => {
            const isMuted = this.audio.toggleMute();
            const btn = el.querySelector('#mix-mute-btn');
            if (btn) btn.textContent = isMuted ? '🔊 Démuter' : '🔇 Tout Muter';
        });
    }

    _playChannel(ch) {
        const el = this.audio.channels?.[ch];
        if (!el) return;
        if (el.src) {
            el.play().catch(e => console.warn(`[Mixer] Play ${ch}:`, e));
        } else {
            // Aucun fichier chargé — essaye de jouer la piste par défaut
            if (ch === 'music') {
                const track = this._isNight ? 'casbah_night_music_01.mp3' : 'casbah_day_music_01.mp3';
                this.audio.playMusic(track, 1);
            } else if (ch === 'ambience' && this._expectedAmbience) {
                this.audio.forcePlayAmbience(this._expectedAmbience, 1);
            }
        }
    }

    _stopChannel(ch) {
        const el = this.audio.channels?.[ch];
        if (!el) return;
        if (ch === 'music')     { this.audio.stopMusic(1); }
        else if (ch === 'ambience')  { this.audio.stopAmbience(1); }
        else if (ch === 'narration') { this.audio.stopNarration(); }
        else { el.pause(); el.currentTime = 0; }
    }

    _loadCustom(ch, url) {
        const el = this.audio.channels?.[ch];
        if (!el) return;
        el.src = url;
        el.load();
        el.play().catch(e => console.warn(`[Mixer] AutoPlay ${ch}:`, e));
        if (ch === 'ambience') this.audio.currentAmbience = url;
        if (ch === 'music')    this.audio.currentMusic = url;
    }

    _exportConfig() {
        const cfg = {
            scene:    this._currentNodeId,
            time:     this._isNight ? 'night' : 'day',
            volumes: {
                music:     (this.audio.volumes?.music    ?? 0).toFixed(2),
                ambience:  (this.audio.volumes?.ambience ?? 0).toFixed(2),
                narration: (this.audio.volumes?.narration ?? 0).toFixed(2),
                sfx:       (this.audio.volumes?.sfx      ?? 0).toFixed(2),
            },
            customFiles: Object.fromEntries(
                Object.entries(this._customFiles).map(([k, v]) => [k, v?.name ?? null])
            ),
            ambience: {
                expected: this._expectedAmbience,
                loaded:   this.audio.channels?.ambience?.src ?? null,
            },
            music: {
                loaded: this.audio.channels?.music?.src ?? null,
            },
            exportedAt: new Date().toISOString(),
        };

        const json = JSON.stringify(cfg, null, 2);

        // Sauvegarder dans le projet
        try {
            const blob = new Blob([json], { type: 'application/json' });
            const a    = document.createElement('a');
            a.href     = URL.createObjectURL(blob);
            a.download = `traca_audio_mix_${this._currentNodeId}_${Date.now()}.json`;
            a.click();
        } catch(e) {}

        // Afficher dans le panel
        const out = this._mixerEl?.querySelector('#mix-export-output');
        if (out) {
            out.style.display = 'block';
            out.textContent = json;
        }
    }

    // ── Refresh temps réel ────────────────────────────────────────────────────

    _startRefreshLoop() {
        this._stopRefreshLoop();
        this._rafId = setInterval(() => this._refreshMixer(), 500);
    }

    _stopRefreshLoop() {
        if (this._rafId) { clearInterval(this._rafId); this._rafId = null; }
    }

    _refreshMixer() {
        if (!this._mixerEl || !this._mixerOpen) return;

        // Scène courante
        const sceneLabel = this._mixerEl.querySelector('#mix-scene-label');
        if (sceneLabel) {
            sceneLabel.textContent = `${this._currentNodeId ?? '—'} | ${this._isNight ? '🌙' : '☀️'}`;
        }

        // Statut de chaque canal
        const channels = ['music', 'ambience', 'narration', 'sfx'];
        channels.forEach(ch => {
            const el = this.audio.channels?.[ch];
            const status = this._mixerEl.querySelector(`[data-status="${ch}"]`);
            if (status && el) {
                const playing = el.src && !el.paused;
                const fname = el.src ? el.src.split('/').pop().split('?')[0] : '—';
                const realVol = el.volume !== undefined ? Math.round(el.volume * 100) : '?';
                status.style.color = playing ? '#4ade80' : '#f87171';
                status.textContent = playing
                    ? `▶ ${fname.length > 18 ? fname.substring(0,18)+'…' : fname} (${realVol}%)`
                    : `■ ${fname.length > 18 ? fname.substring(0,18)+'…' : fname}`;
            }

            // Sync slider avec le volume réel stocké dans tracaAudio
            const vol = this.audio.volumes?.[ch] ?? 0;
            const slider = this._mixerEl.querySelector(`[data-slider="${ch}"]`);
            const lbl    = this._mixerEl.querySelector(`[data-vollabel="${ch}"]`);
            if (slider && document.activeElement !== slider) {
                slider.value = Math.round(vol * 100);
            }
            if (lbl) lbl.textContent = `${Math.round(vol * 100)}%`;
        });
    }

    // ── Raccourci clavier ─────────────────────────────────────────────────────

    _bindDebugShortcut() {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleDebug();
            }
        });
    }
}
