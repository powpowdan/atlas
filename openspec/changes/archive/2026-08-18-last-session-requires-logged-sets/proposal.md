## Why

When a user skips an exercise in a session (it was pre-populated from a routine but no sets were logged), the "Last session" reference for that exercise shows nothing in the next workout. The lookup currently treats a session as "containing" the exercise as long as a `session_exercises` row exists, even with zero logged sets. The user wants to always see the most recent workout where they actually performed the exercise, so they can beat their last numbers.

## What Changes

- The "last session" lookup for an exercise will pass over sessions that have no logged **working** sets for it, walking backward until it finds the most recent session that does.
- Sessions with only warmup sets for the exercise also do not qualify as "the last time I did it"; a working set is required.
- Once a qualifying session is selected, the displayed set list is unchanged — it still shows all sets from that session, with warmups de-emphasized as today.
- The all-time "Heaviest" and "Most reps" pills are unaffected (they already scan all sets directly).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tracking`: The "Last set per exercise" requirement changes how the reference session is selected — it must be the most recent prior session with at least one logged working set for the exercise, not merely a session that lists the exercise.

## Impact

- Affected code: `db/queries/tracking.ts` (`getLastSessionSets`) — the session-selection subquery gains a working-set existence condition.
- No schema or index changes; existing indexes cover the new condition.
- No UI or type changes; the existing empty / "first time" states remain accurate.
- The `tracking` spec's "Last set per exercise" requirement is tightened with selection scenarios for skipped exercises and warmup-only sessions.
