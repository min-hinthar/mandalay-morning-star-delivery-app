---
phase: 26-component-consolidation
plan: 06
completed: 2026-01-27
duration: ~20min
subsystem: components
tags: [migration, navigation, scroll, transitions]

dependency-graph:
  requires: ["26-02", "26-03"]
  provides: ["ui/navigation", "ui/scroll", "ui/transitions"]
  affects: ["26-07", "26-08"]

tech-stack:
  patterns:
    - barrel-exports
    - backwards-compatibility-re-exports

key-files:
  created:
    - src/components/ui/navigation/
    - src/components/ui/scroll/
    - src/components/ui/transitions/
  modified:
    - src/components/ui-v8/transitions/index.ts

decisions:
  - key: "drawer-position-prop"
    choice: "Use position prop instead of side"
    reason: "Unified Drawer component uses position for left/right/bottom"

metrics:
  tasks-completed: 3/3
  commits: 5
  files-moved: 10
  files-created: 3
---

# Phase 26 Plan 06: Navigation, Scroll, and Transitions Migration Summary

Navigation, scroll, and transition components migrated from ui-v8/ to ui/.

## One-liner

Navigation/scroll/transitions migrated to ui/ with PageTransition renamed (V8 suffix removed).

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 93b2dac | feat | migrate navigation components to ui/ |
| adc587c | feat | migrate scroll components to ui/ |
| 08853f4 | feat | rename PageTransitionV8 to PageTransition |
| e175b33 | fix | update MobileMenu Drawer prop (side -> position) |
| 8d026c6 | chore | add backwards compat re-exports for transitions |

## Tasks Completed

### Task 1: Migrate navigation components
- Moved 5 components: AppShell, BottomNav, Header, MobileMenu, PageContainer
- Updated MobileMenu to import Drawer from `@/components/ui`
- Preserved existing barrel export structure

### Task 2: Migrate scroll components
- Moved 3 components: ParallaxLayer, RevealOnScroll, ScrollChoreographer
- Updated comment in index.ts to reference new path
- No import changes needed (uses @/lib/gsap)

### Task 3: Migrate transitions and rename PageTransitionV8
- Moved and renamed PageTransitionV8.tsx to PageTransition.tsx
- Renamed interface PageTransitionV8Props -> PageTransitionProps
- Renamed function export PageTransitionV8 -> PageTransition
- Created new barrel export

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed MobileMenu Drawer prop name**
- **Found during:** Task 1 verification (TypeScript check)
- **Issue:** MobileMenu used `side="left"` prop but unified Drawer uses `position` prop
- **Fix:** Changed `side="left"` to `position="left"`
- **Files modified:** src/components/ui/navigation/MobileMenu.tsx
- **Commit:** e175b33

**2. [Rule 3 - Blocking] Added backwards compatibility for transitions**
- **Found during:** TypeScript check
- **Issue:** ui-v8/transitions/index.ts referenced moved PageTransitionV8.tsx
- **Fix:** Updated to re-export from new ui/transitions location with aliases for backwards compat
- **Files modified:** src/components/ui-v8/transitions/index.ts
- **Commit:** 8d026c6

## Verification Results

```
Navigation: 5 components + index.ts
Scroll: 3 components + index.ts
Transitions: PageTransition.tsx + index.ts
No ui-v8 imports in migrated files
No PageTransitionV8 references in ui/transitions/
MobileMenu imports Drawer from @/components/ui
```

## Files Changed

### Created
- src/components/ui/navigation/AppShell.tsx
- src/components/ui/navigation/BottomNav.tsx
- src/components/ui/navigation/Header.tsx
- src/components/ui/navigation/MobileMenu.tsx
- src/components/ui/navigation/PageContainer.tsx
- src/components/ui/navigation/index.ts
- src/components/ui/scroll/ParallaxLayer.tsx
- src/components/ui/scroll/RevealOnScroll.tsx
- src/components/ui/scroll/ScrollChoreographer.tsx
- src/components/ui/scroll/index.ts
- src/components/ui/transitions/PageTransition.tsx
- src/components/ui/transitions/index.ts

### Deleted (via git mv)
- src/components/ui-v8/navigation/* (all files)
- src/components/ui-v8/scroll/* (all files)
- src/components/ui-v8/transitions/PageTransitionV8.tsx

### Modified
- src/components/ui-v8/transitions/index.ts (backwards compat re-exports)

## Known Issues

TypeScript errors exist in the codebase from incomplete menu migration (plan 26-04/26-05):
- ui-v8/menu components referenced but files in working directory
- These are NOT from this plan and should be addressed by menu migration plan

## Next Phase Readiness

Ready for plan 26-07 (menu migration) or 26-08 (final cleanup).
The ui-v8 directories for navigation and scroll are now empty.
Transitions directory has only backwards-compat index.ts remaining.
