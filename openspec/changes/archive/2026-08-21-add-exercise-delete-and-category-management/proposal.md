## Why

Users can create categories and exercises but can never fully remove them: exercises only get archived (never deleted), and categories — which have no existence beyond the exercises referencing them — haunt the category chip row forever, even when every exercise in them is archived. A user who creates junk categories by mistake (typos, experiments) has no way to clean up, violating the app's CRUD completeness.

## What Changes

- Add **hard delete for archived exercises** with snapshot-on-delete: session history keeps a frozen copy of the exercise name/category, so past workouts render identically forever while the exercise becomes unusable going forward.
- Add a **Delete action on archived exercises** in the manage screen (alongside Restore).
- Add **category management** in the manage screen (long-press a category section header): **Rename/Merge** (renaming to an existing name merges — the typo cure) and **Delete** (enabled only when zero exercises, active or archived, reference the category; otherwise blocked with guidance).
- **Starve the chip row**: the exercise editor's category chips are sourced from active exercises only (plus the edited exercise's own category), so junk categories disappear from the picker once their exercises are archived or deleted.
- Add a **fuzzy "did you mean…?" suggestion** when creating a new category whose normalized name nearly matches an existing one, preventing typo categories at creation time.
- Migration v5: add nullable `exercise_name` / `exercise_category` snapshot columns to `session_exercises` (lazy backfill on delete; no bulk migration).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `exercises`: archived exercises gain a hard-delete action; deletion snapshots name/category into session history and removes routine references. Delete is exposed only on archived exercises.
- `exercise-categories`: chips source from active exercises; category rename/merge and empty-category delete are added to the manage screen; new-category input offers fuzzy near-match suggestions.
- `sessions`: session detail reads fall back to snapshot columns when the referenced exercise has been deleted, preserving history display.

## Impact

- `db/schema.ts`, `db/client.ts` — migration v5 (snapshot columns).
- `db/queries/exercises.ts` — new `deleteExercise` (transactional snapshot + cleanup), category rename/merge, category reference counts.
- `db/queries/sessions.ts` — `getSession` joins become LEFT JOIN + COALESCE over snapshot columns.
- `app/exercise/manage.tsx` — Delete action on archived rows; category long-press actions (Rename/Merge, Delete).
- `components/ExerciseEditorModal.tsx` — chip source change; fuzzy suggestion on new category.
- `constants/categories.ts` — normalization helper for fuzzy matching.
- No breaking changes; FK enforcement remains off (transaction ordering protects integrity).
