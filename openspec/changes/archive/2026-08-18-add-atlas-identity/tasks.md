# Tasks: add-atlas-identity

## 1. Foundation

- [x] 1.1 Create `constants/theme.ts` with the Old Atlas palette (paper, paperDeep, ink, inkSoft, brass, verdigris, oxblood + derived border/text/tint tokens), font family constants, `wordmark` text style, and a `tabular` numeric style helper
- [x] 1.2 Move `logo.svg` path data into the repo as an importable module (e.g. `constants/logo.ts` or inline in the component) preserving the 600×328 viewBox
- [x] 1.3 Create `components/LogoMark.tsx`: `react-native-svg` component with `size` and `color` props (default ink), rendering the single-fill path group
- [x] 1.4 Add `expo-font` and `@expo-google-fonts/fraunces` dependencies — user installs from PowerShell (`npm install expo-font @expo-google-fonts/fraunces`), never WSL
- [x] 1.5 Gate fonts in `app/_layout.tsx` with `useFonts` (render null until loaded); wire `fonts.display`/`wordmark` usage through theme tokens

## 2. Color migration (screens)

- [x] 2.1 Migrate `app/(tabs)/_layout.tsx` and `app/(tabs)/index.tsx` hex literals to theme tokens (tab tint → ink, header/paper surfaces, resume card tint)
- [x] 2.2 Migrate `app/(tabs)/routines.tsx` and `app/(tabs)/history.tsx` to tokens
- [x] 2.3 Migrate `app/exercise/manage.tsx` and `app/exercise/[id].tsx` to tokens (archive action → oxblood, edit/restore → ink)
- [x] 2.4 Migrate `app/routine/new.tsx` and `app/routine/[id].tsx` to tokens (no literals — thin wrappers; headers themed via root Stack options, body in RoutineEditor)
- [x] 2.5 Migrate `app/session/new.tsx` to tokens
- [x] 2.6 Migrate `app/session/[id].tsx` to tokens — include PR badge → brass chip with `✦`, complete button → verdigris, discard → oxblood, blue tints (`#e8f0ff`, `#f0f7ff`, `#fafcff`) → paper-deep/derived tints, and hero numerals/headers → Fraunces where design D2 applies

## 3. Color migration (components)

- [x] 3.1 Migrate `components/ProgressionChart.tsx` to tokens (gridlines → paper-deep, axis text → inkSoft, line/dots → ink)
- [x] 3.2 Migrate `components/SessionSummaryModal.tsx` to tokens (done button → verdigris, PR rows → brass)
- [x] 3.3 Migrate `components/RoutineEditor.tsx`, `components/ExerciseEditorModal.tsx`, `components/ExercisePickerModal.tsx` to tokens (Done links → ink, errors → oxblood, borders/empty states → token grays)

## 4. Signature moments

- [x] 4.1 Reskin `ProgressionChart` trend line as dashed expedition route (`strokeDasharray` in ink) with brass star glyphs at PR summit points (reuse existing best-set detection)
- [x] 4.2 Apply passport-stamp treatment to session-complete state in `SessionSummaryModal` (verdigris ring border, uppercase letterspaced stamp text)
- [x] 4.3 Add LogoMark empty states (ink mark on paper + one line of copy) to sessions list, routines list, and exercise picker empty views

## 5. Brand assets & config

- [x] 5.1 Generate PNG assets from the logo — 1024×1024 ink tile with centered paper-mark square crop (`assets/icon.png`) and ink splash art with paper mark, no text (`assets/splash.png`) — exports done outside WSL *(branded PNGs rasterized via sharp-cli from the SVG sources; 47KB/33KB RGBA, committed in 46eede3)*
- [x] 5.2 Configure `app.json`: `icon`, `splash` (ink background, paper mark), confirm `userInterfaceStyle: "light"` unchanged
- [x] 5.3 User runs icon/EAS regeneration from PowerShell and verifies installed app icon + splash on device *(verified by user)*

## 6. Verification

- [x] 6.1 Grep audit: no remaining `#0a7cff`, `#1aa260`, `#c00`, `#b8860b`, or cool-tone literals in `app/`/`components/` (all hex now only inside `theme.ts`)
- [x] 6.2 Run `npm run typecheck` from WSL (safe) — clean pass *(fixed 2 `fontVariant` type errors on SvgText in ProgressionChart; exit 0)*
- [x] 6.3 Visual pass from PowerShell (`npx expo start`): tab bar, session logging, chart dashed route + stars, PR badge, complete stamp, empty states, splash — confirm or invoke the D4 dashed-line fallback *(passed; dashed chart line confirmed, no fallback needed)*
