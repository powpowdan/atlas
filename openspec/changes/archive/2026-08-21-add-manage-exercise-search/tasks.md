## 1. Search state + input

- [x] 1.1 Add `query` state and a search `TextInput` to `app/exercise/manage.tsx` between the toolbar and the list, styled identically to the picker's search (`searchWrap`/`searchInput` styles, placeholder "Search exercises"); add `keyboardShouldPersistTaps="handled"` and `keyboardDismissMode="on-drag"` to the ScrollView

## 2. Filtering

- [x] 2.1 Compose the query into the pipeline: filter `visible` by case-insensitive substring on name (picker predicate) between the active/archived filter and `byCategory` grouping; derive `searching = query.trim().length > 0`
- [x] 2.2 While `searching`, sections render expanded via a derived check (`searching || expanded.has(cat)`) without mutating the `expanded` Set; verify clearing the query restores pre-search expansion state unchanged
- [x] 2.3 Branch the empty state: searching with no matches shows `No exercises match "query".`; keep both existing no-exercises messages for the idle cases

## 3. Verification

- [x] 3.1 Run `npm run typecheck` (WSL-safe) and fix any errors
- [x] 3.2 Manual smoke from PowerShell (`npx expo start`): type "squ" → only matching sections shown, auto-expanded with animation, row actions work first-tap with keyboard open; search under Archived filter composes; no-match empty state shows the query; clear query → prior expansion restored; create an exercise whose category is filtered out by the query → no scroll, no error, visible when query clears
