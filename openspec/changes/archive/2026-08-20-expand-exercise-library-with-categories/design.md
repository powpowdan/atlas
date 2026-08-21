## Context

`db/client.ts` runs versioned migrations (v1 initial, v2 `archived_at`) followed by `seedExercisesIfEmpty`, which seeds only when the table is completely empty. `exercises.category` is a nullable free-text column; the editor (`ExerciseEditorModal`) exposes it as an optional TextInput plus an `is_assisted` switch. The manage screen (`app/exercise/manage.tsx`) is a `SectionList` sectioned Active/Archived. The picker (`ExercisePickerModal`) is a flat searchable list. Seed data lives in `seed/exercises.json` (11 rows from `exampleworkout.txt`).

## Goals / Non-Goals

**Goals:**

- Grow the default library to ~70 curated exercises delivered to fresh AND existing installs
- Make category a required, constrained attribute with a canonical vocabulary + user extension
- Category-grouped presentation (accordion manage screen, grouped picker) without a `categories` table
- Retire `is_assisted` cleanly; migrate legacy rows with zero history loss

**Non-Goals:**

- Tab/IA restructure (Routines segments), progression tap-through from manage rows, category rename/merge UI, manage-screen search, new external dependencies

## Decisions

### D1: Categories stay a TEXT column; vocabulary lives in code

`constants/categories.ts` exports `CANONICAL_CATEGORIES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs']` (display order) and a helper `sortCategories(names: string[])` (canonical order first by index, user categories after, alphabetical). User-created categories are just new strings that arrive via the editor; "existing categories" for chip rendering = canonical ∪ distinct `category` values in the exercises table.

*Why not a `categories` table:* single-user app, categories carry only a name; a table buys FK integrity and `sort_order` at the cost of a migration, join, and ghost-row pruning. Text + code-side ordering was chosen during exploration; grouping is `GROUP BY`/JS-side sort. Renaming a category later would mean an `UPDATE ... WHERE category = ?` — acceptable, and category management is a non-goal.

### D2: Migration v3 does drop + backfill + rename, then versioned re-seed

All in `db/client.ts` as `MIGRATION_V3`, matching v2's inline-statement pattern:

1. `ALTER TABLE exercises DROP COLUMN is_assisted` (SQLite supports DROP COLUMN on expo-sqlite/SDK 54; column has no indexes/constraints)
2. Legacy renames + category remaps — guarded `UPDATE exercises SET name=…, category=… WHERE name=…` for each of the 10 old rows that change ("Face pull" keeps its name/category):

   | Old | New name | Category |
   |---|---|---|
   | Bench | Barbell bench press | Chest |
   | Fly | Dumbbell fly | Chest |
   | Ab crunch | Crunch | Abs |
   | Paloff press | Pallof press | Abs |
   | Face pull | Face pull | Back |
   | Tri pulldown | Triceps pushdown | Triceps |
   | Bi | Barbell curl | Biceps |
   | Pulldown | Lat pulldown | Back |
   | Seated row | Seated cable row | Back |
   | Assisted | Assisted pullups | Back |
   | Shoulder press | Overhead press | Shoulders |

3. Backfill for stragglers: `UPDATE exercises SET category='Abs' WHERE category IN ('Core')`, `category='Back' WHERE category IN ('Bodyweight')` — Arms rows are covered by the per-exercise renames; any *user-created* rows keep their category, and NULL-category rows are left NULL (editor forces a pick on next edit — see spec `Edit an uncategorized legacy exercise`)

Renames run before seeding so `INSERT OR IGNORE` sees the new names and doesn't duplicate. Updates are idempotent (guarded by `WHERE name = '<old>'`), so re-runs are no-ops.

### D3: `seed_version` table + always-INSERT-OR-IGNORE seeding

New table `seed_version (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)`, created inside migration v3. `seedExercises` (renamed from `seedExercisesIfEmpty`) checks applied versions and inserts the catalog with `INSERT OR IGNORE` per row for any unapplied version, then records it. First release of this change is seed version 2 (version 1 implicit = the old 11-row seed). Known wart, accepted: a user-renamed seed exercise results in both the renamed row and the re-added original (spec'd in `exercise-seed-catalog`). `seedRoutinesIfEmpty` keeps its if-empty behavior, but its `SEED_ROUTINES` name references are updated to the catalog names — otherwise a fresh install (new catalog, old names) would resolve zero exercises and silently skip routine seeding. Fresh-install note: v3's `DROP COLUMN` is guarded by a `PRAGMA table_info` check because the v1 DDL no longer creates the column.

### D4: Editor = chip row + inline "New category" text input

Replace the category TextInput and assisted Switch with a wrapping chip row (canonical first, then user categories observed in the DB, alphabetical). A `+ New…` chip toggles a small TextInput; submitting trims, title-cases nothing (stores as typed), dedupes case-insensitively against existing chips (just selects the existing one), and selects the new category. Save is blocked with an inline error until a category is selected (edit mode pre-selects the exercise's current category; a NULL category pre-selects nothing). `is_assisted` leaves `ExerciseInput`/`ExerciseUpdate`/`Exercise`.

### D5: Manage screen accordion via SectionList

One `SectionList` whose `sections` are categories (canonical order, then user categories alphabetical; empty categories omitted) containing exercises filtered by the `[Active | Archived]` toggle. Header tap toggles membership in an `expanded: Set<string>` state; collapsed sections render their rows as `data: []` with the count in the header. Archived rows reuse the existing dim style (`opacity: 0.6`) and show Restore instead of Edit/Archive. "+ New exercise" stays in the toolbar; the FAB-style affordance is unchanged in spirit.

### D6: Picker = SectionList grouped, flat while searching

`ExercisePickerModal` renders `SectionList` with category headers when the query is empty; when searching, it renders the existing flat filtered list (scroll position and section collapse juggling during typing isn't worth it; hiding empty groups falls out of the flat list naturally by only including matched exercises' categories). Search behavior itself is unchanged (case-insensitive substring, spec'd in `exercises`).

### D7: `is_assisted` removal scope

- `db/schema.ts`: column out of the DDL (v1 statement — fresh installs never get it; v3 handles existing)
- `db/queries/exercises.ts`: `ExerciseRow`, `rowToExercise`, `SELECT_COLS`, seed/insert/update
- `db/queries/sessions.ts`, `db/queries/routines.ts`: drop `e.is_assisted AS exercise_is_assisted` JOIN columns and their mappings
- `types/index.ts`: three interfaces
- UI: editor switch, `· assisted` suffixes in picker/manage/progression meta lines
- Spec deltas: `exercises` create/edit requirements rewritten without the flag (already in this change's specs)

## Risks / Trade-offs

- [Renamed seed exercise resurrects the original on re-seed] → Accepted (spec'd); personal-app scale, user can archive the dupe. A `source` column was considered and rejected as complexity for one edge case.
- [`DROP COLUMN` unsupported on very old SQLite] → expo-sqlite SDK 54 bundles a modern SQLite; safe. Fallback if it ever fails: stop selecting the column and leave it as cruft (behavior identical).
- [SectionList accordion perf with ~70 rows + expansion state] → trivial at this scale; `data: []` for collapsed sections keeps row virtualization intact.
- [Chip row on small screens with many user categories] → wrap or horizontal-scroll; wrapping `flexWrap` chosen, revisit if it looks cramped.
- [Migration ordering bug (seed before rename → duplicates)] → tasks explicitly sequence v3 migration (renames) before `seedExercises`; verification task covers the upgrade path on a dev DB.

## Migration Plan

1. Ship migration v3 + seed v2 in one release; both run inside `migrateDb`'s existing bootstrap before any screen reads the DB.
2. Rollback: none beyond reinstalling the previous build (local-only data; acceptable for this app).
3. Manual verification paths (PowerShell, by the user): fresh install (full catalog, all categorized); existing dev DB with history against old names (renames preserve sets; no duplicate rows; assisted gone).

## Open Questions

- None blocking. Exact catalog contents are settled (see proposal/tasks); minor name tweaks during implementation review are fine.
