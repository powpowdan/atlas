## Why

The history detail screen (`app/history/[id].tsx`) shows the routine name twice — once in the navigation header and again as an in-body title — and shows the session date twice in the meta line ("Aug 21 · completed Aug 21 · 52m"). The redundancy adds visual noise without information, and the fallback name for sessions without a routine is inconsistent between the two placements ("Past session" in the nav vs "Ad-hoc" in the body).

## What Changes

- Remove the in-body routine-name title from the history detail header; the nav header title becomes the single place the routine name is shown.
- Unify the fallback for sessions without a routine name to "Ad-hoc" in the nav header, matching the history list.
- Reduce the meta line to a single occurrence of the session date plus duration (when completed), dropping the redundant "completed <date>" segment.
- Promote the remaining date · duration line from secondary `meta` styling to `heading` styling so the slimmed-down header row still reads as a title row.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `sessions`: The "View a past session" requirement changes — the routine name is displayed once (nav header, "Ad-hoc" fallback) instead of twice, and the date is displayed once alongside the duration, with the date · duration line rendered as heading-style text.

## Impact

- `app/history/[id].tsx`: delete the in-body `<Text style={styles.title}>` block and the unused `title` style; simplify the meta expression; restyle and rename the `meta` style (e.g. `headerDate`) to `type.heading`; change the nav title fallback to "Ad-hoc".
- No data, query, or navigation changes; purely presentational.
- The typography spec's role assignment is unaffected: the date · duration line moves from `meta` to `heading`, which is already the style used for dates in the history list rows.
