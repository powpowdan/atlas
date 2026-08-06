import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { getBestSet, getLastSet } from '../db/queries/tracking';
import type { BestLastResult } from '../types';

interface BestLast {
  best: BestLastResult | null;
  last: BestLastResult | null;
}

export function useExerciseBestLast(
  exerciseId: string | undefined,
  currentSessionId: string | null,
  refreshKey: number,
): BestLast {
  const db = useSQLiteContext();
  const [state, setState] = useState<BestLast>({ best: null, last: null });

  useEffect(() => {
    let cancelled = false;
    if (!exerciseId) {
      setState({ best: null, last: null });
      return;
    }
    (async () => {
      const [best, last] = await Promise.all([
        getBestSet(db, exerciseId),
        getLastSet(db, exerciseId, currentSessionId),
      ]);
      if (!cancelled) setState({ best, last });
    })();
    return () => {
      cancelled = true;
    };
  }, [db, exerciseId, currentSessionId, refreshKey]);

  return state;
}
