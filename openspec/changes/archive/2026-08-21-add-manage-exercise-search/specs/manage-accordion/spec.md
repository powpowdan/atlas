## ADDED Requirements

### Requirement: Search overrides and restores expansion state

While a search query is active on the manage screen, matching sections SHALL render expanded regardless of the user's per-visit expansion state, and the accordion's expand/collapse animations and chevron rotation SHALL continue to operate normally as sections appear and disappear. The user's expansion state SHALL be preserved while the query is active and SHALL be restored unchanged when the query is cleared, including after reveal-on-create expanded a section during the search. Reveal-on-create SHALL remain a no-op when the created exercise's category is filtered out by the active query (the scroll target is not rendered).

#### Scenario: Sections expand under an active query

- **WHEN** the user types a query and matching sections appear
- **THEN** those sections render expanded without requiring taps, with the standard animations playing as they enter

#### Scenario: Prior expansion state survives the search

- **WHEN** the user had expanded Chest, performs a search, and then clears the query
- **THEN** Chest is expanded again and every other section is in its pre-search state

#### Scenario: Reveal-on-create during a filtering query

- **WHEN** the user creates an exercise whose category does not match the active query's filtered sections
- **THEN** no scroll occurs and no error is raised; the reveal silently no-ops
