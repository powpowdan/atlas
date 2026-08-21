## Context

The session screen (`app/session/[id].tsx`) renders exercises via a `FlatList` whose `renderItem` is a monolithic `ExerciseBlock` component (name + reference box + set-entry form + logged sets). Exercise blocks routinely exceed viewport height, so the exercise name scrolls out of view (see proposal.md — Why). The codebase already uses `SectionList` with section headers in `app/exercise/manage.tsx`, so the pattern is established. No existing specs, no data-layer involvement.

## Goals / Non-Goals

**Goals:**
- Real sticky behavior: a pinned header is pushed off by the next exercise's header, not hard-swapped.
- Preserve all existing `ExerciseBlock` behavior (set logging/edit/delete, reference chips, notes, warmup, carry-forward prefill).
- Sticky header docks below the static routine header (sticks to list top, not screen top).

**Non-Goals:**
- History detail screen (`app/history/[id].tsx`) — same visual problem, read-only; deferred.
- Enriched header content (set counts, "exercise 2/5") — name only for now.
- Any data, query, store, or navigation changes.

## Decisions

### D1: SectionList with `stickySectionHeadersEnabled` over alternatives
One section per exercise; header = exercise name, section data = a single sentinel/body item.

- vs. FlatList `stickyHeaderIndices` on a flattened `[hdr, body, hdr, body…]` array — works, but requires index bookkeeping over mixed item types; `stickyHeaderIndices` must be rebuilt whenever the exercise list changes. More fragile for no gain.
- vs. floating bar driven by `onViewableItemsChanged` — no push-off effect (hard swap), and because blocks are taller than the viewport, viewability callbacks misfire; would degenerate into hand-rolled `onScroll` + `onLayout` measurement.

### D2: Split `ExerciseBlock` into `ExerciseHeader` + `ExerciseBody`
- `ExerciseHeader` (rendered by `renderSectionHeader`): `Pressable` wrapping the name `Text`, navigating to `/exercise/<id>` as today. Opaque background, bottom hairline border, single-line ellipsis (`numberOfLines={1`).
- `ExerciseBody` (rendered by `renderItem`): everything except the name row — keeps owning the set-entry state, `useExerciseReference` hook, and mutation handlers. The block-level padding moves: vertical padding to header+body edges, the thick `borderBottomWidth: 8` separator moves to the body bottom so it doesn't sit under the pinned header.
- Alternatives considered: keep `ExerciseBlock` whole and render header as an empty stub — rejected; the name must live in the header for stickiness to work.

### D3: Section data shape
Each section: `{ id: sessionExercise.id, exercise: sessionExercise, data: [sessionExercise.id] }` — a one-element sentinel array so `renderItem` fires once per section and `keyExtractor` stays trivial. `ListEmptyComponent` on SectionList covers the zero-exercise case; `ListFooterComponent` keeps the "+ Add exercise" button.

### D4: KeyboardAvoidingView interaction unchanged
Sticky headers render inside the list viewport, below the existing static header — no conflict with `keyboardVerticalOffset`. No changes to keyboard handling.

## Risks / Trade-offs

- [Header style parity] Body padding/borders redistributed may subtly change spacing vs. the old flat block → compare screenshots of a multi-exercise session before/after.
- [`renderSectionHeader` re-renders on every parent state change] Since `refresh()` replaces `session` after each set save, headers re-render — cheap (single `Text`), acceptable; `ExerciseBody` keeps its existing behavior.
- [Single-exercise sessions] The name pins from the very top and never leaves — acceptable, arguably helpful; noted, not mitigated.
- [Android sticky quirks] Older RN versions had flicker with sticky headers over `KeyboardAvoidingView`; RN 0.81 is fine, but verify on Android during implementation (user runs app on Windows-native Expo).

## Migration Plan

Single-file refactor in one PR/change; no data migration. Rollback = revert the commit.
