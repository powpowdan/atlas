# Proposal: establish-type-scale

## Why

A full typography audit (~191 `<Text>` elements across 23 files) found 14 distinct effective font sizes for ~8 real jobs: the same roles wear different outfits on different screens (section headers have 6 competing definitions, card titles span 16–18 at three weights, CTAs are 14 on some screens and 16 on others), every Fraunces title carries a dead `fontWeight: '700'` (only 600 is loaded), ~30 styles silently inherit the React Native default of 14, and the home screen's active-session card title (real system 700) is visually heavier than the Fraunces page titles above it — an inverted hierarchy. The identity (paper/ink/brass, Fraunces as special-occasion voice) is strong; the rhythm is accidental.

## What Changes

- Establish a single named type scale of record in `constants/theme.ts`: 13 roles covering display (Fraunces 600: wordmark 22, screenTitle 20) and system (heroStat 34, heading 17, modalTitle/cta/stat 16, body/action 14, meta/sectionHeader 13, eyebrow/caption 12, micro 10).
- Fraunces stays a single-weight special-occasion voice: only `Fraunces_600SemiBold` is loaded; wordmark and in-screen titles use it, nothing else.
- All numerals — including the session-summary total-volume hero stat — render in system font with tabular figures (removes Fraunces from the hero stat).
- Strip dead `fontWeight: '700'` declarations from all Fraunces text; title size collapses 18/20/22 → 20.
- Collapse card/list titles (16/17/18 × weights 500/600/700/unweighted) → one heading role (17/600), fixing the inverted hierarchy on the home screen.
- Standardize the eyebrow/label pattern: sectionHeader 13/700/ls 0.5 Title Case; eyebrow 12/700/UPPERCASE/ls 1.5; replaces 6 ad-hoc variants.
- Make ~30 implicit-default-14 styles explicit (`body` 14 lh 20 or `action` 14/600), and give multi-line body/caption text explicit line heights.
- Fold near-duplicate sizes: 11 → caption 12, 15 → adjacent roles, destructive buttons 12/14/15 → action 14/600.

## Capabilities

### New Capabilities

- `typography`: The app-wide type scale of record — named text roles, their exact size/weight/tracking/line-height/font-family, where each role applies, and the rule that numerals always use system tabular figures.

### Modified Capabilities

- `app-identity`: The "Display typography uses Fraunces" requirement changes — Fraunces narrows to wordmark and screen titles only (single 600 weight, no hero numerals); hero numerals move to system tabular figures alongside dense data.

## Impact

- **Code**: `constants/theme.ts` (new type presets), all 12 files in `app/**/*.tsx` and all 11 components in `components/*.tsx` (style sweeps, no logic changes), `app/_layout.tsx` and `app/(tabs)/_layout.tsx` (nav header styles already conform).
- **No dependency changes**: no new font weights loaded; `@expo/google-fonts/fraunces` stays at the single 600 weight.
- **Visual only**: pure restyle — no data, navigation, or behavior changes; all text colors already themed and untouched.
- **Sequencing**: two in-flight changes (`add-exercise-progression-chart`, `add-sticky-exercise-headers`) touch the same files; land this sweep after they archive to avoid conflict churn.
