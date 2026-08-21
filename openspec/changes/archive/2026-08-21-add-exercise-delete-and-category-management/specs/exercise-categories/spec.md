## MODIFIED Requirements

### Requirement: User-created categories

The system SHALL allow the user to create additional categories inline from the exercise editor. A user-created category SHALL behave identically to a canonical one for selection, grouping, and ordering (sorted alphabetically after the canonical seven). A user-created category SHALL appear as a chip option in the editor only while at least one active exercise is assigned to it, or while it is assigned to the exercise currently being edited; once every exercise in the category is archived or deleted, the category SHALL no longer be offered as a chip. Canonical categories SHALL always remain available as chips regardless of exercise assignments.

#### Scenario: Create a category inline

- **WHEN** the user activates the inline "new category" affordance in the editor, types "Forearms", and confirms
- **THEN** "Forearms" becomes the selected category for the exercise being edited and appears as a chip option in subsequent category selections

#### Scenario: Custom category groups in the library

- **WHEN** at least one exercise belongs to a user-created category
- **THEN** the manage screen shows that category as its own expandable section, ordered after the canonical categories

#### Scenario: Category chip disappears when unused by active exercises

- **WHEN** every exercise assigned to user-created category "Forearms" is archived or deleted
- **THEN** "Forearms" no longer appears as a chip in the exercise editor for new exercises

#### Scenario: Edited exercise keeps its own category chip

- **WHEN** the user edits an archived exercise whose category has no other active exercises
- **THEN** that category still appears as a chip in the editor so the current assignment remains visible and selectable

#### Scenario: Canonical categories never disappear

- **WHEN** no active exercise is assigned to "Triceps"
- **THEN** "Triceps" still appears as a chip in the exercise editor

## ADDED Requirements

### Requirement: Rename or merge a category

The system SHALL allow the user to rename a category from the exercise management screen's category section header. Renaming SHALL apply to every exercise assigned to the category, active and archived alike, in a single operation. Renaming a category to an existing category's name SHALL merge the two categories: all exercises move to the target category and the source category disappears. The merge target's name SHALL be offered from canonical and existing categories. Renaming or merging SHALL affect how past sessions display their exercises' categories, consistent with existing rename semantics.

#### Scenario: Rename fixes a typo

- **WHEN** the user renames category "Chset" to "Chest" and confirms
- **THEN** all exercises previously in "Chset" now appear under "Chest" in the manage screen, pickers, and editor chips

#### Scenario: Merge into an existing category

- **WHEN** the user renames category "Arms" to the existing category "Biceps"
- **THEN** every exercise from "Arms" moves to "Biceps", and "Arms" no longer appears anywhere

#### Scenario: Rename applies to archived exercises too

- **WHEN** the user renames a category that contains archived exercises
- **THEN** those archived exercises move to the renamed category and appear under it in the Archived filter

#### Scenario: Canonical category names are valid merge targets

- **WHEN** the user merges a user-created category into a canonical category such as "Legs"
- **THEN** the merge succeeds and the canonical category remains available as a chip

### Requirement: Delete an empty category

The system SHALL offer a Delete action alongside Rename on every category section header in the exercise management screen, under both the Active and Archived filters. Deletion SHALL be permitted only when zero exercises — active or archived — are assigned to the category; because categories exist only through referencing exercises, a category with zero references disappears from all listings once deletion completes. When the category has any referencing exercise, the system SHALL block deletion and clearly state how many exercises (including archived ones) still reference it, with guidance to merge the category into another or delete its remaining (archived) exercises first.

#### Scenario: Deletion is blocked while exercises remain

- **WHEN** the user activates Delete on a category section that still has 2 archived exercises assigned
- **THEN** the system blocks deletion and reports that 2 exercises (including archived) still reference the category, with guidance to merge or delete them first

#### Scenario: Delete succeeds with no remaining references

- **WHEN** the user activates Delete on a rendered category section whose exercises were all deleted after the list was rendered, and confirms
- **THEN** the category no longer appears in the editor chips, section listings, or anywhere else

#### Scenario: Starved categories vanish without explicit delete

- **WHEN** the last exercise referencing a user-created category is archived or deleted
- **THEN** the category disappears from the editor chips and the Active filter automatically, without a separate category-deletion step

#### Scenario: Full cleanup flow for a junk category

- **WHEN** a user-created category's only exercise is archived, and the user deletes that archived exercise from the Archived filter
- **THEN** the category's section disappears from the Archived filter and the category no longer appears anywhere

### Requirement: Fuzzy suggestion on new category

When the user types a new category name in the editor, the system SHALL compare the normalized input (case-insensitive, non-alphanumeric characters stripped) against existing category names and SHALL warn with a "did you mean …?" suggestion naming the closest existing category when a near-match is found. The user SHALL be able to accept the suggestion or keep their typed name. Exact matches under normalization SHALL behave as the existing case-insensitive duplicate check does (select the existing category rather than creating a duplicate).

#### Scenario: Typo triggers a suggestion

- **WHEN** the category "Chest" exists and the user types "Chset"
- **THEN** the editor offers "Did you mean 'Chest'?" and creating "Chset" requires the user to decline the suggestion

#### Scenario: Case and punctuation differences normalize

- **WHEN** the category "Legs" exists and the user types "legs!" or "LEGS"
- **THEN** the editor selects the existing "Legs" category instead of creating a duplicate

#### Scenario: Unrelated names create freely

- **WHEN** the user types "Forearms" and no similar category exists
- **THEN** the category is created inline without any suggestion prompt
