import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class MultiverseSpheres {
    constructor(scene) {
        this.scene = scene;
        this.sphereDay   = null;
        this.sphereNight = null;
        this.timeMode    = 'day';
    }

    init(texDay, texNight) {
        // Nettoyer les anciennes sphères si elles existent déjà
        this._disposeSphere(this.sphereDay);
        this._disposeSphere(this.sphereNight);

        const geo = new THREE.SphereGeometry(500, 60, 40);
        geo.scale(-1, 1, 1);

        // Sphère Jour
        this.sphereDay = new THREE.Mesh(geo,
            new THREE.MeshBasicMaterial({ map: texDay })
        );
        this.scene.add(this.sphereDay);

        // Sphère Nuit (invisible par défaut)
        this.sphereNight = new THREE.Mesh(geo,
            new THREE.MeshBasicMaterial({ map: texNight, transparent: true, opacity: 0 })
        );
        this.scene.add(this.sphereNight);
    }

    /**
     * Bascule Jour ↔ Nuit avec fondu.
     * @param {number} duration - Durée de l'animation en secondes
     * @param {function} onComplete - Callback appelé avec le nouveau mode ('day'|'night')
     * @returns {string} Le prochain mode (avant que le fondu soit fini)
     */
    toggleTimeTravel(duration = 1.5, onComplete = null) {
        if (!this.sphereDay || !this.sphereNight) return this.timeMode;

        const goingToNight = this.timeMode === 'day';
        const targetOpacity = goingToNight ? 1 : 0;
        const nextMode = goingToNight ? 'night' : 'day';

        if (window.gsap) {
            window.gsap.to(this.sphereNight.material, {
                opacity: targetOpacity,
                duration,
                ease: 'power2.inOut',
                onComplete: () => {
                    this.timeMode = nextMode;
                    if (onComplete) onComplete(this.timeMode);
                }
            });
        } else {
            // Fallback instantané sans GSAP
            this.sphereNight.material.opacity = targetOpacity;
            this.timeMode = nextMode;
            if (onComplete) onComplete(this.timeMode);
        }

        return nextMode;
    }

    _disposeSphere(sphere) {
        if (!sphere) return;
        this.scene.remove(sphere);
        sphere.material?.map?.dispose();
        sphere.material?.dispose();
        // La géométrie est partagée, on ne la dispose pas ici
    }

    dispose() {
        this._disposeSphere(this.sphereDay);
        this._disposeSphere(this.sphereNight);
        this.sphereDay = null;
        this.sphereNight = null;
    }
}
