## 1. Data integrity: FK enforcement + orphan purge

- [x] 1.1 Add `MIGRATION_V6` to `db/client.ts` purging legacy orphans children-first (orphaned `sets`, then `session_exercises`, then `routine_exercises`), guarded by the existing `schema_version` pattern
- [x] 1.2 Enable `PRAGMA foreign_keys = ON` in `migrateDb` (`onInit`) so it applies to every connection
- [x] 1.3 Manual smoke pass on device (PowerShell-run app): create/edit/delete every entity — session start, set add/edit/delete, exercise add/remove, complete, discard, routine create/edit/delete, exercise archive/delete — verifying no FK violations and cascades actually cascade

## 2. Confirm store + sheet

- [x] 2.1 Create `store/confirm.ts`: `useConfirmStore` (request state + resolve callback) and module-level `confirm(options): Promise<boolean>`; new request while pending resolves the old one false
- [x] 2.2 Create `components/ConfirmSheet.tsx`: transparent `Modal`, flex-end anchored, reanimated slide-up (200ms `Easing.out(Easing.cubic)`) + scrim fade, `overlay` scrim tap-to-dismiss, `paper` body radius 10, title/message/muted-detail, height-capped `ScrollView` message area, verb-labeled destructive row (`oxblood`), cancel row, safe-area bottom padding
- [x] 2.3 Mount `ConfirmSheet` in `app/_layout.tsx` after `<Stack>` inside `SQLiteProvider`
- [x] 2.4 Verify on web that the sheet renders and no browser-native dialog can appear

## 3. Undo store + toast + restore helpers

- [x] 3.1 Create `store/undo.ts`: `useUndoStore` (label + restore closure) and `showUndoToast(label, restore)` with 5s auto-dismiss timer; a new call replaces the pending entry and restarts the timer
- [x] 3.2 Create `components/UndoToast.tsx`: bottom-anchored themed bar (paper/ink, verdigris Undo action), house-timing entrance/exit, safe-area aware; Undo invokes and clears the restore closure
- [x] 3.3 Mount `UndoToast` in `app/_layout.tsx` after `<Stack>` inside `SQLiteProvider`
- [x] 3.4 Add `restoreSet(db, row)` to `db/queries/sessions.ts`: re-INSERT all 7 `sets` columns verbatim
- [x] 3.5 Add `restoreSessionExercise(db, sessionExerciseRow, setRows)` to `db/queries/sessions.ts`: transactional re-INSERT of the `session_exercises` row followed by its `sets` rows, verbatim

## 4. Migrate confirmation call sites to themed sheet (7 sites)

- [x] 4.1 `app/(tabs)/index.tsx` — discard session: `confirm()` with current copy
- [x] 4.2 `app/session/[id].tsx` — discard session: `confirm()` with current copy
- [x] 4.3 `app/history/[id].tsx` — delete session: `confirm()` with current copy
- [x] 4.4 `app/(tabs)/routines.tsx` — delete routine (long-press): message split + muted detail line per design D6
- [x] 4.5 `components/RoutineEditor.tsx` — delete routine: same copy as 4.4
- [x] 4.6 `app/exercise/manage.tsx` — archive exercise: title *Archive "X"?*, message split, verb button "Archive"
- [x] 4.7 `app/exercise/manage.tsx` — delete exercise: title *Delete "X"?*, message split, verb button "Delete"; remove `confirmDiscard` helper and both web fallbacks (`window.confirm`, `window.alert` — replace the category notice `notify` path with the themed mechanism or inline feedback)

## 5. Migrate small-destructive call sites to immediate + undo (3 sites)

- [x] 5.1 `app/session/[id].tsx` — delete set: snapshot row, delete immediately, `showUndoToast('Set deleted', …)` with `restoreSet` + `refresh`
- [x] 5.2 `app/history/[id].tsx` — delete set (edit mode): same pattern with `reload`
- [x] 5.3 `app/history/[id].tsx` — remove exercise (edit mode): snapshot `session_exercises` row + its sets, delete immediately, `showUndoToast('Exercise removed', …)` with `restoreSessionExercise` + `reload`
- [x] 5.4 `components/RoutineEditor.tsx` — remove exercise from draft (✕): remove immediately from `selected`, `showUndoToast('Exercise removed', …)` re-inserting the id at its original index (functional setState, clamped index, DragList epoch bump)

## 6. Verification

- [x] 6.1 `npm run typecheck` passes
- [x] 6.2 On-device pass: each confirm sheet (theming, verb labels, long-copy scroll, scrim/cancel/back dismissal), each undo (verbatim restore at original position, 5s expiry, replace-on-rapid-delete, survives navigation)
- [x] 6.3 Confirm no `Alert.alert`, `window.confirm`, or `window.alert` remains anywhere in `app/` or `components/`
