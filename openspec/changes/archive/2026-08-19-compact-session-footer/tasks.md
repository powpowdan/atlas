## 1. Compact footer layout

- [x] 1.1 In `app/session/[id].tsx`, restyle `footer` to a single row
      (`flexDirection: 'row'`, `gap: 8`, `padding: 12` + `paddingBottom`
      incorporating `insets.bottom`).
- [x] 1.2 Restyle the buttons: `completeBtn` keeps verdigris fill at `flex: 2`
      with reduced padding (12); `discardBtn` becomes `flex: 1`, transparent
      background, 1px oxblood border, oxblood text; drop `discardBtn`
      `marginTop`; adjust text sizes so both fit one line on a ~360dp-wide
      screen.

## 2. Hide footer while keyboard is open

- [x] 2.1 Add `keyboardVisible` state plus a `useEffect` registering
      `Keyboard.addListener` pairs — `keyboardWillShow`/`keyboardWillHide` on
      iOS, `keyboardDidShow`/`keyboardDidHide` on Android — cleaning up on
      unmount. (Reuse the same listeners if D3 fallback later needs heights.)
- [x] 2.2 Conditionally render the footer: `{keyboardVisible ? null : (
      <View style={styles.footer}>…)}`.
- [x] 2.3 Run `npm run typecheck` (WSL-safe) and confirm clean.

## 3. On-device verification (user, from PowerShell)

- [x] 3.1 User starts Metro (`npx expo start`) and opens an in-progress
      session on the Pixel.
- [x] 3.2 Verify idle footer: Complete + Discard side by side in one row, no
      dead space below, not clipped by the gesture bar.
- [x] 3.3 Verify last-exercise logging: tap Weight on the bottom-most
      exercise → weight/reps, set note input, and Add set all visible above
      the keyboard; Add set works on first tap; footer absent while typing.
- [x] 3.4 Verify keyboard dismiss: buttons return immediately, with no
      residual blank gap below the footer (the reported bug).
      **FAILED on device** (2026-08-19): permanent thumb-width gap below the
      footer after keyboard dismiss — triggered the D3 fallback (task 4.1).

## 4. Residual-gap fallback (only if 3.4 fails)

- [x] 4.1 Implement design D3 fallback: replace the `KeyboardAvoidingView`
      wrapper with a `keyboardHeight` state (from
      `keyboardDidShow`/`keyboardWillHide`/`keyboardDidHide` events) applied as
      `paddingBottom` on the list container only; keep header/footer outside
      the padded area.
- [x] 4.2 Re-run typecheck and re-verify 3.2–3.4 on device. (Typecheck clean;
      device verified by user 2026-08-19: gap gone, footer flush.)

## 5. Wrap-up

- [x] 5.1 Add a one-line note to `fix-android-keyboard/design.md` (D1/Risks)
      that the footer-rides-above-keyboard trade-off is superseded by
      `compact-session-footer`.
- [x] 5.2 Run `openspec validate compact-session-footer --strict` and fix any
      findings.
- [x] 5.3 At archive time, sequence `fix-android-keyboard` first, then this
      change (both modify the same requirement).
