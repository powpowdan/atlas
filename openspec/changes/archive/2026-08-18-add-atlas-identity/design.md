# Design: add-atlas-identity

## Context

The app is an Expo SDK 54 / RN 0.81 / expo-router 6 TypeScript project with strict mode. Styling today is ~150 inline hex literals spread across 12 files in `app/` and 5 in `components/`, all `StyleSheet.create` based. There is no theme module, no custom fonts, no icon/splash config in `app.json` (Expo defaults), and `react-native-svg` 15.12 is already a dependency (used by `TabIcon` and `ProgressionChart`). The logo exists as `logo.svg` at the repo root: a wide (600×328) single-`<g>` black-fill potrace-style trace of Atlas carrying the Earth. `app.json` already sets `"name": "Atlas"` and `userInterfaceStyle: "light"`. Per AGENTS.md, all npm installs and expo/EAS commands must run from PowerShell, never WSL.

## Goals / Non-Goals

**Goals:**

- One source of truth for colors/type that makes the hex migration mechanical and a future dark mode cheap.
- Logo rendered from the existing SVG path data, recolorable via a single fill prop.
- Signature moments (expedition chart, brass PR badge, stamp completion) implemented with current dependencies plus fonts only.

**Non-Goals:**

- Dark mode (tokens leave the door open; no dual theme in v1).
- Replacing the hand-rolled `TabIcon` stroke icon set — it already matches the flat style; extend in-style only if a task demands it.
- Animations/motion design (static treatments only in this change).
- Any behavior change to exercises, routines, sessions, or tracking logic.

## Decisions

### D1: Semantic token module, not React Context theming

`constants/theme.ts` exports a frozen plain object: `colors` (paper, paperDeep, ink, inkSoft, brass, verdigris, oxblood, plus border/text/opaque-tint derived values), `type` (font family constants and a `wordmark` text style), and spacing-free usage left to existing styles. Screens import tokens directly into their existing `StyleSheet.create` blocks.

*Why not RN `ThemeProvider`/Context:* light-only v1 has exactly one theme value; context adds indirection for zero benefit. If dark mode arrives, the token module becomes a function of scheme behind the same import surface — a contained refactor.

*Mapping (old → new):* `#fff` surfaces → `paper`; `#0a7cff` primary/tints → `ink` / derived ink-tint (`#E9E4D8`-family); `#1aa260` → `verdigris`; `#c00` → `oxblood`; `#b8860b` PR → `brass`; the `#eee–#999` gray ladder → paper-deep / border / ink-soft text tokens; blue-tinted fills (`#e8f0ff`, `#f0f7ff`) → paper-deep or brass-tinted equivalents so no cool tones survive.

### D2: Fraunces via @expo-google-fonts, gated in root layout

Add `expo-font` + `@expo-google-fonts/fraunces` (SemiBold weight(s)). Load in `app/_layout.tsx` with `useFonts`, rendering `null` until loaded (prevents flash-of-system-font; app has no persistent deep-link text-content needs). Export `fonts.display` and a shared `wordmarkStyle` (uppercase, `letterSpacing: 2–3`) from the theme module. Body/data keeps the system font with `fontVariant: ['tabular-nums']` on numeric text styles.

*Alternative considered:* bundling a raw `.ttf` in `assets/` and `expo-font` from local file — works, but the Google Fonts package handles Android/iOS weighting and config-free loading; one dependency either way.

### D3: LogoMark wraps the existing SVG path data

Move/copy `logo.svg`'s single path group into `components/LogoMark.tsx` as a `react-native-svg` component (path data in a `.ts` module or inline). Props: `size`, `color = ink`, `aspect` fixed by the 600×328 viewBox. The potrace trace is dense; rendering below ~80px loses the globe/figure detail, so the component documents tiers but does not hard-fail small sizes (a `<0.` guard would be hostile during iteration).

*Why not raster assets everywhere:* the single-fill structure means one component recolors for splash (paper-on-ink) and empty states (ink-on-paper) with zero asset duplication. PNG exports are generated only where the platform demands bitmaps (icon/splash config, see D5).

### D4: Chart reskin inside existing ProgressionChart

`ProgressionChart` already draws SVG gridlines, line, and dots. Changes: line gets `strokeDasharray="6 4"` in ink; gridlines shift to paper-deep; regular data points stay ink dots; PR points render a small brass star path (5-point polygon) instead of a dot. The chart's PR detection reuses the existing best-set logic already feeding the UI — no new data plumbing.

*Fallback:* if dashed reads imprecise during review, revert `strokeDasharray` only; brass stars and parchment grid survive independently (decision D3 in the proposal's decision record, partially reversible).

### D5: Icon/splash assets generated as PNGs, config in app.json

Generate (PowerShell-side or manual export) `assets/icon.png` (1024×1024, ink tile, centered paper mark — the wide logo needs a square crop/pad of the globe+shoulders region) and `assets/splash.png` (ink background, paper mark, generous margins, no text — splash text would need the font bundled at native build time). Wire `expo.icon`, `expo.splash` in `app.json`; keep `userInterfaceStyle: "light"`. EAS/prebuild regeneration happens on Windows, never WSL.

### D6: Stamp and badge treatments are pure styles

PR badge: existing badge style block re-tinted brass with an inline `✦` glyph (no icon-font dependency for one character). Session-complete stamp: verdigris border ring + uppercase letterspaced text treatment on the summary modal's header; no images, no rotation animation (non-goal).

## Risks / Trade-offs

- [Dashed chart reads as less precise for data] → Mitigation: independent fallback (solid line, keep stars) baked into D4; decide during implementation review.
- [Fraunces package adds ~font-size weight to the binary] → Mitigation: import only the needed weights/axes (SemiBold, opsz default).
- [Wide logo awkward at icon scale] → Mitigation: icon uses a cropped composition, not a squeezed full mark; validate visually before EAS rebuild.
- [Font gate delays first paint on slow devices] → Mitigation: `useFonts` gate renders null only briefly; acceptable for a local-first app with no deep-linked text screens.
- [WSL/Windows split corrupts node_modules on install] → Mitigation: all installs/expo commands run from PowerShell per AGENTS.md; WSL only edits source.

## Migration Plan

1. Land `theme.ts` + `LogoMark` + font gate (no visual change yet beyond font availability).
2. Migrate hex → tokens file-by-file (screens then components); app remains functional at every step since tokens are drop-in values.
3. Reskin chart, badge, complete-stamp, empty states (visual deltas land together).
4. Add assets + `app.json` config; user runs EAS/icon rebuild from PowerShell.
5. Rollback: revert commits — no data migrations, no persisted-state changes.

## Open Questions

- Exact brass-tint chip background for the PR badge (solid brass chip w/ paper text vs. brass-tinted paper chip w/ brass text) — settle visually during implementation.
- Whether the sessions tab header shows the Fraunces "ATLAS" wordmark or the screen title "Sessions" in Fraunces — pick during implementation; both satisfy the spec.
