---
phase: 67-csp-security-headers
plan: 02
subsystem: ui
tags: [csp, cssText, dom-style, security, google-maps, gsap]

# Dependency graph
requires:
  - phase: 67-csp-security-headers-01
    provides: ESLint no-restricted-properties rule flagging cssText usage
provides:
  - Zero cssText usages across entire src/ directory
  - CSP-compatible individual DOM style property assignments in FlyToCart and CustomMarkers
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Individual style.property assignments instead of cssText for CSP compatibility"
    - "CSS property names converted to DOM API camelCase (z-index -> zIndex, font-size -> fontSize)"

key-files:
  created: []
  modified:
    - src/components/ui/cart/FlyToCart.tsx
    - src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx

key-decisions:
  - "Used String() for numeric zIndex values to satisfy DOM API string requirement"
  - "Kept opacity as string type (already string from ternary) for direct assignment"

patterns-established:
  - "DOM style assignment: always use individual style.property instead of cssText"
  - "CSS-to-DOM property name mapping: kebab-case to camelCase (border-radius -> borderRadius)"

# Metrics
duration: 7min
completed: 2026-02-17
---

# Phase 67 Plan 02: Replace cssText Summary

**Replaced 5 cssText assignments with 40 individual DOM style.property assignments across FlyToCart and CustomMarkers for CSP style-src compatibility**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-17T12:48:32Z
- **Completed:** 2026-02-17T12:55:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Eliminated all cssText usage from FlyToCart.tsx (1 site, 10 properties)
- Eliminated all cssText usage from CustomMarkers.tsx (4 sites, 30 properties total)
- Zero cssText usages remain across entire src/ directory
- ESLint no-restricted-properties warnings for cssText reduced from 5 to 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace cssText in FlyToCart.tsx** - `1080ca7` (refactor)
2. **Task 2: Replace cssText in CustomMarkers.tsx (4 sites)** - `8a34c2e` (refactor)

## Files Created/Modified
- `src/components/ui/cart/FlyToCart.tsx` - Replaced cssText template literal with 10 individual style assignments for flying cart animation element
- `src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx` - Replaced 4 cssText assignments with individual style assignments across restaurant, vehicle, destination, and stale badge markers

## Decisions Made
- Used `String(zIndex.popover)` for numeric-to-string conversion (DOM style API requires strings)
- Kept `opacity` variable as-is since it was already a string type from the ternary assignment
- No changes to innerHTML SVG markup or GSAP animation code

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 67 complete: ESLint rule (Plan 01), cssText replacement (Plan 02), and dead code cleanup (Plan 03) all done
- CSP style-src ready for 'unsafe-inline' with defense-in-depth -- no cssText patterns remain to flag
- Ready for transition to Phase 68

---
*Phase: 67-csp-security-headers*
*Completed: 2026-02-17*
