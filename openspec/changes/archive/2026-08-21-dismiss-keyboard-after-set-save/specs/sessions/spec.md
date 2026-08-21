## ADDED Requirements

### Requirement: Keyboard dismisses after saving a set

After a set is successfully saved on the active session screen or the history editor — via the save button, the update button, or the reps keyboard action — the system SHALL dismiss the on-screen keyboard. When the save is rejected due to invalid input, the keyboard SHALL remain open so the user can correct the entry in place. Dismissal SHALL NOT affect carry-forward prefill of the next set's weight and reps.

#### Scenario: Add set via the save button

- **WHEN** the keyboard is open and the user taps Add set with valid weight and reps
- **THEN** the set is persisted and the keyboard closes without requiring an additional tap or gesture

#### Scenario: Add set via the keyboard action

- **WHEN** the user presses the keyboard's action key on the reps input with valid values
- **THEN** the set is persisted and the keyboard closes

#### Scenario: Update an existing set

- **WHEN** the user edits a logged set and saves the change with valid values
- **THEN** the update is persisted and the keyboard closes

#### Scenario: Validation failure keeps the keyboard open

- **WHEN** the user attempts to save a set with missing or invalid weight or reps
- **THEN** the save is rejected with a validation error and the keyboard remains open

#### Scenario: History editor dismisses the keyboard after save

- **WHEN** the user adds or updates a set in the history editor with valid values
- **THEN** the change is persisted and the keyboard closes

#### Scenario: Carry-forward survives dismissal

- **WHEN** the keyboard closes after adding a set
- **THEN** the weight and reps inputs are prefilled with the just-saved set's values

#### Scenario: Dragging the session list dismisses the keyboard

- **WHEN** the keyboard is open on the active session screen and the user scrolls the exercise list
- **THEN** the keyboard closes
