/**
 * InventoryModule — Traca Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Gère tout l'inventaire visuel :
 *   - Barre de slots inférieure (#c-inventory-bar)
 *   - Modal Codex (#c-inventory-modal)
 *   - Fiche artéfact (vue parchemin)
 *   - Toast notifications
 *   - Réinitialisation de la quête
 *
 * Dépendances : tracaAudio (injection), ARTIFACTS_DB (injection)
 * Aucune dépendance Three.js.
 */
export class InventoryModule {
    /**
     * @param {Object} artifactsDB   — Base de données des artéfacts { nodeId: artData }
     * @param {Object} tracaAudio    — Instance TracaAudio
     * @param {Function} bindBtn     — Helper de binding bouton (click + touchstart)
     * @param {Set} foundArtifacts   — Set partagé avec le state principal
     */
    /**
     * @param {Object} artifactsDB   — Base de données des artéfacts { nodeId: artData }
     * @param {Object} tracaAudio    — Instance TracaAudio
     * @param {Function} bindBtn     — Helper de binding bouton (click + touchstart)
     * @param {Set} foundArtifacts   — Set partagé avec le state principal
     * @param {Function} onResetQuest — Callback optionnel lors de la réinitialisation de la quête
     */
    constructor(artifactsDB, tracaAudio, bindBtn, foundArtifacts, onResetQuest = null) {
        this.db            = artifactsDB;
        this.audio         = tracaAudio;
        this.bindBtn       = bindBtn;
        this.foundArtifacts = foundArtifacts;
        this.onResetQuest  = onResetQuest;

        this._toastTimeout = null;
        this._initElements();
        this._bindEvents();
    }

    _initElements() {
        this.inventoryModal    = document.getElementById('c-inventory-modal');
        this.slotsContainer    = document.getElementById('c-inventory-slots');
        this.divider           = document.querySelector('#c-inventory-bar .inv-divider');
        this.codexGrid         = document.getElementById('c-codex-grid');
        this.detailsPanel      = document.getElementById('chest-details-panel');
        this.codexListView     = document.getElementById('codex-list-view');
        this.codexDetailView   = document.getElementById('codex-detail-view');
        this.btnOpenInventory  = document.getElementById('btn-open-inventory');
    }

    _bindEvents() {
        // Bouton ouvrir Codex
        if (this.btnOpenInventory) {
            this.bindBtn(this.btnOpenInventory, () => this.openModal());
        }
        // Bouton fermer (× dans le coin)
        const btnClose = document.getElementById('btn-close-modal');
        if (btnClose) this.bindBtn(btnClose, () => this.closeModal());
        // Clic sur l'overlay sombre
        const overlay = document.getElementById('modal-overlay-close');
        if (overlay) this.bindBtn(overlay, () => this.closeModal());
        // Bouton réinitialiser
        const btnReset = document.querySelector('.btn-reset-quest');
        if (btnReset) this.bindBtn(btnReset, () => this.resetQuest(false));
    }

    // ── API publique ──────────────────────────────────────────────────────────

    /** Met à jour la barre de slots ET la grille Codex */
    updateUI() {
        this._renderSlots();
        this._renderCodexGrid();
    }

    openModal() {
        if (!this.inventoryModal) return;
        this.inventoryModal.style.display = 'flex';
        this.updateUI();
        this.showCodexList();
        this.audio?.playSFX('ui/click.mp3');
    }

    closeModal() {
        if (!this.inventoryModal) return;
        this.inventoryModal.style.display = 'none';
        this.audio?.playSFX('ui/click.mp3');
    }

    showArtifactDetails(id) {
        const art = this._findArt(id);
        if (!art) return;

        // Désélectionner tous, sélectionner le cliqué
        Object.values(this.db).forEach(a => {
            document.getElementById(`chest-${a.id}`)?.classList.remove('selected');
        });
        document.getElementById(`chest-${id}`)?.classList.add('selected');

        if (!this.detailsPanel) return;
        const isFound = this.foundArtifacts.has(id);

        if (isFound) {
            const displayImg = art.iconImg || art.image;
            const mediaHtml  = displayImg
                ? `<img src="${displayImg}" class="details-img" alt="${art.name}">`
                : `<span class="details-icon">${art.icon}</span>`;

            this.detailsPanel.innerHTML = `
                <div style="display:flex;align-items:center;gap:14px;flex-shrink:0;">
                    ${mediaHtml}
                    <div>
                        <h3 class="details-name">${art.name}</h3>
                        <p class="details-sub">${art.subtitle}</p>
                    </div>
                </div>
                <div class="details-desc-container">
                    <p class="details-desc">${art.desc}</p>
                    ${art.fonction ? `<div class="details-fonction"><span class="fonction-label">Fonction</span>${art.fonction}</div>` : ''}
                </div>
                ${art.usable ? `
                <button id="btn-use-${art.id}" class="btn-main" style="margin-top: 15px; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Utiliser
                </button>` : ''}
            `;

            if (art.usable) {
                const btnUse = document.getElementById(`btn-use-${art.id}`);
                if (btnUse) {
                    this.bindBtn(btnUse, () => {
                        window.dispatchEvent(new CustomEvent('traca_use_item', { detail: art.id }));
                    });
                }
            }
        } else {
            this.detailsPanel.innerHTML = `
                <div style="display:flex;align-items:center;gap:14px;flex-shrink:0;opacity:0.4;">
                    <span class="details-icon">🔒</span>
                    <div>
                        <h3 class="details-name">Artéfact Inconnu</h3>
                        <p class="details-sub">Non Découvert</p>
                    </div>
                </div>
                <p class="details-hint">🔍 Explorez d'autres lieux dans la Casbah en Vision d'Aigle.</p>
            `;
        }

        this.audio?.playSFX('ui/click.mp3');
    }

    showCodexList() {
        // Plus de vue séparée — l'inventaire est toujours visible
        this.audio?.playSFX('ui/click.mp3');
    }

    showToast(text) {
        let toast = document.getElementById('traca-toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id        = 'traca-toast-notification';
            toast.className = 'traca-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = text;
        toast.classList.add('active');

        if (this._toastTimeout) clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => toast.classList.remove('active'), 3500);
    }

    resetQuest(silent = false) {
        if (!silent && !confirm("Voulez-vous vraiment réinitialiser votre collection d'artéfacts ?")) return;

        this.foundArtifacts.clear();
        try { localStorage.removeItem('traca_found_artifacts'); } catch (_) {}

        this.updateUI();

        if (this.detailsPanel) {
            this.detailsPanel.innerHTML = `
                <p class="select-hint">
                    Aucun artéfact découvert.<br>
                    <span style="color:#b5884e;font-weight:bold;">Activez la Vision d'Aigle (👁️)</span>
                    pour explorer la Casbah.
                </p>
            `;
        }

        this.closeModal();
        this.showToast('Collection réinitialisée. Reprenez vos recherches !');
        this.audio?.playSFX('ui/error.mp3');
        this.onResetQuest?.();
    }

    // ── Rendu interne ─────────────────────────────────────────────────────────

    _renderSlots() {
        if (!this.slotsContainer) return;
        this.slotsContainer.innerHTML = '';

        const found = this._getFoundArts();
        if (this.divider) this.divider.style.display = found.length > 0 ? 'block' : 'none';

        found.forEach(art => {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.setAttribute('data-id', art.id);
            this.bindBtn(slot, () => this._onSlotClick(art.id));

            const img = art.iconImg || art.image;
            if (img) {
                slot.innerHTML = `
                    <img src="${img}" style="width:28px;height:28px;object-fit:contain;" alt="${art.name}">
                    <span class="inv-tooltip">${art.name}</span>
                `;
            } else {
                slot.innerHTML = `
                    <span class="inv-icon">${art.icon}</span>
                    <span class="inv-tooltip">${art.name}</span>
                `;
            }
            this.slotsContainer.appendChild(slot);
        });
    }

    _renderCodexGrid() {
        if (!this.codexGrid) return;
        this.codexGrid.innerHTML = '';

        const found = this._getFoundArts();
        if (found.length === 0) {
            this.codexGrid.innerHTML = `
                <div class="codex-empty">
                    Votre Codex est vide.<br>
                    <strong>Activez la Vision d'Aigle 👁️</strong> pour découvrir des artéfacts cachés.
                </div>
            `;
            return;
        }

        found.forEach(art => {
            const el = document.createElement('div');
            el.className = 'chest-item';
            el.id        = `chest-${art.id}`;
            this.bindBtn(el, () => this.showArtifactDetails(art.id));

            const img = art.iconImg || art.image;
            const iconHtml = img
                ? `<img src="${img}" style="width:32px;height:32px;object-fit:contain;" alt="${art.name}">`
                : art.icon;

            el.innerHTML = `
                <div class="item-icon-wrap">${iconHtml}</div>
                <div class="item-meta">
                    <h3>${art.name}</h3>
                    <p class="item-status" style="color:#2e7d32;font-weight:bold;">Découvert</p>
                </div>
            `;
            this.codexGrid.appendChild(el);
        });
    }

    _onSlotClick(id) {
        this.openModal();
        this.showArtifactDetails(id);
    }

    _getFoundArts() {
        return Object.values(this.db).filter(a => this.foundArtifacts.has(a.id));
    }

    _findArt(id) {
        return Object.values(this.db).find(a => a.id === id) || null;
    }
}
