## 1. Data layer: uniqueness

- [x] 1.1 Add `DuplicateRoutineError` class to `types/index.ts` (mirror `DuplicateExerciseError`, message: `A routine with the name "X" already exists.`)
- [x] 1.2 Add private `findCaseInsensitiveRoutineDuplicate(db, name, exceptId?)` to `db/queries/routines.ts` (`WHERE LOWER(name) = LOWER(?) AND id <> ?`, mirroring exercises.ts:107-119)
- [x] 1.3 Call the duplicate check as the first statement inside the `createRoutine` transaction, throwing `DuplicateRoutineError`
- [x] 1.4 Call the duplicate check inside the `updateRoutine` transaction with `exceptId` = the routine's own id, throwing `DuplicateRoutineError`

## 2. Data layer: V4 migration

- [x] 2.1 Add `idx_routines_name_unique` (`CREATE UNIQUE INDEX IF NOT EXISTS ... ON routines(name COLLATE NOCASE)`) to `INDEX_DDLS` in `db/schema.ts`
- [x] 2.2 Add `MIGRATION_V4 = 4` and an `applyMigrationV4(db)` function in `db/client.ts`: dedupe case-insensitive duplicate names (keep the most recently updated row per group; suffix older rows " (2)", " (3)", … with case-insensitive collision probing), do NOT touch `updated_at`, then create the unique index, all inside one transaction with the schema_version insert
- [x] 2.3 Wire `applyMigrationV4` into `migrateDb` following the v3 `applied.has` pattern

## 3. UI: delete from routines list

- [x] 3.1 In `app/(tabs)/routines.tsx`, add an `onLongPress` handler on the row Pressable that shows an `Alert.alert` confirmation ("Delete routine?", destructive Delete button) matching the app/history/[id].tsx pattern
- [x] 3.2 On confirm, call `deleteRoutine(db, item.id)` then `refresh()`; Cancel leaves the routine untouched

## 4. UI: delete from edit screen + duplicate-name surfacing

- [x] 4.1 In `components/RoutineEditor.tsx` edit mode, add a "Delete routine" button below the Save button in the footer (oxblood color, matching destructive styling)
- [x] 4.2 Wire it to the same `Alert.alert` confirmation; on confirm call `deleteRoutine(db, routineId)` then `router.back()` with fallback `router.replace('/(tabs)/routines')`
- [x] 4.3 Verify duplicate-name errors surface: `handleSave`'s existing catch already renders `e.message` — confirm the `DuplicateRoutineError` message displays in the editor error Text for both create and rename paths

## 5. Verification

- [x] 5.1 Run `npm run typecheck` (WSL-safe) and fix any errors
- [x] 5.2 Manual test from PowerShell (`npx expo start`): create a routine with an existing exact name and an existing name differing only in case — both rejected with error; edit-save without renaming succeeds; rename to another routine's name rejected
- [x] 5.3 Manual test: delete via long-press from the list (confirm + cancel paths), delete from the edit screen, verify the list refreshes and sessions started from the deleted routine remain in history
- [x] 5.4 Migration test: on a device/DB with pre-existing duplicate routine names, confirm first launch after upgrade renames older duplicates with suffixes, list order (updated_at) unchanged
