import { SQLiteDatabase } from 'expo-sqlite';

import { INDEX_DDLS, TABLE_DDLS } from './schema';
import { seedExercises } from './queries/exercises';
import { seedRoutinesIfEmpty } from './queries/routines';

const INITIAL_VERSION = 1;
const MIGRATION_V2 = 2;
const MIGRATION_V3 = 3;

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
