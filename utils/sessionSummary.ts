import type { SQLiteDatabase } from 'expo-sqlite';

import { getBestSet, getMostRepsSet } from '../db/queries/tracking';
import type { BestLastResult, SessionDetail, SessionExercise } from '../types';
import { isNewHeaviest, isNewRepPr } from './pr';

export interface ExercisePriors {
  heaviest: BestLastResult | null;
  mostReps: BestLastResult | null;
}

export type ExercisePriorsMap = Map<string, ExercisePriors | null>;

export interface SessionSummary {
  workingVolume: number;
  warmupVolume: number;
  workingSetCount: number;
  workingRepCount: number;
  heaviestSet: { weight: number; reps: number } | null;
  bestE1rm: number | null;
  prCount: number;
  hasPriors: boolean;
  firstSetAt: number | null;
  durationMs: number | null;
  equivalenceText: string;
}

export async function getSessionPriors(
  db: SQLiteDatabase,
  sessionId: string,
  exercises: Pick<SessionExercise, 'exercise_id'>[],
): Promise<ExercisePriorsMap> {
  const entries = await Promise.all(
    exercises.map(async (exercise) => {
      const [heaviest, mostReps] = await Promise.all([
        getBestSet(db, exercise.exercise_id, 'working', sessionId),
        getMostRepsSet(db, exercise.exercise_id, 'working', sessionId),
      ]);
      const priors: ExercisePriors | null =
        heaviest || mostReps ? { heaviest, mostReps } : null;
      return [exercise.exercise_id, priors] as const;
    }),
  );
  return new Map(entries);
}

interface RealWeightRule {
  multiplier: number;
  bar: number;
}

const REAL_WEIGHT_RULES: Record<string, RealWeightRule> = {
  Bench: { multiplier: 2, bar: 45 },
  Bi: { multiplier: 2, bar: 0 },
};

function realWeightFor(exerciseName: string | undefined): (w: number) => number {
  const rule = exerciseName ? REAL_WEIGHT_RULES[exerciseName] : undefined;
  if (!rule) return (w) => w;
  return (w) => w * rule.multiplier + rule.bar;
}

export function computeSessionSummary(
  session: SessionDetail,
  priors: ExercisePriorsMap,
  completedAt: number,
): SessionSummary {
  let workingVolume = 0;
  let warmupVolume = 0;
  let workingSetCount = 0;
  let workingRepCount = 0;
  let heaviestSet: SessionSummary['heaviestSet'] = null;
  let bestE1rm: number | null = null;
  let firstSetAt: number | null = null;
  let prCount = 0;
  let hasPriors = false;

  for (const exercise of session.exercises) {
    const prior = priors.get(exercise.exercise_id) ?? null;
    if (prior) hasPriors = true;
    let heaviestPr = false;
    let repPr = false;
    const realWeight = realWeightFor(exercise.exercise?.name);

    for (const s of exercise.sets ?? []) {
      if (firstSetAt === null || s.created_at < firstSetAt) {
        firstSetAt = s.created_at;
      }
      if (s.is_warmup) {
        warmupVolume += realWeight(s.weight) * s.reps;
        continue;
      }
      workingVolume += realWeight(s.weight) * s.reps;
      workingSetCount += 1;
      workingRepCount += s.reps;
      if (
        !heaviestSet ||
        s.weight > heaviestSet.weight ||
        (s.weight === heaviestSet.weight && s.reps > heaviestSet.reps)
      ) {
        heaviestSet = { weight: s.weight, reps: s.reps };
      }
      const e1rm = s.weight * (1 + s.reps / 30);
      if (bestE1rm === null || e1rm > bestE1rm) {
        bestE1rm = e1rm;
      }
      if (!heaviestPr && isNewHeaviest(s, prior?.heaviest ?? null)) heaviestPr = true;
      if (!repPr && isNewRepPr(s, prior?.mostReps ?? null)) repPr = true;
    }

    prCount += (heaviestPr ? 1 : 0) + (repPr ? 1 : 0);
  }

  return {
    workingVolume,
    warmupVolume,
    workingSetCount,
    workingRepCount,
    heaviestSet,
    bestE1rm,
    prCount,
    hasPriors,
    firstSetAt,
    durationMs: firstSetAt !== null ? Math.max(0, completedAt - firstSetAt) : null,
    equivalenceText: formatEquivalence(workingVolume),
  };
}

const EQUIVALENCE_LADDER: { label: string; plural: string; lbs: number }[] = [
  { label: 'basketball', plural: 'basketballs', lbs: 1.4 },
  { label: 'chihuahua', plural: 'chihuahuas', lbs: 6 },
  { label: 'bowling ball', plural: 'bowling balls', lbs: 14 },
  { label: 'corgi', plural: 'corgis', lbs: 30 },
  { label: 'Olympic plate', plural: 'Olympic plates', lbs: 45 },
  { label: 'golden retriever', plural: 'golden retrievers', lbs: 70 },
  { label: 'adult human', plural: 'adult humans', lbs: 140 },
  { label: 'giant panda', plural: 'giant pandas', lbs: 200 },
  { label: 'pig', plural: 'pigs', lbs: 300 },
  { label: 'motorcycle', plural: 'motorcycles', lbs: 500 },
  { label: 'grand piano', plural: 'grand pianos', lbs: 1000 },
  { label: 'polar bear', plural: 'polar bears', lbs: 1500 },
  { label: 'horse', plural: 'horses', lbs: 2000 },
  { label: 'hippo', plural: 'hippos', lbs: 3500 },
  { label: 'rhino', plural: 'rhinos', lbs: 5000 },
  { label: 'African elephant', plural: 'African elephants', lbs: 12000 },
  { label: 'T. rex', plural: 'T. rexes', lbs: 18000 },
  { label: 'school bus', plural: 'school buses', lbs: 25000 },
  { label: 'fire truck', plural: 'fire trucks', lbs: 40000 },
  { label: 'Boeing 737', plural: 'Boeing 737s', lbs: 91000 },
  { label: 'Space Shuttle', plural: 'Space Shuttles', lbs: 172000 },
  { label: 'blue whale', plural: 'blue whales', lbs: 300000 },
];

export function formatEquivalence(totalVolume: number): string {
  if (totalVolume <= 0) return '';
  let ref = EQUIVALENCE_LADDER[0];
  for (const candidate of EQUIVALENCE_LADDER) {
    if (candidate.lbs <= totalVolume) ref = candidate;
  }
  const multiple = totalVolume / ref.lbs;
  const text = multiple.toFixed(1);
  const label = text === '1.0' ? ref.label : ref.plural;
  return `≈ ${text} ${label}`;
}
