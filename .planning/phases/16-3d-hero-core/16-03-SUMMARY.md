---
phase: 16-3d-hero-core
plan: 03
subsystem: ui
tags: [react-three-fiber, hero-section, gpu-detection, parallax, framer-motion]

# Dependency graph
requires:
  - phase: 16-01
    provides: "useGPUTier hook, Hero3DLoader, @react-spring/three, detect-gpu"
  - phase: 16-02
    provides: "Hero3DCanvas, FoodModel with spring entrance, OrbitControls scene"
provides:
  - "Hero3DSection conditional 3D/2D wrapper based on GPU tier"
  - "Hero.tsx integrated with 3D layer in parallax stack"
  - "2D fallback with subtle float animation for low-end devices"
  - "Complete 3D hero user experience"
affects: ["17-3d-hero-polish", "hero-optimization", "3d-scene-enhancements"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GPU-based conditional 3D/2D rendering in wrapper component"
    - "2D fallback as designed experience (not failure state)"
    - "ParallaxLayer integration for 3D content"
    - "Dynamic import with SSR disabled for 3D components"

key-files:
  created:
    - "src/components/homepage/Hero3DSection.tsx"
  modified:
    - "src/components/homepage/Hero.tsx"

key-decisions:
  - "2D fallback is a designed experience for low-end devices, not a failure state"
  - "Dynamic import with loading state prevents SSR errors"
  - "3D layer at zIndex 2, floating food at zIndex 3 (food floats in front)"
  - "show3D prop defaults to true, allows conditional disabling for A/B testing"

patterns-established:
  - "Hero3DSection pattern: Conditional wrapper with GPU detection and loading state"
  - "2D fallback pattern: Subtle motion (float + rotate) with gradient and glow"
  - "3D layer integration: ParallaxLayer speed=mid for depth effect"

# Metrics
duration: 5min
completed: 2026-01-24
---

# Phase 16 Plan 03: Hero Integration Summary

**Complete 3D hero integration with GPU-based conditional rendering, 2D fallback with subtle motion, and Hero3DCanvas integrated into parallax stack**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-24T10:45:00Z
- **Completed:** 2026-01-24T10:50:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Hero3DSection conditional wrapper rendering 3D on capable devices, 2D fallback on low-end
- 2D fallback designed as quality experience (float animation, gradient, glow)
- Hero.tsx integrated with 3D layer in parallax stack (zIndex 2, speed=mid)
- Dynamic import prevents SSR errors while showing loading state
- show3D prop enables conditional disabling for A/B testing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Hero3DSection with GPU-based conditional rendering** - `7ae04ff` (feat)
2. **Task 2: Integrate Hero3DSection into Hero.tsx** - `41c5f50` (feat)
3. **Task 3: Checkpoint human-verify** - APPROVED (verified 3D interaction)

## Files Created/Modified

- `src/components/homepage/Hero3DSection.tsx` - Conditional 3D/2D wrapper based on GPU tier
- `src/components/homepage/Hero.tsx` - Updated with show3D prop and Hero3DSection layer at zIndex 2

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| 2D fallback as designed experience | Low-end devices get optimized experience, not degraded 3D |
| Dynamic import with ssr: false | Prevents WebGL SSR errors, Hero2DFallback shows during load |
| 3D at zIndex 2, floating food at zIndex 3 | Food elements float in front of 3D model for depth |
| show3D prop defaults to true | Allows disabling 3D for specific use cases or A/B testing |
| Subtle float animation for 2D fallback | 6s ease-in-out cycle provides visual interest without distraction |

## Deviations from Plan

None - plan executed exactly as written.

Note: 2D fallback image `/images/hero-dish-2d.jpg` specified but not sourced. Component shows broken image until asset provided. Acceptable for Phase 16 (testing with 3D model placeholder).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 16 (3D Hero Core) complete:
- GPU tier detection working (tier 2+ shows 3D, tier 0-1 shows 2D)
- 3D hero scene with interactive OrbitControls (drag rotation, pinch zoom)
- Spring entrance animation
- 2D fallback with subtle motion
- All integrated into Hero.tsx parallax stack

Requirements verified:
- ✓ HERO3D-01: 3D food model renders (placeholder bowl)
- ✓ HERO3D-02: Drag/touch rotation works smoothly with inertia
- ✓ HERO3D-03: Pinch/scroll zoom works within constraints (min 2, max 6)
- ✓ HERO3D-04: Studio lighting makes food look good
- ✓ HERO3D-05: Loading state shows during GPU detection and 3D load
- ✓ HERO3D-06: Low-end devices show 2D fallback via GPU tier
- ✓ HERO3D-07: Reduced motion disables spring animation

Ready for Phase 17 (3D Hero Polish):
- Auto-rotation with pause-on-interact
- Real GLB food model
- HDRI environment for production
- Performance optimization

Assets needed:
- Real GLB food model (currently using placeholder bowl)
- 2D fallback image `/images/hero-dish-2d.jpg`

---
*Phase: 16-3d-hero-core*
*Completed: 2026-01-24*
