-- ===========================================
-- 002: Row Level Security Policies
-- SECURITY FIXES APPLIED:
-- - Lint 0003: Using (select auth.uid()) for initplan optimization
-- - Lint 0006: Consolidated multiple permissive policies
-- - Using secure role check functions to prevent recursion
-- - All policies idempotent with DROP POLICY IF EXISTS
-- ===========================================

-- ===========================================
-- 1. PROFILES
-- ===========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  id = (select auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ===========================================
-- 2. ADDRESSES
-- ===========================================
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select" ON addresses;
CREATE POLICY "addresses_select" ON addresses FOR SELECT
  USING (user_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "addresses_insert" ON addresses;
CREATE POLICY "addresses_insert" ON addresses FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "addresses_update" ON addresses;
CREATE POLICY "addresses_update" ON addresses FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "addresses_delete" ON addresses;
CREATE POLICY "addresses_delete" ON addresses FOR DELETE
  USING (user_id = (select auth.uid()));

-- ===========================================
-- 3. MENU_CATEGORIES (public read, admin write)
-- ===========================================
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_categories_select" ON menu_categories;
CREATE POLICY "menu_categories_select" ON menu_categories FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "menu_categories_insert" ON menu_categories;
CREATE POLICY "menu_categories_insert" ON menu_categories FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "menu_categories_update" ON menu_categories;
CREATE POLICY "menu_categories_update" ON menu_categories FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "menu_categories_delete" ON menu_categories;
CREATE POLICY "menu_categories_delete" ON menu_categories FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 4. MENU_ITEMS (public read, admin write)
-- ===========================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_items_select" ON menu_items;
CREATE POLICY "menu_items_select" ON menu_items FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "menu_items_insert" ON menu_items;
CREATE POLICY "menu_items_insert" ON menu_items FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "menu_items_update" ON menu_items;
CREATE POLICY "menu_items_update" ON menu_items FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "menu_items_delete" ON menu_items;
CREATE POLICY "menu_items_delete" ON menu_items FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 5. MODIFIER_GROUPS (public read, admin write)
-- ===========================================
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modifier_groups_select" ON modifier_groups;
CREATE POLICY "modifier_groups_select" ON modifier_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "modifier_groups_insert" ON modifier_groups;
CREATE POLICY "modifier_groups_insert" ON modifier_groups FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "modifier_groups_update" ON modifier_groups;
CREATE POLICY "modifier_groups_update" ON modifier_groups FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "modifier_groups_delete" ON modifier_groups;
CREATE POLICY "modifier_groups_delete" ON modifier_groups FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 6. MODIFIER_OPTIONS (public read, admin write)
-- ===========================================
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modifier_options_select" ON modifier_options;
CREATE POLICY "modifier_options_select" ON modifier_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "modifier_options_insert" ON modifier_options;
CREATE POLICY "modifier_options_insert" ON modifier_options FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "modifier_options_update" ON modifier_options;
CREATE POLICY "modifier_options_update" ON modifier_options FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "modifier_options_delete" ON modifier_options;
CREATE POLICY "modifier_options_delete" ON modifier_options FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 7. ITEM_MODIFIER_GROUPS (public read, admin write)
-- ===========================================
ALTER TABLE item_modifier_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "item_modifier_groups_select" ON item_modifier_groups;
CREATE POLICY "item_modifier_groups_select" ON item_modifier_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "item_modifier_groups_insert" ON item_modifier_groups;
CREATE POLICY "item_modifier_groups_insert" ON item_modifier_groups FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "item_modifier_groups_update" ON item_modifier_groups;
CREATE POLICY "item_modifier_groups_update" ON item_modifier_groups FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "item_modifier_groups_delete" ON item_modifier_groups;
CREATE POLICY "item_modifier_groups_delete" ON item_modifier_groups FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 8. ORDERS
-- ===========================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  user_id = (select auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (public.is_admin());

-- ===========================================
-- 9. ORDER_ITEMS
-- ===========================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = (select auth.uid())
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
    )
  );

-- ===========================================
-- 10. ORDER_ITEM_MODIFIERS
-- ===========================================
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_item_modifiers_select" ON order_item_modifiers;
CREATE POLICY "order_item_modifiers_select" ON order_item_modifiers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM order_items
    JOIN orders ON orders.id = order_items.order_id
    WHERE order_items.id = order_item_modifiers.order_item_id
    AND orders.user_id = (select auth.uid())
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "order_item_modifiers_insert" ON order_item_modifiers;
CREATE POLICY "order_item_modifiers_insert" ON order_item_modifiers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_modifiers.order_item_id
      AND orders.user_id = (select auth.uid())
    )
  );

-- ===========================================
-- 11. DRIVERS
-- ===========================================
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drivers_select" ON drivers;
CREATE POLICY "drivers_select" ON drivers FOR SELECT USING (
  user_id = (select auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "drivers_update" ON drivers;
CREATE POLICY "drivers_update" ON drivers FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "drivers_insert" ON drivers;
CREATE POLICY "drivers_insert" ON drivers FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "drivers_delete" ON drivers;
CREATE POLICY "drivers_delete" ON drivers FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 12. ROUTES
-- ===========================================
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "routes_select" ON routes;
CREATE POLICY "routes_select" ON routes FOR SELECT USING (
  driver_id = public.get_my_driver_id() OR public.is_admin()
);

DROP POLICY IF EXISTS "routes_update" ON routes;
CREATE POLICY "routes_update" ON routes FOR UPDATE
  USING (driver_id = public.get_my_driver_id() OR public.is_admin())
  WITH CHECK (driver_id = public.get_my_driver_id() OR public.is_admin());

DROP POLICY IF EXISTS "routes_insert" ON routes;
CREATE POLICY "routes_insert" ON routes FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "routes_delete" ON routes;
CREATE POLICY "routes_delete" ON routes FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 13. ROUTE_STOPS
-- ===========================================
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "route_stops_select" ON route_stops;
CREATE POLICY "route_stops_select" ON route_stops FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM routes r
    WHERE r.id = route_stops.route_id
    AND r.driver_id = public.get_my_driver_id()
  )
  OR EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = route_stops.order_id
    AND o.user_id = (select auth.uid())
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "route_stops_update" ON route_stops;
CREATE POLICY "route_stops_update" ON route_stops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routes r
      WHERE r.id = route_stops.route_id
      AND r.driver_id = public.get_my_driver_id()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "route_stops_insert" ON route_stops;
CREATE POLICY "route_stops_insert" ON route_stops FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "route_stops_delete" ON route_stops;
CREATE POLICY "route_stops_delete" ON route_stops FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 14. LOCATION_UPDATES
-- ===========================================
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "location_updates_select" ON location_updates;
CREATE POLICY "location_updates_select" ON location_updates FOR SELECT USING (
  driver_id = public.get_my_driver_id()
  OR EXISTS (
    SELECT 1 FROM route_stops rs
    JOIN routes r ON rs.route_id = r.id
    JOIN orders o ON rs.order_id = o.id
    WHERE o.user_id = (select auth.uid())
    AND r.status = 'in_progress'
    AND location_updates.route_id = r.id
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "location_updates_insert" ON location_updates;
CREATE POLICY "location_updates_insert" ON location_updates FOR INSERT
  WITH CHECK (driver_id = public.get_my_driver_id());

-- ===========================================
-- 15. DELIVERY_EXCEPTIONS
-- ===========================================
ALTER TABLE delivery_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_exceptions_select" ON delivery_exceptions;
CREATE POLICY "delivery_exceptions_select" ON delivery_exceptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM route_stops rs
    JOIN routes r ON rs.route_id = r.id
    WHERE rs.id = delivery_exceptions.route_stop_id
    AND r.driver_id = public.get_my_driver_id()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "delivery_exceptions_insert" ON delivery_exceptions;
CREATE POLICY "delivery_exceptions_insert" ON delivery_exceptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM route_stops rs
      JOIN routes r ON rs.route_id = r.id
      WHERE rs.id = delivery_exceptions.route_stop_id
      AND r.driver_id = public.get_my_driver_id()
    )
  );

DROP POLICY IF EXISTS "delivery_exceptions_update" ON delivery_exceptions;
CREATE POLICY "delivery_exceptions_update" ON delivery_exceptions FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "delivery_exceptions_delete" ON delivery_exceptions;
CREATE POLICY "delivery_exceptions_delete" ON delivery_exceptions FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 16. NOTIFICATION_LOGS
-- ===========================================
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_logs_select" ON notification_logs;
CREATE POLICY "notification_logs_select" ON notification_logs FOR SELECT USING (
  user_id = (select auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "notification_logs_insert" ON notification_logs;
CREATE POLICY "notification_logs_insert" ON notification_logs FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "notification_logs_update" ON notification_logs;
CREATE POLICY "notification_logs_update" ON notification_logs FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "notification_logs_delete" ON notification_logs;
CREATE POLICY "notification_logs_delete" ON notification_logs FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 17. DRIVER_RATINGS
-- ===========================================
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_ratings_select" ON driver_ratings;
CREATE POLICY "driver_ratings_select" ON driver_ratings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE id = driver_ratings.order_id AND user_id = (select auth.uid())
  )
  OR driver_id = public.get_my_driver_id()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "driver_ratings_insert" ON driver_ratings;
CREATE POLICY "driver_ratings_insert" ON driver_ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN route_stops rs ON rs.order_id = o.id
      WHERE o.id = driver_ratings.order_id
      AND o.user_id = (select auth.uid())
      AND rs.status = 'delivered'
    )
  );

DROP POLICY IF EXISTS "driver_ratings_update" ON driver_ratings;
CREATE POLICY "driver_ratings_update" ON driver_ratings FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "driver_ratings_delete" ON driver_ratings;
CREATE POLICY "driver_ratings_delete" ON driver_ratings FOR DELETE
  USING (public.is_admin());
