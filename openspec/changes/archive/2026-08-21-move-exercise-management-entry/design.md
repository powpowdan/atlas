## Context

The exercise management screen (`app/exercise/manage.tsx`) is currently reached only via a "Manage" `headerRight` button defined in `app/(tabs)/_layout.tsx` and mounted on both the Sessions and Routines tabs. The Routines tab (`app/(tabs)/routines.tsx`) renders a `FlatList` of routines with a `ListEmptyComponent` (logo + "Create your first routine") and a FAB for new routines. Historically the entry point lived inside the routines list content and disappeared behind the empty state — the header button was the fix; this change replaces it with a fixed strip outside the list that survives every list state, plus a contextual entry in the picker modal.

## Goals / Non-Goals

**Goals:**

- Exercise management reachable from the Routines tab in all states (routines exist / empty state), always visible without scrolling
- A contextual management entry at the moment of exercise selection (picker modal)
- Free the header-right slot on both tabs
- Entry label and screen title both read "Exercise library"

**Non-Goals:**

- Any change to the management screen's behavior (filter, create/edit/archive/restore)
- Any change to the picker's selection/search behavior (header gains a "Manage" action only)
- A Sessions-tab header replacement entry point

## Decisions

**Entry point as a fixed strip below the routines list, not inside it.**
The first implementation used `ListFooterComponent`; it failed two ways: the row scrolled with list content (buried under long routine lists — "pinned" was not actually pinned) and adopted list-item styling (camouflaged as a routine). Revised approach: the strip is a sibling `<View>` rendered after the FlatList (list keeps `flex: 1`), so it never scrolls and is structurally distinct from content.

Earlier alternatives, still rejected:
- *Segmented control within the tab* — FAB semantics become ambiguous (new routine vs new exercise); overkill for a low-frequency destination.
- *Header button, Routines only* — still permanently occupies the header, which is the thing being removed.

**Strip styling: the app's section-header grammar.** The manage screen and picker already render category headers as `paperDeep` background, 13px, weight 700, `letterSpacing: 0.5`, `inkSoft` — the established visual signal for "structure", not "content". The strip reuses that grammar ("Exercise library" + `›` chevron in `textTertiary`), so it can't read as a routine row.

**FAB raised (`bottom: 16 → 68`).** The FAB is positioned against the screen container; with the strip occupying the bottom ~47px, `bottom: 68` floats the FAB clear above it.

**Contextual "Manage" in the picker modal header** (right side, alongside "+ New", styled quieter — `inkSoft`, regular weight — to keep "+ New" the primary action). This covers the moment management is actually wanted ("this exercise is named wrong / missing") and indirectly restores a management path from the Sessions tab (start session → add exercise → Manage). Activation closes the picker before pushing `/exercise/manage`: pushing a screen while a full-screen RN `Modal` is open renders underneath the modal on both platforms, so close-then-push is the only predictable ordering. Back-navigation returns to the pre-picker screen.

**Screen title updated to "Exercise library"** via the existing `navigation.setOptions` in `app/exercise/manage.tsx`. Keeps strip label and pushed-screen title identical.

**Delete `ManageHeaderButton` entirely** rather than keeping it unused — no other route links to `/exercise/manage`, so the component is dead code once removed.

## Risks / Trade-offs

- [Sessions tab has no header-level path to exercise management] → Accepted: the picker's "Manage" covers the in-session moment, and the Routines strip covers library tidying.
- [Strip consumes ~47px of permanent vertical space on the Routines tab] → Accepted: the price of always-visible; the list retains `flex: 1`.
- [Picker header grows to Cancel | title | Manage + New] → Accepted: 16px gap and quieter Manage styling keep the hierarchy readable; modal header already has room.
