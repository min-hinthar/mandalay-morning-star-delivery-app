---
phase: 68-rls-audit-hardening
plan: 01
subsystem: database
tags: [rls, postgresql, supabase, security, policies, initplan]

# Dependency graph
requires:
  - phase: 002_rls_policies
    provides: "Base RLS policies for 17 core tables"
  - phase: 008-021 migrations
    provides: "RLS policies for featured_sections, app_settings, order_audit_log, customer_settings, driver_badges"
provides:
  - "Closed 5 RLS security gaps across app_settings, order_audit_log, customer_settings, driver_badges, featured_sections"
  - "Initplan-optimized all function calls in RLS policies (migrations 008-021)"
  - "Standardized policy naming to {table}_{operation} convention"
  - "Rollback block for safe revert"
affects: [rls-testing, storefront-anon-access, admin-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Initplan optimization: (select public.is_admin()) wrapping in all RLS policies"
    - "Idempotent migration: DROP POLICY IF EXISTS + CREATE POLICY"
    - "Rollback comment block at bottom of migration"

key-files:
  created:
    - "supabase/migrations/022_rls_audit_hardening.sql"
  modified: []

key-decisions:
  - "app_settings SELECT uses USING(true) with no TO clause for universal read including anon"
  - "order_audit_log restricted to admin-only SELECT and INSERT; service-role bypasses RLS for server-side inserts"
  - "customer_settings UPDATE includes OR (select public.is_admin()) for admin support access"
  - "driver_badges gets admin-only UPDATE policy for badge metadata corrections"
  - "customer_settings_select recreated with initplan wrapper on is_admin() (deviation)"

patterns-established:
  - "All RLS function calls wrapped in (select ...) for initplan optimization"
  - "Policy naming: {table}_{operation} or {table}_{operation}_{role} for multiple SELECT policies"
  - "Migration structure: header comments, sections by table, rollback block"

# Metrics
duration: 7min
completed: 2026-02-18
---

# Phase 68 Plan 01: RLS Audit & Hardening Summary

**Single migration closing 5 RLS gaps: app_settings anon read, order_audit_log admin-only, customer_settings admin UPDATE, driver_badges UPDATE policy, and initplan optimization on all 6 affected tables**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-18T06:36:32Z
- **Completed:** 2026-02-18T06:43:10Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Created idempotent migration 022_rls_audit_hardening.sql fixing all 5 documented RLS gaps
- Applied migration to production Supabase and verified all policy changes
- Confirmed anon role has SELECT privilege on app_settings, featured_sections, menu tables
- Verified RLS enabled on all 25 public tables
- Confirmed order_audit_log no longer has duplicate permissive SELECT policies

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 022_rls_audit_hardening.sql migration** - `9129e0e3` (feat)
2. **Task 2: Apply migration via Supabase API and verify** - No file changes (verification-only task against production database)

## Files Created/Modified
- `supabase/migrations/022_rls_audit_hardening.sql` - All RLS policy fixes: app_settings public read, order_audit_log admin-only, customer_settings admin UPDATE, driver_badges UPDATE + initplan wrappers, featured_sections/items initplan wrappers, rollback block

## Decisions Made
- Used Supabase Management API (`/v1/projects/{ref}/database/query`) for migration application since Supabase CLI `link` fails due to `[db.extensions]` config key incompatibility with CLI v2.67.1
- Recreated `customer_settings_select` with initplan wrapper on `is_admin()` -- original policy used bare `public.is_admin()` which was an optimization gap not explicitly called out in plan
- Added `GRANT UPDATE ON driver_badges TO authenticated` since original migration 021 only granted SELECT, INSERT, DELETE

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added initplan wrapper to customer_settings_select**
- **Found during:** Task 1 (writing migration)
- **Issue:** customer_settings_select used bare `public.is_admin()` without `(select ...)` wrapper
- **Fix:** Added DROP + CREATE with `(select public.is_admin())` wrapping
- **Files modified:** supabase/migrations/022_rls_audit_hardening.sql
- **Verification:** Post-apply query confirms policy recreated
- **Committed in:** 9129e0e3 (Task 1 commit)

**2. [Rule 3 - Blocking] Added GRANT UPDATE on driver_badges to authenticated**
- **Found during:** Task 1 (writing migration)
- **Issue:** Migration 021 only granted SELECT, INSERT, DELETE to authenticated. Adding UPDATE policy without the grant would make it non-functional.
- **Fix:** Added `GRANT UPDATE ON driver_badges TO authenticated;`
- **Files modified:** supabase/migrations/022_rls_audit_hardening.sql
- **Verification:** Post-apply driver_badges_update_admin policy is functional
- **Committed in:** 9129e0e3 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- Supabase CLI `link` command fails with `'db' has invalid keys: extensions` due to `[db.extensions]` in `supabase/config.toml` and CLI v2.67.1 not supporting that config key. Worked around by using Supabase Management API directly for SQL execution.
- `testing.check_multiple_permissive_policies()` function does not exist on production. Used direct `pg_policies` query with GROUP BY/HAVING instead.

## Verification Results

| Check | Result |
|-------|--------|
| app_settings has `app_settings_select` with roles `{public}` | PASS |
| order_audit_log has only `order_audit_log_select` + `order_audit_log_insert` | PASS |
| customer_settings_update includes admin access | PASS |
| driver_badges has `driver_badges_update_admin` | PASS |
| Anon SELECT on app_settings | PASS (true) |
| Anon SELECT on featured_sections | PASS (true) |
| Anon SELECT on menu_categories | PASS (true) |
| Anon SELECT on menu_items | PASS (true) |
| RLS enabled on all 25 public tables | PASS |
| No unintentional duplicate permissive policies | PASS (only driver_badges intentional) |

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 RLS security gaps are closed on production
- Policy naming standardized across affected tables
- Initplan optimization applied to all function calls
- Ready for Phase 69 or further security testing phases

---
*Phase: 68-rls-audit-hardening*
*Completed: 2026-02-18*
