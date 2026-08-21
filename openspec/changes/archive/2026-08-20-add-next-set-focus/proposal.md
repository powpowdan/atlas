## Why

During logging, the "Last time" reference chips show all prior sets with uniform styling. To act on the next set, the user must count their logged working sets, scan the chip row for the matching number, and mentally haul it into the inputs — a manual matching task the app already has the data to do. This gets worse with 5+ sets, where chips wrap to multiple lines, and there is no indication of how deep into the exercise the user currently is.

## What Changes

- Add a **cursor** to the reference chips: the chip whose position matches the next working set to be logged is visually focused (filled, bold, ink border); chips at positions already logged are dimmed; later chips keep their current styling. Ghost styling composes with both treatments.
- Add a **set-count label** above the set-entry inputs showing where the user is:
  - `Set N of Y` when within last time's working sets (Y counts non-ghost slots only)
  - `Set N — beyond last time` when N exceeds Y
  - `Set N` when the exercise has no prior qualifying sessions
- No changes to slot mechanics (pinning, ghost window, deltas, tap-to-copy), warmup chips, or set entry/carry-forward behavior.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tracking`: the "Reference set slots per exercise" requirement gains cursor highlighting and next-set count presentation. Slot construction semantics are unchanged.

## Impact

- `app/session/[id].tsx` — `ExerciseBody`: derive next working-set number and last-session set count; new chip style variants; count label above the entry row.
- `constants/theme.ts` — possibly no change; reuses existing colors (`ink`, `paperDeep`, `textTertiary`).
- No data layer, query, or store changes — all inputs already flow to the component (`bundle.slots`, `sessionExercise.sets`).
