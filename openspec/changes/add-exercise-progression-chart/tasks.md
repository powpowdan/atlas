## 1. Dependency setup (PowerShell only)

- [ ] 1.1 From PowerShell (not WSL), run `npx expo install react-native-svg` to add the SDK-54-compatible version
- [ ] 1.2 Verify `metro.config.js` still excludes `.opencode` and that Metro starts cleanly with the new dependency

## 2. Types

- [x] 2.1 Add a `ProgressionPoint` type to `types/index.ts` (fields: `sessionId: string`, `startedAt: number`, `bestWeight: number`, `bestReps: number`, `bestE1rm: number`, `volume: number`)
- [x] 2.2 Add a `ProgressionMetric` union type (`'e1rm' | 'weight' | 'reps' | 'volume'`) and a `SetTypeFilter` union (`'working' | 'all' | 'warmup'`) to `types/index.ts`

## 3. Queries

- [x] 3.1 Implement `getExerciseProgress(db, exerciseId, setType)` in `db/queries/tracking.ts`: returns one `ProgressionPoint` per qualifying completed session, where qualifying = the session has at least one set of the selected type for the exercise. Per session, select the best set by Epley 1RM (tiebreak: greatest weight, then earliest set); compute volume as `SUM(weight × reps)` across all selected-type sets in that session. Order ascending by `started_at`.
- [x] 3.2 Implement `getBestE1rmSet(db, exerciseId, setType)` in `db/queries/tracking.ts`: returns the all-time best-1RM set (tiebreak: greatest weight, then earliest set), filtered by `setType`. Used by the records summary.
- [x] 3.3 Extend `getBestSet` and `getMostRepsSet` signatures in `db/queries/tracking.ts` to accept an optional `setType: SetTypeFilter = 'working'` parameter, generalizing the currently hardcoded `is_warmup = 0` filter. Backward-compatible: callers passing no `setType` keep current behavior.
- [x] 3.4 Run `npm run typecheck` (WSL-safe) and confirm the query module compiles cleanly

## 4. Chart component

- [x] 4.1 Create `components/ProgressionChart.tsx`: a pure presentational SVG component (no DB access) accepting `points: ProgressionPoint[]`, `metric: ProgressionMetric`, `onDotPress: (sessionId: string) => void`
- [x] 4.2 Render Y axis with ~5 gridlines labeled by value, scaling to the active metric's range; X axis with first/middle/last date tick labels
- [x] 4.3 Render a `Polyline` connecting points when `points.length >= 2`; render a single `Circle` (no line) when `points.length === 1`
- [x] 4.4 Render each point as a `Circle` wrapped in a tappable hit-area that calls `onDotPress(point.sessionId)`
- [ ] 4.5 Verify the chart renders on iOS/Android with the existing flat styling (black line, system font, no fills)

## 5. Progression screen

- [x] 5.1 Create `app/exercise/[id].tsx` reading the `id` param as the exercise id
- [x] 5.2 Load exercise name via `getExerciseById`; load records via `getBestSet`, `getMostRepsSet`, `getBestE1rmSet`; load chart points via `getExerciseProgress`
- [x] 5.3 Render the records summary (Heaviest / Most reps / Best 1RM), each with weight × reps and date
- [x] 5.4 Render the metric selector (Estimated 1RM default, Weight, Reps, Volume) as a row of selectable tabs; switching re-plots the chart using the same points
- [x] 5.5 Render the set-type filter (Working default, All, Warmup); changing it re-queries records and points and re-renders
- [x] 5.6 Render `<ProgressionChart>` below the controls; on dot press, navigate to `/history/[sessionId]`
- [x] 5.7 Implement the empty state: when `getExerciseProgress` returns no points for the current filter, replace the chart with a "No history yet. Log this exercise in a session to see progression." message

## 6. Tap-through entry points

- [x] 6.1 In `app/session/[id].tsx`, make the exercise name in each exercise block tappable; navigate to `/exercise/[exerciseId]`
- [x] 6.2 In `app/history/[id].tsx`, make the exercise name in each exercise block tappable; navigate to `/exercise/[exerciseId]`
- [ ] 6.3 Verify the back stack behaves: tapping through from a session detail and back returns to the session detail, not the sessions tab

## 7. Verification

- [ ] 7.1 Run `npm run typecheck` (WSL-safe) and resolve any errors
- [ ] 7.2 Manually verify against the `progression` spec scenarios: open from session, open from history detail, empty state, single-session chart, metric switching, set-type filter switching, dot tap-through to session detail
- [ ] 7.3 Verify warmup toggle behavior: a session with only warmup sets for the exercise produces no dot under Working, but produces a dot under All or Warmup

## 8. Unit labels + entry-point affordance

- [x] 8.1 In `components/ProgressionChart.tsx`, fix `METRIC_LABEL`: `'kg'` → `'lbs'`, `'kg (est. 1RM)'` → `'lbs (est. 1RM)'`, `'kg (volume)'` → `'lbs (volume)'`
- [x] 8.2 In `app/session/[id].tsx` `ExerciseHeader`: exercise name in verdigris, trailing `›` chevron, press-dim feedback
- [x] 8.3 In `app/history/[id].tsx` exercise title row: same treatment (verdigris name, chevron, press dim)
- [x] 8.4 Run `npm run typecheck` (WSL-safe) and resolve any errors
