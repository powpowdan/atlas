export const CANONICAL_CATEGORIES: readonly string[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Abs',
];

export function sortCategories(names: Iterable<string>): string[] {
  const unique = [...new Set(names)];
  return unique.sort((a, b) => {
    const ia = CANONICAL_CATEGORIES.indexOf(a);
    const ib = CANONICAL_CATEGORIES.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function normalizeCategory(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

const SUGGESTION_MAX_DISTANCE = 2;
const SUGGESTION_MAX_DISTANCE_RATIO = 0.4;

// Returns the existing category the input most likely means, or null.
// Exact normalized equality wins; otherwise a near-match within
// SUGGESTION_MAX_DISTANCE edits (and at most 40% of the target's length).
export function suggestCategory(
  input: string,
  existing: readonly string[],
): string | null {
  const normalized = normalizeCategory(input);
  if (!normalized) return null;

  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of existing) {
    const candidateNormalized = normalizeCategory(candidate);
    if (!candidateNormalized) continue;
    const distance = levenshtein(normalized, candidateNormalized);
    if (distance === 0) return candidate;
    if (distance > SUGGESTION_MAX_DISTANCE) continue;
    if (distance > Math.ceil(candidateNormalized.length * SUGGESTION_MAX_DISTANCE_RATIO)) continue;
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
