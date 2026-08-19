## 1. Schema migration

- [x] 1.1 Add v2 migration to `db/client.ts`: introduce `MIGRATION_V2 = 2` constant; on `migrateDb`, if `!applied.has(MIGRATION_V2)`, run `ALTER TABLE exercises ADD COLUMN archived_at INTEGER NULL;` inside `withTransactionAsync`, then record the version
- [x] 1.2 ~~Update `db/schema.ts` `TABLE_DDLS.exercises` DDL to include `archived_at INTEGER NULL`~~ — **Reverted**: v1 baseline DDL must match v1 schema as originally shipped so fresh installs and existing installs both receive `archived_at` exclusively via the v2 migration. Including the column in v1 AND adding it via v2 ALTER would error with "duplicate column name" on fresh install. The column is added to the schema only by migration v2; the TypeScript `Exercise` type and query layer treat it as nullable.
- [ ] 1.3 Verify migration applies cleanly on a device with existing v1 data (manual smoke test during verification phase)

## 2. Types

- [x] 2.1 Extend the `Exercise` interface in `types/index.ts` with `archived_at: number | null`
- [x] 2.2 Add `ExerciseInput` and `ExerciseUpdate` types to `types/index.ts` (fields: `name`, `category: string | null`, `is_assisted: boolean`)
- [x] 2.3 Add a `DuplicateExerciseError` class to `types/index.ts` (extends `Error`) for typed duplicate-name failures

## 3. Queries

- [x] 3.1 Fix `createExercise` in `db/queries/exercises.ts`: replace `INSERT OR IGNORE` with a case-insensitive duplicate pre-check (`WHERE LOWER(name) = LOWER(?)`) inside the same transaction; throw `DuplicateExerciseError` on collision
- [x] 3.2 Add `updateExercise(db, id, input: ExerciseUpdate)` to `db/queries/exercises.ts`: case-insensitive duplicate pre-check excluding the current id (`AND id <> ?`), then `UPDATE exercises SET name = ?, category = ?, is_assisted = ? WHERE id = ?`; throw `DuplicateExerciseError` on collision
- [x] 3.3 Add `archiveExercise(db, id)` to `db/queries/exercises.ts`: `UPDATE exercises SET archived_at = ? WHERE id = ?`
- [x] 3.4 Add `restoreExercise(db, id)` to `db/queries/exercises.ts`: `UPDATE exercises SET archived_at = NULL WHERE id = ?`
- [x] 3.5 Extend `listExercises(db, opts?: { includeArchived?: boolean })` in `db/queries/exercises.ts`: default to `WHERE archived_at IS NULL`; when `includeArchived: true`, omit the filter and order archived-last within the result
- [x] 3.6 Run `npm run typecheck` and confirm the query module compiles cleanly

## 4. Shared components

- [x] 4.1 Create `components/ExerciseEditorModal.tsx`: props `visible`, optional `exercise` (omit = create mode), `onSave: (input) => Promise<void>`, `onClose`. Three inputs (name, category, is_assisted switch). Surfaces `DuplicateExerciseError` as a clear inline message
- [x] 4.2 Create `components/ExercisePickerModal.tsx`: props `visible`, `excludeIds?: string[]`, `onSelect: (exercise) => void`, `onClose`. Loads `listExercises({ includeArchived: false })` on open, renders search input that filters in-memory by case-insensitive substring, renders a "+ New exercise" affordance that opens `ExerciseEditorModal` in create mode, refreshes its own list on successful create and calls `onSelect` with the new row
- [x] 4.3 Run `npm run typecheck` and confirm both components compile cleanly

## 5. Manage screen rewrite

- [x] 5.1 Rewrite `app/exercise/manage.tsx`: sectioned list with "Active" and "Archived" sections; active rows show edit + archive buttons; archived rows show restore button; "Add exercise" header button opens `ExerciseEditorModal` in create mode
- [x] 5.2 Edit flow opens `ExerciseEditorModal` in edit mode with the selected exercise; on save, refreshes the list
- [x] 5.3 Archive and restore flows call `archiveExercise`/`restoreExercise` then refresh the list

## 6. Tab header entry points

- [x] 6.1 Add a "Manage" header button to `app/(tabs)/index.tsx` (Sessions tab) that navigates to `/exercise/manage`
- [x] 6.2 Add a "Manage" header button to `app/(tabs)/routines.tsx` (Routines tab) that navigates to `/exercise/manage`; remove the now-redundant empty-state "Manage exercises" link

## 7. Migrate picker consumers

- [x] 7.1 Refactor `app/session/[id].tsx`: replace the inline add-exercise `Modal` with `<ExercisePickerModal>`; delete the in-screen `library` state and `listExercises` call (now owned by the picker); keep `handleAddExercise` as the `onSelect` handler
- [x] 7.2 Refactor `components/RoutineEditor.tsx`: replace its inline picker with `<ExercisePickerModal>` passing `excludeIds={selected}`; remove the duplicate `library`/`refreshLibrary` plumbing
- [x] 7.3 Verify both consumers correctly call `onSelect` and refresh their parent state

## 8. Session-history QoL

- [x] 8.1 In `app/history/[id].tsx`, add duration display when `session.completed_at` is set: compute `completed_at - started_at`, format as `Xh Ym` (≥1h) or `Xm` (sub-hour), render in the header next to the existing date
- [x] 8.2 In `app/history/[id].tsx`, add an "Edit note" affordance (button or tap-on-note) that opens a modal with a `TextInput` pre-filled with the existing note; on save, call `setSessionNote(db, id, draft || null)` and reload the session
- [x] 8.3 Verify note display hides when the note is null after a save

## 9. Verification

- [x] 9.1 Run `npm run typecheck` and resolve any errors
- [ ] 9.2 Manually verify against the `exercises` spec scenarios: create (new name), create (duplicate name → clear error), create (case-insensitive duplicate), edit (rename propagates to history/chart/routine), archive (hidden from picker, visible in history/chart/routine), restore (returns to picker), management reachable from both Sessions and Routines tabs, picker search filters by substring, inline create from picker refreshes list
- [ ] 9.3 Manually verify against the modified `sessions` spec scenarios: completed-session note can be edited and cleared; completed-session duration displays correctly; in-progress session shows no duration
