## 1. Project scaffold

- [x] 1.1 Scaffold an Expo + Expo Router + TypeScript project at the repo root using `create-expo-app` (typescript template), pinning the Expo SDK version
- [x] 1.2 Install runtime dependencies: `expo-sqlite`, `zustand`, `uuid` (and `@types/uuid`)
- [x] 1.3 Create the folder layout from design.md Decision 5 (`app/`, `components/`, `db/`, `hooks/`, `store/`, `types/`, `seed/`, `constants/`)
- [x] 1.4 Add a root `_layout.tsx` that opens the SQLite DB on mount and renders a placeholder tabs navigator
- [x] 1.5 Document the run command (`npx expo start`) and the pinned Expo SDK version in a README, plus the `exampleworkout.txt` source-of-truth pointer
- [x] 1.6 Verify the app boots in Expo Go on an Android device with a blank screen and no console errors

## 2. Database layer

- [x] 2.1 Write DDL strings in `db/schema.ts` for all six tables (`exercises`, `routines`, `routine_exercises`, `sessions`, `session_exercises`, `sets`) plus a `schema_version` table, exactly matching design.md Decision 2
- [x] 2.2 Implement `db/client.ts` to open the SQLite database, run migrations from `db/migrations/` forward-only, and track applied versions in `schema_version`
- [x] 2.3 Write the initial migration `db/migrations/0001_initial.sql` that creates all tables and indexes (`session_exercises(exercise_id)`, `sets(session_exercise_id, is_warmup)`)
- [x] 2.4 Define shared TypeScript types in `types/` matching the schema (Exercise, Routine, RoutineExercise, Session, SessionExercise, Set)
- [x] 2.5 Verify the DB opens on a cold app start, all tables exist, and re-running the app does not re-apply the initial migration

## 3. Exercise library and seed

- [x] 3.1 Build `seed/exercises.json` from the exercise names in `exampleworkout.txt` (Bench, Fly, Ab crunch, Paloff press, Face pull, Tri pulldown, Bi, Pulldown, Seated row, Assisted, Shoulder press) with sensible categories
- [x] 3.2 Implement a seed function in `db/queries/exercises.ts` that inserts exercises from `seed/exercises.json` only if the `exercises` table is empty, using `INSERT OR IGNORE` to respect the unique name constraint
- [x] 3.3 Add a "Manage exercises" screen allowing the user to add a new exercise (name, optional category, optional `is_assisted` flag) reachable from the routines tab header
- [x] 3.4 Verify the seed runs on first launch, does not duplicate on second launch, and a user-added exercise persists across app restarts

## 4. Routines capability

- [x] 4.1 Implement `db/queries/routines.ts` with typed functions: `createRoutine`, `listRoutines` (ordered by `updated_at DESC`), `getRoutine` (with its ordered exercises), `updateRoutine` (name + reordered exercise list in a single transaction), `deleteRoutine` (cascade to `routine_exercises`)
- [x] 4.2 Build the Routines tab screen: list of routines (name + exercise count), empty state when none exist, FAB or header button to create a new routine
- [x] 4.3 Build `routine/new.tsx`: name input, exercise picker (multi-select from the library), ordered list with reorder controls, save button with validation that rejects an empty name
- [x] 4.4 Build `routine/[id].tsx`: existing routine view + edit mode that reuses the new-routine UI, with rename, add, remove, and reorder all wired to `updateRoutine`
- [x] 4.5 Verify spec scenarios: create with name + ordered exercises, reject empty name, duplicate exercise allowed in same routine, reorder persists, remove persists, edit does not touch past sessions, delete preserves past sessions (covered once sessions exist)

## 5. Sessions capability

- [x] 5.1 Implement `db/queries/sessions.ts`: `startSessionFromRoutine(routineId)` (copies `routine_exercises` into new `session_exercises` rows in a transaction), `startSessionAdhoc()`, `addExerciseToSession`, `addSet`, `updateSet`, `deleteSet`, `markSessionComplete`, `listSessions` (ordered by `started_at DESC`), `getSession` (with exercises and sets), `setSessionNote`
- [x] 5.2 Build `session/new.tsx`: choose a routine from a list, or pick "ad-hoc", then navigate to the new session's `[id]` route
- [x] 5.3 Build `session/[id].tsx` (active session logging UI): for each session exercise, show exercise name, set-entry row (weight, reps, warmup toggle, optional note, save), list of entered sets with edit/delete, and an "add exercise" entry for ad-hoc extension
- [x] 5.4 Add session-level note input and a "complete session" action that calls `markSessionComplete` and navigates back to history
- [x] 5.5 Build the History tab screen: list of completed sessions (date, routine name or "Ad-hoc", exercise count), empty state when none exist
- [x] 5.6 Build `history/[id].tsx`: read-only view of a past session with all exercises, sets (warmup flagged), session note, and routine name
- [x] 5.7 Verify spec scenarios: start from routine pre-populates and survives routine edits, ad-hoc starts empty, decimal weight accepted (91.5), warmup toggle persists, note persists, validation rejects empty weight+reps, edit and delete set work, complete moves session to history, list and view past session work

## 6. Tracking capability

- [x] 6.1 Implement `db/queries/tracking.ts` with the two SQL queries from design.md Decision 3: `getBestSet(exerciseId)` and `getLastSet(exerciseId, currentSessionId)`, both excluding warmups
- [x] 6.2 Build a `useExerciseBestLast(exerciseId, currentSessionId)` hook that returns `{ best, last }` and re-queries when the session's sets for that exercise change
- [x] 6.3 Add a Best/Last context card above the set-entry controls in `session/[id].tsx`, showing weight × reps and date for each, or a first-time prompt when both are null
- [x] 6.4 Verify spec scenarios: heavier weight beats more reps, tie broken by reps, warmup excluded from both best and last, last drawn from most recent prior session only, first-time exercise shows the empty prompt
  - Note: this verified the MVP's single best/last tracking, which was subsequently modified (last → full session set list, plus a most-reps pill) by the improve-session-tracking change.

## 7. Active-session state wiring

- [x] 7.1 Add a Zustand store holding the current `activeSessionId` (if any) so the Sessions tab can deep-link to an in-progress session instead of the "start" prompt
- [x] 7.2 Wire the Sessions tab to show the active session when one exists, or the start prompt when none does; clear `activeSessionId` on `markSessionComplete`
- [x] 7.3 Verify that closing the app mid-workout and reopening returns the user to the same active session

## 8. Smoke test and polish

- [x] 8.1 End-to-end manual test on Expo Go: create a "Day 1" routine from `exampleworkout.txt`, start a session, log all sets from the txt including the 91.5 weight and warmup flags, complete the session, view it in history, then start a second session and verify best/last context appears correctly
- [x] 8.2 Confirm the data model handles the "Assisted" exercise and the `90+` (i.e. 91.5) weight without special-casing
- [x] 8.3 Triage any crashes, console errors, or obvious UX gaps found during the smoke test
- [x] 8.4 Update README with how to reset the local DB (for dev) and the known trade-offs (no sync, no edit on completed sessions, unitless weight)

---

**Verification note (archive time):** Tasks 2.5–8.3 were completed once the app was made runnable on Expo Go (SDK-54 downgrade + Hermes UUID fix, landed in the `improve-session-tracking` change). They reflect implementation-completeness plus on-device boot and basic smoke use; exhaustive per-scenario device QA was not performed. Task 6.4's single best/last behavior was later replaced by `improve-session-tracking`.
