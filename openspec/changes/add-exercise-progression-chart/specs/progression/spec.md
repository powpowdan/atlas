## Purpose

Show, for any exercise in the library, a retrospective view of how the user has progressed on it across sessions: an all-time records summary and a line chart of one dot per session. Lets the user see trajectory, not just point-in-time extremes.

## ADDED Requirements

### Requirement: Per-exercise progression view

The system SHALL provide a per-exercise progression screen reachable by tapping the exercise's name from an in-progress session or a past session's detail view. The screen SHALL display the exercise's name, an all-time records summary, a metric selector, a set-type filter, and a line chart plotting one dot per qualifying session over time.

#### Scenario: Open the progression view from a session

- **WHEN** the user taps an exercise's name while logging or viewing a session
- **THEN** the per-exercise progression screen opens for that exercise, showing its records summary, metric selector, set-type filter, and chart

#### Scenario: Exercise never logged

- **WHEN** the user opens the progression view for an exercise that has never appeared in any completed session with a working set
- **THEN** the chart is replaced with an empty state indicating no history exists yet, while the records summary shows no record values

### Requirement: Records summary on the progression view

The progression view SHALL display an all-time records summary composed of three values: the heaviest set (greatest weight, tiebreak by greatest reps, then earliest), the most-reps set (greatest reps, tiebreak by greatest weight, then earliest), and the best estimated 1RM set (greatest estimated 1RM, tiebreak by greatest weight, then earliest). Each value SHALL show weight, reps, and the date the set was logged. By default, only working sets SHALL contribute to all three records; warmup sets SHALL be excluded unless the set-type filter is set to include them.

#### Scenario: All three records exist

- **WHEN** an exercise has prior working-set history containing a heaviest set of 60×5, a most-reps set of 50×10, and a best-1RM set of 55×8
- **THEN** the records summary displays all three values, each with its weight, reps, and date

#### Scenario: Exercise has no qualifying sets

- **WHEN** an exercise has no working sets in history and the set-type filter is set to Working
- **THEN** each record value is shown as empty or em-dashed, indicating no record has been set

### Requirement: Estimated 1RM computation

The system SHALL compute an estimated one-rep maximum (1RM) for a set using the Epley formula: `weight × (1 + reps / 30)`. Estimated 1RM SHALL be computed per set, then aggregated per session and across history as needed by the records summary and chart.

#### Scenario: Higher reps at the same weight raises estimated 1RM

- **WHEN** two sets exist at 50 lbs, one at 5 reps and one at 8 reps
- **THEN** the 8-rep set has the higher estimated 1RM

#### Scenario: Higher weight at lower reps may still win

- **WHEN** two sets exist, 50×8 and 55×5
- **THEN** the 55×5 set has the higher estimated 1RM (≈64.2 vs ≈63.3), because the formula rewards the greater weight

### Requirement: One dot per session on the chart

The chart SHALL plot exactly one dot per qualifying completed session, ordered by session start time on the horizontal axis. A session qualifies when it has at least one set of the selected type (working by default) for the exercise. The plotted value of a dot SHALL be derived from the session's "best" set for the active metric, where "best" is defined per metric: highest estimated 1RM (1RM tab), highest weight (Weight tab), highest reps (Reps tab), and greatest total volume (Volume tab). When multiple sets in a session tie on the active metric, the tiebreak SHALL be greatest weight (or, for the Weight and Volume metrics, greatest reps), then earliest set.

#### Scenario: One dot per session, not per set

- **WHEN** an exercise was logged across three completed sessions, each with multiple working sets
- **THEN** the chart shows exactly three dots, one per session, positioned by session start date

#### Scenario: Session with no working sets for the exercise is skipped

- **WHEN** an exercise was pre-populated into a session from a routine but no working sets were logged for it, and the set-type filter is set to Working
- **THEN** that session produces no dot on the chart

#### Scenario: Session contributes a warmup-only dot only when warmups are included

- **WHEN** a session has only warmup sets for the exercise and the set-type filter is set to All or Warmup
- **THEN** that session produces a dot derived from its warmup sets; when the filter is set to Working, that session produces no dot

### Requirement: Metric selector on the chart

The progression view SHALL provide a metric selector with four options: Estimated 1RM, Weight, Reps, and Volume. Estimated 1RM SHALL be the default. Selecting a metric SHALL re-plot the chart using the same set of sessions, with each dot's value recomputed for the selected metric. Volume for a session SHALL be the sum of `weight × reps` across all of the session's selected-type sets for the exercise.

#### Scenario: Switch from 1RM to Weight

- **WHEN** the user selects the Weight metric
- **THEN** each dot's value becomes the highest-weight set in its session (rather than the highest-1RM set), and the chart's vertical axis rescales to the weight range

#### Scenario: Volume aggregates all selected-type sets in the session

- **WHEN** a session contains working sets 50×8, 50×8, 50×7, 50×6 for an exercise and the user selects the Volume metric with the Working filter
- **THEN** that session's dot value is 50×8 + 50×8 + 50×7 + 50×6 = 2900 lbs total volume

#### Scenario: 1RM is the default metric on first open

- **WHEN** the user opens the progression view for the first time for an exercise
- **THEN** the chart is plotted with Estimated 1RM as the active metric

#### Scenario: Weight-based axis labels use lbs

- **WHEN** the chart is plotted with a weight-based metric (Estimated 1RM, Weight, or Volume)
- **THEN** the Y-axis label includes the unit "lbs", matching the weight labels used across the app (`formatWeightLabel`)

### Requirement: Set-type filter on the chart

The progression view SHALL provide a set-type filter with three options: Working (default), All, and Warmup. The filter SHALL control which sets in each session contribute to the dot value, the records summary, and whether a session qualifies for a dot at all.

#### Scenario: Working filter excludes warmups

- **WHEN** a session contains a warmup set of 25×8 and working sets of 50×8 for an exercise and the filter is set to Working
- **THEN** the warmup set is excluded from the dot value, the volume total, and the records summary

#### Scenario: All filter includes warmups

- **WHEN** the same session is viewed with the filter set to All
- **THEN** the warmup set is included in the dot-value selection and the volume total

#### Scenario: Warmup filter shows warmups only

- **WHEN** the filter is set to Warmup
- **THEN** only warmup-flagged sets contribute to dot values, volume, and records, and sessions with no warmups for the exercise produce no dot

### Requirement: Tap a dot to open that session

The system SHALL allow the user to tap a dot on the chart to navigate to the detail view of the session that dot represents.

#### Scenario: Tap a dot

- **WHEN** the user taps a dot on the chart
- **THEN** the session detail view opens for the session whose value the dot represents

#### Scenario: Single session on the chart

- **WHEN** an exercise has been logged in exactly one qualifying session
- **THEN** the chart displays a single dot with no connecting line, and tapping it opens that session

### Requirement: Exercise-name tap targets are visually apparent

In the in-progress session view and the past-session history view, each exercise name SHALL be rendered as a tappable control whose interactivity is visually apparent: the name SHALL use the app's interactive accent color (verdigris), display a trailing chevron (›), and show visible press feedback while pressed.

#### Scenario: Exercise name at rest

- **WHEN** an exercise block is rendered in the session view or a history detail view
- **THEN** the exercise name appears in the accent color with a trailing chevron, distinguishing it from non-interactive labels

#### Scenario: Press feedback on the exercise-name tap target

- **WHEN** the user presses the exercise-name tap target
- **THEN** the target visibly dims for the duration of the press
