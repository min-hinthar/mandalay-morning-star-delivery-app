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
-- 2. TEST: Direct SELECT is revoked from authenticated
-- ===========================================
-- Note: This checks that the default 'authenticated' role
-- does not have direct SELECT on the materialized views

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'driver_stats_mv'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT'
  ),
  'authenticated role cannot directly SELECT from driver_stats_mv'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'delivery_metrics_mv'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT'
  ),
  'authenticated role cannot directly SELECT from delivery_metrics_mv'
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
