## Purpose

Manage the user's exercise library: list, create, edit, archive, and restore exercises. Establishes soft-delete (archive) semantics so the picker for new work stays clean while history and progression remain intact.

## Requirements

### Requirement: List exercises for picking

The system SHALL provide a list of exercises suitable for picking when adding an exercise to a session or routine. The list SHALL exclude archived exercises by default. The system MAY offer a parameter to include archived exercises for management views.

#### Scenario: Picker excludes archived exercises

- **WHEN** an exercise has been archived and the user opens an exercise picker
- **THEN** the archived exercise does not appear in the picker

#### Scenario: Management view includes archived exercises

- **WHEN** the user opens the exercise management screen
- **THEN** both active and archived exercises are shown, with archived exercises visually distinguished from active ones

### Requirement: Create an exercise

The system SHALL allow the user to create a new exercise with a unique name, an optional category, and an optional assisted flag. Names SHALL be unique case-insensitively. Creating an exercise whose name already exists SHALL fail with a clear "already exists" indication rather than a generic error.

#### Scenario: Create with a new name

- **WHEN** the user submits a new exercise named "Front squat" with category "Legs"
- **THEN** the exercise is persisted and appears in subsequent pickers

#### Scenario: Reject a duplicate name

- **WHEN** the user submits an exercise named "Bench" and an exercise with that name already exists
- **THEN** the system rejects the creation and surfaces a clear "an exercise with this name already exists" message, leaving the existing exercise unchanged

#### Scenario: Name uniqueness is case-insensitive

- **WHEN** an exercise named "Bench" exists and the user submits "bench"
- **THEN** the system treats the names as equal and rejects the duplicate

### Requirement: Edit an exercise

The system SHALL allow the user to edit an existing exercise's name, category, and assisted flag. Edits SHALL apply in place to the existing row; past sessions, the progression chart, and routines that reference the exercise SHALL reflect the updated values without historical rename tracking.

#### Scenario: Rename an exercise

- **WHEN** the user renames "Bench" to "Bench press" and saves
- **THEN** the exercise appears as "Bench press" in pickers, in past session detail views, on the progression chart, and in any routine that contains it

#### Scenario: Editing category only

- **WHEN** the user changes an exercise's category from "Chest" to "Push" and saves
- **THEN** only the category changes; name and assisted flag remain as they were

#### Scenario: Edit rejects a name collision

- **WHEN** the user renames an exercise to a name that already belongs to another exercise
- **THEN** the system rejects the save with a clear "an exercise with this name already exists" message and leaves both exercises unchanged

### Requirement: Archive an exercise

The system SHALL allow the user to archive an exercise. Archiving SHALL be a soft delete: the exercise's `archived_at` field is set to the current time, and the exercise becomes hidden from pickers for new work, but is preserved in past session detail views, on the progression chart, and in routines that already contain it.

#### Scenario: Archive hides from pickers

- **WHEN** the user archives an exercise and then opens an exercise picker
- **THEN** the archived exercise does not appear

#### Scenario: Archive preserves history

- **WHEN** the user archives an exercise that has been logged in past sessions
- **THEN** those past session detail views still show the exercise by its stored name, and the progression chart still plots its history

#### Scenario: Archive preserves routine membership

- **WHEN** the user archives an exercise that is part of a routine
- **THEN** the routine's exercise list still includes the exercise, and sessions started from that routine still pre-populate it

### Requirement: Restore an archived exercise

The system SHALL allow the user to restore an archived exercise. Restoring SHALL clear `archived_at`, returning the exercise to active pickers.

#### Scenario: Restore returns to pickers

- **WHEN** the user restores an archived exercise and then opens an exercise picker
- **THEN** the exercise appears again

### Requirement: Persistent entry point for exercise management

The system SHALL expose a persistent entry point to the exercise management screen from both the Sessions tab and the Routines tab. The entry point SHALL remain reachable regardless of whether any routines exist.

#### Scenario: Reach management from Sessions tab

- **WHEN** the user is on the Sessions tab and activates the management affordance
- **THEN** the exercise management screen opens

#### Scenario: Reach management from Routines tab when routines exist

- **WHEN** the user is on the Routines tab and at least one routine exists, and the user activates the management affordance
- **THEN** the exercise management screen opens (the entry point is no longer hidden behind the routines empty-state)

### Requirement: Type-to-filter search in the exercise picker

The exercise picker SHALL provide a search input that filters the visible exercises by name as the user types. The filter SHALL be case-insensitive and SHALL match on substring.

#### Scenario: Filter by substring

- **WHEN** the picker shows "Bench", "Front squat", "Back squat" and the user types "squ"
- **THEN** the picker shows "Front squat" and "Back squat", excluding "Bench"

#### Scenario: Empty filter shows all

- **WHEN** the search input is empty
- **THEN** the picker shows all active exercises in their default order

### Requirement: Inline create from the exercise picker

The exercise picker SHALL provide an inline affordance to create a new exercise without leaving the host screen. Activating the affordance SHALL open a stacked create-modal; on successful creation, the host picker's list SHALL refresh to include the new exercise.

#### Scenario: Create from inside a session's add-exercise picker

- **WHEN** the user is adding an exercise to an in-progress session, does not find the exercise in the picker, activates the inline create affordance, fills in a new exercise name, and saves
- **THEN** the new exercise is persisted, the create-modal closes, and the host picker list refreshes to include the new exercise

#### Scenario: Create from inside the routine editor's picker

- **WHEN** the user is editing a routine, activates the inline create affordance from the picker, and creates a new exercise
- **THEN** the new exercise is persisted and the routine editor's picker list refreshes to include it

#### Scenario: Cancel inline create

- **WHEN** the user activates the inline create affordance and dismisses the create-modal without saving
- **THEN** no exercise is created and the host picker is unchanged
