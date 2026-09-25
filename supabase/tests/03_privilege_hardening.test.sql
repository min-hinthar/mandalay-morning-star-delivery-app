-- ===========================================
-- pgTAP Tests: privilege hardening (20260925120000)
-- Pins the column grants, revokes and guard triggers that close the
-- customer/driver/anon escalation paths. A later blanket GRANT (or a
-- re-created relation picking up Supabase's default ACL) turns these red.
-- ===========================================

BEGIN;
SELECT plan(22);

-- profiles: no self-service role / email / reward-stamp writes
SELECT ok(NOT has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'), 'authenticated cannot UPDATE profiles.role');
SELECT ok(NOT has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE'), 'authenticated cannot UPDATE profiles.email');
SELECT ok(NOT has_column_privilege('authenticated', 'public.profiles', 'loyalty_thanked_at', 'UPDATE'), 'authenticated cannot UPDATE profiles.loyalty_thanked_at');
SELECT ok(NOT has_column_privilege('authenticated', 'public.profiles', 'referral_code', 'INSERT'), 'authenticated cannot INSERT profiles.referral_code');
SELECT ok(has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE'), 'authenticated can UPDATE profiles.full_name');
SELECT has_trigger('public', 'profiles', 'trg_guard_profile_role', 'profiles role guard trigger exists');

-- drivers / addresses: server-owned columns
SELECT ok(NOT has_column_privilege('authenticated', 'public.drivers', 'is_active', 'UPDATE'), 'authenticated cannot UPDATE drivers.is_active');
SELECT ok(NOT has_column_privilege('authenticated', 'public.drivers', 'rating_avg', 'UPDATE'), 'authenticated cannot UPDATE drivers.rating_avg');
SELECT ok(NOT has_table_privilege('authenticated', 'public.addresses', 'INSERT'), 'authenticated cannot INSERT addresses');
SELECT ok(NOT has_column_privilege('authenticated', 'public.addresses', 'distance_miles', 'UPDATE'), 'authenticated cannot UPDATE addresses.distance_miles');
SELECT ok(has_column_privilege('authenticated', 'public.addresses', 'is_default', 'UPDATE'), 'authenticated can UPDATE addresses.is_default');

-- orders: no direct inserts; column guard on updates
SELECT ok(NOT has_table_privilege('authenticated', 'public.orders', 'INSERT'), 'authenticated cannot INSERT orders');
SELECT ok(NOT has_table_privilege('authenticated', 'public.order_items', 'INSERT'), 'authenticated cannot INSERT order_items');
SELECT ok(NOT has_table_privilege('anon', 'public.orders', 'INSERT'), 'anon cannot INSERT orders');
SELECT has_trigger('public', 'orders', 'trg_guard_order_client_update', 'orders client-update guard trigger exists');
SELECT has_trigger('public', 'route_stops', 'trg_guard_route_stop_identity', 'route_stops identity guard trigger exists');

-- marketing cron readers: service role only
SELECT ok(NOT has_function_privilege('anon', 'public.get_expiring_loyalty_rewards(integer, integer)', 'EXECUTE'), 'anon cannot run get_expiring_loyalty_rewards');
SELECT ok(NOT has_function_privilege('authenticated', 'public.get_lapsed_customers(integer)', 'EXECUTE'), 'authenticated cannot run get_lapsed_customers');
SELECT ok(NOT has_function_privilege('anon', 'public.get_loyalty_tier_distribution()', 'EXECUTE'), 'anon cannot run get_loyalty_tier_distribution');
SELECT ok(has_function_privilege('service_role', 'public.get_loyalty_thankyou_candidates(integer)', 'EXECUTE'), 'service_role keeps get_loyalty_thankyou_candidates');

-- TRUNCATE ignores RLS: never granted to end users
SELECT ok(NOT EXISTS (
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
     AND (has_table_privilege('anon', c.oid, 'TRUNCATE') OR has_table_privilege('authenticated', c.oid, 'TRUNCATE'))
), 'no public table is TRUNCATE-able by anon/authenticated');

-- delivery exceptions: drivers can't pre-resolve
SELECT ok(NOT has_column_privilege('authenticated', 'public.delivery_exceptions', 'resolved_at', 'INSERT'), 'authenticated cannot INSERT delivery_exceptions.resolved_at');

SELECT * FROM finish();
ROLLBACK;
