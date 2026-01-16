-- ===========================================
-- Security Fixes Migration
-- Fixes: RLS recursion, function search_path, materialized view access
-- Date: 2026-01-22
-- ===========================================

-- ===========================================
-- 1. CREATE SECURE ADMIN CHECK FUNCTION
-- ===========================================
-- This function checks admin role without causing RLS recursion
-- by using SECURITY DEFINER to bypass RLS when checking the role

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Directly query profiles bypassing RLS (SECURITY DEFINER)
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(v_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ===========================================
-- 2. CREATE SECURE DRIVER CHECK FUNCTION
-- ===========================================
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(v_role = 'driver', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ===========================================
-- 3. FIX PROFILES POLICY RECURSION
-- ===========================================
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new admin policy using secure function
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- ===========================================
-- 4. FIX ALL ADMIN POLICIES TO USE SECURE FUNCTION
-- ===========================================

-- Orders policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (public.is_admin());

-- Order items policies
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (public.is_admin());

-- Order item modifiers policies
DROP POLICY IF EXISTS "Admins can view all order item modifiers" ON order_item_modifiers;

CREATE POLICY "Admins can view all order item modifiers"
  ON order_item_modifiers FOR SELECT
  USING (public.is_admin());

-- Menu categories policies
DROP POLICY IF EXISTS "Admins can view all categories" ON menu_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON menu_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON menu_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON menu_categories;

CREATE POLICY "Admins can view all categories"
  ON menu_categories FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert categories"
  ON menu_categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON menu_categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON menu_categories FOR DELETE
  USING (public.is_admin());

-- Menu items policies
DROP POLICY IF EXISTS "Admins can view all items" ON menu_items;
DROP POLICY IF EXISTS "Admins can insert items" ON menu_items;
DROP POLICY IF EXISTS "Admins can update items" ON menu_items;
DROP POLICY IF EXISTS "Admins can delete items" ON menu_items;

CREATE POLICY "Admins can view all items"
  ON menu_items FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert items"
  ON menu_items FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update items"
  ON menu_items FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete items"
  ON menu_items FOR DELETE
  USING (public.is_admin());

-- Modifier groups policies
DROP POLICY IF EXISTS "Admins can insert modifier groups" ON modifier_groups;
DROP POLICY IF EXISTS "Admins can update modifier groups" ON modifier_groups;
DROP POLICY IF EXISTS "Admins can delete modifier groups" ON modifier_groups;

CREATE POLICY "Admins can insert modifier groups"
  ON modifier_groups FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update modifier groups"
  ON modifier_groups FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete modifier groups"
  ON modifier_groups FOR DELETE
  USING (public.is_admin());

-- Modifier options policies
DROP POLICY IF EXISTS "Admins can insert modifier options" ON modifier_options;
DROP POLICY IF EXISTS "Admins can update modifier options" ON modifier_options;
DROP POLICY IF EXISTS "Admins can delete modifier options" ON modifier_options;

CREATE POLICY "Admins can insert modifier options"
  ON modifier_options FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update modifier options"
  ON modifier_options FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete modifier options"
  ON modifier_options FOR DELETE
  USING (public.is_admin());

-- Item modifier groups policies
DROP POLICY IF EXISTS "Admins can insert item modifier groups" ON item_modifier_groups;
DROP POLICY IF EXISTS "Admins can update item modifier groups" ON item_modifier_groups;
DROP POLICY IF EXISTS "Admins can delete item modifier groups" ON item_modifier_groups;

CREATE POLICY "Admins can insert item modifier groups"
  ON item_modifier_groups FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update item modifier groups"
  ON item_modifier_groups FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete item modifier groups"
  ON item_modifier_groups FOR DELETE
  USING (public.is_admin());

-- Drivers policies
DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;

CREATE POLICY "Admins can manage drivers"
  ON drivers FOR ALL
  USING (public.is_admin());

-- Routes policies
DROP POLICY IF EXISTS "Admins can manage routes" ON routes;

CREATE POLICY "Admins can manage routes"
  ON routes FOR ALL
  USING (public.is_admin());

-- Route stops policies
DROP POLICY IF EXISTS "Admins can manage route stops" ON route_stops;

CREATE POLICY "Admins can manage route stops"
  ON route_stops FOR ALL
  USING (public.is_admin());

-- Location updates policies
DROP POLICY IF EXISTS "Admins can read locations" ON location_updates;

CREATE POLICY "Admins can read locations"
  ON location_updates FOR SELECT
  USING (public.is_admin());

-- Delivery exceptions policies
DROP POLICY IF EXISTS "Admins can manage exceptions" ON delivery_exceptions;

CREATE POLICY "Admins can manage exceptions"
  ON delivery_exceptions FOR ALL
  USING (public.is_admin());

-- Notification logs policies
DROP POLICY IF EXISTS "Admins can manage notification logs" ON notification_logs;

CREATE POLICY "Admins can manage notification logs"
  ON notification_logs FOR ALL
  USING (public.is_admin());

-- Driver ratings policies
DROP POLICY IF EXISTS "Admins can manage ratings" ON driver_ratings;

CREATE POLICY "Admins can manage ratings"
  ON driver_ratings FOR ALL
  USING (public.is_admin());

-- ===========================================
-- 5. FIX FUNCTION SEARCH_PATH (IMMUTABLE)
-- ===========================================

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix test_rls_isolation
CREATE OR REPLACE FUNCTION test_rls_isolation()
RETURNS TEXT AS $$
DECLARE
  result TEXT := 'RLS Test Results: ';
BEGIN
  result := result || 'Use Supabase client to test cross-user access';
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix get_driver_latest_location
CREATE OR REPLACE FUNCTION get_driver_latest_location(p_driver_id UUID)
RETURNS TABLE (
  latitude NUMERIC,
  longitude NUMERIC,
  recorded_at TIMESTAMPTZ,
  accuracy NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lu.latitude,
    lu.longitude,
    lu.recorded_at,
    lu.accuracy
  FROM location_updates lu
  WHERE lu.driver_id = p_driver_id
  ORDER BY lu.recorded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix calculate_route_stats
CREATE OR REPLACE FUNCTION calculate_route_stats(p_route_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_stops', COUNT(*),
    'pending_stops', COUNT(*) FILTER (WHERE status = 'pending'),
    'delivered_stops', COUNT(*) FILTER (WHERE status = 'delivered'),
    'skipped_stops', COUNT(*) FILTER (WHERE status = 'skipped'),
    'completion_rate',
      CASE
        WHEN COUNT(*) > 0 THEN
          ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / COUNT(*)) * 100, 1)
        ELSE 0
      END
  ) INTO v_stats
  FROM route_stops
  WHERE route_id = p_route_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix refresh_analytics_views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY driver_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY delivery_metrics_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_driver_performance
CREATE OR REPLACE FUNCTION get_driver_performance(p_driver_id UUID)
RETURNS TABLE (
  total_deliveries BIGINT,
  deliveries_last_7_days BIGINT,
  deliveries_last_30_days BIGINT,
  on_time_rate NUMERIC,
  avg_rating NUMERIC,
  total_ratings BIGINT,
  total_exceptions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.total_deliveries,
    ds.deliveries_last_7_days,
    ds.deliveries_last_30_days,
    ds.on_time_rate,
    ds.avg_rating,
    ds.total_ratings,
    ds.total_exceptions
  FROM driver_stats_mv ds
  WHERE ds.driver_id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_driver_rating_avg
CREATE OR REPLACE FUNCTION update_driver_rating_avg()
RETURNS TRIGGER AS $$
DECLARE
  v_new_avg NUMERIC(3, 2);
BEGIN
  SELECT ROUND(AVG(rating)::NUMERIC, 2) INTO v_new_avg
  FROM driver_ratings
  WHERE driver_id = NEW.driver_id;

  UPDATE drivers
  SET
    rating_avg = COALESCE(v_new_avg, 0),
    updated_at = NOW()
  WHERE id = NEW.driver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_driver_deliveries_count
CREATE OR REPLACE FUNCTION update_driver_deliveries_count()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  SELECT r.driver_id INTO v_driver_id
  FROM routes r
  WHERE r.id = NEW.route_id;

  IF v_driver_id IS NOT NULL AND NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status != 'delivered') THEN
    UPDATE drivers
    SET
      deliveries_count = deliveries_count + 1,
      updated_at = NOW()
    WHERE id = v_driver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================
-- 6. RESTRICT MATERIALIZED VIEW ACCESS
-- ===========================================
-- Revoke public access - only admins should see analytics

REVOKE SELECT ON driver_stats_mv FROM authenticated;
REVOKE SELECT ON delivery_metrics_mv FROM authenticated;

-- Create secure wrapper functions for admin access
CREATE OR REPLACE FUNCTION get_driver_stats_admin()
RETURNS SETOF driver_stats_mv AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY SELECT * FROM driver_stats_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_delivery_metrics_admin()
RETURNS SETOF delivery_metrics_mv AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY SELECT * FROM delivery_metrics_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute on admin wrapper functions
GRANT EXECUTE ON FUNCTION get_driver_stats_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_delivery_metrics_admin TO authenticated;

-- Restrict refresh_analytics_views to admins
REVOKE EXECUTE ON FUNCTION refresh_analytics_views FROM authenticated;

CREATE OR REPLACE FUNCTION refresh_analytics_views_admin()
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  REFRESH MATERIALIZED VIEW CONCURRENTLY driver_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY delivery_metrics_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION refresh_analytics_views_admin TO authenticated;

-- ===========================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ===========================================
COMMENT ON FUNCTION public.is_admin() IS 'Secure admin role check that bypasses RLS to prevent recursion';
COMMENT ON FUNCTION public.is_driver() IS 'Secure driver role check that bypasses RLS to prevent recursion';
COMMENT ON FUNCTION get_driver_stats_admin() IS 'Admin-only access to driver statistics materialized view';
COMMENT ON FUNCTION get_delivery_metrics_admin() IS 'Admin-only access to delivery metrics materialized view';
COMMENT ON FUNCTION refresh_analytics_views_admin() IS 'Admin-only function to refresh analytics materialized views';
