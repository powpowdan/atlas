# undo Specification

## Purpose

Let users reverse small, frequent destructive actions — deleting a set, removing an exercise from a session — within a short time window, replacing the confirmation interrupt with an undo affordance.

## Requirements

### Requirement: Delete a set immediately with undo

The system SHALL delete a set immediately when the user requests it — in an in-progress session or in a completed session's edit mode — without a confirmation dialog, and SHALL then present an undo affordance for a limited time.

#### Scenario: Delete a set in a live session

- **WHEN** the user taps delete on a set in an in-progress session
- **THEN** the set is removed immediately and an undo affordance is presented

#### Scenario: Delete a set in history edit mode

- **WHEN** the user taps delete on a set while editing a completed session
- **THEN** the set is removed immediately and an undo affordance is presented

#### Scenario: Undo restores the set verbatim

- **WHEN** the user taps Undo within the time window
- **THEN** the set is restored with its original values (weight, reps, warmup flag, note) at its original position among the exercise's sets

#### Scenario: Undo expires

- **WHEN** the undo affordance's time window elapses without the user tapping Undo
- **THEN** the affordance disappears and the deletion is final

### Requirement: Remove an exercise from a session immediately with undo

The system SHALL remove an exercise — and with it all of that exercise's sets — immediately when the user requests it while editing a completed session, without a confirmation dialog, and SHALL then present an undo affordance for a limited time.

#### Scenario: Remove an exercise in history edit mode

- **WHEN** the user taps remove on an exercise while editing a completed session
- **THEN** the exercise and all of its sets are removed immediately and an undo affordance is presented

#### Scenario: Undo restores the exercise and its sets

- **WHEN** the user taps Undo within the time window
- **THEN** the exercise and all of its sets are restored with their original values at the exercise's original position in the session

#### Scenario: Undo expires

- **WHEN** the undo affordance's time window elapses without the user tapping Undo
- **THEN** the affordance disappears and the removal is final

### Requirement: Remove an exercise from a routine draft with undo

The system SHALL remove an exercise from the routine being edited immediately when the user requests it, without a confirmation dialog, and SHALL then present an undo affordance for a limited time. Undo SHALL re-add the exercise to the draft at its original position.

#### Scenario: Remove an exercise from the draft

- **WHEN** the user removes an exercise from the routine being edited
- **THEN** the exercise is removed from the draft immediately and an undo affordance is presented

#### Scenario: Undo restores the exercise to the draft

- **WHEN** the user taps Undo within the time window
- **THEN** the exercise is re-added to the draft at its original position among the selected exercises

### Requirement: Undo toast presentation

The undo affordance SHALL be presented as a transient toast that auto-dismisses after five seconds, styled with the app's theme, and positioned clear of safe areas. A new undoable deletion SHALL replace any pending toast and restart the window; only the most recent deletion SHALL be restorable.

#### Scenario: Toast auto-dismisses

- **WHEN** an undo toast has been visible for five seconds without interaction
- **THEN** the toast dismisses itself

#### Scenario: Rapid deletions replace the pending toast

- **WHEN** the user deletes a second set while an undo toast for a previous deletion is still visible
- **THEN** the toast now offers undo for the most recent deletion only, and the timer restarts

#### Scenario: Toast survives navigation

- **WHEN** an undo toast is visible and the user navigates to another screen within the time window
- **THEN** the toast remains visible and Undo still restores the deleted data
