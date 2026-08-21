## Context

`ExerciseBody` in `app/session/[id].tsx` already receives everything needed: `sessionExercise.sets` (current session's logged sets) and `bundle.slots` (positional reference from `useExerciseReference`). A `workingIndexById` map (non-warmup sets, indexed positionally) is already computed at render time for `deltaForSet`. The chip row already has style composition precedent: `slotChipGhost` layers dashed/opacity over the base chip, and `slotChipPressed` demonstrates the ink-border/paperDeep emphasis look. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Cursor: focus treatment on the slot matching the next working-set number; dim positions already logged; standard styling above.
- Count label above the entry row with the three variants (`Set N of Y`, `Set N — beyond last time`, `Set N`).
- Zero data-layer changes; pure presentation derived from props already in the component.

**Non-Goals:**
- Moving focus info into the sticky exercise header (belongs to the `add-sticky-exercise-headers` change; revisit after it lands).
- Changing carry-forward prefill behavior, slot mechanics, or tap-to-copy.
- Any scroll-into-view behavior for the focused chip.

## Decisions

### 1. Derive `nextSetNumber` from the existing working-set map

`workingIndexById.size + 1`. Warmups are already excluded by the map's filter, so they cannot advance the cursor. No new state — recomputed every render, and `refresh()` already flows new `sets` down after each add.

*Alternative:* a `useMemo` on `sessionExercise.sets`. Rejected — the map is already built inline each render; a second memo of the same data adds noise for no measurable win.

### 2. Chip styling via ordered style-array composition

Extend the existing `style` array on the slot `Pressable`:

- `position < nextSetNumber` → `slotChipDone` (opacity 0.5)
- `position === nextSetNumber` → `slotChipFocus` (borderColor ink, backgroundColor paperDeep, bold text via `slotChipMainFocus` on the label)

Style arrays compose left-to-right, so `slotChipGhost` (dashed border) continues to layer under/over these — focus on a ghost keeps its dashed border; dimmed ghosts keep their age label at reduced opacity. Reuses `slotChipPressed`'s visual language (ink border + paperDeep) so "focused" reads like the chip is being held.

*Alternative:* restructure chips into a dedicated component with explicit `state: done | focus | upcoming | ghost` enum. Rejected for now — the style-array composition is small and local; a component split is warranted only if chip variants keep growing.

### 3. Count label as a plain `Text` line above `setEntryRow`

~12px, `textTertiary`, no chrome. `Y = bundle.slots.filter(s => !s.isGhost).length`. Variant logic:

```
hasHistory:  N <= Y ? `Set ${N} of ${Y}` : `Set ${N} — beyond last time`
no history:  `Set ${N}`
```

Ghost exclusion keeps Y equal to the most recent qualifying session's working-set count, so ghost slots never inflate the denominator.

*Alternative:* encode `3/5` inside the Add-set button text. Rejected — no room for the "beyond last time" variant and it changes the button's tap-target layout.

### 4. Warmup chips untouched

They have no position in the working-set sequence, so they receive no done/focus styles and are ignored by the label entirely.

## Risks / Trade-offs

- [Focused chip scrolled out of view on long histories] → Acceptable; the count label rides with the entry row, which is the primary action area. Scroll-into-view is a Non-Goal.
- [Dimmed chips read as disabled, users may stop tapping them to copy older targets] → Mitigated by keeping the pressed style working on dimmed chips (opacity ≠ pointer disable); if confusion surfaces, drop dim opacity from 0.5 to 0.6.
- [Y is 0 when the most recent qualifying session is fully ghost-superseded edge cases] → Cannot happen: slot 1 is pinned and non-ghost whenever any qualifying session exists (the newest session with a position-1 working set wins, and pinning searches all sessions), so `hasHistory` and `Y > 0` agree. If future slot changes break this invariant, the label falls back to the `— beyond last time` variant, which is still honest.

## Migration Plan

Single-file presentational change; no schema, storage, or navigation impact. Rollback = revert the commit.
