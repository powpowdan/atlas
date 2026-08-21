## Why

The exercise library can grow to dozens of exercises across many categories, and the manage screen offers no way to find one: the user must manually expand category sections and scan rows to locate an exercise to edit, archive, or delete. The exercise picker already solves this with a type-to-filter search; the manage screen should match it.

## What Changes

- Add a type-to-filter search input to the exercise manage screen, styled identically to the picker's search, placed between the toolbar and the list.
- Filtering is case-insensitive substring match on exercise name — the same predicate as the picker.
- While searching, matching category sections render and are automatically expanded (headers and their long-press category actions remain available); non-matching sections are hidden. Clearing the query returns to the normal accordion with the user's per-visit expansion state untouched.
- Search composes with the Active/Archived filter toggle: the query filters within the selected filter.
- The list handles first-tap row actions while the keyboard is open (`keyboardShouldPersistTaps="handled"`).
- A distinct empty state indicates when the query matches nothing, versus the existing no-exercises empty state.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `exercises`: adds a type-to-filter search requirement for the exercise management screen (sibling of the picker's existing search requirement).
- `manage-accordion`: sections auto-expand under an active query and expansion state is preserved across a search round-trip.

## Impact

- `app/exercise/manage.tsx` — search state + input, composed filter, auto-expand during search, `keyboardShouldPersistTaps`, search-aware empty state.
- No data-layer, component, or navigation changes. The picker is untouched.
