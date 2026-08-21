## Context

The session screen (`app/session/[id].tsx`) renders exercises as SectionList sections with sticky headers (`ExerciseHeader`). After every mutation the screen calls `refresh()`, which re-fetches the full `SessionDetail`; sets arrive per exercise sorted `created_at ASC` (`db/queries/sessions.ts` `getSession`). Every set row already persists `created_at` (epoch ms) at insert time. There is no timer infrastructure anywhere in the app, and no existing per-second re-render pattern.

The sticky header UI is being introduced by the in-flight `add-sticky-exercise-headers` change; this change builds on top of it and must be implemented after it lands.

## Goals / Non-Goals

**Goals:**

- Per-exercise stopwatch in the sticky exercise header, resetting only on sets of that exercise.
- Zero persistence, zero schema change, zero store change — elapsed time is always derived.
- Correct across backgrounding/lock/screen-exit without any lifecycle handling.
- Contain the 1 Hz re-render to a tiny leaf component.

**Non-Goals:**

- Rest targets, progress fills, or threshold coloring (display-only).
- Haptic or audio alerts.
- Any record of rest durations in history/summary/chart views.
- A session-level (global) clock.

## Decisions

### 1. Derive, never accumulate

Elapsed time is computed as `Date.now() - anchorTs` on each tick, where `anchorTs = sets[sets.length - 1].created_at` for that exercise (sets are pre-sorted ascending, so the last element is the max). No counter state, no persistence.

*Why not accumulate ticks:* an accumulator drifts and loses time while backgrounded; a derived value is always exactly right on resume, app restart, or screen re-entry — for free. It also makes delete-fallback automatic: re-derive the anchor from the refreshed sets and the stopwatch re-anchors to the new latest set with no special cases.

*Why anchor per exercise, not per session:* supersets. Two or three exercises alternated back-to-back each need their own recovery clock; a global anchor would reset on every set of any exercise and hide exactly the information the resting user wants.

*Why warmup sets reset the timer:* warmups are part of the per-exercise work/rest rhythm; `created_at` already records them and excluding them would add a filter for no user benefit.

### 2. Isolated leaf component owns the interval

New `components/RestTimer.tsx`:

```
RestTimer({ anchorTs }: { anchorTs: number })
  ├─ const [now, setNow] = useState(Date.now())
  ├─ useEffect(() => {            // keyed on anchorTs
  │     setNow(Date.now());        // resync on anchor change
  │     const t = setInterval(() => setNow(Date.now()), 1000);
  │     return () => clearInterval(t);
  │   }, [anchorTs])
  ├─ format(now - anchorTs) → "m:ss" | "h:mm:ss"
  └─ <Text pointerEvents="none" style={tabular}>…</Text>
```

Wrapped in `React.memo` keyed on `anchorTs` (a number — cheap shallow compare).

*Why a leaf instead of screen-level state:* the session screen is heavy (reference chips, PR badges, SectionList). A `setNow` at screen level would re-render all of it every second, for every exercise simultaneously. The leaf re-renders only its own `<Text>`. The screen already re-renders on real mutations via `refresh()`; `memo` + stable `anchorTs` means the interval effect does not restart on those re-renders.

*Why `key={anchorTs}`-style effect rather than one interval with a ref:* restarting a 1 s interval on a rare anchor change is simpler than ref-juggling and cannot produce a stale first render after the anchor moves (the explicit `setNow` in the effect covers the resync).

### 3. Placement and rendering rules

Rendered inside `ExerciseHeader`, right-aligned on the same row as the exercise name (`justifyContent: 'space-between'`). Shown only when:

- the session `status === 'in_progress'`, and
- the exercise has ≥ 1 set.

`pointerEvents="none"` on the timer `<Text>` so the header's tap-to-navigate Pressable keeps working over the timer area (matches the spec'd interaction requirement).

### 4. Formatting

Pure helper (colocated in the component or `utils/format.ts` alongside existing formatters): `m:ss` zero-padded under an hour, `h:mm:ss` at an hour or more. Rendered with `type.tabular` (already used for set rows and slot chips) so digits don't jitter the header layout while counting.

## Risks / Trade-offs

- [Multiple mounted headers each run a 1 Hz interval] → With 2–3 sticky/visible headers this is a handful of trivial `setState`s per second; acceptable. If profiling ever disagrees, a shared "now" store subscription is the escape hatch, not needed now.
- [Anchor staleness if SectionList recycles section headers without new props] → `React.memo` keyed on `anchorTs` is exactly correct here: recycled or not, the displayed value derives from the current prop; a header rendered for a different exercise gets a new prop and re-derives.
- [Clock skew if user manually changes device time] → Derived from wall clock; a changed device clock shows a changed elapsed. Not worth mitigating for a display-only stopwatch.
- [Conflicts with `add-sticky-exercise-headers` in `ExerciseHeader`] → Sequencing: implement this change only after that one is archived; its header layout is the substrate this builds on.
- [1 Hz re-render while keyboard is open] → The leaf renders outside the keyboard-height padding path; a one-`<Text>` re-render does not affect input focus or keyboard state.

## Migration Plan

Purely additive UI; no data or migration concerns. Rollback is deleting the component render — no persisted state to unwind.
