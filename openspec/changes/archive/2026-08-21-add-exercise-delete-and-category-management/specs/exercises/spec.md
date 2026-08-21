## ADDED Requirements

### Requirement: Delete an archived exercise

The system SHALL allow the user to permanently delete an archived exercise from the exercise management screen. Deletion SHALL require an explicit confirmation because it cannot be undone. On deletion, the system SHALL preserve past session history by retaining a frozen snapshot of the exercise's name and category on each session-exercise row that referenced it; past session detail views SHALL render from this snapshot exactly as before deletion. Deletion SHALL remove the exercise's routine memberships; the progression chart and pickers SHALL no longer include the exercise. The delete action SHALL be offered only on archived exercises, never on active ones (active exercises offer archive instead).

#### Scenario: Delete an archived exercise with history

- **WHEN** the user deletes an archived exercise that was logged in past sessions and confirms
- **THEN** the exercise is removed from the library, and past session detail views still display the exercise's name and category from the frozen snapshot

#### Scenario: Delete removes routine membership

- **WHEN** the user deletes an archived exercise that belongs to a routine and confirms
- **THEN** the exercise no longer appears in that routine's exercise list

#### Scenario: Delete requires confirmation

- **WHEN** the user activates Delete on an archived exercise
- **THEN** the system asks for confirmation and performs no deletion until the user confirms

#### Scenario: Active exercises offer no delete

- **WHEN** the user views an active (non-archived) exercise in the management screen
- **THEN** no Delete action is offered for it

#### Scenario: Delete is unavailable while archived history exists only as snapshot

- **WHEN** an exercise has been deleted and the user browses a past session containing it
- **THEN** the session displays the exercise's snapshot name and category, and the exercise cannot be re-added, edited, or restored from that view
