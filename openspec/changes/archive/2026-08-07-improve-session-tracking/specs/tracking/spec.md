## MODIFIED Requirements

### Requirement: Last set per exercise

For each exercise, the system SHALL surface the full ordered list of sets logged in the most recent prior session that contains that exercise. The most recent prior session SHALL be determined by session start time, excluding the in-progress session. Working sets SHALL be shown prominently; warmup-flagged sets from that session SHALL also be shown but SHALL be visually de-emphasized relative to working sets. Each shown set SHALL display its weight and reps, and the prior session's date SHALL be indicated for the list as a whole.

#### Scenario: Last session's full set list is shown

- **WHEN** an exercise was logged in the most recent prior session with working sets 40x7, 40x6, 40x7, 40x6
- **THEN** all four sets are displayed in entry order, each with weight and reps, alongside the prior session's date

#### Scenario: Warmups in the prior session are de-emphasized

- **WHEN** the most recent prior session for an exercise contains a warmup set of 25x8 and working sets of 40x7
- **THEN** both the warmup set and the working sets are shown, with the warmup set visually de-emphasized relative to the working sets

#### Scenario: Last set is from the most recent session

- **WHEN** an exercise was logged in a session on 2026-08-04 (sets 40x7, 40x6) and earlier in a session on 2026-07-30 (sets 45x6)
- **THEN** the displayed set list is 40x7, 40x6, drawn from the 2026-08-04 session

#### Scenario: No prior sessions

- **WHEN** an exercise has never been logged before
- **THEN** no last-session list is displayed, and the UI indicates this is the first time the exercise is being logged

### Requirement: Display context during logging

While the user is logging sets for an exercise in an in-progress session, the system SHALL display, in close proximity to the set-entry controls: the best (heaviest) set, the most-reps set, and the last-session set list for that exercise. The best and most-reps values SHALL each show weight, reps, and date, and SHALL be labelled to distinguish the weight record from the rep record. Tapping a set in the last-session list SHALL copy that set's weight and reps into the set-entry controls.

#### Scenario: Both best and last are available

- **WHEN** the user is logging sets for an exercise that has prior history
- **THEN** the best (heaviest) set and the most-reps set are shown, each with weight, reps, and date and distinctly labelled, alongside the last-session set list

#### Scenario: Copy a previous set into the entry

- **WHEN** the user taps a set in the last-session list
- **THEN** that set's weight and reps are filled into the set-entry weight and reps controls, ready to be saved or edited before saving

#### Scenario: First-time exercise

- **WHEN** the user is logging an exercise that has no prior history
- **THEN** the UI displays a clear indication that no best, most-reps, or last-session data exists yet, prompting the user to set their first baseline

## ADDED Requirements

### Requirement: Most reps set per exercise

For each exercise, the system SHALL compute a single "most reps" set as the set with the greatest rep count; ties SHALL be broken by the greatest weight at that rep count; further ties SHALL be broken by the earliest such set.

#### Scenario: More reps wins

- **WHEN** an exercise has prior sets 40x7 and 45x6
- **THEN** the most-reps set is reported as 40x7

#### Scenario: Tie on reps broken by weight

- **WHEN** an exercise has prior sets 47x8 and 52x8
- **THEN** the most-reps set is reported as 52x8

#### Scenario: Equal reps and equal weight

- **WHEN** an exercise has multiple prior sets at the same reps and weight (e.g. two sets of 40x7)
- **THEN** the most-reps set is reported as 40x7, using the earliest such set as the reference date

### Requirement: Warmup sets excluded from best and most-reps computation

Warmup-flagged sets SHALL be excluded from best-set and most-reps-set computation. Warmup sets SHALL remain visible in session history and SHALL appear (visually de-emphasized) in the last-session set list.

#### Scenario: Warmup does not overwrite best

- **WHEN** an exercise has a working set of 40x7 and a warmup set of 25x8
- **THEN** the best set is reported as 40x7, and the 25x8 warmup set is ignored for best-set purposes

#### Scenario: Warmup does not overwrite most reps

- **WHEN** an exercise has a working set of 40x7 and a warmup set of 25x12
- **THEN** the most-reps set is reported as 40x7, and the 25x12 warmup set is ignored for most-reps purposes

## REMOVED Requirements

### Requirement: Warmup sets excluded from best and last

**Reason**: The "last" view changed from a single computed top-set to the full prior-session set list, which now intentionally includes warmup sets (shown dimmed), so warmups are no longer excluded from the last view. Warmup exclusion now applies to the best set and the new most-reps set.
**Migration**: Covered by the ADDED requirement "Warmup sets excluded from best and most-reps computation"; the dimmed-in-list behavior is specified in "Last set per exercise".
