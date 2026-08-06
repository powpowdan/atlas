import { SQLiteDatabase } from 'expo-sqlite';
import { v4 as uuid } from 'uuid';

import type {
  Exercise,
  Routine,
  RoutineExercise,
  RoutineWithExercises,
} from '../../types';

interface RoutineRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  exercise_count?: number;
}

interface RoutineExerciseRow {
  routine_id: string;
  exercise_id: string;
  order_index: number;
  exercise_id_full: string;
  exercise_name: string;
  exercise_category: string | null;
  exercise_is_assisted: number;
  exercise_created_at: number;
}

function rowToRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToRoutineExercise(row: RoutineExerciseRow): RoutineExercise {
  const exercise: Exercise = {
    id: row.exercise_id_full,
    name: row.exercise_name,
    category: row.exercise_category,
    is_assisted: row.exercise_is_assisted === 1,
    created_at: row.exercise_created_at,
  };
  return {
    routine_id: row.routine_id,
    exercise_id: row.exercise_id,
    order_index: row.order_index,
    exercise,
  };
}

export interface RoutineListItem extends Routine {
  exercise_count: number;
}

export async function listRoutines(
  db: SQLiteDatabase,
): Promise<RoutineListItem[]> {
  const rows = await db.getAllAsync<RoutineRow>(
    `SELECT r.id, r.name, r.created_at, r.updated_at,
            (SELECT COUNT(*) FROM routine_exercises re WHERE re.routine_id = r.id) AS exercise_count
     FROM routines r
     ORDER BY r.updated_at DESC;`,
  );
  return rows.map((row) => ({
    ...rowToRoutine(row),
    exercise_count: row.exercise_count ?? 0,
  }));
}

export async function getRoutine(
  db: SQLiteDatabase,
  id: string,
): Promise<RoutineWithExercises | null> {
  const head = await db.getFirstAsync<RoutineRow>(
    `SELECT id, name, created_at, updated_at FROM routines WHERE id = ?;`,
    id,
  );
  if (!head) return null;

  const exerciseRows = await db.getAllAsync<RoutineExerciseRow>(
    `SELECT re.routine_id,
            re.exercise_id,
            re.order_index,
            e.id          AS exercise_id_full,
            e.name        AS exercise_name,
            e.category    AS exercise_category,
            e.is_assisted AS exercise_is_assisted,
            e.created_at  AS exercise_created_at
     FROM routine_exercises re
     JOIN exercises e ON e.id = re.exercise_id
     WHERE re.routine_id = ?
     ORDER BY re.order_index ASC;`,
    id,
  );

  return {
    ...rowToRoutine(head),
    exercises: exerciseRows.map(rowToRoutineExercise),
  };
}

export async function createRoutine(
  db: SQLiteDatabase,
  input: { name: string; exerciseIds: string[] },
): Promise<Routine> {
  const id = uuid();
  const now = Date.now();
  const name = input.name.trim();
  if (!name) throw new Error('Routine name is required');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO routines (id, name, created_at, updated_at) VALUES (?, ?, ?, ?);`,
      id,
      name,
      now,
      now,
    );
    await assignRoutineExercises(db, id, input.exerciseIds);
  });

  const created = await getRoutine(db, id);
  if (!created) throw new Error('Failed to create routine');
  return created;
}

export async function updateRoutine(
  db: SQLiteDatabase,
  id: string,
  input: { name: string; exerciseIds: string[] },
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error('Routine name is required');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE routines SET name = ?, updated_at = ? WHERE id = ?;`,
      name,
      Date.now(),
      id,
    );
    await db.runAsync(
      `DELETE FROM routine_exercises WHERE routine_id = ?;`,
      id,
    );
    await assignRoutineExercises(db, id, input.exerciseIds);
  });
}

async function assignRoutineExercises(
  db: SQLiteDatabase,
  routineId: string,
  exerciseIds: string[],
): Promise<void> {
  for (let i = 0; i < exerciseIds.length; i++) {
    await db.runAsync(
      `INSERT INTO routine_exercises (routine_id, exercise_id, order_index) VALUES (?, ?, ?);`,
      routineId,
      exerciseIds[i],
      i,
    );
  }
}

export async function deleteRoutine(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync(`DELETE FROM routines WHERE id = ?;`, id);
}
