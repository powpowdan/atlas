import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { getBestSet, getLastSessionSets, getMostRepsSet } from '../db/queries/tracking';
import type { BestLastResult, LastSessionSet } from '../types';

interface ExerciseContext {
  heaviest: BestLastResult | null;
  mostReps: BestLastResult | null;
  lastSets: LastSessionSet[];
}

export function useExerciseBestLast(
  exerciseId: string | undefined,
  currentSessionId: string | null,
  refreshKey: number,
): ExerciseContext {
  const db = useSQLiteContext();
  const [state, setState] = useState<ExerciseContext>({
    heaviest: null,
    mostReps: null,
    lastSets: [],
  });

  useEffect(() => {
    let cancelled = false;
    if (!exerciseId) {
      setState({ heaviest: null, mostReps: null, lastSets: [] });
      return;
    }
    (async () => {
      const [heaviest, mostReps, lastSets] = await Promise.all([
        getBestSet(db, exerciseId),
        getMostRepsSet(db, exerciseId),
        getLastSessionSets(db, exerciseId, currentSessionId),
      ]);
      if (!cancelled) setState({ heaviest, mostReps, lastSets });
    })();
    return () => {
      cancelled = true;
    };
  }, [db, exerciseId, currentSessionId, refreshKey]);

  return state;
}
