/**
 * SceneAudioDirector.js — Traça Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Chef d'orchestre audio par scène.
 *
 * Responsabilités :
 *   - Décider quelle ambience jouer selon la scène active et le temps (jour/nuit)
 *   - Déclencher les transitions audio lors des changements de scène
 *   - Précharger en avance les assets des scènes voisines
 *   - Exposer un état de debug en temps réel
 *
 * Architecture :
 *   Level_01_Casbah.js (manifest)
 *        ↓
 *   SceneAudioDirector.js (décisions)
 *        ↓
 *   TracaAudio.js (moteur bas niveau — inchangé)
 *
 * Usage :
 *   const director = new SceneAudioDirector(tracaAudio, CASBAH_SCENARIO.nodes);
 *   director.onNodeEnter('patio', false);     // Changement de scène
 *   director.onTimeTravel(true, 'patio');     // Time travel
 *   director.toggleDebug();                  // Ctrl+Shift+A
 */

export class SceneAudioDirector {

    /**
     * @param {Object} tracaAudio    — Instance TracaAudio (singleton)
     * @param {Object} scenarioNodes — CASBAH_SCENARIO.nodes
     */
    constructor(tracaAudio, scenarioNodes) {
        this.audio   = tracaAudio;
        this.nodes   = scenarioNodes;

        // État interne
        this._currentNodeId     = null;
        this._isNight           = false;
        this._expectedAmbience  = null;

        // Debug overlay
        this._debugEl       = null;
        this._debugInterval = null;
        this._debugEnabled  = false;

        // Raccourci clavier Ctrl+Shift+A
        this._bindDebugShortcut();
    }

    // ── API publique ───────────────────────────────────────────────────────────

    /**
     * À appeler dès qu'un node est chargé (navigation ou boot).
     * @param {string}  nodeId  — Identifiant du node (ex: 'patio', 'upstairs')
     * @param {boolean} isNight — État jour/nuit courant
     * @param {number}  fadeDuration — Durée du crossfade en secondes
     */
    onNodeEnter(nodeId, isNight, fadeDuration = 2) {
        this._currentNodeId = nodeId;
        this._isNight       = isNight;

        const nodeData = this.nodes[nodeId];
        if (!nodeData?.ambience) {
            console.warn(`[SceneAudioDirector] Aucune ambience déclarée pour le node: "${nodeId}"`);
            return;
        }

        const src = this._resolveAmbience(nodeData, isNight);
        this._expectedAmbience = src;

        console.info(`[SceneAudioDirector] → "${nodeId}" | ${isNight ? '🌙 Nuit' : '☀️ Jour'} | ${src.split('/').pop()}`);

        // forcePlayAmbience : bypass le guard currentAmbience pour garantir le swap
        this.audio.forcePlayAmbience(src, fadeDuration);

        // Préchargement anticipé des scènes voisines (async, non bloquant)
        this._preloadNeighbors(nodeId);

        this._updateDebug();
    }

    /**
     * À appeler lors d'un time travel (jour ↔ nuit) sur la scène courante.
     * @param {boolean} isNight — Nouveau mode nuit
     * @param {string}  nodeId  — Node courant (optionnel, utilise le dernier connu)
     * @param {number}  fadeDuration — Durée du crossfade en secondes
     */
    onTimeTravel(isNight, nodeId, fadeDuration = 3) {
        this._isNight       = isNight;
        this._currentNodeId = nodeId || this._currentNodeId;

        const nodeData = this.nodes[this._currentNodeId];
        if (!nodeData?.ambience) return;

        const src = this._resolveAmbience(nodeData, isNight);
        this._expectedAmbience = src;

        console.info(`[SceneAudioDirector] ⏰ Time Travel → ${isNight ? '🌙 Nuit' : '☀️ Jour'} | ${src.split('/').pop()}`);

        this.audio.forcePlayAmbience(src, fadeDuration);
        this._updateDebug();
    }

    /**
     * Active/désactive l'overlay de debug (Ctrl+Shift+A ou appel direct)
     */
    toggleDebug() {
        if (this._debugEnabled) {
            this._disableDebug();
        } else {
            this._enableDebug();
        }
    }

    /**
     * Retourne l'état audio complet pour inspection externe.
     */
    getDebugState() {
        const ambEl = this.audio.channels?.ambience;
        return {
            nodeId:           this._currentNodeId,
            isNight:          this._isNight,
            expectedAmbience: this._expectedAmbience,
            loadedAmbience:   ambEl?.src   || null,
            currentAmbience:  this.audio.currentAmbience || null,
            ambiencePlaying:  ambEl ? !ambEl.paused : false,
            ambienceVolume:   this.audio.volumes?.ambience ?? 0,
            currentMusic:     this.audio.currentMusic || null,
            musicVolume:      this.audio.volumes?.music ?? 0,
            currentNarration: this.audio.currentNarration || null,
            isMuted:          this.audio.isMuted,
            ramCacheSize:     Object.keys(this.audio.sfxCache || {}).length,
        };
    }

    // ── Interne ────────────────────────────────────────────────────────────────

    _resolveAmbience(nodeData, isNight) {
        const key = isNight ? 'night' : 'day';
        return nodeData.ambience[key] || nodeData.ambience.day;
    }

    /**
     * Précharge les ambiences des scènes accessibles depuis le node courant.
     * Silencieux, non bloquant.
     */
    _preloadNeighbors(nodeId) {
        const nodeData = this.nodes[nodeId];
        if (!nodeData?.pois) return;

        const navPois = nodeData.pois.filter(p => p.poiType === 'navigation');
        navPois.forEach(poi => {
            const targetNodeData = this.nodes[poi.targetNode];
            if (!targetNodeData?.ambience) return;

            const paths = [
                targetNodeData.ambience.day,
                targetNodeData.ambience.night
            ].filter(Boolean);

            // Déduplique et précharge
            [...new Set(paths)].forEach(path => {
                this.audio.preloadSingle(path); // async, non bloquant
            });
        });
    }

    // ── Debug Overlay ──────────────────────────────────────────────────────────

    _bindDebugShortcut() {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleDebug();
            }
        });
    }

    _enableDebug() {
        this._debugEnabled = true;
        if (this._debugEl) return;

        const el = document.createElement('div');
        el.id = 'traca-audio-debug';
        el.style.cssText = [
            'position:fixed',
            'bottom:120px',
            'right:16px',
            'z-index:99999',
            'background:rgba(5,3,1,0.94)',
            'color:#e7ba80',
            'font-family:monospace',
            'font-size:0.70rem',
            'padding:12px 16px',
            'border:1px solid rgba(231,186,128,0.45)',
            'border-radius:10px',
            'line-height:1.9',
            'pointer-events:none',
            'min-width:270px',
            'backdrop-filter:blur(8px)',
            'box-shadow:0 8px 30px rgba(0,0,0,0.8)'
        ].join(';');

        document.body.appendChild(el);
        this._debugEl = el;

        // Rafraîchissement 2×/s
        this._debugInterval = setInterval(() => this._updateDebug(), 500);
        this._updateDebug();
    }

    _disableDebug() {
        this._debugEnabled = false;
        if (this._debugEl) {
            this._debugEl.remove();
            this._debugEl = null;
        }
        if (this._debugInterval) {
            clearInterval(this._debugInterval);
            this._debugInterval = null;
        }
    }

    _updateDebug() {
        if (!this._debugEl) return;
        const s = this.getDebugState();

        const short    = (p) => p ? p.split('/').pop() : '—';
        const expShort = short(s.expectedAmbience);
        const actShort = short(s.loadedAmbience);
        const match    = expShort === actShort ? '✅' : '⚠️ MISMATCH';

        const playing  = s.ambiencePlaying
            ? '<span style="color:#4ade80">▶ PLAYING</span>'
            : '<span style="color:#f87171">■ STOPPED</span>';

        this._debugEl.innerHTML = `
<strong>🔊 AUDIO DEBUG</strong> <span style="color:#555;font-size:0.6rem">[Ctrl+Shift+A]</span><br>
<span style="color:#555">──────────────────────────────</span><br>
<span style="color:#aaa">Scène    :</span> <strong>${s.nodeId || '—'}</strong><br>
<span style="color:#aaa">Temps    :</span> ${s.isNight ? '🌙 Nuit' : '☀️ Jour'}<br>
<span style="color:#555">──────────────────────────────</span><br>
<strong>AMBIENCE</strong><br>
<span style="color:#aaa">Attendue :</span> ${expShort}<br>
<span style="color:#aaa">Chargée  :</span> ${actShort} ${match}<br>
<span style="color:#aaa">État     :</span> ${playing}<br>
<span style="color:#aaa">Volume   :</span> ${(s.ambienceVolume * 100).toFixed(0)}%${s.isMuted ? ' <span style="color:#f87171">🔇 MUTED</span>' : ''}<br>
<span style="color:#555">──────────────────────────────</span><br>
<strong>MUSIQUE</strong><br>
<span style="color:#aaa">Fichier  :</span> ${short(s.currentMusic)}<br>
<span style="color:#aaa">Volume   :</span> ${(s.musicVolume * 100).toFixed(0)}%<br>
<span style="color:#555">──────────────────────────────</span><br>
<span style="color:#aaa">Narration:</span> ${short(s.currentNarration)}<br>
<span style="color:#aaa">RAM Cache:</span> ${s.ramCacheSize} fichiers<br>
        `.trim();
    }
}
