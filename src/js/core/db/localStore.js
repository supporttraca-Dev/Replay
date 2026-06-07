import localforage from 'localforage';

// Configuration de la base de données locale (IndexedDB)
localforage.config({
    name: 'ReplayDB',
    storeName: 'session_state',
    description: 'Stockage local de la progression du visiteur'
});

export const localStore = {
    /**
     * Sauvegarde la session complète
     */
    async saveSession(sessionData) {
        try {
            await localforage.setItem('current_session', sessionData);
            return true;
        } catch (error) {
            console.error('[DB Local] Erreur de sauvegarde', error);
            return false;
        }
    },

    /**
     * Récupère la session en cours
     */
    async getSession() {
        try {
            return await localforage.getItem('current_session');
        } catch (error) {
            console.error('[DB Local] Erreur de lecture', error);
            return null;
        }
    },

    /**
     * Marque un lieu (node) comme débloqué
     */
    async unlockNode(nodeId) {
        const session = await this.getSession();
        if (session && !session.progression.unlockedNodes.includes(nodeId)) {
            session.progression.unlockedNodes.push(nodeId);
            await this.saveSession(session);
        }
    },

    /**
     * Marque un lieu (node) comme terminé
     */
    async completeNode(nodeId) {
        const session = await this.getSession();
        if (session && !session.progression.completedNodes.includes(nodeId)) {
            session.progression.completedNodes.push(nodeId);
            await this.saveSession(session);
        }
    }
};
