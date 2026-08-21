## Context

`app/history/[id].tsx` renders a screen header block (lines 273–289) containing an in-body title (`session.routine_name ?? 'Ad-hoc'`) and a meta line, alongside a nav header whose title is set via `navigation.setOptions` (`detail.routine_name ?? 'Past session'`). The meta line concatenates start date, a conditional "completed <date>" segment, and a conditional duration. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- Single source of truth for the routine name: the nav header.
- Meta line reduced to `date · duration` (duration only when the session is completed).
- The remaining date · duration line styled so the header row doesn't read as empty.

**Non-Goals:**

- Changing the nav header itself, the Edit button, or the Delete button placement.
- Showing a completion *time* (e.g. "completed 9:41pm") — dropped entirely, not reformatted.
- Touching the history list screen or the session detail (active session) screen.

## Decisions

**1. Nav header is the surviving title.** The nav header already exists, scrolls out of view naturally, and is where the platform expects the screen title. Alternative — keep the in-body title and blank the nav header — rejected: it wastes the always-visible nav slot and keeps the larger layout block.

**2. Fallback unified to "Ad-hoc".** The history list (`app/(tabs)/history.tsx:47`) and the in-body title both use "Ad-hoc"; only the nav fallback says "Past session". Since the nav title becomes the sole display, it adopts the list's vocabulary.

**3. Date shown once; completion-date segment removed unconditionally.** Sessions start and complete the same day in practice, so the "completed <date>" segment is dropped rather than made conditional on a cross-midnight session. Cross-midnight sessions still communicate their span via the duration.

**4. Promote the line to `type.heading` in `colors.ink`, rename style `meta` → `headerDate`.** Matches the history list's date rows (`listItemDate`), so date-primary lines look identical across the two screens. Alternative — keep `type.meta` — rejected per user preference: the row reads as secondary/empty next to the Delete button.

## Risks / Trade-offs

- [Routine name not visible while scrolled deep into a long session] → The nav header is sticky, so this is actually an improvement over the in-body title.
- [Long routine names truncate in the nav header earlier than the in-body title did] → Native nav title truncation is standard platform behavior; acceptable.
- [Cross-midnight session shows a duration that implies a different day than the single date] → Rare in practice; the duration still disambiguates.

## Migration Plan

Single-file presentational edit in `app/history/[id].tsx`; no data or schema changes. Rollback is reverting the file.
