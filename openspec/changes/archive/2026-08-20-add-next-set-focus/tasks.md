## 1. Derivations in ExerciseBody

- [x] 1.1 Compute `nextSetNumber = workingIndexById.size + 1` and `lastSessionSetCount = bundle.slots.filter((s) => !s.isGhost).length` in `ExerciseBody` (`app/session/[id].tsx`)
- [x] 1.2 Derive the label variant: `hasHistory && nextSetNumber <= lastSessionSetCount` → `Set N of Y`; `hasHistory` and beyond → `Set N — beyond last time`; no history → `Set N`

## 2. Chip cursor styling

- [x] 2.1 Add `slotChipDone` (opacity ~0.5) and `slotChipFocus` (ink border, paperDeep background) styles, plus bold-text variant for the focused chip's main label
- [x] 2.2 Apply to slot chips by position: below `nextSetNumber` → done, equal → focus; verify ghost styling (dashed border, age label) composes with both and warmup chips are untouched
- [x] 2.3 Confirm tap-to-copy still works on dimmed and focused chips

## 3. Count label

- [x] 3.1 Render the count label line (~12px, `textTertiary`) directly above `setEntryRow` in `ExerciseBody`

## 4. Verification

- [x] 4.1 `npm run typecheck` passes (WSL-safe)
- [x] 4.2 Manual pass on device/emulator (user, PowerShell): cursor advances after each add; editing a set does not move it; ghost-slot position 4 focuses with dashed styling intact; `Set 4 — beyond last time` shown when ghost slot 4 exists but Y=3; warmup logging leaves label unchanged; no-history exercise shows `Set N`
