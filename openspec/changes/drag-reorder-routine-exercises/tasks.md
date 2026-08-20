## 1. Editor implementation

- [x] 1.1 In `components/RoutineEditor.tsx`, import `DragList` from
      `react-native-draglist`; replace the `FlatList` with it (same
      `data`/`style`/`ListEmptyComponent`; `keyExtractor` becomes `(_, i) =>
      item` — stable exercise-id keys, dropping the index suffix).
      **Fix after device test:** DragList wraps the FlatList in an unstyled
      View — `style` only reaches the inner list, so the wrapper collapsed to
      0 height and rows vanished. Added `containerStyle={{ flex: 1 }}`
      (`styles.listContainer`) to size the wrapper.
- [x] 1.2 Render rows: wrap the existing row layout in a `Pressable` with
      `onLongPress={onDragStart}` / `onPressOut={onDragEnd}` from the
      `DragList` render info; apply a hover style when `isActive` (design D3).
- [x] 1.3 Delete `moveUp`/`moveDown` and the ↑/↓ buttons; add `reorder(from,
      to)` with the D5 bounds guard as an immutable splice on `selected`, wired
      to `onReordered`.
      **Fix after device test:** on drop, the moved row went blank until the
      next drag (Fabric/new-arch repaint bug in the library's
      CellRendererComponent; no upstream fix — 3.11.0 is latest, issue #76 was
      a different bug). Workaround: bounds guard moved outside the state
      updater and a `listEpoch` counter remounts the DragList via `key` on
      every committed reorder.
- [x] 1.4 Run `npm run typecheck` (WSL-safe) and confirm clean.

## 2. On-device verification (user, from PowerShell)

- [ ] 2.1 Long-press a row → it lifts (hover style); dragging slides other
      rows aside; drop commits the new position (index numbers update).
- [ ] 2.2 Save the routine, reopen it → order persisted.
- [ ] 2.3 Plain vertical scrolling still works (no drag hijack); ✕ removes;
      + Add still appends; works on both `routine/new` and `routine/[id]`.

## 3. Wrap-up

- [ ] 3.1 Run `openspec validate drag-reorder-routine-exercises --strict`
      before archive.
