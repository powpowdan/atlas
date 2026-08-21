# data-integrity Specification

## Purpose

Guarantee database-level referential integrity: foreign-key constraints enforced on every connection, and legacy orphaned rows purged once so documented cascade-delete behavior is literally true at the storage level.

## Requirements

### Requirement: Foreign keys enforced on every connection

The system SHALL enable SQLite foreign-key enforcement on every database connection. Cascading deletes declared in the schema SHALL take effect: deleting a session SHALL delete its session exercises and sets; deleting a session exercise SHALL delete its sets; deleting a routine SHALL delete its routine-exercise entries.

#### Scenario: Deleting a session removes its exercises and sets

- **WHEN** a session is deleted
- **THEN** its session-exercise rows and their sets are also removed from the database

#### Scenario: Deleting a routine removes its exercise list

- **WHEN** a routine is deleted
- **THEN** its routine-exercise entries are also removed from the database

#### Scenario: Orphans cannot accumulate after enforcement

- **WHEN** any parent row is deleted through the app
- **THEN** no child rows referencing it remain in the database

### Requirement: One-time purge of legacy orphan rows

The system SHALL run a one-time migration that deletes pre-existing orphaned child rows — sets whose session exercise no longer exists, session exercises whose session no longer exists, and routine exercises whose routine no longer exists.

#### Scenario: Upgrade purges legacy orphans

- **WHEN** the app upgrades from a version without foreign-key enforcement and the database contains orphaned rows
- **THEN** the migration removes those orphaned rows and they do not reappear
