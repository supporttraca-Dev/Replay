/**
 * TracaLoader.js — TRACA Core Global Loader
 * 
 * Un "Cache-Misère" stratégique (Overlay de chargement) qui tourne au-dessus de tout.
 * Intègre un extracteur Chroma Key en temps réel pour rendre le fond vert transparent.
 */

export class TracaLoader {
    constructor() {
        this.videoSrc = '/assets/video/logo%20loading%20loop%20greens%20creen.mp4';
        this.videoWidth = 400;  // Taille de traitement interne (pour la performance)
        this.videoHeight = 400; // Adapter selon ratio
        
        this.isActive = false;
        this.rafId = null;
        this._showTimer = null; // Timer pour retardateur adaptatif

        this._initDOM();
        
        // Accélérer l'animation pour s'assurer qu'elle boucle au moins 3 fois dans un délai court
        this.video.playbackRate = 1.6;
    }

    _initDOM() {
        // Container Global
        this.container = document.createElement('div');
        this.container.id = 'traca-global-loader';
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '999999',
            opacity: '0',
            pointerEvents: 'none',
            transition: 'opacity 0.6s ease'
        });

        // Vidéo Cachée
        this.video = document.createElement('video');
        this.video.src = this.videoSrc;
        this.video.crossOrigin = 'anonymous';
        this.video.loop = true;
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.style.display = 'none';

        // Canvas où on dessine la vidéo détourée
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.videoWidth;
        this.canvas.height = this.videoHeight;
        Object.assign(this.canvas.style, {
            width: '250px', // Taille affichée à l'écran
            height: '250px',
            objectFit: 'contain'
        });
        
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // Texte optionnel
        this.label = document.createElement('p');
        Object.assign(this.label.style, {
            fontFamily: "'Cinzel', serif",
            color: '#c8935a',
            fontSize: '1.2rem',
            letterSpacing: '0.1em',
            marginTop: '20px',
            opacity: '0.8'
        });

        this.container.appendChild(this.video);
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.label);
        
        document.body.appendChild(this.container);
    }

    /**
     * Lance le Chroma Key loop
     */
    _processFrame() {
        if (!this.isActive || this.video.paused || this.video.ended) return;

        // Dessine la frame vidéo sur le canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Lecture des pixels
        let frame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let l = frame.data.length / 4;

        for (let i = 0; i < l; i++) {
            let r = frame.data[i * 4 + 0];
            let g = frame.data[i * 4 + 1];
            let b = frame.data[i * 4 + 2];
            
            // Chroma Key condition (recherche d'un vert intense spécifique au 00D800 et compression)
            // On veut tuer les pixels qui ont G >> R et G >> B
            // Ajustement basique de tolérance :
            if (g > 100 && g > r * 1.5 && g > b * 1.5) {
                frame.data[i * 4 + 3] = 0; // Alpha = 0 (Transparent)
            }
        }

        // Réinjection des pixels détourés
        this.ctx.putImageData(frame, 0, 0);

        this.rafId = requestAnimationFrame(() => this._processFrame());
    }

    /**
     * Affiche le loader global avec un retardateur (Adaptatif)
     * Si la scène se charge en moins de `delay` millisecondes, le loader ne s'affichera pas du tout.
     */
    showAdaptive(text = "Connexion...", delay = 500) {
        if (this.isActive || this._showTimer) return;
        
        // On détache le canvas s'il était embarqué ailleurs
        if (this.canvas.parentElement !== this.container) {
            this.container.insertBefore(this.canvas, this.label);
        }

        this._showTimer = setTimeout(() => {
            this.show(text);
        }, delay);
    }

    /**
     * Affiche le loader global
     * @param {string} text - Message optionnel
     */
    show(text = "Chargement en cours...") {
        this.isActive = true;
        this.label.innerText = text;
        
        this.container.style.pointerEvents = 'auto'; // Bloque l'interface en arrière-plan
        this.container.style.opacity = '1';
        
        this.video.play().then(() => {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this._processFrame();
        }).catch(err => console.warn("TracaLoader Video Autoplay prevented:", err));
    }

    /**
     * Embarque uniquement l'animation (Canvas) dans un élément HTML précis
     * Typiquement pour remplacer la barre de chargement initiale.
     */
    embed(parentElement) {
        this.isActive = true;
        this.container.style.opacity = '0'; // On cache le fond sombre global
        this.container.style.pointerEvents = 'none';
        
        // On déplace le canvas dans le parent ciblé
        parentElement.appendChild(this.canvas);
        
        this.video.play().then(() => {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this._processFrame();
        }).catch(() => {});
    }

    /**
     * Masque le loader global et libère les ressources
     */
    hide() {
        if (this._showTimer) {
            clearTimeout(this._showTimer);
            this._showTimer = null;
        }

        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none'; // Libère l'interface
        
        // On laisse la transition CSS de 0.6s se faire avant de stopper le moteur interne
        setTimeout(() => {
            this.isActive = false;
            this.video.pause();
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Remet le canvas dans son container global s'il avait été embarqué
            if (this.canvas.parentElement !== this.container) {
                this.container.insertBefore(this.canvas, this.label);
            }
        }, 600);
    }
}

export const tracaLoader = new TracaLoader();
window.tracaLoader = tracaLoader;
