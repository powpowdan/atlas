## Why

During a set-based workout, rest intervals between sets are a training variable the app currently makes invisible. A user who wants to wait ~2 minutes before the next set of an exercise has no in-app way to see how long it has been, so they either guess or check a separate clock app. Because supersets (2–3 exercises alternated back to back) are common, a single session-level clock would be misleading — each exercise needs its own recovery clock.

## What Changes

- Add a per-exercise rest stopwatch to the active session screen, displayed in each exercise's sticky section header.
- The stopwatch shows elapsed time since the most recent logged set **of that exercise** (warmup or working), derived from the set's existing `created_at` timestamp.
- Display-only: no rest targets, no progress fill, no haptic/audio alerts (explicitly out of scope).
- Each exercise's timer resets when a new set of that same exercise is logged. Time spent performing a different exercise still counts toward the resting exercise's elapsed time (true recovery clock for that movement).
- No schema, storage, or state-management changes — elapsed time is always computed, never accumulated.

## Capabilities

### New Capabilities
- `rest-stopwatch`: per-exercise elapsed-time display in the in-progress session screen, anchored to the latest set's timestamp.

### Modified Capabilities
<!-- None: the sessions capability's requirements are unchanged; this adds an independent display behavior. -->

## Impact

- `app/session/[id].tsx`: render the stopwatch in `ExerciseHeader` (sticky section header row, right-aligned).
- New leaf component (e.g. `components/RestTimer.tsx`): owns a 1-second interval, isolated from screen re-renders.
- No database, query, store, or type changes — `sets.created_at` already exists and `SessionDetail` already delivers sets sorted ascending by `created_at`.
- Sequencing: depends on the sticky exercise header UI from the in-flight `add-sticky-exercise-headers` change; implement after that change lands to avoid conflicts in the same header component.
