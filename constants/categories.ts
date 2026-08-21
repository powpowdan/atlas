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
