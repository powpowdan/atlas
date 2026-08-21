# typography Specification

## Purpose

Defines the app-wide type scale of record so every screen renders text with one consistent visual rhythm: named roles with exact size, weight, tracking, line height, and font family, replacing per-screen ad-hoc styling.

## Requirements

### Requirement: Named type scale of record

All text in the app SHALL be rendered via named roles with exactly these values, and no text element SHALL use a font size outside the scale:

| Role | Font | Size | Weight | Tracking / Case | Line height |
|---|---|---|---|---|---|
| wordmark | Fraunces 600 | 22 | 600 | UPPERCASE · ls 3 | — |
| screenTitle | Fraunces 600 | 20 | 600 | — | — |
| heroStat | system | 34 | 700 | tabular-nums | — |
| heading | system | 17 | 600 | — | — |
| modalTitle | system | 16 | 600 | — | — |
| cta | system | 16 | 600 | — | — |
| stat | system | 16 | 500 | tabular-nums | — |
| body | system | 14 | — | — | 20 |
| action | system | 14 | 600 | — | — |
| meta | system | 13 | — | — | — |
| sectionHeader | system | 13 | 700 | Title Case · ls 0.5 | — |
| eyebrow | system | 12 | 700 | UPPERCASE · ls 1.5 | — |
| caption | system | 12 | — | — | 16 |
| micro | system | 10 | 600 | chips/badges only | — |

#### Scenario: Screen titles are uniform

- **WHEN** any in-screen or navigation title renders (session detail, history detail, exercise detail, new session, tab headers)
- **THEN** it uses the screenTitle role (Fraunces 600 at 20) — no title renders at 18 or 22

#### Scenario: Card and list titles are uniform

- **WHEN** any card title, list-item name, or exercise name renders on any screen (home active-session card, routines list, history list, session detail, history detail, picker rows)
- **THEN** it uses the heading role (system 17/600) — the same job never renders at different sizes or weights on different screens

#### Scenario: No implicit default sizing

- **WHEN** any text element renders (buttons, empty states, errors, notes, inputs)
- **THEN** its font size comes from an explicit role, never from an inherited platform default

### Requirement: Fraunces is the special-occasion voice

The Fraunces typeface SHALL appear only in the wordmark and screen titles, always as the single loaded 600 weight with no additional weight declared, and SHALL NOT appear on any other text.

#### Scenario: Display voice is reserved

- **WHEN** any non-title text renders (cards, stats, buttons, labels, modal titles, numerals)
- **THEN** it uses the system font — Fraunces appears nowhere except the wordmark and screen titles

### Requirement: Numerals always use system tabular figures

All numeric text — including large hero figures such as the session-summary total volume — SHALL render in the system font with tabular figure alignment. No numeral SHALL render in Fraunces.

#### Scenario: Hero stat

- **WHEN** the session summary modal renders total volume
- **THEN** the figure renders at 34/700 in the system font with tabular-nums, not in Fraunces

#### Scenario: Dense numeric rows align

- **WHEN** set rows, record values, chart labels, or the rest timer render
- **THEN** digits align in columns using tabular figures with the system font

### Requirement: One role per job across screens

Text performing the same job on different screens SHALL use the same role. Section headers SHALL render as sectionHeader (13/700, Title Case, ls 0.5); small uppercase labels SHALL render as eyebrow (12/700, UPPERCASE, ls 1.5); primary buttons SHALL use cta; destructive/secondary buttons SHALL use action; timestamps and footnotes SHALL use caption.

#### Scenario: Eyebrow pattern is identical everywhere

- **WHEN** a small uppercase label renders (session summary stamp, reference header, volume label)
- **THEN** it uses the eyebrow role — 12/700 UPPERCASE ls 1.5, replacing all prior per-screen variants (11/12/13 with tracking 0–3)

#### Scenario: Destructive buttons match

- **WHEN** a destructive or secondary action renders (discard set, delete session, remove exercise, delete routine)
- **THEN** it uses the action role (14/600) regardless of screen

#### Scenario: Multi-line prose has explicit leading

- **WHEN** body or caption text can wrap to multiple lines (confirmation messages, empty states, notes, hints)
- **THEN** body renders with line height 20 and caption with line height 16, not platform defaults
