## Why

During an active session, each exercise block is taller than the viewport (reference chips, set-entry form, logged sets). Once the user scrolls past an exercise's name, logged set rows carry no indication of which exercise they belong to, making it easy to log sets against the wrong exercise.

## What Changes

- Replace the `FlatList` of exercise blocks on the session screen (`app/session/[id].tsx`) with a `SectionList` — one section per exercise.
- Render each exercise's name as a sticky section header (`stickySectionHeadersEnabled`) so it stays pinned to the top of the list while its block scrolls, and is pushed off by the next exercise's header.
- Sticky headers render with a solid background and bottom border so content scrolling beneath them stays legible; long names ellipsize.
- The exercise name remains tappable (navigates to the exercise detail screen) while stuck.

## Capabilities

### New Capabilities
- `session-exercise-scroll`: Sticky per-exercise headers in the active session screen so the current exercise is always identifiable while scrolling.

### Modified Capabilities

(none — no existing specs)

## Impact

- `app/session/[id].tsx`: split `ExerciseBlock` into a section header (exercise name) and section body (reference box, set-entry form, set list); list component swap.
- No data-layer, navigation, or store changes. History detail screen (`app/history/[id].tsx`) is explicitly out of scope.
