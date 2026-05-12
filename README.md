# TheGroove

TheGroove is a mobile-first application backed by Firebase that enables location-based groups ("grooves"), real-time chat, and targeted notifications. This repository contains the mobile client (Expo/React Native), server functions (Firebase Cloud Functions), shared utilities, and helper scripts used to run and deploy the system.

Table of contents

- Overview
- Architecture
- Directory layout
- Prerequisites
- Environment variables
- Local setup
- Development workflow
- Testing
- Deployment
- Useful scripts
- Contributing
- Troubleshooting

Overview
--------

TheGroove connects users into location-based groups where they can chat and coordinate in real time. The mobile app (Expo) communicates with Firebase services and Cloud Functions for authentication, messaging, and background tasks.

Architecture
------------

- Client: Expo React Native app in `src/client`.
- Server: Firebase Cloud Functions in `functions` (TypeScript/JavaScript compiled to `lib`).
- Firestore: primary datastore for users, grooves, messages.
- Notifications: FCM via functions utilities.

Directory layout (high level)
----------------------------

- `functions/` — Cloud Functions source, build output `lib/`, and function-specific `package.json`.
- `src/client/` — Expo app source, assets, and client package manifest.
- `src/` — shared TypeScript sources used by server and client (if any).
- `scripts/` — helper scripts (e.g., `reset-project.js`).

Prerequisites
-------------

- Node.js 16+ (LTS recommended)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Expo CLI when developing the client (`npm install -g expo-cli` or use `npx`)

Environment variables
---------------------

Create environment files from the examples added to the repo:

- `functions/.env.example` — server-side secrets (service account, project id, API keys).
- `src/client/.env.example` — client Firebase config and optional API keys.

Never commit real secret values. Use CI/secret stores or `firebase functions:config:set` for sensitive server configuration.

Local setup
-----------

1. Install root and workspace dependencies:

```bash
npm install
```

2. Install per-package dependencies (if you prefer, use a single command for both):

```bash
# from repo root
cd functions && npm install
cd ../src/client && npm install
```

3. Add configuration and secrets:

- Copy `functions/.env.example` -> `functions/.env` and fill values.
- Copy `src/client/.env.example` -> `src/client/.env` and fill values.

4. Firebase service account / local credentials (server):

- Place your service account JSON where your functions code expects it, or configure `GOOGLE_APPLICATION_CREDENTIALS` to point to it.

Running locally
---------------

Start the Firebase emulators (recommended for development):

```bash
cd functions
firebase emulators:start --only functions,firestore,auth
```

Start the Expo client:

```bash
cd src/client
npx expo start
```

When using emulators, configure the client to point to the local Firestore emulator if your code supports it (look for emulator connection code in `src/client` or shared utilities).

Testing
-------

- There are no automated tests in the repo by default. Add unit and integration tests under `functions/test` and `src/client/__tests__` as needed.

Deployment
----------

Deploy server functions and hosting with the Firebase CLI:

```bash
firebase deploy --only functions,hosting
```

Review `functions/package.json` for any build steps (TypeScript compilation) before deploying. If functions use TypeScript, run the build step first:

```bash
cd functions
npm run build
```

Useful scripts
--------------

- `npm run reset-project` — moves starter code to `app-example` and creates a blank `app` directory (project-specific script).
- Check `functions/package.json` and `src/client/package.json` for additional scripts such as `build`, `lint`, `serve`.

Contributing
------------

- Fork the repository and open a pull request with a clear description.
- Run linters and tests (if present) before submitting.
- For infrastructure/secret changes, provide instructions and do not commit secrets.

Troubleshooting
---------------

- If builds fail, run `npm ci` to reset dependencies.
- For Firebase auth or Firestore errors, ensure emulator is running or that your production config matches the Firebase console.

Next steps I can take
---------------------

- Add example env files and a short developer checklist (I will add these files now).
- Populate `functions/package.json` and `src/client/package.json` script references into this README.

---

Files added: `functions/.env.example`, `src/client/.env.example`, `DEV_CHECKLIST.md`.
