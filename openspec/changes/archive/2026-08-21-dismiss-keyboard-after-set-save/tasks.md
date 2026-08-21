## 1. Active session screen

- [x] 1.1 In `app/session/[id].tsx` `ExerciseBody.saveSet()`, call `Keyboard.dismiss()` on the success path (after the awaited `addSet`/`updateSet`, alongside the carry-forward state updates); leave the validation-failure `return` path untouched
- [x] 1.2 Add `keyboardDismissMode="on-drag"` to the session `SectionList`

## 2. History editor

- [x] 2.1 In `app/history/[id].tsx` `saveForm()`, call `Keyboard.dismiss()` on the success path (after the awaited `addSet`/`updateSet`); leave the validation-failure `return` path untouched

## 3. Verification

- [x] 3.1 Run `npm run typecheck` from WSL and confirm it passes
- [x] 3.2 Manual verification in the PowerShell-run app: with the keyboard open, tap Add set on a valid set and confirm the keyboard closes and the footer (Complete session / Discard) reappears
- [x] 3.3 Manual verification: save via the reps keyboard "done" key and confirm the set saves and the keyboard closes
- [x] 3.4 Manual verification: attempt a save with empty weight/reps and confirm the validation error shows and the keyboard stays open
- [x] 3.5 Manual verification: after dismissal, confirm the weight/reps inputs still carry forward the just-saved values, and that tapping either input reopens the keyboard
- [x] 3.6 Manual verification: edit an existing set (✎ → Update set) on the active screen, and add/update a set in a completed session's history editor, confirming the keyboard closes after each save
- [x] 3.7 Manual verification: with the keyboard open, scroll the exercise list and confirm the keyboard dismisses on drag
