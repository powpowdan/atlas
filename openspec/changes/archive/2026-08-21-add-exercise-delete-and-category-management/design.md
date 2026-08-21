## Context

Categories are not entities — they are bare `TEXT` values on `exercises` rows, materialized at read time (`DISTINCT category`) and merged with seven hardcoded canonicals (`constants/categories.ts`). The exercise editor's chip row currently sources categories from `listExercises(db, { includeArchived: true })` (ExerciseEditorModal.tsx:49), so category names survive as long as any archived exercise carries them. Exercises have soft-delete only (`archived_at`); there is no hard delete.

Foreign keys are never enabled (`PRAGMA foreign_keys` is not set in `db/client.ts`), and history reads JOIN live exercise rows: `session_exercises.exercise_id → exercises.id` with an INNER JOIN in `getSession` (db/queries/sessions.ts:356). A naive `DELETE FROM exercises` would "succeed" and silently orphan history rows — the INNER JOIN would then drop them from session detail views. `routine_exercises` rows reference exercises with no ON DELETE rule either.

## Goals / Non-Goals

**Goals:**

- Hard delete for archived exercises that provably cannot lose history data.
- Category cleanup verbs (rename/merge, guarded delete) fitting the categories-are-just-text model.
- Chip starvation + fuzzy creation guard so junk categories stop accumulating.
- All destructive operations transactional and idempotent under the existing migration framework.

**Non-Goals:**

- A first-class `categories` table (no category metadata: order, color, icons).
- Hard delete for *active* exercises (archive-first remains the only path; delete is the second, explicit step).
- Bulk/multi-select exercise deletion.
- Changing rename semantics: live-join propagation to history stays as-is.
- Snapshotting exercises on archive (only on delete).

## Decisions

### D1: Snapshot-on-delete, not ON DELETE CASCADE or FK enforcement

Migration v5 adds nullable columns `exercise_name TEXT` and `exercise_category TEXT` to `session_exercises`. `deleteExercise` runs one transaction:

1. `UPDATE session_exercises SET exercise_name = <live name>, exercise_category = <live category> WHERE exercise_id = ? AND exercise_name IS NULL`
2. `DELETE FROM routine_exercises WHERE exercise_id = ?`
3. `DELETE FROM exercises WHERE id = ?`

Guards: the routine-membership check that archive flow relies on is unnecessary here — routine rows are simply removed (same user-visible outcome as the exercise being gone from pickers, but cleaner than leaving dangling references).

*Alternatives considered:* enabling `PRAGMA foreign_keys = ON` with `ON DELETE SET NULL` (loses the name — history shows blanks; also risky to flip globally mid-app-lifecycle); copying exercises to a `deleted_exercises` tombstone table and keeping the INNER JOIN (extra table, extra joins, tombstones resurrect on name collision with a recreated exercise). Snapshot columns keep history reads a single LEFT JOIN.

### D2: History reads fall back, live rows stay authoritative

`getSession`'s exercise query becomes `LEFT JOIN exercises e ON e.id = se.exercise_id` with `COALESCE(se.exercise_name, e.name)` and `COALESCE(se.exercise_category, e.category)`. While the exercise exists, live values win (rename propagation unchanged — deliberately). Snapshot columns are written **only** by `deleteExercise`, never backfilled by migration: pre-delete rows all have live exercises, so NULL snapshot is correct for all existing data. Lazy backfill, zero migration cost.

`routines.ts` reads are untouched: their join rows are deleted by step 2, so no dangling references exist.

### D3: Delete exposed only on archived rows in the manage screen

Archived rows currently show a single Restore action; they gain Delete. Active rows keep Edit/Archive. Confirmation dialog mirrors the existing `confirmDiscard` helper (web `window.confirm`, native `Alert.alert` with destructive style). Copy must state irreversibility and that session history is preserved: "Delete permanently? Its history stays in past sessions, but it can't be reused."

### D4: Category actions live on the section header (long-press), no new screen

Long-pressing a category section header in the manage screen opens a small action sheet: Rename/Merge… and Delete. This avoids a whole categories-management screen while giving every category a CRUD surface where categories actually appear. Rename is a single-text-input prompt; submitting a name that case-insensitively equals an existing category performs a merge (one `UPDATE exercises SET category = ?` — the pattern already used by legacy migration v3 in db/client.ts:120). Delete calls the reference-count check below.

### D5: Category delete is block-and-guide

`countExercisesInCategory(category)` counts all rows (active + archived) with that exact category text. Delete proceeds only at zero; otherwise the dialog reports the count and points at the Archived filter. Since sections only render for non-empty categories, the zero-count success path mainly covers stale renders (exercises deleted while the sheet is open) — the primary real-world cleanup is merge (non-empty) or exercise-delete → auto-vanish (empty). This asymmetry is accepted: it matches the categories-are-just-text model.

### D6: Chip starvation with an escape hatch

`loadCategories` switches to `includeArchived: false`, plus the edited exercise's own category is always unioned in (an archived exercise being edited keeps its chip visible and selectable). Canonicals are always present (unchanged). Net effect: archiving the last exercise of a category removes the chip on next editor open.

### D7: Fuzzy suggestion via normalized near-match, heuristic similarity

Add to `constants/categories.ts`:

- `normalizeCategory(name)`: lowercase, strip non-alphanumerics.
- `suggestCategory(input, existing)`: returns the existing category whose normalized form best matches — exact normalized equality → return it (existing dedupe behavior generalized); otherwise near-match when normalized Levenshtein distance ≤ 2 and ≤ ~40% of target length (tuning-safe: constants).

Exact normalized match auto-selects (no prompt, same as today's case-insensitive dedupe). Near-match shows a non-blocking hint "Did you mean 'Chest'?" with Use / dismiss; the user can always keep their typed name. No new dependency — Levenshtein at these string lengths is ~10 lines.

*Alternative considered:* blocking modal on any near-match (rejected — friction for legitimately new categories like "Neck").

### D8: No seed or canonical protection special-casing in merge

Renaming a canonical category (e.g. renaming "Chest" to something else) is allowed and behaves like any rename: the canonical chip remains (canonicals are hardcoded), and exercises move. This is consistent and requires no protection logic.

## Risks / Trade-offs

- [FKs stay off; integrity rests on transaction ordering] → `deleteExercise` wraps all three statements in `withTransactionAsync`; a partial failure rolls back leaving the exercise archived-but-present (safe state).
- [Renaming a category changes history display (live join)] → Existing, spec'd behavior (exercises spec: "Edit an exercise"); snapshots only freeze at delete time, so a deleted-then-recreated category does not retroactively claim old sessions' display.
- [Deleted exercise name is later recreated as a new exercise] → New row gets a new id; old session_exercises keep their snapshots and do NOT link to the new exercise. Correct: history stays frozen, new exercise starts fresh. (Progression chart keys by exercise id, so old sets don't leak into the new exercise's charts.)
- [Long-press discoverability on section headers] → Acceptable for a management power-action; Rename/Merge and Delete are also reachable by the cleanup flow (exercise delete) without long-press.
- [Web platform lacks long-press equivalence] → `onLongPress` works on web via click-and-hold in React Native; if unreliable, fall back to a visible affordance when `Platform.OS === 'web'` (small "⋯" button in the header).
- [Levenshtein threshold too eager/lenient] → Threshold constants are tunable; worst case is an ignorable hint, never a blocked creation.

## Migration Plan

Single additive migration v5 in `db/client.ts` following the established pattern:

```
ALTER TABLE session_exercises ADD COLUMN exercise_name TEXT NULL;
ALTER TABLE session_exercises ADD COLUMN exercise_category TEXT NULL;
```

Both statements in one `applyMigration` transaction + `schema_version` insert. `db/schema.ts`'s `TABLE_DDLS` for fresh installs gains the same two columns so v1-create and v5-migrate converge on identical shape. No data backfill. Rollback: not supported (consistent with v2–v4); columns are nullable and inert until a delete occurs, so a rollback of app code alone is safe — snapshots simply stop being written.

## Open Questions

- Exact copy for the delete-confirmation dialogs (native Alert) — decide during implementation.
- Whether the fuzzy hint should also appear when *editing* an existing exercise's category field (currently scoped to new-category creation only) — safe to defer; does not affect schema or task shape.
