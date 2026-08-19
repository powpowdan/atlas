## 1. Tracking queries and types

- [x] 1.1 In `db/queries/tracking.ts`, add `getLastSessionSets(db, exerciseId, currentSessionId)` implementing design.md Decision 1 (resolve most-recent prior `complete` session excluding current, then return its ordered sets including warmups; two indexed steps)
- [x] 1.2 In `db/queries/tracking.ts`, add `getMostRepsSet(db, exerciseId)` implementing Decision 2 (`ORDER BY reps DESC, weight DESC, created_at ASC LIMIT 1`, warmups excluded)
- [x] 1.3 Leave `getBestSet` unchanged (heaviest = `weight DESC, reps DESC`); remove the old single `getLastSet` once no consumer references it
- [x] 1.4 Extend `types/index.ts`: add a `LastSessionSet` type (id, weight, reps, is_warmup, created_at, started_at) and widen `BestLastResult` usage so the hook can return `{ heaviest, mostReps, lastSets }`

## 2. Hook and session-screen tracking card

- [x] 2.1 Rewrite `hooks/useExerciseBestLast.ts` to return `{ heaviest, mostReps, lastSets }`, calling `getBestSet`, `getMostRepsSet`, and `getLastSessionSets`; keep the `refreshKey` re-query trigger
- [x] 2.2 In `app/session/[id].tsx` `ExerciseBlock`, replace the two `BestLastPill`s with a tracking card showing: **Heaviest** pill, **Most reps** pill, and the last-session set list (working sets prominent, warmups dimmed per spec), each set with weight × reps
- [x] 2.3 Implement tap-to-copy (Decision 3): tapping a last-session set row writes its weight and reps into the `ExerciseBlock` weight/reps inputs; ensure a subsequent carry-forward does not overwrite non-empty inputs
- [x] 2.4 Render the first-time empty state (no heaviest, most-reps, or last-session data) per the "First-time exercise" scenario

## 3. Session lifecycle: discard and delete

- [x] 3.1 Add `deleteSession(db, id)` to `db/queries/sessions.ts` (Decision 5): `DELETE FROM sessions WHERE id = ?` relying on cascade; no client-state awareness
- [x] 3.2 On the active-session screen (`app/session/[id].tsx`), add a secondary destructive "Discard session" action with an `Alert.alert` confirm; on confirm call `deleteSession`, clear `activeSessionId` if it matches, and navigate back / replace to `(tabs)/index`
- [x] 3.3 On the history detail screen (`app/history/[id].tsx`), add a "Delete" action with an `Alert.alert` confirm; on confirm call `deleteSession` and navigate back to the history list
- [x] 3.4 Ensure `getActiveSession`/Sessions-tab behavior does not silently surface a leftover in-progress orphan as active after the most recent one is completed or discarded (per the "orphan" scenario) — Sessions tab surfaces an in-progress session with explicit Resume + Discard actions

## 4. Entry speed and polish

- [x] 4.1 Implement full carry-forward (Decision 4) in `ExerciseBlock`: after a successful `addSet`, and on mount when the form is empty and the exercise has sets, prefill weight AND reps from the most recent set of this session exercise; never override edit-mode or non-empty inputs
- [x] 4.2 Chain `returnKeyType="next"` weight → reps → Add via ref forwarding. NOTE: `autoFocus` was intentionally omitted — auto-focusing every block's weight in a scrolling FlatList steals focus as items mount during scroll; the focus chain alone delivers the tap reduction. Revisit if the UI moves to one-exercise-per-screen.
- [x] 4.3 Add a `formatWeight(n)` helper (whole numbers render without trailing `.0`) and apply it in set rows and the tracking pills
- [x] 4.4 Confirm the 91.5 decimal weight still displays as `91.5` (not rounded) through `formatWeight`

## 5. Seed Day 1 / Day 2 routines

- [x] 5.1 Extend the seed step to create the two routines from `exampleworkout.txt` (Day 1: Bench, Fly, Ab crunch, Paloff press, Face pull, Tri pulldown, Bi; Day 2: Pulldown, Seated row, Assisted, Shoulder press), guarded by `COUNT(*) FROM routines = 0`
- [x] 5.2 Resolve exercise names → ids against the already-seeded `exercises` table inside a transaction, writing `routine_exercises` rows with `order_index`; assert/log any unresolved names

## 6. Verification

- [x] 6.1 Tracking scenarios: heaviest (45×6 beats 40×7); most-reps (40×7 beats 45×6; tie on reps broken by weight); warmups excluded from heaviest and most-reps but shown dimmed in last-session list; last-session list drawn from the most recent prior complete session only
- [x] 6.2 Tap-to-copy: tapping a last-session row fills weight+reps and is preserved against carry-forward until cleared or saved
- [x] 6.3 Carry-forward: after set N, set N+1 prefills N's values; first set of an exercise stays empty; editing an existing set is not overridden
- [x] 6.4 Discard: discarding the active session removes it, clears the active pointer, returns to the start prompt; requires confirm
- [x] 6.5 Delete completed: deleting from history detail removes the session and returns to a history list without it; requires confirm; deleting a session that held a best/most-reps set recomputes tracking on next view
- [x] 6.6 Seed: first launch with empty `routines` creates Day 1 and Day 2; second launch does not duplicate; start-session-from-Day-1 pre-populates the correct exercises in order
- [x] 6.7 Run `npm run typecheck` and resolve any errors from the widened hook return shape and new types
