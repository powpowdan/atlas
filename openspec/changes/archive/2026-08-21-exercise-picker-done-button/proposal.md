## Why

The exercise picker's header is dishonest and disruptive. In the routine editor's multi-select mode, tapping rows applies picks immediately, so the only explicit exit is a button labeled "Cancel" that cancels nothing — users must exit through a door labeled "wrong way" (or swipe-dismiss). The "Manage" action compounds this: it closes the picker and navigates on top of the host screen, pulling users out of mid-edit flows. Exercise management already has a permanent home on the Routines tab.

## What Changes

- Remove the "Manage" action from the exercise picker modal header in all contexts (routine editor, live session, history editor). Library management is reachable only from the Routines tab's "Exercise library" strip.
- Relabel the picker's left header button from "Cancel" to "Done" in multi-select mode (`autoCloseOnSelect === false`, i.e. the routine editor flow), since selections are applied live and exiting is a confirmation, not an abort.
- Keep "Cancel" in single-select mode (session/history flows), where tap-a-row closes the modal and exiting without picking genuinely is a cancellation.
- Keep the "+ New" inline create affordance unchanged.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `exercises`: Removes the "Contextual entry point from the exercise picker" requirement (Manage action in picker header). Adds a requirement that the picker's exit control label reflects its selection mode: "Done" for multi-select pickers whose selections apply live, "Cancel" for single-select pickers.

## Impact

- `components/ExercisePickerModal.tsx`: delete `handleManage`, the Manage `Pressable`, `modalManage` style, and the now-unused `useRouter` import; derive left-button label from `autoCloseOnSelect`.
- No data, storage, or navigation-route changes. `/exercise/manage` remains routed and reachable from the Routines tab strip.
- Cost accepted by design: editing an exercise mid-routine-edit now requires backing out to Routines → Exercise library instead of one tap from the picker.
