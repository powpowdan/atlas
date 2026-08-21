## Purpose

Defines the seeded exercise catalog shipped by default and the versioned upgrade behavior that grows the library on existing installs without clobbering user modifications.

## ADDED Requirements

### Requirement: Default exercise catalog

The system SHALL seed a default catalog of approximately seventy gym-staple exercises spanning the seven canonical categories, including machine movements (e.g. leg press, hack squat, hip abduction, hip adduction, glute kickback). Seeding SHALL only insert exercises whose names do not already exist.

#### Scenario: Fresh install

- **WHEN** the app launches for the first time
- **THEN** the full default catalog is available, every seed exercise having a canonical category

#### Scenario: Existing rows are respected

- **WHEN** the seed runs on a database that already contains an exercise with the same name
- **THEN** the existing row is left unchanged (its category, archived state, and any user rename are preserved) and no duplicate is created

### Requirement: Versioned seed upgrades

The system SHALL version the seed catalog and apply newer seed versions to existing installs, so catalog growth reaches devices that already have data. Applied seed versions SHALL be recorded; a seed version SHALL not re-apply once recorded.

#### Scenario: Upgrade gains new exercises

- **WHEN** an install seeded with an older catalog version launches after a catalog expansion
- **THEN** the new exercises are added and previously existing rows are untouched

#### Scenario: Renamed exercise is not resurrected

- **WHEN** the user renamed a seed exercise (e.g. "Barbell curl" → "Curl") before an upgrade re-seed
- **THEN** the upgrade may re-add the original "Barbell curl" as a new row, and the user's renamed "Curl" row remains intact

#### Scenario: Archived exercise stays archived

- **WHEN** the user archived a seed exercise before an upgrade re-seed
- **THEN** the archived row remains archived after the upgrade

### Requirement: Legacy catalog migration

On upgrade, the system SHALL migrate legacy seed rows to the new catalog vocabulary: legacy exercise names SHALL be renamed to their catalog equivalents and legacy categories remapped (Core → Abs, Arms → Biceps or Triceps as appropriate per exercise, Bodyweight → Back), preserving all logged history. The `is_assisted` flag SHALL be removed.

#### Scenario: Legacy rename preserves history

- **WHEN** an existing install has logged sets against "Bench" and applies the upgrade
- **THEN** the exercise is renamed to "Barbell bench press", its category becomes "Chest", and all past sessions still reference it with history intact

#### Scenario: Assisted pullups migration

- **WHEN** an existing install has the legacy "Assisted" exercise
- **THEN** it is renamed to "Assisted pullups" under category "Back", preserving its history

#### Scenario: Assisted flag removal

- **WHEN** the upgrade applies
- **THEN** exercises no longer carry an assisted flag anywhere in the data model or UI
