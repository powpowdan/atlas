## 1. Component split

- [x] 1.1 Extract `ExerciseHeader` component in `app/session/[id].tsx`: Pressable exercise name (navigates to `/exercise/<id>`), opaque background, bottom hairline border, `numberOfLines={1}` ellipsis
- [x] 1.2 Extract `ExerciseBody` component from `ExerciseBlock` (everything except the name row), keeping set-entry state, `useExerciseReference`, and all mutation handlers intact
- [x] 1.3 Redistribute block padding/separators: header gets top padding, body gets the thick bottom separator (`borderBottomWidth: 8`) so it never sits under a pinned header

## 2. List swap

- [x] 2.1 Replace the `FlatList` with a `SectionList` — one section per exercise using the sentinel shape from design.md D3, `stickySectionHeadersEnabled`, `renderSectionHeader` → `ExerciseHeader`, `renderItem` → `ExerciseBody`
- [x] 2.2 Preserve `ListFooterComponent` ("+ Add exercise") and empty-state handling via `ListEmptyComponent`

## 3. Verification

- [x] 3.1 Run `npm run typecheck` from WSL — clean
- [x] 3.2 Manual test from PowerShell (`npx expo start`): multi-exercise session — name pins while scrolling its block, next exercise's header pushes it off, tapping pinned name opens exercise detail, long name ellipsizes
- [x] 3.3 Manual regression: add/edit/delete sets, warmup toggle, reference-chip copy, carry-forward prefill, session note, add-exercise flow, complete/discard session all behave as before
