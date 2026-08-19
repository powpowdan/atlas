## Purpose

Surface per-exercise context during logging — the most recent top set ("last") and the all-time top set ("best") — so the user knows what they are aiming to match or beat.

## ADDED Requirements

### Requirement: Best set per exercise

For each exercise, the system SHALL compute a single "best" set as the set with the greatest weight; ties SHALL be broken by the greatest reps at that weight.

#### Scenario: Heavier weight wins

- **WHEN** an exercise has prior sets 40x7 and 45x6
- **THEN** the best set is reported as 45x6

#### Scenario: Tie on weight broken by reps

- **WHEN** an exercise has prior sets 40x7 and 40x10
- **THEN** the best set is reported as 40x10

#### Scenario: Equal weight and equal reps

- **WHEN** an exercise has multiple prior sets at the same weight and reps (e.g. two sets of 40x7)
- **THEN** the best set is reported as 40x7, using the earliest such set as the reference date

### Requirement: Last set per exercise

For each exercise, the system SHALL compute a single "last" set as the top set (by the best-set rule) of the most recent prior session that contains that exercise.

#### Scenario: Last set is from the most recent session

- **WHEN** an exercise was logged in a session on 2026-08-04 (top set 40x7) and earlier in a session on 2026-07-30 (top set 45x6)
- **THEN** the last set is reported as 40x7, drawn from the 2026-08-04 session

#### Scenario: No prior sessions

- **WHEN** an exercise has never been logged before
- **THEN** no last set is displayed, and the UI indicates this is the first time the exercise is being logged

### Requirement: Warmup sets excluded from best and last

Warmup-flagged sets SHALL be excluded from best-set and last-set computation. They remain visible in session history.

#### Scenario: Warmup does not overwrite best

- **WHEN** an exercise has a working set of 40x7 and a warmup set of 25x8
- **THEN** the best set is reported as 40x7, and the 25x8 warmup set is ignored for best-set purposes

#### Scenario: Warmup does not overwrite last

- **WHEN** the most recent session for an exercise contains a warmup set of 25x8 and a working set of 40x7
- **THEN** the last set is reported as 40x7

### Requirement: Display context during logging

While the user is logging sets for an exercise in an in-progress session, the system SHALL display the best set and the last set for that exercise in close proximity to the set-entry controls.

#### Scenario: Both best and last are available

- **WHEN** the user is logging sets for an exercise that has prior history
- **THEN** both the best set (labelled "Best") and the last set (labelled "Last") are shown alongside the set-entry controls, each with weight, reps, and date

#### Scenario: First-time exercise

- **WHEN** the user is logging an exercise that has no prior history
- **THEN** the UI displays a clear indication that no best or last exists yet, prompting the user to set their first baseline
