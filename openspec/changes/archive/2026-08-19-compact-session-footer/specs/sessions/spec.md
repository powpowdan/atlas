## MODIFIED Requirements

### Requirement: Keyboard does not obscure set entry

The session screen SHALL keep the focused set entry input visible above the
on-screen keyboard on Android and iOS whenever an input is focused. For the
bottom-most exercise in the session, visibility SHALL extend beyond the
weight/reps inputs to the complete set-entry form — including the set note
input and the Add set action — so the user can log a set without scrolling.

#### Scenario: Focus weight input on the last exercise

- **WHEN** the user scrolls to the bottom-most exercise and taps its Weight input
- **THEN** the keyboard opens
- **AND** the focused input (and its Reps companion) remain visible above the keyboard
- **AND** the exercise name header for that exercise remains identifiable on screen

#### Scenario: Full set-entry form reachable on the last exercise

- **WHEN** the keyboard is open on the bottom-most exercise's weight or reps input
- **THEN** the set note input and the Add set button are visible above the keyboard
- **AND** the user can tap Add set on the first press without scrolling

#### Scenario: Keyboard stays open while operating controls

- **WHEN** the keyboard is open and the user taps Add set, a reference chip, or a
  set row edit/delete button
- **THEN** the tap takes effect on first press without the first press merely
  dismissing the keyboard

#### Scenario: Reps to weight navigation

- **WHEN** the user presses Next on the Weight input
- **THEN** focus moves to the Reps input, which remains visible above the keyboard

#### Scenario: No regression on iOS

- **WHEN** the user focuses any set entry input on iOS
- **THEN** keyboard avoidance behavior is unchanged from before this change

## ADDED Requirements

### Requirement: Compact session footer

The in-progress session screen SHALL render its session-level actions (complete
and discard) in a single row, with the complete action visually dominant. The
footer SHALL NOT be visible while the on-screen keyboard is open, and SHALL
return when the keyboard dismisses without leaving residual blank space below
it.

#### Scenario: Footer occupies one row when idle

- **WHEN** the session screen is displayed with no keyboard open
- **THEN** the complete and discard actions appear side by side in one row
- **AND** the footer does not extend below the screen's safe area

#### Scenario: Footer hidden while logging

- **WHEN** the on-screen keyboard is open on any set entry input
- **THEN** neither the complete nor the discard action is visible
- **AND** the space they occupied is given to the exercise list

#### Scenario: Footer returns cleanly after keyboard dismiss

- **WHEN** the user dismisses the keyboard after logging a set
- **THEN** the complete and discard actions are visible again in one row
- **AND** no residual blank gap remains below the footer or at the bottom of the screen

#### Scenario: Footer actions unchanged

- **WHEN** the user taps complete or discard from the compact footer
- **THEN** each action behaves exactly as before, including discard confirmation
