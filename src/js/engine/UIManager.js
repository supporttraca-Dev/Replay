/**
 * UIManager — REPLAY Engine
 * Gère tout le DOM de l'interface : Loader, Menu, HUD, Popups.
 * N'a aucune connaissance de Three.js ou du moteur de jeu.
 */
export class UIManager {
    constructor() {
        // Loader
        this.loaderEl    = document.getElementById('c-loader');
        this.barEl       = document.getElementById('c-loader-bar');
        this.pctEl       = document.getElementById('c-loader-pct');
        this.labelEl     = document.getElementById('c-loader-label');
        this.enterBtnEl  = document.getElementById('c-loader-enter');

        // Menu principal
        this.menuEl      = document.getElementById('c-menu');

        // HUD in-experience
        this.hudEl       = document.getElementById('c-hud');

        // Popup de contenu (POI)
        this.popupEl          = document.getElementById('c-popup');
        this.popupTitleEl     = document.getElementById('c-popup-title');
        this.popupDescEl      = document.getElementById('c-popup-desc');
        this.popupTranscEl    = document.getElementById('c-popup-transcript');
        this.popupCloseEl     = document.getElementById('c-popup-close');

        this._popupCloseHandler = null;
        this._bindPopupClose();
    }

    // ─── LOADER ──────────────────────────────────────────────────────────────

    /**
     * Met à jour la barre de progression (0 → 100).
     */
    setProgress(value) {
        const v = Math.max(0, Math.min(100, value));
        if (this.barEl)  this.barEl.style.width = v + '%';
        if (this.pctEl)  this.pctEl.innerText   = Math.round(v) + '%';
    }

    /**
     * Appelé quand le chargement est terminé à 100%.
     * Active le bouton d'entrée dans le loader.
     * @param {function} onEnter - Callback appelé quand l'utilisateur clique.
     */
    readyToEnter(onEnter) {
        this.setProgress(100);
        if (this.labelEl) this.labelEl.innerText = 'Prêt — Bienvenue !';

        if (this.enterBtnEl) {
            // Activer le bouton
            this.enterBtnEl.style.opacity       = '1';
            this.enterBtnEl.style.pointerEvents = 'auto';
            this.enterBtnEl.style.filter        = 'none';
            this.enterBtnEl.style.cursor        = 'pointer';

            // Animation d'entrée
            if (window.gsap) {
                window.gsap.fromTo(this.enterBtnEl,
                    { opacity: 0.4, scale: 0.95 },
                    { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
                );
            }

            // Hover effects
            this.enterBtnEl.addEventListener('mouseenter', () => {
                this.enterBtnEl.style.transform = 'scale(1.04)';
            });
            this.enterBtnEl.addEventListener('mouseleave', () => {
                this.enterBtnEl.style.transform = 'scale(1)';
            });

            // Clic une seule fois
            this.enterBtnEl.addEventListener('click', () => {
                this._hideLoader(() => {
                    if (onEnter) onEnter();
                });
            }, { once: true });
        } else {
            // Fallback si le bouton n'existe pas dans le HTML
            setTimeout(() => {
                this._hideLoader(() => {
                    if (onEnter) onEnter();
                });
            }, 500);
        }
    }

    _hideLoader(onComplete) {
        if (!this.loaderEl) { if (onComplete) onComplete(); return; }

        this.loaderEl.style.transition = 'opacity 0.8s ease';
        this.loaderEl.style.opacity    = '0';
        setTimeout(() => {
            this.loaderEl.style.display = 'none';
            if (onComplete) onComplete();
        }, 850);
    }

    // ─── MENU ────────────────────────────────────────────────────────────────

    showMenu() {
        if (!this.menuEl) return;
        this.menuEl.removeAttribute('hidden');
        this.menuEl.style.display = '';
    }

    hideMenu() {
        if (!this.menuEl) return;
        this.menuEl.setAttribute('hidden', '');
    }

    // ─── HUD ─────────────────────────────────────────────────────────────────

    showHUD() {
        if (this.hudEl) this.hudEl.classList.remove('hidden');
    }

    hideHUD() {
        if (this.hudEl) this.hudEl.classList.add('hidden');
    }

    // ─── POPUP (Contenu POI) ──────────────────────────────────────────────────

    showPopup(title = '', description = '', transcript = '') {
        if (!this.popupEl) return;

        if (this.popupTitleEl)  this.popupTitleEl.textContent  = title;
        if (this.popupDescEl)   this.popupDescEl.textContent   = description;
        if (this.popupTranscEl) this.popupTranscEl.textContent = transcript || '';

        this.popupEl.classList.remove('hidden');

        if (window.gsap) {
            window.gsap.fromTo(this.popupEl,
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
            );
        }

        this.hideHUD();
    }

    hidePopup() {
        if (!this.popupEl) return;
        this.popupEl.classList.add('hidden');
        this.showHUD();
    }

    _bindPopupClose() {
        if (this.popupCloseEl) {
            this.popupCloseEl.addEventListener('click', () => this.hidePopup());
        }
    }
}
