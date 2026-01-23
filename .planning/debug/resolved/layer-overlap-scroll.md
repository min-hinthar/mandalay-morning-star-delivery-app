---
status: resolved
trigger: "Header and navigation are being overlapped by content/components when scrolling pages"
created: 2026-01-23T10:00:00Z
updated: 2026-01-23T10:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple components incorrectly used z-fixed (30) when they should use z-sticky (20)
test: Applied z-index corrections
expecting: Header (z-fixed:30) now stays above sticky elements (z-sticky:20)
next_action: COMPLETE

## Symptoms

expected: Header (fixed, z-fixed:30) and nav should stay on top during scroll
actual: Content and components overlap the header/nav when scrolling
errors: None reported
reproduction: Scroll on pages, sticky elements overlap header
started: Recent issue - layering system has z-index tokens but overlap persists

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-01-23T10:00:00Z
  checked: src/design-system/tokens/z-index.ts
  found: Z-index hierarchy is z-base:0, z-dropdown:10, z-sticky:20, z-fixed:30, z-modal-backdrop:40, z-modal:50, z-toast:80
  implication: Hierarchy is correct, issue is misuse of tokens

- timestamp: 2026-01-23T10:01:00Z
  checked: src/components/ui-v8/navigation/Header.tsx (line 184)
  found: Uses `zClass.fixed` correctly - it's a fixed element at top-0
  implication: Header is correctly configured

- timestamp: 2026-01-23T10:02:00Z
  checked: src/components/menu/CategoryCarousel.tsx (line 224)
  found: Uses `sticky top-14 z-fixed` - WRONG! Sticky element with z-fixed (30)
  implication: Same z-index as Header causes overlap during scroll

- timestamp: 2026-01-23T10:03:00Z
  checked: src/components/menu/MenuLayout.tsx (line 457)
  found: Uses `sticky top-0 z-sticky` - correct for sticky element
  implication: This component is correctly configured

- timestamp: 2026-01-23T10:04:00Z
  checked: src/components/driver/OfflineBanner.tsx (line 34)
  found: Uses `fixed left-0 right-0 top-0 z-fixed` - competes with Header at same position and z-index
  implication: Critical status banner should have higher z-index to stay visible

- timestamp: 2026-01-23T10:05:00Z
  checked: src/components/driver/DriverHeader.tsx (line 44)
  found: Uses `sticky top-0 z-fixed` - WRONG! Sticky element with z-fixed (30)
  implication: Same z-index as main Header is incorrect for sticky element

## Resolution

root_cause: Three components misuse z-index tokens:
1. CategoryCarousel: sticky element uses z-fixed (30) instead of z-sticky (20)
2. DriverHeader: sticky element uses z-fixed (30) instead of z-sticky (20)
3. OfflineBanner: fixed banner competes with Header at same z-index; needs higher z-index (z-toast: 80) for critical visibility

fix:
1. CategoryCarousel.tsx line 224: Changed `z-fixed` to `z-sticky`
2. DriverHeader.tsx line 44: Changed `z-fixed` to `z-sticky`
3. OfflineBanner.tsx line 34: Changed `z-fixed` to `z-toast`

verification:
- Grep verified all three changes applied correctly
- Z-index hierarchy now correct: sticky(20) < fixed(30) < toast(80)
- Header (z-fixed:30) will stay above CategoryCarousel/DriverHeader (z-sticky:20)
- OfflineBanner (z-toast:80) will stay visible above all for critical status

files_changed:
- src/components/menu/CategoryCarousel.tsx
- src/components/driver/DriverHeader.tsx
- src/components/driver/OfflineBanner.tsx
