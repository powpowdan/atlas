# Proposal: add-atlas-identity

## Why

The app has no visual identity: ~150 hardcoded hex literals across 17 files use generic bootstrap blue (`#0a7cff`) with default system styling, and no app icon or splash is configured (Expo defaults). The app is named ATLAS and ships with a black-and-white minimalist SVG logo of Atlas carrying the Earth — a strong identity thesis that the UI currently ignores.

## What Changes

- Introduce a semantic design-token module (`constants/theme.ts`) — the "Old Atlas" palette (warm paper surfaces, ink primary, brass PR accents, verdigris success, oxblood danger) — and migrate all hardcoded color literals to tokens.
- Adopt the Fraunces typeface (via `@expo-google-fonts/fraunces` + `expo-font`) for the ATLAS wordmark, screen headers, and hero numerals; system font with tabular figures for dense data.
- Add a recolorable `LogoMark` component wrapping the existing single-fill logo SVG, with defined size tiers (hero ≥200px, mid ~80px, never below) and usage in splash and empty states.
- Restyle the progression chart as a "dashed expedition route": dashed ink line on parchment-toned gridlines with a brass star at each PR summit.
- Upgrade the PR badge to a brass chip with a star glyph.
- Apply a passport-stamp treatment to the session-complete state.
- Configure `app.json` with an app icon (paper mark on ink tile) and splash (ink background, mark only); keep `userInterfaceStyle: "light"` (cream-only v1).

## Capabilities

### New Capabilities

- `app-identity`: The visual identity system — palette tokens, typography, logo usage rules, and signature visual moments (expedition chart, PR badge, complete stamp) that all screens share.

### Modified Capabilities

<!-- None: exercises, routines, sessions, and tracking behavior is unchanged; only visual styling of existing UI changes. -->

## Impact

- **Code**: all 12 screen files in `app/`, all 5 components in `components/` (color migration); new `constants/theme.ts`, new `components/LogoMark.tsx`, `app/_layout.tsx` (font loading + gate).
- **Dependencies**: adds `expo-font`, `@expo-google-fonts/fraunces` (install from PowerShell per AGENTS.md — never WSL).
- **Assets**: requires PNG exports of the logo (1024px icon tile, splash art) generated from `logo.svg`; `app.json` icon/splash config; EAS icon rebuild is PowerShell-side.
- **Risk**: dashed chart line is the most subjective visual change — fallback is solid ink line with brass PR stars retained.
