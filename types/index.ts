export interface Exercise {
  id: string;
  name: string;
  category: string | null;
  is_assisted: boolean;
  archived_at: number | null;
  created_at: number;
}

export interface ExerciseInput {
  name: string;
  category: string | null;
  is_assisted: boolean;
}

export type ExerciseUpdate = ExerciseInput;

export class DuplicateExerciseError extends Error {
  constructor(public exerciseName: string) {
    super(`An exercise with the name "${exerciseName}" already exists.`);
    this.name = 'DuplicateExerciseError';
  }
}

export interface Routine {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface RoutineExercise {
  routine_id: string;
  exercise_id: string;
  order_index: number;
  exercise?: Exercise;
}

export interface RoutineWithExercises extends Routine {
  exercises: RoutineExercise[];
}

export type SessionStatus = 'in_progress' | 'complete';

export interface Session {
  id: string;
  routine_id: string | null;
  started_at: number;
  completed_at: number | null;
  status: SessionStatus;
  note: string | null;
  created_at: number;
  routine_name?: string | null;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  note: string | null;
  created_at: number;
  exercise?: Exercise;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  session_exercise_id: string;
  weight: number;
  reps: number;
  is_warmup: boolean;
  note: string | null;
  created_at: number;
}

export interface SessionDetail extends Session {
  exercises: SessionExercise[];
}

export interface BestLastResult {
  id: string;
  weight: number;
  reps: number;
  created_at: number;
  started_at?: number;
}

export interface QualifyingSessionSet {
  id: string;
  weight: number;
  reps: number;
  isWarmup: boolean;
  note: string | null;
  createdAt: number;
}

export interface QualifyingSessionSets {
  sessionId: string;
  startedAt: number;
  sessionNote: string | null;
  sets: QualifyingSessionSet[];
}

export interface ReferenceSlot {
  position: number;
  weight: number;
  reps: number;
  sessionId: string;
  startedAt: number;
  ageInSessions: number;
  isGhost: boolean;
  note: string | null;
  prevDelta: SetDelta | null;
}

export interface ReferenceSummary {
  topSetDeltaWeight: number;
  topSetDeltaReps: number;
  setCountDelta: number;
  newerTop: { weight: number; reps: number };
  olderTop: { weight: number; reps: number };
  newerSetCount: number;
  olderSetCount: number;
  olderStartedAt: number;
}

export interface ReferenceBundle {
  slots: ReferenceSlot[];
  warmups: ReferenceSlot[];
  summary: ReferenceSummary | null;
  notesCount: number;
  latestSessionStartedAt: number | null;
  latestSessionNote: string | null;
}

export interface SetDelta {
  kind: 'new-set' | 'match' | 'delta';
  weightDelta?: number;
  repsDelta?: number;
  tone: 'up' | 'down' | 'flat';
}

export type SetTypeFilter = 'working' | 'all' | 'warmup';

export type ProgressionMetric = 'e1rm' | 'weight' | 'reps' | 'volume';

export interface ProgressionPoint {
  sessionId: string;
  startedAt: number;
  bestWeight: number;
  bestReps: number;
  bestE1rm: number;
  volume: number;
}
