## REMOVED Requirements

### Requirement: Contextual entry point from the exercise picker

**Reason**: The "Manage" action navigated away from the host screen mid-edit (e.g. displacing a half-built routine), and exercise management already has a persistent, always-visible entry point on the Routines tab. Keeping a second, more disruptive entry point in every picker added cost without value.

**Migration**: To manage exercises, use the "Exercise library" strip pinned below the routines list on the Routines tab. The picker's inline create ("+ New") remains available for adding a missing exercise without leaving the host screen.

## ADDED Requirements

### Requirement: Picker exit control reflects selection mode

The exercise picker's left header control SHALL be labeled "Done" when the picker applies selections live and supports selecting multiple exercises before exiting, and "Cancel" when the picker closes after a single selection. In multi-select mode, activating the control SHALL close the picker and keep all selections made so far; exiting SHALL NOT revert or discard them.

#### Scenario: Multi-select picker shows Done and keeps picks

- **WHEN** the user opens the exercise picker from the routine editor, taps several exercise rows, then activates the "Done" control in the header
- **THEN** the picker closes and every tapped exercise remains in the routine's exercise list

#### Scenario: Single-select picker keeps Cancel semantics

- **WHEN** the user opens the exercise picker from a session or history screen, taps no rows, and activates the header control
- **THEN** the picker closes and no exercise is added

#### Scenario: No management entry from the picker

- **WHEN** the exercise picker is open in any context
- **THEN** its header offers no action that navigates to the exercise management screen
