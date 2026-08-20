## Why

On Android (Pixel, Expo SDK 54 / RN 0.81 with enforced edge-to-edge), the software
keyboard draws over the app instead of resizing it. The session screen's
`KeyboardAvoidingView` is a no-op on Android (`behavior` is `undefined` outside iOS),
so when logging a set for the last exercise, the weight/reps inputs are hidden
behind the keyboard and the user must type blind or dismiss the keyboard.

## What Changes

- Enable keyboard avoidance on Android in the session screen by setting
  `behavior="padding"` on both platforms (RN 0.81 reports real keyboard height on
  Android under edge-to-edge).
- Add `keyboardShouldPersistTaps="handled"` to the session `SectionList` so controls
  (Add set, reference chips, edit/delete) work on first tap while the keyboard is open.
- Ensure the focused weight/reps input scrolls into view above the keyboard when the
  list resizes (add a focus→scroll nudge only if RN's built-in behavior proves
  insufficient on the device).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `sessions`: New requirement — set entry inputs must remain visible above the
  on-screen keyboard during set logging on both iOS and Android.

## Impact

- Code: `app/session/[id].tsx` only (session screen layout + list props).
- No new dependencies; pure React Native JS. Works in Expo Go.
- Out of scope (tracked for later if desired): `components/RoutineEditor.tsx` has the
  same dormant pattern; modals with inputs (history edit, session note, exercise
  editor) are not covered by this change.
