## MODIFIED Requirements

### Requirement: Delete a set

The system SHALL allow the user to delete a set from an in-progress session. Deletion SHALL take effect immediately without a confirmation dialog, and the system SHALL offer a time-limited undo as specified in the undo capability.

#### Scenario: Remove an unwanted set

- **WHEN** the user deletes a set
- **THEN** the set is removed immediately, the exercise's remaining sets are unchanged, and an undo affordance is offered for a limited time

### Requirement: Delete a set in a completed session

The system SHALL allow the user to delete a set from a completed session while in edit mode. Deletion SHALL take effect immediately without a confirmation dialog, and the system SHALL offer a time-limited undo as specified in the undo capability.

#### Scenario: Remove a mis-logged set

- **WHEN** the user deletes a set from a completed session
- **THEN** the set is removed immediately, the exercise's remaining sets are unchanged, and an undo affordance is offered for a limited time

### Requirement: Remove an exercise from a completed session

The system SHALL allow the user to remove an exercise — and with it all of that exercise's sets — from a completed session while in edit mode. Removal SHALL take effect immediately without a confirmation dialog, and the system SHALL offer a time-limited undo as specified in the undo capability.

#### Scenario: Remove an exercise

- **WHEN** the user removes an exercise from a completed session
- **THEN** the exercise and all of its sets are removed immediately, the remaining exercises are unchanged, and an undo affordance is offered for a limited time
