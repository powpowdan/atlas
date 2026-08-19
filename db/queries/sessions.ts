import { SQLiteDatabase } from 'expo-sqlite';
import { uuid } from '../../utils/uuid';

import type {
  Session,
  SessionDetail,
  SessionExercise,
  SessionStatus,
  WorkoutSet,
} from '../../types';

interface SessionListRow {
  id: string;
  routine_id: string | null;
  started_at: number;
  completed_at: number | null;
  status: string;
  note: string | null;
  created_at: number;
  routine_name: string | null;
  exercise_count: number;
}

interface SessionRow {
  id: string;
  routine_id: string | null;
  started_at: number;
  completed_at: number | null;
  status: string;
  note: string | null;
  created_at: number;
  routine_name: string | null;
}

interface SessionExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  note: string | null;
  created_at: number;
  exercise_name: string;
  exercise_category: string | null;
  exercise_is_assisted: number;
  exercise_archived_at: number | null;
  exercise_created_at: number;
}

interface SetRow {
  id: string;
  session_exercise_id: string;
  weight: number;
  reps: number;
  is_warmup: number;
  note: string | null;
  created_at: number;
}

function rowToSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    session_exercise_id: row.session_exercise_id,
    weight: row.weight,
    reps: row.reps,
    is_warmup: row.is_warmup === 1,
    note: row.note,
    created_at: row.created_at,
  };
}

function rowToSessionExercise(row: SessionExerciseRow): SessionExercise {
  return {
    id: row.id,
    session_id: row.session_id,
    exercise_id: row.exercise_id,
    order_index: row.order_index,
    note: row.note,
    created_at: row.created_at,
    exercise: {
      id: row.exercise_id,
      name: row.exercise_name,
      category: row.exercise_category,
      is_assisted: row.exercise_is_assisted === 1,
      archived_at: row.exercise_archived_at,
      created_at: row.exercise_created_at,
    },
  };
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    routine_id: row.routine_id,
    started_at: row.started_at,
    completed_at: row.completed_at,
    status: row.status as SessionStatus,
    note: row.note,
    created_at: row.created_at,
    routine_name: row.routine_name,
  };
}

export interface SessionListItem extends Session {
  exercise_count: number;
}

export async function startSessionFromRoutine(
  db: SQLiteDatabase,
  routineId: string,
): Promise<Session> {
  const id = uuid();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO sessions (id, routine_id, started_at, status, created_at)
       VALUES (?, ?, ?, 'in_progress', ?);`,
      id,
      routineId,
      now,
      now,
    );
    const routineExercises = await db.getAllAsync<{ exercise_id: string; order_index: number }>(
      `SELECT exercise_id, order_index FROM routine_exercises
       WHERE routine_id = ?
       ORDER BY order_index ASC;`,
      routineId,
    );
    let orderIndex = 0;
    for (const re of routineExercises) {
      const seId = uuid();
      await db.runAsync(
        `INSERT INTO session_exercises (id, session_id, exercise_id, order_index, created_at)
         VALUES (?, ?, ?, ?, ?);`,
        seId,
        id,
        re.exercise_id,
        orderIndex++,
        now,
      );
    }
  });

  const created = await getSession(db, id);
  if (!created) throw new Error('Failed to start session');
  return created;
}

export async function startSessionAdhoc(db: SQLiteDatabase): Promise<Session> {
  const id = uuid();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO sessions (id, routine_id, started_at, status, created_at)
     VALUES (?, NULL, ?, 'in_progress', ?);`,
    id,
    now,
    now,
  );
  const created = await getSession(db, id);
  if (!created) throw new Error('Failed to start ad-hoc session');
  return created;
}

export async function addExerciseToSession(
  db: SQLiteDatabase,
  sessionId: string,
  exerciseId: string,
): Promise<string> {
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM session_exercises
     WHERE session_id = ? AND exercise_id = ?
     LIMIT 1;`,
    sessionId,
    exerciseId,
  );
  if (existing) return existing.id;
  const maxRow = await db.getFirstAsync<{ max_order: number | null }>(
    `SELECT MAX(order_index) AS max_order FROM session_exercises WHERE session_id = ?;`,
    sessionId,
  );
  const nextOrder = (maxRow?.max_order ?? -1) + 1;
  const id = uuid();
  await db.runAsync(
    `INSERT INTO session_exercises (id, session_id, exercise_id, order_index, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    id,
    sessionId,
    exerciseId,
    nextOrder,
    Date.now(),
  );
  return id;
}

export async function addSet(
  db: SQLiteDatabase,
  input: {
    session_exercise_id: string;
    weight: number;
    reps: number;
    is_warmup?: boolean;
    note?: string | null;
  },
): Promise<string> {
  if (
    input.weight === null ||
    input.weight === undefined ||
    Number.isNaN(input.weight) ||
    input.reps === null ||
    input.reps === undefined ||
    Number.isNaN(input.reps)
  ) {
    throw new Error('Weight and reps are required');
  }
  const id = uuid();
  await db.runAsync(
    `INSERT INTO sets (id, session_exercise_id, weight, reps, is_warmup, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.session_exercise_id,
    input.weight,
    input.reps,
    input.is_warmup ? 1 : 0,
    input.note ?? null,
    Date.now(),
  );
  return id;
}

export async function updateSet(
  db: SQLiteDatabase,
  id: string,
  patch: {
    weight?: number;
    reps?: number;
    is_warmup?: boolean;
    note?: string | null;
  },
): Promise<void> {
  const existing = await db.getFirstAsync<SetRow>(
    `SELECT id, session_exercise_id, weight, reps, is_warmup, note, created_at
     FROM sets WHERE id = ?;`,
    id,
  );
  if (!existing) throw new Error('Set not found');
  const next: SetRow = {
    ...existing,
    weight: patch.weight ?? existing.weight,
    reps: patch.reps ?? existing.reps,
    is_warmup:
      patch.is_warmup === undefined ? existing.is_warmup : patch.is_warmup ? 1 : 0,
    note: patch.note === undefined ? existing.note : patch.note,
  };
  if (
    next.weight === null ||
    next.weight === undefined ||
    Number.isNaN(next.weight) ||
    next.reps === null ||
    next.reps === undefined ||
    Number.isNaN(next.reps)
  ) {
    throw new Error('Weight and reps are required');
  }
  await db.runAsync(
    `UPDATE sets SET weight = ?, reps = ?, is_warmup = ?, note = ? WHERE id = ?;`,
    next.weight,
    next.reps,
    next.is_warmup,
    next.note,
    id,
  );
}

export async function deleteSet(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM sets WHERE id = ?;`, id);
}

export async function markSessionComplete(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE sessions SET status = 'complete', completed_at = ? WHERE id = ?;`,
    Date.now(),
    id,
  );
}

export async function deleteSession(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM sessions WHERE id = ?;`, id);
}

export async function removeExerciseFromSession(
  db: SQLiteDatabase,
  sessionExerciseId: string,
): Promise<void> {
  await db.runAsync(`DELETE FROM session_exercises WHERE id = ?;`, sessionExerciseId);
}

export async function setSessionNote(
  db: SQLiteDatabase,
  id: string,
  note: string | null,
): Promise<void> {
  await db.runAsync(`UPDATE sessions SET note = ? WHERE id = ?;`, note, id);
}

export async function listSessions(
  db: SQLiteDatabase,
  filter?: { status?: SessionStatus },
): Promise<SessionListItem[]> {
  const where = filter?.status ? `WHERE s.status = ?` : ``;
  const params = filter?.status ? [filter.status] : [];
  const rows = await db.getAllAsync<SessionListRow>(
    `SELECT s.id, s.routine_id, s.started_at, s.completed_at, s.status, s.note, s.created_at,
            r.name AS routine_name,
            (SELECT COUNT(*) FROM session_exercises se WHERE se.session_id = s.id) AS exercise_count
     FROM sessions s
     LEFT JOIN routines r ON r.id = s.routine_id
     ${where}
     ORDER BY s.started_at DESC;`,
    ...params,
  );
  return rows.map((row) => ({
    ...rowToSession(row),
    exercise_count: row.exercise_count ?? 0,
  }));
}

export async function getActiveSession(
  db: SQLiteDatabase,
): Promise<SessionListItem | null> {
  const rows = await listSessions(db, { status: 'in_progress' });
  return rows[0] ?? null;
}

export async function getSession(
  db: SQLiteDatabase,
  id: string,
): Promise<SessionDetail | null> {
  const head = await db.getFirstAsync<SessionRow>(
    `SELECT s.id, s.routine_id, s.started_at, s.completed_at, s.status, s.note, s.created_at,
            r.name AS routine_name
     FROM sessions s
     LEFT JOIN routines r ON r.id = s.routine_id
     WHERE s.id = ?;`,
    id,
  );
  if (!head) return null;

  const exerciseRows = await db.getAllAsync<SessionExerciseRow>(
    `SELECT se.id, se.session_id, se.exercise_id, se.order_index, se.note, se.created_at,
            e.name        AS exercise_name,
            e.category    AS exercise_category,
            e.is_assisted AS exercise_is_assisted,
            e.archived_at AS exercise_archived_at,
            e.created_at  AS exercise_created_at
     FROM session_exercises se
     JOIN exercises e ON e.id = se.exercise_id
     WHERE se.session_id = ?
     ORDER BY se.order_index ASC;`,
    id,
  );

  const exercises: SessionExercise[] = [];
  for (const erow of exerciseRows) {
    const setRows = await db.getAllAsync<SetRow>(
      `SELECT id, session_exercise_id, weight, reps, is_warmup, note, created_at
       FROM sets
       WHERE session_exercise_id = ?
       ORDER BY created_at ASC;`,
      erow.id,
    );
    exercises.push({
      ...rowToSessionExercise(erow),
      sets: setRows.map(rowToSet),
    });
  }

  return {
    ...rowToSession(head),
    exercises,
  };
}
