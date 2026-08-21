## 1. Remove header entry points

- [x] 1.1 In `app/(tabs)/_layout.tsx`, delete the `ManageHeaderButton` component and both `headerRight` options from the Sessions and Routines `Tabs.Screen` configs
- [x] 1.2 In `app/exercise/manage.tsx`, change the `navigation.setOptions` title from "Manage exercises" to "Exercise library"

## 2. Fixed Exercise library strip on Routines tab (revises the rejected ListFooterComponent row)

- [x] 2.1 In `app/(tabs)/routines.tsx`, remove the `ListFooterComponent` row and instead render a fixed strip as a sibling `<View>` below the FlatList (list keeps `flex: 1`): pressable "Exercise library" + `›` chevron pushing `/exercise/manage`, styled with the section-header grammar (`paperDeep` background, 13px/700/`inkSoft`, `letterSpacing: 0.5`, top border)
- [x] 2.2 Raise the FAB (`bottom: 16 → 68`) so it floats clear of the strip

## 3. Contextual Manage entry in the exercise picker

- [x] 3.1 In `components/ExercisePickerModal.tsx`, add a "Manage" pressable to the modal header right side (before "+ New", `inkSoft` regular weight): on tap, close the picker then push `/exercise/manage`

## 4. Verification

- [x] 4.1 Run `npm run typecheck` (WSL-safe) and fix any errors
- [x] 4.2 Manual check from PowerShell/Expo: strip visible below list with routines and in empty state; strip never scrolls away with long lists; FAB floats above strip; picker "Manage" closes picker and opens screen titled "Exercise library"; Sessions/History headers show no "Manage"
