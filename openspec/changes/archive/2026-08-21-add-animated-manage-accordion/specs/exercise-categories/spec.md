## MODIFIED Requirements

### Requirement: Category-grouped manage screen

The system SHALL present the exercise manage screen as an accordion of category sections. Each section header SHALL show the category name and its exercise count, and expand or collapse its section with a smooth height animation (both directions), with the header's chevron rotating between orientations rather than switching glyphs. The screen SHALL provide an `[Active | Archived]` filter toggle: Active shows only active exercises, Archived shows only archived ones (dimmed), both grouped by category. After creating a new exercise, its category section SHALL be expanded and scrolled into view automatically.

#### Scenario: Expand a category

- **WHEN** the user taps a collapsed category header
- **THEN** the section expands in place with an animated height transition to reveal that category's exercises with their edit and archive actions

#### Scenario: Filter to archived

- **WHEN** the user selects the Archived filter
- **THEN** only archived exercises are listed, grouped under their categories and visually dimmed, with restore actions

#### Scenario: Empty categories are hidden

- **WHEN** a category has no exercises under the current filter
- **THEN** that category section is not shown

#### Scenario: New exercise is revealed after creation

- **WHEN** the user creates a new exercise from the manage screen and the editor closes
- **THEN** its category section is expanded and scrolled into view, with the new exercise visible
