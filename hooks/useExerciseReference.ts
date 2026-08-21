import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import {
  getBestSet,
  getMostRepsSet,
  getRecentQualifyingSessions,
} from '../db/queries/tracking';
import { buildReferenceBundle } from '../utils/referenceSlots';
import type { BestLastResult, ReferenceBundle } from '../types';

interface ExerciseReference {
  bundle: ReferenceBundle;
  heaviest: BestLastResult | null;
  mostReps: BestLastResult | null;
}

const EMPTY_BUNDLE: ReferenceBundle = {
  slots: [],
  warmups: [],
  summary: null,
  notesCount: 0,
  latestSessionStartedAt: null,
  latestSessionNote: null,
};

export function useExerciseReference(
  exerciseId: string | undefined,
  currentSessionId: string | null,
  refreshKey: number,
): ExerciseReference {
  const db = useSQLiteContext();
  const [state, setState] = useState<ExerciseReference>({
    bundle: EMPTY_BUNDLE,
    heaviest: null,
    mostReps: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!exerciseId) {
      setState({ bundle: EMPTY_BUNDLE, heaviest: null, mostReps: null });
      return;
    }
    (async () => {
      const [sessions, heaviest, mostReps] = await Promise.all([
        getRecentQualifyingSessions(
          db,
          exerciseId,
          currentSessionId,
          Number.MAX_SAFE_INTEGER,
        ),
        getBestSet(db, exerciseId, 'working', currentSessionId),
        getMostRepsSet(db, exerciseId, 'working', currentSessionId),
      ]);
      if (!cancelled) {
        setState({
          bundle: buildReferenceBundle(sessions),
          heaviest,
          mostReps,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, exerciseId, currentSessionId, refreshKey]);

  return state;
}
