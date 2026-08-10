import { SQLiteDatabase } from 'expo-sqlite';

import { INDEX_DDLS, TABLE_DDLS } from './schema';
import { seedExercisesIfEmpty } from './queries/exercises';
import { seedRoutinesIfEmpty } from './queries/routines';

const INITIAL_VERSION = 1;
const MIGRATION_V2 = 2;

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

  await seedExercisesIfEmpty(db);
  await seedRoutinesIfEmpty(db);
}
