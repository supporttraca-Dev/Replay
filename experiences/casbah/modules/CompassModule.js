/**
 * CompassModule — Traca Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Boussole hors-champ : affiche un indicateur de direction pour guider le joueur
 * vers le prochain POI actif qui sort du champ de vision.
 *
 * Logique :
 *   - Chaque frame : projette la position 3D du POI sur l'écran
 *   - Si hors-champ → affiche la boussole sur le bord de l'écran avec une flèche
 *   - Opacité proportionnelle à la distance angulaire :
 *       • Loin (> 90°) → 10% d'opacité
 *       • Proche (< 45°) → 100% d'opacité + animation pulse
 *   - En mode Eagle Vision : boussole cachée
 *
 * Utilisation : appeler compass.update(camera, activePoi) dans chaque frame.
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class CompassModule {
    /**
     * @param {HTMLElement} compassEl       — #poi-compass
     * @param {HTMLElement} compassArrowEl  — #poi-compass-arrow (SVG rotation)
     */
    constructor(compassEl, compassArrowEl) {
        this.el    = compassEl;
        this.arrow = compassArrowEl;

        this._visible = false;
        if (this.el) this.el.style.display = 'none';
    }

    // ── API publique ──────────────────────────────────────────────────────────

    /**
     * À appeler à chaque frame dans _animate().
     * @param {THREE.Camera} camera
     * @param {THREE.Vector3|null} targetWorldPos   — position 3D du POI cible (null = cacher)
     * @param {boolean} eagleVisionActive
     */
    update(camera, targetWorldPos, eagleVisionActive = false) {
        if (!this.el || !targetWorldPos || eagleVisionActive) {
            this._hide();
            return;
        }

        // Direction caméra → cible
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);

        const toTarget = targetWorldPos.clone().sub(camera.position).normalize();
        const dot      = camDir.dot(toTarget); // 1 = devant, -1 = derrière
        const angle    = Math.acos(Math.max(-1, Math.min(1, dot))); // 0..PI (radians)

        // Si dans le champ de vision (angle < 50°) → cacher
        if (angle < Math.PI / 3.6) {
            this._hide();
            return;
        }

        // Opacité : loin → 10%, proche du bord → 100%
        const opacity = this._calcOpacity(angle);
        this.el.style.opacity = opacity.toFixed(2);

        // Rotation de la flèche : projection dans l'espace écran
        const screenAngle = this._getScreenAngle(camera, targetWorldPos);
        if (this.arrow) {
            this.arrow.style.transform = `rotate(${screenAngle}deg)`;
        }

        // Positionnement sur le bord de l'écran
        this._positionOnEdge(camera, targetWorldPos);
        this._show();
    }

    hide() { this._hide(); }

    // ── Interne ───────────────────────────────────────────────────────────────

    _show() {
        if (!this._visible) {
            this.el.style.display = 'flex';
            this._visible = true;
        }
    }

    _hide() {
        if (this._visible || this.el?.style.display !== 'none') {
            if (this.el) this.el.style.display = 'none';
            this._visible = false;
        }
    }

    /**
     * Opacité basée sur l'angle (PI/3.6 → PI)
     * angle proche de PI/3.6 (juste hors-champ) → 100%
     * angle proche de PI (totalement derrière) → 10%
     */
    _calcOpacity(angle) {
        const min = Math.PI / 3.6; // ~50°
        const max = Math.PI;       // 180°
        const t   = (angle - min) / (max - min); // 0..1
        return Math.max(0.10, 1.0 - t * 0.9);   // 100%..10%
    }

    /**
     * Angle de rotation de la flèche (degrés) basé sur la projection 2D.
     */
    _getScreenAngle(camera, targetWorldPos) {
        const W = window.innerWidth;
        const H = window.innerHeight;

        // Projette le point 3D dans l'espace clip [-1,1]
        const proj = targetWorldPos.clone().project(camera);

        // Vecteur du centre de l'écran vers la projection
        const dx = proj.x; // déjà normalisé
        const dy = -proj.y; // Y inversé (CSS)

        return (Math.atan2(dy, dx) * 180 / Math.PI) + 90; // +90 car flèche pointe vers le haut
    }

    /**
     * Positionne la boussole sur le bord de l'écran dans la direction du POI.
     */
    _positionOnEdge(camera, targetWorldPos) {
        const W    = window.innerWidth;
        const H    = window.innerHeight;
        const MARGIN = 56; // distance au bord
        const SIZE   = 48; // taille de la boussole

        const proj = targetWorldPos.clone().project(camera);
        const dx   = proj.x;
        const dy   = -proj.y;

        // Normalise vers le bord du rectangle
        const maxAbs = Math.max(Math.abs(dx), Math.abs(dy));
        const nx     = dx / maxAbs;
        const ny     = dy / maxAbs;

        const x = Math.round(W / 2 + nx * (W / 2 - MARGIN - SIZE / 2));
        const y = Math.round(H / 2 + ny * (H / 2 - MARGIN - SIZE / 2));

        this.el.style.left = `${x}px`;
        this.el.style.top  = `${y}px`;
        // Utilise transform translate(-50%,-50%) pour centrer (déjà dans le CSS)
    }
}
