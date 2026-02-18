-- ===========================================
-- pgTAP Tests: RLS Policies (Comprehensive)
-- Full audit of Row Level Security across all 25 public tables
-- Phase 68: RLS Audit & Hardening
-- ===========================================

BEGIN;
SELECT plan(62);

-- ===========================================
-- SECTION 1: RLS ENABLED ON ALL PUBLIC TABLES (25 tests)
-- Every public table must have Row Level Security enabled.
-- ===========================================

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'addresses'),
  'RLS is enabled on addresses'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'app_settings'),
  'RLS is enabled on app_settings'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'customer_settings'),
  'RLS is enabled on customer_settings'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'delivery_exceptions'),
  'RLS is enabled on delivery_exceptions'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'driver_badges'),
  'RLS is enabled on driver_badges'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'driver_invites'),
  'RLS is enabled on driver_invites'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'driver_ratings'),
  'RLS is enabled on driver_ratings'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'drivers'),
  'RLS is enabled on drivers'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'featured_section_items'),
  'RLS is enabled on featured_section_items'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'featured_sections'),
  'RLS is enabled on featured_sections'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'item_modifier_groups'),
  'RLS is enabled on item_modifier_groups'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'location_updates'),
  'RLS is enabled on location_updates'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'menu_categories'),
  'RLS is enabled on menu_categories'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'menu_items'),
  'RLS is enabled on menu_items'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'modifier_groups'),
  'RLS is enabled on modifier_groups'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'modifier_options'),
  'RLS is enabled on modifier_options'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'notification_logs'),
  'RLS is enabled on notification_logs'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'order_audit_log'),
  'RLS is enabled on order_audit_log'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'order_item_modifiers'),
  'RLS is enabled on order_item_modifiers'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'order_items'),
  'RLS is enabled on order_items'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'orders'),
  'RLS is enabled on orders'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles'),
  'RLS is enabled on profiles'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'route_stops'),
  'RLS is enabled on route_stops'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'routes'),
  'RLS is enabled on routes'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'webhook_events'),
  'RLS is enabled on webhook_events'
);

-- ===========================================
-- SECTION 2: POLICY EXISTENCE ON ALL TABLES (25 tests)
-- Every table should have at least one RLS policy, except
-- webhook_events which is intentionally service-role only.
-- ===========================================

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addresses'),
  'addresses has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings'),
  'app_settings has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_settings'),
  'customer_settings has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_exceptions'),
  'delivery_exceptions has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_badges'),
  'driver_badges has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_invites'),
  'driver_invites has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_ratings'),
  'driver_ratings has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drivers'),
  'drivers has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'featured_section_items'),
  'featured_section_items has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'featured_sections'),
  'featured_sections has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'item_modifier_groups'),
  'item_modifier_groups has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'location_updates'),
  'location_updates has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'menu_categories'),
  'menu_categories has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'menu_items'),
  'menu_items has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modifier_groups'),
  'modifier_groups has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modifier_options'),
  'modifier_options has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_logs'),
  'notification_logs has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_audit_log'),
  'order_audit_log has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_item_modifiers'),
  'order_item_modifiers has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items'),
  'order_items has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders'),
  'orders has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles'),
  'profiles has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'route_stops'),
  'route_stops has RLS policies'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routes'),
  'routes has RLS policies'
);

-- webhook_events: RLS enabled but NO policies (intentional -- service-role only access)
SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events'),
  'webhook_events has no policies (service-role only, by design)'
);

-- ===========================================
-- SECTION 3: CRITICAL POLICY NAME VERIFICATION (8 tests)
-- Verify specific policies from migration 022 exist by name.
-- These are the 5 gap fixes applied in Phase 68 Plan 01.
-- ===========================================

-- app_settings: public SELECT (anon + authenticated)
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'app_settings_select'),
  'app_settings has public SELECT policy (anon + authenticated)'
);

-- order_audit_log: admin-only SELECT (replaces customer+admin dual SELECT)
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_audit_log' AND policyname = 'order_audit_log_select'),
  'order_audit_log has admin-only SELECT policy'
);

-- order_audit_log: admin-only INSERT (replaces open WITH CHECK (true))
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_audit_log' AND policyname = 'order_audit_log_insert'),
  'order_audit_log has admin-only INSERT policy'
);

-- order_audit_log: old customer SELECT removed
SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_audit_log' AND policyname = 'Customers can view own order audit logs'),
  'order_audit_log customer SELECT policy removed'
);

-- order_audit_log: old open INSERT removed
SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_audit_log' AND policyname = 'Authenticated users can insert audit logs'),
  'order_audit_log open INSERT policy removed'
);

-- customer_settings: UPDATE includes admin access
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_settings' AND policyname = 'customer_settings_update'),
  'customer_settings has UPDATE policy (own + admin)'
);

-- driver_badges: admin UPDATE policy
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_badges' AND policyname = 'driver_badges_update_admin'),
  'driver_badges has admin UPDATE policy'
);

-- featured_sections: public SELECT with initplan wrapper
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'featured_sections' AND policyname = 'featured_sections_select'),
  'featured_sections has public SELECT policy'
);

-- ===========================================
-- SECTION 4: NO UNINTENDED MULTIPLE PERMISSIVE POLICIES (3 tests)
-- Tables with multiple permissive SELECT policies for the same
-- operation should be intentional. Uses direct pg_policy query
-- (equivalent to testing.check_multiple_permissive_policies()).
-- ===========================================

-- order_audit_log should have at most 1 SELECT policy (admin only)
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policy pp
    JOIN pg_class pc ON pp.polrelid = pc.oid
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public'
      AND pc.relname = 'order_audit_log'
      AND pp.polcmd = 'r'  -- SELECT
      AND pp.polpermissive = true
    GROUP BY pc.relname, pp.polcmd
    HAVING COUNT(*) > 1
  ),
  'order_audit_log has no multiple permissive SELECT policies'
);

-- orders should not have multiple permissive SELECT policies
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policy pp
    JOIN pg_class pc ON pp.polrelid = pc.oid
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public'
      AND pc.relname = 'orders'
      AND pp.polcmd = 'r'  -- SELECT
      AND pp.polpermissive = true
    GROUP BY pc.relname, pp.polcmd
    HAVING COUNT(*) > 1
  ),
  'orders has no multiple permissive SELECT policies'
);

-- Intentional multiple permissive SELECT: driver_badges (own + admin) and
-- driver_invites (admin FOR ALL + own-email SELECT) are expected and acceptable.
-- We verify the overall count of tables with multiple permissive policies is
-- limited to only the known intentional cases.
SELECT ok(
  (
    SELECT COUNT(DISTINCT pc.relname) FROM pg_policy pp
    JOIN pg_class pc ON pp.polrelid = pc.oid
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public'
      AND pp.polcmd = 'r'  -- SELECT
      AND pp.polpermissive = true
    GROUP BY pc.relname, pp.polcmd
    HAVING COUNT(*) > 1
  ) IS NOT DISTINCT FROM NULL
  OR (
    SELECT COUNT(*) FROM (
      SELECT pc.relname
      FROM pg_policy pp
      JOIN pg_class pc ON pp.polrelid = pc.oid
      JOIN pg_namespace pn ON pc.relnamespace = pn.oid
      WHERE pn.nspname = 'public'
        AND pp.polcmd = 'r'
        AND pp.polpermissive = true
        AND pc.relname NOT IN ('driver_badges', 'driver_invites')
      GROUP BY pc.relname, pp.polcmd
      HAVING COUNT(*) > 1
    ) AS violations
  ) = 0,
  'No unintended multiple permissive SELECT policies (driver_badges, driver_invites excluded)'
);

-- ===========================================
-- SECTION 5: SECURITY DEFINER FUNCTIONS HAVE SECURE SEARCH PATH (1 test)
-- All SECURITY DEFINER functions in public/auth schemas must have
-- an explicit search_path setting to prevent search_path injection.
-- Uses direct pg_proc query (equivalent to testing.check_function_search_paths()).
-- ===========================================

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'auth')
      AND p.prokind = 'f'
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND p.prosecdef = true
      AND NOT (
        p.proconfig IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM unnest(p.proconfig) AS c
          WHERE c LIKE 'search_path=%'
        )
      )
  ),
  'All SECURITY DEFINER functions have secure search_path'
);

SELECT * FROM finish();
ROLLBACK;
