## Why

Once a session is completed, any logging mistake (wrong weight, typo'd reps, a set
logged against the wrong exercise) is permanently baked into history. The only options
today are to live with wrong data — which corrupts PRs, progression charts, and
"last time" references — or delete the whole session and re-log it from memory. Users
need to correct mistakes in place.

## What Changes

- Add an edit mode to the history detail screen (`app/history/[id].tsx`) that gives
  completed sessions full editing parity with the active-session logger:
  - Edit an existing set's weight, reps, warmup flag, and note
  - Delete a set
  - Add a set to an existing exercise
  - Add an exercise to the session (via the existing exercise picker)
  - Remove an exercise and all of its sets from the session
- Edit mode is opt-in via a header toggle; the default view remains read-only.
- Because all tracking (PRs, best sets, progression points, reference slots) is
  computed live from the `sets` table over completed sessions, history edits
  propagate automatically — no migration or invalidation layer needed.
- One new query: `removeExerciseFromSession` (exercise removal does not exist
  anywhere today, including the active-session view).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `sessions`: New requirements covering editing a completed session from history
  (edit-mode gating, edit set, delete set, add set, add exercise, remove exercise,
  and tracking recomputation). The existing "Mark a session complete" requirement
  already scopes non-editability to the active-session view, so existing
  requirements are unchanged — the delta is purely additive.

## Impact

- **Code**:
  - `app/history/[id].tsx` — edit-mode toggle, per-set edit/delete UI, add-set form,
    add/remove-exercise affordances (reuses patterns and `ExercisePickerModal`)
  - `db/queries/sessions.ts` — new `removeExerciseFromSession`; reuses existing
    status-agnostic `updateSet`, `deleteSet`, `addSet`, `addExerciseToSession`
- **Data**: No schema migration. `updateSet` preserves `created_at`, so edited sets
  keep their position; sets added later sort last.
- **Specs**: `openspec/specs/sessions/spec.md` amended via delta.
- **Out of scope**: editing `started_at`/`completed_at`, reopening a completed
  session into the active-session view, delta/PR badges in the history editor.
