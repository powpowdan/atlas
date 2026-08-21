## 1. Header edits in `app/history/[id].tsx`

- [x] 1.1 Change the nav title fallback from `'Past session'` to `'Ad-hoc'` in the `navigation.setOptions` call (design decision 2)
- [x] 1.2 Remove the in-body `<Text style={styles.title}>` block and its now-unused `title` style entry
- [x] 1.3 Reduce the meta line to start date plus duration (drop the `completed <date>` segment)
- [x] 1.4 Rename the `meta` style to `headerDate`, switch it to `{ ...type.heading, color: colors.ink }`, and use it on the date · duration line

## 2. Verification

- [x] 2.1 Run `npm run typecheck` and fix any unused-style or unused-variable errors
- [x] 2.2 Manual check (user, from PowerShell): open a completed session from history — nav header shows routine name once ("Ad-hoc" when none), body shows a single heading-style `date · duration` line, Delete button still right-aligned; an in-progress session shows date with no duration
