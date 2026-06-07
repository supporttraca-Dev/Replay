# REPLAY — Document de Synthèse
### Résumé de session de travail · Mai 2026

---

## 1. Ce qu'est REPLAY

REPLAY est une **installation artistique immersive et interactive** dérivée de la plateforme TRAÇA, dédiée à la préservation du patrimoine algérien.

Ce n'est pas :
- une exposition classique
- une application muséale
- un jeu mobile
- une expérience VR standard

C'est : **une architecture jouable de la mémoire.** Le visiteur ne consomme pas du contenu — il traverse des traces de vie.

---

## 2. Contexte du projet

| Élément | Statut |
|---|---|
| Équipe | Duo (toi + Gemini comme copilote IA dans Google Antigravity) |
| Contenu narratif | Zéro — pas encore écrit ni enregistré |
| Histoire / personnages | Encore ouverts — à définir |
| Priorité immédiate | Convaincre un partenaire (IFA ou autre) |
| Horizon temporel | 6 à 12 mois pour une première version |
| Lieu | Plusieurs lieux possibles — pas encore fixé |
| Époque | Plusieurs époques mélangées |

---

## 3. Base technique — le moteur Casbah

### Ce qui existe déjà et qui sera réutilisé

L'expérience Casbah 360 (traca-immersion.vercel.app) constitue **la fondation directe de REPLAY**. Environ 80% du moteur est réutilisable tel quel.

**Éléments conservés :**
- Three.js — sphère inversée 360° (rendu WebGL)
- WebAudio API — système Duck & Fade, sous-titres synchronisés par amplitude RMS
- GSAP — transitions et animations
- FadeNoir cinématique entre les scènes
- FakeLoader dynamique (gère les réseaux instables)
- CSS2DRenderer — points d'intérêt (POIs) ancrés en 3D
- MapIntro "Double Door" — carte 2D → plongeon dans la scène 3D
- Pattern iOS/Safari — `load()` + `play()` silencieux pour débloquer l'autoplay audio
- `translate3d()` partout — optimisation GPU mobile
- Vercel — déploiement cohérent avec tout l'écosystème TRAÇA

### Première étape technique : cloner et nettoyer

Cloner le projet traca-immersion et **supprimer tout le contenu spécifique à la Casbah** (assets, textures, personnages, dialogues, textes). Ne garder que le moteur nu. Ce socle s'appellera **REPLAY-engine**.

### Ce qu'on greffe par-dessus pour REPLAY

| Élément | Outil | Raison |
|---|---|---|
| Scanner QR intégré | `html5-qrcode` | Le visiteur ne quitte jamais l'expérience |
| Progression persistante | `IndexedDB` via `idb` | Plus robuste que localStorage pour 10 scènes |
| Expérience offline | `PWA + Service Worker` | Réseau faible possible dans le bâtiment |
| État global réactif | `Zustand` | Synchronise l'UI avec la progression en temps réel |
| Témoignages collectifs | `Supabase` (stockage audio) | Seul vrai backend du projet |

---

## 4. Direction artistique

### Palette et atmosphère

| Élément | Choix |
|---|---|
| Fond | `#1a1208` — noir brun profond, cuir vieilli |
| Accent | `#c8a96e` — or mat |
| Typographie | Serif fin — *Cormorant Garamond* ou *EB Garamond* |
| Textures | Grain de papier, usure légère — overlay CSS subtil |
| Animations | Lentes, comme de l'encre qui se dilue |
| QR codes | Intégrés dans des motifs gravés (zelliges, arabesque) — jamais des stickers noirs |

### Logique des époques mélangées

Chaque nœud narratif a une **couleur-temps** distincte dans la même palette chaude :

| Époque | Teinte |
|---|---|
| Antiquité berbère / romaine | Ocre poussiéreux, pierre sèche |
| Période ottomane | Indigo profond + cuivre |
| Époque coloniale | Sépia délavé, lumière dure |
| Mémoire du XXe siècle | Noir et blanc légèrement jauni |

---

## 5. Expérience utilisateur — flux complet

```
ENTRÉE DANS LE LIEU
│
├── Grande carte imprimée dans l'espace d'accueil
│   Stylisée comme un document trouvé (parchemin, registre, lettre)
│   Emplacements des 10 POIs indiqués par des symboles, pas des numéros
│
└── Mini-carte flyer récupérable
    Contient le QR code d'entrée
    │
    ▼
CONNEXION (dehors — bonne connexion)
│
├── Scan du QR → web app dans le navigateur (zéro install)
│
├── Onboarding :
│   ├── Renseigner prénom / pseudo
│   ├── Création d'un identifiant unique (session ID)
│   ├── Courte introduction poétique diégétique (pas de tutoriel classique)
│   │   ex : "Les murs se souviennent encore. Écoute attentivement."
│   └── Préchargement silencieux de TOUTE l'expérience
│       (textures 360°, fichiers audio, installation PWA)
│       → Zéro dépendance réseau une fois dans le bâtiment
│
└── OBLIGATOIRE : message clair → "Mets tes écouteurs maintenant"
    │
    ▼
NAVIGATION DANS L'ESPACE
│
Le visiteur se déplace avec téléphone + écouteurs
Il repère les QR codes intégrés dans la scénographie
    │
    ▼
SCÈNE (x10) — même logique pour chaque nœud
│
├── Scan QR → transition cinématique (fade noir + son)
├── Scène 360° se lance
├── Personnages présents → dialogues → ambiance sonore
│
└── Indice implicite dans les dialogues
    ex : "Avant la nuit, passe par le marché près de la cour"
    → Jamais affiché comme "Objectif suivant"
    → Le visiteur interprète, consulte sa carte, se déplace
    │
ENTRE LES SCÈNES
│
└── Musique d'ambiance continue pendant le trajet
    Maintient le voyage temporel
    Le visiteur peut consulter la carte in-app ou le flyer papier
    │
    ▼
FIN
│
└── Tous les fragments + artefacts découverts → Épilogue narratif
    + Accès à l'enregistrement d'un témoignage audio (voir section 6)
```

---

## 6. Mécaniques validées

### Le prénom dans la fiction

Le prénom du visiteur est intégré dans l'expérience. Trois approches possibles :

**Option A — La pause mystérieuse** *(recommandée pour le prototype)*
Le personnage parle, s'arrête, une voix proche (TTS Google) prononce le prénom, puis le personnage reprend. La rupture de voix devient artistique.

**Option B — L'inscription visuelle**
Le prénom apparaît gravé dans une scène 360° — sur un mur, dans une lettre, dans un registre. Peut-être plus fort encore.

**Option C — ElevenLabs Voice Cloning** *(si budget disponible)*
Le comédien est cloné. Le prénom est généré dynamiquement avec sa vraie voix.

---

### Les artefacts cachés (gyroscope)

Dans certaines scènes, un artefact est dissimulé à des coordonnées précises dans la sphère 360°.

```
L'artefact est invisible par défaut
↓
Le visiteur tourne physiquement son téléphone
↓
Quand la caméra pointe vers les bonnes coordonnées
↓
L'artefact pulse doucement — une lueur, pas une icône
↓
Tap → découverte → son spécial + transition narrative
```

Techniquement : `DeviceOrientation API` + détection d'azimuth/élévation dans Three.js.
Artistiquement : l'instinct remplace le radar. L'attention remplace le HUD.

Exemples d'artefacts physiques scénographiés dans l'espace réel :
- Une lettre cachée
- Une petite pierre gravée
- Une inscription sur un mur

---

### La carte comme document trouvé

La mini-carte flyer ne ressemble pas à un plan touristique. Elle ressemble à **un document authentique de l'époque** — parchemin, lettre administrative, registre. Les POIs sont indiqués par des symboles et des noms de lieux fictifs. Le visiteur doit se demander une seconde : *est-ce vrai ou inventé ?*

---

### L'épilogue collectif

**Condition d'accès :** avoir terminé les 10 scènes ET trouvé les artefacts.

**Récompense :** le visiteur peut enregistrer un message audio (30 secondes max) — son témoignage.

**Pour les futurs visiteurs :** dans certaines scènes, une silhouette fantôme apparaît. On s'approche. On entend un témoignage d'un ancien visiteur, choisi aléatoirement parmi les messages stockés.

REPLAY devient une **mémoire vivante qui s'accumule** au fil des visiteurs.

Techniquement : Supabase (stockage audio, gratuit jusqu'à un certain volume).

---

## 7. Ce qui a été écarté

| Idée | Raison |
|---|---|
| Palimpseste sonore (gyroscope = époques) | Casse la logique narrative de REPLAY |
| Dégradation audio avec la distance | Trop complexe, pas dans l'esprit du projet |
| Reconnaissance d'image sophistiquée | Trop fragile en conditions réelles |
| React / Next.js / TypeScript | Inutile — le moteur Vanilla JS existant fonctionne |
| Backend complexe dès le début | IndexedDB local suffit pour le prototype |

---

## 8. Questions ouvertes — à résoudre avant la production

Ces questions conditionnent toute la narration. Elles ne sont pas encore tranchées.

1. **Quelle histoire REPLAY raconte-t-il ?** Quel est le fil narratif ?
2. **Qui parle dans les scènes ?** Personnages historiques fictifs nommés ? Voix anonymes du quotidien ?
3. **Le visiteur fait-il des choix dans les dialogues ?** Ou il écoute uniquement ?
4. **Quel lieu physique précis ?** L'IFA ou autre ? La cartographie des 10 POIs dépend de l'espace réel.
5. **Combien d'artefacts ?** Et lesquels sont obligatoires vs optionnels ?

---

## 9. Ordre de travail recommandé

```
PHASE 0 — Fondation (avant tout)
└── Cloner traca-immersion
    Supprimer tout le contenu Casbah
    Garder uniquement le moteur nu → REPLAY-engine

PHASE 1 — Premier fragment (pour le pitch)
├── Choisir UN lieu physique précis
├── Écrire UN fragment narratif (texte + indice implicite)
├── Produire UN audio (voix + ambiance)
├── Créer UNE scène 360° (illustration atmosphérique)
└── Développer l'interface de ce seul fragment
    → Démontrable en live lors d'un rendez-vous partenaire

PHASE 2 — Après signature partenaire
├── Zustand (état global)
├── html5-qrcode (scanner intégré)
├── IndexedDB (progression persistante)
├── PWA + Service Worker (offline)
└── 10 nœuds narratifs complets

PHASE 3 — Épilogue collectif
└── Supabase (stockage témoignages audio)
```

---

## 10. Ratio de travail recommandé (phase pitch)

| Domaine | Part du temps |
|---|---|
| Contenu (écriture, voix, son) | 60% |
| Direction artistique (carte, scène, moodboard) | 25% |
| Technique (juste assez pour que ça tourne) | 15% |

**Un partenaire culturel ne finance pas une stack — il finance une émotion qu'il a déjà ressentie.**

---

*Document généré à partir d'une session de travail REPLAY · TRAÇA · Mai 2026*
