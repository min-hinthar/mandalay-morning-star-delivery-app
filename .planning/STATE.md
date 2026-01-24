# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** v1.2 Playful UI Overhaul - Phase 16 3D Hero Core

## Current Position

Phase: 16 of 22 (3D Hero Core)
Plan: 1 of ? complete
Status: In progress
Last activity: 2026-01-24 - Completed 16-01-PLAN.md (3D Animation Dependencies & Infrastructure)

Progress: [####################] v1.0-v1.1 complete | [███░░░░░░░░░░░░░░░░░] v1.2 16%

## Milestones Completed

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |

**Total completed:** 14 phases, 53 plans
**v1.2 scope:** 8 phases (15-22), ~18 plans, 48 requirements
**v1.2 progress:** 1 phase complete + 1 plan, 3 plans done

## Performance Metrics

**Velocity:**
- Total plans completed: 56 (v1.0 + v1.1 + v1.2)
- v1.2 plans completed: 3
- Average duration: 10min (Phase 15-16)

**By Phase (v1.2):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 15 | 2/2 | 24min | 12min |
| 16 | 1/? | 4min | 4min |

*Updated after each plan completion*

## Accumulated Context

### Key Issues to Address

- ~~TailwindCSS 4 custom zIndex theme extensions not generating utility classes (INFRA-01)~~ RESOLVED in 15-01
- ~~Signout button click not registering (z-index/stacking context) (INFRA-02)~~ RESOLVED in 15-01
- ~~Pre-existing TypeScript errors in layout components (polymorphic types)~~ RESOLVED in 15-01

### Design Decisions

- 3D hero: Interactive food showcase with Three.js/React Three Fiber
- Menu items: New unified design across homepage, menu page, cart
- Theme: Light/dark refinement (footer text visibility, contrast)
- R3F 9.5.0 required for React 19 compatibility (v8.x fails)
- SSR-safe pattern: useState(false) + useEffect mounted check
- Dynamic imports with ssr: false for all R3F components
- GPU tier 2+ threshold for 3D rendering (30+ fps capable)
- Optimistic default to 3D while GPU detection loads
- Indeterminate spinner for 3D loading (percentage unreliable for single GLB)

### Research Findings

From `.planning/research/SUMMARY.md`:
- React Three Fiber 9.5.0 required for React 19 compatibility (v8.x fails)
- TailwindCSS 4 z-index fix: use `@theme { --z-index-* }` with unquoted numbers
- SSR-safe pattern: `dynamic(() => import(), { ssr: false })` + mounted check
- Single Canvas pattern to avoid WebGL context exhaustion

### Patterns Established (Phase 15-16)

- **zClass token system:** Use `zClass.popover` for dropdowns escaping parent stacking context, `zClass.modalBackdrop` for backdrop layers
- **Intra-component z-index:** Keep z-10 for elements that layer within their container (close buttons in modals)
- **Scene wrapper:** Always use `src/components/3d/Scene.tsx` for Canvas
- **Dynamic import 3D:** `dynamic(() => import('@/components/3d'), { ssr: false })`
- **useFrame animation:** delta-based rotation for frame-rate independence
- **Polymorphic component types:** Use `as = "div"` with `const Component = as as "div"` pattern for TypeScript compatibility
- **GPU tier detection:** useGPUTier hook returns shouldRender3D boolean (tier >= 2)
- **3D loader:** drei Html for DOM inside Canvas with branded spinner

### Blockers/Concerns

None - all blocking issues from Phase 15 resolved.

## Session Continuity

Last session: 2026-01-24
Stopped at: Completed 16-01-PLAN.md (3D Animation Dependencies & Infrastructure)
Resume file: None
Next action: `/gsd:execute-phase 16-02`

---

*Updated: 2026-01-24 - Completed 16-01*
