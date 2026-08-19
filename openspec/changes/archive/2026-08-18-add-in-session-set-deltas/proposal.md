## Why

The user spends most of their time inside an active session, yet the app only shows point-in-time context (all-time pills, a flat "last session" list). The actual question during a set is "did I beat last time?" — one extra rep, a bit more weight, one more set. Progressive overload is invisible today: no per-set up/down signal, no way to tell whether last session itself was an increase, and notes from last time are unreachable mid-workout.

## What Changes

- **Per-set deltas**: each logged working set in an active session displays its change vs the reference set in the same position (weight and rep components shown separately; a weight increase renders as positive even when reps drop).
- **Reference set slots with ghost persistence**: the "last time" reference becomes a per-slot merged view over the last 3 qualifying sessions — a set position skipped recently still shows its most recent value as a faded, age-stamped "ghost" (still tap-to-copy), and only disappears after 3 consecutive qualifying sessions without it. Each slot also displays its own change against the previous occurrence of that position (improved / dropped / matched), so mid-workout the user can tell whether matching is fine, a rep needs regaining, or a new PR is on the table.
- **Session-over-session summary**: a one-line comparison of the most recent qualifying session vs the one before it (top-set change, set-count change).
- **PR badges**: logging a set that beats an all-time record (heaviest, or rep PR at/above prior top weight) flashes a badge; records set earlier in the current session do not count as the baseline.
- **Prior notes**: set-level and session-level notes from the reference session are visible mid-workout, collapsed by default.
- **All-time pills removed** from the session screen; the best/most-reps computations survive as PR-badge triggers, and the records summary already lives on the progression screen (`add-exercise-progression-chart`).
- Scope: in-progress session screen only. History-screen parity is explicitly out of scope for v1.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tracking`: The during-logging context changes materially — "Last set per exercise" is superseded by a ghost-persistent reference-slot requirement; display context gains per-set deltas, the session summary, PR badges, and prior-notes visibility, and drops the all-time pill display.

## Impact

- Affected code: `db/queries/tracking.ts` (new query returning the last N qualifying sessions' sets + notes; session-exclusion parameter for best/most-reps lookups), `hooks/useExerciseBestLast.ts` (fetch the new reference bundle), `app/session/[id].tsx` (`ExerciseBlock` rework: remove pills, render slots/deltas/badges/notes), `types/index.ts` (new types).
- No schema or migration changes; no new dependencies.
- Sequencing: depends on the qualifying rule ("most recent prior session with ≥1 working set") from in-flight `last-session-requires-logged-sets`; implement after that change lands.
- The ghost window (3 qualifying sessions) is a single tunable constant.
