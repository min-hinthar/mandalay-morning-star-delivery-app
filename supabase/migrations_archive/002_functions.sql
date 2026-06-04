-- ===========================================
-- 002: Functions, Triggers, Grants
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

-- Apply updated_at triggers to all tables with updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_routes_updated_at ON routes;
CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_route_stops_updated_at ON route_stops;
CREATE TRIGGER update_route_stops_updated_at
  BEFORE UPDATE ON route_stops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_featured_sections_updated_at ON featured_sections;
CREATE TRIGGER update_featured_sections_updated_at
  BEFORE UPDATE ON featured_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_settings_updated_at ON customer_settings;
CREATE TRIGGER update_customer_settings_updated_at
  BEFORE UPDATE ON customer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- 3. SECURE ROLE CHECK FUNCTIONS (bypass RLS)
-- ===========================================

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

COMMENT ON FUNCTION public.is_admin() IS 'Secure admin role check - bypasses RLS to prevent recursion';
COMMENT ON FUNCTION public.is_driver() IS 'Secure driver role check - bypasses RLS to prevent recursion';
COMMENT ON FUNCTION public.get_my_driver_id() IS 'Get current user driver_id - bypasses RLS';

-- ===========================================
-- 4. DRIVER HELPER FUNCTIONS
-- ===========================================

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
-- 7. REFUND STATUS TRIGGER (from 028)
-- ===========================================
CREATE OR REPLACE FUNCTION compute_order_refund_status()
RETURNS TRIGGER AS $$
DECLARE
  total_qty integer;
  total_refunded integer;
BEGIN
  SELECT
    COALESCE(SUM(quantity), 0),
    COALESCE(SUM(COALESCE(refunded_quantity, 0)), 0)
  INTO total_qty, total_refunded
  FROM order_items
  WHERE order_id = NEW.order_id;

  UPDATE orders
  SET refund_status = CASE
    WHEN total_refunded = 0 THEN 'none'
    WHEN total_refunded >= total_qty THEN 'full'
    ELSE 'partial'
  END
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_refund_status
AFTER UPDATE OF refunded_quantity ON order_items
FOR EACH ROW EXECUTE FUNCTION compute_order_refund_status();

-- ===========================================
-- 8. IMAGE_UPDATED_AT TRIGGER (from 033)
-- ===========================================
CREATE OR REPLACE FUNCTION update_image_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.image_url IS DISTINCT FROM NEW.image_url THEN
    NEW.image_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_menu_items_image_updated ON menu_items;
CREATE TRIGGER trg_menu_items_image_updated
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_image_updated_at();

-- ===========================================
-- 9. DELETE MENU ITEM PHOTO TRIGGER (from 007)
-- ===========================================
CREATE OR REPLACE FUNCTION delete_menu_item_photo()
RETURNS TRIGGER AS $$
DECLARE
  v_path TEXT;
BEGIN
  IF OLD.image_url IS NOT NULL AND OLD.image_url LIKE '%menu-photos/%' THEN
    v_path := substring(OLD.image_url FROM 'menu-photos/(.+)$');
    IF v_path IS NOT NULL THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'menu-photos'
        AND name = v_path;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage;

DROP TRIGGER IF EXISTS trg_delete_menu_item_photo ON menu_items;
CREATE TRIGGER trg_delete_menu_item_photo
  BEFORE DELETE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION delete_menu_item_photo();

COMMENT ON FUNCTION delete_menu_item_photo() IS 'Cascade delete menu item photos from storage when menu item is deleted';

-- ===========================================
-- 10. DELIVERY_DATE IMMUTABLE FUNCTION (from 035)
-- ===========================================
CREATE OR REPLACE FUNCTION public.delivery_date(ts TIMESTAMPTZ)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
AS $$ SELECT (ts AT TIME ZONE 'America/Los_Angeles')::date $$;

-- ===========================================
-- 11. CREATE_ORDER_WITH_ITEMS v2 (from 035 — with tip/promo/discount)
-- ===========================================
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_order JSONB,
  p_items JSONB,
  p_modifiers JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item_ids UUID[];
  v_item JSONB;
  v_modifier JSONB;
  v_inserted_id UUID;
  v_result JSONB;
BEGIN
  -- Insert order (total_cents = subtotal + delivery + tax + tip - discount)
  INSERT INTO orders (
    user_id, address_id, status,
    subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
    tip_cents, promo_code, discount_cents,
    delivery_window_start, delivery_window_end,
    special_instructions, delivery_instructions
  ) VALUES (
    (p_order->>'user_id')::UUID,
    (p_order->>'address_id')::UUID,
    'pending',
    (p_order->>'subtotal_cents')::INTEGER,
    (p_order->>'delivery_fee_cents')::INTEGER,
    (p_order->>'tax_cents')::INTEGER,
    (p_order->>'total_cents')::INTEGER,
    COALESCE((p_order->>'tip_cents')::INTEGER, 0),
    p_order->>'promo_code',
    COALESCE((p_order->>'discount_cents')::INTEGER, 0),
    (p_order->>'delivery_window_start')::TIMESTAMPTZ,
    (p_order->>'delivery_window_end')::TIMESTAMPTZ,
    p_order->>'special_instructions',
    p_order->>'delivery_instructions'
  )
  RETURNING id INTO v_order_id;

  -- Insert order items and collect their IDs
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, menu_item_id, name_snapshot,
      base_price_snapshot, quantity, line_total_cents, special_instructions
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      v_item->>'name_snapshot',
      (v_item->>'base_price_snapshot')::INTEGER,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'line_total_cents')::INTEGER,
      v_item->>'special_instructions'
    )
    RETURNING id INTO v_inserted_id;
    v_item_ids := array_append(v_item_ids, v_inserted_id);
  END LOOP;

  -- Insert modifiers (referencing order_item IDs by index)
  FOR v_modifier IN SELECT * FROM jsonb_array_elements(p_modifiers)
  LOOP
    INSERT INTO order_item_modifiers (
      order_item_id, modifier_option_id,
      name_snapshot, price_delta_snapshot
    ) VALUES (
      v_item_ids[(v_modifier->>'item_index')::INTEGER + 1],
      (v_modifier->>'modifier_option_id')::UUID,
      v_modifier->>'name_snapshot',
      (v_modifier->>'price_delta_snapshot')::INTEGER
    );
  END LOOP;

  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'order_item_ids', to_jsonb(v_item_ids)
  );
  RETURN v_result;
END;
$$;

-- ===========================================
-- 12. DRIVER GAMIFICATION FUNCTIONS (from 021)
-- ===========================================

CREATE OR REPLACE FUNCTION calculate_driver_streak(p_driver_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_route BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM routes
    WHERE driver_id = p_driver_id
      AND delivery_date = CURRENT_DATE
      AND status IN ('in_progress', 'completed')
  ) INTO v_has_route;

  IF v_has_route THEN
    v_streak := 1;
  END IF;

  v_check_date := CURRENT_DATE - 1;
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM routes
      WHERE driver_id = p_driver_id
        AND delivery_date = v_check_date
        AND status = 'completed'
    ) INTO v_has_route;

    EXIT WHEN NOT v_has_route;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  RETURN v_streak;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_driver_weekly_deliveries(p_driver_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_week_start DATE;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM route_stops rs
  JOIN routes r ON r.id = rs.route_id
  WHERE r.driver_id = p_driver_id
    AND r.delivery_date >= v_week_start
    AND r.delivery_date < v_week_start + 7
    AND rs.status = 'delivered';
  RETURN v_count;
END;
$$;

-- ===========================================
-- 13. ANALYTICS FUNCTIONS (from 003)
-- ===========================================

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  REFRESH MATERIALIZED VIEW CONCURRENTLY driver_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY delivery_metrics_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
  IF NOT public.is_admin() AND p_driver_id != public.get_my_driver_id() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
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

COMMENT ON FUNCTION refresh_analytics_views() IS 'Admin-only function to refresh analytics views';
COMMENT ON FUNCTION get_driver_stats_admin() IS 'Admin-only access to driver statistics';
COMMENT ON FUNCTION get_delivery_metrics_admin() IS 'Admin-only access to delivery metrics';

-- ===========================================
-- 14. GRANTS & REVOKES
-- ===========================================

-- Helper functions
GRANT EXECUTE ON FUNCTION get_driver_latest_location TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_route_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_driver TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_driver_id TO authenticated;

-- Analytics functions
GRANT EXECUTE ON FUNCTION refresh_analytics_views TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_stats_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_delivery_metrics_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_performance TO authenticated;

-- Order function
GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated;

-- Gamification functions
GRANT EXECUTE ON FUNCTION calculate_driver_streak TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_driver_weekly_deliveries TO authenticated;

-- Driver badges table grants
GRANT SELECT, INSERT, UPDATE, DELETE ON driver_badges TO authenticated;

-- Revoke direct access to materialized views
REVOKE ALL ON driver_stats_mv FROM authenticated;
REVOKE ALL ON delivery_metrics_mv FROM authenticated;
