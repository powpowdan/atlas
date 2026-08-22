## Why

The progression chart defaults to Estimated 1RM, but most check-ins are "how much weight am I moving" — raw weight is the more immediately meaningful default. Separately, the chart renders at a fixed 320×180 SVG viewBox whose uniform scaling leaves dead margins on modern phone widths and undersells the data; the screen scrolls vertically, so a larger chart costs nothing.

## What Changes

- The metric selector defaults to **Weight** (was Estimated 1RM), and Weight becomes the first tab in the selector (order: Weight, 1RM, Reps, Volume).
- The chart's SVG viewBox becomes responsive to the available screen width and its height grows from 180 to 240, so the plot fills the screen width with no letterboxing.
- Chart tick/axis label font size increases from 9 to 10 to use the added room.

No changes to data queries, metric definitions, records summary, PR detection, or navigation.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `progression`: The "Metric selector on the chart" requirement changes its default metric from Estimated 1RM to Weight (scenario "1RM is the default metric on first open" is replaced by a Weight-default scenario; the option listing order also names Weight first). Chart dimensions are purely presentational and remain unspecified.

## Impact

- `app/exercise/[id].tsx` — `METRICS` array order, default `metric` state.
- `components/ProgressionChart.tsx` — responsive viewBox via `useWindowDimensions`, `VIEW_HEIGHT` 180→240, label font sizes.
- `openspec/specs/progression/spec.md` — one requirement delta (default metric).
- No database, query, type, or dependency changes.
