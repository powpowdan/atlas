## Context

The exercise library today is a thin seed-on-first-run table (`seed/exercises.json`, 11 rows) plus an add-only manage screen at `app/exercise/manage.tsx`. The manage screen is reachable only from the routines empty-state, which disappears as soon as a single routine exists. `createExercise` uses `INSERT OR IGNORE` and throws a generic error on duplicate names. There is no edit and no delete of any kind.

Sessions are similarly thin on QoL: notes are editable only while in-progress (the affordance lives in `app/session/[id].tsx`), and the history detail view at `app/history/[id].tsx` shows start/completion dates but not the elapsed duration.

`PRAGMA foreign_keys` is never set, so SQLite treats FK declarations as advisory. Hard-deleting an exercise today would silently orphan `session_exercises` and `routine_exercises` rows (the JOIN to `exercises` returns nothing for old data). The just-shipped progression chart reads those JOINs, so any hard-delete would corrupt its display.

See `proposal.md` for motivation; this document covers how.

## Goals / Non-Goals

**Goals:**

- Make exercise management reachable from anywhere exercises are picked (Sessions + Routines tabs).
- Add edit, archive, and restore with soft-delete semantics that preserve history.
- Fix the duplicate-name UX so users get a clear error instead of "Failed to create exercise."
- Extract a shared exercise-picker modal with search and inline-create, used by both the session add-exercise flow and the routine editor.
- Show session duration and allow note editing on completed sessions.

**Non-Goals:**

- No hard-delete of exercises (archive only).
- No FK enforcement change (`PRAGMA foreign_keys` stays default); soft-delete makes the absence of enforcement safe.
- No historical rename tracking. Past sessions display the current exercise name.
- No category CRUD, no tag system, no exercise grouping beyond the existing free-text `category` field.
- No reordering of exercises inside an in-progress session (deferred — was on the optional list).
- No fix to the parked web-`Alert.alert` bug (explicitly excluded from this batch).
- No new dependencies.

## Decisions

### Decision: Soft-delete (archive) over hard-delete

Hard-deleting an exercise orphans historical rows. The progression chart, past session detail views, and routine contents all JOIN to `exercises` for the display name; orphaning would make those rows show blank or fail to resolve. Soft-delete via an `archived_at` timestamp preserves referential integrity while hiding archived exercises from pickers for new work.

Archived exercises remain visible in:
- Past session detail (`getSession` JOINs exercises by id; archived rows still resolve)
- The progression chart (`getExerciseProgress` JOINs exercises by id)
- Routine contents (`getRoutine` and the routine editor's selected list)
- The manage screen's "Archived" section, with a Restore affordance

Archived exercises are excluded from:
- All pickers for new work (session add-exercise modal, routine editor's picker)

Alternatives considered: hard-delete with cascade (loses history — rejected); hard-delete if unreferenced with a pre-flight check (frustrating — a single old routine blocks deletion); explicit merge/reassign (complex, deferred).

### Decision: Pure-additive v2 migration

Migration v2 is a single statement: `ALTER TABLE exercises ADD COLUMN archived_at INTEGER NULL;`. No data backfill (NULL means "active"), no destructive ops, no new indexes (filtering on `archived_at IS NULL` over a small table doesn't need one). The migration is reversible by dropping the column if needed.

The existing migration runner in `db/client.ts` already closes over `INITIAL_VERSION = 1`; this change introduces `MIGRATION_V2 = 2` as a parallel entry in the same pattern. Each migration step is wrapped in `withTransactionAsync`, so a partial failure rolls back.

### Decision: `listExercises` gains an `includeArchived` parameter

The query today is `SELECT ... FROM exercises ORDER BY name ASC`. The new default adds `WHERE archived_at IS NULL`; passing `{ includeArchived: true }` removes the filter. All picker call sites use the default; only the manage screen uses `includeArchived: true`.

### Decision: Name uniqueness is case-insensitive, enforced in SQL

The `exercises.name` column has `UNIQUE` today, but SQLite's default collation is case-sensitive. We enforce case-insensitive uniqueness at query time: `createExercise` and `updateExercise` both pre-check by selecting `WHERE LOWER(name) = LOWER(?) AND id <> ?`. The check happens inside the same transaction as the write to close the race window for the (unlikely in a single-user app) collision.

`createExercise` returns the existing exercise row when a case-insensitive collision occurs on a "create" attempt, OR throws a typed `DuplicateExerciseError` — pick one and apply consistently. Preferred: throw `DuplicateExerciseError` so the UI can show "an exercise with this name already exists" rather than silently returning a row the user didn't ask to create. The current `INSERT OR IGNORE` + generic-throw behavior is replaced.

### Decision: Edit applies in place; no rename history

`updateExercise` issues `UPDATE exercises SET name = ?, category = ?, is_assisted = ? WHERE id = ?`. Past sessions reflect the new name on next read via the existing JOIN. This is intentional for a personal tracker: the user is renaming *the exercise*, not creating a variant. Historical rename tracking would add complexity (a names table, time-ranged JOINs) for no real benefit at single-user scale.

### Decision: Extract `<ExercisePickerModal>` and `<ExerciseEditorModal>` as shared components

Today, the session's add-exercise modal and the routine editor's picker duplicate the same list-and-pick UX with subtle differences. This change extracts a single `components/ExercisePickerModal.tsx` that both screens use. Its props:

```
ExercisePickerModal:
  visible: boolean
  excludeIds?: string[]              // hide already-selected (routine editor)
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  // Renders its own search input and "+ New exercise" affordance.
  // On "+ New" tap, opens a stacked ExerciseEditorModal in create mode.
  // On successful create, refreshes its own list and calls onSelect with the new row.
```

```
ExerciseEditorModal:
  visible: boolean
  exercise?: Exercise                // omit for create mode
  onSave: (input: { name, category, is_assisted }) => Promise<void>
  onClose: () => void
  // Handles duplicate-name error display.
```

Both the routine editor and the session add-exercise flow are migrated to use these. The `app/exercise/manage.tsx` screen also uses `ExerciseEditorModal` for its create/edit affordances.

### Decision: Search is client-side substring filter

The picker loads the full active-exercise list once and filters in-memory as the user types. Adequate at personal scale (hundreds of exercises max). SQL-side `LIKE` filtering is a deferred optimization if performance ever matters.

### Decision: Duration is computed, not stored

`completed_at - started_at` is computed in the view layer and formatted as `Xh Ym` (≥1h) or `Xm` (sub-hour). No schema change; both timestamps already exist. In-progress sessions show no duration.

### Decision: Completed-session note edit reuses `setSessionNote`

The existing `setSessionNote` query works regardless of session status — the only gap is the UI affordance, which lives exclusively in `app/session/[id].tsx` today. This change adds a parallel affordance to `app/history/[id].tsx` (a small "Edit note" button + modal) that calls the same query. The completed session is reloaded after save to reflect the change.

## Risks / Trade-offs

- **Stacked modals on low-end Android.** Three deep (`session → picker → editor`) can stress modal memory. → Mitigation: keep `ExerciseEditorModal` lightweight (3 inputs, no scroll). The pattern is well-trodden in React Native.
- **No FK enforcement means archive must be checked at query time.** → Mitigation: every picker query path goes through `listExercises` which adds the filter; no ad-hoc `SELECT FROM exercises` elsewhere. Document this convention in code comments.
- **Case-insensitive uniqueness pre-check has a TOCTOU window.** → Mitigation: pre-check and write are inside the same `withTransactionAsync`; SQLite serializes writers. In a single-user app this is more than sufficient.
- **Editing a routine's existing exercise list now flows through shared components.** → Mitigation: the routine editor's "exclude already-selected" use case is covered by `ExercisePickerModal`'s `excludeIds` prop; verify this works correctly during implementation.
- **Archived exercises in routines.** A routine that contains an archived exercise will still pre-populate sessions started from it. This is intentional (the routine was built when the exercise was active), but could surprise users. → Mitigation: archive is the user's explicit action; the routine editor shows archived exercises in the routine's selected list with a "restore" affordance next to them, so the state is visible.

## Migration Plan

Migration v2 is applied automatically on next app launch by the existing `migrateDb` runner. No user action required. Pure-additive `ALTER TABLE ADD COLUMN` is safe against any prior DB state. Rollback (if ever needed) is `ALTER TABLE exercises DROP COLUMN archived_at;` (SQLite 3.35+, well within expo-sqlite's bundled version).
