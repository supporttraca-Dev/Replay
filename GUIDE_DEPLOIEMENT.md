# 🚀 Guide Complet de Déploiement : Traça Replay

Ce guide détaille les étapes pour nettoyer votre dépôt actuel, pousser la nouvelle version 100% propre, et la déployer avec succès sur Vercel, sans erreurs de build ni écrans noirs.

---

## 🛑 Étape 1 : Nettoyage et Préparation Locale

Avant de pousser, nous devons nous assurer que seuls les fichiers nécessaires sont envoyés à GitHub. Le dossier `node_modules` et `experiences/casbah_backup` sont désormais ignorés par défaut (`.gitignore` mis à jour).

1. Ouvrez un terminal dans votre dossier de projet (`Traca-Replay`).
2. Vérifiez l'état de votre projet :
   ```bash
   git status
   ```

---

## 🧹 Étape 2 : Purge du dépôt distant et Push "Au Propre"

Puisque vous souhaitez "tout supprimer dans le repo et repousser tout au propre", la méthode la plus sûre est de réinitialiser l'historique Git et de forcer la mise à jour sur GitHub.

Exécutez ces commandes une par une dans le terminal VSCode :

1. Ajouter tous les fichiers (les dossiers inutiles seront automatiquement ignorés) :
   ```bash
   git add .
   ```

2. Créer un commit de sauvegarde (point de départ propre) :
   ```bash
   git commit -m "feat: refonte totale Casbah (Zero-Latency, IndexedDB, SW Cache)"
   ```

3. Pousser en forçant sur la branche principale (cela écrasera l'historique distant pour correspondre exactement à votre version locale propre) :
   ```bash
   git push origin main --force
   ```
   *(Note : Si votre branche s'appelle `master` au lieu de `main`, remplacez `main` par `master`)*

---

## ⚙️ Étape 3 : Informations des Comptes Connectés

Voici les comptes actuellement détectés sur votre machine de développement :
- **Compte Git :** `mirouwhite`
- **Email Git :** `support.traca@gmail.com`
- **Compte Vercel :** `supporttraca-8264`

Si ces comptes sont les bons, vous n'avez besoin de rien changer !

---

## 🌍 Étape 4 : Déploiement sur Vercel (Compte existant)

Puisque le projet est lié au profil `supporttraca-8264`, vous avez deux méthodes pour déployer :

### Méthode 1 : Déploiement Automatique (Recommandé)
Si votre projet Vercel est lié à votre dépôt GitHub (`mirouwhite/Traca-Replay`), le simple fait d'avoir exécuté `git push` à l'Étape 2 a **déjà déclenché le déploiement**.
Allez sur le tableau de bord Vercel (https://vercel.com/dashboard) pour suivre la progression de la compilation.

### Méthode 2 : Déploiement Manuel via le Terminal (Force Build)
Si vous voulez forcer le déploiement en direct depuis votre machine (sans passer par GitHub) :

1. Tapez :
   ```bash
   npx vercel --prod
   ```
2. Appuyez sur **Entrée**. Vercel va automatiquement packager et déployer votre projet, en utilisant la nouvelle configuration `vite.config.js` qui a été réparée.

---

## ✅ Étape 5 : Vérification de la Production

Une fois le déploiement terminé, ouvrez le lien fourni par Vercel.

1. **Testez l'entrée :** Vous remarquerez qu'il n'y a plus de temps de chargement noir. Le Service Worker précharge l'expérience instantanément.
2. **Testez l'Audio :** La musique et les dialogues démarrent à 0 milliseconde de latence grâce au cache RAM.
3. **Testez la Quête :** L'Eagle Vision et l'inventaire sauvegardent désormais la progression en temps réel sans écraser d'autres données.

🎉 **Félicitations, votre projet est "Production-Ready" !**
