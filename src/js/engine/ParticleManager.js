import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class ParticleManager {
    constructor(sceneEngine) {
        this.sceneEngine = sceneEngine;
        this.particles = null;
    }

    init() {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            const radius = 5 + Math.random() * 150;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.cos(phi);
            positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xddccaa, 
            size: 1.2,
            map: this._createDustTexture(),
            transparent: true,
            opacity: 0.2,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.sceneEngine.add(this.particles);
    }

    _createDustTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        return new THREE.CanvasTexture(canvas);
    }

    update() {
        if (this.particles) {
            this.particles.rotation.y += 0.0003;
            this.particles.rotation.z += 0.0001;
        }
    }

    dispose() {
        if (this.particles) {
            this.sceneEngine.remove(this.particles);
            this.particles.geometry.dispose();
            if (this.particles.material.map) this.particles.material.map.dispose();
            this.particles.material.dispose();
            this.particles = null;
        }
    }
}
