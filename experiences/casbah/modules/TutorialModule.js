/**
 * TutorialModule — Traça Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Tutoriel progressif & contextuel. UN seul concept à la fois.
 * Ne s'affiche que si le joueur n'a pas encore terminé l'onboarding.
 * Tout est persisté en localStorage.
 *
 * Séquence :
 *   Step 0 — Gyroscope (optionnel, 4s après entrée, mobile seulement)
 *   Step 1 — Navigation flèches (dès que les flèches sont présentes)
 *   Step 2 — Vision d'Aigle (après 1re navigation, sur le nouveau node)
 *   Step 3 — Inventaire (dès qu'un artefact est découvert)
 *
 * API publique :
 *   tutorial.onExperienceStart()         → Step 0 gyro
 *   tutorial.onArrowsShown()             → Step 1 nav
 *   tutorial.onNodeChanged()             → Step 2 vision (si step 1 done)
 *   tutorial.onArtifactFound(artName)    → Step 3 inventaire
 *   tutorial.onInventoryOpened()         → Complète step 3
 *   tutorial.onEagleActivated()          → Complète step 2
 *   tutorial.onArrowUsed()               → Complète step 1
 */
export class TutorialModule {
    /**
     * @param {Object} opts
     * @param {HTMLElement} opts.btnGyro     — bouton gyroscope
     * @param {HTMLElement} opts.btnEagle    — bouton vision d'aigle
     * @param {HTMLElement} opts.btnInventory — bouton inventaire
     * @param {Function} opts.onActivateGyro — callback pour activer le gyro
     */
    constructor({ btnGyro, btnEagle, btnInventory, onActivateGyro }) {
        this.btnGyro      = btnGyro;
        this.btnEagle     = btnEagle;
        this.btnInventory = btnInventory;
        this.onActivateGyro = onActivateGyro;

        // LS keys
        this.KEYS = {
            gyro:      'traca_tuto_gyro_v2',
            nav:       'traca_tuto_nav_v2',
            eagle:     'traca_tuto_eagle_v2',
            inventory: 'traca_tuto_inventory_v2',
            done:      'traca_tuto_done_v2'
        };

        this.done = localStorage.getItem(this.KEYS.done) === '1';
        this.steps = {
            gyro:      localStorage.getItem(this.KEYS.gyro)      === '1',
            nav:       localStorage.getItem(this.KEYS.nav)       === '1',
            eagle:     localStorage.getItem(this.KEYS.eagle)     === '1',
            inventory: localStorage.getItem(this.KEYS.inventory) === '1'
        };

        this._activePopup = null;
        this._injectStyles();
    }

    // ── API Publique ────────────────────────────────────────────────────────────

    /** Appelé dès que l'expérience démarre (bouton "Entrer" cliqué) */
    onExperienceStart() {
        if (this.done) return;

        // Gyro seulement sur mobile
        if (!this.steps.gyro && this._isMobile()) {
            setTimeout(() => this._showGyroHint(), 4000);
        } else if (!this.steps.gyro) {
            this._markStep('gyro'); // PC : skip gyro silencieusement
        }
    }

    /** Appelé quand les flèches de navigation sont affichées dans la scène */
    onArrowsShown() {
        if (this.done || this.steps.nav) return;
        setTimeout(() => this._showNavHint(), 800);
    }

    /** Appelé après une navigation (changement de node) */
    onNodeChanged() {
        if (this.done || !this.steps.nav || this.steps.eagle) return;
        setTimeout(() => this._showEagleHint(), 1200);
    }

    /** Appelé quand un artefact est découvert — artName = nom affiché */
    onArtifactFound(artName = 'Objet') {
        if (this.done || !this.steps.eagle) return;
        this._markStep('eagle'); // On marque eagle comme fait (la vision était active)
        setTimeout(() => this._showInventoryHint(artName), 600);
    }

    /** Appelé quand le joueur ouvre l'inventaire */
    onInventoryOpened() {
        if (this.steps.inventory) return;
        this._markStep('inventory');
        this._removeActivePopup();
        this._removePulse(this.btnInventory);
        // Vérifier si tout est done
        if (this.steps.gyro && this.steps.nav && this.steps.eagle && this.steps.inventory) {
            this._markDone();
        }
    }

    /** Appelé quand le joueur active la Vision d'Aigle */
    onEagleActivated() {
        if (this.steps.eagle) return;
        this._removeActivePopup();
        this._removePulse(this.btnEagle);
        // eagle se complète vraiment quand un artefact est trouvé
        // mais on retire l'hint dès l'activation
    }

    /** Appelé quand le joueur clique sur une flèche */
    onArrowUsed() {
        if (this.steps.nav) return;
        this._markStep('nav');
        this._removeActivePopup();
    }

    /** Reset complet (pour une nouvelle partie) */
    reset() {
        Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
        this.done = false;
        this.steps = { gyro: false, nav: false, eagle: false, inventory: false };
    }

    // ── Hints internes ──────────────────────────────────────────────────────────

    _showGyroHint() {
        if (this.steps.gyro) return;
        const popup = this._createPopup({
            id: 'tuto-gyro',
            icon: '📱',
            text: 'Mode immersif recommandé',
            primaryLabel: 'Activer',
            secondaryLabel: 'Plus tard',
            onPrimary: () => {
                this._markStep('gyro');
                this._removeActivePopup();
                this.onActivateGyro?.();
            },
            onSecondary: () => {
                this._markStep('gyro');
                this._removeActivePopup();
            }
        });
        this._showPopup(popup, 'top');
    }

    _showNavHint() {
        if (this.steps.nav) return;
        const popup = this._createPopup({
            id: 'tuto-nav',
            icon: '👆',
            text: 'Touchez une flèche pour explorer',
            autoClose: 6000
        });
        this._showPopup(popup, 'bottom');

        // Faire pulser les flèches de navigation (on dispatche un event)
        window.dispatchEvent(new CustomEvent('traca_tuto_pulse_arrows'));
    }

    _showEagleHint() {
        if (this.steps.eagle || !this.btnEagle) return;
        this._addPulse(this.btnEagle, 'tuto-eagle-pulse');
        const popup = this._createPopup({
            id: 'tuto-eagle',
            icon: '👁️',
            text: 'Activez la Vision pour trouver les objets cachés',
            autoClose: 0 // Reste jusqu'à activation
        });
        this._showPopup(popup, 'bottom', this.btnEagle);
    }

    _showInventoryHint(artName) {
        if (this.steps.inventory || !this.btnInventory) return;
        this._addPulse(this.btnInventory, 'tuto-inv-pulse');
        const popup = this._createPopup({
            id: 'tuto-inventory',
            icon: '✨',
            text: `"${artName}" ajouté — ouvrez l'inventaire`,
            autoClose: 0
        });
        this._showPopup(popup, 'bottom', this.btnInventory);
    }

    // ── Helpers DOM ──────────────────────────────────────────────────────────────

    _createPopup({ id, icon, text, primaryLabel, secondaryLabel, onPrimary, onSecondary, autoClose }) {
        const el = document.createElement('div');
        el.className = 'traca-tuto-popup';
        el.id        = id;

        let btns = '';
        if (primaryLabel) {
            btns += `<button class="traca-tuto-btn primary" data-role="primary">${primaryLabel}</button>`;
        }
        if (secondaryLabel) {
            btns += `<button class="traca-tuto-btn secondary" data-role="secondary">${secondaryLabel}</button>`;
        }

        el.innerHTML = `
            <span class="traca-tuto-icon">${icon}</span>
            <span class="traca-tuto-text">${text}</span>
            ${btns ? `<div class="traca-tuto-actions">${btns}</div>` : ''}
        `;

        if (onPrimary) {
            el.querySelector('[data-role="primary"]')?.addEventListener('click', onPrimary);
        }
        if (onSecondary) {
            el.querySelector('[data-role="secondary"]')?.addEventListener('click', onSecondary);
        }
        if (autoClose > 0) {
            setTimeout(() => {
                if (el.parentNode) el.remove();
                if (this._activePopup === el) this._activePopup = null;
            }, autoClose);
        }
        return el;
    }

    _showPopup(el, position = 'bottom', anchorBtn = null) {
        this._removeActivePopup();
        this._activePopup = el;

        if (anchorBtn) {
            // Positionner près du bouton
            el.classList.add('anchored');
            anchorBtn.parentNode?.insertBefore(el, anchorBtn);
        } else {
            el.setAttribute('data-pos', position);
            document.body.appendChild(el);
        }

        // Forcer un reflow avant d'ajouter 'visible' pour l'animation
        void el.offsetWidth;
        el.classList.add('visible');
    }

    _removeActivePopup() {
        if (this._activePopup) {
            this._activePopup.classList.remove('visible');
            setTimeout(() => this._activePopup?.remove(), 300);
            this._activePopup = null;
        }
    }

    _addPulse(el, cls) {
        el?.classList.add('traca-tuto-pulse', cls);
    }

    _removePulse(el) {
        el?.classList.remove('traca-tuto-pulse', 'tuto-eagle-pulse', 'tuto-inv-pulse');
    }

    _markStep(step) {
        this.steps[step] = true;
        localStorage.setItem(this.KEYS[step], '1');
    }

    _markDone() {
        this.done = true;
        localStorage.setItem(this.KEYS.done, '1');
    }

    _isMobile() {
        return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
               ('ontouchstart' in window && window.innerWidth < 1024);
    }

    // ── CSS injecté dynamiquement (zéro dépendance externe) ────────────────────

    _injectStyles() {
        if (document.getElementById('traca-tuto-styles')) return;
        const style = document.createElement('style');
        style.id = 'traca-tuto-styles';
        style.textContent = `
/* ── Popup tutoriel ── */
.traca-tuto-popup {
    position: fixed;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(10, 6, 2, 0.88);
    border: 1px solid rgba(231, 186, 128, 0.4);
    border-radius: 14px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(231,186,128,0.1);
    max-width: 88vw;
    pointer-events: auto;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.traca-tuto-popup.visible {
    opacity: 1;
    transform: translateY(0);
}
.traca-tuto-popup[data-pos="bottom"] {
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
}
.traca-tuto-popup[data-pos="bottom"].visible {
    transform: translateX(-50%) translateY(0);
}
.traca-tuto-popup[data-pos="top"] {
    top: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(-10px);
}
.traca-tuto-popup[data-pos="top"].visible {
    transform: translateX(-50%) translateY(0);
}
.traca-tuto-popup.anchored {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    white-space: nowrap;
}
.traca-tuto-popup.anchored.visible {
    transform: translateX(-50%) translateY(0);
}
.traca-tuto-icon {
    font-size: 1.4rem;
    flex-shrink: 0;
    line-height: 1;
}
.traca-tuto-text {
    font-size: 0.85rem;
    font-family: 'Cinzel', 'Times New Roman', serif;
    color: #e7ba80;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: 0.02em;
}
.traca-tuto-actions {
    display: flex;
    gap: 8px;
    margin-left: 4px;
    flex-shrink: 0;
}
.traca-tuto-btn {
    padding: 6px 14px;
    border: none;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    letter-spacing: 0.03em;
    transition: transform 0.1s, opacity 0.1s;
}
.traca-tuto-btn:active { transform: scale(0.95); }
.traca-tuto-btn.primary {
    background: linear-gradient(135deg, #e7ba80, #c49a50);
    color: #0a0600;
}
.traca-tuto-btn.secondary {
    background: rgba(255,255,255,0.08);
    color: rgba(231,186,128,0.7);
    border: 1px solid rgba(231,186,128,0.25);
}

/* ── Pulse animation sur les boutons ── */
@keyframes traca-tuto-pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(231,186,128,0.7); }
    70%  { box-shadow: 0 0 0 14px rgba(231,186,128,0); }
    100% { box-shadow: 0 0 0 0 rgba(231,186,128,0); }
}
.traca-tuto-pulse {
    animation: traca-tuto-pulse-ring 1.6s ease-out infinite !important;
    position: relative;
    z-index: 10;
}

/* ── Pulse sur les flèches Three.js — via classe body ── */
/* (les flèches sont WebGL, le pulse visuel est géré en JS dans NodeNavigator) */
        `;
        document.head.appendChild(style);
    }
}
