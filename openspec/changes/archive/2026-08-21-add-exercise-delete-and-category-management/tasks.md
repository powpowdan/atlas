## 1. Migration: snapshot columns

- [x] 1.1 Add `exercise_name TEXT NULL` and `exercise_category TEXT NULL` columns to the `session_exercises` DDL in `db/schema.ts` (fresh-install path)
- [x] 1.2 Add migration v5 in `db/client.ts` (ALTER TABLE × 2 via `applyMigration`, matching the v2 pattern); verify a v4 database migrates and a fresh install converges to the same shape

## 2. Exercise hard delete (queries)

- [x] 2.1 Implement `deleteExercise(db, id)` in `db/queries/exercises.ts`: single transaction — snapshot name/category onto `session_exercises` (only rows where snapshot is NULL), delete `routine_exercises` rows, delete the exercise row; throw if the exercise does not exist
- [x] 2.2 Change `getSession`'s exercise query in `db/queries/sessions.ts` to LEFT JOIN + `COALESCE(se.exercise_name, e.name)` / `COALESCE(se.exercise_category, e.category)`; type `exercise_name`/`exercise_category` fallbacks so deleted exercises render with a null-id-safe representation

## 3. Category queries

- [x] 3.1 Implement `renameCategory(db, oldName, newName)` in `db/queries/exercises.ts`: trim/validate non-empty, case-insensitive merge onto an existing target name when one exists (pick the existing casing), single `UPDATE exercises SET category` — active and archived rows alike
- [x] 3.2 Implement `countExercisesInCategory(db, category)` (active + archived count) in `db/queries/exercises.ts`

## 4. Manage screen: exercise delete + category actions

- [x] 4.1 Add a Delete action to archived exercise rows in `app/exercise/manage.tsx` with confirmation (extend the `confirmDiscard` web/native pattern) and copy stating history is preserved; call `deleteExercise` and refresh
- [x] 4.2 Add long-press on section headers (visible "⋯" affordance on web) opening a category action sheet with Rename/Merge… and Delete
- [x] 4.3 Implement Rename/Merge flow: single-text-input prompt → `renameCategory` → refresh; on the Archived filter, sections must update too (shared `refresh` covers it)
- [x] 4.4 Implement Delete flow: call `countExercisesInCategory`; zero → confirm dialog → (categories being derived, confirm just closes; section disappears via refresh) ; non-zero → block dialog reporting the count (active/archived split if mixed) with guidance to merge or delete exercises first
- [x] 4.5 Verify the stale-render path: delete an archived exercise from the open sheet/list and confirm its category section disappears without an explicit category delete

## 5. Editor: chip starvation + fuzzy suggestion

- [x] 5.1 In `components/ExerciseEditorModal.tsx`, source `loadCategories` from active exercises only (`includeArchived: false`) and union in the edited exercise's own category so it stays visible/selectable
- [x] 5.2 Add `normalizeCategory` (lowercase, strip non-alphanumerics) and `suggestCategory` (exact-normalized → that category; else Levenshtein ≤ 2 and ≤ 40% of target length → best match) to `constants/categories.ts`
- [x] 5.3 Wire the fuzzy hint into the new-category input in the editor: exact normalized match auto-selects the existing category (generalizing today's lowercase dedupe); near-match shows a non-blocking "Did you mean 'X'?" with a Use action; typed name remains creatable when dismissed

## 6. Verification

- [x] 6.1 Run `npm run typecheck` (WSL-safe) and fix any errors
- [x] 6.2 Manual smoke from PowerShell (`npx expo start`): delete an archived exercise with history → session detail still shows name/category/sets; merge "Chset"→"Chest" → manage + chips update; archive last exercise of a custom category → chip gone from editor; type "Chset" in new-category → suggestion appears; blocked category delete shows correct counts
- [x] 6.3 Confirm progression chart for a deleted exercise still renders its historical sessions and a recreated same-name exercise starts fresh (keys differ)
