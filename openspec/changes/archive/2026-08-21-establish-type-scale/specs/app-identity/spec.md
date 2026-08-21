## MODIFIED Requirements

### Requirement: Display typography uses Fraunces

The app SHALL use the Fraunces typeface only for the ATLAS wordmark (rendered in uppercase with letter-spacing) and screen titles, always as the single 600 weight with no additional weight declared. All other text — including hero numerals (large weight/reps/volume figures) and dense data (set logs, lists, metadata) — SHALL use the system font, with tabular figure alignment on all numeric text. Full role definitions (sizes, weights, tracking, line heights) SHALL come from the typography capability's type scale.

#### Scenario: Wordmark rendering

- **WHEN** the app name is displayed as a wordmark (splash-adjacent UI or headers where the title is the app name)
- **THEN** it renders in Fraunces, uppercase, letter-spaced

#### Scenario: Numerals stay aligned in dense data

- **WHEN** set rows, session summaries, or chart axis labels render numeric data
- **THEN** digits align in columns using tabular figures with the system font

#### Scenario: Hero numerals are not Fraunces

- **WHEN** a hero figure such as the session-summary total volume renders
- **THEN** it renders in the system font with tabular figures, not in Fraunces
