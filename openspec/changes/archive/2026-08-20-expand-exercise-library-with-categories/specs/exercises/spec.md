## MODIFIED Requirements

### Requirement: List exercises for picking

The system SHALL provide a list of exercises suitable for picking when adding an exercise to a session or routine. The list SHALL exclude archived exercises by default. The system MAY offer a parameter to include archived exercises for management views.

#### Scenario: Picker excludes archived exercises

- **WHEN** an exercise has been archived and the user opens an exercise picker
- **THEN** the archived exercise does not appear in the picker

#### Scenario: Management view includes archived exercises

- **WHEN** the user opens the exercise management screen with the Archived filter selected
- **THEN** archived exercises are shown grouped under their categories, visually distinguished (dimmed) from active exercises

### Requirement: Create an exercise

The system SHALL allow the user to create a new exercise with a unique name and a required category. The category SHALL be selected from the canonical categories or a user-created category; there SHALL be no way to save an exercise without a category. Names SHALL be unique case-insensitively. Creating an exercise whose name already exists SHALL fail with a clear "already exists" indication rather than a generic error.

#### Scenario: Create with a canonical category

- **WHEN** the user submits a new exercise named "Front squat" with category "Legs" selected from the canonical chips
- **THEN** the exercise is persisted and appears in subsequent pickers

#### Scenario: Create with a custom category

- **WHEN** the user creates the inline category "Forearms" in the editor and saves a new exercise with that category
- **THEN** the exercise is persisted under "Forearms" and the category becomes available in subsequent category selections

#### Scenario: Category is required

- **WHEN** the user attempts to save a new exercise without selecting a category
- **THEN** the system rejects the save with a clear indication that a category is required

#### Scenario: Reject a duplicate name

- **WHEN** the user submits an exercise named "Bench" and an exercise with that name already exists
- **THEN** the system rejects the creation and surfaces a clear "an exercise with this name already exists" message, leaving the existing exercise unchanged

#### Scenario: Name uniqueness is case-insensitive

- **WHEN** an exercise named "Bench" exists and the user submits "bench"
- **THEN** the system treats the names as equal and rejects the duplicate

### Requirement: Edit an exercise

The system SHALL allow the user to edit an existing exercise's name and category. The category SHALL be selected from the canonical categories or a user-created category, using the same selection mechanism as creation. Edits SHALL apply in place to the existing row; past sessions, the progression chart, and routines that reference the exercise SHALL reflect the updated values without historical rename tracking.

#### Scenario: Rename an exercise

- **WHEN** the user renames "Bench" to "Bench press" and saves
- **THEN** the exercise appears as "Bench press" in pickers, in past session detail views, on the progression chart, and in any routine that contains it

#### Scenario: Change category

- **WHEN** the user changes an exercise's category from "Chest" to "Shoulders" and saves
- **THEN** the exercise appears under "Shoulders" in the manage screen and picker, and only the category changes

#### Scenario: Edit an uncategorized legacy exercise

- **WHEN** the user edits an exercise that has no category (created before categories were required) and saves
- **THEN** the save requires a category to be selected, same as creation

#### Scenario: Edit rejects a name collision

- **WHEN** the user renames an exercise to a name that already belongs to another exercise
- **THEN** the system rejects the save with a clear "an exercise with this name already exists" message and leaves both exercises unchanged
