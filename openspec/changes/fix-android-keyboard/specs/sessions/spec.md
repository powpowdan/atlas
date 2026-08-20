## MODIFIED Requirements

### Requirement: Keyboard does not obscure set entry

The session screen SHALL keep the weight/reps set entry inputs visible above the
on-screen keyboard on Android and iOS whenever an input is focused.

#### Scenario: Focus weight input on the last exercise

- **WHEN** the user scrolls to the bottom-most exercise and taps its Weight input
- **THEN** the keyboard opens
- **AND** the focused input (and its Reps companion) remain visible above the keyboard
- **AND** the exercise name header for that exercise remains identifiable on screen

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
