## Purpose

Gate destructive actions behind a confirmation UI that matches the app's paper-and-ink visual identity, behaves identically on native and web, and never truncates long copy.

## ADDED Requirements

### Requirement: Themed confirmation sheet

The system SHALL present confirmation-gated destructive actions in an in-app bottom sheet styled with the app's theme, overlaid on a dimmed scrim. The system SHALL NOT use OS-native alert dialogs or browser-native `confirm`/`alert` for these actions.

#### Scenario: Themed appearance

- **WHEN** a confirmation is shown
- **THEN** the sheet uses the app's paper background, ink text, and a destructive action visually distinct in the app's destructive color, matching the app's typography

#### Scenario: Destructive action requires explicit confirmation

- **WHEN** the user invokes a confirmation-gated destructive action
- **THEN** no deletion occurs until the user taps the confirm action in the sheet

#### Scenario: Dismissal without action

- **WHEN** the user taps the cancel action, taps the scrim outside the sheet, or presses the hardware/software back button while the sheet is open
- **THEN** the sheet closes and the destructive action does not occur

#### Scenario: Confirm action is verb-labeled

- **WHEN** a confirmation sheet is shown
- **THEN** the confirm action is labeled with the specific verb of the action (e.g. "Delete", "Discard", "Remove", "Archive"), never a generic label such as "Confirm" or "OK"

#### Scenario: Long copy fits

- **WHEN** a confirmation's message is longer than the sheet can display at once
- **THEN** the message area scrolls within the sheet while the confirm and cancel actions remain visible without scrolling

#### Scenario: Identical behavior on web

- **WHEN** a confirmation-gated action is triggered on the web platform
- **THEN** the same themed sheet is presented, with no browser-native dialog involved

### Requirement: Confirmation invokable from any screen

The system SHALL provide a single app-wide confirmation mechanism usable from any screen without per-screen dialog state. The confirmation request SHALL communicate its result (confirmed or dismissed) back to the invoking code.

#### Scenario: Await a confirmation result

- **WHEN** a screen requests a confirmation and the user taps the confirm action
- **THEN** the requesting code proceeds with the destructive action

#### Scenario: Await a dismissal result

- **WHEN** a screen requests a confirmation and the user dismisses the sheet without confirming
- **THEN** the requesting code does not perform the destructive action
