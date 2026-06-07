export class ReplayDatabase {
    constructor() {
        this.isInitialized = true;
    }

    /**
     * Crée une nouvelle session visiteur dans la base de données.
     * @param {string} visitorName - Le prénom du visiteur
     * @returns {Promise<Object>} La session créée avec son ID unique
     */
    async createSession(visitorName) {
        // TODO: Remplacer par l'appel réel (Supabase/Firebase)
        console.log(`[DB] Création de la session pour : ${visitorName}`);
        
        // Simulation d'une latence réseau
        await new Promise(resolve => setTimeout(resolve, 800));

        // Génération d'un ID de session lisible (ex: RPL-4928)
        const sessionId = 'RPL-' + Math.floor(1000 + Math.random() * 9000);
        
        const session = {
            id: sessionId,
            visitorName: visitorName,
            startedAt: new Date().toISOString(),
            progression: {
                unlockedNodes: [],
                completedNodes: []
            }
        };

        // Dans la version finale, on sauvegarde ça dans Supabase ici.
        return session;
    }

    /**
     * Récupère une session existante
     */
    async getSession(sessionId) {
        // Simulation
        await new Promise(resolve => setTimeout(resolve, 500));
        return null; // À implémenter
    }
}

export const db = new ReplayDatabase();
