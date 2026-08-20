## Context

The routine editor (`components/RoutineEditor.tsx`) keeps the exercise order in
a `selected: string[]` state, persisted wholesale by `updateRoutine`/`createRoutine`
on save — reordering is purely a client-side array operation. The screen has no
gesture dependencies today; installs run on Windows-native Node per AGENTS.md
(done — `react-native-draglist@3.11.0`, pure JS, verified Expo-compatible with
no babel/metro changes).

## Goals / Non-Goals

**Goals:**

- Long-press a row, drag, drop — others slide aside; order commits on drop.
- Save still persists the new order (existing behavior, unchanged).
- ✕ remove and picker add unaffected; list still scrolls normally.

**Non-Goals:**

- Drag-reorder on any other screen (session exercises, picker).
- Quick-edit/inline rename, swipe actions.
- Spec changes (covered by "Edit a routine" requirement already).

## Decisions

### D1: `react-native-draglist` over hand-rolled PanResponder

User-selected. Pure JS (wraps FlatList), zero native/config footprint. API
(v3.11): `onReordered(from, to)` commits the move; renderItem supplies
`onDragStart`/`onDragEnd`/`isActive`. Alternative (hand-rolled PanResponder,
~150 lines of gesture math we'd own) rejected by user choice.

### D2: Long-press whole row as the drag trigger

`onLongPress={onDragStart}` + `onPressOut={onDragEnd}` on the row `Pressable`.
Rows have no tap action, so no gesture conflict; ✕ remains a normal press
(child pressables win over the parent long-press). User-selected over a
dedicated ☰ grip handle.

### D3: Hover style via `isActive`

While dragging: paperDeep background, ink border, elevation shadow. Signals
the lifted row without hiding its contents.

### D4: keyExtractor fix is a prerequisite, not a nicety

Current keys embed the index (`${id}-${idx}`); index-keyed rows break the
library's hover/move animation (rows remount as indices shift). Keys become
the exercise id (`item`) — safe here because routine exercises are already
deduped on add.

### D5: Guard the splice

`onReordered` early-returns when `from`/`to` are equal or out of bounds —
defensive against the library's edge callbacks on tiny lists.

## Risks / Trade-offs

- [Library churn under `KeyboardAvoidingView` on this screen] → KAV here is a
  dormant platform-conditional wrapper (Android no-op); verify on device;
  fallback = hand-rolled PanResponder (no spec impact).
- [Dropped row renders blank on Fabric until next drag] → Confirmed on device:
  React 19/RN 0.81 new-arch repaint bug in the library's animated cell layer;
  no upstream fix (3.11.0 is latest). Mitigated by remounting the DragList
  (`key={listEpoch}` bumped on every committed reorder) — scroll position
  resets on drop, acceptable for short routine lists. Fallback remains
  hand-rolled PanResponder if further issues appear.
- [Long-press vs scroll: drag could hijack scroll gestures] → Long-press only
  arms the drag after the hold; plain scrolls pass through. Verify on device.
- [New dependency in an otherwise gesture-free repo] → Pure JS, MIT, tiny
  surface; pinned by lockfile.

## Migration Plan

Single component change; no data impact. Rollback = restore FlatList +
arrow buttons.
