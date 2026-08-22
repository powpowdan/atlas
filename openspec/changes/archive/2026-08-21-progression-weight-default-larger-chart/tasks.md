## 1. Default metric and tab order

- [x] 1.1 In `app/exercise/[id].tsx`, reorder `METRICS` so Weight is first: Weight, 1RM, Reps, Volume
- [x] 1.2 Change the `metric` state initializer from `'e1rm'` to `'weight'`

## 2. Responsive, larger chart

- [x] 2.1 In `components/ProgressionChart.tsx`, add `useWindowDimensions` and compute `viewWidth = Math.max(window.width - 16, 320)`; derive `PLOT_WIDTH` from it instead of the `VIEW_WIDTH` constant
- [x] 2.2 Bump `VIEW_HEIGHT` from 180 to 240 and use it in the `Svg` `height` and `viewBox` props
- [x] 2.3 Add `viewWidth` to the position-math `useMemo` dependencies so layout recomputes on dimension change
- [x] 2.4 Increase tick/axis label `fontSize` from 9 to 10 (y-tick labels and x date labels)

## 3. Verification

- [x] 3.1 Run `npm run typecheck` (WSL-safe)
- [x] 3.2 Visual check from PowerShell (`npx expo start`): Weight tab is first and selected on open, chart spans full width with no side margins, taller plot, labels legible
