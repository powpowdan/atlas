## ADDED Requirements

### Requirement: Type-to-filter search in the exercise management screen

The exercise management screen SHALL provide a search input that filters the visible exercises by name as the user types, styled consistently with the exercise picker's search. The filter SHALL be case-insensitive and SHALL match on substring, using the same matching behavior as the picker. The filter SHALL compose with the Active/Archived toggle: the query filters within whichever filter is selected. While a query is active, category sections containing matches SHALL be shown automatically expanded (their headers, counts, and category actions remain available) and sections with no matches SHALL be hidden; clearing the query SHALL restore the normal accordion with the user's prior expansion state intact. Row actions SHALL respond to a first tap while the on-screen keyboard is open.

#### Scenario: Filter narrows sections

- **WHEN** the manage screen shows Chest and Legs sections and the user types "squ"
- **THEN** only the Legs section is shown, already expanded, containing the matching exercises with their row actions

#### Scenario: Case-insensitive substring

- **WHEN** the user types "BENCH"
- **THEN** exercises whose names contain "bench" (any casing) are shown

#### Scenario: Search composes with the Archived filter

- **WHEN** the user selects the Archived filter and types "curl"
- **THEN** only archived exercises whose names contain "curl" are shown, grouped under their categories

#### Scenario: No matches

- **WHEN** the user types a query that matches no exercises under the current filter
- **THEN** the screen shows a distinct no-match empty state referencing the query

#### Scenario: Clearing the query restores expansion state

- **WHEN** the user clears the search after searching
- **THEN** all sections return, and each section's expanded/collapsed state is what it was before the search began

#### Scenario: First tap works while keyboard is open

- **WHEN** the on-screen keyboard is open in the search field and the user taps a row's Edit or Archive action
- **THEN** the action fires on the first tap without the first press merely dismissing the keyboard
