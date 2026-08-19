## Why

Completing a workout is currently an anticlimax: tapping "Complete session" instantly navigates away with no reward. All the ingredients for a satisfying end-of-workout tally (volume, reps, sets, PRs, duration) already exist in the session data — they're just never surfaced. Showing them at the moment of completion adds a fun, motivating payoff to every session.

## What Changes

- Add a session summary modal that appears when the user taps "Complete session" on an in-progress session
- Compute and display from the session's logged sets:
  - Total working volume, with warmup volume as a footnote. Volume uses "real moved weight" per exercise: dumbbell moves logged per-hand (Bench, Bi) count double, and Bench additionally carries a 45 lbs bar. Comparison stats (heaviest set, PRs, e1RM) use raw logged values
  - Total working sets and total reps
  - Active duration, measured from the first logged set's timestamp to the completion tap (not session creation time)
  - Heaviest working set of the session
  - Number of PRs set in the session (heaviest and rep PRs, reusing existing best-prior-result logic) and best estimated 1RM (Epley)
- Show a playful weight-equivalence line (e.g., "≈ 1.5 African elephants") derived from total working volume via a local lookup table — no network calls or new dependencies
- The equivalence ladder spans basketball (1.4 lbs) to blue whale (300,000 lbs) so any session size lands on a relatable comparison
- Brand the modal with the app logo as a subtle banner image
- Replace the current complete-then-immediately-navigate flow with complete → show summary → dismiss on "Done" → navigate away
- Handle edge cases: sessions with zero sets (skip stats), sessions with no prior history (omit PR line), ad-hoc sessions (label as "Ad-hoc")

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `sessions`: Adds a new requirement — completing an in-progress session presents a summary modal with derived totals (volume, sets, reps, active duration, heaviest set, PRs, best e1RM, equivalence line) before navigation. Warmup sets are excluded from headline totals and footnoted. Volume totals use per-exercise real moved weight (double for per-hand dumbbell logging; bench adds the bar) while comparison stats use raw logged values.

## Impact

- `app/session/[id].tsx`: `handleComplete` flow changes to compute summary, mark complete, and present the modal instead of navigating immediately
- New `components/SessionSummaryModal.tsx` (or similar) for the modal UI, including a logo banner image
- New pure util for summary computation (e.g., `utils/sessionSummary.ts`) containing the real-weight rule map (keyed by exercise name) and the equivalence ladder
- PR detection reuses `getBestSet` / `getMostRepsSet` queries from `db/queries/tracking.ts` (excluding the current session, as `useExerciseReference` already does)
- No schema changes, no new dependencies, no changes to history views (retroactive summaries on `history/[id].tsx` are explicitly out of scope)
