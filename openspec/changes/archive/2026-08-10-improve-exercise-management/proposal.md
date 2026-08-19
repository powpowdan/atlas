## Why

Exercise management is functionally invisible today: the only entry point to `app/exercise/manage` is the empty-state on the Routines tab, which disappears as soon as the user creates a single routine. The manage screen itself only supports adding exercises — there is no edit and no delete. The seed library of 11 exercises thus feels like the entire universe, with no discoverable way to grow or prune it. A few smaller session-history QoL gaps (no editable note on completed sessions, no duration shown) round out the cleanup.

## What Changes

- **Discoverable entry point.** Add a "Manage" affordance to the headers of both the Sessions tab and the Routines tab, so the exercise library is reachable regardless of whether routines exist.
- **Exercise CRUD.** Add edit (rename, category, assisted toggle) and archive/restore. Archive is a soft delete: archived exercises are hidden from pickers but preserved in past sessions, the progression chart, and routine contents.
- **Migration v2.** Add `archived_at INTEGER NULL` to `exercises` (pure-additive `ALTER TABLE`).
- **Picker UX.** Extract a shared `<ExercisePickerModal>` used by both the session add-exercise modal and the routine editor. Add type-to-filter search. Add an inline "+ New exercise" affordance that opens a stacked create-modal and refreshes the picker list on dismiss.
- **Duplicate-name fix.** `createExercise` today uses `INSERT OR IGNORE` then throws a generic "Failed to create exercise" on name conflicts; replace with a clear "already exists" outcome (either return the existing row or surface a typed error).
- **Session-history QoL.** Show elapsed duration (`started_at` → `completed_at`) in the history detail view. Allow editing a completed session's note from the history detail view (same `setSessionNote` query, no schema change).

## Capabilities

### New Capabilities

- `exercises`: The exercise library — list, create, edit, archive, and restore exercises. Establishes soft-delete semantics (archived exercises hidden from pickers, preserved in history).

### Modified Capabilities

- `sessions`: The "Add a note to a session" requirement is extended to allow editing the note after the session is completed (not just while in-progress). The "View a past session" requirement is extended to include elapsed duration between start and completion.

## Impact

- Affected code: new `db/queries/exercises.ts` functions (`updateExercise`, `archiveExercise`, `restoreExercise`, extend `listExercises`, fix `createExercise`); new `components/ExercisePickerModal.tsx`; new `components/ExerciseEditorModal.tsx`; rewrite of `app/exercise/manage.tsx`; header-button additions in `app/(tabs)/index.tsx` and `app/(tabs)/routines.tsx`; refactor of the add-exercise modal in `app/session/[id].tsx`; refactor of the picker in `components/RoutineEditor.tsx`; additions to `app/history/[id].tsx` (duration display + note-edit affordance); types in `types/index.ts`.
- Schema: migration v2 adds `archived_at INTEGER NULL` to `exercises`. No data backfill, no destructive ops, reversible by dropping the column.
- No new dependencies.
- Does not touch the just-shipped progression chart or tracking queries.
