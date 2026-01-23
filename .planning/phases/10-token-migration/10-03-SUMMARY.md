---
phase: 10-token-migration
plan: 03
subsystem: design-system
tags: [z-index, tailwind, tokens, tracking, ui]
dependency-graph:
  requires: [10-01, 10-02]
  provides: [tracking-z-index-tokens, ui-z-index-tokens]
  affects: [10-04]
tech-stack:
  added: []
  patterns: [semantic-z-index-tokens, token-import-pattern]
file-tracking:
  created: []
  modified:
    - src/components/tracking/TrackingMap.tsx
    - src/components/tracking/TrackingPageClient.tsx
    - src/components/tracking/DeliveryMap.tsx
    - src/components/tracking/PushToast.tsx
    - src/components/ui/Carousel.tsx
    - src/components/ui/TabSwitcher.tsx
    - src/components/ui/overlay-base.tsx
    - src/components/ui/Modal.tsx
    - src/components/ui-v8/scroll/ParallaxLayer.tsx
decisions: []
metrics:
  duration: 3m 26s
  completed: 2026-01-23
---

# Phase 10 Plan 03: Tracking and UI Component Z-Index Migration Summary

**One-liner:** Migrated 9 tracking/UI components from hardcoded z-10/z-20 to semantic z-dropdown/z-sticky tokens, plus zIndex.max/modal tokens for dynamic calculations.

## What Was Built

### Task 1: Tracking Component Migrations

| File | Changes | Token Used |
|------|---------|------------|
| TrackingMap.tsx | 3 z-10 -> z-dropdown | z-dropdown |
| TrackingPageClient.tsx | 1 z-20 -> z-sticky | z-sticky |
| DeliveryMap.tsx | 4 z-10 -> z-dropdown | z-dropdown |
| PushToast.tsx | Add import, 100 -> zIndex.max | zIndex.max |

**PushToast Pattern:**
```tsx
// Before
style={{ zIndex: 100 - index }}

// After
import { zIndex } from "@/design-system/tokens/z-index";
style={{ zIndex: zIndex.max - index }}
```

### Task 2: UI Component Migrations

| File | Changes | Token Used |
|------|---------|------------|
| Carousel.tsx | 1 z-10 -> z-dropdown | z-dropdown |
| TabSwitcher.tsx | 7 z-10 -> z-dropdown | z-dropdown |
| overlay-base.tsx | 1 z-10 -> z-dropdown | z-dropdown |
| Modal.tsx | Import tokens, use zIndexTokens.modal | zIndexTokens.modal |
| ParallaxLayer.tsx | JSDoc example update | z-dropdown |

**Modal Pattern:**
```tsx
// Before
const zIndex = 50 + stackLevel * 10;

// After
import { zIndex as zIndexTokens } from "@/design-system/tokens/z-index";
const modalZIndex = zIndexTokens.modal + stackLevel * 10;
```

## Commits

| Hash | Message |
|------|---------|
| 0ee2a9a | feat(10-03): migrate tracking components to z-index tokens |
| a6a926e | feat(10-03): migrate UI components to z-index tokens |

## Deviations from Plan

### Minor Deviations

**1. TabSwitcher had 7 locations instead of 6**
- Plan estimated 6 z-10 replacements
- Actual count was 7 (one additional fade indicator)
- All replaced successfully

**2. ParallaxLayer.tsx had no z-10 in code**
- Plan listed this file for migration
- Only z-10 found was in JSDoc example comment
- Updated for documentation consistency

## Verification Results

All verifications passed:
- No z-10/z-20 remaining in migrated files
- PushToast.tsx imports and uses zIndex.max token
- Modal.tsx imports and uses zIndexTokens.modal token
- TabSwitcher has 7 z-dropdown instances
- ESLint z-index warnings: 0

## Key Files

**Token source:** `src/design-system/tokens/z-index.ts`
- Provides `zIndex.dropdown = 10`, `zIndex.sticky = 20`, `zIndex.modal = 50`, `zIndex.max = 100`
- Tailwind classes: z-dropdown, z-sticky, z-modal, z-max

**Modified tracking components:**
- `src/components/tracking/TrackingMap.tsx` - Map overlays (live indicator, fullscreen toggle, legend)
- `src/components/tracking/TrackingPageClient.tsx` - Sticky header
- `src/components/tracking/DeliveryMap.tsx` - Map overlays (same pattern as TrackingMap)
- `src/components/tracking/PushToast.tsx` - Toast stacking with zIndex.max - index

**Modified UI components:**
- `src/components/ui/Carousel.tsx` - Navigation arrows
- `src/components/ui/TabSwitcher.tsx` - Fade indicators, sticky tabs, tab content
- `src/components/ui/overlay-base.tsx` - Close button
- `src/components/ui/Modal.tsx` - Nested modal stacking calculation

## Next Phase Readiness

Plan 10-04 can proceed. Remaining z-index migrations are in:
- Landing/layout components (10-04 scope)
- Footer gradient exception noted in must_haves

All tracking and UI components now use semantic z-index tokens.
