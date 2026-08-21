## 1. Data layer

- [x] 1.1 Add `removeExerciseFromSession(db, sessionExerciseId)` to `db/queries/sessions.ts` — single `DELETE FROM session_exercises WHERE id = ?` (cascade removes its sets), modeled on `deleteSession`

## 2. History detail — edit mode foundation

- [x] 2.1 Add `editMode` state to `app/history/[id].tsx` with an Edit/Done toggle in the stack header via `navigation.setOptions({ headerRight })`; exiting edit mode leaves the current (reloaded) data visible
- [x] 2.2 In edit mode, render per-set ✎ edit and ✕ delete icon buttons on each set row (styles from the active-session screen); read mode rendering unchanged

## 3. Set editing

- [x] 3.1 Inline set-edit form (weight/reps numeric TextInputs, warmup Switch, note TextInput, validation error text, Save/Cancel) modeled on `ExerciseBody` in `app/session/[id].tsx` (~lines 557–604), driven by an `editingSetId` + draft state machine
- [x] 3.2 Save path calls `updateSet` (weight/reps/warmup/note patch), rejects when both weight and reps are empty, then `reload()`; verify edited set keeps its original position
- [x] 3.3 Delete path calls `deleteSet` behind a confirmation Alert, then `reload()`

## 4. Add set / add exercise / remove exercise

- [x] 4.1 Per-exercise "Add set" entry row in edit mode, calling `addSet` with the same validation, then `reload()`; new set appears after existing sets
- [x] 4.2 "Remove exercise" action per exercise block in edit mode, confirmation Alert (destructive style), calls `removeExerciseFromSession`, then `reload()`
- [x] 4.3 "+ Add exercise" affordance in edit mode opening the existing `ExercisePickerModal` (pass `excludeIds` of exercises already in the session); on select call `addExerciseToSession`, then `reload()`

## 5. Verification

- [x] 5.1 Run `npm run typecheck` (WSL-safe) and fix any errors
- [x] 5.2 Manual verification in PowerShell-run app: enter/exit edit mode; edit a set's weight/reps/warmup/note and confirm position preserved; invalid set rejected; delete set with confirm; add set appends last; remove exercise with confirm; add exercise appears at end; edited values reflected in exercise detail (best/last) and progression chart
