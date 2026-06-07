import { supabase } from './supabaseClient.js';

export const remoteStore = {
    /**
     * Crée un profil visiteur dans la table "visitors" sur Supabase
     */
    async createProfile(visitorName, characterType) {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('visitors')
                .insert([
                    { 
                        name: visitorName, 
                        character_type: characterType,
                        started_at: new Date().toISOString()
                    }
                ])
                .select(); // Retourne la ligne créée avec son ID unique généré par Postgres

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('[DB Remote] Erreur création profil:', error);
            throw error;
        }
    },

    /**
     * Met à jour la progression finale du visiteur
     */
    async updateFinalProgress(visitorId, completedNodesCount) {
        if (!supabase) return false;

        try {
            const { error } = await supabase
                .from('visitors')
                .update({ 
                    completed_nodes_count: completedNodesCount,
                    finished_at: new Date().toISOString()
                })
                .eq('id', visitorId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[DB Remote] Erreur mise à jour progression:', error);
            return false;
        }
    },

    /**
     * Uploade un témoignage audio vers le Storage Supabase
     */
    async uploadAudioTestimonial(visitorId, audioBlob) {
        if (!supabase) return null;

        const fileName = `${visitorId}_testimonial_${Date.now()}.webm`;
        const filePath = `testimonials/${fileName}`;

        try {
            const { data, error } = await supabase.storage
                .from('replay_audio')
                .upload(filePath, audioBlob, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;
            return data.path;
        } catch (error) {
            console.error('[DB Remote] Erreur upload audio:', error);
            throw error;
        }
    }
};
