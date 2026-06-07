import { localStore } from './localStore.js';
import { remoteStore } from './remoteStore.js';

export const syncManager = {
    /**
     * Initialise une nouvelle session (Crée en Remote puis sauvegarde en Local)
     */
    async startNewSession(visitorName, characterType) {
        try {
            // 1. Création dans Supabase
            const remoteProfile = await remoteStore.createProfile(visitorName, characterType);
            
            if (!remoteProfile) {
                throw new Error("Impossible de créer le profil distant.");
            }

            // 2. Initialisation de l'état local
            const sessionData = {
                visitorId: remoteProfile.id,
                visitorName: remoteProfile.name,
                characterType: remoteProfile.character_type,
                progression: {
                    unlockedNodes: ['node_1'], // Le premier lieu est débloqué par défaut
                    completedNodes: []
                }
            };

            // 3. Sauvegarde dans IndexedDB
            await localStore.saveSession(sessionData);

            return sessionData;
        } catch (error) {
            console.error('[Sync] Erreur lors du démarrage de la session', error);
            throw error;
        }
    },

    /**
     * Synchronise la fin de l'expérience
     */
    async finishExperience(audioBlob) {
        try {
            const session = await localStore.getSession();
            if (!session) throw new Error("Aucune session locale trouvée.");

            // 1. Mettre à jour la progression finale
            await remoteStore.updateFinalProgress(session.visitorId, session.progression.completedNodes.length);

            // 2. S'il y a un audio, l'uploader
            if (audioBlob) {
                await remoteStore.uploadAudioTestimonial(session.visitorId, audioBlob);
            }

            return true;
        } catch (error) {
            console.error('[Sync] Erreur lors de la synchronisation finale', error);
            return false;
        }
    }
};
