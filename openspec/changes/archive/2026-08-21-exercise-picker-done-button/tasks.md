## 1. Picker header changes

- [x] 1.1 In `components/ExercisePickerModal.tsx`: remove `handleManage`, the "Manage" `Pressable` in the header, the `modalManage` style, and the now-unused `useRouter` import
- [x] 1.2 Change the left header button label to derive from the mode: "Done" when `autoCloseOnSelect` is false, "Cancel" otherwise (behavior unchanged — both call `onClose`)

## 2. Verification

- [x] 2.1 Run `npm run typecheck` from WSL and confirm it passes
- [x] 2.2 Manual check (PowerShell, user-run): routine editor picker shows "Done" + "+ New" only, picks survive exit via Done and via Android back gesture; session and history pickers still show "Cancel"; Routines tab "Exercise library" strip still opens the manage screen
