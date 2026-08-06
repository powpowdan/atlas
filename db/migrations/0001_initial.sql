CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id            TEXT PRIMARY KEY NOT NULL,
  name          TEXT NOT NULL UNIQUE,
  category      TEXT,
  is_assisted   INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS routines (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_exercises (
  routine_id   TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL REFERENCES exercises(id),
  order_index  INTEGER NOT NULL,
  PRIMARY KEY (routine_id, order_index)
);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY NOT NULL,
  routine_id   TEXT REFERENCES routines(id) ON DELETE SET NULL,
  started_at   INTEGER NOT NULL,
  completed_at INTEGER,
  status       TEXT NOT NULL DEFAULT 'in_progress',
  note         TEXT,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session_exercises (
  id           TEXT PRIMARY KEY NOT NULL,
  session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL REFERENCES exercises(id),
  order_index  INTEGER NOT NULL,
  note         TEXT,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sets (
  id                  TEXT PRIMARY KEY NOT NULL,
  session_exercise_id TEXT NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  weight              REAL NOT NULL,
  reps                INTEGER NOT NULL,
  is_warmup           INTEGER NOT NULL DEFAULT 0,
  note                TEXT,
  created_at          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise_id ON session_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_session_exercise_warmup ON sets(session_exercise_id, is_warmup);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_routines_updated_at ON routines(updated_at DESC);
