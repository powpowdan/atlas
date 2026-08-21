## 1. RestTimer component

- [x] 1.1 Create `components/RestTimer.tsx`: `React.memo` leaf accepting `anchorTs: number`, owning a 1 s `setInterval` in a `useEffect` keyed on `anchorTs` (with immediate `setNow` resync on anchor change), rendering a single `<Text>` with `pointerEvents="none"`
- [x] 1.2 Add the elapsed-time formatter (`m:ss` under an hour, zero-padded; `h:mm:ss` at an hour or more) and apply `type.tabular` styling to the rendered text

## 2. Session screen integration

- [x] 2.1 In `app/session/[id].tsx` `ExerciseHeader`, lay out the exercise name and a right-aligned `RestTimer` on one row (`space-between`); derive `anchorTs` from the exercise's last set (`sets[sets.length - 1].created_at`)
- [x] 2.2 Render the timer only when the session `status === 'in_progress'` and the exercise has at least one logged set
- [x] 2.3 Verify `ExerciseHeader`/parent re-renders from `refresh()` do not restart the interval (memo on stable `anchorTs` prop)

## 3. Verification

- [ ] 3.1 Typecheck (`npm run typecheck`) and verify no new lint issues in touched files
- [ ] 3.2 Manual verification on device/emulator: timer appears after first set, ticks once per second, resets on same-exercise set (warmup included), does not reset on other-exercise sets, falls back on delete of latest set, stays put on set edit, shows nothing for set-less exercises or completed sessions, and header tap near the timer still navigates to the exercise detail
