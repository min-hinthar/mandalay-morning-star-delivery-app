---
phase: 31-hero-redesign
plan: 02
subsystem: ui
tags: [hero, parallax, layout, refactor]

# Dependency graph
requires:
  - phase: 31-01
    provides: Hero gradient tokens (--hero-bg-*)
provides:
  - Restructured Hero.tsx with layer architecture
  - Parallax transforms using motion-tokens presets
  - BrandMascot removal
affects: [31-03, 31-04, 31-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hero uses 4-layer parallax structure (orbs-far, orbs-mid, emojis, content)"
    - "Parallax speeds from motion-tokens parallaxPresets"
    - "Local stacking context via isolate class"

key-files:
  created: []
  modified:
    - src/components/ui/homepage/Hero.tsx
    - src/components/ui/homepage/HomePageClient.tsx

key-decisions:
  - "BrandMascot removed (emojis replace it per CONTEXT.md)"
  - "Content vertically centered (justify-center)"
  - "Gradient uses warm --hero-bg-* tokens"
  - "Layer z-indices: orbs-far(1), orbs-mid(2), emojis(3), content(4)"
  - "Parallax speeds: far(25%), mid(40%), near(60%), content(15%)"

patterns-established:
  - "ESLint disable comments for local z-index (isolate parent)"
  - "Layer containers with id attributes for future component mounting"

# Metrics
duration: 8min
completed: 2026-01-28
---

# Phase 31 Plan 02: Hero Layout Restructure Summary

**BrandMascot removed, 4-layer parallax architecture added, gradient updated to warm saffron tokens**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-28T13:22:23Z
- **Completed:** 2026-01-28T13:30:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- BrandMascot completely removed (import, props, rendering)
- Hero content vertically centered in viewport
- Gradient uses --hero-bg-* tokens (warm saffron palette)
- Layer containers exist for orbs (far, mid) and emojis
- Parallax transforms use parallaxPresets from motion-tokens
- Hero.tsx now 482 lines (was 442)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove BrandMascot and restructure layout** - `1fd28d3` (refactor)
2. **Task 2: Add parallax layer containers** - `f249790` (feat)
3. **Task 3: Update scroll parallax transforms** - `669ccc4` (feat)

## Files Created/Modified
- `src/components/ui/homepage/Hero.tsx` - Restructured with layer architecture, parallax transforms
- `src/components/ui/homepage/HomePageClient.tsx` - Removed showMascot prop

## Decisions Made
- BrandMascot removed per CONTEXT.md (floating emojis replace it)
- Content overlay changed from justify-end to justify-center for vertical centering
- Gradient background uses var(--hero-bg-start/mid/end) tokens
- Layer containers use absolute positioning with explicit z-index
- Parallax transforms use motion-tokens presets for consistency
- Smooth springs applied to all layer transforms (stiffness: 100, damping: 30)

## Deviations from Plan
### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed HomePageClient showMascot prop**
- **Found during:** Task 1
- **Issue:** HomePageClient passed showMascot={true} to Hero after prop was removed
- **Fix:** Removed showMascot prop from Hero usage in HomePageClient.tsx
- **Files modified:** src/components/ui/homepage/HomePageClient.tsx
- **Commit:** Included in 1fd28d3

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Layer structure ready for orb and emoji components (31-03)
- Parallax transforms defined but not yet connected to layers
- Layer IDs available: hero-layer-orbs-far, hero-layer-orbs-mid, hero-layer-emojis

---
*Phase: 31-hero-redesign*
*Completed: 2026-01-28*
