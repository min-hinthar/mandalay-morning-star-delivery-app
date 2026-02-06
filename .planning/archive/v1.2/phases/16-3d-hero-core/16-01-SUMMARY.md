---
phase: 16-3d-hero-core
plan: 01
subsystem: ui
tags: [react-three-fiber, detect-gpu, react-spring, 3d, webgl]

# Dependency graph
requires:
  - phase: 15-foundation-r3f
    provides: Scene wrapper component, R3F + drei setup
provides:
  - useGPUTier hook for GPU capability detection
  - Hero3DLoader branded loading component
  - @react-spring/three for spring physics animations
  - detect-gpu for tier classification
affects: [16-02 through 16-05, any 3D scene implementation]

# Tech tracking
tech-stack:
  added: ["@react-spring/three 10.0.3", "detect-gpu 5.0.70"]
  patterns: ["GPU tier detection for 3D/2D fallback", "drei Html loader pattern"]

key-files:
  created:
    - src/components/3d/hooks/useGPUTier.ts
    - src/components/3d/loaders/Hero3DLoader.tsx
  modified:
    - src/components/3d/index.ts
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Tier 2+ threshold for 3D rendering (30+ fps capable)"
  - "Optimistic default to 3D while GPU detection loads"
  - "Indeterminate spinner (not percentage - unreliable for single GLB)"

patterns-established:
  - "GPU tier detection: useGPUTier hook returns shouldRender3D boolean"
  - "3D loader: drei Html for DOM inside Canvas"

# Metrics
duration: 4min
completed: 2026-01-24
---

# Phase 16 Plan 01: 3D Animation Dependencies & Infrastructure Summary

**GPU tier detection hook with detect-gpu and branded 3D loader using drei Html for Morning Star hero section**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-24T02:20:00Z
- **Completed:** 2026-01-24T02:24:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Installed @react-spring/three 10.0.3 for spring physics 3D animations
- Installed detect-gpu 5.0.70 for GPU tier classification
- Created useGPUTier hook with shouldRender3D boolean (tier >= 2 threshold)
- Created Hero3DLoader with branded Morning Star spinner and star icon
- Updated barrel export with new components

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @react-spring/three and detect-gpu** - `ab99759` (chore)
2. **Task 2: Create useGPUTier hook** - `bf04bee` (feat)
3. **Task 3: Create Hero3DLoader component** - `d40cf8d` (feat)

## Files Created/Modified

- `src/components/3d/hooks/useGPUTier.ts` - GPU tier detection hook with shouldRender3D
- `src/components/3d/loaders/Hero3DLoader.tsx` - Branded loading spinner for 3D content
- `src/components/3d/index.ts` - Barrel export updated with new components
- `package.json` - Added @react-spring/three and detect-gpu dependencies
- `pnpm-lock.yaml` - Lock file updated

## Decisions Made

- **Tier 2+ threshold:** detect-gpu tier 2+ indicates 30+ fps capability, safe for 3D
- **Optimistic default:** Return `shouldRender3D: true` while loading (most devices support WebGL)
- **Indeterminate spinner:** useProgress active state only (percentage unreliable for single large GLB)
- **Mounted check pattern:** Consistent with Phase 15 SSR-safe patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all installations and compilations succeeded on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- useGPUTier hook ready for Hero3DScene to conditionally render 3D/2D
- Hero3DLoader ready for Suspense fallback in 3D scene
- @react-spring/three ready for spring physics animations in 16-02
- All exports available from `src/components/3d` barrel

---
*Phase: 16-3d-hero-core*
*Completed: 2026-01-24*
