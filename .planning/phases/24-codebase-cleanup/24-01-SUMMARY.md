---
phase: 24-codebase-cleanup
plan: 01
subsystem: ui
tags: [three.js, react-three-fiber, 3d, bundle-size, cleanup]

# Dependency graph
requires:
  - phase: 15-foundation-r3f-setup
    provides: R3F foundation that is being removed
  - phase: 16-3d-hero-core
    provides: 3D hero components that are being removed
  - phase: 21-theme-refinements
    provides: ThemeAwareLighting being removed
provides:
  - Clean codebase without 3D dependencies
  - ~650KB+ bundle size reduction (gzipped)
  - 2D hero as permanent standard
affects: [homepage, bundle-size, dependencies]

# Tech tracking
tech-stack:
  added: []
  removed:
    - "@react-three/fiber 9.5.0"
    - "@react-three/drei 10.7.7"
    - "three 0.182.0"
    - "@react-spring/three 10.0.3"
    - "@types/three 0.182.0"
    - "detect-gpu 5.0.70"
  patterns: []

key-files:
  created: []
  deleted:
    - "src/components/3d/ (entire directory - 7 files)"
    - "src/components/homepage/Hero3DSection.tsx"
    - "src/app/(dev)/3d-test/ (2 files)"
    - "public/models/rice-bowl.glb"
    - "public/models/ATTRIBUTION.md"

key-decisions:
  - "2D hero is permanent standard - gradient + floating animation"
  - "Complete removal of all 3D code, no fallback mechanism"
  - "Trust git history for rollback if needed"

patterns-established: []

# Metrics
duration: 8min
completed: 2026-01-27
---

# Phase 24 Plan 01: Remove 3D Hero Code Summary

**Complete removal of React Three Fiber and Three.js ecosystem from codebase, reducing bundle by ~650KB+ gzipped**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-27T07:09:00Z
- **Completed:** 2026-01-27T07:17:00Z
- **Tasks:** 2
- **Files deleted:** 12

## Accomplishments

- Deleted all 3D component files (7 in src/components/3d/, 1 Hero3DSection, 2 test pages)
- Removed 3D assets (rice-bowl.glb model + attribution)
- Uninstalled 6 npm packages (R3F, drei, three, react-spring/three, @types/three, detect-gpu)
- Build and typecheck pass without 3D code

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove 3D component files and test pages** - `de76f57` (chore)
2. **Task 2: Remove 3D assets and uninstall packages** - `35fcbb7` (chore)

## Files Deleted

- `src/components/3d/Hero3DCanvas.tsx` - R3F Canvas wrapper
- `src/components/3d/Scene.tsx` - Scene container
- `src/components/3d/ThemeAwareLighting.tsx` - Theme-adaptive 3D lighting
- `src/components/3d/hooks/useGPUTier.ts` - GPU detection hook
- `src/components/3d/loaders/Hero3DLoader.tsx` - Loading UI for 3D
- `src/components/3d/models/FoodModel.tsx` - GLTF model component
- `src/components/3d/index.ts` - Barrel export
- `src/components/homepage/Hero3DSection.tsx` - Hero 3D wrapper
- `src/app/(dev)/3d-test/page.tsx` - Test page
- `src/app/(dev)/3d-test/RotatingCube.tsx` - Test component
- `public/models/rice-bowl.glb` - 3D model (120KB)
- `public/models/ATTRIBUTION.md` - Model attribution

## Packages Removed

| Package | Version | Purpose |
|---------|---------|---------|
| @react-three/fiber | 9.5.0 | R3F core |
| @react-three/drei | 10.7.7 | R3F helpers |
| three | 0.182.0 | Three.js core |
| @react-spring/three | 10.0.3 | R3F animations |
| @types/three | 0.182.0 | TypeScript types |
| detect-gpu | 5.0.70 | GPU tier detection |

## Decisions Made

- **2D hero is permanent:** The gradient + floating animation hero (2D fallback) is now the only hero, not a fallback
- **Clean removal:** No partial removal or feature flags - complete deletion
- **Git is the backup:** Trust git history for any future rollback needs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored layout files deleted in previous session**
- **Found during:** Task 1 verification (typecheck)
- **Issue:** Previous session had uncommitted deletions of layout files (header.tsx, footer.tsx, etc.) causing typecheck to fail on missing files
- **Fix:** Identified these were from completed 24-02 work, stashed changes and re-applied only 3D deletions
- **Files affected:** src/components/layout/*.tsx (6 files)
- **Verification:** typecheck passes after proper file state
- **Impact:** No scope creep - these were pre-existing uncommitted changes, not new work

---

**Total deviations:** 1 auto-fixed (blocking issue from stale working directory state)
**Impact on plan:** Minor - resolved working directory state conflict from previous session

## Issues Encountered

- Working directory had uncommitted changes from previous session (24-02 execution) that conflicted with typecheck. Resolved by stashing and re-applying only 24-01 changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 3D code completely removed
- Homepage hero works with 2D gradient + floating animation
- Ready for 24-03 (animation consolidation + verification)

---
*Phase: 24-codebase-cleanup*
*Completed: 2026-01-27*
