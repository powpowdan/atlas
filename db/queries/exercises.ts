import { SQLiteDatabase } from 'expo-sqlite';
import { v4 as uuid } from 'uuid';

import seedData from '../../seed/exercises.json';
import type { Exercise } from '../../types';

interface ExerciseRow {
  id: string;
  name: string;
  category: string | null;
  is_assisted: number;
  created_at: number;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    is_assisted: row.is_assisted === 1,
    created_at: row.created_at,
  };
}

export async function seedExercisesIfEmpty(db: SQLiteDatabase): Promise<void> {
  const countRow = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM exercises;`,
  );
  const count = countRow?.c ?? 0;
  if (count > 0) return;

  const now = Date.now();
  for (const item of seedData) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (id, name, category, is_assisted, created_at)
       VALUES (?, ?, ?, ?, ?);`,
      uuid(),
      item.name,
      item.category ?? null,
      item.is_assisted ? 1 : 0,
      now,
    );
  }
}

export async function listExercises(db: SQLiteDatabase): Promise<Exercise[]> {
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT id, name, category, is_assisted, created_at
     FROM exercises
     ORDER BY name ASC;`,
  );
  return rows.map(rowToExercise);
}

export async function getExerciseById(
  db: SQLiteDatabase,
  id: string,
): Promise<Exercise | null> {
  const row = await db.getFirstAsync<ExerciseRow>(
    `SELECT id, name, category, is_assisted, created_at
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
    `SELECT id, name, category, is_assisted, created_at
     FROM exercises
     WHERE name = ?;`,
    name,
  );
  return row ? rowToExercise(row) : null;
}

export async function createExercise(
  db: SQLiteDatabase,
  input: { name: string; category?: string | null; is_assisted?: boolean },
): Promise<Exercise> {
  const id = uuid();
  const now = Date.now();
  await db.runAsync(
    `INSERT OR IGNORE INTO exercises (id, name, category, is_assisted, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    id,
    input.name.trim(),
    input.category?.trim() || null,
    input.is_assisted ? 1 : 0,
    now,
  );
  const created = await getExerciseById(db, id);
  if (!created) throw new Error('Failed to create exercise');
  return created;
}
