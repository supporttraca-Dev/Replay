import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class ParallaxTest {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;

        // Configuration Parallaxe
        // La force du déplacement de la sphère
        this.parallaxStrength = 30;

        this.init();
        this.animate();
    }

    init() {
        // Scène
        this.scene = new THREE.Scene();

        // Caméra
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 0);

        // Rendu
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        // Sphère de fond
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Inverser pour voir de l'intérieur

        const textureLoader = new THREE.TextureLoader();
        // Chargement de l'image du patio (Level 1, Scene 1)
        const texture = textureLoader.load('../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee/background/01_bg.jpg');
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshBasicMaterial({ map: texture });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);

        // Contrôles
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = -0.4; // Inversé pour sensation FPS

        // Événements
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        // Normalisation des coordonnées de la souris (-1 à 1)
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // 1. Mise à jour des contrôles
        this.controls.update();

        // 2. Calcul du parallaxe fluide
        // On lisse le mouvement pour un effet "poids" agréable
        this.targetX = THREE.MathUtils.lerp(this.targetX, this.mouseX, 0.05);
        this.targetY = THREE.MathUtils.lerp(this.targetY, this.mouseY, 0.05);

        // 3. Application du déplacement (Diorama effect)
        // Plutôt que de bouger la caméra (qui casse les OrbitControls), on bouge légèrement la sphère en sens inverse !
        this.sphere.position.x = this.targetX * this.parallaxStrength;
        this.sphere.position.y = this.targetY * this.parallaxStrength;

        // Rendu final
        this.renderer.render(this.scene, this.camera);
    }
}

// Lancement
new ParallaxTest();
