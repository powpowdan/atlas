## Context

`app/session/[id].tsx` renders one `ExerciseBlock` per exercise. Context comes from `hooks/useExerciseBestLast.ts`, which fans out to `getBestSet`, `getMostRepsSet`, and `getLastSessionSets` in `db/queries/tracking.ts`. `getLastSessionSets` finds the most recent qualifying session (status `complete`, ≥1 working set, excluding the current session) and returns its full set list. There is no notion of deltas, ghosts, or notes in any query today; `sessions.note` and `sets.note` exist in the schema but are never read during logging. The qualifying-session rule is owned by in-flight `last-session-requires-logged-sets` (3/6 tasks) — this change layers on top of it and must be implemented after it lands. `estimateE1rm` (Epley) already exists and is used by `getExerciseProgress`.

## Goals / Non-Goals

**Goals:**

- One reference bundle per exercise that drives the whole `ExerciseBlock` context region: slots (with ghosts), summary, notes, and PR baselines.
- All slot/ghost/delta/summary logic in one pure, unit-testable module so the rules in the spec are decidable without a UI.
- Keep rendering cheap during a workout: no re-query of history beyond what already happens per `refreshKey` bump.

**Non-Goals:**

- History-screen (`history/[id].tsx`) parity — v1 is the in-progress session screen only.
- Any schema change, new dependency, or new route.
- Persisting computed deltas or badges — they are derived views, recomputed from raw sets.

## Decisions

### D1: One query returns the last N qualifying sessions; merging happens in TypeScript

Add `getRecentQualifyingSessions(db, exerciseId, currentSessionId, n = GHOST_WINDOW + 1)` returning, for each of the most recent `n` qualifying sessions (same qualifying rule as `getLastSessionSets`): session id, `started_at`, session note, and all sets (working + warmup) with set notes.

- The slot merge (positional first-match across sessions, newest wins), ghost aging, session summary (top set by `estimateE1rm`, tie → heavier weight, then earliest), and notes roll-up are computed in a pure function `buildReferenceBundle(sessions)` in a new `utils/referenceSlots.ts`.
- Why not SQL: the merge is positional across per-session lists — expressible in SQL with window functions but opaque; TypeScript is trivially testable and the data volume (≤ ~4 sessions × ~6 sets) is negligible.
- Why fetch `GHOST_WINDOW + 1` sessions: slots need only the last 3, but the summary compares the two most recent — which the same bundle provides. One extra session costs nothing and keeps a single fetch. (Fetching only 2 would also suffice for the summary; `+1` gives slack if the ghost window is tuned up without touching the query.)

Alternative rejected: reusing/extending `getLastSessionSets` — its return shape (a flat set list from one session) cannot express per-slot provenance or age.

### D2: Slot model and aging

`ReferenceSlot = { position: number (1-based, working sets only); weight; reps; sessionId; startedAt; ageInSessions: number; note: string | null; isGhost: boolean }` where `ageInSessions` counts qualifying sessions newer than the slot's source (0 = most recent). `isGhost = ageInSessions > 0`. Slot count = max working-set count across the window; slot *p* takes its value from the newest session in the window having a working set at position *p*. A position absent from all 3 window sessions simply produces no slot. Warmups from the newest session ride along in a separate array (display-only). `GHOST_WINDOW = 3` lives as a named constant in `utils/referenceSlots.ts` — the one-number knob.

### D3: Delta rendering as a pure classifier

`classifySetDelta(current, reference)` returns one of: `{ kind: 'new-set' }` (no reference slot), `{ kind: 'match' }`, or `{ kind: 'delta', weightDelta, repsDelta, tone }` where `tone` is `'up'` when `weightDelta > 0`, `'up'` when `weightDelta === 0 && repsDelta > 0`, `'down'` when `weightDelta === 0 && repsDelta < 0`, and `'up'` when `weightDelta > 0` regardless of reps (weight-up-is-a-win per spec). `weightDelta < 0` at any reps → `'down'`. Component strings (`▲+2.5 ▼−2`) are derived in the component; the classifier stays numeric and testable. Current-session rows map working sets positionally onto slots (working sets only; warmup rows get no delta).

### D4: PR baselines exclude the current session via a query parameter

Extend `getBestSet` and `getMostRepsSet` with an optional `excludeSessionId` parameter threaded into the WHERE clause (`AND sess.id <> ?` via a join alias). Default `null` keeps existing callers (progression screen records summary) untouched. The badge check itself is a pure function over (loggedSet, baseline pair). Badge display is per-row state on the logged set (a set that was a PR when logged stays badged for the session; deleting a later set does not retroactively re-badge).

- Alternative rejected: computing baselines from the same `getRecentQualifyingSessions` fetch — wrong: all-time records span all history, not 3 sessions.

### D5: `useExerciseBestLast` becomes `useExerciseReference`

The hook re-queries on the same triggers (`exerciseId`, `currentSessionId`, `refreshKey`) and returns `{ bundle, heaviest, mostReps }` where `heaviest`/`mostReps` are the prior-session-excluded baselines. Two parallel fetches: `getRecentQualifyingSessions` (→ `buildReferenceBundle`) and the two baseline lookups. Every set add/edit/delete bumps `refreshKey`, so deltas, ghost expiry (if the current session now covers a slot), and badges update live. Ghost expiry mid-session: the current session is excluded from the window by definition, so logging today never ages a ghost out — a ghost only disappears across sessions, as specified.

### D6: Visual treatment

Reference region above the entry row: summary line (small, muted), slot chips in a wrap row (ghosts at reduced opacity + short age label like "2w ago" derived from `startedAt`), collapsed `⌄ notes (n)` affordance (expandable `Animated`-free simple state toggle), then entry controls. Logged working-set rows append the delta string, colored green (`#1aa260`) for `up`, muted red (`#c00`) for `down`, gray for `match`/`new-set` (`● new set`). Badges: inline pill `NEW HEAVIEST` / `NEW REP PR` (amber `#b8860b` background) on the qualifying row. All-time pills and their styles are deleted from the session screen.

### D7: Age label for ghosts

Ghost chips show a relative label from `startedAt` (e.g. "2w ago", "5d ago") rather than session ordinal — users think in time, not in qualifying-session counts, and the count is already implied by position/fade. Computed with a small helper (days → human string); no date library.

## Risks / Trade-offs

- [Three in-flight changes touch `tracking`; archive order matters] → Implement this change after `last-session-requires-logged-sets` archives. The REMOVED requirement here explicitly carries that change's qualifying rule forward, so archive-time merge stays mechanical.
- [Block visual density grows; gym use is glanceable-by-feel] → Ghost fade + summary kept to one line; if it still feels busy, the notes affordance and summary are the first candidates to hide behind a tap (pure UI tweak, no spec change needed for notes default-collapsed).
- [Positional comparison assumes stable set structure (rep ranges, drop sets confuse slots)] → Accepted: matches the user's fixed 4-set double-progression scheme. Escape hatch is the "new set"/ghost model itself — structure changes degrade gracefully into ghosts.
- [Badges computed at log time; retro-active re-computation after edits/deletes is not attempted] → Editing a set re-runs the refresh, and badge state derives from row data on each render, so manual corrections stay honest; only pathological orderings (delete the PR set, then the runner-up should re-badge) may show no badge until next set entry. Accepted for v1.
- [Weight formatting] → Existing `formatWeight` prints raw numbers; deltas format as `+2.5`/`-2` with trailing-zero trim, consistent with current display.

## Migration Plan

Pure additive query/hook/UI change over existing tables; no data migration. Rollback = revert the commit; `getBestSet`/`getMostRepsSet` default parameters leave other callers byte-identical. The old `getLastSessionSets` is superseded: after this change lands, its only remaining caller is gone — delete it in this change (the progression screen's `getExerciseProgress` is independent).
