# Concord

Un clone de Discord centré sur les **fonctionnalités de base** : serveurs, salons textuels & vocaux,
messagerie en temps réel et personnalisation de profil. Pas de boutique, pas de superflu.

> Pensé pour devenir une **vraie application téléchargeable** (.exe / .dmg) via Electron par la suite —
> la base est une app web, exactement comme le vrai client Discord.

## 🧱 Stack

| Partie   | Techno |
|----------|--------|
| Frontend | React + Vite |
| Backend  | Node.js + Express + Socket.IO |
| Base     | SQLite (module `node:sqlite` natif — zéro installation) |
| Auth     | JWT + mots de passe hashés (scrypt natif) |
| Temps réel | WebSocket via Socket.IO |

Aucune dépendance native à compiler : SQLite et le chiffrement utilisent des modules intégrés à Node.

## ✅ Fonctionnalités

- **Comptes** : inscription / connexion, session persistante
- **Serveurs** : création, code d’invitation, rejoindre, quitter, supprimer
- **Salons** : textuels et vocaux, création / suppression (propriétaire)
- **Chat textuel** : messages en temps réel, historique, regroupement, indicateur « écrit… »
- **Vocal** : présence dans les salons vocaux *(stub — l’audio WebRTC viendra ensuite)*
- **Présence** : membres en ligne / hors ligne en direct
- **Profil** : nom affiché, couleur ou image d’avatar, statut, bio

## 🚀 Démarrage

Prérequis : **Node.js ≥ 24** (pour le module `node:sqlite`).

```bash
# À la racine du projet
npm run install:all   # installe racine + serveur + client
npm run dev           # lance le serveur (3001) ET le client (5173)
```

Puis ouvre **http://localhost:5173**.

> Pour tester le temps réel : ouvre un second onglet en navigation privée,
> crée un autre compte, rejoins le même serveur avec le code d’invitation.

### Lancer séparément

```bash
npm --prefix server run dev   # backend seul
npm --prefix client run dev   # frontend seul
```

## 📁 Structure

```
concord/
├── server/                 # API Express + Socket.IO (le "cerveau")
│   └── src/
│       ├── index.js        # point d'entrée
│       ├── db.js           # schéma SQLite
│       ├── auth.js         # JWT + hash mots de passe
│       ├── permissions.js  # rôles & permissions
│       ├── socket.js       # temps réel (messages, présence, vocal WebRTC, DM)
│       └── routes/         # auth, users, servers, channels, dms
├── client/                 # Interface React (Vite)
│   └── src/
│       ├── pages/          # Login, Register, AppLayout
│       ├── components/     # ServerRail, ChatView, VoiceView, Dm*, Roles*…
│       ├── hooks/          # useVoice (WebRTC)
│       └── context/        # AuthContext
├── desktop/                # App Electron (main.js, preload.js)
├── electron-builder.yml    # Config de packaging (Win/Mac/Linux)
└── .github/workflows/      # CI : construit & publie les versions
```

## 🖥️ Application desktop (Electron)

Concord peut être empaquetée en **vraie application téléchargeable** (Windows `.exe`,
macOS `.dmg`, Linux `.AppImage`), avec **mise à jour automatique**.

> ⚠️ L'app desktop est le **client**. Le **serveur** (`server/`) doit tourner
> séparément sur une machine accessible (celle d'un « host » ou un hébergement).
> Dans l'app, l'écran de connexion permet d'indiquer l'adresse du serveur.

```bash
npm run desktop:dev      # lance serveur + client + fenêtre Electron (développement)
npm run desktop:build    # construit l'installateur pour TON système (dans desktop/release/)
```

### Publier une nouvelle version (mise à jour automatique)

La publication passe par **GitHub Releases** + **GitHub Actions** :

1. Dans [`electron-builder.yml`](electron-builder.yml), remplace `VOTRE-PSEUDO-GITHUB`
   par ton pseudo GitHub.
2. Incrémente la version dans [`package.json`](package.json) (ex. `0.1.0` → `0.1.1`).
3. Publie :
   ```bash
   git add -A && git commit -m "v0.1.1"
   git tag v0.1.1
   git push && git push --tags
   ```
4. GitHub Actions construit alors les installateurs Windows/Mac/Linux et les met en ligne.
   Les apps déjà installées se mettent à jour **toutes seules** au prochain lancement.

> Les changements **côté serveur** (nouvelles fonctions, corrections) ne nécessitent
> PAS de nouvelle version de l'app : il suffit de redéployer le serveur.

## 🗺️ Prochaines étapes suggérées

1. **Hébergement du serveur** (pour jouer à plusieurs hors du réseau local)
2. **Serveur TURN** pour un vocal fiable entre réseaux différents
3. **Signature de code** (certificats) pour supprimer les avertissements Windows/Mac
4. Upload de fichiers / images dans les messages
5. Icône personnalisée de l'app (`desktop/build/icon.icns` / `icon.ico`)

## 🔐 Note de sécurité

Le secret JWT par défaut est un secret de développement. En production, définis
`JWT_SECRET` dans l’environnement du serveur.
