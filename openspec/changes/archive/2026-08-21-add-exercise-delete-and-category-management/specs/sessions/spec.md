## ADDED Requirements

### Requirement: Session detail survives exercise deletion

The system SHALL render past session detail views correctly after a referenced exercise has been permanently deleted. Each session-exercise row SHALL capture the exercise's name and category at deletion time, and session detail views SHALL display the captured values whenever the original exercise no longer exists. While the exercise still exists, session detail SHALL continue to display the exercise's current live name and category, preserving existing rename-propagation behavior.

#### Scenario: View a session after its exercise was deleted

- **WHEN** the user opens a past session that included an exercise later deleted via exercise deletion
- **THEN** the session detail displays the exercise's frozen name and category captured at deletion time, with all its logged sets intact

#### Scenario: Live exercises keep rename propagation

- **WHEN** an exercise referenced by a past session is renamed (not deleted)
- **THEN** the past session detail displays the exercise's new current name, as before this change
