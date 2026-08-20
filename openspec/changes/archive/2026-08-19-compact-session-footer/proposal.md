## Why

The session-screen footer ("Complete session" + "Discard session") is stacked
full-width and consumes ~128px of permanent vertical space. When the keyboard
opens on the last exercise, the footer rides above the keyboard, so the user
sees only the weight/reps row plus the two footer buttons — the set note input
and the "Add set" button are hidden, forcing a scroll-then-tap detour on every
set of the final exercise. After the keyboard dismisses, residual empty space
also appears below the footer.

## What Changes

- Compact the session-screen footer into a single row: "Complete session"
  (primary, wider) beside "Discard session" (secondary destructive), with
  bottom safe-area padding.
- Hide the footer entirely while the on-screen keyboard is open, returning it
  when the keyboard dismisses, so the reclaimed space shows the set note input
  and "Add set" button for the bottom-most exercise.
- Eliminate the residual blank space left below the footer after the keyboard
  dismisses (verify KeyboardAvoidingView reset; fall back to an explicit
  keyboard-height padding approach if it persists).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `sessions`: Strengthen the "Keyboard does not obscure set entry" requirement —
  visibility extends past the weight/reps inputs to the full set-entry form
  (note input and Add set action) for the bottom-most exercise while the
  keyboard is open. Add a requirement that the session footer occupy a single
  compact row when idle and be hidden while the keyboard is open, with no
  residual layout gap after the keyboard dismisses.

## Impact

- `app/session/[id].tsx`: footer layout styles, keyboard visibility state
  (Keyboard listeners), footer conditional rendering, possible replacement of
  the KeyboardAvoidingView padding mechanism.
- No data, schema, navigation, or dependency changes.
- Amends the accepted trade-off recorded in `fix-android-keyboard/design.md`
  ("footer rising above the keyboard is acceptable") — that change remains
  un-archived; this change supersedes that decision before archive.
