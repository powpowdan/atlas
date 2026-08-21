## 1. Type scale presets

- [x] 1.1 Add role presets to `type` in `constants/theme.ts` per the spec table: title (Fraunces 20/600), heroStat (34/700 + tabular), heading (17/600), modalTitle (16/600), cta (16/600), stat (16/500 + tabular), body (14, lh 20), action (14/600), meta (13), sectionHeader (13/700, ls 0.5), eyebrow (12/700, UPPERCASE, ls 1.5), caption (12, lh 16), micro (10/600); keep `wordmark` and `tabular` as-is
- [x] 1.2 Run `npm run typecheck` and confirm presets typecheck as `TextStyle`

## 2. Components sweep

- [x] 2.1 `components/SessionSummaryModal.tsx`: volume stat drops `type.display` for heroStat preset (system 34/700 tabular); stamp text → eyebrow; volume/counts labels → eyebrow/caption; counts → stat; button → cta
- [x] 2.2 `components/ConfirmSheet.tsx`: title 15/700 → modalTitle; message keeps lh 20 via body preset; detail → caption; buttons → action
- [x] 2.3 `components/RoutineEditor.tsx`: list titles 16/unweighted → heading; section titles 15/600 → sectionHeader; inputs 16 → stat-sized body per role table; save/delete buttons → cta/action
- [x] 2.4 `components/ExercisePickerModal.tsx`: title 16/600 → modalTitle; section titles 12/700/ls 0.5 → sectionHeader (13); item names 16/500 → heading; meta 13 → meta; search input explicit body
- [x] 2.5 `components/ExerciseEditorModal.tsx`: labels 13 → meta; inputs explicit body/stat; buttons → cta/action; footnotes → caption
- [x] 2.6 `components/AnimatedCategorySection.tsx`: section title 13/700/ls 0.5 → sectionHeader; chevron and counts → caption/meta per role
- [x] 2.7 `components/RestTimer.tsx` and `components/UndoToast.tsx`: timer numerals → stat (tabular retained); toast text → body/action
- [x] 2.8 `components/ProgressionChart.tsx`: axis labels 11 → caption (12); empty-state text → explicit body
- [x] 2.9 Run `npm run typecheck` after the components sweep

## 3. Screens sweep

- [x] 3.1 `app/(tabs)/index.tsx`: wordmark untouched; activeTitle 18/700 → heading (17/600, system); meta lines → meta; resume/start buttons default-14 → cta
- [x] 3.2 `app/(tabs)/routines.tsx`: listItemName 17 → heading; libraryLabel 13/700/ls 0.5 → sectionHeader; meta → meta; add button → cta
- [x] 3.3 `app/(tabs)/history.tsx`: listItemDate 16 → heading; meta → meta; empty state → explicit body
- [x] 3.4 `app/session/[id].tsx`: headerTitle `type.display`+700 → title preset, dead 700 stripped; exerciseName 18 → heading; chevron aligns; referenceHeader 11/700/UPPER → eyebrow; set-row numerics → stat; setRowIndex explicit; ghostLabel/chipDelta/prBadgeText → micro; note input explicit body; discard → action; complete → cta
- [x] 3.5 `app/history/[id].tsx`: title `type.display`+700 → title, dead 700 stripped; exerciseName 17 → heading (match session detail); chevron matches session detail; modal title → modalTitle; remove/delete buttons → action; notes input explicit body; empty state → explicit body
- [x] 3.6 `app/exercise/[id].tsx`: title `type.display`+700 → title, dead 700 stripped; recordValue 15 → stat; record labels 11 → caption/eyebrow per case (uppercase reference header → eyebrow); tab text → action/meta
- [x] 3.7 `app/session/new.tsx`: heading 22 → title; subheading default-14 → explicit body; list names 16 → heading; meta → meta; start button → cta
- [x] 3.8 `app/exercise/manage.tsx`: list names 16/500 → heading; meta → meta; actions → action; category sheet title → sectionHeader; categoryHint 12 → caption; buttons → cta/action; search input explicit body
- [x] 3.9 `app/(tabs)/_layout.tsx` and `app/_layout.tsx`: nav header styles conform to title role (Fraunces 600, 20); strip redundant `fontWeight` only if typing allows
- [x] 3.10 Run `npm run typecheck` after the screens sweep

## 4. Cleanup and verification

- [x] 4.1 Grep sweep: confirm no `fontSize` literal remains outside `constants/theme.ts`, no `fontWeight` on any Fraunces-styled text, no `type.display` references left; remove the unused preset
- [x] 4.2 Full visual pass on device/emulator across all 12 screens + 5 modals: titles uniform, card titles uniform, eyebrows identical, numerals tabular/system, CTAs uniform
- [x] 4.3 Run `npm run typecheck` (final) and update tasks checklist
