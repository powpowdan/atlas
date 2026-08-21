## Context

All 10 destructive confirmations currently call `Alert.alert` (OS-native, unthemeable), with `window.confirm`/`window.alert` fallbacks on web in `app/exercise/manage.tsx`. The app has exactly one zustand store (`store/activeSession.ts`), no providers beyond `SQLiteProvider`, and two styled modal precedents: the category action sheet in `app/exercise/manage.tsx` (centered, radius 10, oxblood destructive row) and `SessionSummaryModal` (fade, overlay scrim, radius 12). Reanimated 4 is installed with one animation precedent (`AnimatedCategorySection`: `withTiming`, 200ms, `Easing.out(Easing.cubic)`).

Data layer: plain SQL in `db/queries/*.ts` against expo-sqlite, app-generated UUID PKs (`utils/uuid.ts`), `created_at` ms timestamps set app-side, `sets` ordered by `created_at ASC`, `session_exercises` by `order_index` (no unique constraint on `(session_id, order_index)`). Schema migrations are versioned in `db/client.ts` (`migrateDb`, currently v5). Critically, SQLite FK enforcement has never been enabled — `PRAGMA foreign_keys` is off, so declared cascades are inert and past deletes have leaked orphaned child rows. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- Every confirmation is app-styled, verb-labeled, fits long copy, and works identically on web
- Set deletion and exercise removal are interrupt-free with reliable, verbatim undo
- FK enforcement on; legacy orphans purged; cascade copy literally true
- Minimal API surface that reads like today's `Alert.alert` call sites (mechanical migration)

**Non-Goals:**

- Multi-undo stack (sequential undos); v1 restores only the most recent deletion
- Undo for session discard/delete, routine delete, exercise archive/delete — these stay confirmation-gated
- Dark mode, theming provider, spacing/radius token system
- New dependencies (reanimated + safe-area-context already installed suffice)

## Decisions

### D1: Module-level `confirm()` / `showUndoToast()` over zustand, not context or per-screen components

`store/confirm.ts` exports `confirm(options): Promise<boolean>` and a `useConfirmStore`; `store/undo.ts` exports `showUndoToast(label, restore)` and a `useUndoStore`. Single `ConfirmSheet` and `UndoToast` components mount once in `app/_layout.tsx` after `<Stack>`, inside `SQLiteProvider`.

*Why:* matches the app's only existing store pattern (import directly, no providers); call sites read almost identically to `Alert.alert` (`if (await confirm({...})) { ... }`), so the 10-site migration is mechanical with zero per-screen `useState`. Promise resolution lives in the store actions (confirm → resolve true; dismiss/cancel → resolve false; new request while pending resolves false).

*Alternatives:* React context + hook (adds a provider to a layout that has none; promise plumbing identical); declared `<ConfirmDialog>` per screen (10 × state + JSX boilerplate).

### D2: Bottom sheet, generalizing the category-action sheet

`ConfirmSheet` is a transparent RN `Modal` (`animationType` for scrim fade) anchored `flex-end`, body `colors.paper` radius 10, scrim `colors.overlay` (tap-to-dismiss), title 15/700 ink, message `inkSoft`, optional muted detail line (`textTertiary`), destructive confirm row in `colors.oxblood`, cancel row `inkSoft`, confirm button always verb-labeled. Message area wraps in a height-capped `ScrollView` so actions stay on screen. Entrance: reanimated `withTiming` slide-up using the house recipe (200ms, `Easing.out(Easing.cubic)`); scrim fades. Bottom padding respects safe-area insets.

*Why:* user-chosen direction; reuses the established destructive-sheet visual language (manage.tsx) at a thumb-friendly anchor; transparent `Modal` renders identically on native and web, which kills the `window.confirm` fallbacks.

*Alternatives:* centered card (SessionSummary-like — rejected in exploration); platform-switched styles (two visual languages forever); UI library (no libs in use, precedent already in-house).

### D3: Undo = snapshot rows pre-delete, re-INSERT verbatim

Call sites snapshot before deleting: a set delete captures the full 7-column `sets` row; exercise removal captures the `session_exercises` row plus all its `sets` rows. New query helpers `restoreSet(db, row)` and `restoreSessionExercise(db, sessionExerciseRow, setRows)` re-INSERT every column verbatim (same id, same `created_at`/`order_index`) — `restoreSessionExercise` wraps both tables in one transaction (with FKs on, parent must exist before children). Restores bypass `addSet`/`addExerciseToSession` deliberately: those generate fresh ids/timestamps which would break position and reference stability.

*Why:* with original `created_at` preserved, a restored set lands back in its exact list position; with original `order_index` and no `(session_id, order_index)` unique constraint, the exercise cannot conflict even if another exercise was added during the toast window.

*Alternatives:* soft-delete + restore flag (schema churn, every read query needs filtering); tombstone table (same, plus migration); rebuilding rows via existing insert helpers (breaks ordering/id stability).

### D4: FK enforcement in `onInit`, v6 orphan purge, then dependent deletes

`db/client.ts` `migrateDb` (the `SQLiteProvider onInit`) runs `PRAGMA foreign_keys = ON` after migrations — pragma is per-connection and `onInit` runs per connection open, which is the only reliable hook. New `MIGRATION_V6` (before the pragma is needed, order within `migrateDb` is fine either way) deletes legacy orphans children-first: orphaned `sets` → orphaned `session_exercises` → orphaned `routine_exercises`. With enforcement on, `deleteSession`/`removeExerciseFromSession`/`deleteRoutine` become honest cascades with no query changes (their declared FKs already specify the right actions).

*Implementation addition:* enabling enforcement revealed that `session_exercises.exercise_id REFERENCES exercises(id)` (no ON DELETE action) contradicts `deleteExercise`'s v5 design, which deliberately keeps those rows with frozen name snapshots after the exercise is hard-deleted — the DELETE would throw an FK violation. v6 therefore also rebuilds `session_exercises` without that one FK (keeping the `session_id` cascade), and `db/schema.ts`'s initial DDL matches. The dropped index `idx_session_exercises_exercise_id` is re-created after the rebuild.

*Why:* the pragma alone leaves historical orphans in place and would make the v6 purge impossible to express reliably afterward (cascade would prevent future orphans but not clean old ones); running purge-then-enforce in `onInit` is one-time, idempotent via the existing `schema_version` guard, and starts every connection clean.

*Risk noted:* enabling FKs means every insert path must satisfy constraints. Existing inserts are well-formed (parents created before children in every flow), but this is the main regression surface — covered in tasks (manual smoke of every create/delete flow) and risks below.

### D5: Toast = 5s, replace-and-reset, restore failure surfaces as new toast

`UndoToast` is a bottom-anchored themed bar (paper, ink text, verdigris "Undo" action) above safe areas, animated with the house timing. `showUndoToast(label, restoreFn)` stores label + restore closure in `useUndoStore`; the store action starts a 5s `setTimeout` that clears state; a new call clears the prior timer, replaces the entry, restarts the window. Tapping Undo invokes `restore()`, clears the toast, and the call-site-provided closure also triggers the screen refresh (`refresh`/`reload`) — the toast itself never touches screen state directly. If a restore throws (see risks), the toast dismisses; no error surface beyond that for v1.

*Why:* newest-replaces-pending keeps state trivially one-deep (no stack); closures capture the snapshot rows so the store stays serializable-ish and dumb.

### D6: Copy per the exploration table

Sheet copy: routine delete splits into message (*"${name}" and its exercise list will be permanently removed.*) + muted detail (*Logged sessions are kept. This cannot be undone.*); archive/delete exercise get real titles (Archive "X"? / Delete "X"?) with messages split from title and verb buttons; session/discard keeps current copy (now literally true thanks to D4). Toast labels: "Set deleted", "Exercise removed", each with Undo.

## Risks / Trade-offs

- [FK enforcement exposes latent constraint violations in untested insert paths] → manual smoke pass of every create/edit/delete flow on device after D4; typecheck catches none of this.
- [Same-millisecond `created_at` ties among sets] → restored row's relative order among ties is unstable (SQLite `ORDER BY` on equal keys); cosmetic, accepted for v1. A tiebreak column would need a migration; defer.
- [Unique-name re-creation during toast window] → does not apply to sets/session-exercises (no unique constraints); no risk here in v1 scope since undoable actions are only set/exercise-from-session removal.
- [Restore throws (e.g. parent session deleted during window via another path)] → toast dismisses on error; deletion stays final. Accepted.
- [Timer-based dismissal could fire during navigation transitions] → toast is globally mounted, unaffected by route changes; requirement "toast survives navigation" holds by construction.
- [Archive-order dependency] → this change's sessions delta MODIFIES requirements currently introduced by the un-archived `add-history-editing` change; archive `add-history-editing` before this change.

## Migration Plan

1. v6 migration + pragma ship inside `migrateDb` — runs automatically on first app open after upgrade; idempotent via `schema_version`.
2. Rollback: revert the release; v6 is pure DELETEs of rows that were already invisible to every query, so no data loss surfaces; the pragma line reverts with the code.
3. No backfill needed beyond the purge.
