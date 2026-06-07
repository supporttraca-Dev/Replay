/**
 * SWManager.js - Gère l'enregistrement et la communication avec le Service Worker
 */

class SWManager {
    constructor() {
        this.registration = null;
        this.isSupported = 'serviceWorker' in navigator;
        this.preloadState = {
            loaded: 0,
            total: 0,
            isComplete: false
        };
        this.listeners = [];
    }

    async register() {
        if (!this.isSupported) {
            console.warn('[SWManager] Service Worker non supporté par ce navigateur.');
            return false;
        }

        try {
            // Enregistrer à la racine pour avoir le contrôle sur tout le domaine
            this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            console.info('[SWManager] Service Worker enregistré avec succès:', this.registration.scope);

            navigator.serviceWorker.addEventListener('message', (event) => {
                this._handleMessage(event.data);
            });

            return true;
        } catch (err) {
            console.error('[SWManager] Échec de l\'enregistrement du Service Worker:', err);
            return false;
        }
    }

    startPreload() {
        if (!this.isSupported || !navigator.serviceWorker.controller) {
            console.warn('[SWManager] SW non actif. Impossible de démarrer le preload. Attente du rechargement ou navigation.');
            // Fallback : Si le controller n'est pas prêt, on essaie quand même d'attendre qu'il le soit
            if (this.isSupported) {
                navigator.serviceWorker.ready.then(reg => {
                    if (reg.active) {
                        reg.active.postMessage({ type: 'START_PRELOAD' });
                    }
                });
            }
            return;
        }
        navigator.serviceWorker.controller.postMessage({ type: 'START_PRELOAD' });
    }

    _handleMessage(data) {
        if (data.type === 'PRELOAD_PROGRESS') {
            this.preloadState.loaded = data.loaded;
            this.preloadState.total = data.total;
            this.preloadState.isComplete = (data.loaded === data.total && data.total > 0);
            this._notifyListeners();
        } else if (data.type === 'PRELOAD_COMPLETE') {
            this.preloadState.isComplete = true;
            this._notifyListeners();
        }
    }

    addListener(callback) {
        this.listeners.push(callback);
        // Informer immédiatement du statut actuel
        callback(this.preloadState);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    _notifyListeners() {
        for (const cb of this.listeners) {
            cb(this.preloadState);
        }
    }
}

export const swManager = new SWManager();
