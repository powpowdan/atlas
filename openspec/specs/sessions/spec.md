# sessions Specification

## Purpose
Log a workout session by starting from a routine (pre-populated) or ad-hoc, enter sets under each exercise, mark the session complete, and browse past sessions.
## Requirements
### Requirement: Start a session from a routine

The system SHALL allow the user to start a new session from a routine. The session SHALL be pre-populated with the routine's exercises in their defined order, copied at start time so later edits to the routine do not affect the session.

#### Scenario: Start from a routine

- **WHEN** the user selects a routine and chooses to start a session
- **THEN** a new session is created with the routine's exercises pre-populated in order, and the session is linked to that routine for reference

#### Scenario: Pre-populated exercises are independent of the routine

- **WHEN** the user starts a session from a routine and then the routine is edited
- **THEN** the session's exercise list and order remain unchanged

### Requirement: Start an ad-hoc session

The system SHALL allow the user to start a session with no routine attached, adding exercises one at a time during the workout.

#### Scenario: Start ad-hoc

- **WHEN** the user starts a session without selecting a routine
- **THEN** a new empty session is created with no exercises, and the user may add exercises as the workout progresses

### Requirement: Add an exercise to a session

The system SHALL allow the user to add any exercise from the exercise library to a session, ad-hoc sessions and routine-started sessions alike.

#### Scenario: Add an exercise

- **WHEN** the user adds an exercise to an in-progress session
- **THEN** the exercise appears at the end of the session's exercise list and is ready to receive sets

### Requirement: Log a set

The system SHALL allow the user to log a set under a session exercise with a numeric weight, a numeric rep count, an optional warmup flag, and an optional free-form note. Weight SHALL accept decimal values to accommodate machines with small increments (e.g. 91.5).

#### Scenario: Log a working set

- **WHEN** the user enters weight 40 and reps 7 for an exercise and saves the set
- **THEN** the set is persisted as a working set with weight 40 and reps 7

#### Scenario: Log a warmup set

- **WHEN** the user enters a set, toggles the warmup flag on, and saves
- **THEN** the set is persisted with the warmup flag set, distinct from working sets

#### Scenario: Log a set with a decimal weight

- **WHEN** the user enters weight 91.5 and reps 8
- **THEN** the set is persisted with weight 91.5

#### Scenario: Log a set with a note

- **WHEN** the user enters weight 47 and reps 7 with the note "failure"
- **THEN** the set is persisted with that note attached

#### Scenario: Reject a set without weight or reps

- **WHEN** the user attempts to save a set with neither weight nor reps entered
- **THEN** the system rejects the save and shows a validation error

### Requirement: Edit a set

The system SHALL allow the user to edit any field of a previously logged set in an in-progress session.

#### Scenario: Correct a mistyped set

- **WHEN** the user changes a set's reps from 6 to 8 and saves
- **THEN** the set is updated with reps 8

### Requirement: Delete a set

The system SHALL allow the user to delete a set from an in-progress session. Deletion SHALL take effect immediately without a confirmation dialog, and the system SHALL offer a time-limited undo as specified in the undo capability.

#### Scenario: Remove an unwanted set

- **WHEN** the user deletes a set
- **THEN** the set is removed immediately, the exercise's remaining sets are unchanged, and an undo affordance is offered for a limited time

### Requirement: Keyboard does not obscure set entry

The session screen SHALL keep the focused set entry input visible above the on-screen keyboard on Android and iOS whenever an input is focused. For the bottom-most exercise in the session, visibility SHALL extend beyond the weight/reps inputs to the complete set-entry form — including the set note input and the Add set action — so the user can log a set without scrolling.

#### Scenario: Focus weight input on the last exercise

- **WHEN** the user scrolls to the bottom-most exercise and taps its Weight input
- **THEN** the keyboard opens
- **AND** the focused input (and its Reps companion) remain visible above the keyboard
- **AND** the exercise name header for that exercise remains identifiable on screen

#### Scenario: Full set-entry form reachable on the last exercise

- **WHEN** the keyboard is open on the bottom-most exercise's weight or reps input
- **THEN** the set note input and the Add set button are visible above the keyboard
- **AND** the user can tap Add set on the first press without scrolling

#### Scenario: Keyboard stays open while operating controls

- **WHEN** the keyboard is open and the user taps Add set, a reference chip, or a set row edit/delete button
- **THEN** the tap takes effect on first press without the first press merely dismissing the keyboard

#### Scenario: Reps to weight navigation

- **WHEN** the user presses Next on the Weight input
- **THEN** focus moves to the Reps input, which remains visible above the keyboard

#### Scenario: No regression on iOS

- **WHEN** the user focuses any set entry input on iOS
- **THEN** keyboard avoidance behavior is unchanged from before this change

### Requirement: Keyboard dismisses after saving a set

After a set is successfully saved on the active session screen or the history editor — via the save button, the update button, or the reps keyboard action — the system SHALL dismiss the on-screen keyboard. When the save is rejected due to invalid input, the keyboard SHALL remain open so the user can correct the entry in place. Dismissal SHALL NOT affect carry-forward prefill of the next set's weight and reps.

#### Scenario: Add set via the save button

- **WHEN** the keyboard is open and the user taps Add set with valid weight and reps
- **THEN** the set is persisted and the keyboard closes without requiring an additional tap or gesture

#### Scenario: Add set via the keyboard action

- **WHEN** the user presses the keyboard's action key on the reps input with valid values
- **THEN** the set is persisted and the keyboard closes

#### Scenario: Update an existing set

- **WHEN** the user edits a logged set and saves the change with valid values
- **THEN** the update is persisted and the keyboard closes

#### Scenario: Validation failure keeps the keyboard open

- **WHEN** the user attempts to save a set with missing or invalid weight or reps
- **THEN** the save is rejected with a validation error and the keyboard remains open

#### Scenario: History editor dismisses the keyboard after save

- **WHEN** the user adds or updates a set in the history editor with valid values
- **THEN** the change is persisted and the keyboard closes

#### Scenario: Carry-forward survives dismissal

- **WHEN** the keyboard closes after adding a set
- **THEN** the weight and reps inputs are prefilled with the just-saved set's values

#### Scenario: Dragging the session list dismisses the keyboard

- **WHEN** the keyboard is open on the active session screen and the user scrolls the exercise list
- **THEN** the keyboard closes

### Requirement: Mark a session complete

The system SHALL allow the user to mark an in-progress session as complete. A completed session SHALL appear in history and SHALL NOT be editable from the active-session view.

#### Scenario: Complete a session

- **WHEN** the user marks an in-progress session as complete
- **THEN** the session's status becomes complete, it is removed from the active-session view, and it appears in the session history list

### Requirement: Add a note to a session

The system SHALL allow the user to attach an optional free-form note to a session as a whole, in addition to per-exercise and per-set notes. The note SHALL be editable regardless of the session's status — including after the session has been marked complete — so the user can revise or add a note when reviewing past sessions.

#### Scenario: Save a session note

- **WHEN** the user enters "Felt strong today" as a session note and saves
- **THEN** the note is persisted on the session and visible when viewing the session

#### Scenario: Edit a note on a completed session

- **WHEN** the user opens a completed session from history, edits its note, and saves
- **THEN** the updated note is persisted on the completed session and visible on subsequent views

#### Scenario: Clear a note on a completed session

- **WHEN** the user opens a completed session, removes the existing note text, and saves
- **THEN** the session's note becomes null and the note display is hidden on subsequent views

### Requirement: List past sessions

The system SHALL list past sessions ordered by date, most recent first, showing the date, the originating routine name (if any), and a summary such as total exercise count.

#### Scenario: Show recent sessions

- **WHEN** the user opens the history screen and past sessions exist
- **THEN** the system displays sessions most recent first, each with its date, originating routine name (or "Ad-hoc" if none), and exercise count

#### Scenario: Empty history

- **WHEN** the user opens the history screen and no sessions exist
- **THEN** the system displays an empty-state prompt guiding the user to start their first session

### Requirement: View a past session

The system SHALL allow the user to open a past session and see its exercises, the sets logged under each, the session note, the originating routine name, and — when the session has been completed — the elapsed duration between start and completion.

#### Scenario: Open a past session

- **WHEN** the user opens a past session from history
- **THEN** the system displays the session date, originating routine name, session note, and each exercise with its sets in entry order

#### Scenario: Completed session shows duration

- **WHEN** the user opens a completed session from history
- **THEN** the system displays the elapsed duration between `started_at` and `completed_at`, formatted as hours and minutes

#### Scenario: In-progress session shows no duration

- **WHEN** the user opens a session that is still in progress
- **THEN** no duration is displayed

### Requirement: Discard an in-progress session

The system SHALL allow the user to discard an in-progress session, removing it and all of its exercises and sets entirely. Discarding the session that is currently the active session SHALL also clear the active-session pointer. The system SHALL require an explicit confirmation before discarding, because the action is destructive and cannot be undone.

#### Scenario: Discard the active session

- **WHEN** the user discards the in-progress session that is currently active and confirms
- **THEN** the session and all of its exercises and sets are removed, the active-session pointer is cleared, and the user is returned to the start-session prompt

#### Scenario: Discard requires confirmation

- **WHEN** the user chooses to discard an in-progress session
- **THEN** the system asks for confirmation and performs no deletion until the user confirms

#### Scenario: Completing one session does not resurrect an orphan

- **WHEN** two in-progress sessions exist and the user completes or discards the most recent one
- **THEN** the remaining in-progress session is not silently surfaced as the active session without the user choosing to resume it

### Requirement: Compact session footer

The in-progress session screen SHALL render its session-level actions (complete and discard) in a single row, with the complete action visually dominant. The footer SHALL NOT be visible while the on-screen keyboard is open, and SHALL return when the keyboard dismisses without leaving residual blank space below it.

#### Scenario: Footer occupies one row when idle

- **WHEN** the session screen is displayed with no keyboard open
- **THEN** the complete and discard actions appear side by side in one row
- **AND** the footer does not extend below the screen's safe area

#### Scenario: Footer hidden while logging

- **WHEN** the on-screen keyboard is open on any set entry input
- **THEN** neither the complete nor the discard action is visible
- **AND** the space they occupied is given to the exercise list

#### Scenario: Footer returns cleanly after keyboard dismiss

- **WHEN** the user dismisses the keyboard after logging a set
- **THEN** the complete and discard actions are visible again in one row
- **AND** no residual blank gap remains below the footer or at the bottom of the screen

#### Scenario: Footer actions unchanged

- **WHEN** the user taps complete or discard from the compact footer
- **THEN** each action behaves exactly as before, including discard confirmation

### Requirement: Delete a completed session

The system SHALL allow the user to delete a completed session from history, removing it and all of its exercises and sets entirely. The system SHALL require an explicit confirmation before deletion, because the action is destructive and cannot be undone.

#### Scenario: Delete from history

- **WHEN** the user deletes a completed session from the history detail view and confirms
- **THEN** the session and all of its exercises and sets are removed, and the user is returned to the history list which no longer shows that session

#### Scenario: Delete requires confirmation

- **WHEN** the user chooses to delete a completed session
- **THEN** the system asks for confirmation and performs no deletion until the user confirms

#### Scenario: Deletion recomputes tracking

- **WHEN** the user deletes a completed session whose sets included an exercise's best or most-reps set
- **THEN** subsequent best, most-reps, and last-session values for that exercise reflect the remaining sets only

### Requirement: Edit a completed session from history

The system SHALL allow the user to edit a completed session from its history detail view. Editing SHALL be gated behind an explicit edit mode: the default history view SHALL remain read-only, and edit affordances SHALL appear only while edit mode is active. All edits SHALL apply directly to the stored session with the same validation rules as live logging.

#### Scenario: View is read-only by default

- **WHEN** the user opens a completed session from history
- **THEN** the session is displayed read-only with no edit affordances

#### Scenario: Enter edit mode

- **WHEN** the user activates edit mode on a completed session
- **THEN** each exercise shows affordances to edit sets, add sets, and remove the exercise, and the session shows an affordance to add an exercise

#### Scenario: Exit edit mode after changes

- **WHEN** the user deactivates edit mode after making changes
- **THEN** the history detail view reflects all changes made while edit mode was active

### Requirement: Edit a set in a completed session

The system SHALL allow the user to edit any field of a logged set — weight, reps, warmup flag, and note — of a completed session while in edit mode. An edited set SHALL keep its position in the exercise's set order.

#### Scenario: Correct a mistyped set after completion

- **WHEN** the user changes a set's weight from 135 to 225 and saves
- **THEN** the set is updated with weight 225 and remains in its original position among the exercise's sets

#### Scenario: Reject an invalid edit

- **WHEN** the user clears both weight and reps from a set and attempts to save
- **THEN** the system rejects the save and shows a validation error

### Requirement: Delete a set in a completed session

The system SHALL allow the user to delete a set from a completed session while in edit mode. Deletion SHALL take effect immediately without a confirmation dialog, and the system SHALL offer a time-limited undo as specified in the undo capability.

#### Scenario: Remove a mis-logged set

- **WHEN** the user deletes a set from a completed session
- **THEN** the set is removed immediately, the exercise's remaining sets are unchanged, and an undo affordance is offered for a limited time

### Requirement: Add a set to a completed session

The system SHALL allow the user to add a set to any exercise in a completed session while in edit mode, subject to the same validation as live logging. The new set SHALL appear after the exercise's existing sets.

#### Scenario: Append a forgotten set

- **WHEN** the user adds a set of 100 lbs × 8 to an exercise in a completed session
- **THEN** the set is persisted and displayed after that exercise's existing sets

### Requirement: Add an exercise to a completed session

The system SHALL allow the user to add any exercise from the exercise library to a completed session while in edit mode.

#### Scenario: Add an exercise after completion

- **WHEN** the user adds an exercise from the library to a completed session
- **THEN** the exercise appears at the end of the session's exercise list and can receive sets

### Requirement: Remove an exercise from a completed session

The system SHALL allow the user to remove an exercise — and with it all of that exercise's sets — from a completed session while in edit mode. Removal SHALL take effect immediately without a confirmation dialog, and the system SHALL offer a time-limited undo as specified in the undo capability.

#### Scenario: Remove an exercise

- **WHEN** the user removes an exercise from a completed session
- **THEN** the exercise and all of its sets are removed immediately, the remaining exercises are unchanged, and an undo affordance is offered for a limited time

### Requirement: History edits recompute tracking

Because best-set, most-reps, personal-record, progression, and last-session reference values are derived from logged sets, any edit to a completed session SHALL be reflected in those derived values.

#### Scenario: Editing a set updates tracking

- **WHEN** the user edits a set in a completed session so that it becomes the heaviest set ever logged for that exercise
- **THEN** subsequent best-set and progression values for that exercise reflect the edited weight

#### Scenario: Removing data updates tracking

- **WHEN** the user deletes a set or removes an exercise whose sets included an exercise's best or most-reps set
- **THEN** subsequent best, most-reps, and last-session values for that exercise reflect the remaining sets only

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

### Requirement: Session detail survives exercise deletion

The system SHALL render past session detail views correctly after a referenced exercise has been permanently deleted. Each session-exercise row SHALL capture the exercise's name and category at deletion time, and session detail views SHALL display the captured values whenever the original exercise no longer exists. While the exercise still exists, session detail SHALL continue to display the exercise's current live name and category, preserving existing rename-propagation behavior.

#### Scenario: View a session after its exercise was deleted

- **WHEN** the user opens a past session that included an exercise later deleted via exercise deletion
- **THEN** the session detail displays the exercise's frozen name and category captured at deletion time, with all its logged sets intact

#### Scenario: Live exercises keep rename propagation

- **WHEN** an exercise referenced by a past session is renamed (not deleted)
- **THEN** the past session detail displays the exercise's new current name, as before this change

