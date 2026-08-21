## Context

See proposal.md - Why. Three inputs can hold focus on the session screen's set-entry form (weight, reps, set note), and the reps input's `returnKeyType="done"` already routes through the same save handler as the buttons, so a single dismissal point covers all entry gestures. Both save paths are async functions that validate before persisting: `ExerciseBody.saveSet()` in `app/session/[id].tsx` and `saveForm()` in `app/history/[id].tsx`. No `Keyboard` API usage exists in the codebase today. The existing "Keyboard does not obscure set entry" requirement already guarantees first-press taps work while the keyboard is up (`keyboardShouldPersistTaps="handled"`), so dismissal is purely a post-save concern.

## Goals / Non-Goals

**Goals:**

- Dismiss the keyboard after every successful set save on both screens.
- Preserve validation-failure behavior (keyboard stays so the user fixes input in place).
- Keep carry-forward prefill intact.

**Non-Goals:**

- No changes to keyboard avoidance, input focus order, or persist-tap behavior.
- No new components or abstractions — this is a behavior tweak inside existing handlers.
- Not addressing other screens' keyboards (routine editor, exercise editor) — no reported pain there.

## Decisions

### Decision 1: Global `Keyboard.dismiss()` instead of `blur()` on a specific ref

Call `Keyboard.dismiss()` in the success branch of each save handler, after the DB write and before/alongside the carry-forward state updates.

- **Why:** Any of the three inputs (weight, reps, note) may hold focus; `weightRef.current?.blur()` only covers one. `Keyboard.dismiss()` is input-agnostic and is the canonical React Native API for this.
- **Alternative:** Track a focused-input ref and blur it. More state, no benefit.

### Decision 2: Dismiss only on the success path

The call sits after the `await addSet(...)`/`await updateSet(...)` inside the existing `try`, so validation failures (which `return` before the `try`) never dismiss.

- **Why:** On failure the user must edit the offending input; keeping the keyboard open avoids a refocus tap.
- **Alternative:** Dismiss at handler entry and refocus on failure — worse UX and more code.

### Decision 3: Reps "done" key shares the dismissal

`onSubmitEditing={() => saveSet()}` needs no change; the dismissal inside `saveSet()` covers it.

- **Why:** One code path, consistent behavior whether the user taps the button or the keyboard action.

### Decision 4: `keyboardDismissMode="on-drag"` on the session SectionList

- **Why:** Complements Decision 1 — scrolling to review logged sets is the other natural "I'm done entering" gesture. `interactive` was considered but `on-drag` is simpler and predictable cross-platform.
- **Alternative:** Leave drag behavior unchanged. Acceptable, but the drag-dismiss pattern is standard and the spec scenario covers it.

## Risks / Trade-offs

- [Users who chain sets keyboard-only (done → immediately retype reps) lose the persistent keyboard] → Carry-forward prefills identical values, so the common case needs zero typing; tapping an input reopens instantly. Rest periods between sets make rapid chaining rare.
- [`Keyboard.dismiss()` on Android occasionally animates from the wrong inset when called during a layout pass] → Called after the awaited DB write, so it lands in a stable frame; the existing `keyboardDidShow/Hide` listeners already handle footer re-layout (session screen only).
- [Dismissal fires before `onChanged()`/`reload()` re-render, briefly exposing the footer under the shrinking keyboard] → Existing `keyboardHeight` state drives footer visibility and already animates on every other dismissal path; no new handling needed.

## Migration Plan

Pure UI change, no data or schema impact. Rollback is deleting two lines and one prop.
