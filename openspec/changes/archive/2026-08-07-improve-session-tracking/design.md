## Context

Builds on the MVP data model (`db/schema.ts`): `sessions → session_exercises → sets`, with `ON DELETE CASCADE` from `sessions` down to `sets`, and indexes `idx_session_exercises_exercise_id`, `idx_sets_session_exercise_warmup`, `idx_sessions_started_at`. Tracking today lives in `db/queries/tracking.ts` (`getBestSet`, `getLastSet`) consumed by `hooks/useExerciseBestLast.ts`, rendered as two pills in `app/session/[id].tsx`. There is no `deleteSession` query and no destructive action on the session screen beyond per-set delete. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Replace the single computed "last" set with the full prior-session set list using only SQL against existing indexes (no schema change, no migration).
- Add a second tracking axis (most reps) at the same cost as the existing best query.
- Make session lifecycle reversible without adding soft-delete/undo machinery.
- Reduce per-set entry taps via carry-forward and tap-to-copy.

**Non-Goals:**
- No schema migration — rely entirely on existing tables, cascades, and indexes.
- No soft-delete or undo trash; deletion is hard, gated by a confirm step.
- No progression charts, rest timer, kg/lb units, or editing of completed sessions.
- No change to the `best (heaviest)` query or the `routines` capability.

## Decisions

### Decision 1: Last = full ordered set list, completed sessions only

`getLastSet` is replaced by `getLastSessionSets(exerciseId, currentSessionId)`, resolved in two steps so each step uses an existing index:

```sql
-- Step 1: the most recent PRIOR session for this exercise
SELECT sess.id
FROM sessions sess
JOIN session_exercises se ON se.session_id = sess.id
WHERE se.exercise_id = ?
  AND sess.status = 'complete'
  AND sess.id <> COALESCE(?, '00000000-0000-0000-0000-000000000000')
ORDER BY sess.started_at DESC
LIMIT 1;

-- Step 2: that session's sets for this exercise, in entry order
SELECT s.id, s.weight, s.reps, s.is_warmup, s.created_at, sess.started_at
FROM sets s
JOIN session_exercises se ON s.session_exercise_id = se.id
JOIN sessions sess ON sess.id = se.session_id
WHERE se.exercise_id = ? AND sess.id = ?
ORDER BY s.created_at ASC;
```

**Why completed-only:** "last time I worked out" means a finished workout. An abandoned `in_progress` orphan (the bug this change also fixes via discard) would otherwise leak partial sets into "last." Even after discard cleans orphans up, restricting to `complete` is the robust semantic and costs nothing.

**Why two steps over a window-function one-shot:** readability and direct use of the existing `sessions(started_at)` and `session_exercises(exercise_id)` indexes. The dataset is single-user (thousands of rows); two trivial indexed queries are not a concern.

The hook returns the list as-is; the UI renders working sets prominently and warmups (`is_warmup = 1`) dimmed. Both come from the same query, so warmups are visible but de-emphasized (spec requirement).

### Decision 2: Most-reps is a sibling query to best

`getMostRepsSet(exerciseId)` mirrors `getBestSet` with the order keys swapped. `getBestSet` is unchanged (heaviest = `weight DESC, reps DESC`).

```sql
SELECT s.id, s.weight, s.reps, s.created_at, NULL AS started_at
FROM sets s
JOIN session_exercises se ON s.session_exercise_id = se.id
WHERE se.exercise_id = ? AND s.is_warmup = 0
ORDER BY s.reps DESC, s.weight DESC, s.created_at ASC
LIMIT 1;
```

The hook (`useExerciseBestLast`) widens its return from `{ best, last }` to `{ heaviest, mostReps, lastSets }`. `best` is renamed `heaviest` in the return shape; consumers (the session screen) update accordingly. `lastSets` replaces the single `last`.

### Decision 3: Tap-to-copy writes into the entry fields

A `Pressable` per row in the last-session list calls `setWeight(String(set.weight))` and `setReps(String(set.reps))` on the `ExerciseBlock`'s form state — the same state the keyboard writes to. This reuses the existing save path (no new code path for "copied" sets) and lets the user tweak before saving. Carry-forward (Decision 4) does not override non-empty fields, so a tap takes precedence until the user clears or saves.

### Decision 4: Full carry-forward, precedence edit-mode > carry-forward > empty

After a successful `addSet` (and on initial mount when the form is empty and the exercise already has sets), set the weight and reps inputs to the **most recent set of this session exercise** (`ORDER BY created_at DESC LIMIT 1`). Rules:

- Only in "add" mode — when `editingSet` is non-null (editing an existing set), never override; the edit flow loads that set's own values.
- Only when the form is empty — so a tap-to-copy value (Decision 3) or manual typing is preserved; carry-forward fills the quiet case, not the active case.
- First set of an exercise (no prior sets today) has nothing to carry: the form stays empty and the user either types or taps from the last-session list.

**Why carry weight AND reps (not weight only):** the user's confirmed preference. Their drop-set pattern means reps sometimes repeat across the dropped plateau and sometimes climb; carrying both and letting them edit is the agreed behavior. The empty-form guard means a tap-to-copy from last session is never clobbered.

### Decision 5: deleteSession relies on the existing cascade

```ts
export async function deleteSession(db, id) {
  await db.runAsync(`DELETE FROM sessions WHERE id = ?;`, id);
}
```

`session_exercises.session_id` is `ON DELETE CASCADE`, and `sets.session_exercise_id` is `ON DELETE CASCADE`, so one statement removes the whole tree. The caller clears `activeSessionId` (Zustand) when the deleted session is the active one; the query layer stays unaware of client state. Tracking needs no cache invalidation — `useExerciseBestLast` re-queries on `refreshKey`, which the caller bumps after any mutation.

### Decision 6: Discard vs delete placement

- **Active session** (`app/session/[id].tsx` footer): add a secondary, destructive "Discard session" action next to "Complete session", gated by an `Alert.alert` (the same confirm pattern already used for deleting a set in this file). On confirm: `deleteSession` → if `id === activeSessionId`, `clearActiveSession()` → `router.back()` (or replace to `(tabs)/index`).
- **Completed session** (`app/history/[id].tsx`): add a "Delete" action in the header (or footer), same `Alert` confirm. On confirm: `deleteSession` → `router.back()` to the history list.

No guard is added against having multiple `in_progress` sessions: with discard available, the orphan-resurrection bug (Decision 1's `completed-only` filter also neutralizes it for tracking) is handled by letting the user clean up. The Sessions tab continues to surface the most recent `in_progress`; that is acceptable.

### Decision 7: Seed Day 1 / Day 2 as routines

Extend the seed step to also create two routines, guarded by `SELECT COUNT(*) FROM routines = 0` (mirroring the existing `exercises` seed guard). Composition, in order, matched to `seed/exercises.json` names:

- **Day 1**: Bench, Fly, Ab crunch, Paloff press, Face pull, Tri pulldown, Bi
- **Day 2**: Pulldown, Seated row, Assisted, Shoulder press

Seed inserts the routines and their `routine_exercises` rows (with `order_index`) inside a transaction, resolving exercise names → ids by name lookup against the already-seeded `exercises` table. Re-running on a device that already has routines is a no-op.

### Decision 8: Polish — focus chain and weight formatting

- `autoFocus` on the weight input when an `ExerciseBlock` mounts; `returnKeyType="next"` with ref forwarding weight → reps → Add. Reduces keyboard churn for the 4-set flow.
- A `formatWeight(n)` helper returns `String(n)` when `Number.isInteger(n)`, else `String(n)`; applied in set rows and the tracking pills so whole-number REAL weights never render as `40.0`. (Stored REAL is already fine; this is display-only.)

## Risks / Trade-offs

- **[Carry-forward surprises the user]** After saving set N, set N+1 silently inherits N's values; a user who intends a fresh entry must clear. → Mitigated by: only filling when the form is empty (a manual edit or tap-to-copy is preserved), and by the confirm-on-save validation that already rejects empty weight/reps. If it annoys in practice, narrowing to weight-only is a one-line change (Decision 4).
- **[Hard delete is irreversible]** Discarding or deleting removes sets permanently; a mis-tap loses history. → Mitigated by mandatory `Alert` confirmation. No undo is intentional (Non-Goal); single-user local data has no backup to restore from.
- **[Best/last query cost on large history]** As sessions accumulate, the best/most-reps scans grow. → Already addressed by existing indexes; adequate for single-user scale. No materialized "PR" table is introduced now; revisit only if perf is observed.
- **[Seed name drift]** If `seed/exercises.json` names change, the routine seed's name→id lookup breaks silently (routine created missing exercises). → Mitigate by seeding routines in the same transaction/module that seeds exercises and asserting each name resolves; log unresolved names.
- **[Most-reps ties on assisted exercises]** Assisted exercises (e.g. "Assisted") ignore the `is_assisted` flag in math (per MVP design); most-reps treats them like any other. Acceptable and consistent with the heaviest rule.

## Migration Plan

No data migration. Rollout is purely code:

1. Ship new query functions and the widened hook return shape.
2. Update the session and history screens to consume the new shape and add discard/delete.
3. Seed routines on next first-run-of-empty-`routines` launch.

Rollback: revert the code; existing rows are unaffected (no schema change). Already-seeded routines remain (harmless; user can delete them via the existing routine delete).

## Open Questions

- Should the last-session list cap at the most recent prior session, or also offer a "load an older session" affordance? Deferred — the spec requires only the most recent; an older-session picker is a natural follow-up if the user wants to compare further back.
