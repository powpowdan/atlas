## ADDED Requirements

### Requirement: Show a summary when completing a session

The system SHALL present a session summary modal when the user marks an in-progress session as complete. The modal SHALL be shown after the session is marked complete and before the app navigates away, and the user SHALL be able to dismiss it to return to the previous screen.

#### Scenario: Complete a session with logged sets

- **WHEN** the user taps "Complete session" on an in-progress session that has at least one logged set
- **THEN** the session is marked complete and a summary modal is presented with the session's derived totals
- **WHEN** the user taps "Done" on the summary modal
- **THEN** the app navigates away from the session screen, as completing a session did previously

#### Scenario: Complete a session with no logged sets

- **WHEN** the user completes an in-progress session that has no logged sets
- **THEN** the session is marked complete and the app navigates away without showing a summary modal

### Requirement: Summarize volume, sets, and reps

The summary SHALL display the session's total working-set volume, the total number of working sets, and the total reps across working sets. Warmup sets SHALL be excluded from these headline totals. When the session contains warmup sets, the summary SHALL additionally show the total warmup volume as a footnote.

Volume SHALL be computed using each exercise's real moved weight: for exercises logged per-hand with two implements (dumbbell bench press, dumbbell biceps), the logged weight counts double, and dumbbell bench press additionally carries a 45 lbs bar. Comparison statistics shown in the summary (heaviest set, PRs, best estimated 1RM) SHALL use raw logged values, not adjusted ones.

#### Scenario: Session with working and warmup sets

- **WHEN** a session contains working sets totaling 12,000 lbs of volume across 40 sets/96 reps and warmup sets totaling 2,100 lbs of volume
- **THEN** the summary shows total volume 12,000 lbs, 40 sets, and 96 reps, with a footnote indicating 2,100 lbs of warmup volume excluded

#### Scenario: Session with only working sets

- **WHEN** a session contains no warmup sets
- **THEN** the summary shows the working totals and no warmup footnote

#### Scenario: Per-hand dumbbell exercise applies real-weight adjustment to volume

- **WHEN** a session includes a Bench set logged as 50 lbs × 5, where the user lifts one 50 lbs dumbbell per hand plus a 45 lbs bar
- **THEN** that set contributes (50 × 2 + 45) × 5 = 725 lbs to the session's total volume, while the heaviest-set display still shows the raw logged 50 lbs × 5

### Requirement: Show active duration from first set

The summary SHALL display the session's active duration, measured from the timestamp of the first logged set to the moment the session is completed. The duration SHALL NOT be measured from session creation time, since a session may be created well before the first set is logged.

#### Scenario: Session started long before first set

- **WHEN** a session was created at 5:00 PM, its first set was logged at 6:00 PM, and it was completed at 7:00 PM
- **THEN** the summary shows an active duration of approximately 1 hour

### Requirement: Show session highlights

The summary SHALL display the heaviest working set of the session (weight and reps) and the best estimated one-rep max across working sets, computed with the Epley formula. The summary SHALL display the number of personal records set during the session — working sets that beat the prior best heaviest set or the prior best rep result for their exercise, counting at most one heaviest PR and one rep PR per exercise — and SHALL omit the PR line entirely when the session is the first logged history for every exercise in it.

#### Scenario: Session with PRs

- **WHEN** a completed session includes working sets that beat the prior all-time heaviest set for one exercise and the prior all-time most-reps set for another
- **THEN** the summary shows a PR count of 2 alongside the heaviest set and best estimated 1RM

#### Scenario: First-time exercises only

- **WHEN** every exercise in the completed session has no prior logged history
- **THEN** the summary shows the heaviest set and best estimated 1RM but omits the PR line

### Requirement: Show a weight equivalence

The summary SHALL display a playful equivalence comparing the session's total working volume (real moved weight) to familiar objects (e.g., "≈ 1.5 African elephants"), selected from a locally defined ladder of reference weights spanning small everyday objects up to the largest animals and vehicles. Equivalences SHALL be computed on-device without any network access.

#### Scenario: Volume matches a reference object

- **WHEN** a completed session's total working volume is comparable to a defined reference object
- **THEN** the summary displays an equivalence line relating the volume to that object
