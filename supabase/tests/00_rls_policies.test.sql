-- ===========================================
-- pgTAP Tests: RLS Policies
-- Tests Row Level Security configuration
-- ===========================================

BEGIN;
SELECT plan(20);

-- ===========================================
-- 1. TEST: RLS IS ENABLED ON ALL TABLES
-- ===========================================

SELECT has_table('public', 'profiles', 'profiles table exists');
SELECT has_table('public', 'addresses', 'addresses table exists');
SELECT has_table('public', 'orders', 'orders table exists');
SELECT has_table('public', 'drivers', 'drivers table exists');
SELECT has_table('public', 'routes', 'routes table exists');

-- Check RLS is enabled
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles'),
  'RLS is enabled on profiles'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'addresses'),
  'RLS is enabled on addresses'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'orders'),
  'RLS is enabled on orders'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'drivers'),
  'RLS is enabled on drivers'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'routes'),
  'RLS is enabled on routes'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'route_stops'),
  'RLS is enabled on route_stops'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'location_updates'),
  'RLS is enabled on location_updates'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'delivery_exceptions'),
  'RLS is enabled on delivery_exceptions'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'notification_logs'),
  'RLS is enabled on notification_logs'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'driver_ratings'),
  'RLS is enabled on driver_ratings'
);

-- ===========================================
-- 2. TEST: POLICIES EXIST FOR CRITICAL TABLES
-- ===========================================

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles'),
  'profiles table has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders'),
  'orders table has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drivers'),
  'drivers table has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routes'),
  'routes table has RLS policies'
);

SELECT * FROM finish();
ROLLBACK;
