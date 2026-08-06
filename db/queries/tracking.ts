import { SQLiteDatabase } from 'expo-sqlite';

import type { BestLastResult } from '../../types';

interface BestLastRow {
  id: string;
  weight: number;
  reps: number;
  created_at: number;
  started_at: number | null;
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

export async function getLastSet(
  db: SQLiteDatabase,
  exerciseId: string,
  currentSessionId: string | null,
): Promise<BestLastResult | null> {
  const excludeClause = currentSessionId ? `AND sess.id <> ?` : ``;
  const params: (string | null)[] = [exerciseId];
  if (currentSessionId) params.push(currentSessionId);
  const row = await db.getFirstAsync<BestLastRow>(
    `SELECT s.id, s.weight, s.reps, s.created_at, sess.started_at AS started_at
     FROM sets s
     JOIN session_exercises se ON s.session_exercise_id = se.id
     JOIN sessions sess ON sess.id = se.session_id
     WHERE se.exercise_id = ?
       AND s.is_warmup = 0
       ${excludeClause}
     ORDER BY sess.started_at DESC, s.weight DESC, s.reps DESC, s.created_at ASC
     LIMIT 1;`,
    ...params,
  );
  return row ? rowToResult(row) : null;
}
