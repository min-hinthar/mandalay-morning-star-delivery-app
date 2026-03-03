---
phase: 82-email-reliability
plan: 01
subsystem: api
tags: [svix, webhook, resend, email, postgres, security, audit-logging]

# Dependency graph
requires:
  - phase: 20-email-system
    provides: notification_logs table, Resend webhook handler skeleton
provides:
  - webhook_audit_logs table with HMAC signature validation records
  - orders.needs_contact / contacted_at / contacted_by columns
  - notification_logs.retry_count column
  - Svix-verified webhook handler with idempotent processing
  - Status downgrade protection for notification_logs
  - ERROR_GUIDANCE map in email constants
affects: [82-02-needs-contact-flagging, 82-03-email-dashboard, 82-04-ops-badges]

# Tech tracking
tech-stack:
  added: [svix@1.86.0]
  patterns:
    - "Raw body text() read for Svix HMAC verification (not JSON)"
    - "Idempotent webhook processing via svix-id lookup in webhook_audit_logs"
    - "STATUS_PRIORITY map for downgrade protection"
    - "crypto.createHash for payload audit hashing (no additional deps)"

key-files:
  created:
    - supabase/migrations/030_email_reliability.sql
  modified:
    - src/app/api/webhooks/resend/route.ts
    - src/lib/email/constants.ts
    - package.json

key-decisions:
  - "svix v1.86.0 HMAC webhook verification over raw body text (not JSON)"
  - "STATUS_PRIORITY map for downgrade protection (prevents delivered->sent regression)"
  - "Idempotent webhook processing via svix-id lookup in webhook_audit_logs"
  - "crypto.createHash for payload audit hashing (no additional deps)"

patterns-established:
  - "Always return 200 after successful verification to prevent Resend retries"
  - "Log both success and failure verification attempts to webhook_audit_logs"
  - "Check svix-id deduplication against event_type=processed entries"

requirements-completed: [EMAIL-01, EMAIL-06]

# Metrics
duration: 10min
completed: 2026-03-01
---

# Phase 82 Plan 01: Email Reliability Foundation Summary

**Svix HMAC webhook verification with audit logging, idempotent deduplication, and database schema for email reliability tracking**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-01T23:26:00Z
- **Completed:** 2026-03-01T23:36:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created migration 030 with webhook_audit_logs table, orders.needs_contact columns, and notification_logs.retry_count
- Upgraded Resend webhook handler from naive secret check to Svix HMAC signature verification
- Added idempotent processing (svix-id deduplication) and status downgrade protection
- Added ERROR_GUIDANCE map to email constants for operator-friendly error messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database migration for email reliability** - `2752eb9` (feat)
2. **Task 2: Upgrade webhook handler to Svix HMAC verification** - `2752eb9` (feat, combined with task 1)

**Plan metadata:** `e999ed0` (docs: complete phase-82 execution)

## Files Created/Modified

- `supabase/migrations/030_email_reliability.sql` - Schema changes: webhook_audit_logs table, orders.needs_contact/contacted_at/contacted_by, notification_logs.retry_count, 5 indexes, RLS for service-role-only access
- `src/app/api/webhooks/resend/route.ts` - Full rewrite with Svix HMAC verification, audit logging, idempotent processing, status downgrade protection
- `src/lib/email/constants.ts` - Added ERROR_GUIDANCE map with operator-friendly bounce/spam/timeout guidance
- `package.json` + `pnpm-lock.yaml` - Added svix@1.86.0 dependency

## Decisions Made

- svix v1.86.0 for HMAC verification — reads raw body via `request.text()` (not `request.json()`) for signature validity
- STATUS_PRIORITY map (pending=0, sent=1, delivered=2, opened=3, clicked=4, bounced/failed=5) prevents regression from higher to lower status
- Idempotent check queries `webhook_audit_logs` for existing `event_type=processed` record with matching `svix-id`
- `crypto.createHash('sha256')` for payload audit hashing — Node.js built-in, no additional deps
- Always return HTTP 200 after successful verification (even on processing errors) to prevent Resend retry storms

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration:**

- `RESEND_WEBHOOK_SECRET` — Set in Resend Dashboard -> Webhooks -> Signing Secret (whsec_... format)
- Apply migration 030_email_reliability.sql to production Supabase (human action)

## Next Phase Readiness

- Schema foundation complete — 82-02 can add needs-contact flagging logic using orders.needs_contact column
- webhook_audit_logs table ready for monitoring
- Webhook handler fully secured and idempotent

## Self-Check: PASSED

- FOUND: .planning/phases/82-email-reliability/82-01-SUMMARY.md
- FOUND: supabase/migrations/030_email_reliability.sql
- FOUND: src/app/api/webhooks/resend/route.ts
- FOUND: src/lib/email/constants.ts
- FOUND: commit 2752eb9 (feat(82-01): add email reliability migration + svix webhook verification)

---
*Phase: 82-email-reliability*
*Completed: 2026-03-01*
