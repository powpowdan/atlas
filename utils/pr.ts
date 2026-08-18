import type { BestLastResult, WorkoutSet } from '../types';

export function isNewHeaviest(
  s: Pick<WorkoutSet, 'weight' | 'reps'>,
  best: BestLastResult | null,
): boolean {
  if (!best) return false;
  return s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps);
}

export function isNewRepPr(
  s: Pick<WorkoutSet, 'weight' | 'reps'>,
  best: BestLastResult | null,
): boolean {
  if (!best) return false;
  return s.reps > best.reps || (s.reps === best.reps && s.weight > best.weight);
}
