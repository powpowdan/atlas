## Purpose

Reusable named workout templates composed of ordered exercises, so a user can start a session from a template instead of re-entering the exercise list each time.

## ADDED Requirements

### Requirement: Create a routine

The system SHALL allow the user to create a routine by providing a unique name and an ordered list of exercises drawn from the exercise library.

#### Scenario: Create a routine with exercises

- **WHEN** the user creates a routine named "Day 1" and adds the exercises Bench, Fly, and Ab crunch in that order
- **THEN** the routine is persisted with the name "Day 1" and the exercises stored in the specified order

#### Scenario: Reject a routine without a name

- **WHEN** the user attempts to save a routine with an empty name
- **THEN** the system rejects the save and shows a validation error

#### Scenario: Reuse an exercise in the same routine

- **WHEN** the user adds Bench twice to the same routine
- **THEN** both entries are stored as separate ordered items

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

The system SHALL allow the user to rename a routine and to add, remove, or reorder its exercises. Editing a routine SHALL NOT alter sessions that were previously started from it.

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

### Requirement: Delete a routine

The system SHALL allow the user to delete a routine. Deleting a routine SHALL NOT delete sessions that were previously started from it.

#### Scenario: Delete a routine

- **WHEN** the user deletes a routine and confirms
- **THEN** the routine and its exercise list are removed, and the routines list updates accordingly

#### Scenario: Deleting a routine preserves past sessions

- **WHEN** the user deletes a routine that has previously been used to start sessions
- **THEN** those past sessions remain viewable in history with their original exercise list intact
