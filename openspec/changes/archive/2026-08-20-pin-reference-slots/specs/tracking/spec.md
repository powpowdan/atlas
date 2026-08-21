## MODIFIED Requirements

### Requirement: Reference set slots per exercise

For each exercise being logged in an in-progress session, the system SHALL surface a positional reference list of working-set slots built from qualifying sessions (a qualifying session is a prior session, excluding the in-progress one, with at least one logged working set for the exercise). Slots at positions 1 through 4 SHALL be pinned: each pinned slot SHALL show the set logged at that position in the most recent qualifying session — at any age — that has a working set at that position, and a pinned slot SHALL NOT expire regardless of how many consecutive qualifying sessions lack that position. Slots at positions 5 and beyond SHALL follow the ghost window: such a slot exists only when at least one of the last 3 qualifying sessions has a working set at that position, and it SHALL show the set logged at that position in the most recent qualifying session that has a working set at that position. A slot whose value comes from a qualifying session older than the most recent one SHALL be visually distinguished as a ghost and SHALL indicate the session (or its date) it came from. Every slot, including ghosts of any age, SHALL remain tap-to-copy into the set-entry controls. Each slot SHALL also display its change against the previous occurrence of that position in an older qualifying session, using the same component-wise presentation and directionality rules as set-by-set deltas; when the position has no prior occurrence in any fetched qualifying session, no change indicator SHALL be shown for that slot. This delta comparison SHALL apply to pinned slots regardless of how old the slot's source session or the previous occurrence is. Warmup sets from the most recent qualifying session SHALL also be shown, visually de-emphasized, and SHALL NOT participate in slot, ghost, or slot-delta mechanics.

#### Scenario: All slots from the most recent qualifying session

- **WHEN** the most recent qualifying session for an exercise has working sets 40x7, 40x7, 40x8 and every earlier session had 3 or fewer working sets
- **THEN** three slots are shown, each with its value and that session's date, with no ghost styling

#### Scenario: Ghost slot from an older session is kept

- **WHEN** the last 3 qualifying sessions for an exercise have working sets of 4, 3, and 3 (most recent first), so position 4 was last performed in the oldest session of the window
- **THEN** slot 4 is shown with its value from that oldest session, styled as a ghost with an indication of which session it came from, and tapping it copies its weight and reps into the set-entry controls

#### Scenario: Pinned slot survives beyond the ghost window

- **WHEN** position 4 was last performed 6 qualifying sessions ago and the 5 most recent qualifying sessions all have 3 or fewer working sets
- **THEN** slot 4 is still shown with its value from that session 6 sessions ago, styled as a ghost with an age indication, and tapping it copies its weight and reps into the set-entry controls

#### Scenario: Pinned slot delta compares against the previous occurrence at any age

- **WHEN** slot 4 ghosts from a session 6 qualifying sessions ago showing 40x8, and the previous occurrence of position 4 was 40x7 in an even older session
- **THEN** slot 4 displays a positive rep-change indicator alongside its value

#### Scenario: Unpinned slot expires after the window

- **WHEN** a set position of 5 or higher was last performed 3 qualifying sessions ago and the 3 most recent qualifying sessions all lack that position
- **THEN** no slot is shown for that position

#### Scenario: Slot improved over its previous occurrence

- **WHEN** a slot shows 40x8 and the previous occurrence of that position in an older qualifying session was 40x7
- **THEN** the slot displays a positive rep-change indicator

#### Scenario: Slot dropped from its previous occurrence

- **WHEN** a slot shows 40x6 and the previous occurrence of that position in an older qualifying session was 40x8
- **THEN** the slot displays a negative rep-change indicator

#### Scenario: Slot matched its previous occurrence

- **WHEN** a slot shows 40x8 and the previous occurrence of that position in an older qualifying session was also 40x8
- **THEN** the slot displays a match indicator

#### Scenario: Slot with no prior occurrence

- **WHEN** a slot's position has no working set in any older fetched qualifying session (for example, the position first appeared in its source session)
- **THEN** the slot displays no change indicator

#### Scenario: Warmups are shown without slot mechanics

- **WHEN** the most recent qualifying session contains a warmup set of 25x8 and working sets of 40x7
- **THEN** the warmup set is shown de-emphasized alongside the working-set slots, and no warmup-only ghosts are ever shown

#### Scenario: No qualifying sessions

- **WHEN** an exercise has no prior session with a logged working set
- **THEN** no reference list is displayed, and the UI indicates this is the first time the exercise is being logged
