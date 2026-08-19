## Purpose

Log a workout session by starting from a routine (pre-populated) or ad-hoc, enter sets under each exercise, mark the session complete, and browse past sessions.

## ADDED Requirements

### Requirement: Start a session from a routine

The system SHALL allow the user to start a new session from a routine. The session SHALL be pre-populated with the routine's exercises in their defined order, copied at start time so later edits to the routine do not affect the session.

#### Scenario: Start from a routine

- **WHEN** the user selects a routine and chooses to start a session
- **THEN** a new session is created with the routine's exercises pre-populated in order, and the session is linked to that routine for reference

#### Scenario: Pre-populated exercises are independent of the routine

- **WHEN** the user starts a session from a routine and then the routine is edited
- **THEN** the session's exercise list and order remain unchanged

### Requirement: Start an ad-hoc session

The system SHALL allow the user to start a session with no routine attached, adding exercises one at a time during the workout.

#### Scenario: Start ad-hoc

- **WHEN** the user starts a session without selecting a routine
- **THEN** a new empty session is created with no exercises, and the user may add exercises as the workout progresses

### Requirement: Add an exercise to a session

The system SHALL allow the user to add any exercise from the exercise library to a session, ad-hoc sessions and routine-started sessions alike.

#### Scenario: Add an exercise

- **WHEN** the user adds an exercise to an in-progress session
- **THEN** the exercise appears at the end of the session's exercise list and is ready to receive sets

### Requirement: Log a set

The system SHALL allow the user to log a set under a session exercise with a numeric weight, a numeric rep count, an optional warmup flag, and an optional free-form note. Weight SHALL accept decimal values to accommodate machines with small increments (e.g. 91.5).

#### Scenario: Log a working set

- **WHEN** the user enters weight 40 and reps 7 for an exercise and saves the set
- **THEN** the set is persisted as a working set with weight 40 and reps 7

#### Scenario: Log a warmup set

- **WHEN** the user enters a set, toggles the warmup flag on, and saves
- **THEN** the set is persisted with the warmup flag set, distinct from working sets

#### Scenario: Log a set with a decimal weight

- **WHEN** the user enters weight 91.5 and reps 8
- **THEN** the set is persisted with weight 91.5

#### Scenario: Log a set with a note

- **WHEN** the user enters weight 47 and reps 7 with the note "failure"
- **THEN** the set is persisted with that note attached

#### Scenario: Reject a set without weight or reps

- **WHEN** the user attempts to save a set with neither weight nor reps entered
- **THEN** the system rejects the save and shows a validation error

### Requirement: Edit a set

The system SHALL allow the user to edit any field of a previously logged set in an in-progress session.

#### Scenario: Correct a mistyped set

- **WHEN** the user changes a set's reps from 6 to 8 and saves
- **THEN** the set is updated with reps 8

### Requirement: Delete a set

The system SHALL allow the user to delete a set from an in-progress session.

#### Scenario: Remove an unwanted set

- **WHEN** the user deletes a set and confirms
- **THEN** the set is removed and the exercise's remaining sets are unchanged

### Requirement: Mark a session complete

The system SHALL allow the user to mark an in-progress session as complete. A completed session SHALL appear in history and SHALL NOT be editable from the active-session view.

#### Scenario: Complete a session

- **WHEN** the user marks an in-progress session as complete
- **THEN** the session's status becomes complete, it is removed from the active-session view, and it appears in the session history list

### Requirement: Add a note to a session

The system SHALL allow the user to attach an optional free-form note to a session as a whole, in addition to per-exercise and per-set notes.

#### Scenario: Save a session note

- **WHEN** the user enters "Felt strong today" as a session note and saves
- **THEN** the note is persisted on the session and visible when viewing the session

### Requirement: List past sessions

The system SHALL list past sessions ordered by date, most recent first, showing the date, the originating routine name (if any), and a summary such as total exercise count.

#### Scenario: Show recent sessions

- **WHEN** the user opens the history screen and past sessions exist
- **THEN** the system displays sessions most recent first, each with its date, originating routine name (or "Ad-hoc" if none), and exercise count

#### Scenario: Empty history

- **WHEN** the user opens the history screen and no sessions exist
- **THEN** the system displays an empty-state prompt guiding the user to start their first session

### Requirement: View a past session

The system SHALL allow the user to open a past session and see its exercises, the sets logged under each, the session note, and the originating routine name.

#### Scenario: Open a past session

- **WHEN** the user opens a past session from history
- **THEN** the system displays the session date, originating routine name, session note, and each exercise with its sets in entry order
