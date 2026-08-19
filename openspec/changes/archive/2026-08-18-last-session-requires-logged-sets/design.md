## Context

The "last session" reference for an exercise is computed by `getLastSessionSets` in `db/queries/tracking.ts`. It performs a two-step lookup: (1) find the most recent completed session (excluding the in-progress one) that has a `session_exercises` row for the exercise, then (2) fetch that session's sets for display. Step 1 keys on the existence of a `session_exercises` **row**, and `startSessionFromRoutine` (`db/queries/sessions.ts`) creates such a row for every routine exercise up front — including ones the user never logs. The result: a skipped exercise resolves to a session with zero sets, the set list comes back empty, and the UI shows nothing (or, with no history at all, a misleading "first time" prompt).

## Goals / Non-Goals

**Goals:**
- Step 1 selects the most recent prior session where the exercise has at least one logged **working** set, so skipped and warmup-only sessions are walked past automatically.
- Keep the displayed set list (and its warmup de-emphasis) and the all-time "Heaviest"/"Most reps" computations unchanged.

**Non-Goals:**
- No changes to how sessions are created or how skipped exercises are represented.
- No new UI surfaces, types, or schema/index changes.
- No changes to the "first time logging" empty state.

## Decisions

**Decision 1 — Qualify the session with a working-set `EXISTS` subquery.**
Add to the session-selection query a correlated `EXISTS (SELECT 1 FROM sets s WHERE s.session_exercise_id = se.id AND s.is_warmup = 0)`. This pins the qualification to the specific `session_exercises` row already joined, requiring at least one working set under it.
- *Alternative A — inner-join `sets` and dedupe:* rejected. It inflates the candidate rows and needs `DISTINCT`/`GROUP BY`, adding complexity for no benefit over `EXISTS`.
- *Alternative B — require any set (including warmups):* rejected. The user confirmed a warmup-only session should not count as "doing" the exercise; a working set is the qualifier. This also stays consistent with `getBestSet`/`getMostRepsSet`, which already exclude warmups.

**Decision 2 — Qualifier affects session *selection* only.**
Step 2 (fetching the sets to display) is unchanged: once a session is selected, all of that session's sets for the exercise are returned — warmups included — so the UI can keep de-emphasizing them. The `is_warmup = 0` filter lives only in the selection predicate.

**Decision 3 — No index work.**
`idx_session_exercises_exercise_id` supports the outer join/filter, and `idx_sets_session_exercise_warmup` (on `session_exercise_id, is_warmup`) covers the `EXISTS` probe efficiently.

## Risks / Trade-offs

- [A skipped exercise whose *only* history is warmups now resolves to "no prior session"] → Acceptable and intended; matches the warmup-only decision. The "first time logging" state is still accurate.
- [Stale in-memory context after the fix] → `useExerciseBestLast` re-runs on `refreshKey`; no caching change needed.
- [Perceived inconsistency: "Heaviest"/"Most reps" pills can predate the selected last session] → Pre-existing behavior (those are all-time aggregates). Out of scope; the pills already differ in meaning from the per-session list.
