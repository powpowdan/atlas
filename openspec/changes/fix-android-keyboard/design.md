## Context

Expo SDK 54 / RN 0.81 enforces edge-to-edge on Android: the system no longer resizes
the app window when the software keyboard opens. The screen's
`KeyboardAvoidingView` sets `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`
(app/session/[id].tsx:167), a no-op on Android — acceptable pre-edge-to-edge, broken
now. Result: the keyboard covers the last exercise's weight/reps inputs on Android.

Alternatives considered:

- `react-native-keyboard-controller`: best-in-class, but a native module — not in
  Expo Go, would force a dev-build workflow. Rejected for now.
- `android.softwareKeyboardLayoutMode: "resize"` in app.json: ignored under enforced
  edge-to-edge on Android 15+. Dead end.

## Goals / Non-Goals

- Goals: focused set entry input visible above the keyboard on Android; first-tap
  controls while keyboard open; no iOS regression; no new dependencies.
- Non-Goals: RoutineEditor screen (same dormant pattern, separate change if wanted);
  modals with inputs (session note, history edit, exercise editor); keyboard toolbars
  / accessory views.

## Decisions

### D1: `behavior="padding"` on both platforms

RN 0.81 under edge-to-edge reports the real keyboard height on Android, so
`KeyboardAvoidingView` with `behavior="padding"` now works cross-platform. Keep the
single wrapper structure (header, list, footer inside KAV) — the footer rising above
the keyboard is acceptable and keeps Complete/Discard reachable.

### D2: `keyboardShouldPersistTaps="handled"` on the SectionList

Without it, the first tap with the keyboard open just dismisses the keyboard
(especially annoying for Add set right after typing reps). "handled" keeps taps on
interactive rows effective while still allowing taps on empty space to dismiss.

### D3: Rely on RN's built-in scroll-to-focus, verify, nudge only if needed

When KAV padding shrinks the SectionList, RN's ScrollView normally scrolls the
focused input into view. Verify on the Pixel (user runs the app on Windows-native
Expo per AGENTS.md). If it does not, add a minimal focus→`scrollTo` nudge via a list
ref and `onFocus` on the weight/reps inputs — no new dependencies.

### D4: No change to modals or other screens

The session note Modal is a separate window; its input sits at the top and is not
reported blocked. Out of scope regardless (see Non-Goals).

## Risks / Trade-offs

- KAV padding animation can briefly jank with `stickySectionHeadersEnabled` —
  cosmetic; verify on device.
- Footer lifts with the keyboard (visible Complete/Discard while typing) — accepted.
- Unknown D3 risk is intentionally a verification task, not a blocker.

## Migration Plan

Pure UI change, no data/schema impact. Ship behind no flag; revert = restore
platform-conditional `behavior`.

## Open Questions

- Does RN 0.81 auto-scroll the focused input into view on the user's Pixel? (Task 3
  answers this; fallback is specified in D3.)
