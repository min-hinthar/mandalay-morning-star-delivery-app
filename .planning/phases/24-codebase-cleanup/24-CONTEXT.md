# Phase 24: Codebase Cleanup - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove 3D hero code and legacy implementations, consolidate to latest patterns only. No new features — cleanup and consolidation only.

</domain>

<decisions>
## Implementation Decisions

### 3D Removal Scope
- Remove ALL 3D code: R3F components, drei, GLB assets, 3D hooks, Scene wrapper
- Uninstall npm packages: @react-three/fiber, @react-three/drei, three
- Remove all GLB model files and 3D-specific images from public/
- Remove all 3D-related TypeScript types and interfaces
- Remove test pages created in Phase 15 for R3F verification
- Remove ThemeAwareLighting component entirely (Phase 21 3D theme integration)
- Keep 2D fallback as permanent Hero — gradient + floating animation becomes the standard
- Keep STATE.md 3D documentation for historical record

### Legacy Detection
- Full audit: remove anything not actively imported/used
- Aggressive detection: orphaned files + commented-out code + dead branches + single-use components flagged for inlining
- Delete old header component (pre-Phase 23) completely — no backup
- Remove old menu item components (MenuItemCard, FeaturedItem) — UnifiedMenuItemCard is standard
- Remove superseded animation variants/helpers
- Delete orphan test files for removed components

### Consolidation Criteria
- Single source of truth: each component exported from ONE place only, fix all imports
- Keep most recent version of duplicate utilities
- Standardize all import paths to @/ format
- Consolidate all motion/animation tokens into one src/lib/animations.ts
- Clean up Tailwind config: remove unused custom values
- Create components/index.ts with clean public API exports

### Claude's Discretion
- TODO/FIXME comment cleanup: remove obviously stale, keep valid
- Hook file organization: group where sensible, keep separate otherwise
- zClass token enforcement: fix obvious violations found during cleanup

</decisions>

<specifics>
## Specific Ideas

- Bundle size should measurably decrease after 3D removal — document before/after
- Hero section uses existing 2D fallback permanently (gradient + floating animation)
- No rollback mechanisms — clean removal, trust git history

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

## Verification Requirements

1. **Build + Tests:** `pnpm build && pnpm test` must pass
2. **E2E Tests:** Full E2E test suite runs successfully
3. **Bundle Size:** Measure and document reduction from 3D removal
4. **TypeScript:** Zero tolerance — all TS errors fixed
5. **Console:** Zero console errors/warnings in dev mode
6. **Asset Links:** Verify all public/ asset references resolve
7. **Visual:** Spot check homepage, menu, cart, checkout

---

*Phase: 24-codebase-cleanup*
*Context gathered: 2026-01-27*
