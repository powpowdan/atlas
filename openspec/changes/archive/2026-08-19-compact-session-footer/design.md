## Context

`app/session/[id].tsx` wraps header/list/footer in a `KeyboardAvoidingView`
(KAV, `behavior="padding"` per the un-archived `fix-android-keyboard` change).
The footer currently stacks two full-width buttons (~128px + padding) and stays
mounted while the keyboard is open, so on the last exercise the note input and
Add set button are pushed off-screen. The user also reports residual blank
space below the footer after the keyboard dismisses on Android (edge-to-edge,
RN 0.81). Expo Go constrains us to no native modules (no
`react-native-keyboard-controller`).

## Goals / Non-Goals

**Goals:**

- On the bottom-most exercise with the keyboard open: note input + Add set
  visible and tappable without scrolling.
- Footer footprint when idle: one row (~66px), safe-area aware.
- No residual gap after keyboard dismiss.

**Non-Goals:**

- Other screens (routine editor, modals) — same policy as
  `fix-android-keyboard`.
- Keyboard toolbars/accessory views.
- Changing complete/discard semantics (confirm flows, navigation).

## Decisions

### D1: Footer = single row, always

`flexDirection: 'row'`, `gap: 8`, `padding: 12` + `insets.bottom`. Complete =
`flex: 2` filled verdigris primary; Discard = `flex: 1` transparent with
oxblood border + text (border needed so it reads as tappable at reduced width).
Alternatives: keeping stacked buttons (rejected — still ~60px wasted); moving
Discard into an overflow menu (rejected — extra tap for a confirm-gated action
that already has a destructive-confirm safeguard).

### D2: Hide footer while keyboard open

Track keyboard visibility with `Keyboard.addListener`
(`keyboardWillShow/WillHide` on iOS, `keyboardDidShow/DidHide` on Android —
Android has no reliable Will events) in a `keyboardVisible` state; conditionally
render the footer. Alternatives: animating footer height to 0 (rejected — extra
complexity for a transition KAV already animates); keeping the footer visible
above the keyboard (the previously accepted trade-off — rejected now that the
last-exercise Add set path is the pain point).

Note: while hidden, `KeyboardAvoidingView` padding still applies to the screen
bottom; the list gains exactly the footer's height, which is what makes the
full set-entry form visible on the last exercise.

### D3: Residual-gap fix — verify KAV reset, fallback to explicit padding

Suspected cause: KAV padding reset interacting with edge-to-edge insets on
Android. Verify on device after D1+D2. If the gap persists, replace KAV
entirely with a `keyboardHeight` state (same listeners, plus
`keyboardFrame.endCoordinates.height` + `interactive` handling) applied as
`paddingBottom` on the list container only — deterministic reset to 0 on hide,
no new dependencies. Mirrors the verify-then-nudge pattern of
`fix-android-keyboard` D3.

### D4: Amend `fix-android-keyboard` docs, not code

`fix-android-keyboard/design.md` records "footer rising above the keyboard is
acceptable" — superseded here. Add a one-line note to that change's design.md
pointing at this change rather than rewriting history; its spec text needs no
edit because this change's delta already MODIFIED-strengthens the same
requirement ahead of archive (keyboard change archives first).

## Risks / Trade-offs

- [Footer hidden while typing → Complete unreachable mid-set] → Intentional:
  completing mid-set-entry is rare; keyboard dismiss (tap outside / Done on
  reps) restores buttons instantly.
- [Conditional footer unmount on every keystroke-driven show/hide flickers] →
  Events fire once per show/hide, not per keystroke; verify no flicker on
  device.
- [D3 fallback changes screen layout structure late in the change] → Fallback
  is isolated to the wrapper in `app/session/[id].tsx`; tasks gate it behind
  device verification.
- [Two un-archived changes touching the same requirement] →
  `fix-android-keyboard` must archive before this one; its requirement text is
  the base this delta modifies. Sequence explicitly at archive time.

## Migration Plan

Pure UI change, single screen, no data impact. Rollback = restore stacked
footer and unconditional render.
