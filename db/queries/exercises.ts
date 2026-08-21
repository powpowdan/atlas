import { SQLiteDatabase } from 'expo-sqlite';
import { uuid } from '../../utils/uuid';

import seedData from '../../seed/exercises.json';
import {
  DuplicateExerciseError,
  type Exercise,
  type ExerciseInput,
  type ExerciseUpdate,
} from '../../types';

interface ExerciseRow {
  id: string;
  name: string;
  category: string | null;
  archived_at: number | null;
  created_at: number;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    archived_at: row.archived_at,
    created_at: row.created_at,
  };
}

const SELECT_COLS = `id, name, category, archived_at, created_at`;

const SEED_VERSION = 2;

export async function seedExercises(db: SQLiteDatabase): Promise<void> {
  const appliedRows = await db.getAllAsync<{ version: number }>(
    `SELECT version FROM seed_version;`,
  );
  const applied = new Set(appliedRows.map((r) => r.version));
  if (applied.has(SEED_VERSION)) return;

  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const item of seedData) {
      await db.runAsync(
        `INSERT OR IGNORE INTO exercises (id, name, category, archived_at, created_at)
         VALUES (?, ?, ?, NULL, ?);`,
        uuid(),
        item.name,
        item.category,
        now,
      );
    }
    await db.runAsync(
      `INSERT INTO seed_version (version, applied_at) VALUES (?, ?);`,
      SEED_VERSION,
      now,
    );
  });
}

export async function listExercises(
  db: SQLiteDatabase,
  opts?: { includeArchived?: boolean },
): Promise<Exercise[]> {
  const includeArchived = opts?.includeArchived ?? false;
  const orderClause = includeArchived
    ? `ORDER BY archived_at IS NULL DESC, name ASC`
    : ``;
  const whereClause = includeArchived ? `` : `WHERE archived_at IS NULL`;
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT ${SELECT_COLS}
     FROM exercises
     ${whereClause}
     ${orderClause};`,
  );
  return rows.map(rowToExercise);
}

export async function getExerciseById(
  db: SQLiteDatabase,
  id: string,
): Promise<Exercise | null> {
  const row = await db.getFirstAsync<ExerciseRow>(
    `SELECT ${SELECT_COLS}
     FROM exercises
     WHERE id = ?;`,
    id,
  );
  return row ? rowToExercise(row) : null;
}

export async function findExerciseByName(
  db: SQLiteDatabase,
  name: string,
): Promise<Exercise | null> {
  const row = await db.getFirstAsync<ExerciseRow>(
    `SELECT ${SELECT_COLS}
     FROM exercises
     WHERE name = ?;`,
    name,
  );
  return row ? rowToExercise(row) : null;
}

// Case-insensitive name-collision check used by both create and update.
// Returns the colliding exercise (if any), excluding the optional `exceptId`.
async function findCaseInsensitiveDuplicate(
  db: SQLiteDatabase,
  name: string,
  exceptId?: string,
): Promise<Exercise | null> {
  const sql = exceptId
    ? `SELECT ${SELECT_COLS} FROM exercises WHERE LOWER(name) = LOWER(?) AND id <> ?;`
    : `SELECT ${SELECT_COLS} FROM exercises WHERE LOWER(name) = LOWER(?);`;
  const row = exceptId
    ? await db.getFirstAsync<ExerciseRow>(sql, name, exceptId)
    : await db.getFirstAsync<ExerciseRow>(sql, name);
  return row ? rowToExercise(row) : null;
}

export async function createExercise(
  db: SQLiteDatabase,
  input: ExerciseInput,
): Promise<Exercise> {
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error('Name is required');
  const category = input.category.trim();
  if (!category) throw new Error('Category is required');

  let created: Exercise | null = null;
  await db.withTransactionAsync(async () => {
    const dup = await findCaseInsensitiveDuplicate(db, trimmed);
    if (dup) throw new DuplicateExerciseError(trimmed);

    const id = uuid();
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO exercises (id, name, category, archived_at, created_at)
       VALUES (?, ?, ?, NULL, ?);`,
      id,
      trimmed,
      category,
      now,
    );
    created = await getExerciseById(db, id);
  });
  if (!created) throw new Error('Failed to create exercise');
  return created;
}

export async function updateExercise(
  db: SQLiteDatabase,
  id: string,
  input: ExerciseUpdate,
): Promise<Exercise> {
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error('Name is required');
  const category = input.category.trim();
  if (!category) throw new Error('Category is required');

  let updated: Exercise | null = null;
  await db.withTransactionAsync(async () => {
    const dup = await findCaseInsensitiveDuplicate(db, trimmed, id);
    if (dup) throw new DuplicateExerciseError(trimmed);

    await db.runAsync(
      `UPDATE exercises
       SET name = ?, category = ?
       WHERE id = ?;`,
      trimmed,
      category,
      id,
    );
    updated = await getExerciseById(db, id);
  });
  if (!updated) throw new Error('Exercise not found');
  return updated;
}

export async function archiveExercise(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE exercises SET archived_at = ? WHERE id = ?;`,
    Date.now(),
    id,
  );
}

export async function restoreExercise(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE exercises SET archived_at = NULL WHERE id = ?;`,
    id,
  );
}
