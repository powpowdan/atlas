## 1. Prerequisite check

- [x] 1.1 Confirm `last-session-requires-logged-sets` has been implemented and archived (this change builds on its qualifying rule in `getLastSessionSets`); if not, implement that change first

## 2. Types

- [x] 2.1 Add `QualifyingSessionSets` to `types/index.ts`: `{ sessionId: string; startedAt: number; sessionNote: string | null; sets: Array<{ id: string; weight: number; reps: number; isWarmup: boolean; note: string | null; createdAt: number }> }`
- [x] 2.2 Add `ReferenceSlot` to `types/index.ts`: `{ position: number; weight: number; reps: number; sessionId: string; startedAt: number; ageInSessions: number; isGhost: boolean; note: string | null }`
- [x] 2.3 Add `ReferenceBundle` to `types/index.ts`: `{ slots: ReferenceSlot[]; warmups: ReferenceSlot[]; summary: { topSetDeltaWeight: number; topSetDeltaReps: number; setCountDelta: number } | null; notesCount: number; latestSessionStartedAt: number | null; latestSessionNote: string | null }`
- [x] 2.4 Add `SetDelta` to `types/index.ts`: `{ kind: 'new-set' | 'match' | 'delta'; weightDelta?: number; repsDelta?: number; tone: 'up' | 'down' | 'flat' }`
- [x] 2.5 Run `npm run typecheck` and confirm a clean compile

## 3. Queries

- [x] 3.1 Implement `getRecentQualifyingSessions(db, exerciseId, currentSessionId, n)` in `db/queries/tracking.ts`: returns up to `n` most recent qualifying sessions (status `complete`, ≥1 working set for the exercise, excluding `currentSessionId`, ordered by `started_at` desc) as `QualifyingSessionSets[]`, each with session note and all sets (working + warmup, with set notes) in `created_at` order. Reuse the qualifying subquery shape from `getLastSessionSets`
- [x] 3.2 Extend `getBestSet` and `getMostRepsSet` with an optional `excludeSessionId: string | null = null` parameter that adds `sess.id <> ?` via a sessions join; default keeps existing callers (progression records summary) unchanged
- [x] 3.3 Run `npm run typecheck` and confirm the query module compiles cleanly

## 4. Pure reference logic

- [x] 4.1 Create `utils/referenceSlots.ts` with `GHOST_WINDOW = 3` as a named exported constant
- [x] 4.2 Implement `buildReferenceBundle(sessions: QualifyingSessionSets[]): ReferenceBundle`: slots are positional over working sets (position 1..N, N = max working-set count across the window), each slot takes its value from the newest session with a working set at that position, `ageInSessions` counts newer qualifying sessions, `isGhost = ageInSessions > 0`; warmups come from the newest session only, display-only; summary compares the two newest sessions' top working sets (best by `estimateE1rm`, tie → heavier weight, then earliest `created_at`) and working-set counts, `null` when fewer than 2 sessions; `notesCount` = session note presence + non-empty slot notes; ghost-expiry falls out of the window slice
- [x] 4.3 Implement `classifySetDelta(current: { weight: number; reps: number }, reference: ReferenceSlot | undefined): SetDelta`: no slot → `new-set`; equal weight+reps → `match` (`flat`); `weightDelta > 0` → `delta` with `tone: 'up'` regardless of reps; `weightDelta === 0 && repsDelta > 0` → `up`; `weightDelta === 0 && repsDelta < 0` → `down`; `weightDelta < 0` → `down`
- [x] 4.4 Implement `formatDeltaText(delta: SetDelta): string` (e.g. `▲ +2.5 ▼ −2`, `▲ +1 rep`, `● new set`) with trailing-zero-trimmed numbers, and `formatAgeLabel(startedAt: number): string` for ghost chips (e.g. `2w ago`, `5d ago`)
- [x] 4.5 Run `npm run typecheck`; hand-verify the six spec scenarios for deltas and the three ghost scenarios (keep/surface/expire) against the pure functions with small in-file fixtures or a scratch script

## 5. Hook

- [x] 5.1 Replace `hooks/useExerciseBestLast.ts` with `hooks/useExerciseReference.ts` returning `{ bundle: ReferenceBundle; heaviest: BestLastResult | null; mostReps: BestLastResult | null }`, fetched via `getRecentQualifyingSessions(db, exerciseId, currentSessionId, GHOST_WINDOW + 1)` (mapped through `buildReferenceBundle`) plus `getBestSet`/`getMostRepsSet` with `excludeSessionId = currentSessionId`, re-querying on the same triggers (`exerciseId`, `currentSessionId`, `refreshKey`)
- [x] 5.2 Update the one import site in `app/session/[id].tsx`; delete `hooks/useExerciseBestLast.ts` and `getLastSessionSets` from `db/queries/tracking.ts` (confirm no other callers with search first)

## 6. Session screen rework

- [x] 6.1 In `app/session/[id].tsx` `ExerciseBlock`: replace the `ContextPill` row and `LastSessionList` with the reference region — summary line (`vs <date>: ▲ +1 rep · +1 set` style, omitted when `summary` is null), slot chip row (ghosts faded with `formatAgeLabel`, tap copies weight/reps into entry and focuses reps), warmup chips from the newest session de-emphasized
- [x] 6.2 Add the collapsed notes affordance `⌄ notes (n)` below the slot row; tapping toggles a simple expanded view listing the session note and each slotted set note attributed to its session date; hide entirely when `notesCount === 0`
- [x] 6.3 On logged working-set rows, map this session's working sets positionally onto `bundle.slots` and render `formatDeltaText(classifySetDelta(...))` — green `#1aa260` for `up`, `#c00` for `down`, gray for `flat`/`new-set`; warmup rows get no delta
- [x] 6.4 Implement PR badges: after a working set is logged, compare it against the hook's `heaviest`/`mostReps` baselines (existing orderings) and render an inline `NEW HEAVIEST` / `NEW REP PR` pill (amber `#b8860b`) on the qualifying row; no badge on equal, none when the baseline is only from the current session
- [x] 6.5 Keep the first-time state: no qualifying history → existing "First time logging this exercise" box, no summary/slots/deltas/badges/notes
- [x] 6.6 Remove the now-unused `ContextPill`, `LastSessionList`, and related styles; run `npm run typecheck`

## 7. Verification

- [x] 7.1 Run `npm run typecheck` from WSL and confirm zero errors
- [x] 7.2 From PowerShell, start Metro and exercise the flows on device/emulator: log a set beating last session's slot (delta shows), bump weight with fewer reps (shows as progress), log a 4th set when reference has 3 (new-set marker), beat an all-time record (badge), open notes affordance, confirm ghost slots appear for a set position skipped last session (seed data as needed)
- [x] 7.3 Confirm the history screen and exercise progression screen render unchanged (no pills were removed there; `getBestSet`/`getMostRepsSet` defaults intact)

## 8. Amendment: per-slot previous-occurrence deltas

- [x] 8.1 Add `prevDelta: SetDelta | null` to `ReferenceSlot` in `types/index.ts`
- [x] 8.2 In `utils/referenceSlots.ts`, widen `classifySetDelta`'s reference param to `{ weight; reps }` and compute `prevDelta` in `buildReferenceBundle` from the prior occurrence of each slot's position in older fetched sessions (skip-passing, same rule as ghosts; `null` when none); warmups get `null`
- [x] 8.3 In `app/session/[id].tsx`, render the mini delta inside each slot chip (green/red/gray via shared `deltaColor` helper); ghosts show theirs too
- [x] 8.4 Extend scratch fixtures with prevDelta scenarios (improve/drop/match/no-prior/ghost-prior/warmup-null) and re-run; `npm run typecheck` clean

## 9. Amendment: weight unit labels

- [x] 9.1 Add shared `formatWeightLabel` (`utils/format.ts`) appending ` lbs`; apply to set/record displays in `app/session/[id].tsx`, `app/history/[id].tsx`, `app/exercise/[id].tsx` and to weight components of `formatDeltaText`/`formatSummaryLine`. Input prefills stay unit-less (`String(n)`). Chart gridlines stay numeric (metric tabs disambiguate). Fixtures re-run + typecheck clean

## 10. Amendment: concrete session summary line

- [x] 10.1 Extend `ReferenceSummary` in `types/index.ts` with `newerTop`, `olderTop`, `newerSetCount`, `olderSetCount`, `olderStartedAt` (delta fields kept for arrow tone)
- [x] 10.2 `utils/referenceSlots.ts`: `buildSummary` populates the concrete values; `formatSummaryLine` rewritten to emit `vs <date>: top set 44 lbs ×8 ↑ from 40×8 · 4 sets (was 3)` — `=` forms for unchanged top set/count; arrow tone keeps weight-up-is-a-win; units on the newer value only
- [x] 10.3 `app/session/[id].tsx`: drop the hardcoded `vs prev:` prefix (the formatter emits it)
- [x] 10.4 Update scratch fixtures to full-string summary expectations; re-run all checks; `npm run typecheck` clean; spec scenarios rephrased to concrete-value phrasing

## 11. Amendment: summary collapse and count phrasing

- [x] 11.1 `formatSummaryLine` (`utils/referenceSlots.ts`): everything matched → `vs <date>: matched last time`; count segment shown only when changed, phrased `5 sets (was 3 before)`; top-set segment always shown otherwise (`=` or concrete `↑/↓ from`); long date retained
- [x] 11.2 Fixtures updated (C collapse, E/G/H gain `before`, new N case: top changed/count same drops count segment); all checks pass; typecheck clean; spec scenarios updated
