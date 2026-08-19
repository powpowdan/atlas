## MODIFIED Requirements

### Requirement: Add a note to a session

The system SHALL allow the user to attach an optional free-form note to a session as a whole, in addition to per-exercise and per-set notes. The note SHALL be editable regardless of the session's status — including after the session has been marked complete — so the user can revise or add a note when reviewing past sessions.

#### Scenario: Save a session note

- **WHEN** the user enters "Felt strong today" as a session note and saves
- **THEN** the note is persisted on the session and visible when viewing the session

#### Scenario: Edit a note on a completed session

- **WHEN** the user opens a completed session from history, edits its note, and saves
- **THEN** the updated note is persisted on the completed session and visible on subsequent views

#### Scenario: Clear a note on a completed session

- **WHEN** the user opens a completed session, removes the existing note text, and saves
- **THEN** the session's note becomes null and the note display is hidden on subsequent views

### Requirement: View a past session

The system SHALL allow the user to open a past session and see its exercises, the sets logged under each, the session note, the originating routine name, and — when the session has been completed — the elapsed duration between start and completion.

#### Scenario: Open a past session

- **WHEN** the user opens a past session from history
- **THEN** the system displays the session date, originating routine name, session note, and each exercise with its sets in entry order

#### Scenario: Completed session shows duration

- **WHEN** the user opens a completed session from history
- **THEN** the system displays the elapsed duration between `started_at` and `completed_at`, formatted as hours and minutes

#### Scenario: In-progress session shows no duration

- **WHEN** the user opens a session that is still in progress
- **THEN** no duration is displayed
