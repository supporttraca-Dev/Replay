import { db } from '../core/Database.js';

export class GameStateManager {
    constructor() {
        this.currentSession = null;
        this.inventory = new Set(); // Collection d'artefacts (IDs)
        this.unlockedLevels = new Set(['Level_01_Casbah']); // Le premier niveau est débloqué par défaut
        this.visitedPois = new Set();
        
        this.loadLocalState();
    }

    /**
     * Charge l'état local depuis le localStorage (pour la persistance entre rafraîchissements)
     */
    loadLocalState() {
        const savedState = localStorage.getItem('replay_gamestate');
        if (savedState) {
            try {
                const data = JSON.parse(savedState);
                if (data.inventory) this.inventory = new Set(data.inventory);
                if (data.unlockedLevels) this.unlockedLevels = new Set(data.unlockedLevels);
                if (data.visitedPois) this.visitedPois = new Set(data.visitedPois);
                if (data.currentSession) this.currentSession = data.currentSession;
            } catch (e) {
                console.error("Erreur de lecture de l'état de jeu local:", e);
            }
        }
    }

    /**
     * Sauvegarde l'état local
     */
    saveLocalState() {
        const data = {
            inventory: Array.from(this.inventory),
            unlockedLevels: Array.from(this.unlockedLevels),
            visitedPois: Array.from(this.visitedPois),
            currentSession: this.currentSession
        };
        localStorage.setItem('replay_gamestate', JSON.stringify(data));
    }

    /**
     * Démarre une nouvelle partie et l'enregistre via le Database manager
     */
    async startNewGame(playerName) {
        // Crée la session via l'API/Supabase (géré par Database.js)
        this.currentSession = await db.createSession(playerName);
        
        // Reset l'état local
        this.inventory.clear();
        this.visitedPois.clear();
        this.unlockedLevels = new Set(['Level_01_Casbah']);
        
        this.saveLocalState();
        return this.currentSession;
    }

    /**
     * Ajoute un objet à l'inventaire du joueur
     */
    collectArtifact(artifactId) {
        if (!this.inventory.has(artifactId)) {
            this.inventory.add(artifactId);
            this.saveLocalState();
            
            // TODO: Déclencher un événement global (ex: window.dispatchEvent) pour mettre à jour l'UI de l'inventaire
            const event = new CustomEvent('artifact_collected', { detail: { artifactId } });
            window.dispatchEvent(event);
            return true;
        }
        return false;
    }

    /**
     * Marque un point d'intérêt comme visité
     */
    markPoiVisited(poiId) {
        if (!this.visitedPois.has(poiId)) {
            this.visitedPois.add(poiId);
            this.saveLocalState();
            return true;
        }
        return false;
    }

    hasVisited(poiId) {
        return this.visitedPois.has(poiId);
    }
}
