## MODIFIED Requirements

### Requirement: Metric selector on the chart

The progression view SHALL provide a metric selector with four options: Weight, Estimated 1RM, Reps, and Volume. Weight SHALL be the default. Selecting a metric SHALL re-plot the chart using the same set of sessions, with each dot's value recomputed for the selected metric. Volume for a session SHALL be the sum of `weight × reps` across all of the session's selected-type sets for the exercise.

#### Scenario: Switch from 1RM to Weight

- **WHEN** the user selects the Weight metric
- **THEN** each dot's value becomes the highest-weight set in its session (rather than the highest-1RM set), and the chart's vertical axis rescales to the weight range

#### Scenario: Volume aggregates all selected-type sets in the session

- **WHEN** a session contains working sets 50×8, 50×8, 50×7, 50×6 for an exercise and the user selects the Volume metric with the Working filter
- **THEN** that session's dot value is 50×8 + 50×8 + 50×7 + 50×6 = 2900 lbs total volume

#### Scenario: Weight is the default metric on first open

- **WHEN** the user opens the progression view for the first time for an exercise
- **THEN** the chart is plotted with Weight as the active metric

#### Scenario: Weight-based axis labels use lbs

- **WHEN** the chart is plotted with a weight-based metric (Estimated 1RM, Weight, or Volume)
- **THEN** the Y-axis label includes the unit "lbs", matching the weight labels used across the app (`formatWeightLabel`)
