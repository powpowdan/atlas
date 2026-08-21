## Purpose

Gives the exercise manage screen's category accordion fluid, animated expand/collapse behavior and guarantees newly created exercises are immediately visible by auto-expanding and scrolling to their category section.

## Requirements

### Requirement: Animated section expand and collapse

The manage screen's category sections SHALL animate smoothly between collapsed and expanded states — both opening and closing — rather than swapping rows instantly. Section content SHALL be revealed and concealed via a height transition, and the section's chevron indicator SHALL rotate continuously between its collapsed and expanded orientations instead of switching between two glyphs. Tapping a section header SHALL toggle its section with this animation under both the Active and Archived filters.

#### Scenario: Expand animates

- **WHEN** the user taps a collapsed category header
- **THEN** the section body grows smoothly to its full height and the chevron rotates from collapsed to expanded orientation

#### Scenario: Collapse animates

- **WHEN** the user taps an expanded category header
- **THEN** the section body shrinks smoothly to zero height and the chevron rotates back to collapsed orientation

#### Scenario: Archived filter animates identically

- **WHEN** the user toggles a section while the Archived filter is selected
- **THEN** the section animates exactly as under the Active filter

### Requirement: Reveal on create

After the user creates a new exercise and the editor closes, the manage screen SHALL automatically expand the new exercise's category section and scroll so that the section (with the new exercise visible in it) is on screen. This SHALL happen without any additional taps from the user.

#### Scenario: Create makes the new exercise visible

- **WHEN** the user saves a new exercise in a category whose section is collapsed
- **THEN** that section expands and scrolls into view, showing the new exercise among its rows

#### Scenario: Create in an already-expanded section

- **WHEN** the user saves a new exercise in a category whose section is already expanded
- **THEN** the section stays expanded and scrolls into view so the new exercise is visible

### Requirement: Per-visit expansion state

Section expansion state SHALL reset when the user leaves the manage screen: on return, all sections SHALL start collapsed. Expansion state SHALL NOT persist across visits, app restarts, or devices.

#### Scenario: Fresh visit starts collapsed

- **WHEN** the user leaves the manage screen with sections expanded and later returns
- **THEN** all sections are collapsed again

#### Scenario: Expansion survives editor overlay

- **WHEN** the user opens the exercise editor from the manage screen and closes it
- **THEN** the expansion state of all sections is unchanged (the editor overlays without resetting it)
