## ADDED Requirements

### Requirement: Next-set focus during logging

For each exercise being logged in an in-progress session with at least one qualifying session, the system SHALL visually distinguish the reference slot whose position equals the next working set to be logged (the count of working sets already logged in the current session, plus one): that slot SHALL be rendered with a focus treatment (filled background, bold text, emphasized border), slots at positions below it SHALL be rendered de-emphasized, and slots at positions above it SHALL retain their standard styling. Ghost styling SHALL compose with both treatments (a focused ghost keeps its dashed border and age indication; a dimmed ghost keeps its ghost indication). The focus position SHALL advance as working sets are logged and SHALL NOT change while editing an existing set. Warmup chips SHALL NOT receive focus, dimming, or count treatment. Tap-to-copy SHALL remain available on every slot regardless of focus or dim state.

#### Scenario: Cursor marks the next set

- **WHEN** the user has logged 2 working sets for the exercise and the reference shows working-set slots at positions 1 through 4
- **THEN** slot 3 is rendered with the focus treatment, slots 1 and 2 are de-emphasized, slot 4 retains standard styling, and every slot remains tap-to-copy

#### Scenario: Cursor falls on a ghost slot

- **WHEN** the next working set to log is position 4 and slot 4 is a ghost from an older qualifying session
- **THEN** slot 4 is rendered with the focus treatment while keeping its dashed border and session-age indication

#### Scenario: Cursor advances as sets are logged

- **WHEN** the user logs another working set and the reference list re-renders
- **THEN** the focus moves to the next position and the newly completed position is de-emphasized

#### Scenario: Next set beyond every slot

- **WHEN** the user has logged as many working sets as the highest existing slot position
- **THEN** no slot receives the focus treatment and all slots are de-emphasized

#### Scenario: Editing does not move the cursor

- **WHEN** the user is editing a previously logged set
- **THEN** the focus position still reflects the next set to be logged, not the set being edited

### Requirement: Next-set count label

The system SHALL display a compact label above the set-entry controls for each exercise being logged in an in-progress session, stating the next working set number. When the exercise has at least one qualifying session, the label SHALL read `Set N of Y`, where Y is the count of non-ghost working-set slots (the most recent qualifying session's working-set count), and SHALL NOT be inflated by ghost slots. When N exceeds Y, the label SHALL read `Set N — beyond last time`. When the exercise has no qualifying sessions, the label SHALL read `Set N`. Warmup sets SHALL NOT affect N or Y.

#### Scenario: Within last time's sets

- **WHEN** the user has logged 2 working sets and the most recent qualifying session had 5 working sets
- **THEN** the label reads "Set 3 of 5"

#### Scenario: Ghost slots do not inflate the count

- **WHEN** the most recent qualifying session had 3 working sets and slot 4 ghosts in from an older session
- **THEN** after logging 3 working sets the label reads "Set 4 — beyond last time" even though a slot 4 chip is displayed

#### Scenario: No history

- **WHEN** the exercise has no qualifying sessions and the user has logged 1 working set
- **THEN** the label reads "Set 2"

#### Scenario: Warmups excluded from the count

- **WHEN** the user logs a warmup set as their first set of the exercise
- **THEN** the label still reads "Set 1 of Y" (or the no-history variant), unaffected by the warmup
