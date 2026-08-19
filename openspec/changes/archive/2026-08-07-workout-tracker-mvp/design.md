## Context

Greenfield mobile app. No existing code or services to integrate with. The user is comfortable with React Native; Expo was chosen (see proposal.md) so a single RN codebase can target Android now and web later via Expo's web target. All data is local to the device; there is no backend in this change. Reference: `exampleworkout.txt` for the source data shape (sessions → exercises → sets, with warmup/working distinction and inline notes).

## Goals / Non-Goals

**Goals:**
- Provide a project scaffold that any future contributor (human or agent) can run with one command and load onto a phone via Expo Go.
- Define a SQLite schema that supports the routines / sessions / tracking capabilities and is amendable to future sync (every record has `created_at`; relations use UUID-style text primary keys so future merge is straightforward).
- Establish a folder layout that keeps data, UI, and state concerns separated from day one.
- Make the "start session from routine" copy semantics explicit so the spec rule (editing a routine must not mutate past sessions) is enforced at the data layer.

**Non-Goals:**
- Sync, auth, backend, or any networked feature.
- Charts, analytics, bodyweight tracking, rest timers, CSV export — deferred to v1+.
- Play Store packaging.
- A polished visual design system; the MVP uses sensible defaults (React Native paper-thin styling) so the data flow can be exercised end to end.

## Decisions

### Decision 1: Expo + Expo Router over bare React Native

**Why:** Expo removes native build toolchain friction; Expo Go enables hot-reload on the user's phone without Xcode/Android Studio ceremony. Expo Router gives file-based routing matching the app's three top-level destinations (Routines, Active Session, History). The user is already familiar with RN, so no learning tax.

**Alternatives considered:**
- Bare RN (`react-native init`): more control, more pain, no benefit at this scale.
- PWA / Capacitor: would require rewriting UI in HTML/CSS when the user's existing skill is RN.

**Web target:** The web target is intentionally enabled (via `react-dom`, `react-native-web`, `@expo/metro-runtime`) even though Android is the only shipping target. Web is for desktop testing convenience only — opening the app in a browser to exercise the data flow without reaching for a phone. `metro.config.js` adds `wasm` to `assetExts` so `expo-sqlite`'s WASM backend loads on web. The app code is web-compatible by default; no separate styling effort is spent on the web UX.

### Decision 2: expo-sqlite over AsyncStorage / WatermelonDB

**Why:** The data model is relational (routines ↔ exercises ↔ sessions ↔ sets) and the tracking queries ("best set per exercise", "top set of most recent session") are natural SQL. AsyncStorage would force re-implementing joins in JS. WatermelonDB adds sync primitives we explicitly do not need yet and brings cognitive overhead.

**Schema** (text UUIDs as PKs for future merge-friendliness; `created_at` for future sync):

```
exercises
  id            TEXT PRIMARY KEY
  name          TEXT NOT NULL UNIQUE
  category      TEXT           -- nullable, free-form (e.g. "Chest", "Back")
  is_assisted   INTEGER NOT NULL DEFAULT 0  -- hint for UI; does not change math
  created_at    INTEGER NOT NULL  -- epoch ms

routines
  id            TEXT PRIMARY KEY
  name          TEXT NOT NULL
  created_at    INTEGER NOT NULL
  updated_at    INTEGER NOT NULL

routine_exercises
  routine_id    TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE
  exercise_id   TEXT NOT NULL REFERENCES exercises(id)
  order_index   INTEGER NOT NULL
  PRIMARY KEY (routine_id, order_index)

sessions
  id            TEXT PRIMARY KEY
  routine_id    TEXT REFERENCES routines(id) ON DELETE SET NULL  -- nullable; routine may be deleted
  started_at    INTEGER NOT NULL
  completed_at  INTEGER             -- NULL = in progress, non-NULL = complete
  status        TEXT NOT NULL DEFAULT 'in_progress'  -- 'in_progress' | 'complete'
  note          TEXT
  created_at    INTEGER NOT NULL

session_exercises
  id            TEXT PRIMARY KEY
  session_id    TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
  exercise_id   TEXT NOT NULL REFERENCES exercises(id)
  order_index   INTEGER NOT NULL
  note          TEXT
  created_at    INTEGER NOT NULL

sets
  id            TEXT PRIMARY KEY
  session_exercise_id TEXT NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE
  weight        REAL NOT NULL        -- kg or lb, unitless in MVP
  reps          INTEGER NOT NULL
  is_warmup     INTEGER NOT NULL DEFAULT 0
  note          TEXT
  created_at    INTEGER NOT NULL
```

**Why this shape:**
- `routine_exercises` is keyed on `(routine_id, order_index)` so reordering is a write of new `order_index` values, not row movement.
- `session_exercises` is **separate from `routine_exercises`** — when a session starts from a routine, the exercise list is **copied** into `session_exercises`. This enforces the spec rule that editing or deleting a routine must not mutate past sessions at the data layer, not just in UI logic.
- `sessions.routine_id` uses `ON DELETE SET NULL` so deleting a routine keeps the session and its copied exercise list intact (spec rule: deleting a routine preserves past sessions).
- `sets.weight` is `REAL` to satisfy the spec scenario "Log a set with a decimal weight" (91.5). Unit (kg vs lb) is not stored in MVP — user decides implicitly.
- `is_assisted` on `exercises` is a UI hint only; the tracking math ignores it. This keeps the schema extensible without complicating the PR rule.

**Alternatives considered:**
- Single `entries` table with parent pointers: less readable, harder to query per-exercise aggregates.
- Normalised `sets` without the `session_exercises` indirection: would conflate the "copy on start" semantics with set storage.

### Decision 3: Tracking queries

```sql
-- Best set per exercise (heaviest weight, tie-break most reps), excluding warmups
SELECT s.id, s.weight, s.reps, s.created_at
FROM sets s
JOIN session_exercises se ON s.session_exercise_id = se.id
WHERE se.exercise_id = ?
  AND s.is_warmup = 0
ORDER BY s.weight DESC, s.reps DESC, s.created_at ASC
LIMIT 1;

-- Last set per exercise: top set (same rule) within the most recent prior session
SELECT s.id, s.weight, s.reps, sess.started_at
FROM sets s
JOIN session_exercises se ON s.session_exercise_id = se.id
JOIN sessions sess ON se.session_id = sess.id
WHERE se.exercise_id = ?
  AND s.is_warmup = 0
  AND sess.id <> ?            -- exclude the in-progress session
ORDER BY sess.started_at DESC, s.weight DESC, s.reps DESC, s.created_at ASC
LIMIT 1;
```

Both queries are O(log n) with indexes on `session_exercises(exercise_id)` and `sets(session_exercise_id, is_warmup)`. Adequate for a single-user dataset measured in thousands of rows.

### Decision 4: Zustand for client state

**Why:** The "active session" lives in two places conceptually: persisted to SQLite (so the user can close the app mid-workout) and in component state (for fast set-entry). Zustand stores the active session ID plus a thin "what's on screen" cache; SQLite remains the source of truth. No Redux ceremony, no Context-propagation pain.

**Alternatives considered:**
- Pure SQLite reads on every screen: doable, more disk I/O, slower perceived perf during active entry.
- React Context only: fine for the active session, but Zustand gives us middleware (persist, devtools) for free.

### Decision 5: Folder layout

```
/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # root layout, tabs
│   ├── (tabs)/
│   │   ├── routines.tsx          # list + create entry
│   │   ├── sessions.tsx          # active session or "start" prompt
│   │   └── history.tsx           # past sessions list
│   ├── routine/
│   │   ├── [id].tsx              # view / edit a routine
│   │   └── new.tsx
│   ├── session/
│   │   ├── [id].tsx              # active session logging UI
│   │   └── new.tsx               # choose routine or ad-hoc
│   └── history/
│       └── [id].tsx              # read-only past session view
├── components/                   # presentational components (SetRow, ExerciseBlock, etc.)
├── db/
│   ├── client.ts                 # expo-sqlite open + migrate
│   ├── schema.ts                 # DDL strings
│   ├── migrations/               # forward-only SQL migration files
│   └── queries/                  # typed query functions (routines.ts, sessions.ts, tracking.ts)
├── hooks/                        # useActiveSession, useExerciseBestLast, etc.
├── store/                        # zustand stores
├── types/                        # shared TS types matching the schema
├── seed/
│   └── exercises.json            # exercise names from exampleworkout.txt
└── constants/
```

### Decision 6: Migration strategy

Forward-only SQL migrations applied at app open, tracked in a `schema_version` table. No down-migrations — single-user local data has no rollback scenario worth the complexity. On schema change between MVP and v1, a fresh install is acceptable; we will add real migration logic only when real users have real data.

## Risks / Trade-offs

- **[expo-sqlite API churn]** expo-sqlite has had API revisions between SDK versions → pin the Expo SDK in `package.json` and document the pinned version in README.
- **[Future sync rework]** Text UUIDs and `created_at` help but do not guarantee conflict-free sync → flagged as a known trade-off; sync design is deferred and will require its own change proposal.
- **[Single-user migration]** No down-migration means a broken migration on the dev device could orphan local data → mitigate by keeping `exampleworkout.txt` import re-runnable so dev data can always be reconstructed.
- **[Unit ambiguity]** `sets.weight` is unitless in MVP; the user may switch between kg and lb between exercises → document that unit tracking is a v1 concern, and the MVP assumes the user is consistent.
- **[No edit on completed sessions]** Spec says completed sessions are not editable from the active-session view → there is no other edit path in MVP; if the user finds a typo in history they must recreate the session. Acceptable for MVP, likely first v1 feedback.

## Migration Plan

This is a greenfield change; no migration of existing data is required.

- Rollout: scaffold → run dev server → load via Expo Go on the user's phone.
- Rollback: delete the project directory; no production environment to roll back.
- Seeded exercise library can be reset by clearing the local SQLite DB and re-running the seed step.

## Open Questions

- Should warmup sets be visually distinguished in history views (e.g. dimmed)? Defer to implementation; the spec requires they are excluded from tracking math, not that they are styled a particular way.
- Should ad-hoc sessions be allowed to convert to a routine after the fact? Not in MVP; would be a natural v1 feature once routine editing exists.
