import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { CSS2DRenderer } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';

export class SceneEngine {
    constructor(webglWrap, cssWrap) {
        this.scene = new THREE.Scene();

        this.baseFov = window.innerWidth < 768 ? 95 : 75;
        this.camera = new THREE.PerspectiveCamera(this.baseFov, window.innerWidth / window.innerHeight, 0.1, 1000);

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Opti perf
        webglWrap.appendChild(this.renderer.domElement);

        // CSS2D Renderer (for POI markers)
        this.cssRenderer = new CSS2DRenderer();
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        cssWrap.appendChild(this.cssRenderer.domElement);

        // Raycaster for interactions
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Target FOV for cinematic zoom
        this.targetFov = null;

        // Listeners
        window.addEventListener('resize', this.onResize.bind(this));
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }

    updateRaycaster(pointerEvent) {
        this.mouse.x = (pointerEvent.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(pointerEvent.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        return this.raycaster.intersectObjects(this.scene.children, true);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update base FOV based on screen width dynamically
        const newBaseFov = window.innerWidth < 768 ? 95 : 75;
        if (this.baseFov !== newBaseFov) {
            this.baseFov = newBaseFov;
            if (this.targetFov === null) {
                this.camera.fov = this.baseFov;
                this.camera.updateProjectionMatrix();
            }
        }
    }

    updateFOV() {
        // Smooth FOV transition
        if (this.targetFov !== null) {
            this.camera.fov += (this.targetFov - this.camera.fov) * 0.08;
            if (Math.abs(this.camera.fov - this.targetFov) < 0.1) {
                this.camera.fov = this.targetFov;
                if (Math.abs(this.targetFov - this.baseFov) < 0.1) {
                    this.targetFov = null;
                }
            }
            this.camera.updateProjectionMatrix();
        }
    }

    zoomIn(amount = 20) {
        this.targetFov = this.baseFov - amount;
    }

    resetZoom() {
        this.targetFov = this.baseFov;
    }

    render() {
        this.updateFOV();
        this.renderer.render(this.scene, this.camera);
        this.cssRenderer.render(this.scene, this.camera);
    }
}
