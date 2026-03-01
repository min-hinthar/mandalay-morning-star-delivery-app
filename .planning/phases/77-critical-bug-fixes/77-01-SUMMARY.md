---
phase: 77-critical-bug-fixes
plan: 01
subsystem: database
tags: [postgres, supabase, migration, trigger]

requires: []
provides:
  - refund_status column on orders table (none/partial/full)
  - Auto-computation trigger from order_items.refunded_quantity
  - RefundStatus TypeScript type in database.ts
affects: [77-05]

tech-stack:
  added: []
  patterns: [trigger-based computed column for derived state]

key-files:
  created:
    - supabase/migrations/028_refund_status.sql
  modified:
    - src/types/database.ts

key-decisions:
  - "Trigger-based computation ensures refund_status can never drift from order_items"
  - "Partial index on refund_status != 'none' for efficient admin filtering"

patterns-established:
  - "Computed columns via PG triggers for derived state"

requirements-completed: [BUG-07]

duration: 5min
completed: 2026-03-01
---

# Plan 01: Database Migration Summary

**Refund status column with trigger-based auto-computation from order_items.refunded_quantity**

## Performance

- **Duration:** 5 min
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Migration 028 adds refund_status column with CHECK constraint
- Trigger function computes status from order_items refunded_quantity
- Partial index for efficient admin filtering
- TypeScript types updated (RefundStatus type, OrdersRow fields)

## Task Commits

1. **Task 1: Migration + types** - `b8c10686` (feat)

## Files Created/Modified
- `supabase/migrations/028_refund_status.sql` - Migration with trigger and backfill
- `src/types/database.ts` - Added RefundStatus type, refund_status to OrdersRow/Insert/Update

## Decisions Made
- Trigger approach over application-level computation for consistency guarantee

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
Migration must be applied to Supabase project via `supabase db push` or dashboard.

## Next Phase Readiness
- Column and trigger ready for Plan 05 UI consumption

---
*Phase: 77-critical-bug-fixes*
*Completed: 2026-03-01*
