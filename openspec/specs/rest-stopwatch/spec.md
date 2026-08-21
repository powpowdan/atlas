# rest-stopwatch Specification

## Purpose

Shows, for each exercise in an in-progress session, how much time has elapsed since the most recent set of that exercise was logged, so the user can time rest intervals (including per-exercise recovery during supersets) without leaving the app.

## Requirements

### Requirement: Per-exercise rest stopwatch display

While a session is in progress, the system SHALL display, for each exercise in the session that has at least one logged set, a stopwatch showing the elapsed time since the most recent set of that exercise was logged. The stopwatch SHALL be shown in the exercise's sticky section header so it remains visible while scrolling the session.

#### Scenario: Stopwatch appears after first set

- **WHEN** an exercise in an in-progress session has one or more logged sets
- **THEN** the exercise's header displays the elapsed time since that exercise's most recent set was logged, updating once per second

#### Scenario: No sets yet

- **WHEN** an exercise in an in-progress session has no logged sets
- **THEN** no stopwatch is displayed for that exercise

#### Scenario: Not shown outside active sessions

- **WHEN** the viewed session's status is not in progress (e.g. a past session opened from history)
- **THEN** no stopwatch is displayed for any exercise

### Requirement: Stopwatch anchors to that exercise's latest set

Each exercise's stopwatch SHALL measure elapsed time from the timestamp of the most recent set logged under that exercise, regardless of set type (warmup or working). Sets logged under a different exercise SHALL NOT reset it.

#### Scenario: New set resets only its own exercise's stopwatch

- **WHEN** the user logs a set under exercise A while exercise B's stopwatch is running
- **THEN** exercise B's stopwatch continues counting without reset, and exercise A's stopwatch resets to count from the newly logged set

#### Scenario: Warmup set resets the stopwatch

- **WHEN** the user logs a warmup set under an exercise
- **THEN** that exercise's stopwatch resets to count from the warmup set's timestamp

#### Scenario: Deleting the latest set falls back to the prior set

- **WHEN** the user deletes the most recent set of an exercise that has earlier sets
- **THEN** the stopwatch re-anchors to the timestamp of the remaining most recent set

#### Scenario: Editing a set does not reset the stopwatch

- **WHEN** the user edits the weight, reps, warmup flag, or note of an existing set
- **THEN** that set's original log timestamp is unchanged and the stopwatch does not reset

### Requirement: Elapsed time survives app backgrounding

The stopwatch SHALL always compute elapsed time as the difference between the current time and the anchor timestamp. It SHALL NOT accumulate ticks, so time spent with the app backgrounded, the screen locked, or the session screen exited and re-entered SHALL be reflected accurately when the display resumes.

#### Scenario: Return from background

- **WHEN** the app is backgrounded or the screen is locked for a period and then returns to the foreground while a stopwatch is displayed
- **THEN** the stopwatch immediately shows the correct total elapsed time including the backgrounded period

### Requirement: Elapsed time formatting

The stopwatch SHALL format elapsed time as minutes and seconds (`m:ss`, zero-padded) for durations under one hour, and as `h:mm:ss` for durations of one hour or more. Digits SHALL be displayed with a fixed-width numeric style so the layout does not shift while counting.

#### Scenario: Formatting under an hour

- **WHEN** elapsed time is 5 seconds, 65 seconds, or 125 seconds
- **THEN** the stopwatch displays `0:05`, `1:05`, or `2:05` respectively

#### Scenario: Formatting at an hour or more

- **WHEN** elapsed time is 3,723 seconds
- **THEN** the stopwatch displays `1:02:03`

### Requirement: Stopwatch does not interfere with header interaction

The stopwatch display SHALL not intercept touches, so tapping the exercise header (including the stopwatch area) SHALL continue to trigger the header's existing action.

#### Scenario: Tap on stopwatch area

- **WHEN** the user taps the exercise header on or near the stopwatch
- **THEN** the header's navigation behavior triggers as it would without the stopwatch
