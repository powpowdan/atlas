## 1. Types and constants

- [x] 1.1 Create `constants/categories.ts`: `CANONICAL_CATEGORIES` (Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs) and `sortCategories(names)` (canonical index first, rest alphabetical)
- [x] 1.2 Remove `is_assisted` from `Exercise`, `ExerciseInput`, `ExerciseUpdate` in `types/index.ts`

## 2. Data layer

- [x] 2.1 Rewrite `seed/exercises.json` with the ~70-exercise catalog (10 Chest, 14 Back, 9 Shoulders, 6 Biceps, 6 Triceps, 19 Legs incl. machine movements, 7+Abs incl. Pallof press), every row carrying a canonical category and no `is_assisted`
- [x] 2.2 Migration v3 in `db/client.ts`: `DROP COLUMN is_assisted`; create `seed_version` table; guarded UPDATEs for the 11 legacy renames/category remaps (table in design.md D2) plus `Core`→`Abs` / `Bodyweight`→`Back` straggler backfills
- [x] 2.3 Remove `is_assisted` from `db/schema.ts` exercises DDL and from `db/queries/exercises.ts` (ExerciseRow, rowToExercise, SELECT_COLS, create/update SQL)
- [x] 2.4 Rework `seedExercisesIfEmpty` → `seedExercises` in `db/queries/exercises.ts`: record/check `seed_version`, insert unapplied seed versions with `INSERT OR IGNORE`, record version 2; called from `migrateDb` AFTER migration v3
- [x] 2.5 Remove `exercise_is_assisted` JOIN columns and mappings from `db/queries/sessions.ts` and `db/queries/routines.ts`

## 3. Editor modal

- [x] 3.1 Replace category TextInput + assisted Switch in `ExerciseEditorModal.tsx` with a chip row: canonical categories, then existing DB categories (alphabetical), then `+ New…` chip revealing a TextInput; submitting trims, dedupes case-insensitively, and selects
- [x] 3.2 Block save with inline error when no category is selected; edit mode pre-selects current category; remove all assisted state/logic

## 4. Manage screen

- [x] 4.1 Rewrite `app/exercise/manage.tsx` as category accordion: SectionList with category sections in `sortCategories` order, counts in headers, `expanded: Set<string>` state toggled by header tap (collapsed → empty data)
- [x] 4.2 Add `[Active | Archived]` filter toggle; archived rows dimmed under their categories with Restore action; hide empty categories under the current filter
- [x] 4.3 Remove the `· assisted` meta suffix

## 5. Picker modal

- [x] 5.1 Group `ExercisePickerModal` list by category (SectionList, canonical order) when the search query is empty; keep flat filtered list while searching; remove the `· assisted` suffix

## 6. Progression + cleanup

- [x] 6.1 Remove `· assisted` from the subtitle in `app/exercise/[id].tsx`
- [x] 6.2 Sweep for remaining `is_assisted`/assisted references (code + specs) and remove; run `npm run typecheck` from WSL

## 7. Verification (user runs app from PowerShell)

- [x] 7.1 Fresh-install path: full ~70 catalog present, every exercise categorized, no assisted UI anywhere
- [x] 7.2 Upgrade path on a dev DB with history against old names: rows renamed per D2 table, sets/history intact, no duplicate rows, old categories gone from grouping, archived seed rows stay archived
- [x] 7.3 Editor: inline "Forearms" category creation works; required-category error blocks save; manage accordion + Archived filter behave per spec
