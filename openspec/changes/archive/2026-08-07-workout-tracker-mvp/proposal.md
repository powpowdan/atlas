## Why

Workout logging today happens in a flat text file (`exampleworkout.txt`). This works for capture but fails for retrieval: there is no quick way to see "what did I lift last time for this exercise" or "what is my best set that I am trying to beat back to." Sessions blur together, and Day 1 / Day 2 splits have to be re-typed every time. We need a structured tracker that mirrors the FitNotes mental model without its full complexity, built mobile-first so it lives on the phone where workouts actually happen.

## What Changes

- Introduce a **workout tracker mobile app** built with Expo + React Native + TypeScript.
- Local-first storage via `expo-sqlite`; no backend, no auth, no network dependency. Each install owns its own data.
- New capability: **routines** — reusable named workouts (e.g. "Day 1", "Day 2") defined as ordered lists of exercises, so a session can be started from a template instead of re-entering the exercise list each time.
- New capability: **sessions** — log a workout session by starting from a routine (pre-populated) or ad-hoc, then enter sets per exercise (weight × reps, warmup toggle, free-form notes per set and per exercise).
- New capability: **tracking** — inline display of "last set" and "best set" for an exercise while logging, using the rule: best = max weight, ties broken by max reps at that weight; warmup sets excluded.
- Seed exercise library from the names already present in `exampleworkout.txt` so the first run is not empty.
- Single-device only in this change; multi-device sync and Play Store publishing are explicitly deferred.

## Capabilities

### New Capabilities

- `routines`: Define, edit, list, and delete reusable workout templates composed of ordered exercises.
- `sessions`: Start a workout session (from a routine or ad-hoc), log sets under each exercise, mark the session complete, and browse past sessions.
- `tracking`: Surface per-exercise context during logging — the most recent top set ("last") and the all-time top set ("best") — using a deterministic comparison rule.

### Modified Capabilities

_None._ This is a greenfield app; there are no existing specs in `openspec/specs/`.

## Impact

- **New code, full project scaffold.** Creates an Expo Router project at the repository root: `app/` (routes), `components/`, `db/` (schema, client, migrations), `hooks/`, `store/`, `types/`.
- **New dependencies:** `expo`, `expo-router`, `expo-sqlite`, `zustand`, `typescript`, and supporting React Native tooling.
- **Local data only:** SQLite database lives on-device. No API surface, no remote services, no account model. Architecture must not preclude adding sync later, but no sync code is written in this change.
- **Distribution:** Development via Expo Go on the user's Android phone. No Play Store work in this change.
- **No breaking changes** — nothing pre-exists.
