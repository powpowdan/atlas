## Why

The exercise manage screen's category accordion snaps between states: rows teleport into existence on expand and vanish instantly on collapse, and the chevron flips as a character swap. After creating a new exercise, the landing category section stays collapsed — the just-created exercise is invisible until the user manually hunts down and expands its section. The screen feels static and unresponsive precisely where it should feel alive.

## What Changes

- Replace the manage screen's `SectionList` with a `ScrollView` of per-category sections whose bodies animate open/closed via measured-height animation (true accordion: smooth expand and collapse).
- Rotate the section chevron continuously (0°→90°) instead of swapping the `▸`/`▾` glyphs.
- After creating a new exercise, automatically expand its category section and scroll the section header into view so the created exercise is immediately visible.
- Expansion state remains per-visit (resets on leaving the screen) — deliberately no cross-visit persistence.
- Add `react-native-reanimated` as a dependency (new architecture is enabled; `LayoutAnimation` is unsupported there).

## Capabilities

### New Capabilities

- `manage-accordion`: Animated, true-accordion behavior of the exercise manage screen's category sections, including reveal-on-create.

### Modified Capabilities

- `exercise-categories`: the "Category-grouped manage screen" requirement's accordion semantics change from instant row swap to animated expand/collapse with reveal-on-create.

## Impact

- `app/exercise/manage.tsx` — list restructure (SectionList → ScrollView + animated section bodies), chevron rotation, create-reveal logic with per-header y tracking.
- `package.json` — add `react-native-reanimated` (install must run from PowerShell per AGENTS.md).
- No data-layer, store, or navigation changes. The exercise picker modal (`components/ExercisePickerModal.tsx`) is explicitly out of scope — it is a search list, not an accordion.
