## Why

The seed exercise library is 11 entries of personal shorthand ("Bi", "Tri pulldown", "Assisted") transcribed from the user's `exampleworkout.txt` — not a usable default catalog. The current UI also can't scale to a real library: the manage screen is a flat list, category is optional free text, and the `is_assisted` flag was a mistake (it existed to label one exercise, "Assisted pullups").

## What Changes

- **Expanded seed catalog (~65 → reviewed list)**: replace the 11-exercise seed with a curated gym-staples library (~70 exercises) covering seven muscle groups, including machine movements (leg press, hack squat, hip abduction/adduction, glute kickback).
- **Versioned re-seed**: seed upgrades become versioned so existing installs gain new exercises without touching renamed, archived, or user-created rows. Replaces the all-or-nothing `seedExercisesIfEmpty`.
- **Legacy row migration (v3)**: rename the old 11 seed rows to their catalog names (e.g. "Bench" → "Barbell bench press", "Assisted" → "Assisted pullups", "Bi" → "Barbell curl") preserving all history, and remap legacy categories (Core → Abs, Arms → Biceps/Triceps, Bodyweight → Back). **BREAKING** at the DB level: `is_assisted` column is dropped.
- **Required categories**: every exercise must have a category, chosen from a canonical seven — Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs, in conventional muscle order — or a user-created category (typed inline in the editor). No "Other" bucket; no uncategorized exercises.
- **Category-grouped manage screen**: `app/exercise/manage.tsx` becomes an accordion — categories are expandable sections with counts; an `[Active | Archived]` filter toggle replaces the Active/Archived sections, with archived rows dimmed under their categories.
- **Category-grouped picker**: `ExercisePickerModal` groups exercises under category headers; search is retained and filters across groups, hiding empty ones.
- **Remove `is_assisted`** everywhere: schema column, types, query JOINs, editor switch, and the "· assisted" meta suffixes in picker/manage/progression screens.

## Capabilities

### New Capabilities

- `exercise-categories`: canonical category vocabulary (ordering, required selection, user-created categories) and category-grouped presentation of the library in the manage screen and picker.
- `exercise-seed-catalog`: versioned seed catalog content and upgrade behavior — how existing installs acquire new exercises and how legacy rows/categories are migrated.

### Modified Capabilities

- `exercises`: "Create an exercise" and "Edit an exercise" lose the assisted flag and gain required chip-based category selection (with inline category creation); "List exercises for picking" management view scenario changes from Active/Archived sections to category accordion + archived filter.

## Impact

- **DB**: migration v3 in `db/client.ts` (drop `is_assisted`, legacy renames/category remaps, `seed_version` table); `db/schema.ts` column removal; seed rewrite in `seed/exercises.json`.
- **Queries**: `db/queries/exercises.ts` (drop assisted from row mapping/INSERT/UPDATE, versioned seed), `db/queries/sessions.ts` and `db/queries/routines.ts` (drop `exercise_is_assisted` JOIN columns).
- **UI**: `components/ExerciseEditorModal.tsx` (chip picker + inline new category, switch removed), `app/exercise/manage.tsx` (accordion + filter toggle), `components/ExercisePickerModal.tsx` (grouped sections), `app/exercise/[id].tsx` (meta line).
- **Types**: `types/index.ts` — remove `is_assisted` from `Exercise`, `ExerciseInput`, `ExerciseUpdate`.
- **Specs**: delta to `openspec/specs/exercises/spec.md`; new specs for the two new capabilities.
- **Non-goals**: Routines-tab IA restructure (segments), tap-through from manage rows to the progression chart, category rename/merge management, manage-screen search.
