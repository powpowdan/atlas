## Purpose

Defines the category vocabulary for exercises: the canonical categories and their display order, required category selection, user-created categories, and category-grouped presentation of the library in the manage screen and the exercise picker.

## ADDED Requirements

### Requirement: Canonical categories and ordering

The system SHALL define a canonical set of exercise categories — Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs — presented in that conventional muscle-group order wherever categories are listed or grouped.

#### Scenario: Canonical order in the manage screen

- **WHEN** the user opens the exercise manage screen
- **THEN** category sections appear in the order Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs, with user-created categories after them, alphabetically

#### Scenario: Canonical order in the editor

- **WHEN** the user opens the exercise editor's category selection
- **THEN** the canonical categories are offered as chips in conventional muscle-group order, followed by user-created categories alphabetically

### Requirement: User-created categories

The system SHALL allow the user to create additional categories inline from the exercise editor. A user-created category SHALL behave identically to a canonical one for selection, grouping, and ordering (sorted alphabetically after the canonical seven).

#### Scenario: Create a category inline

- **WHEN** the user activates the inline "new category" affordance in the editor, types "Forearms", and confirms
- **THEN** "Forearms" becomes the selected category for the exercise being edited and appears as a chip option in subsequent category selections

#### Scenario: Custom category groups in the library

- **WHEN** at least one exercise belongs to a user-created category
- **THEN** the manage screen shows that category as its own expandable section, ordered after the canonical categories

### Requirement: Category-grouped manage screen

The system SHALL present the exercise manage screen as an accordion of category sections. Each section header SHALL show the category name and its exercise count, and expand to reveal that category's exercises with their edit and archive/restore actions. The screen SHALL provide an `[Active | Archived]` filter toggle: Active shows only active exercises, Archived shows only archived ones (dimmed), both grouped by category.

#### Scenario: Expand a category

- **WHEN** the user taps a collapsed category header
- **THEN** the section expands in place to reveal its exercises with edit and archive actions

#### Scenario: Filter to archived

- **WHEN** the user selects the Archived filter
- **THEN** only archived exercises are listed, grouped under their categories and visually dimmed, with restore actions

#### Scenario: Empty categories are hidden

- **WHEN** a category has no exercises under the current filter
- **THEN** that category section is not shown

### Requirement: Category-grouped picker

The system SHALL present the exercise picker with exercises grouped under category headers. The picker's search SHALL filter exercises by name across all groups, hiding groups that contain no matches. Archived exercises SHALL never appear.

#### Scenario: Grouped browsing

- **WHEN** the user opens the picker with an empty search
- **THEN** exercises are listed under their category headers, categories in canonical order

#### Scenario: Search filters across groups

- **WHEN** the user types "squ" and only Leg exercises match
- **THEN** only the Legs group (with its matches) is shown
