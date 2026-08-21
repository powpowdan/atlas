## Why

After logging a set, the on-screen keyboard stays up because focus silently remains in the weight/reps/note input. While the keyboard is up, the session footer (Complete session / Discard) is hidden, the rest timer is harder to glance at, and the user must tap elsewhere or swipe to dismiss it manually before reviewing deltas and PR badges. Saving a set is a natural commit point — the keyboard has done its job and should get out of the way.

## What Changes

- After a **successful** set save on the active session screen (`Add set` button, `Update set` button, or the reps `done` return key), the keyboard dismisses automatically.
- The same dismissal applies to the history editor's set form (`saveForm`) after a successful add or update.
- Validation failures keep the keyboard open so the user can fix the input in place.
- Carry-forward prefill (weight/reps prefilled from the just-added set) is unaffected — it lives in state, not focus.
- Minor complement: the session list dismisses the keyboard on drag so scrolling to review logged sets also closes it.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `sessions`: adds a requirement that the keyboard dismisses after a successful set save on both the active session screen and the history editor, while preserving keyboard behavior on validation failure and during input.

## Impact

- `app/session/[id].tsx` — `ExerciseBody.saveSet()` success path gains `Keyboard.dismiss()`; `SectionList` gains `keyboardDismissMode="on-drag"`.
- `app/history/[id].tsx` — `saveForm()` success path gains `Keyboard.dismiss()`.
- No schema, query, or navigation changes. No new dependencies.
