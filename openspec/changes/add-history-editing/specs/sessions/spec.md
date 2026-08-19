## ADDED Requirements

### Requirement: Edit a completed session from history

The system SHALL allow the user to edit a completed session from its history detail view. Editing SHALL be gated behind an explicit edit mode: the default history view SHALL remain read-only, and edit affordances SHALL appear only while edit mode is active. All edits SHALL apply directly to the stored session with the same validation rules as live logging.

#### Scenario: View is read-only by default

- **WHEN** the user opens a completed session from history
- **THEN** the session is displayed read-only with no edit affordances

#### Scenario: Enter edit mode

- **WHEN** the user activates edit mode on a completed session
- **THEN** each exercise shows affordances to edit sets, add sets, and remove the exercise, and the session shows an affordance to add an exercise

#### Scenario: Exit edit mode after changes

- **WHEN** the user deactivates edit mode after making changes
- **THEN** the history detail view reflects all changes made while edit mode was active

### Requirement: Edit a set in a completed session

The system SHALL allow the user to edit any field of a logged set — weight, reps, warmup flag, and note — of a completed session while in edit mode. An edited set SHALL keep its position in the exercise's set order.

#### Scenario: Correct a mistyped set after completion

- **WHEN** the user changes a set's weight from 135 to 225 and saves
- **THEN** the set is updated with weight 225 and remains in its original position among the exercise's sets

#### Scenario: Reject an invalid edit

- **WHEN** the user clears both weight and reps from a set and attempts to save
- **THEN** the system rejects the save and shows a validation error

### Requirement: Delete a set in a completed session

The system SHALL allow the user to delete a set from a completed session while in edit mode. The system SHALL require confirmation before deleting.

#### Scenario: Remove a mis-logged set

- **WHEN** the user deletes a set from a completed session and confirms
- **THEN** the set is removed and the exercise's remaining sets are unchanged

### Requirement: Add a set to a completed session

The system SHALL allow the user to add a set to any exercise in a completed session while in edit mode, subject to the same validation as live logging. The new set SHALL appear after the exercise's existing sets.

#### Scenario: Append a forgotten set

- **WHEN** the user adds a set of 100 lbs × 8 to an exercise in a completed session
- **THEN** the set is persisted and displayed after that exercise's existing sets

### Requirement: Add an exercise to a completed session

The system SHALL allow the user to add any exercise from the exercise library to a completed session while in edit mode.

#### Scenario: Add an exercise after completion

- **WHEN** the user adds an exercise from the library to a completed session
- **THEN** the exercise appears at the end of the session's exercise list and can receive sets

### Requirement: Remove an exercise from a completed session

The system SHALL allow the user to remove an exercise — and with it all of that exercise's sets — from a completed session while in edit mode. The system SHALL require an explicit confirmation before removal, because the action is destructive and cannot be undone.

#### Scenario: Remove an exercise

- **WHEN** the user removes an exercise from a completed session and confirms
- **THEN** the exercise and all of its sets are removed from the session and the remaining exercises are unchanged

#### Scenario: Removal requires confirmation

- **WHEN** the user chooses to remove an exercise from a completed session
- **THEN** the system asks for confirmation and performs no removal until the user confirms

### Requirement: History edits recompute tracking

Because best-set, most-reps, personal-record, progression, and last-session reference values are derived from logged sets, any edit to a completed session SHALL be reflected in those derived values.

#### Scenario: Editing a set updates tracking

- **WHEN** the user edits a set in a completed session so that it becomes the heaviest set ever logged for that exercise
- **THEN** subsequent best-set and progression values for that exercise reflect the edited weight

#### Scenario: Removing data updates tracking

- **WHEN** the user deletes a set or removes an exercise whose sets included an exercise's best or most-reps set
- **THEN** subsequent best, most-reps, and last-session values for that exercise reflect the remaining sets only
