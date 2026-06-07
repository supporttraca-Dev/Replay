/**
 * EagleVisionModule — Traca Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Gère le mode "Vision d'Aigle" :
 *   - Overlay canvas 2D (réticule, vignette, particules dorées, anneau de chargement)
 *   - Filtre CSS grayscale sur le canvas WebGL
 *   - Détection progressive via dot product caméra ↔ direction artéfact
 *   - Révélation de l'artéfact après 2 secondes de verrouillage
 *   - Sons (focus, reveal) et ducking de la musique
 *   - Popup de récompense
 *
 * Dépendances injectées : camera (Three.js), tracaAudio, InventoryModule, state
 * Appeler update() dans chaque frame de la boucle de rendu.
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class EagleVisionModule {
    /**
     * @param {Object} deps
     * @param {THREE.Camera}  deps.camera
     * @param {Object}        deps.tracaAudio
     * @param {HTMLElement}   deps.canvasEl       — #eagle-vision-canvas
     * @param {HTMLElement}   deps.webglWrap      — #c-canvas-wrap
     * @param {HTMLElement}   deps.rewardPopup    — #hidden-reward-popup
     * @param {HTMLElement}   deps.btnEagle       — #btn-hud-eagle
     * @param {Object}        deps.artifactsDB    — base de données des artéfacts
     * @param {Set}           deps.foundArtifacts — Set partagé (artéfacts trouvés)
     * @param {InventoryModule} deps.inventory    — pour mettre à jour l'UI
     * @param {Function}      deps.onStopVoice    — callback pour couper la narration
     * @param {Function}      deps.onUpdatePois   — callback pour rafraîchir la visibilité POI
     * @param {Function}      deps.showToast      — callback toast
     * @param {Object}        deps.state          — state partagé { currentNodeId, baseFov, targetFov }
     */
    constructor(deps) {
        Object.assign(this, deps);

        this.isActive         = false;
        this.isFocusing       = false;
        this.hiddenObjectTimer = 0;
        this._ctx             = null;
        this._particles       = null;
        this._toastTimeout    = null;

        this._bindEvents();
    }

    _bindEvents() {
        if (this.btnEagle) {
            // click-only (pas touchstart) pour éviter la collision avec les gestes
            this.btnEagle.addEventListener('click', () => this.toggle());
        }
    }

    // ── API publique ──────────────────────────────────────────────────────────

    toggle() {
        this.isActive = !this.isActive;

        if (this.isActive) {
            this._activateMode();
        } else {
            this._deactivateMode();
        }
        this.onUpdatePois?.();
    }

    /** À appeler dans chaque frame de requestAnimationFrame */
    update() {
        if (!this.isActive || !this.canvasEl) return;

        let artifact = this.artifactsDB[this.state.currentNodeId];

        // Masquer les artefacts dayOnly si on est en mode nuit
        if (artifact && artifact.dayOnly && this.state.isNight) {
            artifact = null;
        }

        const alreadyFound = artifact ? this.foundArtifacts.has(artifact.id) : true;

        if (artifact && !alreadyFound) {
            this._processArtifactDetection(artifact);
        } else {
            // Aucun artéfact actif → réticule inerte
            this._resetFocus();
            this._draw(0);
            this.canvasEl.classList.add('active');
        }
    }

    deactivate() { if (this.isActive) this._deactivateMode(); }

    // ── Activation / Désactivation ────────────────────────────────────────────

    _activateMode() {
        if (this.btnEagle) this.btnEagle.classList.add('active');

        if (this.webglWrap) {
            this.webglWrap.style.transition = 'filter 0.6s ease';
            this.webglWrap.style.filter     = 'grayscale(100%) contrast(1.15) brightness(0.8)';
        }

        this.state.eagleVisionActive = true;
        this.tracaAudio?.playSFX('ui/enter.mp3');

        const artifact     = this.artifactsDB[this.state.currentNodeId];
        const alreadyFound = artifact ? this.foundArtifacts.has(artifact.id) : true;
        if (alreadyFound) this.showToast?.('👁️ Zone déjà explorée — Aucun artéfact actif.');

        this.onStopVoice?.();
    }

    _deactivateMode() {
        this.isActive = false;
        this.state.eagleVisionActive = false;

        if (this.btnEagle) this.btnEagle.classList.remove('active');

        if (this.webglWrap) {
            this.webglWrap.style.transition = 'filter 0.6s ease';
            this.webglWrap.style.filter     = '';
        }

        this._stopFocus();
        this.canvasEl?.classList.remove('active');
        this._clearCanvas();
    }

    // ── Détection ─────────────────────────────────────────────────────────────

    _processArtifactDetection(artifact) {
        const { targetAz, targetPol } = artifact;
        const tx = Math.sin(targetPol) * Math.cos(targetAz);
        const ty = Math.cos(targetPol);
        const tz = Math.sin(targetPol) * Math.sin(targetAz);

        const targetDir = new THREE.Vector3(tx, ty, tz).normalize();
        const camDir    = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        camDir.normalize();

        const dot            = camDir.dot(targetDir);
        const DETECT_START   = 0.75;
        const LOCK_START     = 0.975;

        let intensity = 0;
        if (dot > DETECT_START) {
            intensity = Math.min(1, (dot - DETECT_START) / (LOCK_START - DETECT_START));
        }

        this._draw(intensity);
        this.canvasEl.classList.add('active');

        if (dot > LOCK_START) {
            this._onLock();
        } else if (dot > DETECT_START) {
            this._onNear();
        } else {
            this._onFar();
        }
    }

    _onLock() {
        if (!this.isFocusing) {
            this.isFocusing = true;
            this.tracaAudio?.playLoopSFX('sfx_magical_focus.mp3', 1.0);
            window.gsap?.to(this.tracaAudio?.channels.music, {
                volume: (this.tracaAudio?.volumes.music ?? 0.35) * 0.10,
                duration: 0.8, overwrite: 'auto'
            });
        }
        this.hiddenObjectTimer += 16;
        if (this.hiddenObjectTimer > 2000) {
            const artifact = this.artifactsDB[this.state.currentNodeId];
            if (artifact) this._triggerReveal(artifact);
        }
    }

    _onNear() {
        this.hiddenObjectTimer = 0;
        this._stopFocus();
        window.gsap?.to(this.tracaAudio?.channels.music, {
            volume: (this.tracaAudio?.volumes.music ?? 0.35) * 0.40,
            duration: 1.0, overwrite: 'auto'
        });
    }

    _onFar() {
        this._resetFocus();
        window.gsap?.to(this.tracaAudio?.channels.music, {
            volume: this.tracaAudio?.volumes.music ?? 0.35,
            duration: 1.0, overwrite: 'auto'
        });
    }

    _resetFocus() {
        this.hiddenObjectTimer = 0;
        this._stopFocus();
    }

    _stopFocus() {
        if (this.isFocusing) {
            this.tracaAudio?.stopLoopSFX();
            this.isFocusing = false;
            if (!this.foundArtifacts.has(this.artifactsDB[this.state.currentNodeId]?.id)) {
                window.gsap?.to(this.tracaAudio?.channels.music, {
                    volume: this.tracaAudio?.volumes.music ?? 0.35,
                    duration: 1.0, overwrite: 'auto'
                });
            }
        }
    }

    // ── Révélation ────────────────────────────────────────────────────────────

    _triggerReveal(artifact) {
        this._stopFocus();

        // Sauvegarder l'artéfact
        this.foundArtifacts.add(artifact.id);

        // Mettre à jour l'UI inventaire
        this.inventory?.updateUI();
        this.onArtifactFound?.(artifact.id);
        this.showToast?.(`✨ <span class="toast-gold">${artifact.name}</span> ajouté au Codex !`);

        // Mettre à jour le popup de récompense
        if (this.rewardPopup) {
            const iconEl = this.rewardPopup.querySelector('.popup-icon');
            if (iconEl) {
                iconEl.innerHTML = artifact.iconImg
                    ? `<img src="${artifact.iconImg}" class="popup-icon-img" alt="${artifact.name}">`
                    : artifact.icon;
            }
            this.rewardPopup.querySelector('.popup-name').innerText     = artifact.name;
            this.rewardPopup.querySelector('.popup-subtitle').innerText = artifact.subtitle;
            this.rewardPopup.querySelector('.popup-desc').innerText     = artifact.desc;
        }

        // Désactiver Eagle Vision et restaurer la couleur
        this._deactivateMode();
        this.onUpdatePois?.();

        // Effet cinématique
        document.body.classList.add('shake-active');
        setTimeout(() => document.body.classList.remove('shake-active'), 700);

        // Zoom in → dézoom
        if (this.camera && this.state) {
            this.camera.fov = (this.state.baseFov ?? 75) - 20;
            this.camera.updateProjectionMatrix();
            this.state.targetFov = this.state.baseFov ?? 75;
        }

        // Sons
        this.tracaAudio?.playSFX('sfx_reveal_artifact.mp3');
        if (this.tracaAudio?.channels?.sfx) this.tracaAudio.channels.sfx.volume = 1.0;
        window.gsap?.to(this.tracaAudio?.channels.music, {
            volume: this.tracaAudio?.volumes.music ?? 0.35,
            duration: 2.0, delay: 2.5, overwrite: 'auto'
        });

        // Afficher le popup
        if (this.rewardPopup) {
            this.rewardPopup.style.display   = 'block';
            setTimeout(() => {
                this.rewardPopup.style.opacity   = '1';
                this.rewardPopup.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
        }
    }

    // ── Canvas Draw ───────────────────────────────────────────────────────────

    _clearCanvas() {
        if (!this._ctx) return;
        const c = this.canvasEl;
        this._ctx.clearRect(0, 0, c.width, c.height);
    }

    _draw(intensity) {
        const c = this.canvasEl;
        if (!this._ctx) {
            c.width  = window.innerWidth;
            c.height = window.innerHeight;
            this._ctx = c.getContext('2d');
        }
        if (c.width !== window.innerWidth || c.height !== window.innerHeight) {
            c.width  = window.innerWidth;
            c.height = window.innerHeight;
        }

        const ctx = this._ctx;
        const W   = c.width, H = c.height;
        const cx  = W / 2, cy = H / 2;
        const t   = performance.now();

        ctx.clearRect(0, 0, W, H);

        // 1. Vignette noire
        const vR    = Math.min(W, H) * (0.7 - intensity * 0.35);
        const vGrad = ctx.createRadialGradient(cx, cy, vR * 0.2, cx, cy, Math.max(W, H) * 0.75);
        vGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vGrad.addColorStop(0.5, `rgba(0,0,0,${intensity * 0.5})`);
        vGrad.addColorStop(1, `rgba(0,0,0,${0.55 + intensity * 0.4})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, W, H);

        // 2. Masque B&W
        const bwGrad = ctx.createRadialGradient(cx, cy, vR * 0.3, cx, cy, Math.max(W, H) * 0.6);
        bwGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bwGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
        bwGrad.addColorStop(1, `rgba(20,15,5,${intensity * 0.85})`);
        ctx.fillStyle = bwGrad;
        ctx.fillRect(0, 0, W, H);

        if (intensity >= 0.05) {
            // 3. Anneaux pulsants
            for (let i = 0; i < 3; i++) {
                const speed  = 0.0008 + i * 0.0003;
                const phase  = (t * speed + i * 0.6) % 1;
                const ringR  = vR * (0.15 + phase * 0.85);
                const alpha  = (1 - phase) * intensity * 0.25;
                if (alpha < 0.005) continue;
                const pulse  = 1 + Math.sin(t * 0.003 + i) * 0.015;
                ctx.beginPath();
                ctx.arc(
                    cx + Math.sin(t * 0.0007 + i) * 4,
                    cy + Math.cos(t * 0.0009 + i) * 4,
                    ringR * pulse, 0, Math.PI * 2
                );
                ctx.strokeStyle = `rgba(231,186,128,${alpha})`;
                ctx.lineWidth   = 1.5 - phase;
                ctx.stroke();
            }

            // 4. Halo central
            const hR    = vR * (0.12 + Math.sin(t * 0.004) * 0.03);
            const hA    = intensity * (0.3 + Math.sin(t * 0.004) * 0.15);
            const hGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hR);
            hGrad.addColorStop(0, `rgba(231,186,128,${hA})`);
            hGrad.addColorStop(0.5, `rgba(181,136,78,${hA * 0.4})`);
            hGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = hGrad;
            ctx.beginPath(); ctx.arc(cx, cy, hR, 0, Math.PI * 2); ctx.fill();

            // 5. Particules dorées
            if (!this._particles) {
                this._particles = Array.from({ length: 28 }, () => ({
                    angle: Math.random() * Math.PI * 2,
                    radius: 0.3 + Math.random() * 0.65,
                    speed: (0.0004 + Math.random() * 0.0006) * (Math.random() > 0.5 ? 1 : -1),
                    size: 1.5 + Math.random() * 2.5,
                    opacity: 0.3 + Math.random() * 0.5,
                    offset: Math.random() * Math.PI * 2
                }));
            }
            this._particles.forEach(p => {
                p.angle += p.speed;
                const r  = vR * p.radius * (1 - intensity * 0.3);
                const px = cx + Math.cos(p.angle) * r;
                const py = cy + Math.sin(p.angle) * r;
                const fl = 0.6 + Math.sin(t * 0.005 + p.offset) * 0.4;
                ctx.beginPath();
                ctx.arc(px, py, p.size * intensity, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(231,186,128,${p.opacity * intensity * fl})`;
                ctx.fill();
            });
        }

        // 6. Réticule à 3 cercles
        const scale = 1.0 + intensity * 0.25;
        const pulse = Math.sin(t * 0.004) * 2 * intensity;
        const alpha = 0.1 + intensity * 0.9;
        const [r1, r2, r3] = [30, 50, 70].map(r => r * scale + pulse);

        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(231,186,128,${alpha})`; ctx.lineWidth = 1.5 + intensity; ctx.stroke();

        ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(231,186,128,${alpha})`; ctx.lineWidth = 1 + intensity * 0.5;
        ctx.setLineDash([4 + intensity * 4, 4 + intensity * 4]); ctx.stroke(); ctx.setLineDash([]);

        ctx.beginPath(); ctx.arc(cx, cy, r3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(231,186,128,${alpha})`; ctx.lineWidth = 2 + intensity; ctx.stroke();

        // 7. Arc de progression
        if (this.hiddenObjectTimer > 0) {
            const progress = Math.min(1, this.hiddenObjectTimer / 2000);
            ctx.beginPath();
            ctx.arc(cx, cy, r2 + 4, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
            ctx.strokeStyle   = '#e7ba80';
            ctx.lineWidth     = 4;
            ctx.lineCap       = 'round';
            ctx.shadowColor   = '#e7ba80';
            ctx.shadowBlur    = 12;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
}
