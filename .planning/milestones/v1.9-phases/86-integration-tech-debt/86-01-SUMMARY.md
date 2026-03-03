---
phase: 86-integration-tech-debt
plan: 01
subsystem: api, ui
tags: [business-rules, isPastCutoff, cutoff-wiring, server-component]

# Dependency graph
requires:
  - phase: 78-configurable-business-rules
    provides: "getBusinessRules() cached reader with cutoffDay/cutoffHour"
provides:
  - "retry-payment route wired to DB-sourced cutoff params"
  - "customer orders/[id] page wired to DB-sourced cutoff params"
affects: [admin-settings-cutoff-changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All isPastCutoff callsites now use getBusinessRules() pattern from checkout session route"

key-files:
  created: []
  modified:
    - src/app/api/orders/[id]/retry-payment/route.ts
    - src/app/(customer)/orders/[id]/page.tsx

key-decisions:
  - "Placed getBusinessRules() call before cutoff check block in retry-payment route"
  - "Placed getBusinessRules() call before deliveryDate formatting in orders/[id] page (server component)"

patterns-established:
  - "All server-side isPastCutoff calls now consistently pass DB-sourced cutoffDay/cutoffHour"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 86 Plan 01: Wire getBusinessRules into remaining isPastCutoff callsites

**Both retry-payment route and customer orders/[id] page now use DB-sourced cutoffDay/cutoffHour via getBusinessRules(), matching the checkout session route pattern**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- retry-payment route calls getBusinessRules() and passes cutoffDay/cutoffHour to isPastCutoff
- customer orders/[id] page calls getBusinessRules() and passes cutoffDay/cutoffHour to isPastCutoff
- All isPastCutoff callsites in the codebase now consistently use DB-sourced business rules

## Task Commits

1. **Task 1: Wire getBusinessRules into retry-payment route** - `94446698` (feat)
2. **Task 2: Wire getBusinessRules into customer orders/[id] page** - `94446698` (feat)

## Files Created/Modified
- `src/app/api/orders/[id]/retry-payment/route.ts` - Added getBusinessRules import and usage for cutoff check
- `src/app/(customer)/orders/[id]/page.tsx` - Added getBusinessRules import and usage for isPastCutoff prop

## Decisions Made
None - followed plan as specified

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All isPastCutoff callsites wired to DB-sourced business rules
- Admin cutoff setting changes now affect all server-side cutoff checks consistently

---
*Phase: 86-integration-tech-debt*
*Completed: 2026-03-02*
