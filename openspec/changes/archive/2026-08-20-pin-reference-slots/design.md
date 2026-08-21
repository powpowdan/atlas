## Context

Reference slots are built in `utils/referenceSlots.ts` `buildReferenceBundle` from `QualifyingSessionSets[]` (newest-first), fetched by `hooks/useExerciseReference.ts` via `getRecentQualifyingSessions(db, exerciseId, currentSessionId, GHOST_WINDOW + 1)`. Position search is currently uniform: for each position, scan sessions `age 0..GHOST_WINDOW-1`, take the first hit; positions absent from the whole window produce no slot. `prevDelta` scans all fetched sessions (already skip-passing beyond the window by one). Ghost rendering (`slotChipGhost`, `⟡ age` label) and tap-to-copy already exist and need no changes.

## Goals / Non-Goals

**Goals:**

- Positions 1–4 resolve to the newest qualifying session at any age that has a working set at that position.
- Positions 5+ keep exact current 3-session window behavior.
- Delta chips on pinned slots compare against the previous occurrence in any older fetched session, regardless of age.

**Non-Goals:**

- User-configurable pin count or window size (future change).
- Any schema, type, or UI-component changes.
- Changing warmup handling (newest-session display-only, unchanged).

## Decisions

### D1: Two-tier search depth inside `buildReferenceBundle`

Add `PINNED_SLOTS = 4` alongside `GHOST_WINDOW`. In the position loop, the per-position session scan bound becomes `pos <= PINNED_SLOTS ? sessions.length : GHOST_WINDOW`. `maxSlots` becomes the max working-set count across ALL fetched sessions capped naturally: positions 1–4 always covered by the unbounded scan; positions beyond 4 still derive from `max(...workingAll.slice(0, GHOST_WINDOW))`.

- Alternative: fetch depth as SQL `LIMIT` per tier (two queries). Rejected — one fetch keeps ordering/consistency in a single pass and the data volume is tiny for a single-user local DB.

### D2: Unbounded fetch via large limit, not schema of the query

`getRecentQualifyingSessions` keeps its `n` parameter; the hook passes a large sentinel (e.g. `Number.MAX_SAFE_INTEGER` or 1000) instead of `GHOST_WINDOW + 1`. `ORDER BY started_at DESC LIMIT ?` with a huge n is effectively unbounded while keeping the query shape unchanged.

- Alternative: remove the LIMIT clause. Rejected — `LIMIT ?` with a param is already there; changing the signature/SQL for "all" adds a branch for no gain.

### D3: `prevDelta` search already scans all fetched sessions — leave as-is

The existing prev-occurrence loop (utils/referenceSlots.ts:94-100) iterates `older = age+1 .. sessions.length-1`, which with the unbounded fetch now covers the full history. Ancient pinned slots keep their delta automatically. No suppression-by-age: the user confirmed comparisons should persist (the `⟡ 2mo ago` label already signals staleness).

### D4: `summary`, warmups, notes unchanged

They derive from `sessions[0]` / `sessions[1]` only; deeper fetch does not alter them.

## Risks / Trade-offs

- [Per-exercise reference fetch now loads all qualifying sessions' sets during logging] → Acceptable for single-user local SQLite (hundreds of sessions, small rows); the fetch runs per refresh key, same as today. If it ever matters, a SQL-side per-position search can replace D2 without spec changes.
- [Slot 4 lingers indefinitely after a deliberate program change to 3 sets] → Accepted by design (immortal 1–4); the age label communicates staleness. User-configurable options are a planned future change.
- [`formatAgeLabel` shows coarse "Nmo ago" for very old slots] → Existing behavior, adequate; no new granularity added.
