## Why

The MVP computes "last" as a single top-set, but the user works in 4-set blocks and needs the *full* previous-session set list to pattern-match progression set-by-set. Separately, an in-progress session can only be Completed — never discarded — so an accidentally started session has no escape and orphaned `in_progress` sessions resurface as "active" later via `getActiveSession()`.

## What Changes

- **Tracking — last becomes a list.** Surface the full ordered set list from the most recent prior session for an exercise (working sets prominent, warmups visually de-emphasized), instead of a single computed top-set.
- **Tracking — best splits in two.** Add a "most reps" set (greatest reps, tie-break heaviest weight) alongside the existing "heaviest" set (greatest weight, tie-break reps), so rep-PR progression is visible.
- **Tracking — tap-to-copy.** Tapping a set in the last-session list copies its weight and reps into the set-entry controls, so matching a previous workout is one tap per set.
- **Sessions — discard an in-progress session.** Allow the user to delete an in-progress session entirely (and clear the active-session pointer if it is the active one), with a confirmation step.
- **Sessions — delete a completed session.** Allow the user to delete a completed session from history, removing it and its exercises/sets.
- **Session-screen UX polish (no spec change).** Full carry-forward (after adding set N, set N+1 pre-fills weight *and* reps from set N), auto-focus the weight input, chain the keyboard `next` key weight→reps→add, strip trailing `.0` from displayed weights, and seed Day 1 / Day 2 as routines from `exampleworkout.txt` on first run.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `tracking`: "Last set per exercise" requirement is replaced with a full last-session set list (warmups included but de-emphasized); a new "Most reps set per exercise" requirement is added; "Display context during logging" is updated to show heaviest + most-reps + the last-session list together and to support tap-to-copy from that list.
- `sessions`: New requirements to discard an in-progress session and to delete a completed session are added; both remove the session and its exercises/sets via cascade.

## Impact

- **Database:** No schema change. New query functions (`getLastSessionSets`, `getMostRepsSet`) reuse existing indexes; `deleteSession` relies on the existing `ON DELETE CASCADE` foreign keys (`session_exercises` → `sets`). No migration file needed.
- **Code:** `db/queries/tracking.ts` (new queries), `db/queries/sessions.ts` (`deleteSession`), `hooks/useExerciseBestLast.ts` (expanded return shape), `app/session/[id].tsx` (tracking card rewrite, carry-forward, discard, tap-to-copy, focus/format polish), `app/history/[id].tsx` (delete affordance), `seed/` (Day 1 / Day 2 routines), `types/index.ts` (extended tracking types).
- **Data:** Local-only, single-user. Deleting a session permanently removes its sets, which correctly recomputes best/last on next query (no cached aggregates exist).
- **No breaking changes** to stored data; the tracking display change is additive to the user's information, subtractive only in that the old single "last" pill is replaced by the richer list.
