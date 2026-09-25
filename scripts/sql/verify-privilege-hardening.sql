-- READ-ONLY post-deploy check for 20260924120000_admin_coupons.sql +
-- 20260925120000_privilege_hardening.sql. Paste into the Supabase SQL editor
-- (delivery project). It changes nothing: every statement is a SELECT.
--
-- Section 1: every row should read ok = true. A false row names the marker
-- that is missing (for example an earlier draft of the migration was applied).
-- Sections 2-4 are audits to eyeball, not pass/fail.

-- 1. Migration markers ---------------------------------------------------------
SELECT check_name, ok FROM (VALUES
  ('coupons table exists (20260924)',
    to_regclass('public.coupons') IS NOT NULL),
  ('claim_coupon is service-role only',
    NOT has_function_privilege('authenticated', 'public.claim_coupon(uuid,uuid,uuid)', 'EXECUTE')),
  ('authenticated cannot UPDATE profiles.role',
    NOT has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')),
  ('profiles role guard trigger present',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_profile_role')),
  ('profiles_insert_own pins email to the JWT',
    coalesce((SELECT pg_get_expr(polwithcheck, polrelid) FROM pg_policy
               WHERE polname = 'profiles_insert_own') ~ 'jwt', false)),
  ('no client INSERT on orders',
    NOT has_table_privilege('authenticated', 'public.orders', 'INSERT')),
  ('orders guard trigger present',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_order_client_update')),
  ('orders guard bounds owner cancel (final version)',
    pg_get_functiondef('app_private.guard_order_client_update()'::regprocedure)
      ~ 'OLD\.status IN \(''pending'', ''pending_approval'', ''confirmed''\)'),
  ('orders guard bounds driver delivered_at (final version)',
    pg_get_functiondef('app_private.guard_order_client_update()'::regprocedure)
      ~ 'NEW\.delivered_at IS NOT DISTINCT FROM OLD\.delivered_at'),
  ('route_stops identity guard present',
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_route_stop_identity')),
  ('get_my_driver_id() requires is_active',
    pg_get_functiondef('public.get_my_driver_id()'::regprocedure) ~ 'is_active'),
  ('anon cannot read driver_stats_mv',
    NOT has_table_privilege('anon', 'public.driver_stats_mv', 'SELECT')),
  ('authenticated cannot read driver_stats_mv',
    NOT has_table_privilege('authenticated', 'public.driver_stats_mv', 'SELECT')),
  ('anon cannot read delivery_metrics_mv',
    NOT has_table_privilege('anon', 'public.delivery_metrics_mv', 'SELECT')),
  ('anon cannot run marketing-cron RPCs',
    NOT has_function_privilege('anon', 'public.get_loyalty_tier_distribution()', 'EXECUTE')
    AND NOT has_function_privilege('anon', 'public.get_expiring_loyalty_rewards(integer,integer)', 'EXECUTE')),
  ('authenticated cannot run marketing-cron RPCs',
    NOT has_function_privilege('authenticated', 'public.get_lapsed_customers(integer)', 'EXECUTE')
    AND NOT has_function_privilege('authenticated', 'public.get_anniversary_customers(integer)', 'EXECUTE')),
  ('anon cannot read app_settings.updated_by',
    NOT has_column_privilege('anon', 'public.app_settings', 'updated_by', 'SELECT')),
  ('driver_ratings insert gated by can_rate_delivery',
    coalesce((SELECT pg_get_expr(polwithcheck, polrelid) FROM pg_policy
               WHERE polname = 'driver_ratings_insert') ~ 'can_rate_delivery', false)),
  ('no public table TRUNCATE-able by clients',
    NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
                   AND (has_table_privilege('anon', c.oid, 'TRUNCATE')
                        OR has_table_privilege('authenticated', c.oid, 'TRUNCATE'))))
) AS t(check_name, ok);

-- 2. Staff audit: before the fix any customer could self-promote. Every row
--    here should be someone you actually made an admin or driver. A driver
--    profile with no drivers row, or an admin you don't recognise, is suspect.
SELECT p.role, p.email, p.created_at, p.updated_at,
       d.id IS NOT NULL AS has_drivers_row, d.is_active
  FROM public.profiles p
  LEFT JOIN public.drivers d ON d.user_id = p.id
 WHERE p.role IN ('admin', 'driver')
 ORDER BY p.updated_at DESC NULLS LAST;

-- 3. Analytics view ACLs (anon/authenticated must not appear).
SELECT relname, relacl FROM pg_class WHERE relname IN ('driver_stats_mv', 'delivery_metrics_mv');

-- 4. Pre-existing gaps the follow-up PR addresses: current prod policies.
SELECT c.relname AS table_name, p.polname, p.polcmd,
       pg_get_expr(p.polqual, p.polrelid) AS using_expr
  FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
 WHERE c.relname IN ('addresses', 'order_items', 'order_item_modifiers', 'order_audit_log')
 ORDER BY 1, 2;
SELECT pg_get_constraintdef(oid) AS order_audit_log_action_check
  FROM pg_constraint WHERE conname = 'order_audit_log_action_check';
