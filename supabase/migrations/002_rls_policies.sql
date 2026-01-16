-- ===========================================
-- 002: Row Level Security Policies
-- SECURITY FIXES APPLIED:
-- - Lint 0003: Using (select auth.uid()) for initplan optimization
-- - Lint 0006: Consolidated multiple permissive policies
-- - Using secure role check functions to prevent recursion
-- ===========================================

-- ===========================================
-- 1. PROFILES
-- ===========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: user's own profile OR admin viewing all
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  id = (select auth.uid()) OR public.is_admin()
);

-- Users can update their own profile
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ===========================================
-- 2. ADDRESSES
-- ===========================================
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_select" ON addresses FOR SELECT
  USING (user_id = (select auth.uid()) OR public.is_admin());

CREATE POLICY "addresses_insert" ON addresses FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "addresses_update" ON addresses FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "addresses_delete" ON addresses FOR DELETE
  USING (user_id = (select auth.uid()));

-- ===========================================
-- 3. MENU_CATEGORIES (public read, admin write)
-- ===========================================
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Public can view active, admin can view all
CREATE POLICY "menu_categories_select" ON menu_categories FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "menu_categories_insert" ON menu_categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "menu_categories_update" ON menu_categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "menu_categories_delete" ON menu_categories FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 4. MENU_ITEMS (public read, admin write)
-- ===========================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public can view active, admin can view all
CREATE POLICY "menu_items_select" ON menu_items FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "menu_items_insert" ON menu_items FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "menu_items_update" ON menu_items FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "menu_items_delete" ON menu_items FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 5. MODIFIER_GROUPS (public read, admin write)
-- ===========================================
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modifier_groups_select" ON modifier_groups FOR SELECT USING (true);

CREATE POLICY "modifier_groups_insert" ON modifier_groups FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "modifier_groups_update" ON modifier_groups FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "modifier_groups_delete" ON modifier_groups FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 6. MODIFIER_OPTIONS (public read, admin write)
-- ===========================================
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modifier_options_select" ON modifier_options FOR SELECT USING (true);

CREATE POLICY "modifier_options_insert" ON modifier_options FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "modifier_options_update" ON modifier_options FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "modifier_options_delete" ON modifier_options FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 7. ITEM_MODIFIER_GROUPS (public read, admin write)
-- ===========================================
ALTER TABLE item_modifier_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_modifier_groups_select" ON item_modifier_groups FOR SELECT USING (true);

CREATE POLICY "item_modifier_groups_insert" ON item_modifier_groups FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "item_modifier_groups_update" ON item_modifier_groups FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "item_modifier_groups_delete" ON item_modifier_groups FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 8. ORDERS
-- ===========================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: user's own orders OR admin viewing all
CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  user_id = (select auth.uid()) OR public.is_admin()
);

-- Users can create their own orders
CREATE POLICY "orders_insert" ON orders FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Only admin can update orders
CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (public.is_admin());

-- ===========================================
-- 9. ORDER_ITEMS
-- ===========================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: user's own order items OR admin
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = (select auth.uid())
  )
  OR public.is_admin()
);

-- Users can insert items for their own orders
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

-- Consolidated SELECT: user's own order item modifiers OR admin
CREATE POLICY "order_item_modifiers_select" ON order_item_modifiers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM order_items
    JOIN orders ON orders.id = order_items.order_id
    WHERE order_items.id = order_item_modifiers.order_item_id
    AND orders.user_id = (select auth.uid())
  )
  OR public.is_admin()
);

-- Users can insert modifiers for their own order items
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

-- Consolidated SELECT: own driver profile OR admin
CREATE POLICY "drivers_select" ON drivers FOR SELECT USING (
  user_id = (select auth.uid()) OR public.is_admin()
);

-- Drivers can update their own profile
CREATE POLICY "drivers_update" ON drivers FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Only admin can insert/delete drivers
CREATE POLICY "drivers_insert" ON drivers FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "drivers_delete" ON drivers FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 12. ROUTES
-- ===========================================
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: assigned driver OR admin
CREATE POLICY "routes_select" ON routes FOR SELECT USING (
  driver_id = public.get_my_driver_id() OR public.is_admin()
);

-- Drivers can update their assigned routes
CREATE POLICY "routes_update" ON routes FOR UPDATE
  USING (driver_id = public.get_my_driver_id() OR public.is_admin())
  WITH CHECK (driver_id = public.get_my_driver_id() OR public.is_admin());

-- Only admin can insert/delete routes
CREATE POLICY "routes_insert" ON routes FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "routes_delete" ON routes FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 13. ROUTE_STOPS
-- ===========================================
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: driver's stops OR customer's order stop OR admin
CREATE POLICY "route_stops_select" ON route_stops FOR SELECT USING (
  -- Driver's own route stops
  EXISTS (
    SELECT 1 FROM routes r
    WHERE r.id = route_stops.route_id
    AND r.driver_id = public.get_my_driver_id()
  )
  -- Customer can see their order's stop (for tracking)
  OR EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = route_stops.order_id
    AND o.user_id = (select auth.uid())
  )
  -- Admin can see all
  OR public.is_admin()
);

-- Drivers can update stops on their routes
CREATE POLICY "route_stops_update" ON route_stops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routes r
      WHERE r.id = route_stops.route_id
      AND r.driver_id = public.get_my_driver_id()
    )
    OR public.is_admin()
  );

-- Only admin can insert/delete stops
CREATE POLICY "route_stops_insert" ON route_stops FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "route_stops_delete" ON route_stops FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 14. LOCATION_UPDATES
-- ===========================================
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: driver's own OR customer tracking their order OR admin
CREATE POLICY "location_updates_select" ON location_updates FOR SELECT USING (
  -- Driver's own locations
  driver_id = public.get_my_driver_id()
  -- Customer can see driver location for their active order
  OR EXISTS (
    SELECT 1 FROM route_stops rs
    JOIN routes r ON rs.route_id = r.id
    JOIN orders o ON rs.order_id = o.id
    WHERE o.user_id = (select auth.uid())
    AND r.status = 'in_progress'
    AND location_updates.route_id = r.id
  )
  -- Admin can see all
  OR public.is_admin()
);

-- Drivers can insert their own location
CREATE POLICY "location_updates_insert" ON location_updates FOR INSERT
  WITH CHECK (driver_id = public.get_my_driver_id());

-- ===========================================
-- 15. DELIVERY_EXCEPTIONS
-- ===========================================
ALTER TABLE delivery_exceptions ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: driver's own OR admin
CREATE POLICY "delivery_exceptions_select" ON delivery_exceptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM route_stops rs
    JOIN routes r ON rs.route_id = r.id
    WHERE rs.id = delivery_exceptions.route_stop_id
    AND r.driver_id = public.get_my_driver_id()
  )
  OR public.is_admin()
);

-- Drivers can create exceptions on their stops
CREATE POLICY "delivery_exceptions_insert" ON delivery_exceptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM route_stops rs
      JOIN routes r ON rs.route_id = r.id
      WHERE rs.id = delivery_exceptions.route_stop_id
      AND r.driver_id = public.get_my_driver_id()
    )
  );

-- Only admin can update/delete
CREATE POLICY "delivery_exceptions_update" ON delivery_exceptions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "delivery_exceptions_delete" ON delivery_exceptions FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 16. NOTIFICATION_LOGS
-- ===========================================
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: user's own OR admin
CREATE POLICY "notification_logs_select" ON notification_logs FOR SELECT USING (
  user_id = (select auth.uid()) OR public.is_admin()
);

-- Only admin can manage notification logs
CREATE POLICY "notification_logs_insert" ON notification_logs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "notification_logs_update" ON notification_logs FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "notification_logs_delete" ON notification_logs FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 17. DRIVER_RATINGS
-- ===========================================
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT: customer's own OR driver's own OR admin
CREATE POLICY "driver_ratings_select" ON driver_ratings FOR SELECT USING (
  -- Customer can see their own ratings
  EXISTS (
    SELECT 1 FROM orders WHERE id = driver_ratings.order_id AND user_id = (select auth.uid())
  )
  -- Driver can see their own ratings
  OR driver_id = public.get_my_driver_id()
  -- Admin can see all
  OR public.is_admin()
);

-- Customers can submit ratings for their delivered orders
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

-- Only admin can update/delete ratings
CREATE POLICY "driver_ratings_update" ON driver_ratings FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "driver_ratings_delete" ON driver_ratings FOR DELETE
  USING (public.is_admin());
