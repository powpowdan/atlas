## Context

The app currently computes per-exercise extremes via `getBestSet` (heaviest working set), `getMostRepsSet`, and `getLastSessionSets` — all surfaced as in-session "context pills" while logging (`app/session/[id].tsx`). There is no view that connects these points across sessions; the user can see *a* past value but not *the trajectory*. The data needed to draw a trajectory already exists in the schema (`sets`, `session_exercises`, `sessions`); the gap is a read path that walks all sessions for one exercise and a UI to plot the result.

The in-flight change `last-session-requires-logged-sets` tightens the rule for what counts as "this session contained the exercise" — it requires at least one working set. This change inherits that rule for dot qualification.

See `proposal.md` for motivation and scope; this document covers how.

## Goals / Non-Goals

**Goals:**

- Add a per-exercise screen showing records summary + metric tabs + set-type filter + line chart, reachable by tapping the exercise name from session and history detail views.
- Plot one dot per qualifying session, defaulting to Estimated 1RM (Epley) on the Y axis and session start time on the X axis.
- Reuse existing queries (`getBestSet`, `getMostRepsSet`) for two of the three record values; add one new query for per-session progression points and the best-1RM record.
- No schema or migration changes.

**Non-Goals:**

- No home-screen dashboard, no consistency/streak surface, no goals, no progression-model suggestions, no per-exercise increment configuration. Tracker only.
- No chart polish (tooltips, crosshair, pinch-zoom, animated entry, gradient fills). Those wait for a dedicated styling pass.
- No new tab; the chart is reached by tapping through from existing screens.
- No unit conversion. The app does not track units today; weights are plotted as logged.

## Decisions

### Decision: New `progression` capability, not folded into `tracking`

`tracking` is scoped to *during-logging* context (the heaviest/most-reps/last pills beside the set-entry controls). The progression chart is a *standalone retrospective read view* — different surface, different user intent, different lifecycle (opened from history, not from a session). Folding them would force `tracking` to mean "anything per-exercise analytic," which dilutes it. A new capability keeps both focused.

### Decision: Default metric is Estimated 1RM (Epley), not Weight

The user's scheme is double progression: 4 sets, build reps to 8–10 before bumping weight. Under that scheme, pure weight stays flat for weeks at a time while reps climb — visually demotivating. Epley 1RM (`weight × (1 + reps / 30)`) is monotone-ish during both rep buildup and weight bumps, so it rewards rep PRs that the weight line hides.

Epley chosen over Brzycki (`weight × 36 / (37 - reps)`) for simplicity and adequate accuracy in the user's 5–10 rep target range. Epley becomes generous above ~10 reps and optimistic below ~5; acceptable for a personal tracker where the goal is to read trends, not absolutism.

Alternatives considered: Weight (flat during buildup — rejected as default), Volume (rewards junk volume, noisier across sessions), Brzycki (more conservative, slightly more complex formula).

### Decision: One dot per session = the session's best set on the active metric

One dot per qualifying session keeps the curve readable. The "best" set within a session is metric-dependent: highest Epley 1RM (1RM tab), highest weight (Weight tab), highest reps (Reps tab), highest total session volume (Volume tab, computed across all selected-type sets). Tiebreak: greatest weight (or greatest reps for the Weight/Volume metrics), then earliest set.

This mirrors FitNotes' behavior and keeps the per-session selection rule consistent with the existing `getBestSet` shape (extended to "best per session" rather than "best all-time").

Alternatives considered: every set as its own dot (noisy, hard to read at a glance), first working set (arbitrary), last/top set (defensible but inconsistent with the records summary's "best" notion).

### Decision: Set-type filter defaults to Working; records summary follows the filter

Working-only by default matches FitNotes and the existing `tracking` capability's treatment of warmups (excluded from best/most-reps computation). The records summary (Heaviest / Most reps / Best 1RM) recomputes when the filter changes — keeping the summary and chart consistent with one another is simpler than maintaining two separate filter states.

### Decision: Hand-rolled SVG chart via `react-native-svg`, no charting library

FitNotes' chart is visually restrained — flat line, dots, axis labels, system font, no fills/tooltips. That is exactly the case hand-rolled SVG handles well. A charting library (`react-native-gifted-charts` or `victory-native`) would ship faster but imposes its own look, which we would then have to suppress during the eventual styling pass. Owning the SVG means the styling pass edits our own StyleSheet, not a library's theme.

The chart is also the signature visual surface of a workout tracker; it should not look like every other app's chart.

Install via `npx expo install react-native-svg` from **PowerShell** (per AGENTS.md — never from WSL). The Expo CLI auto-selects the SDK 54-compatible version. `react-native-svg` is included in Expo Go, so there is no native rebuild.

`<ProgressionChart>` component contract (inputs only — implementation lives in tasks):

```
Props:
  points: Array<{ sessionId, startedAt, value }>   // one per session, sorted ascending by startedAt
  metricLabel: string                              // for axis context
  onDotPress: (sessionId) => void
Renders:
  Svg with:
    - Y axis: ~5 gridlines labeled with values
    - X axis: ~3-4 date tick labels (first, middle, last)
    - Polyline connecting points (omitted when points.length === 1)
    - Circle per point, wrapped in Pressable for tap
```

### Decision: Records summary reuses existing queries

Heaviest record = existing `getBestSet(exerciseId, setType)`.
Most-reps record = existing `getMostRepsSet(exerciseId, setType)`.
Best 1RM record = computed from the new progression query (the session with the highest per-session 1RM, then the specific set within it).

The existing `getBestSet` / `getMostRepsSet` signatures take only `exerciseId` today and exclude warmups via a hardcoded `s.is_warmup = 0`. They will need a small signature extension to accept a set-type filter, OR the screen calls them only when the filter is Working and falls back to a new computation otherwise. Preferred: extend the signatures with an optional `setType` parameter defaulting to working, since the records summary must follow the filter (see spec: `progression/spec.md` → "Records summary on the progression view"). This is a backward-compatible additive change.

### Decision: No new schema, no migrations

`getExerciseProgress(exerciseId, setType)` reads `sets`, `session_exercises`, `sessions` directly. Existing indexes (`idx_session_exercises_exercise_id`, `idx_sessions_started_at`, `idx_sets_session_exercise_warmup`) cover the joins and filters. At personal-scale data volumes (low thousands of sets), performance is not a concern.

## Risks / Trade-offs

- **Epley 1RM overestimates at low reps and above ~10 reps.** → Mitigation: this is a trend-reading tool, not a strength-program calculator. The user's target rep range (5–10) is where Epley is most reasonable. The Weight tab remains available as an honest fallback.
- **Hand-rolled SVG is more code than a charting library.** → Mitigation: FitNotes' chart is simple (line + dots + axis labels); estimated ~150–250 lines for v1. If pinch-zoom, animated entry, or crosshair tooltips become must-haves later, those are incremental additions to our own component, not a rewrite.
- **Single-session case renders as one dot with no line.** → Acknowledged; spec'd as an explicit scenario (`progression/spec.md` → "Single session on the chart"). v1 accepts this.
- **WSL/Windows split could corrupt `node_modules` if `react-native-svg` is installed from WSL.** → Mitigation: tasks.md makes installation a PowerShell-only step; opencode never runs the install.
- **Records summary updating with the set-type filter may surprise users expecting stable "all-time" records.** → Mitigation: this is intentional and spec'd; the default filter is Working, which matches the existing during-logging pill behavior, so most users will never toggle it.

## Migration Plan

None. No schema or migration changes. The only deployment step is installing `react-native-svg` from PowerShell and restarting Metro. Rollback is removing the new route, component, query, and the dependency — no data is touched.
