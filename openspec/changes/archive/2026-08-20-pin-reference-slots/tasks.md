## 1. Slot pinning logic

- [x] 1.1 In `utils/referenceSlots.ts`, add `PINNED_SLOTS = 4` export next to `GHOST_WINDOW`
- [x] 1.2 In `buildReferenceBundle`, make the per-position session scan bound two-tier: `sessions.length` for positions 1–`PINNED_SLOTS`, `GHOST_WINDOW` for positions beyond (utils/referenceSlots.ts:87-117)
- [x] 1.3 Extend `maxSlots` so pinned coverage counts: slot positions 1–4 render whenever any fetched session has a working set there, while 5+ still derive from the ghost-window max (utils/referenceSlots.ts:81-84)
- [x] 1.4 Verify `prevDelta` prev-occurrence loop (utils/referenceSlots.ts:94-100) naturally covers ancient pinned sources once the fetch is unbounded; no age-based suppression

## 2. Fetch depth

- [x] 2.1 In `hooks/useExerciseReference.ts`, change the `getRecentQualifyingSessions` depth from `GHOST_WINDOW + 1` to a large sentinel (unbounded), per design D2 (hooks/useExerciseReference.ts:47)

## 3. Verification

- [x] 3.1 Run `npm run typecheck` from WSL (safe) and confirm clean
- [ ] 3.2 Manual check from PowerShell (`npx expo start`): with seeded history where the last 3 qualifying sessions have ≤3 working sets but an older session had 4, slot 4 appears as a ghost with age label and delta; a position-5 set absent from the last 3 sessions does not appear; warmups/summary/notes render unchanged
