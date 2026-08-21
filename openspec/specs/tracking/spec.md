# tracking Specification

## Purpose
Surface per-exercise context during logging — reference set slots from recent qualifying sessions (with ghosts and per-slot deltas), per-set progression deltas, a session-over-session summary, prior-session notes, and personal-record badges — so the user knows what they are aiming to match or beat.
## Requirements
### Requirement: Best set per exercise

For each exercise, the system SHALL compute a single "best" set as the set with the greatest weight; ties SHALL be broken by the greatest reps at that weight.

#### Scenario: Heavier weight wins

- **WHEN** an exercise has prior sets 40x7 and 45x6
- **THEN** the best set is reported as 45x6

#### Scenario: Tie on weight broken by reps

- **WHEN** an exercise has prior sets 40x7 and 40x10
- **THEN** the best set is reported as 40x10

#### Scenario: Equal weight and equal reps

- **WHEN** an exercise has multiple prior sets at the same weight and reps (e.g. two sets of 40x7)
- **THEN** the best set is reported as 40x7, using the earliest such set as the reference date

### Requirement: Display context during logging

While the user is logging sets for an exercise in an in-progress session, the system SHALL display, in close proximity to the set-entry controls: the reference set slots for that exercise (with ghosts and tap-to-copy), the session-over-session summary, access to the reference session's notes, per-set progression deltas on logged working-set rows, and personal-record badges on qualifying rows. Persistent all-time record values (heaviest, most-reps) SHALL NOT be displayed during logging; they remain available on the exercise progression screen. Tapping a reference slot SHALL copy that slot's weight and reps into the set-entry controls.

#### Scenario: Full context during logging

- **WHEN** the user is logging sets for an exercise that has at least 2 qualifying prior sessions with notes
- **THEN** the reference slot list, session summary, collapsed notes affordance, and per-set deltas on logged rows are all shown near the set-entry controls

#### Scenario: Copy a reference slot into the entry

- **WHEN** the user taps a reference slot (including a ghost)
- **THEN** that slot's weight and reps are filled into the set-entry weight and reps controls, ready to be saved or edited before saving

#### Scenario: First-time exercise

- **WHEN** the user is logging an exercise that has no qualifying prior history
- **THEN** the UI displays a clear indication that no reference data exists yet, prompting the user to set their first baseline, and no deltas, summary, badges, or notes affordance are shown

### Requirement: Most reps set per exercise

For each exercise, the system SHALL compute a single "most reps" set as the set with the greatest rep count; ties SHALL be broken by the greatest weight at that rep count; further ties SHALL be broken by the earliest such set.

#### Scenario: More reps wins

- **WHEN** an exercise has prior sets 40x7 and 45x6
- **THEN** the most-reps set is reported as 40x7

#### Scenario: Tie on reps broken by weight

- **WHEN** an exercise has prior sets 47x8 and 52x8
- **THEN** the most-reps set is reported as 52x8

#### Scenario: Equal reps and equal weight

- **WHEN** an exercise has multiple prior sets at the same reps and weight (e.g. two sets of 40x7)
- **THEN** the most-reps set is reported as 40x7, using the earliest such set as the reference date

### Requirement: Warmup sets excluded from best and most-reps computation

Warmup-flagged sets SHALL be excluded from best-set and most-reps-set computation. Warmup sets SHALL remain visible in session history and SHALL appear (visually de-emphasized) in the reference slot list.

#### Scenario: Warmup does not overwrite best

- **WHEN** an exercise has a working set of 40x7 and a warmup set of 25x8
- **THEN** the best set is reported as 40x7, and the 25x8 warmup set is ignored for best-set purposes

#### Scenario: Warmup does not overwrite most reps

- **WHEN** an exercise has a working set of 40x7 and a warmup set of 25x12
- **THEN** the most-reps set is reported as 40x7, and the 25x12 warmup set is ignored for most-reps purposes

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

### Requirement: Set-by-set progression deltas

For each working set logged in an in-progress session, the system SHALL display, alongside its weight and reps, its change against the reference slot at the same working-set position: the weight change and the rep change SHALL each be shown as separate components (for example "+2.5" and "-2"). An increase in weight SHALL be presented as progress regardless of the rep change. At equal weight, more reps SHALL be presented as progress; at equal weight, fewer reps SHALL be presented as a decline. Identical weight and reps SHALL be presented as a match with no directional indicator. A working set logged beyond the highest reference slot SHALL be presented as a new set rather than a numeric delta. Warmup sets logged in the current session SHALL NOT display deltas.

#### Scenario: One more rep than the reference slot

- **WHEN** the reference slot is 40x8 and the user logs 40x9
- **THEN** the set row shows a positive rep change indicator (+1 rep)

#### Scenario: Weight increase with rep drop is still progress

- **WHEN** the reference slot is 40x8 and the user logs 42.5x6
- **THEN** the set row shows the weight change (+2.5) and the rep change (-2), presented overall as progress

#### Scenario: Regression at the same weight

- **WHEN** the reference slot is 40x8 and the user logs 40x6
- **THEN** the set row shows a negative rep change indicator (-2 reps)

#### Scenario: Exact match

- **WHEN** the reference slot is 40x8 and the user logs 40x8
- **THEN** the set row shows a match with no up or down indicator

#### Scenario: Set beyond the reference list

- **WHEN** the reference list has 3 slots and the user logs a 4th working set
- **THEN** the set row is presented as a new set, with no numeric delta

#### Scenario: Delta against a ghost slot

- **WHEN** slot 4's reference is a ghost of 40x7 from two qualifying sessions ago and the user logs a 4th working set of 40x8
- **THEN** the set row shows a positive rep change indicator (+1 rep) against the ghost value

### Requirement: Session-over-session summary

While logging an exercise with at least 2 qualifying prior sessions, the system SHALL display a one-line summary comparing the most recent qualifying session against the qualifying session before it. The line SHALL identify the compared session by date. The top working set SHALL always be shown concretely (the newer value in full, the older value compactly) with the direction of change, EXCEPT when nothing changed between the two sessions, in which case the line SHALL collapse to a matched statement. The working-set count SHALL be shown only when it changed, as the newer count with the older count in parentheses. The top set of a session is its best working set by estimated one-rep max, tie-broken by heavier weight. Direction SHALL use the same rules as set-by-set deltas (a weight increase is upward regardless of rep change). With fewer than 2 qualifying sessions, no summary SHALL be displayed.

#### Scenario: Top set and set count both improved

- **WHEN** the most recent qualifying session's top set was 40x8 with 4 working sets, and the one before had a top set of 40x7 with 3 working sets
- **THEN** the summary line shows the newer top set concretely with an upward indicator and the older value, followed by the newer set count with the older count (e.g. "vs <date>: top set 40 lbs ×8 ↑ from 40×7 · 4 sets (was 3 before)")

#### Scenario: Everything matched collapses to one statement

- **WHEN** the two most recent qualifying sessions have the same top set and the same working-set count
- **THEN** the summary line collapses to a matched statement (e.g. "vs <date>: matched last time")

#### Scenario: Weight increase with rep drop reads as upward

- **WHEN** the newer session's top set is 45x6 and the older session's top set was 40x8
- **THEN** the summary line shows an upward indicator between the two values

#### Scenario: Only one qualifying session

- **WHEN** an exercise has exactly 1 qualifying prior session
- **THEN** no session-over-session summary is displayed

#### Scenario: Top set unchanged, count changed

- **WHEN** the two most recent qualifying sessions share the same top set (40x8) but the newer one had 4 working sets versus 3
- **THEN** the summary line shows the top set as unchanged (e.g. "top set 40 lbs ×8 =") and the set counts as changed (e.g. "4 sets (was 3 before)")

#### Scenario: Top set changed, count unchanged

- **WHEN** the newer session's top set improved and its working-set count equals the older session's
- **THEN** the summary line shows only the top-set comparison, with no set-count segment

### Requirement: Personal-record badges during logging

When a working set is logged in an in-progress session, the system SHALL compare it against the exercise's all-time records computed over prior sessions only, excluding the current session, using the existing heaviest and most-reps orderings. A set that sets a new heaviest record SHALL trigger a visible new-heaviest badge; a set that sets a new most-reps record SHALL trigger a visible rep-record badge. Both badges MAY trigger for the same set. A set that merely equals a record, or that only exceeds sets logged earlier in the current session, SHALL NOT trigger any badge.

#### Scenario: New heaviest set

- **WHEN** the prior-session all-time heaviest is 45x6 and the user logs 47x6
- **THEN** a new-heaviest badge is displayed for that set

#### Scenario: Records within the current session do not count as baseline

- **WHEN** the prior-session all-time heaviest is 45x6 and the user logs 42x8 and then 46x5 in the same session
- **THEN** the 46x5 set triggers no badge, because 42x8 is not part of the record baseline

#### Scenario: Equaling a record triggers nothing

- **WHEN** the prior-session all-time heaviest is 45x6 and the user logs 45x6
- **THEN** no new-heaviest badge is displayed

#### Scenario: Rep record at constant weight

- **WHEN** the prior-session most-reps set is 40x10 and the user logs 40x11
- **THEN** a rep-record badge is displayed for that set

### Requirement: Prior-session notes during logging

While logging an exercise, the system SHALL make the reference session's notes viewable: the session-level note of the most recent qualifying session and the set-level notes attached to the reference slots (each attributed to the session the slot value came from). Notes SHALL be collapsed by default and expandable on demand. When no reference note exists, no notes affordance SHALL be shown.

#### Scenario: Set notes expand on demand

- **WHEN** a reference slot carries the note "belt, no pause" and the notes section is collapsed
- **THEN** tapping the notes affordance reveals that note

#### Scenario: Session note is included

- **WHEN** the most recent qualifying session has a session note and its sets have no set notes
- **THEN** the collapsed notes affordance expands to show the session note

#### Scenario: No notes anywhere

- **WHEN** neither the reference slots nor the most recent qualifying session has any note
- **THEN** no notes affordance is displayed


