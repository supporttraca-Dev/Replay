import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { DeviceOrientationControls } from '../../../experiences/casbah/DeviceOrientationControls.js';

export class ControlsManager {
    constructor(camera, domElement, onStartInteraction = null) {
        this.camera = camera;
        this.domElement = domElement;

        // Initialize OrbitControls (Default)
        this.orbit = new OrbitControls(this.camera, this.domElement);
        this.orbit.enableZoom = false;
        this.orbit.enablePan = false;
        this.orbit.enableDamping = true;
        this.orbit.dampingFactor = 0.05;
        this.orbit.autoRotate = false;
        this.orbit.autoRotateSpeed = 0.15;
        this.orbit.minPolarAngle = Math.PI * 0.25;
        this.orbit.maxPolarAngle = Math.PI * 0.75;

        // Gyro Controls (Lazy-loaded to prevent iOS auto-deny)
        this.gyro = null;
        this.isGyroActive = false;

        if (onStartInteraction) {
            this.orbit.addEventListener('start', onStartInteraction);
        }
    }

    update() {
        if (this.isGyroActive && this.gyro && this.gyro.enabled) {
            this.gyro.update();
        } else if (this.orbit && this.orbit.enabled) {
            this.orbit.update();
        }
    }

    toggleGyro() {
        if (!this.isGyroActive) {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            this.enableGyro();
                        } else {
                            alert("Permission refusée pour le gyroscope.");
                        }
                    })
                    .catch(console.error);
            } else {
                this.enableGyro();
            }
        } else {
            this.disableGyro();
        }
        return this.isGyroActive;
    }

    enableGyro() {
        if (!this.gyro) {
            this.gyro = new DeviceOrientationControls(this.camera);
        }
        this.isGyroActive = true;
        this.orbit.enabled = false;
        this.gyro.enabled = true;
    }

    disableGyro() {
        this.isGyroActive = false;
        if (this.gyro) this.gyro.enabled = false;
        this.orbit.enabled = true;
    }

    setAutoRotate(value) {
        this.orbit.autoRotate = value;
    }

    get isAutoRotating() {
        return this.orbit.autoRotate;
    }

    setTarget(x, y, z) {
        this.orbit.target.set(x, y, z);
        this.orbit.update();
    }

    disableDampingTemporarily(durationMs = 100) {
        this.orbit.enableDamping = false;
        setTimeout(() => {
            this.orbit.enableDamping = true;
        }, durationMs);
    }

    getAzimuthalAngle() {
        return this.orbit.getAzimuthalAngle();
    }

    getPolarAngle() {
        return this.orbit.getPolarAngle();
    }

    /**
     * Positionne la caméra sur des angles précis (Azimuth + Polar)
     * Utilisé lors du chargement d'un nœud pour orienter la vue.
     */
    setAngles(azimuth, polar) {
        // On désactive le damping pour une transition instantanée
        const wasEnabled = this.orbit.enableDamping;
        this.orbit.enableDamping = false;

        // OrbitControls ne permet pas de setter les angles directement.
        // On calcule une position sur une sphère et on applique.
        const radius = 1;
        const x = radius * Math.sin(polar) * Math.cos(azimuth);
        const y = radius * Math.cos(polar);
        const z = radius * Math.sin(polar) * Math.sin(azimuth);

        this.camera.position.set(x * 0.01, y * 0.01, z * 0.01);
        this.orbit.target.set(0, 0, 0);
        this.orbit.update();

        setTimeout(() => {
            this.orbit.enableDamping = wasEnabled;
        }, 100);
    }
}
