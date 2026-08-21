## 1. Dependency

- [x] 1.1 User installs `react-native-reanimated` from PowerShell (`npm install react-native-reanimated`); verify no Babel plugin warning on Metro start, add `'react-native-reanimated/plugin'` to `babel.config.js` only if warned

## 2. Animated section component

- [x] 2.1 Extract a shared `AnimatedCategorySection` component (header + animated body) in `app/exercise/manage.tsx` (or colocated file): header tap toggles; body is `Animated.View` with `height` animating 0 ↔ measured content height via `withTiming` (~200ms easeOut), `overflow: 'hidden'`; inner content view reports height via `onLayout`
- [x] 2.2 Rotate the chevron glyph (`▸`) 0°→90° with the same timing as the height animation (single glyph, no character swap)

## 3. Screen restructure

- [x] 3.1 Replace the manage screen's `SectionList` with a `ScrollView` mapping sections through `AnimatedCategorySection`; sections derive from the same `byCategory`/`sortCategories` pipeline; keep toolbar, filter toggle, empty state, and all row actions unchanged
- [x] 3.2 Confirm both Active and Archived filters render through the same component and animate identically; keep the web "⋯" and long-press category actions on headers working

## 4. Reveal on create

- [x] 4.1 Track each section header's y-offset via `onLayout` into a `Map<string, number>` (reset when the filter changes)
- [x] 4.2 In `handleSaved`, expand the saved exercise's category and scroll the ScrollView to its header (post-commit via rAF/effect, small top margin); verify both the collapsed→expanded and already-expanded cases land the new row on screen

## 5. Verification

- [x] 5.1 Run `npm run typecheck` (WSL-safe) and fix any errors
- [x] 5.2 Manual smoke from PowerShell (`npx expo start`): tap-toggling animates open and closed under both filters; chevron rotates; create an exercise in a collapsed category → section expands and scrolls to reveal it; leave and re-enter the screen → all sections collapsed; editor open/close preserves expansion
