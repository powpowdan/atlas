## 1. Enable keyboard avoidance on Android

- [x] 1.1 In `app/session/[id].tsx`, change the `KeyboardAvoidingView` `behavior`
      from `Platform.OS === 'ios' ? 'padding' : undefined` to `"padding"` (remove the
      now-unused `Platform` import usage if nothing else references it — check before
      removing).
- [x] 1.2 Add `keyboardShouldPersistTaps="handled"` to the `SectionList`.

## 2. Static verification

- [ ] 2.1 Run `npm run typecheck` (WSL-safe) and confirm clean.

## 3. On-device verification (user, from PowerShell)

- [ ] 3.1 User starts Metro (`npx expo start`) and loads the session screen on the
      Pixel.
- [ ] 3.2 Verify: focusing Weight on the LAST exercise keeps the input visible above
      the keyboard; Next moves focus to Reps still visible; Add set works on first
      tap with keyboard open; keyboard dismisses on tap outside; sticky exercise
      header does not flicker; footer buttons ride above keyboard.
- [ ] 3.3 If the focused input does NOT auto-scroll into view: implement the D3
      fallback (list ref + onFocus scrollTo for weight/reps inputs) and re-verify.

## 4. Wrap-up

- [ ] 4.1 Confirm no iOS regression (user, if iOS testing available; else code
      review note that only the Android branch changed behavior).
- [ ] 4.2 Run `openspec validate fix-android-keyboard` before archive.
