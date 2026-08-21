## MODIFIED Requirements

### Requirement: Persistent entry point for exercise management

The system SHALL expose a persistent entry point to the exercise management screen from the Routines tab, as a fixed "Exercise library" strip pinned below the routines list. The entry point SHALL remain visible and reachable regardless of whether any routines exist or how long the routines list is. The exercise management screen SHALL be titled "Exercise library".

#### Scenario: Reach management from Routines tab when routines exist

- **WHEN** the user is on the Routines tab and at least one routine exists, and the user activates the "Exercise library" strip below the routines list
- **THEN** the exercise management screen opens (the entry point is not hidden behind the routines empty-state)

#### Scenario: Reach management from Routines tab when no routines exist

- **WHEN** the user is on the Routines tab and no routines exist, and the user activates the "Exercise library" strip below the empty state
- **THEN** the exercise management screen opens

#### Scenario: Entry point stays visible with a long routines list

- **WHEN** the user is on the Routines tab with more routines than fit on screen
- **THEN** the "Exercise library" strip remains fixed below the scrolling list, visible without scrolling

#### Scenario: Sessions tab has no management entry point

- **WHEN** the user is on the Sessions tab
- **THEN** no exercise management entry point is shown in the tab header (creating an exercise mid-session remains available via the exercise picker's "New" action)

## ADDED Requirements

### Requirement: Contextual entry point from the exercise picker

The system SHALL expose a "Manage" action in the exercise picker modal header. Activating it SHALL close the picker and open the exercise management screen.

#### Scenario: Open management from the picker

- **WHEN** the exercise picker modal is open and the user activates the "Manage" action in its header
- **THEN** the picker closes and the exercise management screen opens
