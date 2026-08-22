## Context

`ExercisePickerModal` is a shared component with three call sites (routine editor, live session, history editor). It already carries an `autoCloseOnSelect` prop that exactly distinguishes the two modes: `false` only in the routine editor (multi-select, picks applied live via `onSelect`), `true` elsewhere (tap-a-row closes). The header currently renders `Cancel | "Add exercise" | Manage + New`; `Manage` calls `handleManage` which closes the modal and pushes `/exercise/manage` over the host screen.

## Goals / Non-Goals

**Goals:**

- Picker header that is honest in both modes with a single shared component.
- Exercise management reachable only from its established home (Routines tab strip).

**Non-Goals:**

- No change to multi-select *behavior* — picks remain live-applied; we are not introducing staged/commit semantics.
- No change to the `+ New` inline create flow, search, or the manage screen itself.
- No visual redesign beyond the two header changes.

## Decisions

**Derive the label from `autoCloseOnSelect` rather than adding a new prop.**
The prop already encodes exactly the distinction we need: `autoCloseOnSelect === false` ⇔ picks apply live ⇔ exit is a confirmation ("Done"). A new `exitLabel`/`showManage` prop pair would duplicate state that already exists and invite inconsistent combinations (e.g. `autoCloseOnSelect: false` with label "Cancel" — the very bug being fixed). Alternative considered: always show "Done" — rejected because in single-select mode exiting without a pick genuinely cancels, and "Done" would be equally dishonest there.

**Delete `Manage` outright rather than hide it behind a flag.**
All three call sites share the one component, and the user decision is that Manage belongs nowhere in the picker — the Routines tab strip is the single entry point. A `showManage` prop would preserve dead code and an escape hatch we don't want. Deletion also removes the component's last `useRouter` usage and its `modalManage` style.

## Risks / Trade-offs

- [Longer path to edit an exercise mid-routine-build] → Accepted by product decision; the walk is Done → back → Routines → Exercise library. The `+ New` affordance still covers the common "exercise is missing" case inline.
- [Android back-gesture exit in multi-select mode is unlabeled] → No mitigation needed: behavior is identical to "Done" (picks kept); back is routed through the same `onRequestClose` path.
- [Users who relied on picker→Manage muscle memory] → Small app, single user; the Routines tab strip is already established as the library entry point.
