## MODIFIED Requirements

### Requirement: Last set per exercise

For each exercise, the system SHALL surface the full ordered list of sets logged in the most recent prior session in which the exercise has at least one logged working set. A session that merely lists the exercise (for example, one pre-populated from a routine) but has no working sets logged for it SHALL NOT qualify. The most recent prior session SHALL be determined by session start time, excluding the in-progress session, walking backward until a session with a working set for the exercise is found. Working sets SHALL be shown prominently; warmup-flagged sets from the selected session SHALL also be shown but SHALL be visually de-emphasized relative to working sets. Each shown set SHALL display its weight and reps, and the selected session's date SHALL be indicated for the list as a whole.

#### Scenario: Last session's full set list is shown

- **WHEN** an exercise has working sets 40x7, 40x6, 40x7, 40x6 in the most recent prior session that qualifies
- **THEN** all four sets are displayed in entry order, each with weight and reps, alongside that session's date

#### Scenario: Warmups in the prior session are de-emphasized

- **WHEN** the selected prior session for an exercise contains a warmup set of 25x8 and working sets of 40x7
- **THEN** both the warmup set and the working sets are shown, with the warmup set visually de-emphasized relative to the working sets

#### Scenario: Most recent qualifying session is used

- **WHEN** an exercise has working sets in a session on 2026-08-04 (40x7, 40x6) and in an earlier session on 2026-07-30 (45x6)
- **THEN** the displayed set list is 40x7, 40x6, drawn from the 2026-08-04 session

#### Scenario: Skipped exercise is passed over

- **WHEN** the most recent prior session lists an exercise (for example, pre-populated from a routine) but has no sets logged for it, and an earlier session has working sets for that exercise
- **THEN** the displayed set list is drawn from the earlier session, and the empty session is skipped

#### Scenario: Warmup-only session is passed over

- **WHEN** the most recent prior session for an exercise contains only warmup sets, and an earlier session contains working sets for that exercise
- **THEN** the displayed set list is drawn from the earlier session, and the warmup-only session is skipped

#### Scenario: No prior sessions

- **WHEN** an exercise has no prior session with a logged working set
- **THEN** no last-session list is displayed, and the UI indicates this is the first time the exercise is being logged
