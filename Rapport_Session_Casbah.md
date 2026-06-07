# 📝 RAPPORT COMPLET DE SESSION : Stabilisation, Mécaniques & Onboarding

Voici le journal complet des opérations, techniques utilisées, erreurs rencontrées et solutions mises en place durant cette session de développement sur le projet *Traça - Casbah*.

## 1. Problème Critique : Chargement bloqué à 0% sur mobile
*   **Le Problème :** Sur iOS (et certains Android), le chargement restait bloqué à `0%`. Cela arrivait car Safari met en pause les requêtes `XMLHttpRequest` inactives en HTTPS pour économiser la batterie, bloquant ainsi notre calcul de progression.
*   **La Solution :** Le système de préchargement a été complètement réécrit. Au lieu de télécharger les images via `fetch/XHR` pour en extraire le `Blob`, nous utilisons directement le `THREE.TextureLoader` avec le `LoadingManager` de Three.js.
*   **Sécurité ajoutée (Fallback) :** Implémentation d'un système de **"Fake Progress"** (chargement simulé) et d'un Timeout Global (25s). Si le réseau subit des latences, la barre avance mathématiquement pour ne pas frustrer l'utilisateur, et force le déblocage du bouton "Entrer" au bout de 25 secondes quoiqu'il arrive.

## 2. Expérience Utilisateur : Tutoriels et Bouton d'Aide
*   **Le Problème :** L'onboarding s'affichait à *chaque* chargement de page, ce qui était très intrusif et cassait l'immersion pour un utilisateur régulier.
*   **La Solution :** Utilisation du `localStorage` (`traca_tuto_gyro` et `traca_tuto_eagle`). Le navigateur se souvient maintenant si le joueur a déjà passé les tutoriels.
*   **Bouton "?" contextuel :** Pour compenser l'absence de tutoriel récurrent, ajout d'un bouton d'Aide (en bas à gauche) au design discret. Le texte donne des indices sur les mécaniques (Vision d'aigle, gyroscope) en restant "in-lore" (dans l'univers du jeu), sans briser le 4ème mur.

## 3. Logique de Navigation : Le verrouillage du Sous-Sol
*   **L'Erreur rencontrée :** Pendant la restructuration du projet, l'ID du nœud de destination du sous-sol dans `Level_01_Casbah.js` était nommé `basement`, mais le code de navigation cherchait à bloquer l'ancienne référence `05_sous_sol`. La porte restait donc ouverte par défaut.
*   **La Solution :** Recâblage du système de verrouillage pour intercepter le bon ID interne (`basement`).
*   **Feedback Visuel (UX) :** L'ancien "Toast" de notification (en bas d'écran) n'était pas assez visible. Création d'une fonction dédiée `_showLockedDoor()` générant une popup modale centrale inratable, avec :
    * Une animation d'apparition (blur/zoom)
    * Un effet sonore d'erreur (`error.mp3`)
    * Le marqueur 3D de la flèche qui vibre visuellement (`shake-error`) en rouge.

## 4. Fausse bonne idée & Pivot : La Torche (Qandil)
*   **L'Essai (Mauvaise pratique) :** Pour simuler l'effet de torche, la première approche consistait à utiliser l'overlay global `#time-flash` (qui sert normalement de fondu noir pour le voyage temporel) en le teintant en jaune (`rgba(255, 180, 50, 0.4)`).
*   **La Conséquence :** L'écran devenait figé sous un filtre statique jaune disgracieux qui bloquait les interactions 3D. Ce n'était pas une vraie mécanique d'éclairage dynamique, mais une solution bricolée.
*   **Pivot (Journal Intime) :** Suite à une révision du Game Design, la mécanique complexe du Qandil (nécessitant la bascule dynamique entre deux textures 360° pour une même pièce) a été complètement supprimée. L'objet a été remplacé par le **Journal Intime** de la maîtresse de maison, enrichissant l'aspect narratif de la fouille.

## 5. Architecture Finale du "Journal Intime"
*   **Mécanique d'Inventaire :** Ajout de la propriété `usable: true` dans la base de données des artéfacts (`ARTIFACTS_DB`). Le module d'inventaire (`InventoryModule.js`) détecte ce flag et génère dynamiquement un bouton "Utiliser" dans l'interface du Codex.
*   **Event Dispatcher :** Au lieu de créer des dépendances dures entre le code UI et la 3D, le clic sur "Utiliser" déclenche un événement global `window.dispatchEvent(new CustomEvent('traca_use_item'))`. Le cœur de l'expérience (`main.js`) écoute cet événement et exécute la logique associée.
*   **Interface de Lecture (Le Livre) :** Création du lecteur dédié `_showJournalReader()` affiché en plein écran par-dessus l'expérience. 
    * Il utilise l'image HD `journal intime ouvert.png` en `background-image` (ratio conservé via `aspect-ratio: 16/9`).
    * Injection d'un conteneur de texte par-dessus, stylisé avec la typographie serif "Lora" pour simuler l'encre. 
    * Le conteneur gère le débordement (`overflow-y: auto`) pour les longs textes narratifs, et se ferme de manière fluide via un bouton ou en cliquant à l'extérieur.

## 💡 Bilan technique & Bonnes pratiques adoptées
1.  **Découplage événementiel :** L'utilisation de `CustomEvent` permet de garder l'interface HTML indépendante de la logique de rendu 3D, rendant le code beaucoup plus modulaire.
2.  **Raycasting unifié :** La vérification des conditions d'accès (comme une porte verrouillée) est désormais traitée de manière identique, que l'utilisateur clique sur une flèche 3D de navigation au sol, ou sur un Point d'Intérêt (sphère blanche) menant à la même destination.
3.  **Gestion de la mémoire (DOM Garbage Collection) :** Les interfaces générées dynamiquement (la notification de porte verrouillée, le lecteur du journal intime) sont systématiquement supprimées du DOM via `.remove()` après leur animation de fermeture. Cela évite l'accumulation d'éléments invisibles et prévient les fuites de mémoire (memory leaks), un point crucial pour les performances sur navigateur mobile.
