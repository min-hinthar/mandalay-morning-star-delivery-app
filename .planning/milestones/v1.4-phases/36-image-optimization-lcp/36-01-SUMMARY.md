---
phase: 36-image-optimization-lcp
plan: 01
subsystem: ui
tags: [next.js, image-optimization, performance, lcp]

# Dependency graph
requires:
  - phase: 35.1-admin-photo-upload
    provides: Image optimization utilities and IMAGE_SIZES constants
provides:
  - Next.js 16 qualities configuration for image optimization
  - Quality 70 default for menu images (30% smaller files)
  - Quality 85 option for hero images (LCP optimization)
affects: [36-02-hero-lcp, menu-images, featured-sections]

# Tech tracking
tech-stack:
  added: []
  patterns: [quality-70-default, hero-85-override]

key-files:
  created: []
  modified:
    - next.config.ts
    - src/lib/utils/image-optimization.ts

key-decisions:
  - "Quality 70 as default for menu images (visual quality maintained, ~30% smaller files)"
  - "Quality 85 available for hero images where quality matters more"
  - "Qualities array required for Next.js 16 compatibility"

patterns-established:
  - "Quality 70 default: All non-hero images use quality 70"
  - "Hero override: Use quality: 85 for hero/LCP images"

# Metrics
duration: 3min
completed: 2026-02-01
---

# Phase 36 Plan 01: Image Optimization Config Summary

**Next.js 16 qualities array [70, 85] configured with quality 70 default for menu images**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-01
- **Completed:** 2026-02-01
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added `qualities: [70, 85]` to next.config.ts for Next.js 16 compatibility
- Updated getImageProps default quality from 85 to 70 for smaller file sizes
- Added JSDoc documentation explaining quality choice
- All verification passed (typecheck, lint, build)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add qualities array to next.config.ts** - `f563df1` (feat)
2. **Task 2: Update image-optimization.ts quality defaults** - `6e494cb` (feat)
3. **Task 3: Verify build and run type checks** - (verification only, no commit)

## Files Created/Modified

- `next.config.ts` - Added qualities: [70, 85] to images config
- `src/lib/utils/image-optimization.ts` - Changed default quality from 85 to 70, added JSDoc

## Decisions Made

- Quality 70 as default for menu images (visual quality maintained with ~30% smaller files)
- Quality 85 available for hero images where quality matters more for LCP
- Placed qualities array after formats, before deviceSizes per plan specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Image quality configuration complete
- Ready for Plan 02: Hero Image LCP optimization
- Hero images can now explicitly use quality: 85 for better LCP scores

---

_Phase: 36-image-optimization-lcp_
_Completed: 2026-02-01_
