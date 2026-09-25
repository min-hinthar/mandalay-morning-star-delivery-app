-- ===========================================
-- pgTAP Tests: Materialized Views Access Control
-- Tests that analytics views are properly restricted
-- ===========================================

BEGIN;
SELECT plan(8);

-- ===========================================
-- 1. TEST: Materialized views exist
-- ===========================================

SELECT ok(
  EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'driver_stats_mv'),
  'driver_stats_mv materialized view exists'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'delivery_metrics_mv'),
  'delivery_metrics_mv materialized view exists'
);

-- ===========================================
-- 2. TEST: Direct SELECT is revoked from anon + authenticated
-- ===========================================
-- information_schema.role_table_grants never lists materialized views, so the
-- old checks passed whatever the ACL said. Supabase's default privileges DO
-- grant anon/authenticated on every new relation; 20260925120000 revokes it.
-- Check the live privilege instead.

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.driver_stats_mv', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.driver_stats_mv', 'SELECT'),
  'anon/authenticated cannot directly SELECT from driver_stats_mv'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.delivery_metrics_mv', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.delivery_metrics_mv', 'SELECT'),
  'anon/authenticated cannot directly SELECT from delivery_metrics_mv'
);

-- ===========================================
-- 3. TEST: Admin wrapper functions exist
-- ===========================================

SELECT has_function(
  'public',
  'get_driver_stats_admin',
  'get_driver_stats_admin() function exists for secure access'
);

SELECT has_function(
  'public',
  'get_delivery_metrics_admin',
  'get_delivery_metrics_admin() function exists for secure access'
);

-- ===========================================
-- 4. TEST: Unique indexes exist for concurrent refresh
-- ===========================================

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_driver_stats_mv_driver_id'
  ),
  'driver_stats_mv has unique index for concurrent refresh'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_delivery_metrics_mv_date'
  ),
  'delivery_metrics_mv has unique index for concurrent refresh'
);

SELECT * FROM finish();
ROLLBACK;
