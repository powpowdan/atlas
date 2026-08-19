## 1. Shared PR comparison + summary computation

- [x] 1.1 Extract `isNewHeaviest` / `isNewRepPr` from `app/session/[id].tsx` into a shared util (e.g., `utils/pr.ts`), import them back into the session screen, and confirm badge behavior is unchanged
- [x] 1.2 Create `utils/sessionSummary.ts` with the `SessionSummary` type and pure `computeSessionSummary(session, priors, completedAt)` implementing: working/warmup volume, working sets + reps, heaviest working set, best e1RM (Epley `weight × (1 + reps/30)`), PR count using the shared comparisons (max one heaviest + one rep PR per exercise; zero when an exercise has no prior bests), first-set timestamp (earliest `created_at` across all sets)
- [x] 1.3 Add the equivalence ladder (const array of `{ label, lbs }` from bowling ball to school bus) and a pure `formatEquivalence(totalVolume)` returning a one-decimal multiple of the largest reference ≤ total
- [x] 1.4 Add number/duration formatting helpers (thousands-separated volume, `h/m` duration) following the pattern in `app/history/[id].tsx`

## 2. Prior-bests assembly

- [x] 2.1 Add an async helper that, given the session's exercises, fetches prior bests via `getBestSet` / `getMostRepsSet` (`'working'`, `excludeSessionId = sessionId`) with `Promise.all`, returning `exerciseId → { heaviest, mostReps } | null`

## 3. Summary modal UI

- [x] 3.1 Create `components/SessionSummaryModal.tsx`: RN `Modal` presenting headline totals (volume, sets, reps), warmup volume footnote (only when warmup volume > 0), active duration from first set, heaviest set, best e1RM, PR line (omitted when no exercise had prior history), equivalence line, and a "Done" button
- [x] 3.2 Style consistent with existing modals/screens in `app/session/[id].tsx`; ad-hoc sessions display the "Ad-hoc" label

## 4. Wire into session completion

- [x] 4.1 Update `handleComplete` in `app/session/[id].tsx`: gather prior bests, compute summary with `completedAt = Date.now()`, then `markSessionComplete` + `clearActiveSession`, then show the modal instead of navigating; "Done" performs the existing back/replace navigation
- [x] 4.2 Handle edge cases: zero logged sets or zero working sets → complete without showing the modal

## 5. Verification

- [x] 5.1 Run `npm run typecheck` from WSL and fix any errors
- [ ] 5.2 Manual smoke test from PowerShell/Expo: session with working + warmup sets (footnote appears, warmups excluded from headline), first-time exercise only (no PR line), repeat exercise with a beaten best (PR count correct), no-set session (no modal), duration vs. creation delay (active duration used)

## 6. Review refinements

- [x] 6.1 Replace the emoji in `SessionSummaryModal` with a subtle logo banner (`logo.jpg`, ~100×55, contain)
- [x] 6.2 Expand the equivalence ladder to 22 entries spanning basketball (1.4 lbs) to blue whale (300,000 lbs)
- [x] 6.3 Apply real-weight adjustment to volume totals only: `REAL_WEIGHT_RULES` name-keyed map in `utils/sessionSummary.ts` (Bench ×2 + 45 bar, Bi ×2); heaviest/e1RM/PR stay raw
- [x] 6.4 Sync artifacts (proposal, specs delta, design decision 8, this task group) with the logo, ladder, and real-weight decisions
