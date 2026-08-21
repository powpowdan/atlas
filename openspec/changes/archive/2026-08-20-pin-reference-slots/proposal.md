## Why

Reference slots 1–4 vanish when the last 3 qualifying sessions don't reach those positions (injury, deload, holiday). The user's core working sets (first 4) should never disappear from the reference view — they're the baseline being aimed at. Slots beyond 4 are expendable and keep current windowed behavior.

## What Changes

- Working-set positions 1–4 become **pinned**: the slot search looks back across all prior qualifying sessions (not just the 3-session ghost window), so these slots survive any number of shorter sessions.
- Slots 5+ keep the existing 3-session ghost-window expiry, unchanged.
- Pinned slots found beyond the ghost window render as ghosts with the existing `⟡ age` styling; their delta chips keep comparing against the previous occurrence of that position in any older fetched session (no suppression for age).
- The reference query fetch depth becomes unbounded (pinned positions need full history).
- No schema, type, or UI-component changes.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tracking`: "Reference set slots per exercise" requirement changes — positions 1–4 no longer expire after the ghost window; they resolve to the most recent qualifying session (at any age) that has a working set at that position. Positions 5+ behavior unchanged.

## Impact

- `utils/referenceSlots.ts` — two-tier position search in `buildReferenceBundle`; new `PINNED_SLOTS` constant; `maxSlots` computation.
- `hooks/useExerciseReference.ts` — fetch depth for `getRecentQualifyingSessions` goes from `GHOST_WINDOW + 1` to unbounded.
- `db/queries/tracking.ts` — no change (depth is already a parameter).
- Performance: per-exercise reference fetch now scans all qualifying sessions during logging; acceptable for a single-user local SQLite app, but noted in design.
- Non-goal: user-configurable pinned-slot count (planned future change).
