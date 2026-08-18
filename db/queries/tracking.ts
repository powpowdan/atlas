import { SQLiteDatabase } from 'expo-sqlite';

import type {
  BestLastResult,
  ProgressionPoint,
  QualifyingSessionSets,
  SetTypeFilter,
} from '../../types';

interface BestLastRow {
  id: string;
  weight: number;
  reps: number;
  created_at: number;
  started_at: number | null;
}

interface ProgressionRow {
  session_id: string;
  started_at: number;
  set_id: string;
  weight: number;
  reps: number;
  created_at: number;
  volume: number;
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

// Epley estimated 1RM: weight × (1 + reps / 30).
export function estimateE1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

// Translate the SetTypeFilter union into a SQL fragment on sets.is_warmup.
// The alias must match whatever the calling query uses for the `sets` table
// (e.g. 's', 's2', 's3' in nested subqueries) — SQLite resolves column
// references against the innermost scope, so a hardcoded 's.' breaks any
// query that aliases sets differently.
function setTypeCondition(setType: SetTypeFilter, alias: string): string {
  switch (setType) {
    case 'working':
      return `${alias}.is_warmup = 0`;
    case 'warmup':
      return `${alias}.is_warmup = 1`;
    case 'all':
      return `1 = 1`;
  }
}

export async function getBestSet(
  db: SQLiteDatabase,
  exerciseId: string,
  setType: SetTypeFilter = 'working',
  excludeSessionId: string | null = null,
): Promise<BestLastResult | null> {
  const cond = setTypeCondition(setType, 's');
  const excludeClause = excludeSessionId ? `AND sess.id <> ?` : ``;
  const params: string[] = [exerciseId];
  if (excludeSessionId) params.push(excludeSessionId);
  const row = await db.getFirstAsync<BestLastRow>(
    `SELECT s.id, s.weight, s.reps, s.created_at, NULL AS started_at
     FROM sets s
     JOIN session_exercises se ON s.session_exercise_id = se.id
     JOIN sessions sess ON sess.id = se.session_id
     WHERE se.exercise_id = ?
       AND ${cond}
       ${excludeClause}
     ORDER BY s.weight DESC, s.reps DESC, s.created_at ASC
     LIMIT 1;`,
    ...params,
  );
  return row ? rowToResult(row) : null;
}

export async function getMostRepsSet(
  db: SQLiteDatabase,
  exerciseId: string,
  setType: SetTypeFilter = 'working',
  excludeSessionId: string | null = null,
): Promise<BestLastResult | null> {
  const cond = setTypeCondition(setType, 's');
  const excludeClause = excludeSessionId ? `AND sess.id <> ?` : ``;
  const params: string[] = [exerciseId];
  if (excludeSessionId) params.push(excludeSessionId);
  const row = await db.getFirstAsync<BestLastRow>(
    `SELECT s.id, s.weight, s.reps, s.created_at, NULL AS started_at
     FROM sets s
     JOIN session_exercises se ON s.session_exercise_id = se.id
     JOIN sessions sess ON sess.id = se.session_id
     WHERE se.exercise_id = ?
       AND ${cond}
       ${excludeClause}
     ORDER BY s.reps DESC, s.weight DESC, s.created_at ASC
     LIMIT 1;`,
    ...params,
  );
  return row ? rowToResult(row) : null;
}

export async function getBestE1rmSet(
  db: SQLiteDatabase,
  exerciseId: string,
  setType: SetTypeFilter = 'working',
): Promise<BestLastResult | null> {
  const cond = setTypeCondition(setType, 's');
  const row = await db.getFirstAsync<BestLastRow>(
    `SELECT s.id, s.weight, s.reps, s.created_at, NULL AS started_at
     FROM sets s
     JOIN session_exercises se ON s.session_exercise_id = se.id
     WHERE se.exercise_id = ?
       AND ${cond}
     ORDER BY (s.weight * (1 + s.reps / 30.0)) DESC,
              s.weight DESC,
              s.created_at ASC
     LIMIT 1;`,
    exerciseId,
  );
  return row ? rowToResult(row) : null;
}

interface RecentSessionRow {
  session_id: string;
  started_at: number;
  session_note: string | null;
}

interface RecentSetRow {
  session_id: string;
  id: string;
  weight: number;
  reps: number;
  is_warmup: number;
  note: string | null;
  created_at: number;
}

// Up to `n` most recent qualifying sessions (complete, >=1 working set for the
// exercise, excluding the current session), newest first, each with its note
// and full ordered set list.
export async function getRecentQualifyingSessions(
  db: SQLiteDatabase,
  exerciseId: string,
  currentSessionId: string | null,
  n: number,
): Promise<QualifyingSessionSets[]> {
  const excludeClause = currentSessionId ? `AND sess.id <> ?` : ``;
  const findParams: string[] = [exerciseId];
  if (currentSessionId) findParams.push(currentSessionId);

  const sessions = await db.getAllAsync<RecentSessionRow>(
    `SELECT sess.id AS session_id, sess.started_at AS started_at, sess.note AS session_note
     FROM sessions sess
     JOIN session_exercises se ON se.session_id = sess.id
     WHERE se.exercise_id = ?
       AND sess.status = 'complete'
       AND EXISTS (
         SELECT 1 FROM sets s
         WHERE s.session_exercise_id = se.id
           AND s.is_warmup = 0
       )
       ${excludeClause}
     ORDER BY sess.started_at DESC
     LIMIT ?;`,
    ...findParams,
    n,
  );
  if (sessions.length === 0) return [];

  const ids = sessions.map((s) => s.session_id);
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<RecentSetRow>(
    `SELECT se.session_id AS session_id, s.id, s.weight, s.reps, s.is_warmup, s.note, s.created_at
     FROM sets s
     JOIN session_exercises se ON s.session_exercise_id = se.id
     WHERE se.exercise_id = ? AND se.session_id IN (${placeholders})
     ORDER BY s.created_at ASC;`,
    exerciseId,
    ...ids,
  );

  return sessions.map((sess) => ({
    sessionId: sess.session_id,
    startedAt: sess.started_at,
    sessionNote: sess.session_note,
    sets: rows
      .filter((r) => r.session_id === sess.session_id)
      .map((r) => ({
        id: r.id,
        weight: r.weight,
        reps: r.reps,
        isWarmup: r.is_warmup === 1,
        note: r.note,
        createdAt: r.created_at,
      })),
  }));
}

// One row per qualifying completed session for the given exercise.
// "Qualifying" = the session has at least one set of the selected type for
// the exercise. Per session, the best set is the one with the highest Epley
// 1RM (tiebreak: greatest weight, then earliest set); volume is the sum of
// weight × reps across all selected-type sets in that session.
//
// Implementation note: we compute the per-session best inline in SQL by
// ranking sets within each (session, exercise) group by the e1rm tiebreak
// and keeping rank 1, and we aggregate volume in the same pass.
export async function getExerciseProgress(
  db: SQLiteDatabase,
  exerciseId: string,
  setType: SetTypeFilter = 'working',
): Promise<ProgressionPoint[]> {
  const cond2 = setTypeCondition(setType, 's2');
  const cond3 = setTypeCondition(setType, 's3');
  const rows = await db.getAllAsync<ProgressionRow>(
    `SELECT sess.id AS session_id,
            sess.started_at AS started_at,
            best.set_id AS set_id,
            best.weight AS weight,
            best.reps AS reps,
            best.created_at AS created_at,
            vol.volume AS volume
     FROM sessions sess
     JOIN session_exercises se ON se.session_id = sess.id
     JOIN (
       SELECT se2.session_id AS session_id,
              se2.exercise_id AS exercise_id,
              s2.id AS set_id,
              s2.weight AS weight,
              s2.reps AS reps,
              s2.created_at AS created_at,
              ROW_NUMBER() OVER (
                PARTITION BY se2.session_id
                ORDER BY (s2.weight * (1 + s2.reps / 30.0)) DESC,
                         s2.weight DESC,
                         s2.created_at ASC
              ) AS rn
       FROM sets s2
       JOIN session_exercises se2 ON s2.session_exercise_id = se2.id
       WHERE se2.exercise_id = ?
         AND ${cond2}
     ) best ON best.session_id = sess.id AND best.rn = 1
     JOIN (
       SELECT se3.session_id AS session_id,
              se3.exercise_id AS exercise_id,
              SUM(s3.weight * s3.reps) AS volume
       FROM sets s3
       JOIN session_exercises se3 ON s3.session_exercise_id = se3.id
       WHERE se3.exercise_id = ?
         AND ${cond3}
       GROUP BY se3.session_id, se3.exercise_id
     ) vol ON vol.session_id = sess.id AND vol.exercise_id = se.exercise_id
     WHERE sess.status = 'complete'
       AND se.exercise_id = ?
     ORDER BY sess.started_at ASC;`,
    exerciseId,
    exerciseId,
    exerciseId,
  );

  return rows.map((r) => ({
    sessionId: r.session_id,
    startedAt: r.started_at,
    bestWeight: r.weight,
    bestReps: r.reps,
    bestE1rm: estimateE1rm(r.weight, r.reps),
    volume: r.volume,
  }));
}
