import { SQLiteDatabase } from 'expo-sqlite';

import { INDEX_DDLS, TABLE_DDLS } from './schema';
import { seedExercises } from './queries/exercises';
import { seedRoutinesIfEmpty } from './queries/routines';

const INITIAL_VERSION = 1;
const MIGRATION_V2 = 2;
const MIGRATION_V3 = 3;
const MIGRATION_V4 = 4;
const MIGRATION_V5 = 5;
const MIGRATION_V6 = 6;

// [oldName, newName, newCategory] — applied before re-seed so INSERT OR IGNORE
// sees catalog names and never duplicates. Idempotent: guarded by name match.
const LEGACY_EXERCISE_RENAMES: ReadonlyArray<
  readonly [oldName: string, newName: string, category: string]
> = [
  ['Bench', 'Barbell bench press', 'Chest'],
  ['Fly', 'Dumbbell fly', 'Chest'],
  ['Ab crunch', 'Crunch', 'Abs'],
  ['Paloff press', 'Pallof press', 'Abs'],
  ['Face pull', 'Face pull', 'Back'],
  ['Tri pulldown', 'Triceps pushdown', 'Triceps'],
  ['Bi', 'Barbell curl', 'Biceps'],
  ['Pulldown', 'Lat pulldown', 'Back'],
  ['Seated row', 'Seated cable row', 'Back'],
  ['Assisted', 'Assisted pullups', 'Back'],
  ['Shoulder press', 'Overhead press', 'Shoulders'],
];

async function ensureSchemaVersionTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);
}

async function getAppliedVersions(db: SQLiteDatabase): Promise<Set<number>> {
  const rows = await db.getAllAsync<{ version: number }>(
    `SELECT version FROM schema_version;`,
  );
  return new Set(rows.map((r) => r.version));
}

async function applyMigration(
  db: SQLiteDatabase,
  version: number,
  statements: string[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const sql of statements) {
      await db.execAsync(sql);
    }
    await db.runAsync(
      `INSERT INTO schema_version (version, applied_at) VALUES (?, ?);`,
      version,
      Date.now(),
    );
  });
}

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await ensureSchemaVersionTable(db);
  const applied = await getAppliedVersions(db);

  if (!applied.has(INITIAL_VERSION)) {
    const initialStatements = [
      ...TABLE_DDLS.map((t) => t.sql),
      ...INDEX_DDLS.map((i) => i.sql),
    ];
    await applyMigration(db, INITIAL_VERSION, initialStatements);
  }

  // v2: soft-delete support for exercises. Pure-additive — existing rows get
  // NULL (treated as "active"). Safe on any prior v1 install.
  if (!applied.has(MIGRATION_V2)) {
    await applyMigration(db, MIGRATION_V2, [
      `ALTER TABLE exercises ADD COLUMN archived_at INTEGER NULL;`,
    ]);
  }

  if (!applied.has(MIGRATION_V3)) {
    await applyMigrationV3(db);
  }

  if (!applied.has(MIGRATION_V4)) {
    await applyMigrationV4(db);
  }

  // v5: snapshot columns for exercise hard delete. Pure-additive — written
  // lazily by deleteExercise only; existing rows keep NULL (live join wins).
  if (!applied.has(MIGRATION_V5)) {
    await applyMigration(db, MIGRATION_V5, [
      `ALTER TABLE session_exercises ADD COLUMN exercise_name TEXT NULL;`,
      `ALTER TABLE session_exercises ADD COLUMN exercise_category TEXT NULL;`,
    ]);
  }

  // v6: purge orphaned child rows left behind by pre-FK-enforcement deletes,
  // then rebuild session_exercises without its exercise_id foreign key.
  // deleteExercise intentionally keeps session_exercises rows (frozen name
  // snapshots) after the exercise is gone, so that FK must not exist once
  // PRAGMA foreign_keys is enforced below.
  if (!applied.has(MIGRATION_V6)) {
    await applyMigration(db, MIGRATION_V6, [
      `DELETE FROM sets
       WHERE session_exercise_id NOT IN (SELECT id FROM session_exercises);`,
      `DELETE FROM session_exercises
       WHERE session_id NOT IN (SELECT id FROM sessions);`,
      `DELETE FROM routine_exercises
       WHERE routine_id NOT IN (SELECT id FROM routines);`,
      `CREATE TABLE session_exercises_v6 (
         id                TEXT PRIMARY KEY NOT NULL,
         session_id        TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
         exercise_id       TEXT NOT NULL,
         order_index       INTEGER NOT NULL,
         note              TEXT,
         created_at        INTEGER NOT NULL,
         exercise_name     TEXT,
         exercise_category TEXT
       );`,
      `INSERT INTO session_exercises_v6
         (id, session_id, exercise_id, order_index, note, created_at, exercise_name, exercise_category)
       SELECT id, session_id, exercise_id, order_index, note, created_at, exercise_name, exercise_category
       FROM session_exercises;`,
      `DROP TABLE session_exercises;`,
      `ALTER TABLE session_exercises_v6 RENAME TO session_exercises;`,
      `CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise_id
         ON session_exercises(exercise_id);`,
    ]);
  }

  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await seedExercises(db);
  await seedRoutinesIfEmpty(db);
}

async function applyMigrationV3(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS seed_version (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `);

    const columns = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(exercises);`,
    );
    if (columns.some((c) => c.name === 'is_assisted')) {
      await db.execAsync(`ALTER TABLE exercises DROP COLUMN is_assisted;`);
    }

    for (const [oldName, newName, category] of LEGACY_EXERCISE_RENAMES) {
      if (oldName !== newName) {
        const target = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM exercises WHERE name = ?;`,
          newName,
        );
        if (target) continue;
      }
      await db.runAsync(
        `UPDATE exercises SET name = ?, category = ? WHERE name = ?;`,
        newName,
        category,
        oldName,
      );
    }

    await db.runAsync(
      `UPDATE exercises SET category = 'Abs' WHERE category = 'Core';`,
    );
    await db.runAsync(
      `UPDATE exercises SET category = 'Back' WHERE category = 'Bodyweight';`,
    );

    await db.runAsync(
      `INSERT INTO schema_version (version, applied_at) VALUES (?, ?);`,
      MIGRATION_V3,
      Date.now(),
    );
  });
}

async function applyMigrationV4(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Dedupe case-insensitive duplicate routine names: keep the most
    // recently updated name per group; suffix older duplicates with
    // " (2)", " (3)", … probing case-insensitively so no rename lands on
    // an existing name. updated_at is deliberately untouched so the
    // routines list order is unchanged.
    const rows = await db.getAllAsync<{ id: string; name: string }>(
      `SELECT id, name FROM routines ORDER BY updated_at DESC, created_at DESC;`,
    );
    const taken = new Set(rows.map((r) => r.name.toLowerCase()));
    const seen = new Set<string>();
    for (const row of rows) {
      const key = row.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        continue;
      }
      let suffix = 2;
      let candidate: string;
      do {
        candidate = `${row.name} (${suffix})`;
        suffix += 1;
      } while (taken.has(candidate.toLowerCase()));
      taken.add(candidate.toLowerCase());
      await db.runAsync(
        `UPDATE routines SET name = ? WHERE id = ?;`,
        candidate,
        row.id,
      );
    }

    await db.execAsync(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_routines_name_unique ON routines(name COLLATE NOCASE);`,
    );

    await db.runAsync(
      `INSERT INTO schema_version (version, applied_at) VALUES (?, ?);`,
      MIGRATION_V4,
      Date.now(),
    );
  });
}
