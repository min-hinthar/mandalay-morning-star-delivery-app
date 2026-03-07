-- ===========================================
-- 022: RLS Audit & Hardening
-- Fixes gaps from full database RLS audit
-- Phase 68: SEC-03, SEC-04, SEC-05
-- ===========================================
-- Changes:
-- 1. app_settings: add anon/public read
-- 2. order_audit_log: admin-only (remove customer SELECT, restrict INSERT)
-- 3. customer_settings: add admin UPDATE
-- 4. driver_badges: add admin UPDATE, initplan wrappers
-- 5. featured_sections/items: initplan wrappers, anon verification
-- 6. Rollback block (commented out)
-- ===========================================

-- ===========================================
-- 1. APP_SETTINGS: Add public/anon read
-- Per user decision: anon users can read app_settings (public storefront config).
-- Replaces admin-only SELECT with public SELECT.
-- Admin write policies (insert, update) remain unchanged.
-- ===========================================

DROP POLICY IF EXISTS "app_settings_admin_select" ON app_settings;

-- Anon + authenticated: all roles can read app_settings
CREATE POLICY "app_settings_select" ON app_settings
  FOR SELECT
  USING (true);

-- ===========================================
-- 2. ORDER_AUDIT_LOG: Admin-only access
-- Per user decision: admin-only, customers never see raw audit data.
-- Service-role bypasses RLS so server-side audit inserts still work.
-- ===========================================

-- Remove customer SELECT policy
DROP POLICY IF EXISTS "Customers can view own order audit logs" ON order_audit_log;

-- Remove old admin SELECT with raw EXISTS anti-pattern
DROP POLICY IF EXISTS "Admins can view all audit logs" ON order_audit_log;

-- Admin-only SELECT with initplan optimization
CREATE POLICY "order_audit_log_select" ON order_audit_log
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin()));

-- Remove open INSERT (was WITH CHECK (true) -- any authenticated user could insert)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON order_audit_log;

-- Admin-only INSERT with initplan optimization
-- Service-role via createServiceClient() bypasses RLS for server-side audit inserts
CREATE POLICY "order_audit_log_insert" ON order_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_admin()));

-- ===========================================
-- 3. CUSTOMER_SETTINGS: Add admin UPDATE
-- Per user decision: admin has full read/write to all customer settings for support.
-- Preserves customer own-update while adding admin capability.
-- ===========================================

DROP POLICY IF EXISTS "customer_settings_update" ON customer_settings;

CREATE POLICY "customer_settings_update" ON customer_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR (select public.is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select public.is_admin()));

-- Also fix customer_settings_select to use initplan wrapper on is_admin()
DROP POLICY IF EXISTS "customer_settings_select" ON customer_settings;

CREATE POLICY "customer_settings_select" ON customer_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR (select public.is_admin()));

-- ===========================================
-- 4. DRIVER_BADGES: Add UPDATE policy + initplan wrappers
-- Research found missing UPDATE policy. Badge metadata (icon, name) may need admin correction.
-- Also wrapping all function calls with (select ...) for initplan optimization.
-- ===========================================

-- Add admin-only UPDATE policy
DROP POLICY IF EXISTS "driver_badges_update_admin" ON driver_badges;

CREATE POLICY "driver_badges_update_admin" ON driver_badges
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- Recreate existing policies with initplan wrappers
DROP POLICY IF EXISTS "driver_badges_select_own" ON driver_badges;

CREATE POLICY "driver_badges_select_own" ON driver_badges
  FOR SELECT
  USING (driver_id = (select public.get_my_driver_id()));

DROP POLICY IF EXISTS "driver_badges_select_admin" ON driver_badges;

CREATE POLICY "driver_badges_select_admin" ON driver_badges
  FOR SELECT
  USING ((select public.is_admin()));

DROP POLICY IF EXISTS "driver_badges_insert_admin" ON driver_badges;

CREATE POLICY "driver_badges_insert_admin" ON driver_badges
  FOR INSERT
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "driver_badges_delete_admin" ON driver_badges;

CREATE POLICY "driver_badges_delete_admin" ON driver_badges
  FOR DELETE
  USING ((select public.is_admin()));

-- Add UPDATE grant (original migration 021 only granted SELECT, INSERT, DELETE)
GRANT UPDATE ON driver_badges TO authenticated;

-- ===========================================
-- 5. FEATURED_SECTIONS/ITEMS: Initplan wrappers + anon verification
-- Current SELECT policy has no TO clause which defaults to PUBLIC (includes anon).
-- This is correct per PostgreSQL behavior. Recreating with initplan wrappers
-- on is_admin() calls and adding explicit comments confirming anon intent.
-- ===========================================

-- featured_sections SELECT
-- Anon + authenticated: visible sections; admin: all including soft-deleted
DROP POLICY IF EXISTS "featured_sections_select" ON featured_sections;

CREATE POLICY "featured_sections_select" ON featured_sections
  FOR SELECT
  USING ((is_visible = true AND deleted_at IS NULL) OR (select public.is_admin()));

-- featured_sections write policies with initplan wrappers
DROP POLICY IF EXISTS "featured_sections_insert" ON featured_sections;

CREATE POLICY "featured_sections_insert" ON featured_sections
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "featured_sections_update" ON featured_sections;

CREATE POLICY "featured_sections_update" ON featured_sections
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()));

DROP POLICY IF EXISTS "featured_sections_delete" ON featured_sections;

CREATE POLICY "featured_sections_delete" ON featured_sections
  FOR DELETE
  TO authenticated
  USING ((select public.is_admin()));

-- featured_section_items SELECT
-- Anon + authenticated: items in visible sections; admin: all
DROP POLICY IF EXISTS "featured_section_items_select" ON featured_section_items;

CREATE POLICY "featured_section_items_select" ON featured_section_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM featured_sections fs
      WHERE fs.id = section_id
      AND (fs.is_visible = true AND fs.deleted_at IS NULL)
    )
    OR (select public.is_admin())
  );

-- featured_section_items write policies with initplan wrappers
DROP POLICY IF EXISTS "featured_section_items_insert" ON featured_section_items;

CREATE POLICY "featured_section_items_insert" ON featured_section_items
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "featured_section_items_update" ON featured_section_items;

CREATE POLICY "featured_section_items_update" ON featured_section_items
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()));

DROP POLICY IF EXISTS "featured_section_items_delete" ON featured_section_items;

CREATE POLICY "featured_section_items_delete" ON featured_section_items
  FOR DELETE
  TO authenticated
  USING ((select public.is_admin()));

-- ===========================================
-- ROLLBACK (uncomment to revert)
-- ===========================================
-- -- 1. app_settings: restore admin-only SELECT
-- DROP POLICY IF EXISTS "app_settings_select" ON app_settings;
-- CREATE POLICY "app_settings_admin_select" ON app_settings
--   FOR SELECT TO authenticated USING (public.is_admin());
--
-- -- 2. order_audit_log: restore customer SELECT and open INSERT
-- DROP POLICY IF EXISTS "order_audit_log_select" ON order_audit_log;
-- DROP POLICY IF EXISTS "order_audit_log_insert" ON order_audit_log;
-- CREATE POLICY "Admins can view all audit logs" ON order_audit_log
--   FOR SELECT TO authenticated
--   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
-- CREATE POLICY "Customers can view own order audit logs" ON order_audit_log
--   FOR SELECT TO authenticated
--   USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_audit_log.order_id AND orders.user_id = auth.uid()));
-- CREATE POLICY "Authenticated users can insert audit logs" ON order_audit_log
--   FOR INSERT TO authenticated WITH CHECK (true);
--
-- -- 3. customer_settings: restore own-only UPDATE, restore original SELECT
-- DROP POLICY IF EXISTS "customer_settings_update" ON customer_settings;
-- CREATE POLICY "customer_settings_update" ON customer_settings
--   FOR UPDATE TO authenticated
--   USING (user_id = (SELECT auth.uid()))
--   WITH CHECK (user_id = (SELECT auth.uid()));
-- DROP POLICY IF EXISTS "customer_settings_select" ON customer_settings;
-- CREATE POLICY "customer_settings_select" ON customer_settings
--   FOR SELECT TO authenticated
--   USING (user_id = (SELECT auth.uid()) OR public.is_admin());
--
-- -- 4. driver_badges: remove UPDATE policy, restore bare function calls
-- DROP POLICY IF EXISTS "driver_badges_update_admin" ON driver_badges;
-- DROP POLICY IF EXISTS "driver_badges_select_own" ON driver_badges;
-- DROP POLICY IF EXISTS "driver_badges_select_admin" ON driver_badges;
-- DROP POLICY IF EXISTS "driver_badges_insert_admin" ON driver_badges;
-- DROP POLICY IF EXISTS "driver_badges_delete_admin" ON driver_badges;
-- CREATE POLICY "driver_badges_select_own" ON driver_badges FOR SELECT USING (driver_id = public.get_my_driver_id());
-- CREATE POLICY "driver_badges_select_admin" ON driver_badges FOR SELECT USING (public.is_admin());
-- CREATE POLICY "driver_badges_insert_admin" ON driver_badges FOR INSERT WITH CHECK (public.is_admin());
-- CREATE POLICY "driver_badges_delete_admin" ON driver_badges FOR DELETE USING (public.is_admin());
-- REVOKE UPDATE ON driver_badges FROM authenticated;
--
-- -- 5. featured_sections/items: restore bare function calls
-- DROP POLICY IF EXISTS "featured_sections_select" ON featured_sections;
-- CREATE POLICY "featured_sections_select" ON featured_sections FOR SELECT USING ((is_visible = true AND deleted_at IS NULL) OR public.is_admin());
-- DROP POLICY IF EXISTS "featured_sections_insert" ON featured_sections;
-- CREATE POLICY "featured_sections_insert" ON featured_sections FOR INSERT WITH CHECK (public.is_admin());
-- DROP POLICY IF EXISTS "featured_sections_update" ON featured_sections;
-- CREATE POLICY "featured_sections_update" ON featured_sections FOR UPDATE USING (public.is_admin());
-- DROP POLICY IF EXISTS "featured_sections_delete" ON featured_sections;
-- CREATE POLICY "featured_sections_delete" ON featured_sections FOR DELETE USING (public.is_admin());
-- DROP POLICY IF EXISTS "featured_section_items_select" ON featured_section_items;
-- CREATE POLICY "featured_section_items_select" ON featured_section_items FOR SELECT USING (EXISTS (SELECT 1 FROM featured_sections fs WHERE fs.id = section_id AND (fs.is_visible = true AND fs.deleted_at IS NULL)) OR public.is_admin());
-- DROP POLICY IF EXISTS "featured_section_items_insert" ON featured_section_items;
-- CREATE POLICY "featured_section_items_insert" ON featured_section_items FOR INSERT WITH CHECK (public.is_admin());
-- DROP POLICY IF EXISTS "featured_section_items_update" ON featured_section_items;
-- CREATE POLICY "featured_section_items_update" ON featured_section_items FOR UPDATE USING (public.is_admin());
-- DROP POLICY IF EXISTS "featured_section_items_delete" ON featured_section_items;
-- CREATE POLICY "featured_section_items_delete" ON featured_section_items FOR DELETE USING (public.is_admin());
