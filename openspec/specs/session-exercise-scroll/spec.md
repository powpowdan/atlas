# session-exercise-scroll Specification

## Purpose

Keeps the current exercise identifiable while scrolling an active session by pinning each exercise's name to the top of the list until the next exercise displaces it.

## Requirements

### Requirement: Exercise name stays visible while its block scrolls
While a session has multiple exercises, the screen SHALL keep the exercise name of the block currently under view pinned to the top of the exercise list, so logged sets and the set-entry form are always associated with a visible exercise name.

#### Scenario: Scrolled deep into an exercise block
- **WHEN** the user scrolls past an exercise's name into its set list and entry form
- **THEN** that exercise's name remains visible pinned to the top of the list

#### Scenario: Next exercise scrolls into view
- **WHEN** the user scrolls far enough that the next exercise's header reaches the pinned header
- **THEN** the pinned header is pushed off and replaced by the next exercise's name

### Requirement: Sticky header remains interactive and legible
The pinned exercise name SHALL navigate to that exercise's detail screen when tapped, and SHALL be rendered with an opaque background so content scrolling beneath it does not show through.

#### Scenario: Tapping the pinned name
- **WHEN** the user taps the pinned exercise name
- **THEN** the app navigates to that exercise's detail screen

#### Scenario: Long exercise name
- **WHEN** the pinned exercise name is longer than the available header width
- **THEN** the name is truncated with an ellipsis rather than wrapping or overflowing

### Requirement: Existing per-exercise behavior is preserved
Adopting sticky exercise headers SHALL NOT change set logging, editing, deletion, reference chips, warmup toggling, note handling, or the add-exercise flow within each exercise block.

#### Scenario: Logging a set mid-scroll
- **WHEN** the user adds or edits a set while an exercise header is pinned
- **THEN** the set is saved to the pinned exercise and the list refreshes without losing scroll context unexpectedly
