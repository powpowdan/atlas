# routines Specification

## Purpose
Reusable named workout templates composed of ordered exercises, so a user can start a session from a template instead of re-entering the exercise list each time.
## Requirements
### Requirement: Create a routine

The system SHALL allow the user to create a routine by providing a unique name and an ordered list of exercises drawn from the exercise library. Name uniqueness SHALL be enforced case-insensitively: the system SHALL reject a new routine whose name matches an existing routine's name ignoring case.

#### Scenario: Create a routine with exercises

- **WHEN** the user creates a routine named "Day 1" and adds the exercises Bench, Fly, and Ab crunch in that order
- **THEN** the routine is persisted with the name "Day 1" and the exercises stored in the specified order

#### Scenario: Reject a routine without a name

- **WHEN** the user attempts to save a routine with an empty name
- **THEN** the system rejects the save and shows a validation error

#### Scenario: Reuse an exercise in the same routine

- **WHEN** the user adds Bench twice to the same routine
- **THEN** both entries are stored as separate ordered items

#### Scenario: Reject a duplicate routine name

- **WHEN** the user attempts to save a new routine named "Day 1" while a routine named "Day 1" already exists
- **THEN** the system rejects the save and shows an error stating a routine with that name already exists

#### Scenario: Reject a duplicate routine name ignoring case

- **WHEN** the user attempts to save a new routine named "day 1" while a routine named "Day 1" already exists
- **THEN** the system rejects the save and shows an error stating a routine with that name already exists

### Requirement: List routines

The system SHALL display all routines to the user, ordered by most recently modified.

#### Scenario: Show routines on the routines screen

- **WHEN** the user opens the routines screen and at least one routine exists
- **THEN** the system displays each routine's name and exercise count, most recently modified first

#### Scenario: Empty state

- **WHEN** the user opens the routines screen and no routines exist
- **THEN** the system displays an empty-state prompt guiding the user to create their first routine

### Requirement: View routine details

The system SHALL display a routine's name and its exercises in their defined order.

#### Scenario: View an existing routine

- **WHEN** the user opens a routine
- **THEN** the system shows the routine name and the list of exercises in their stored order

### Requirement: Edit a routine

The system SHALL allow the user to rename a routine and to add, remove, or reorder its exercises. Renaming SHALL enforce case-insensitive name uniqueness against all other routines. Editing a routine SHALL NOT alter sessions that were previously started from it.

#### Scenario: Rename a routine

- **WHEN** the user changes a routine's name from "Day 1" to "Push Day" and saves
- **THEN** the routine is stored with the new name

#### Scenario: Reorder exercises in a routine

- **WHEN** the user moves the third exercise to the first position and saves
- **THEN** the routine's exercise order is updated to reflect the new sequence

#### Scenario: Remove an exercise from a routine

- **WHEN** the user removes an exercise from a routine and saves
- **THEN** the exercise is removed from the routine's ordered list and the remaining exercises keep their relative order

#### Scenario: Editing a routine does not mutate past sessions

- **WHEN** the user edits a routine that has previously been used to start sessions
- **THEN** those past sessions retain the exercise list and order they were started with

#### Scenario: Reject renaming to an existing routine's name

- **WHEN** the user renames a routine to "Day 1" and another routine named "Day 1" already exists
- **THEN** the system rejects the save and shows an error stating a routine with that name already exists

#### Scenario: Saving without changing the name succeeds

- **WHEN** the user edits a routine's exercises but saves without changing its name
- **THEN** the save succeeds and the routine keeps its name

### Requirement: Delete a routine

The system SHALL allow the user to delete a routine from the routines list and from the routine edit screen. Deletion SHALL require explicit confirmation. Deleting a routine SHALL NOT delete sessions that were previously started from it.

#### Scenario: Delete a routine

- **WHEN** the user deletes a routine and confirms
- **THEN** the routine and its exercise list are removed, and the routines list updates accordingly

#### Scenario: Deleting a routine preserves past sessions

- **WHEN** the user deletes a routine that has previously been used to start sessions
- **THEN** those past sessions remain viewable in history with their original exercise list intact

#### Scenario: Delete from the routines list

- **WHEN** the user long-presses a routine in the routines list and confirms the deletion
- **THEN** the routine is removed and the list refreshes to reflect the removal

#### Scenario: Delete from the edit screen

- **WHEN** the user opens a routine for editing, chooses the delete action, and confirms
- **THEN** the routine is removed and the user is returned to the routines list

#### Scenario: Cancelling deletion keeps the routine

- **WHEN** the user triggers routine deletion and dismisses the confirmation without confirming
- **THEN** the routine is not deleted and remains in the list

### Requirement: Storage-level routine name uniqueness

The system SHALL enforce case-insensitive routine name uniqueness at the storage layer, and on upgrade SHALL automatically rename pre-existing case-insensitive duplicate names so that the invariant holds. Migration SHALL keep the name of the most recently updated routine in each duplicate group and append numeric suffixes (" (2)", " (3)", …) to older duplicates, without changing routine modification timestamps or list ordering.

#### Scenario: Upgrading with duplicate routine names

- **WHEN** the app upgrades on a device where two routines named "Day 1" exist
- **THEN** the most recently updated routine keeps the name "Day 1" and the other is renamed to "Day 1 (2)", with both routines' modification timestamps unchanged

#### Scenario: Storage rejects a duplicate insert

- **WHEN** a routine is inserted with a name matching an existing routine's name ignoring case
- **THEN** the storage layer rejects the insert

