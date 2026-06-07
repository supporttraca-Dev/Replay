export class MuseumManager {
    constructor(gameStateManager, uiManager) {
        this.gameState = gameStateManager;
        this.ui = uiManager;
        this.museumDatabase = {}; // Dictionnaire des artefacts complets (modèles 3D, descriptions détaillées)

        this.bindEvents();
    }

    bindEvents() {
        // Écouter quand un artefact est collecté
        window.addEventListener('artifact_collected', (e) => {
            this.onArtifactCollected(e.detail.artifactId);
        });
    }

    /**
     * Charge la base de données du musée pour un niveau spécifique
     * (Évite de charger tous les modèles 3D du musée d'un coup)
     */
    loadMuseumData(artifactsData) {
        // artifactsData pourrait venir du scénario (ex: CASBAH_SCENARIO.artifacts)
        artifactsData.forEach(artifact => {
            this.museumDatabase[artifact.id] = artifact;
        });
    }

    onArtifactCollected(artifactId) {
        const artifactData = this.museumDatabase[artifactId];
        if (artifactData) {
            // Afficher un popup spécial "Nouvel Artefact"
            console.log(`[Museum] Nouvel artefact ajouté au musée : ${artifactData.title}`);
            // Ex: this.ui.showArtifactUnlock(artifactData);
        }
    }

    /**
     * Ouvre l'interface du musée 3D ou UI 2D
     */
    openMuseum() {
        const collectedArtifacts = Array.from(this.gameState.inventory)
            .map(id => this.museumDatabase[id])
            .filter(Boolean); // Retire les undefined

        // Lancer l'UI du musée
        console.log("[Museum] Ouverture du musée avec", collectedArtifacts.length, "artefacts.");
        // this.ui.showMuseum(collectedArtifacts);
    }
}
