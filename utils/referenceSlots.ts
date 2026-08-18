import { estimateE1rm } from '../db/queries/tracking';
import { formatWeightLabel } from './format';
import type {
  QualifyingSessionSet,
  QualifyingSessionSets,
  ReferenceBundle,
  ReferenceSlot,
  ReferenceSummary,
  SetDelta,
} from '../types';

export const GHOST_WINDOW = 3;

function workingSets(session: QualifyingSessionSets): QualifyingSessionSet[] {
  return session.sets.filter((s) => !s.isWarmup);
}

function topWorkingSet(session: QualifyingSessionSets): QualifyingSessionSet | null {
  const working = workingSets(session);
  if (working.length === 0) return null;
  let best = working[0];
  for (const s of working.slice(1)) {
    const bestE = estimateE1rm(best.weight, best.reps);
    const sE = estimateE1rm(s.weight, s.reps);
    if (
      sE > bestE ||
      (sE === bestE && s.weight > best.weight) ||
      (sE === bestE && s.weight === best.weight && s.createdAt < best.createdAt)
    ) {
      best = s;
    }
  }
  return best;
}

function buildSummary(
  newer: QualifyingSessionSets,
  older: QualifyingSessionSets,
): ReferenceSummary {
  const newerTop = topWorkingSet(newer);
  const olderTop = topWorkingSet(older);
  const newerCount = workingSets(newer).length;
  const olderCount = workingSets(older).length;
  return {
    topSetDeltaWeight:
      newerTop && olderTop ? roundWeight(newerTop.weight - olderTop.weight) : 0,
    topSetDeltaReps: newerTop && olderTop ? newerTop.reps - olderTop.reps : 0,
    setCountDelta: newerCount - olderCount,
    newerTop: newerTop
      ? { weight: newerTop.weight, reps: newerTop.reps }
      : { weight: 0, reps: 0 },
    olderTop: olderTop
      ? { weight: olderTop.weight, reps: olderTop.reps }
      : { weight: 0, reps: 0 },
    newerSetCount: newerCount,
    olderSetCount: olderCount,
    olderStartedAt: older.startedAt,
  };
}

const EMPTY_BUNDLE: ReferenceBundle = {
  slots: [],
  warmups: [],
  summary: null,
  notesCount: 0,
  latestSessionStartedAt: null,
  latestSessionNote: null,
};

// Builds the during-logging reference view from qualifying sessions, expected
// newest-first (as returned by getRecentQualifyingSessions). Working-set slots
// are positional: slot p holds the newest working set at position p within the
// ghost window; positions absent from the whole window produce no slot.
// Warmups come from the newest session only and are display-only.
export function buildReferenceBundle(
  sessions: QualifyingSessionSets[],
): ReferenceBundle {
  if (sessions.length === 0) return EMPTY_BUNDLE;

  const workingAll = sessions.map(workingSets);
  const maxSlots = Math.max(
    0,
    ...workingAll.slice(0, GHOST_WINDOW).map((w) => w.length),
  );

  const slots: ReferenceSlot[] = [];
  for (let pos = 1; pos <= maxSlots; pos++) {
    for (let age = 0; age < GHOST_WINDOW && age < sessions.length; age++) {
      const set = workingAll[age][pos - 1];
      if (set) {
        // Previous occurrence of this position in older fetched sessions
        // (skip-passing, like ghosts). Null when none exists in the window.
        let prevOccurrence: { weight: number; reps: number } | null = null;
        for (let older = age + 1; older < sessions.length; older++) {
          const candidate = workingAll[older][pos - 1];
          if (candidate) {
            prevOccurrence = candidate;
            break;
          }
        }
        slots.push({
          position: pos,
          weight: set.weight,
          reps: set.reps,
          sessionId: sessions[age].sessionId,
          startedAt: sessions[age].startedAt,
          ageInSessions: age,
          isGhost: age > 0,
          note: set.note,
          prevDelta: prevOccurrence
            ? classifySetDelta(set, prevOccurrence)
            : null,
        });
        break;
      }
    }
  }

  const warmups: ReferenceSlot[] = sessions[0].sets
    .filter((s) => s.isWarmup)
    .map((s, idx) => ({
      position: idx + 1,
      weight: s.weight,
      reps: s.reps,
      sessionId: sessions[0].sessionId,
      startedAt: sessions[0].startedAt,
      ageInSessions: 0,
      isGhost: false,
      note: s.note,
      prevDelta: null,
    }));

  const slotNotes = slots.filter((s) => (s.note ?? '').trim().length > 0).length;
  const latest = sessions[0];
  const notesCount =
    ((latest.sessionNote ?? '').trim().length > 0 ? 1 : 0) + slotNotes;

  return {
    slots,
    warmups,
    summary: sessions.length >= 2 ? buildSummary(latest, sessions[1]) : null,
    notesCount,
    latestSessionStartedAt: latest.startedAt,
    latestSessionNote: latest.sessionNote,
  };
}

function roundWeight(n: number): number {
  return Math.round(n * 100) / 100;
}

export function classifySetDelta(
  current: { weight: number; reps: number },
  reference: { weight: number; reps: number } | undefined,
): SetDelta {
  if (!reference) {
    return { kind: 'new-set', tone: 'flat' };
  }
  const weightDelta = roundWeight(current.weight - reference.weight);
  const repsDelta = current.reps - reference.reps;
  if (weightDelta === 0 && repsDelta === 0) {
    return { kind: 'match', tone: 'flat' };
  }
  let tone: SetDelta['tone'];
  if (weightDelta > 0) {
    tone = 'up';
  } else if (weightDelta < 0) {
    tone = 'down';
  } else {
    tone = repsDelta > 0 ? 'up' : 'down';
  }
  return { kind: 'delta', weightDelta, repsDelta, tone };
}

function trimNumber(n: number): string {
  return String(parseFloat(n.toFixed(2)));
}

function sign(n: number): string {
  return n > 0 ? '+' : '−';
}

function repWord(n: number): string {
  return Math.abs(n) === 1 ? 'rep' : 'reps';
}

export function formatDeltaText(delta: SetDelta): string {
  if (delta.kind === 'new-set') return '● new set';
  if (delta.kind === 'match') return '=';
  const parts: string[] = [];
  const wd = delta.weightDelta ?? 0;
  const rd = delta.repsDelta ?? 0;
  if (wd !== 0) {
    parts.push(`${wd > 0 ? '▲' : '▼'} ${sign(wd)}${trimNumber(Math.abs(wd))} lbs`);
  }
  if (rd !== 0) {
    parts.push(`${rd > 0 ? '▲' : '▼'} ${sign(rd)}${Math.abs(rd)} ${repWord(rd)}`);
  }
  return parts.join(' ');
}

export function formatSummaryLine(summary: ReferenceSummary): string {
  const date = new Date(summary.olderStartedAt).toLocaleDateString();
  const wd = summary.topSetDeltaWeight;
  const rd = summary.topSetDeltaReps;
  const topSetChanged = wd !== 0 || rd !== 0;
  const countChanged = summary.setCountDelta !== 0;

  if (!topSetChanged && !countChanged) {
    return `vs ${date}: matched last time`;
  }

  const parts: string[] = [];

  if (topSetChanged) {
    const arrow = wd > 0 || (wd === 0 && rd > 0) ? '↑' : '↓';
    parts.push(
      `top set ${formatWeightLabel(summary.newerTop.weight)} ×${summary.newerTop.reps} ${arrow} ` +
        `from ${trimNumber(summary.olderTop.weight)}×${summary.olderTop.reps}`,
    );
  } else {
    parts.push(
      `top set ${formatWeightLabel(summary.newerTop.weight)} ×${summary.newerTop.reps} =`,
    );
  }

  if (countChanged) {
    const setWord = summary.newerSetCount === 1 ? 'set' : 'sets';
    parts.push(`${summary.newerSetCount} ${setWord} (was ${summary.olderSetCount} before)`);
  }

  return `vs ${date}: ${parts.join(' · ')}`;
}

export function formatAgeLabel(startedAt: number): string {
  const days = Math.max(0, Math.floor((Date.now() - startedAt) / 86_400_000));
  if (days < 1) return 'today';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
