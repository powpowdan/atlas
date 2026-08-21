## Why

All 10 destructive-action confirmations use the OS-native `Alert.alert`, which cannot be themed to the app's paper-and-ink palette, truncates long copy, renders inconsistently (a generic "Confirm" button and message-as-title in exercise manage), and falls back to raw `window.confirm` on web. Separately, SQLite foreign-key enforcement has never been enabled, so the documented cascade deletes ("deletes the session and all of its sets") silently orphan child rows instead.

## What Changes

- Add a themed in-app confirmation **bottom sheet** (generalizing the existing category-action sheet in exercise manage), driven by a module-level `confirm(): Promise<boolean>` API backed by a zustand store; a single `ConfirmSheet` component is mounted globally in `_layout.tsx`.
- Migrate all 7 confirmation-gated call sites to the themed sheet: discard session (home, session detail), delete session (history), delete routine (routines tab, routine editor), archive exercise, delete exercise.
- Replace 3 frequent small-destructive dialogs with **immediate action + undo toast**: delete set (live session), delete set (history edit), remove exercise from session (history edit). The toast offers Undo for 5 seconds; restoring re-inserts the deleted rows at their original position with original values.
- Enable `PRAGMA foreign_keys = ON` per connection so cascade deletes actually cascade, and add a one-time migration purging pre-existing orphan rows.
- Copy pass: routine-delete message split into message + muted detail line; archive/delete exercise get proper titles and verb-labeled buttons; confirmation copy verified accurate now that set/exercise removal is undoable.

## Capabilities

### New Capabilities
- `confirmations`: Themed bottom-sheet confirmation for destructive actions — app-styled, verb-labeled buttons, scrollable long copy, works identically on native and web, invokable from any screen without per-screen state.
- `undo`: Immediate deletion with a time-limited undo toast for small destructive actions (deleting a set, removing an exercise from a session), restoring deleted rows verbatim.
- `data-integrity`: Foreign-key enforcement on every connection and a one-time purge of legacy orphan rows, making documented cascade-delete behavior literally true.

### Modified Capabilities
- `sessions`: *Delete a set* (in-progress) and *Delete a set in a completed session* no longer require confirmation — they delete immediately and offer undo; removing an exercise from a completed session likewise becomes immediate-with-undo instead of confirmation-gated.

## Impact

- **Components**: new `components/ConfirmSheet.tsx`, `components/UndoToast.tsx`; both mounted in `app/_layout.tsx` after `<Stack>` inside `SQLiteProvider`.
- **Stores**: new `store/confirm.ts`, `store/undo.ts` (zustand, matching `store/activeSession.ts` pattern).
- **Data layer**: `db/client.ts` (pragma + v6 migration), `db/queries/sessions.ts` (new `restoreSet`, `restoreSessionExercise` helpers).
- **Screens**: `app/(tabs)/index.tsx`, `app/(tabs)/routines.tsx`, `app/session/[id].tsx`, `app/history/[id].tsx`, `app/exercise/manage.tsx`, `components/RoutineEditor.tsx` — all `Alert.alert` and `window.confirm`/`window.alert` usages removed.
- **Dependencies**: none added (reanimated and safe-area-context already installed).
