/**
 * TimeTravelModule — Traca Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Gère la transition cinématique Jour ↔ Nuit :
 *   - Flash noir cinématique (#time-flash)
 *   - Swap des matériaux des sphères multivers
 *   - Update du bouton #btn-time-travel (is-day / is-night)
 *   - Crossfade audio (musique + ambiance)
 *   - Anti-double-clic (guard isTraveling)
 *
 * Dépendances injectées : sphereDay, sphereNight, tracaAudio, Analytics
 */
export class TimeTravelModule {
    /**
     * @param {Object} deps
     * @param {THREE.Mesh}  deps.sphereDay
     * @param {THREE.Mesh}  deps.sphereNight
     * @param {Object}      deps.tracaAudio
     * @param {Object}      deps.Analytics
     * @param {HTMLElement} deps.hudEl          — #c-hud (pour la classe night-mode)
     * @param {HTMLElement} deps.webglWrap      — #c-canvas-wrap (reset filter)
     * @param {Function}    [deps.onToggle]     — Callback(isNight) appelé après le swap
     */
    constructor({ sphereDay, sphereNight, tracaAudio, Analytics, hudEl, webglWrap, onToggle }) {
        this.sphereDay   = sphereDay;
        this.sphereNight = sphereNight;
        this.audio       = tracaAudio;
        this.analytics   = Analytics;
        this.hudEl       = hudEl;
        this.webglWrap   = webglWrap;
        this.onToggle    = onToggle || null;

        this.isNight     = false;
        this.isTraveling = false;

        this._btn   = document.getElementById('btn-time-travel');
        this._flash = document.getElementById('time-flash');
        this._label = this._btn?.querySelector('.tt-label');

        this._bindEvents();
    }

    _bindEvents() {
        if (this._btn) {
            this._btn.addEventListener('click', () => this.toggle());
        }
    }

    // ── API publique ──────────────────────────────────────────────────────────

    toggle() {
        if (!this.sphereDay || !this.sphereNight) return;
        if (this.isTraveling) return;
        this.isTraveling = true;

        // Nettoie les filtres CSS résiduels sur le canvas
        if (this.webglWrap) {
            this.webglWrap.style.transition = '';
            this.webglWrap.style.filter     = '';
        }

        // Bloquer le bouton pendant la transition
        if (this._btn) this._btn.style.pointerEvents = 'none';

        // 1. SFX
        this.audio?.playSFX('time_warp.mp3');

        // 2. Fade noir (600ms)
        const flash = this._flash;
        if (flash) { flash.style.transition = 'opacity 0.6s ease'; flash.style.opacity = '1'; }

        // 3. Swap au pic du noir
        setTimeout(() => {
            this.isNight = !this.isNight;
            this.analytics?.trackTimeTravel?.(this.isNight ? 'night' : 'day');

            this._applyMode();
            this.onToggle?.(this.isNight);

            // 4. Dévoilement
            if (flash) { flash.style.transition = 'opacity 0.8s ease'; flash.style.opacity = '0'; }

            setTimeout(() => {
                this.isTraveling = false;
                if (this._btn) this._btn.style.pointerEvents = 'auto';
            }, 900);
        }, 600);
    }

    /** Force un mode précis sans animation (utile au démarrage) */
    setMode(isNight) {
        this.isNight = isNight;
        this._applyMode();
    }

    // ── Interne ───────────────────────────────────────────────────────────────

    _applyMode() {
        if (this.isNight) {
            this.sphereDay.material.opacity   = 0;
            this.sphereNight.material.opacity = 1;
            this._btn?.classList.replace('is-day', 'is-night');
            if (this._label) this._label.textContent = 'Mode Nuit';
            this.hudEl?.classList.add('night-mode');
            this.audio?.playMusic('casbah_night_music_01.mp3', 3);
        } else {
            this.sphereDay.material.opacity   = 1;
            this.sphereNight.material.opacity = 0;
            this._btn?.classList.replace('is-night', 'is-day');
            if (this._label) this._label.textContent = 'Mode Jour';
            this.hudEl?.classList.remove('night-mode');
            this.audio?.playMusic('casbah_day_music_01.mp3', 3);
        }

        // Update bouton éditeur si présent
        const btnEdTime = document.getElementById('btn-ed-time');
        if (btnEdTime) btnEdTime.innerHTML = this.isNight ? '🌙 Nuit' : '☀️ Jour';
    }
}
