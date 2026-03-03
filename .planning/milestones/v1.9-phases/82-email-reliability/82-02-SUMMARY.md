---
phase: 82-email-reliability
plan: "02"
subsystem: api
tags: [email, resend, supabase, audit-log, retry]

# Dependency graph
requires:
  - phase: 82-email-reliability
    provides: "Email retry pipeline (send.ts) with MAX_RETRY_ATTEMPTS constant and notification_logs"
provides:
  - "needs_contact flag set on orders after all retries exhausted"
  - "POST /api/admin/orders/[id]/contact endpoint for manual contact resolution"
  - "Audit log entry on contact resolution"
affects: [82-03, 82-04, admin-email-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Non-blocking flag update with try/catch after primary failure logging"
    - "Type cast as Record<string, unknown> for migration columns not in generated types"
    - ".eq('needs_contact', true) concurrent safety guard on update"

key-files:
  created:
    - src/app/api/admin/orders/[id]/contact/route.ts
  modified:
    - src/lib/email/send.ts

key-decisions:
  - "needs_contact flagged after all retries exhausted (MAX_RETRIES=3)"
  - "Type casts as Record<string, unknown> for migration columns not in generated types"

patterns-established:
  - "Step 7 pattern: non-blocking flag update after primary error logging in send pipeline"
  - "Idempotent needs_contact update: .eq('id', orderId) with no eq guard — multiple failures just re-set true"

requirements-completed: [EMAIL-05]

# Metrics
duration: 8min
completed: "2026-03-02"
---

# Phase 82 Plan 02: Email Reliability - Needs-Contact Flagging Summary

**needs_contact flagging after exhausted email retries plus POST /api/admin/orders/[id]/contact for admin resolution with audit logging**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-02T00:00:00Z
- **Completed:** 2026-03-02T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added Step 7 to send.ts: non-blocking needs_contact=true update on orders after all 3 retry attempts fail
- Created POST /api/admin/orders/[id]/contact with requireAdmin + rate limiting, validates needs_contact=true before clearing
- Audit log entry (action: "marked_contacted") inserted on successful resolution
- contacted_at/contacted_by recorded for traceability

## Task Commits

Each task was committed atomically:

1. **Task 1: Add needs-contact flagging to send.ts** + **Task 2: Create mark-contacted API endpoint** - `b25d3d5a` (feat)

**Plan metadata:** (this SUMMARY.md commit)

## Files Created/Modified

- `src/lib/email/send.ts` - Added Step 7: try/catch needs_contact=true update after retry exhaustion; retry_count added to success and failure notification_logs inserts
- `src/app/api/admin/orders/[id]/contact/route.ts` - POST endpoint: admin auth + rate limit, 404 if order not found, 400 if not flagged, clears flag with contacted_at/contacted_by, inserts audit_logs row

## Decisions Made

- needs_contact flagging is non-blocking (try/catch) — email failure already logged; flagging failure is secondary concern
- Type casts (`as Record<string, unknown>`) used for migration 030 columns (needs_contact, contacted_at, contacted_by) not yet in generated Supabase types
- `.eq("needs_contact", true)` NOT added to the update guard (idempotent set-true is fine; false would mean already resolved)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Email failure flagging pipeline complete; admin UI (Phase 82-03/04) can now display needs_contact orders and trigger the contact API
- Migration 030 must be applied to production before this code is active

---
*Phase: 82-email-reliability*
*Completed: 2026-03-02*
