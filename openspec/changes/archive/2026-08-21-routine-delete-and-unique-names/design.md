## Context

Routines are persisted via expo-sqlite with no zustand store — screens call `db/queries/routines.ts` directly and refresh with `useFocusEffect`. The schema already handles deletion side effects: `routine_exercises` has `ON DELETE CASCADE` and `sessions.routine_id` has `ON DELETE SET NULL`, so past sessions survive routine deletion as ad-hoc sessions. `deleteRoutine` exists but is unreachable from the UI. Exercises already have the exact uniqueness pattern to mirror: `findCaseInsensitiveDuplicate` inside create/update transactions (db/queries/exercises.ts:107-119), `DuplicateExerciseError` (types/index.ts:16-21), and the editor catches and surfaces the message. Migrations are versioned via the `schema_version` table in `db/client.ts` (currently at v3); `INDEX_DDLS` in `db/schema.ts` feeds fresh installs. Deletes elsewhere in the app all use `Alert.alert` with Cancel/destructive buttons (e.g., app/history/[id].tsx:93).

## Goals / Non-Goals

**Goals:**

- Two confirmed entry points for routine deletion (list long-press, edit-screen button)
- Case-insensitive name uniqueness enforced both in app-level transactions and by a storage-level unique index
- One-time migration of existing installs: dedupe names without disturbing list order or timestamps

**Non-Goals:**

- Undo/soft-delete (archive) for routines — hard delete matches the archived MVP spec
- Restoring or merging routines renamed by the migration
- Any zustand store for routines (screens keep direct query + focus-refresh)
- Affects on `session/new.tsx` list refresh behavior (it re-reads on mount; stale-on-back edge case accepted)

## Decisions

### D1: Delete UX = long-press on list + button on edit screen

Long-press keeps the list rows clean (no per-row buttons, unlike exercise/manage.tsx which needs archive/restore pairs), while an explicit "Delete routine" button on the edit screen covers discoverability. Both funnel through the same `Alert.alert` destructive confirmation pattern already used for session deletion. Alternative rejected: swipe-to-delete (no swipe library in the project; would add a dependency and platform quirks).

### D2: Uniqueness = app-level check inside transactions + `COLLATE NOCASE` unique index

App-level: a private `findCaseInsensitiveRoutineDuplicate(db, name, exceptId?)` (copy of the exercise helper) runs as the first statement inside the existing `createRoutine`/`updateRoutine` transactions and throws a new `DuplicateRoutineError`. `updateRoutine` passes `exceptId` so saving without a rename never self-collides. The editor's existing catch already renders `e.message`, so no UI change is needed for the error. DB-level: `CREATE UNIQUE INDEX idx_routines_name_unique ON routines(name COLLATE NOCASE)` guards against races and any non-app write path. Rationale for both layers: the index alone would surface as a raw SQLite constraint error; the app check alone leaves a window and no migration forcing function. A `COLLATE NOCASE` index (rather than a check against `LOWER(name)`) matches how the app queries and keeps the invariant readable in schema.

### D3: V4 migration dedupes before creating the index

`applyMigrationV4` (following the `applyMigrationV3` pattern in db/client.ts, run inside one transaction):

1. Select duplicate groups: `SELECT LOWER(name) AS key, COUNT(*) ... GROUP BY LOWER(name) HAVING COUNT(*) > 1` — actually fetch all rows ordered by `updated_at DESC` within each key.
2. For each group, keep the first (most recently updated) row's name as-is; for each subsequent row, probe suffixes " (2)", " (3)", … until one is free case-insensitively across the whole table (probing against names already finalized in this pass and not-yet-renamed rows alike), then `UPDATE routines SET name = ? WHERE id = ?`. Crucially, `updated_at` is NOT touched, so `idx_routines_updated_at` ordering is unchanged.
3. `CREATE UNIQUE INDEX IF NOT EXISTS idx_routines_name_unique ON routines(name COLLATE NOCASE);`
4. Insert schema_version row (4).

The index DDL is also appended to `INDEX_DDLS` in db/schema.ts so fresh v1 installs create it in the initial migration; `IF NOT EXISTS` keeps the two paths idempotent. Alternative rejected: SQLite `COLLATE NOCASE` column constraint via table rebuild — a table rebuild is riskier (FK references from `routine_exercises` and `sessions`) for no benefit over an index.

### D4: Rename collision on rename-to-self with case change

Renaming "Day 1" → "DAY 1" (same routine, different case) must succeed: the app-level check excludes `exceptId`, but the unique index does not exclude the row itself and SQLite treats the update as a transient duplicate. Mitigation: `updateRoutine` issues the UPDATE regardless; SQLite's unique index is checked per-statement and a single-row UPDATE that leaves the row itself unique (old value replaced) is allowed — a row updating its own indexed value from A to A′ where A′ ≠ A (case-insensitively A′ == A only for other rows) succeeds because the modifying row's old entry is replaced atomically. Verified behavior in SQLite: a single UPDATE never collides with its own prior value. No extra handling needed.

## Risks / Trade-offs

- [Migration renames a routine the user actively uses] → Suffix scheme is deterministic and documented; names like "Day 1 (2)" remain recognizable. No data loss — only the name changes.
- [Long-press delete is undiscoverable] → Mitigated by the edit-screen delete button as a visible path; both confirm before acting.
- [Case-insensitive uniqueness blocks intentional near-duplicate names like "Day 1" vs "day 1 " (trailing space)] → Trimming already happens before the check, matching exercise behavior; consistent UX.
- [Foreign-key enforcement assumption] → expo-sqlite enables `PRAGMA foreign_keys` by default (SDK 49+) and `deleteSession`'s cascade already relies on it in production; same assumption reused.

## Migration Plan

- V4 runs automatically inside `migrateDb` on first app launch after upgrade, before seeding (seeds are name-stable "Day 1"/"Day 2" and only run on an empty table, so no interaction).
- Rollback: not applicable (local SQLite per-device); the migration is forward-only like v2/v3.
