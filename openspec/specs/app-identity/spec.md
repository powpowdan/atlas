# app-identity Specification

## Purpose

Defines ATLAS's shared visual identity — the Old Atlas palette, typography, logo usage, and signature visual moments — so every screen presents one coherent character instead of generic default styling.

## Requirements

### Requirement: App-wide semantic color palette

The app SHALL define a single semantic color palette and apply it across all screens: warm paper background surfaces, ink (warm near-black) for text, borders, and primary actions, brass for personal-record accents, verdigris for success/completion, and oxblood for destructive/discard actions. No screen SHALL render the former generic blue (`#0a7cff`) as a theme color after migration.

#### Scenario: Primary action uses ink

- **WHEN** any primary action button is rendered (start session, save routine, complete session entry points)
- **THEN** it appears as a solid ink-colored button with paper-colored text

#### Scenario: Surfaces are paper-toned

- **WHEN** any screen, card, or modal background is rendered
- **THEN** it uses a warm cream paper tone rather than pure white, with deeper paper tones for cards, wells, and chips

#### Scenario: Semantic status colors are consistent

- **WHEN** a destructive action (delete, discard), a completion action (complete session), or a personal record is rendered on any screen
- **THEN** destructive uses oxblood, completion uses verdigris, and personal records use brass, consistently across all screens

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

### Requirement: Recolorable logo mark with size tiers

The app SHALL render the Atlas logo as a single-color scalable mark that inherits a theme color (ink, paper, or brass) from its context. The mark's viewBox SHALL be cropped to the artwork's bounding box (portrait) so the rendered size reflects visible ink. The mark SHALL be used only at supported sizes: ~110px (start card and empty states) and ~90px (session summary); it SHALL NOT be rendered below ~60px where trace detail breaks down.

#### Scenario: Logo on empty state

- **WHEN** a list screen (sessions, routines, exercise picker) has no content to show
- **THEN** the empty state displays the Atlas mark in ink on paper with one line of supporting copy

#### Scenario: Logo recolors for its background

- **WHEN** the logo is rendered on an ink background (splash) versus a paper background (empty state)
- **THEN** the mark renders paper-colored on ink and ink-colored on paper without a boxed background

### Requirement: Expedition-style progression chart

The exercise progression chart SHALL render its trend as a dashed ink line (expedition-route style) over parchment-toned gridlines, with a brass star marking each personal-record summit point.

#### Scenario: Trend line is dashed

- **WHEN** the progression chart renders a strength trend
- **THEN** the line is dashed and ink-colored over paper-toned gridlines

#### Scenario: PR summits are starred

- **WHEN** a charted session contains a personal record for the plotted exercise
- **THEN** that point is marked with a brass star distinguishable from regular data points

### Requirement: Brass personal-record badge

Personal-record indicators SHALL render as a brass chip with a star glyph, replacing the former dark-goldenrod badge styling.

#### Scenario: PR badge during logging

- **WHEN** a logged set becomes a best-set personal record
- **THEN** a brass chip with a star glyph marks the set in the session view

### Requirement: Passport-stamp session completion

The session-complete treatment (summary modal and completion states) SHALL present completion with a stamp-like visual treatment in verdigris, evoking a passport stamp rather than a plain confirmation.

#### Scenario: Completing a session

- **WHEN** the user marks a session complete and the summary is shown
- **THEN** the completion state displays a stamp-style verdigris treatment

### Requirement: Branded app icon and splash

The installed app SHALL present an ink-tiled app icon with the paper-colored Atlas mark, and a splash screen of ink background showing the mark only (no text, avoiding non-runtime-loaded fonts). The app SHALL remain light-mode only (`userInterfaceStyle: light`) in v1.

#### Scenario: Cold start

- **WHEN** the app launches cold
- **THEN** the splash shows the Atlas mark in paper on an ink background until the app is ready
