## Context

Completed sessions are view-only today (`app/history/[id].tsx` renders sets as plain
text rows), while the active-session logger (`app/session/[id].tsx`) already has the
full edit toolkit: inline set edit form, per-set delete, add-set entry, exercise
picker. The query layer (`db/queries/sessions.ts`) is status-agnostic — `updateSet`,
`deleteSet`, `addSet`, and `addExerciseToSession` work on any session row regardless
of `status`. All tracking (PRs, best sets, progression points, reference slots) is
computed live in SQL over completed sessions' sets; nothing derived is persisted, so
there is no cache to invalidate after an edit.

## Goals / Non-Goals

**Goals:**

- Give the history detail screen editing parity with the active-session logger for
  completed sessions, behind an explicit edit-mode toggle.
- Reuse the existing query functions and UI patterns verbatim where possible.

**Non-Goals:**

- Editing `started_at` / `completed_at` (duration stays derived from originals).
- Reopening a completed session into the active-session view ("un-complete").
- Delta badges, PR badges, or reference-slot comparison in the history editor —
  those are computed against "the current session" and don't apply retroactively.
- Adding exercise removal to the active-session view (separate concern if wanted).
- Undo/history of edits themselves.

## Decisions

### 1. Augment `app/history/[id].tsx` in place rather than a separate edit route

The history detail screen already owns session-scoped mutations (delete session,
edit note) and reloads via `getSession`. A separate `/history/[id]/edit` route would
duplicate that loading/refresh logic and split the note editor across screens.
Alternative considered: separate route mirroring `RoutineEditor`'s new/edit pattern —
rejected because history detail is already a mutation surface, and a toggle keeps
the read view (shared with progression-chart deep links) intact.

### 2. Edit mode as a header toggle, rendering affordances inline

A `editMode` boolean drives everything: header shows "Edit" / "Done"
(`navigation.setOptions({ headerRight })`); exercise blocks show per-set ✎/✕
buttons, "Add set" row, and "Remove exercise" action; the screen footer shows
"+ Add exercise". Read-mode rendering is unchanged. This matches the user's mental
model ("I need to fix something → enter edit mode → fix → done") and keeps
accidental-destructive-action risk behind an explicit gate, mirroring how the note
editor already works via tap affordances.

### 3. Reuse status-agnostic queries; add only `removeExerciseFromSession`

`updateSet` (patch weight/reps/is_warmup/note, read-merge-write) already preserves
`created_at`, so edited sets keep their position; `addSet` stamps `created_at = now`,
so sets added to a completed session sort last — both match the spec. The only new
query is `removeExerciseFromSession(db, sessionExerciseId)`: a single `DELETE FROM
session_exercises WHERE id = ?` — the existing `ON DELETE CASCADE` to `sets` removes
the sets. No transaction needed beyond the single statement (same shape as
`deleteSession`).

### 4. Inline set-edit form copied from the active-session pattern, not shared

The edit form (weight/reps numeric inputs, warmup switch, note input, validation
error, Save/Cancel) is modeled on `ExerciseBody`'s form in `app/session/[id].tsx`
(lines ~557–604) with its `editingSetId` + draft state machine. Extracting a shared
component is tempting, but the active-session form is interwoven with delta badges,
PR detection, and per-session reference lookups; a shared abstraction would need
prop surface for all of that now. Copy the ~50 lines; revisit extraction if a third
consumer appears. Same rationale for the add-set entry row.

### 5. Screen-local reload after each mutation

After each mutation call `reload()` (existing `getSession` re-fetch) — no optimistic
updates. Sessions are small (a handful of exercises × sets), SQLite is local, and
re-fetching guarantees the view matches derived ordering/validation state. The
history list tab already refreshes on focus, so list-level staleness is handled.

### 6. No migration, no schema change

Editing writes to existing columns only. Set ordering remains `created_at ASC`
everywhere (`getSession`), so no order-index backfill is needed for appended sets.

## Risks / Trade-offs

- [Set ordering surprises] A set added to an old session gets `created_at = now`,
  sorting it last even if the user "meant" it as set 2 → Accepted: reordering is
  out of scope; appended-last is predictable and matches the spec scenario.
- [Duplicated form code drift] The copied edit form may drift from the
  active-session form over time → Mitigation: keep the copy minimal and
  field-identical; extraction is a follow-up if drift bites.
- [Destructive actions in edit mode] Removing an exercise deletes its sets
  permanently → Mitigation: confirmation `Alert` (destructive style), consistent
  with session discard/delete; edit mode itself is an extra gate.
- [Tracking shifts after edits] PR counts/badges shown during *future* sessions are
  computed live, so editing history changes what counts as a PR → Inherent to the
  feature (same as session deletion today); documented in the spec requirement.

## Migration Plan

None required — no schema change. Rollback is reverting the code; data written by
the editor is ordinary session data.
