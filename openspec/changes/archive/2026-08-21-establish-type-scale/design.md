# Design: establish-type-scale

## Context

All typography lives in 18 per-file `StyleSheet.create` blocks (~120 explicit `fontSize` literals plus ~30 styles inheriting the RN default of 14). The only shared presets are in `constants/theme.ts`: `fonts.display` (Fraunces_600SemiBold), and `type.display` / `type.wordmark` / `type.tabular`. Only one Fraunces weight (600) is loaded via `useFonts` in `app/_layout.tsx`. Text colors are already 100% themed. See proposal.md for the audit findings that motivate this change.

## Goals / Non-Goals

**Goals:**

- One source of truth for text styling in `constants/theme.ts`, consumed by every screen and component.
- 14 chaotic effective sizes collapse into 13 named roles; same job renders identically everywhere.
- Preserve the existing visual identity — this tightens rhythm, it does not redesign.

**Non-Goals:**

- Responsive/dynamic type (fontScale policy, tablet adaptation, `useWindowDimensions`) — deferred; every value stays a fixed px literal as today.
- Loading additional Fraunces weights, italics, or optical sizes.
- Any change to text colors, layout, spacing, or component structure.
- Replacing per-file `StyleSheet.create` blocks with a global styled-text component.

## Decisions

### D1: Roles as spreadable presets in `theme.ts`, not a `<Txt>` component

Extend the existing `type` object in `constants/theme.ts` with one preset per role (e.g. `type.title`, `type.heading`, `type.cta`, `type.stat`, `type.body`, `type.meta`, `type.sectionHeader`, `type.eyebrow`, `type.caption`, `type.micro`, `type.heroStat`). Each preset is a plain `TextStyle` with `fontSize`, `fontWeight`, and where applicable `letterSpacing`, `textTransform`, `fontVariant`, `lineHeight`, and `fontFamily` (only `title`/`wordmark` carry Fraunces). Screens consume them by spreading into existing styles (`...type.heading`) or via style arrays, exactly how `type.display` and `type.tabular` are already used.

- Alternative: a `<Txt variant="heading">` wrapper component — rejected for this change: it would touch every render site (~191 `<Text>` elements) instead of every style block (~150 style properties across 18 blocks), mixing restyle with refactor and inflating review surface.
- Alternative: keep sizes as bare constants (`fontSize: sizes.heading`) — rejected: presets bundle weight/tracking/lineHeight with the size so a role cannot be half-applied.

### D2: One preset = one job; size+weight+tracking travel together

Roles bundle everything (e.g. eyebrow = 12/700/UPPERCASE/ls 1.5 as a unit). Spread sites override only `color` and layout (`margin`, `textAlign`), never typography properties. Where a role needs a numeric variant (stat vs stat row index), the variant is expressed as a separate role, not an override.

### D3: Naming mirrors the spec's role table

Preset names in code match the spec's role names (screenTitle → `type.title` is the one deliberate shortening, since `screenTitle` reads awkwardly inside screen style blocks). This keeps spec, code, and review vocabulary identical.

### D4: Single Fraunces weight, dead weights stripped

`Fraunces_600SemiBold` remains the only loaded weight. Every `fontWeight` declaration adjacent to `fonts.display` / `type.title` / `type.wordmark` is removed (they are no-ops today and misleading). Nav header styles in `app/_layout.tsx:25` and `app/(tabs)/_layout.tsx:13` keep their `fontWeight: '600'` only if required by the native header API's typing; otherwise strip.

- Alternative: load 400+700 for real weight hierarchy — rejected: user decision; Fraunces is the special-occasion voice at one confident weight.

### D5: Hero stat and all numerals flip to system tabular

`SessionSummaryModal` volume (34) drops `...type.display` for system 700 + `type.tabular`. All other numeric sites already use system + tabular; sizes normalize to stat (16/500) where they are dense-row values.

### D6: Migration is a mechanical per-file sweep, ordered to minimize conflicts

Sweep order: `constants/theme.ts` first, then components (shared), then `app/` screens. Landing after `add-exercise-progression-chart` and `add-sticky-exercise-headers` archive (both touch the same files).

## Risks / Trade-offs

- [Visual regressions from size changes (titles 18/22 → 20, card titles 18 → 17, CTAs 14 → 16)] → Mitigation: per-screen visual pass over every screen listed in tasks; changes are small (±2px) and direction is fixed by the spec table.
- [Dead `fontWeight: '700'` removal could reflow text measured by layout tests] → Mitigation: RN ignores these weights on named fonts today, so rendering is unchanged by their removal; typecheck catches any typing slips.
- [Conflict churn with the two in-flight changes] → Mitigation: D6 ordering; the sweep is mechanical (literal → preset) so rebase conflicts resolve by re-running the same substitution.
- [`type.tabular` spread alongside role presets could double-specify `fontVariant`] → Mitigation: roles that are inherently numeric (stat, heroStat) embed `fontVariant: ['tabular-nums']` so sites spread one preset, not two.
- [Micro (10) legibility on small devices] → Mitigation: accepted; micro is restricted to text inside chips/badges per spec, and RN font scaling (on by default) still applies.

## Migration Plan

1. Add role presets to `constants/theme.ts` (additive; existing `display`/`wordmark`/`tabular` keep working during the sweep).
2. Sweep components, then screens, replacing literals and implicit defaults; strip dead Fraunces weights.
3. Remove the now-unused `type.display` preset once no site references it (wordmark preset survives).
4. Rollback: single revert of the sweep commit(s); no data or persisted-state impact.
