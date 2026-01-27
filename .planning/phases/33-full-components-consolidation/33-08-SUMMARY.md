---
phase: 33-full-components-consolidation
plan: 08
subsystem: ui
tags: [components, tracking, auth, onboarding, mascot, brand, consolidation]

# Dependency graph
requires:
  - phase: 33-05
    provides: Layout directory cleanup
  - phase: 33-06
    provides: Clean components root
provides:
  - Tracking components at ui/orders/tracking/
  - Auth + onboarding components at ui/auth/
  - Brand mascot at ui/brand/
affects: [future component imports, ui barrel exports]

# Tech tracking
tech-stack:
  added: []
  patterns: [feature subdirectories under ui/, barrel exports per feature]

key-files:
  created:
    - src/components/ui/orders/tracking/index.ts
    - src/components/ui/auth/ (moved from auth/)
    - src/components/ui/brand/index.ts
  modified:
    - src/components/ui/index.ts
    - src/app/(auth)/**/page.tsx
    - src/components/ui/homepage/Hero.tsx

key-decisions:
  - "Tracking components in tracking/ subdirectory under orders/"
  - "OnboardingTour merged into auth/ as it's auth-related flow"
  - "BrandMascot in brand/ for future brand expansion"

patterns-established:
  - "Feature components in ui/{feature}/ subdirectories"
  - "Barrel exports re-export from main ui/index.ts"

# Metrics
duration: 25min
completed: 2026-01-27
---

# Phase 33 Plan 08: Related Components Merge Summary

**Merged tracking into ui/orders/, auth+onboarding into ui/auth/, and mascot into ui/brand/**

## Performance

- **Duration:** 25 min
- **Started:** 2026-01-27T22:54:00Z
- **Completed:** 2026-01-27T23:19:00Z
- **Tasks:** 3
- **Files modified:** 25

## Accomplishments

- Tracking components (8 files) organized under ui/orders/tracking/
- Auth components (11 files including tests) moved to ui/auth/
- OnboardingTour merged into ui/auth/ per CONTEXT.md decision
- BrandMascot placed in new ui/brand/ directory
- Old tracking/, onboarding/, mascot/, auth/ directories removed from components root

## Task Commits

Each task was committed atomically:

1. **Task 1: Merge tracking/ into ui/orders/** - `b02e211` (fix) - Delete old tracking/index.ts (actual move was in 33-07)
2. **Task 2: Move auth/ and merge onboarding/ into ui/auth/** - `ee39147` (feat)
3. **Task 3: Create ui/brand/ with mascot** - `18b9b26` (feat)

## Files Created/Modified

**Created:**
- `src/components/ui/orders/tracking/index.ts` - Tracking barrel export
- `src/components/ui/auth/` - Auth components directory (moved)
- `src/components/ui/brand/index.ts` - Brand barrel export

**Modified:**
- `src/components/ui/index.ts` - Added auth, brand re-exports
- `src/components/ui/auth/index.ts` - Added OnboardingTour export
- `src/app/(auth)/login/page.tsx` - Updated import path
- `src/app/(auth)/signup/page.tsx` - Updated import path
- `src/app/(auth)/forgot-password/page.tsx` - Updated import path
- `src/app/auth/reset-password/page.tsx` - Updated import path
- `src/components/ui/homepage/Hero.tsx` - Updated mascot import path

**Deleted:**
- `src/components/tracking/` - Moved to ui/orders/tracking/
- `src/components/onboarding/` - Merged into ui/auth/
- `src/components/mascot/` - Moved to ui/brand/
- `src/components/auth/` - Moved to ui/auth/

## Decisions Made

- **Tracking in subdirectory:** Kept tracking components in a `tracking/` subdirectory under `orders/` to maintain organization and allow orders/ to hold other order-related components
- **OnboardingTour in auth:** Merged onboarding into auth since the tour is part of auth flow (per CONTEXT.md)
- **Brand directory:** Created ui/brand/ for mascot with room for future brand components

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tracking/ move was already done in 33-07**
- **Found during:** Task 1 (Merge tracking/)
- **Issue:** Plan 33-07 commit already included tracking/ -> ui/orders/tracking/ move, but old tracking/index.ts wasn't deleted
- **Fix:** Deleted the orphaned tracking/index.ts file
- **Files modified:** src/components/tracking/index.ts (deleted)
- **Verification:** Directory no longer exists, typecheck passes
- **Committed in:** b02e211

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor cleanup of prior plan's incomplete deletion. No scope creep.

## Issues Encountered

- File linter kept reverting import changes during execution - required re-applying edits
- git mv command to non-existent directory failed silently - had to mkdir first
- .next directory locked preventing build verification - typecheck used instead

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All related components now consolidated under ui/
- tracking/, onboarding/, mascot/, auth/ directories removed from components root
- Ready for cleanup verification and next phase

---
*Phase: 33-full-components-consolidation*
*Completed: 2026-01-27*
