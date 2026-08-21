## Why

Routines can be created and edited but never deleted — users accumulate stale routines with no way to remove them (the `deleteRoutine` query exists at db/queries/routines.ts:170 but is wired to no UI). Additionally, routine names are not unique despite the spec calling for unique names: two routines named "Day 1" (or "day 1" vs "Day 1") can coexist, making them indistinguishable when picking a routine to start a session.

## What Changes

- Add routine deletion to the routines list screen via long-press on a row, with a destructive confirmation alert (matches the existing session-delete pattern in `app/history/[id].tsx`).
- Add a "Delete routine" action to the routine edit screen (edit mode only), with the same confirmation.
- Enforce case-insensitive unique routine names at the application layer in `createRoutine`/`updateRoutine`, throwing a dedicated `DuplicateRoutineError` (mirrors the existing exercise duplicate-name pattern), with the editor surfacing the error message.
- Add a V4 database migration that renames existing case-insensitive duplicate routine names (keeping the most recently updated one; older duplicates get " (2)", " (3)"… suffixes) and creates a unique index `idx_routines_name_unique ON routines(name COLLATE NOCASE)` so uniqueness is also guaranteed at the storage layer.
- Deleting a routine preserves past sessions (schema already cascades: `routine_exercises` deleted, `sessions.routine_id` set to NULL).

No breaking changes.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `routines`: Strengthen "Create a routine" and "Edit a routine" with explicit duplicate-name rejection (case-insensitive), and strengthen "Delete a routine" with confirmation UX and entry points (list long-press + edit screen) plus preservation of past sessions.

## Impact

- `app/(tabs)/routines.tsx` — long-press handler + delete confirmation on list rows
- `components/RoutineEditor.tsx` — delete button in edit mode; duplicate-name error display (already works via existing catch)
- `db/queries/routines.ts` — case-insensitive duplicate check inside create/update transactions
- `types/index.ts` — new `DuplicateRoutineError`
- `db/schema.ts` — add `idx_routines_name_unique` to `INDEX_DDLS` (fresh installs)
- `db/client.ts` — V4 migration (dedupe + unique index)
- Existing installs with duplicate routine names get automatic suffix-renaming on first launch after upgrade; `updated_at` values are untouched so list ordering is unchanged
