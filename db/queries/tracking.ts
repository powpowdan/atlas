import { SQLiteDatabase } from 'expo-sqlite';

import type { BestLastResult, LastSessionSet } from '../../types';

interface BestLastRow {
  id: string;
  weight: number;
  reps: number;
  created_at: number;
  started_at: number | null;
}

interface LastSessionSetRow {
  id: string;
  weight: number;
  reps: number;
  is_warmup: number;
  created_at: number;
  started_at: number;
}

function rowToResult(row: BestLastRow): BestLastResult {
  return {
    id: row.id,
    weight: row.weight,
    reps: row.reps,
    created_at: row.created_at,
    started_at: row.started_at ?? undefined,
  };
}

function rowToLastSessionSet(row: LastSessionSetRow): LastSessionSet {
  return {
    id: row.id,
    weight: row.weight,
    reps: row.reps,
    is_warmup: row.is_warmup === 1,
    created_at: row.created_at,
    started_at: row.started_at,
  };
}

export async function getBestSet(
  db: SQLiteDatabase,
  exerciseId: string,
): Promise<BestLastResult | null> {
  const row = await db.getFirstAsync<BestLastRow>(
    `SELECT s.id, s.weight, s.reps, s.created_at, NULL AS started_at
     FROM sets s
     JOIN session_exercises se ON s.session_exercise_id = se.id
     WHERE se.exercise_id = ?
       AND s.is_warmup = 0
     ORDER BY s.weight DESC, s.reps DESC, s.created_at ASC
     LIMIT 1;`,
    exerciseId,
  );
  return row ? rowToResult(row) : null;
}

export async function getMostRepsSet(
  db: SQLiteDatabase,
  exerciseId: string,
): Promise<BestLastResult | null> {
  const row = await db.getFirstAsync<BestLastRow>(
    `SELECT s.id, s.weight, s.reps, s.created_at, NULL AS started_at
     FROM sets s
     JOIN session_exercises se ON s.session_exercise_id = se.id
     WHERE se.exercise_id = ?
       AND s.is_warmup = 0
     ORDER BY s.reps DESC, s.weight DESC, s.created_at ASC
     LIMIT 1;`,
    exerciseId,
  );
  return row ? rowToResult(row) : null;
}

export async function getLastSessionSets(
  db: SQLiteDatabase,
  exerciseId: string,
  currentSessionId: string | null,
): Promise<LastSessionSet[]> {
  const excludeClause = currentSessionId ? `AND sess.id <> ?` : ``;
  const findParams: string[] = [exerciseId];
  if (currentSessionId) findParams.push(currentSessionId);

  const prior = await db.getFirstAsync<{ session_id: string }>(
    `SELECT sess.id AS session_id
     FROM sessions sess
     JOIN session_exercises se ON se.session_id = sess.id
     WHERE se.exercise_id = ?
       AND sess.status = 'complete'
       ${excludeClause}
     ORDER BY sess.started_at DESC
     LIMIT 1;`,
    ...findParams,
  );
  if (!prior) return [];

  const rows = await db.getAllAsync<LastSessionSetRow>(
    `SELECT s.id, s.weight, s.reps, s.is_warmup, s.created_at, sess.started_at
     FROM sets s
     JOIN session_exercises se ON s.session_exercise_id = se.id
     JOIN sessions sess ON sess.id = se.session_id
     WHERE se.exercise_id = ? AND sess.id = ?
     ORDER BY s.created_at ASC;`,
    exerciseId,
    prior.session_id,
  );
  return rows.map(rowToLastSessionSet);
}
