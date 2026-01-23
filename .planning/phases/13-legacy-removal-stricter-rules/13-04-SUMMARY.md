---
phase: 13
plan: 04
subsystem: type-system
tags: [typescript, unused-variables, strict-mode, cleanup]
dependency_graph:
  requires: []
  provides: [noUnusedLocals-ready-components, noUnusedLocals-ready-libs]
  affects: [13-05-strict-null-checks]
tech_stack:
  added: []
  patterns: [underscore-prefix-for-unused-params]
key_files:
  created: []
  modified:
    - src/components/tracking/ETACountdown.tsx
    - src/components/tracking/TrackingMap.tsx
    - src/components/ui-v8/cart/CartItemV8.tsx
    - src/components/ui-v8/cart/FlyToCart.tsx
    - src/components/ui-v8/cart/QuantitySelector.tsx
    - src/components/ui-v8/menu/EmojiPlaceholder.tsx
    - src/components/ui-v8/menu/MenuGridV8.tsx
    - src/components/ui-v8/menu/MenuItemCardV8.tsx
    - src/components/ui/AnimatedLink.tsx
    - src/components/ui/MorphingMenu.tsx
    - src/components/ui/PriceTicker.tsx
    - src/components/ui/skeleton.tsx
    - src/lib/services/route-optimization.ts
    - src/lib/utils/order.ts
    - src/lib/web-vitals.ts
decisions: []
metrics:
  duration: 5m23s
  completed: 2026-01-23
---

# Phase 13 Plan 04: TypeScript Unused Variables Summary

**One-liner:** Fixed unused React imports and variables in 15 tracking/ui-v8/ui/lib files using named imports and underscore prefix patterns.

## What Was Built

Fixed TypeScript unused variable violations in preparation for enabling `noUnusedLocals` and `noUnusedParameters` strict compiler flags.

### Task 1: Tracking and UI-V8 Components (8 files)

**Pattern A: Remove unused React imports**
Modern React (17+) with the new JSX transform doesn't require importing React for JSX. All files using `import React from 'react'` where React namespace features weren't used had the import removed.

Files fixed:
- ETACountdown.tsx - Removed React import
- TrackingMap.tsx - Removed React import
- CartItemV8.tsx - Removed React import
- QuantitySelector.tsx - Removed React import
- EmojiPlaceholder.tsx - Removed React import
- MenuItemCardV8.tsx - Removed React import

**Pattern B: Prefix unused variables**
- FlyToCart.tsx - Removed unused `containerRef` and `useGSAP` import, removed unused `flyingElement` destructure
- MenuGridV8.tsx - Prefixed `onFavoriteToggle` and `favorites` props with underscore, removed unused `ScrollTrigger` import
- MenuItemCardV8.tsx - Removed unused `hover` and `getCategoryEmoji` imports, prefixed `newState` callback param

### Task 2: UI Components and Lib Files (7 files)

**UI Components:**
- AnimatedLink.tsx - Removed React import
- MorphingMenu.tsx - Removed React import
- PriceTicker.tsx - Removed React import
- skeleton.tsx - Removed React import, cleaned stale comment

**Lib Files:**
- route-optimization.ts - Prefixed unused `routeId` parameter with underscore
- order.ts - Prefixed `subtotalCents` parameter with underscore (placeholder function)
- web-vitals.ts - Removed unused `_color` variable (dev logging used inline color)

## Verification Results

```bash
npx tsc --noUnusedLocals --noUnusedParameters --noEmit 2>&1 | grep -E "(tracking|ui-v8|ui/|lib/)" | wc -l
# Result: 0
```

All 15 target files pass TypeScript strict unused variable checks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Additional unused imports discovered**
- **Found during:** Task 1
- **Issue:** FlyToCart had unused `useGSAP` import and `flyingElement` store access; MenuItemCardV8 had unused `hover` and `getCategoryEmoji` imports; MenuGridV8 had unused `ScrollTrigger` import
- **Fix:** Removed unused imports and variables
- **Files modified:** FlyToCart.tsx, MenuItemCardV8.tsx, MenuGridV8.tsx
- **Commit:** 8372b2c

**2. [Rule 1 - Bug] Unused variable in web-vitals.ts**
- **Found during:** Task 2
- **Issue:** `_color` variable was declared but never used (inline color used in console.log instead)
- **Fix:** Removed the unused variable entirely
- **Files modified:** web-vitals.ts
- **Commit:** 5d8e367

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 8372b2c | fix(13-04): remove unused React imports and variables from tracking/ui-v8 components | 8 |
| 5d8e367 | fix(13-04): remove unused variables from ui components and lib files | 7 |

## Technical Notes

### Underscore Prefix Convention
TypeScript's `noUnusedLocals` and `noUnusedParameters` flags respect the underscore prefix convention for intentionally unused parameters. This is useful for:
- Callback parameters that are required by the interface but not used
- Placeholder parameters for future implementation
- Props passed through but not consumed directly

### React Import Pattern
With React 17+ and the new JSX transform (enabled via `"jsx": "react-jsx"` in tsconfig), the React import is only needed when:
- Using `React.FC`, `React.memo`, `React.forwardRef` etc.
- Accessing React namespace (e.g., `React.useState`)
- Files not using the new JSX transform

All our components use named imports (`{ useState, useEffect }`) so the React namespace import is unnecessary.

## Success Criteria

- [x] No unused React imports in tracking, ui-v8, ui components
- [x] All unused variables prefixed with underscore
- [x] Lib files have no unused variables
- [x] 15 files pass `npx tsc --noUnusedLocals --noUnusedParameters --noEmit`

## Next Phase Readiness

Phase 13 Plan 04 completes the unused variable cleanup. The codebase is now ready for:
- Enabling `noUnusedLocals: true` in tsconfig.json
- Enabling `noUnusedParameters: true` in tsconfig.json
- Further TypeScript strict flag enablement
