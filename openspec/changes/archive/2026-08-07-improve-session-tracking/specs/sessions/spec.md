## ADDED Requirements

### Requirement: Discard an in-progress session

The system SHALL allow the user to discard an in-progress session, removing it and all of its exercises and sets entirely. Discarding the session that is currently the active session SHALL also clear the active-session pointer. The system SHALL require an explicit confirmation before discarding, because the action is destructive and cannot be undone.

#### Scenario: Discard the active session

- **WHEN** the user discards the in-progress session that is currently active and confirms
- **THEN** the session and all of its exercises and sets are removed, the active-session pointer is cleared, and the user is returned to the start-session prompt

#### Scenario: Discard requires confirmation

- **WHEN** the user chooses to discard an in-progress session
- **THEN** the system asks for confirmation and performs no deletion until the user confirms

#### Scenario: Completing one session does not resurrect an orphan

- **WHEN** two in-progress sessions exist and the user completes or discards the most recent one
- **THEN** the remaining in-progress session is not silently surfaced as the active session without the user choosing to resume it

### Requirement: Delete a completed session

The system SHALL allow the user to delete a completed session from history, removing it and all of its exercises and sets entirely. The system SHALL require an explicit confirmation before deletion, because the action is destructive and cannot be undone.

#### Scenario: Delete from history

- **WHEN** the user deletes a completed session from the history detail view and confirms
- **THEN** the session and all of its exercises and sets are removed, and the user is returned to the history list which no longer shows that session

#### Scenario: Delete requires confirmation

- **WHEN** the user chooses to delete a completed session
- **THEN** the system asks for confirmation and performs no deletion until the user confirms

#### Scenario: Deletion recomputes tracking

- **WHEN** the user deletes a completed session whose sets included an exercise's best or most-reps set
- **THEN** subsequent best, most-reps, and last-session values for that exercise reflect the remaining sets only
