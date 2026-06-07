/**
 * ArtifactsSystem.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture de base pour la gestion centralisée et extensible des artefacts.
 * Permet de définir des objets locaux (liés à un niveau) ou globaux (inter-niveaux),
 * chacun possédant une fonction spéciale (mécanisme, zone, dialogue, etc.).
 */

export class Artifact {
    /**
     * @param {Object} config
     * @param {string} config.id - Identifiant unique de l'artefact
     * @param {string} config.name - Nom affiché
     * @param {string} config.description - Description complète (codex/inventaire)
     * @param {string} config.icon - Emoji ou chemin vers une image d'icône
     * @param {string} config.scope - 'global' (tout le jeu) ou 'local' (restreint à un niveau)
     * @param {string} config.levelId - Si scope 'local', l'ID du niveau où il est utilisable
     * @param {Function} config.onUse - Fonction spéciale déclenchée lors de l'utilisation
     */
    constructor(config) {
        this.id = config.id || 'unknown';
        this.name = config.name || 'Artefact Inconnu';
        this.description = config.description || '...';
        this.icon = config.icon || '❓';
        this.scope = config.scope || 'local';
        this.levelId = config.levelId || null;
        
        // La "fonction spéciale" de l'artefact
        this.onUse = config.onUse || ((context) => {
            console.warn(`[ArtifactSystem] Aucune fonction définie pour ${this.id}`);
        });
    }

    /**
     * Tente d'utiliser l'artefact dans un contexte donné.
     * @param {Object} context - Le contexte actuel du jeu (niveau en cours, nœud, state, etc.)
     * @returns {boolean} - Retourne vrai si l'artefact a pu être utilisé
     */
    use(context) {
        // Vérification de la portée (scope)
        if (this.scope === 'local' && this.levelId && context.currentLevelId !== this.levelId) {
            console.warn(`[ArtifactSystem] Impossible d'utiliser ${this.name} ici. Restreint au niveau : ${this.levelId}`);
            return false;
        }

        // Exécution de la fonction spéciale
        this.onUse(context);
        return true;
    }
}

export class ArtifactManager {
    constructor() {
        this.registry = new Map();
    }

    /**
     * Enregistre un nouvel artefact dans la base de données.
     * @param {Object} artifactConfig - Les paramètres de l'artefact
     */
    register(artifactConfig) {
        const artifact = new Artifact(artifactConfig);
        this.registry.set(artifact.id, artifact);
    }

    /**
     * Récupère un artefact via son ID.
     */
    get(id) {
        return this.registry.get(id);
    }

    /**
     * Retourne tous les artefacts enregistrés.
     */
    getAll() {
        return Array.from(this.registry.values());
    }

    /**
     * Exécute la fonction d'un artefact s'il existe.
     */
    useArtifact(id, context) {
        const artifact = this.get(id);
        if (!artifact) {
            console.error(`[ArtifactSystem] Artefact introuvable : ${id}`);
            return false;
        }
        return artifact.use(context);
    }
}

// Instance globale du gestionnaire d'artefacts
export const artifactManager = new ArtifactManager();
