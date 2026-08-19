## Why

The app logs sets and surfaces point-in-time extremes (heaviest, most-reps, last session) during logging, but offers no way to see *trajectory* across sessions. With the user's double-progression scheme (4 sets, build reps to 8–10 before bumping weight), pure weight stays flat for weeks at a time — masking real progress that is happening through rep PRs. A per-exercise chart with estimated 1RM as the default axis makes that progress visible, FitNotes-style.

## What Changes

- A new per-exercise screen surfaces an all-time records summary, a metric selector, a set-type filter, and a line chart of one dot per session.
- The chart defaults to **estimated 1RM (Epley)**, with Weight, Reps, and Volume as alternative metrics the user can toggle.
- One dot per qualifying completed session; "qualifying" inherits the rule from the in-flight `last-session-requires-logged-sets` change (≥1 working set for the exercise).
- Set-type filter defaults to working sets only, with a toggle to include warmups (matches FitNotes).
- Tap-through: tapping an exercise name in `session/[id].tsx` and `history/[id].tsx` opens the chart; tapping a dot opens that session.
- New dependency: `react-native-svg` for a hand-rolled chart component (line + dots + axis labels, no charting library).
- The "Heaviest" and "Most reps" record values reuse existing `getBestSet` / `getMostRepsSet` queries; the "Best 1RM" record and the per-session dots are computed by a new query.

## Capabilities

### New Capabilities

- `progression`: Per-exercise retrospective view — records summary (heaviest, most-reps, best estimated 1RM), metric tabs (1RM / Weight / Reps / Volume), set-type filter (Working / All / Warmup), and a line chart of one dot per completed session that contains the exercise with at least one working set.

### Modified Capabilities

(none — `tracking` remains scoped to during-logging context. The new view is a standalone retrospective surface with a distinct intent, so it lives in its own capability.)

## Impact

- Affected code: new route `app/exercise/[id].tsx`, new query in `db/queries/tracking.ts` (`getExerciseProgress`), new component `components/ProgressionChart.tsx`, two small tap-through edits in `app/session/[id].tsx` and `app/history/[id].tsx`, new types in `types/index.ts`.
- Dependencies: add `react-native-svg` (installed from PowerShell per AGENTS.md; never from WSL).
- No schema or migration changes; the new query reads existing `sets`, `session_exercises`, and `sessions` and reuses the working-set existence rule.
- No new tabs; the chart is reached by tapping an exercise name from existing screens.
