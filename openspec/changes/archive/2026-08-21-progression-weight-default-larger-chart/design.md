## Context

`ProgressionChart` renders into a fixed `viewBox="0 0 320 180"` with `width="100%" height={180}` (`components/ProgressionChart.tsx:16-17,149`). Because SVG's default `preserveAspectRatio="xMidYMid meet"` scales uniformly, the fixed height caps the scale factor at 1.0 on any screen wider than 320 logical px, leaving symmetric dead margins left/right of the plot. The screen scrolls vertically (`app/exercise/[id].tsx` uses `ScrollView`), so extra chart height is free. The default metric is set by `useState<ProgressionMetric>('e1rm')` and tab order by the `METRICS` array (`app/exercise/[id].tsx:24-29,48`); `getExerciseProgress` already returns all four metric values per point, so switching the default is purely presentational.

## Goals / Non-Goals

**Goals:**

- Chart fills the available screen width with no letterboxing on phones and tablets.
- Noticeably taller plot (height 180 → 240).
- Weight is the default metric and the first tab.

**Non-Goals:**

- No changes to metric definitions, queries, PR detection, records summary, or navigation.
- No landscape-specific or tablet-specific layouts beyond what the responsive width gives for free.
- No persisted per-exercise metric preference (default resets per open, as today).

## Decisions

### D1: Responsive viewBox via `useWindowDimensions` (not static dimensions, not stretched)

Compute `viewWidth = Math.max(window.width - 16, 320)` inside the component (16 = the wrap's 8px horizontal padding × 2; floor of 320 guards narrow splitscreen), derive `PLOT_WIDTH` from it, and render `<Svg width="100%" height={240} viewBox={`0 0 ${viewWidth} 240`}>`.

- *Why not a static bigger viewBox (e.g. 380×240)?* Same letterboxing bug on any device that isn't exactly that width — the fix must remove the fixed-width assumption, not retune it.
- *Why not `preserveAspectRatio="none"?* Stretches dots into ellipses and distorts text. Non-starter.
- *Why `window.width` instead of `onLayout`?* The chart is the only content sized this way and `useWindowDimensions` is simpler; padding is a known constant, so no need for layout measurement.

### D2: Height 240, labels 9 → 10

`VIEW_HEIGHT = 240` with the same padding constants and 5 gridlines. Tick/axis label `fontSize` 9 → 10 so the extra room reads as room, not as smaller text scaled up. Aspect ratio moves from 320:180 to roughly 390:240 — wider *and* taller, which matches "noticeably larger" without dominating the scroll view.

### D3: Default metric flip is state + order only

Change `METRICS` to `[{weight}, {e1rm}, {reps}, {volume}]` and `useState<ProgressionMetric>('weight')`. No derived-state or query changes: `getExerciseProgress` already computes every metric per point, and the chart picks a field per metric. Tab order follows default order so the initially-selected tab is the leftmost.

## Risks / Trade-offs

- [Very narrow windows (split-screen) could squeeze the plot] → `Math.max(..., 320)` floor keeps the plot readable; SVG scales down uniformly if needed.
- [Larger fontSize with 4-char y-labels could clip against the left pad] → `PAD_LEFT = 36` already accommodates; verified visually during implementation.
- [Window resize mid-animation re-runs layout math] → All position math is already inside one `useMemo`; add `viewWidth` to its deps. Trivial cost.
