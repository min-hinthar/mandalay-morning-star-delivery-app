-- ===========================================
-- 001: Functions and Triggers
-- Helper functions, triggers, auth hooks
-- All SECURITY DEFINER functions have search_path set
-- ===========================================

-- ===========================================
-- 1. UPDATE_UPDATED_AT TRIGGER FUNCTION
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_stops_updated_at
  BEFORE UPDATE ON route_stops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 2. AUTH USER SIGNUP HANDLER
-- ===========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- 3. SECURE ROLE CHECK FUNCTIONS
-- These bypass RLS to prevent recursion in policies
-- ===========================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = (select auth.uid());
  RETURN COALESCE(v_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Check if current user is driver
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = (select auth.uid());
  RETURN COALESCE(v_role = 'driver', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Get current user's driver_id (if they are a driver)
CREATE OR REPLACE FUNCTION public.get_my_driver_id()
RETURNS UUID AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  SELECT id INTO v_driver_id
  FROM public.drivers
  WHERE user_id = (select auth.uid());
  RETURN v_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ===========================================
-- 4. DRIVER HELPER FUNCTIONS
-- ===========================================

-- Get driver's latest location
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

-- Calculate route stats
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
      CASE WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0 END
  ) INTO v_stats
  FROM route_stops
  WHERE route_id = p_route_id;
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================
-- 5. DRIVER RATING TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION update_driver_rating_avg()
RETURNS TRIGGER AS $$
DECLARE
  v_new_avg NUMERIC(3, 2);
BEGIN
  SELECT ROUND(AVG(rating)::NUMERIC, 2) INTO v_new_avg
  FROM driver_ratings
  WHERE driver_id = NEW.driver_id;

  UPDATE drivers
  SET rating_avg = COALESCE(v_new_avg, 0), updated_at = NOW()
  WHERE id = NEW.driver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_driver_rating ON driver_ratings;
CREATE TRIGGER trg_update_driver_rating
  AFTER INSERT OR UPDATE OR DELETE ON driver_ratings
  FOR EACH ROW EXECUTE FUNCTION update_driver_rating_avg();

-- ===========================================
-- 6. DRIVER DELIVERIES COUNT TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION update_driver_deliveries_count()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  SELECT r.driver_id INTO v_driver_id
  FROM routes r WHERE r.id = NEW.route_id;

  IF v_driver_id IS NOT NULL AND NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status != 'delivered') THEN
    UPDATE drivers
    SET deliveries_count = deliveries_count + 1, updated_at = NOW()
    WHERE id = v_driver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_driver_deliveries ON route_stops;
CREATE TRIGGER trg_update_driver_deliveries
  AFTER INSERT OR UPDATE ON route_stops
  FOR EACH ROW EXECUTE FUNCTION update_driver_deliveries_count();

-- ===========================================
-- 7. GRANT EXECUTE ON HELPER FUNCTIONS
-- ===========================================
GRANT EXECUTE ON FUNCTION get_driver_latest_location TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_route_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_driver TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_driver_id TO authenticated;

-- ===========================================
-- 8. COMMENTS
-- ===========================================
COMMENT ON FUNCTION public.is_admin() IS 'Secure admin role check - bypasses RLS to prevent recursion';
COMMENT ON FUNCTION public.is_driver() IS 'Secure driver role check - bypasses RLS to prevent recursion';
COMMENT ON FUNCTION public.get_my_driver_id() IS 'Get current user driver_id - bypasses RLS';
