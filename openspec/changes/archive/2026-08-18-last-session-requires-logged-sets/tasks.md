## 1. Query fix

- [x] 1.1 In `db/queries/tracking.ts`, update the session-selection subquery in `getLastSessionSets` to add a correlated `EXISTS (SELECT 1 FROM sets s WHERE s.session_exercise_id = se.id AND s.is_warmup = 0)` so only sessions with at least one working set for the exercise qualify.
- [x] 1.2 Leave the set-fetching step (Step 2) unchanged — it still returns all sets (warmups included) from the selected session.

## 2. Verification

- [x] 2.1 Confirm no TypeScript or lint errors (`npm run typecheck`, `npm run lint` if available).
- [x] 2.2 Manually verify the skipped-exercise scenario: start a session from a routine, log nothing for one exercise, complete it; start a new session and confirm that exercise shows the last session where it had working sets (or the "first time" state if none exists).
- [x] 2.3 Manually verify the warmup-only scenario: a prior session with only warmup sets for an exercise is passed over in favor of an earlier session with working sets.
- [x] 2.4 Confirm the all-time "Heaviest" and "Most reps" pills are unchanged. (Verified via device testing; note the pills were subsequently removed from the session screen by `add-in-session-set-deltas` as designed — the underlying best/most-reps computations are unchanged and remain on the progression screen.)
