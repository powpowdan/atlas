## Context

The manage screen (`app/exercise/manage.tsx`) renders sections through `AnimatedCategorySection` (ScrollView, measured-height accordion) from a pipeline: `exercises` → active/archived filter → `byCategory` → `sortCategories` → sections. Expansion is a component-local `Set<string>`. The exercise picker (`components/ExercisePickerModal.tsx:64-71`) already implements type-to-filter: case-insensitive substring on name; when searching it swaps to a flat list, when idle it shows grouped sections. The user chose behavior B: manage keeps its sectioned structure while searching — matching sections auto-expand — rather than the picker's flat-results mode.

## Goals / Non-Goals

**Goals:**

- Type-to-filter search on the manage screen with the picker's exact matching predicate and visual style.
- Keep category headers, counts, and category actions (long-press / web ⋯) available while searching.
- Compose with the Active/Archived filter; distinct no-match empty state.
- Preserve the user's per-visit expansion state across a search round-trip.
- First-tap row actions with the keyboard open.

**Non-Goals:**

- Flat results mode (picker-style list swap) — explicitly rejected in favor of sectioned results.
- Searching by category name (query matches exercise names only, same as picker).
- Search state persistence across screen visits; query resets on unmount like expansion state.
- Changes to the picker itself.

## Decisions

### D1: Compose the query into the existing pipeline, not a parallel render

Insert the filter between the filter-toggle step and grouping: `visible = exercises.filter(active/archived)` then `if (searching) visible = visible.filter(nameIncludes)`. Everything downstream (byCategory, sortCategories, sections map, AnimatedCategorySection) is untouched — one insertion point (manage.tsx `visible` computation) gives sectioned results for free and keeps a single code path.

*Alternative:* replicating the picker's searching? flat-FlatList branch (option A) — rejected by user decision; loses category actions and the accordion identity mid-search.

### D2: Derived expansion while searching — read, don't write

`expanded.has(cat)` becomes `expanded.has(cat) || searching` for the section's `expanded` prop. The user's `expanded` Set is never mutated by the search: querying only changes what's rendered; clearing the query reverts to the Set's state with zero restore logic. A user manually collapsing a section during search is accepted as a no-op visual quirk (it re-expands — actually the header tap still toggles the Set; to avoid confusion, header taps during search still write to the Set; the section stays expanded because `searching` dominates. Simplest and honest: `expanded = isExpanded(cat)` where `isExpanded = searching ? () => true : expanded.has`).

Concretely: `const effectiveExpanded = (cat: string) => searching || expanded.has(cat);` — taps still call `toggleExpanded` (harmless; affects post-search state), and the AnimatedCategorySection animates sections open as they mount under a query because `expanded` prop arrives true (withTiming from 0 → measured).

### D3: Reveal-on-create stays as-is (already safe)

`handleSaved` → `setRevealTarget(category)` → effect reads `headerY.get(target)`. If the query filters that category's section out of the render, no header mounted, no y in the registry → `undefined` → no scroll, no error. Guarded by existing code; spec'd as a no-op scenario. Expanding the Set for the new category still happens and shows up when the query clears — desirable.

### D4: Keyboard persistence + input placement

Search `TextInput` between toolbar and list, styles copied from the picker (`searchWrap`, `searchInput`). The ScrollView gains `keyboardShouldPersistTaps="handled"` — first tap on Edit/Archive/Delete fires while the keyboard is up (same rationale as the picker's FlatList/SectionList). `keyboardDismissMode="on-drag"` is added so scrolling the results naturally dismisses the keyboard.

### D5: Empty state branches three ways

Existing: archived-empty vs. never-created. New: `searching && sections.length === 0` → `No exercises match "query".` — mirroring the picker's `EmptyState` copy pattern (without the LogoMark/picker-specific create CTA; the manage screen's create button is already in its toolbar).

## Risks / Trade-offs

- [Auto-expanded sections animate on every query keystroke] — Sections enter/leave the render as the query narrows; each entering section plays its 200ms expand. At personal-library scale this reads as the accordion "breathing" with the query — the intended liveliness, consistent with the animated-accordion change. If it ever feels noisy, damp by disabling animation for search-driven mounts (not now).
- [Header taps during search write the post-search Set] — Deliberate (D2): a user collapsing "Legs" while searching means "I want Legs collapsed later" is *not* intuited either way; writing is simpler and reversible. Accepted.
- [Registry (`headerY`) churn while searching] — `onLayout` fires per header as sections mount/unmount; the Map just gets overwritten. Reveal-on-create unaffected (D3).

## Migration Plan

None — single-screen UI change, no schema/store/data impact. Rollback = revert manage.tsx.

## Open Questions

- None material. (Placeholder text and exact empty-state copy follow the picker's wording verbatim: "Search exercises" / `No exercises match "X".`.)
