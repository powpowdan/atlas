## MODIFIED Requirements

### Requirement: View a past session

The system SHALL allow the user to open a past session and see its exercises, the sets logged under each, the session note, the originating routine name, and — when the session has been completed — the elapsed duration between start and completion. The originating routine name SHALL be displayed exactly once, in the screen's navigation header, using "Ad-hoc" when the session has no routine name. The session date SHALL be displayed exactly once, alongside the duration, as a heading-style line in the session header area; the completion date SHALL NOT be listed separately when it falls on the same day as the start date.

#### Scenario: Open a past session

- **WHEN** the user opens a past session from history
- **THEN** the system displays the originating routine name once in the navigation header ("Ad-hoc" if none), and below it a heading-style line with the session date and each exercise with its sets in entry order

#### Scenario: Completed session shows duration

- **WHEN** the user opens a completed session from history
- **THEN** the system displays the elapsed duration between `started_at` and `completed_at` on the same line as the session date, formatted as hours and minutes, with no separate completion-date listing

#### Scenario: In-progress session shows no duration

- **WHEN** the user opens a session that is still in progress
- **THEN** the session date line shows no duration
