---
phase: 93-customer-ux-engagement-accessibility
plan: 01
subsystem: database, api, ui
tags: [supabase, migration, share-token, ratings, admin, public-page]

requires:
  - phase: 92-customer-ux-discovery-shopping
    provides: "Existing orders table, driver_ratings table, order_items with modifiers"
provides:
  - "rating_dismissed boolean column on orders table"
  - "share_token text column with unique index on orders table"
  - "POST /api/orders/:id/share-token lazy token generation endpoint"
  - "Public /orders/:shareToken/share order summary page"
  - "Admin /admin/ratings page with sortable ratings list"
affects: [93-02-PLAN, 93-03-PLAN]

tech-stack:
  added: []
  patterns:
    - "Service role client for public unauthenticated page reads"
    - "Lazy token generation pattern (generate on first request, return cached)"

key-files:
  created:
    - supabase/migrations/036_rating_dismissed_share_token.sql
    - src/app/api/orders/[id]/share-token/route.ts
    - src/app/(public)/orders/[shareToken]/share/page.tsx
    - src/app/(admin)/admin/ratings/page.tsx
  modified:
    - src/types/database.ts
    - src/test/factories/index.ts

key-decisions:
  - "Service role client for share page reads (bypasses RLS for anonymous access)"
  - "crypto.randomUUID() for share token generation (standard, no extra dependency)"
  - "status-warning token for star fill color (matches existing rating patterns)"
  - "profiles!driver_ratings_user_id_fkey join for customer name in admin ratings"

patterns-established:
  - "Public share pages use createServiceClient for unauthenticated data access"

requirements-completed: [CUX-12, CUX-13]

duration: 9min
completed: 2026-03-03
---

# Phase 93 Plan 01: Rating Dismissal + Order Sharing Backend Summary

**DB migration adding rating_dismissed/share_token columns, lazy share-token API, public order share page, and admin ratings list with date/stars sorting**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-03T22:02:48Z
- **Completed:** 2026-03-03T22:12:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Migration 036 adds rating_dismissed boolean and share_token text columns to orders table
- POST /api/orders/:id/share-token lazily generates UUID tokens, returns shareUrl at /orders/{token}/share
- Public share page renders order items, modifiers, and totals without authentication
- Admin ratings page shows all ratings with order#, customer name, star display, feedback, and date with sort toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration + share token API route** - `49ddac89` (feat)
2. **Task 2: Public share page + admin ratings page** - `0f5b8ae2` (feat)
3. **Formatting fix** - `454f809c` (style)

## Files Created/Modified
- `supabase/migrations/036_rating_dismissed_share_token.sql` - ALTER TABLE adds rating_dismissed + share_token columns with partial index
- `src/app/api/orders/[id]/share-token/route.ts` - POST endpoint: auth check, lazy UUID generation, idempotent return
- `src/app/(public)/orders/[shareToken]/share/page.tsx` - Server component: service role query, order items with modifiers, totals, OG meta
- `src/app/(admin)/admin/ratings/page.tsx` - Server component: joined query, star display, sort toggle, empty state
- `src/types/database.ts` - Added rating_dismissed and share_token to OrdersRow/Insert/Update
- `src/test/factories/index.ts` - Added default values for new columns in mock factory

## Decisions Made
- Used `createServiceClient` (service role) for public share page to bypass RLS without adding anonymous RLS policies
- `crypto.randomUUID()` for token generation -- standard Web API, no dependency needed
- Star rating display uses `fill-status-warning text-status-warning` for filled stars, matching existing rating patterns
- Admin ratings joins `profiles!driver_ratings_user_id_fkey` to get customer name (explicit FK name for Supabase join disambiguation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated test factory for new columns**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** OrdersRow type now requires rating_dismissed and share_token, test factory missing them
- **Fix:** Added `rating_dismissed: false` and `share_token: null` to createMockOrder factory
- **Files modified:** src/test/factories/index.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 49ddac89 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary type fix for test infrastructure. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DB columns ready for Plan 02 (rating dismissal UI, share button wiring)
- Share token API and public page ready for ShareButton integration
- Admin ratings page operational for monitoring

---
*Phase: 93-customer-ux-engagement-accessibility*
*Completed: 2026-03-03*
