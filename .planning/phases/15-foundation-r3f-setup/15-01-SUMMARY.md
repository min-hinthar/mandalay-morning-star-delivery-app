---
phase: 15-foundation-r3f-setup
plan: 01
subsystem: ui
tags: [tailwindcss, z-index, stacking-context, tokens, design-system]

# Dependency graph
requires:
  - phase: 09-design-tokens
    provides: zClass token system in design-system/tokens/z-index.ts
provides:
  - Z-index token migration for overlay components
  - Fixed signout button click blocking (INFRA-02)
  - Correct stacking context for dropdowns, autocomplete, admin menu
affects: [16-3d-hero, 17-menu-components, 18-checkout-ux]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "zClass.popover for dropdown/autocomplete escaping parent stacking context"
    - "zClass.modalBackdrop for invisible click-capture layers behind dropdowns"
    - "Preserve z-10 for intra-component layering (button inside modal)"

key-files:
  modified:
    - src/components/ui/dropdown-menu.tsx
    - src/components/ui-v8/menu/SearchAutocomplete.tsx
    - src/components/layouts/AdminLayout.tsx

key-decisions:
  - "Use z-[60] (zClass.popover) for dropdowns to escape fixed header z-30 stacking context"
  - "Preserve z-10 for elements positioned within containers (close buttons in modals)"

patterns-established:
  - "Overlay escape pattern: Use zClass.popover when dropdown needs to escape parent stacking context"
  - "Intra-component layering: Keep z-10 for elements that layer within their container"

# Metrics
duration: 15min
completed: 2026-01-23
---

# Phase 15 Plan 01: Z-Index Token Migration Summary

**Migrated overlay components from hardcoded z-10 to zClass tokens, fixing signout button click blocking and ensuring correct stacking context layering**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-01-23T15:30:00Z
- **Completed:** 2026-01-23T15:45:00Z
- **Tasks:** 3
- **Files modified:** 11 (3 z-index fixes + 8 blocking type fixes)

## Accomplishments

- Fixed dropdown-menu.tsx using zClass.popover instead of z-10
- Migrated SearchAutocomplete dropdown to use zClass.popover
- Fixed AdminLayout user dropdown with proper zClass.modalBackdrop and zClass.popover
- Resolved blocking TypeScript polymorphic component type errors to enable build

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix dropdown-menu.tsx z-index** - `cb75148` (fix)
2. **Task 2: Migrate remaining hardcoded z-index values** - `b9a6753` (fix)
3. **Task 3: Verify z-index fix and build** - `7b00628` (fix - included blocking type fixes)

## Files Created/Modified

### Z-Index Migrations (Plan Scope)
- `src/components/ui/dropdown-menu.tsx` - Added zClass import, replaced z-10 with zClass.popover
- `src/components/ui-v8/menu/SearchAutocomplete.tsx` - Added zClass import, replaced z-10 with zClass.popover
- `src/components/layouts/AdminLayout.tsx` - Added zClass import, replaced backdrop z-10 with zClass.modalBackdrop, menu z-10 with zClass.popover

### Blocking Type Fixes (Deviation Rule 3)
- `src/components/admin/analytics/ExceptionBreakdown.tsx` - Fixed LucideIcon type for icon prop
- `src/components/ui/badge.tsx` - Fixed LucideIcon type for icon props
- `src/components/layouts/Cluster.tsx` - Fixed polymorphic component as prop types
- `src/components/layouts/Container.tsx` - Fixed polymorphic component as prop types
- `src/components/layouts/Grid.tsx` - Fixed polymorphic component as prop types
- `src/components/layouts/SafeArea.tsx` - Fixed polymorphic component as prop types
- `src/components/layouts/Stack.tsx` - Fixed polymorphic component as prop types
- `src/components/ui-v8/navigation/PageContainer.tsx` - Fixed polymorphic component TypeScript errors

## Decisions Made

- **Decision rule for z-index migration:** If z-index positions element WITHIN a container (button inside modal) keep z-10; if z-index positions element to ESCAPE parent stacking context (dropdown, autocomplete) use zClass token
- **Preserved z-10 in Modal.tsx and overlay-base.tsx** for close buttons that layer within their containers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ExceptionBreakdown.tsx LucideIcon type**
- **Found during:** Task 3 (build verification)
- **Issue:** `icon: React.ElementType` caused TypeScript error when passing className to Icon component
- **Fix:** Changed to `icon: LucideIcon` type from lucide-react
- **Files modified:** src/components/admin/analytics/ExceptionBreakdown.tsx
- **Verification:** Build passes
- **Committed in:** 7b00628 (Task 3 commit)

**2. [Rule 3 - Blocking] Fixed polymorphic component type errors in layout components**
- **Found during:** Task 3 (build verification)
- **Issue:** `as: Component = "div"` pattern caused TypeScript 'never' type errors in Cluster, Container, Grid, SafeArea, Stack, PageContainer
- **Fix:** Changed pattern to `as = "div"` with `const Component = as as "div"` and cast ref types
- **Files modified:** 6 layout component files
- **Verification:** Build passes
- **Committed in:** 7b00628 (Task 3 commit)

**3. [Rule 3 - Blocking] Fixed badge.tsx LucideIcon type**
- **Found during:** Task 3 (build verification)
- **Issue:** `icon?: React.ElementType` caused TypeScript error
- **Fix:** Changed to `icon?: LucideIcon`
- **Files modified:** src/components/ui/badge.tsx
- **Verification:** Build passes
- **Committed in:** 7b00628 (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking)
**Impact on plan:** All auto-fixes necessary for build to pass. No scope creep - these were pre-existing type issues exposed by the build verification step.

## Issues Encountered

- CSS optimization warnings about invalid CSS syntax in z-index variables (z-[var(--z-...)]). These are harmless warnings from unused/malformed class references in the codebase, not related to this plan's changes.
- Initial Turbopack junction point error on Windows - resolved by clearing .next folder

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Z-index layering system now consistent across overlay components
- Signout button should now be clickable (INFRA-02 resolved)
- Ready for 15-02 (R3F package setup) which was already completed in parallel
- Next: Phase 16 (3D Hero Scene) can proceed with proper stacking context

---
*Phase: 15-foundation-r3f-setup*
*Completed: 2026-01-23*
