## Why

The "Manage" header button occupies the top-right of both the Sessions and Routines tabs at all times, for a low-frequency task (editing/archiving exercises). It is also vague — "Manage" gives no hint it leads to exercises. The exercise library belongs conceptually with routines (routines are built from exercises), so the entry point should live there, in the routines list, without occupying permanent header space.

## What Changes

- Remove the "Manage" `headerRight` button from the Sessions and Routines tab headers.
- Add a persistent "Exercise library" row pinned at the bottom of the Routines list (rendered via `ListFooterComponent`, below the empty state when no routines exist).
- Rename the management screen title from "Manage exercises" to "Exercise library" to match the new entry label.
- No changes to the management screen's functionality (create/edit/archive/restore, active/archived filter).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `exercises`: The "Persistent entry point for exercise management" requirement changes — the entry point moves from a header button on the Sessions and Routines tabs to a persistent "Exercise library" row at the bottom of the Routines list. The Sessions tab no longer provides a direct entry point; the exercise picker's "+ New" action remains the in-session creation path.

## Impact

- `app/(tabs)/_layout.tsx` — delete `ManageHeaderButton` and both `headerRight` usages.
- `app/(tabs)/routines.tsx` — add `ListFooterComponent` with the "Exercise library" row (routes to `/exercise/manage`), padded to clear the FAB.
- `app/exercise/manage.tsx` — update `navigation.setOptions` title to "Exercise library".
- No data, query, or modal changes. The picker (`ExercisePickerModal`) is untouched.
