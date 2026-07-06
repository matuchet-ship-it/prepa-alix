# Prépa ALIX 🔴⚪ — suivi de préparation physique (FC Rouen)

Appli mobile pour suivre la prépa physique d'Alix (Basic Fit) avant la reprise au FC Rouen.
Même socle technique que l'appli bac français : `index.html` + `app.jsx` (React via CDN, Tailwind, Babel navigateur), **sans build**, déployable sur Vercel.

## Les 3 profils (écran d'accueil)

| Bouton | Code | Rôle |
|---|---|---|
| **ALIX** | `FCR` | Voit son programme, choisit sa séance (A/B), saisit ses perfs, voit ses records. Écrit dans la base **Alix**. |
| **PAPA** | `papa` | Dashboard **lecture seule** : séances faites, courbes de progression, % d'assiduité. |
| **GUEST** | libre | Même expérience qu'Alix mais dans une base **séparée** — ne touche jamais aux données d'Alix. |

> Les codes sont un simple garde-fou côté navigateur (comme l'appli bac), pas une sécurité forte.

## Ce que fait l'appli (P0)

- Menu profils ALIX / PAPA / GUEST au lancement.
- Choix de la séance **A (Course + Abdos)** ou **B (Puissance + Haut)** à chaque session, avec les cibles du programme.
- Saisie du réalisé par activité avec **steppers +/-** (pas de clavier) : kg + séries×reps (machines), km/h + minutes (course), reps (abdos).
- Sauvegarde **par jour** en base (Vercel KV) avec **fallback localStorage** si la base est injoignable.
- Message d'encouragement **hype** à chaque activité validée (banque de 30+ messages, jamais 2× le même d'affilée).
- Message du jour à l'ouverture (jour de séance vs jour de repos).
- **Dashboard Papa** : liste des séances (date, type, durée, réalisé vs cible), courbes par exercice, % d'assiduité vs planning.
- Données Guest totalement isolées.

## Bonus déjà inclus (P1)
- Records personnels (presse max, vitesse max…).
- Série de séances (streak) sur l'accueil.
- Planning 6 → 27 juillet embarqué avec cases cochées.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page hôte (React, Tailwind, Babel, thème rouge FCR, PWA). |
| `app.jsx` | Toute l'appli (profils, séances, saisie, messages, dashboard). |
| `api/state.js` | Base KV avec clés séparées `prepa:alix:state` / `prepa:guest:state` (`?profile=`). |
| `api/message.js` | (Option) messages d'encouragement générés par Claude. Sans clé → banque intégrée. |
| `.env.example` | Modèle des variables d'environnement. |

## Tester en local
```bash
cd prepa-alix
python3 -m http.server 8000
# puis http://localhost:8000
```
En local sans serveur `api/`, l'appli passe automatiquement en **mode local** (localStorage). Tout fonctionne, la synchro cloud arrive au déploiement.

## Mettre en ligne (Vercel, gratuit)

1. Crée un compte sur https://vercel.com.
2. Mets le dossier `prepa-alix/` sur **GitHub**, puis Vercel → **Add New → Project → Import**.
   *(Sans GitHub : `npm i -g vercel` puis `vercel` depuis ce dossier.)*
3. **Base de données** : dans le projet Vercel → **Storage → Create → KV (Upstash Redis)** → connecte-la au projet. Les variables `KV_REST_API_URL` / `KV_REST_API_TOKEN` sont ajoutées automatiquement.
4. *(Optionnel)* **Settings → Environment Variables** → `ANTHROPIC_API_KEY = sk-ant-...` pour les messages IA.
5. **Deploy**. Vercel donne une adresse type `https://prepa-alix.vercel.app`.
6. Sur l'iPhone d'Alix : ouvrir l'adresse → Partager → **« Sur l'écran d'accueil »**.

> Si tu ajoutes la base/clé **après** le 1er déploiement, relance un « Redeploy ».

## Modifier le programme
Les cibles v1 sont dans `app.jsx` (`DEFAULT_PROGRAM`). Édition des cibles depuis un écran admin protégé : prévu en P1.

Déployé sur Vercel (base KV partagée).
