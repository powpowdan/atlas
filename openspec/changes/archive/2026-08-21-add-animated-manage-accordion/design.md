## Context

The manage screen (`app/exercise/manage.tsx`) renders categories via `SectionList` with per-section `data` set to the exercises only when expanded — an instant row-count swap with no animation. The chevron is a text swap (`▸`/`▾`). After `handleSaved` (create), no expansion or scroll happens, so a new exercise in a collapsed section is invisible. The app has no animation libraries installed; `newArchEnabled: true` rules out `LayoutAnimation` (unsupported on the new architecture). `react-native-reanimated` is the idiomatic Expo choice and is compatible.

## Goals / Non-Goals

**Goals:**

- True accordion: animated expand AND collapse of section bodies, both filters.
- Continuous chevron rotation as the toggle affordance.
- Create → auto-expand + scroll-to-section so the new exercise is immediately visible.
- Per-visit expansion state (reset on unmount) — explicit non-persistence.

**Non-Goals:**

- Animating the exercise picker modal's list (search list, not an accordion).
- Cross-visit/restart-persisted expansion state.
- Reorder/drag interactions, swipe actions, or any other list affordances.
- Virtualization at scale (personal-library scale: tens to low hundreds of rows; accepted loss from dropping SectionList).

## Decisions

### D1: ScrollView + per-section animated height, not animated SectionList rows

Replace `SectionList` with a `ScrollView` mapping sections; each section body wraps its rows in an `Animated.View` whose `height` animates 0 ↔ measured content height via `withTiming`. Section heights are captured once per section through `onLayout` on an always-mounted inner content view (`overflow: 'hidden'` on the animated wrapper). Animated collapsing sections keep content mounted (height 0), so both directions animate — the core "static opening" complaint.

*Alternatives:* staying on SectionList with entering/exiting row animations (collapse still snaps — half the fix); JS-driven `Animated` API (fine, but reanimated is the modern default and we need it installed anyway for consistent animation tooling); `LayoutAnimation` (dead on new architecture).

### D2: Collapse via height with content kept mounted

Height-0 collapsed sections remain mounted but hidden. Recompute risk: heights are stable per section because row layout is deterministic; `onLayout` re-fires on content change (rename moves an exercise between sections) and updates the stored height. If a stale height briefly clips during a change, the next layout pass corrects it — acceptable at this scale, avoids remount juggling.

*Android correction (found in device smoke):* a plain child of a 0-height wrapper measures 0 (or is dropped from the native hierarchy) on Android/Yoga, so `onLayout` never reports real content height — the body animated 0→0 while the chevron turned. The inner content view is therefore absolutely positioned (`top/left/right: 0`) with `collapsable={false}`: it escapes the wrapper's height constraint, always measures its natural size on both platforms, and the wrapper's `overflow: 'hidden'` still clips it. Standard RN accordion technique.

### D3: Chevron rotation with interpolated shared transition

The chevron becomes a `Text` glyph (`▸`) inside an `Animated.View` rotating 0°→90° with the same `withTiming` as the height. Rotating a single glyph avoids the character-swap pop and reads as one continuous affordance. Reanimated's shared `runOnJS`/state drives both height and rotation from one `ExpandedState` change per section.

### D4: Reveal-on-create via header y-offset registry

Maintain `headerY: Map<string, number>` populated by each section header's `onLayout` y-offset (accumulated offsets are not needed — `onLayout` provides absolute y within the ScrollView content). In `handleSaved(saved)`: add `saved.category` to `expanded`, then `scrollRef.current?.scrollTo({ y: max(0, headerY.get(category) - smallMargin) , animated: true })` after the state commit (in a `useEffect` keyed on a "reveal target" state or via `requestAnimationFrame`). Edit flow needs nothing — a row's Edit implies its section is already expanded.

*Alternative:* `SectionList.scrollToLocation` (only if we kept SectionList — incompatible with D1).

### D5: Per-visit state stays as-is

`expanded` remains component `useState`; unmount resets. This is a deliberate product decision (captured in specs), not an implementation shortcut.

### D6: One shared `AnimatedSection` component

Extract a small component (header + animated body) used for both filters, keeping the screen's render declarative. All animation primitives live inside it; the screen keeps owning `expanded` and data. Prevents Active/Archived divergence of accordion behavior.

## Risks / Trade-offs

- [New dependency: reanimated] → Install must happen from PowerShell (AGENTS.md); on new architecture it needs no extra native config in Expo SDK 54 (autolinked). Babel plugin is included via `babel-preset-expo` (expo-router v6 setup) — verify at implementation; if the plugin warning appears, add `'react-native-reanimated/plugin'` to `babel.config.js`.
- [Loss of virtualization] → Accepted: collapsed-by-default, personal scale. If libraries ever grow past a few hundred exercises, revisit.
- [Keyboard/measure timing on scroll-to-reveal] → Reveal runs post-commit via rAF; if the first frame's y is stale (header offsets shift after data refresh), re-read the registry at scroll time — headers report fresh `onLayout` each render.
- [Rotated glyph antialiasing at 90°] → Cosmetic worst case; `▸` rotates cleanly in practice; fallback is a tiny custom chevron via `react-native-svg` (not installed — avoid).

## Migration Plan

No data migration. Rollback is reverting the screen to SectionList (previous code) and optionally removing reanimated from package.json.

## Open Questions

- Exact animation duration/easing (lean ~200ms, easeOut) — tune during implementation smoke.
- Whether reveal-on-create should also flash/highlight the new row — defer; not spec'd, additive later if wanted.
