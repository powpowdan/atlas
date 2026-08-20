## Why

Reordering exercises in the routine editor relies on tiny ↑/↓ arrow buttons,
which are slow for more than a one-position move and awkward on a phone.
Drag-to-reorder is the standard mobile idiom and the user explicitly asked for
hold-and-drag reordering.

## What Changes

- In `components/RoutineEditor.tsx` (backs both `app/routine/new.tsx` and
  `app/routine/[id].tsx`), replace the ↑/↓ arrow buttons and their
  `moveUp`/`moveDown` handlers with hold-and-drag reordering of exercise rows.
- Swap the `FlatList` for `DragList` from `react-native-draglist` (new pure-JS
  dependency — no native code, no config plugin, Expo Go compatible).
- Long-press anywhere on a row activates the drag; a hover style marks the
  lifted row; drop commits the new order to editor state (persisted on save,
  unchanged).
- Keep the ✕ remove action untouched.
- Fix the row key from `${id}-${idx}` to the stable `item` so the drag
  animation tracks rows correctly.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — existing requirement "Edit a routine" and its "Reorder exercises in a
routine" scenario already specify the behavior; only the interaction mechanism
changes. `skip_specs: true` is set in `.openspec.yaml`.)

## Impact

- `components/RoutineEditor.tsx`: list component, row rendering, keyExtractor,
  reorder handler; removal of arrow buttons and `moveUp`/`moveDown`.
- `package.json` / lockfile: add `react-native-draglist@3.11.0` (installed by
  the user from PowerShell per AGENTS.md).
- No schema, query, navigation, or spec changes.
