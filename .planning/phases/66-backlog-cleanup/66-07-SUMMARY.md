---
phase: 66-backlog-cleanup
plan: 07
subsystem: infra
tags: [knip, dead-code, edge-functions, console-cleanup, dependency-audit]

# Dependency graph
requires:
  - phase: 54-email-system
    provides: Resend + React Email replacement for Edge Functions
provides:
  - Dead Edge Functions removed (send-order-confirmation, send-delivery-notification)
  - 15 dead files removed (~3,900 lines)
  - 8 unused dependencies removed
  - Console.log cleanup (bare logs converted to console.debug)
  - Comprehensive dead code audit report
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Knip for dead code detection with ignoreDependencies for FlatCompat false positives"

key-files:
  created:
    - ".planning/phases/66-backlog-cleanup/66-07-DEAD-CODE-REPORT.md"
  modified:
    - "knip.json"
    - "package.json"
    - "src/components/ui/admin/orders/OrderDetailExpanded/index.tsx"
    - "src/lib/hooks/useServiceWorker.ts"
    - "src/components/ui/checkout/AddressInput/AddressInput.tsx"

key-decisions:
  - "Deleted send-delivery-notification alongside send-order-confirmation (both confirmed dead, zero refs)"
  - "Kept OrderDetailExpanded/config.ts (still imported by OrderDetailPage) while deleting 6 dead component files"
  - "Kept database/analytics types as API contracts despite zero direct imports"
  - "Kept CSS tokens (conservative: template literal usage makes grep-based detection unreliable)"
  - "Added eslint-config-next/prettier/postcss to knip ignoreDependencies (FlatCompat false positives)"

patterns-established:
  - "console.log -> console.debug with [prefix] for debug-level logs"

# Metrics
duration: 54min
completed: 2026-02-15
---

# Phase 66 Plan 07: Dead Code Removal Summary

**Removed 2 dead Edge Functions, 15 dead files, 8 unused deps (~3,900 lines deleted) via Knip audit + manual scanning**

## Performance

- **Duration:** 54 min
- **Started:** 2026-02-15T12:24:59Z
- **Completed:** 2026-02-15T13:19:16Z
- **Tasks:** 2
- **Files modified:** 20 (Task 1) + 3 (Task 2)

## Accomplishments

- Deleted both dead Supabase Edge Functions (send-order-confirmation + send-delivery-notification)
- Removed 15 dead component/query files with zero imports
- Removed 8 unused dependencies (5 prod + 3 dev)
- Converted 2 bare console.log to console.debug with prefixes
- Generated comprehensive dead code audit report with flagged items for user review
- Updated knip.json to suppress false positives

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove dead Edge Functions and run Knip audit** - `d513452` (feat)
2. **Task 2: Console.log cleanup and dead code audit report** - `3288e1d` (feat)

## Files Created/Modified

- `supabase/functions/send-order-confirmation/` - Deleted (superseded by src/lib/email)
- `supabase/functions/send-delivery-notification/` - Deleted (also superseded)
- `src/components/ui/animated-image.tsx` - Deleted (zero imports)
- `src/components/ui/DiscardChangesModal.tsx` - Deleted (zero imports)
- `src/lib/queries/menu.ts` - Deleted (zero imports)
- `src/components/ui/auth/AuthHandler.tsx` - Deleted (zero imports)
- `src/components/ui/maps/MapErrorCard.tsx` - Deleted (zero imports)
- `src/components/ui/admin/analytics/ChartErrorCard.tsx` - Deleted (zero imports)
- `src/components/ui/admin/drivers/DriverListTable/DriverMobileCard.tsx` - Deleted
- `src/components/ui/admin/routes/RouteListTable/RouteMobileCard.tsx` - Deleted
- `src/components/ui/admin/orders/OrderDetailExpanded/` - 6 component files deleted, config.ts kept
- `knip.json` - Updated ignoreDependencies for false positives
- `package.json` - 8 dependencies removed
- `src/lib/hooks/useServiceWorker.ts` - Bare console.log -> console.debug("[SW]")
- `src/components/ui/checkout/AddressInput/AddressInput.tsx` - Bare console.log -> console.debug("[AddressInput]")
- `.planning/phases/66-backlog-cleanup/66-07-DEAD-CODE-REPORT.md` - Full audit report

## Decisions Made

- Deleted send-delivery-notification (confirmed dead via zero refs in src/ and supabase/ migrations)
- Kept OrderDetailExpanded/config.ts (StatusTimelineCard, StatusChangeDialog, OrderHeaderCard all import from it)
- Kept all database/analytics types as API contracts (conservative per plan guidance)
- Skipped CSS token removal (template literal class composition makes detection unreliable)
- Flagged /api/analytics/vitals route and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for user review

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] send-delivery-notification also dead**

- **Found during:** Task 1
- **Issue:** Plan only confirmed send-order-confirmation dead; send-delivery-notification needed investigation
- **Fix:** Verified zero references in src/ and supabase/, confirmed superseded by src/lib/email (Phase 54). Deleted.
- **Files modified:** supabase/functions/send-delivery-notification/
- **Committed in:** d513452

**2. [Rule 1 - Bug] OrderDetailExpanded barrel exported deleted components**

- **Found during:** Task 1
- **Issue:** After deleting 6 component files, index.tsx still exported OrderDetailExpanded and types
- **Fix:** Updated barrel to re-export config.ts contents (STATUS_COLORS, STATUS_LABELS, etc.)
- **Files modified:** src/components/ui/admin/orders/OrderDetailExpanded/index.tsx
- **Committed in:** d513452

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both necessary for correctness. No scope creep.

## Issues Encountered

- Turbopack ENOENT build panic on first attempt (pre-existing OneDrive sync issue, documented in STATE.md). Cleared lock file and retried successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dead code cleanup complete
- Flagged items documented in 66-07-DEAD-CODE-REPORT.md for user review:
  - `/api/analytics/vitals` route (zero frontend refs, may be webhook target)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (only in health check, @stripe/stripe-js removed)
- Ready for remaining Phase 66 plans

---

_Phase: 66-backlog-cleanup_
_Completed: 2026-02-15_
