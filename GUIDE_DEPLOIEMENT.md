# 🚀 Guide Ultime de Déploiement : Traça Replay

Ce document t'explique exactement comment déployer ton projet de la façon la plus simple possible (en 3 clics max), et fait le point sur tes comptes actuels.

---

## 👤 1. Quel compte est actuellement connecté ?

Voici la configuration exacte de ton ordinateur en ce moment :

*   **Nom d'utilisateur Git :** `mirouwhite`
*   **Email Git :** `support.traca@gmail.com`
*   **Dépôt GitHub actuel :** `supporttraca-Dev/Replay`
*   **Projet Vercel actuel :** `replay` (ID: `prj_U2etKUK3ZBfleT27arKxyo8nHu0i`)

**Ce que ça veut dire :**
Ton VS Code et ton GitHub Desktop publient en ce moment sur le compte GitHub **`supporttraca-Dev`** (lié à l'email `support.traca@gmail.com`). 
Tout est DÉJÀ bien configuré. Tu n'as pas besoin de changer de compte, c'est ce compte qui est relié à Vercel.

---

## 🧹 2. État du projet (Nettoyage)

J'ai analysé et nettoyé le projet de fond en comble.
✅ **Dossiers inutiles supprimés :** `casbah_backup` a été définitivement retiré.
✅ **Dossiers ignorés (ne vont plus polluer GitHub) :** `node_modules` et `dist/` sont bloqués par `.gitignore`.
✅ **Fichiers de config parfaits :** `vite.config.js` et `vercel.json` sont réglés aux normes de production Vercel.

Ton dossier de projet est **100% propre et optimisé**. Il ne reste que l'essentiel.

---

## ⚡ 3. Comment déployer (Les 2 méthodes ultra-simples)

Tu as deux méthodes pour mettre à jour ton site en direct. Choisis celle que tu préfères.

### Méthode A : La plus visuelle (Via GitHub Desktop) - 3 clics
C'est la méthode classique. Vercel surveille ton GitHub et met à jour le site tout seul dès qu'il voit une nouveauté.

1. Ouvre **GitHub Desktop**.
2. Écris un petit résumé en bas à gauche (ex: "Mise à jour texte").
3. Clique sur **Commit to main**.
4. Clique sur **Push origin** (en haut à droite).

🎉 **C'est fini !** Vercel va capter le "Push" et mettre le site en ligne dans les 30 secondes.

---

### Méthode B : La plus rapide au monde (Via VS Code / Terminal) - 1 commande
Si tu ne veux même pas ouvrir GitHub Desktop et que tu veux déployer *directement* depuis ton ordinateur vers Vercel, j'ai configuré l'outil Vercel pour toi.

1. Dans VS Code, ouvre le terminal (`Ctrl` + `j` ou `Terminal > New Terminal`).
2. Tape exactement ceci et fais Entrée :
   ```bash
   npx vercel --prod --yes
   ```

🎉 **C'est fini !** Pas de commit, pas de GitHub. Ça compile et ça envoie direct chez Vercel. Il te donnera le lien final en vert dans le terminal.

---

## 📝 Résumé de l'Architecture
Si jamais tu dois recréer un dépôt un jour, voici les SEULS dossiers obligatoires à garder :
*   `assets/` (Toutes les images, audios, vidéos)
*   `experiences/` (Le code de la Casbah, Synagogue, etc.)
*   `editor/` (Ton outil de création de niveau)
*   `src/` (Le moteur Replay et la base de données)
*   `index.html` (La porte d'entrée)
*   `package.json` / `vite.config.js` / `vercel.json` (Les configurations)

Ne touche JAMAIS à `node_modules` (il se recrée tout seul) ni à `.vercel`.
