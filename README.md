# Workout Tracker

A local-first mobile workout tracker built with Expo + React Native + TypeScript. Replaces the `exampleworkout.txt` flat-file logging workflow with structured routines, sessions, sets, and inline last/best tracking.

## Run

```bash
npm install
npm start        # or: npx expo start
```

Then scan the QR code with **Expo Go** (Android) to load the app on your phone, or press `a` in the terminal to launch on a connected Android emulator/device.

## Stack (pinned versions, see `package.json`)

- Expo SDK **~57.0.11** (React Native 0.86, React 19.2)
- **expo-router** (~57.0.11) — file-based routing, tabs
- **expo-sqlite** (~57.0.1) — local SQLite storage
- **zustand** (^5) — client state for active session
- **uuid** (^11) — text primary keys (chosen for future multi-device sync friendliness)

## Source-of-truth

`exampleworkout.txt` — the original flat-file workout log this app replaces. The seed exercise library in `seed/exercises.json` is derived from the exercise names in this file.

## Resetting the local database (dev)

The SQLite database lives on-device under Expo's app sandbox as `workout.db`. To wipe it during development, clear Expo Go's storage or uninstall/reinstall Expo Go.

In a managed dev workflow, the simplest reset is to bump the migration version in `db/client.ts` and let the schema rebuild from scratch — or, for a full wipe, clear the Expo Go app data on your device.

## Architecture

See `openspec/changes/workout-tracker-mvp/design.md` for the full design, including the data model, the tracking SQL queries, and the rationale for the major decisions.

### Folder layout

```
app/                   Expo Router routes
  _layout.tsx          Root: SQLiteProvider + Stack
  (tabs)/_layout.tsx   Tabs: Sessions, Routines, History
  (tabs)/index.tsx     Sessions tab
  (tabs)/routines.tsx  Routines tab
  (tabs)/history.tsx   History tab
  routine/             Routine CRUD screens
  session/             Active session logging screens
  history/             Read-only past session view
  exercise/            Exercise library management
components/            Presentational components
db/
  client.ts            DB open + migrate + seed
  schema.ts            DDL strings (source of truth for migration 0001)
  migrations/          Forward-only SQL migrations (0001_initial.sql)
  queries/             Typed query modules (exercises, routines, sessions, tracking)
hooks/                 React hooks (useExerciseBestLast, etc.)
store/                 Zustand stores
types/                 Shared TS types matching the schema
seed/                  Seed data (exercises.json)
constants/             App constants
```

## Known trade-offs (MVP)

- **No cloud sync.** All data is local to one device. The schema uses text UUIDs and `created_at` timestamps to make future sync a layered addition, not a rewrite.
- **No editing of completed sessions.** Once a session is marked complete it appears in history read-only. To fix a typo, recreate the session. (Likely first v1 feedback.)
- **Unitless weights.** `sets.weight` is a plain REAL. The user is expected to be consistent (all kg or all lb). Unit tracking is deferred to v1.
- **Forward-only migrations.** No down-migration. Acceptable because dev data can always be reconstructed from `exampleworkout.txt`.

## Planning artifacts

The full proposal, specs, design, and task breakdown live under `openspec/changes/workout-tracker-mvp/`. See `openspec/config.yaml` for project context.
