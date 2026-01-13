-- ===========================================
-- V0-004: Row Level Security Policies
-- ===========================================

-- ===========================================
-- 1. PROFILES
-- ===========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profile insert handled by trigger (SECURITY DEFINER)
-- No direct insert policy needed for users

-- ===========================================
-- 2. ADDRESSES
-- ===========================================
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- 3. MENU_CATEGORIES (public read)
-- ===========================================
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "Public can view active categories"
  ON menu_categories FOR SELECT
  USING (is_active = true);

-- Admin can manage categories (via service role)
-- No user policies for INSERT/UPDATE/DELETE

-- ===========================================
-- 4. MENU_ITEMS (public read)
-- ===========================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active items
CREATE POLICY "Public can view active items"
  ON menu_items FOR SELECT
  USING (is_active = true);

-- Admin can manage items (via service role)

-- ===========================================
-- 5. MODIFIER_GROUPS (public read)
-- ===========================================
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can read modifier groups
CREATE POLICY "Public can view modifier groups"
  ON modifier_groups FOR SELECT
  USING (true);

-- ===========================================
-- 6. MODIFIER_OPTIONS (public read)
-- ===========================================
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;

-- Anyone can read modifier options
CREATE POLICY "Public can view modifier options"
  ON modifier_options FOR SELECT
  USING (true);

-- ===========================================
-- 7. ITEM_MODIFIER_GROUPS (public read)
-- ===========================================
ALTER TABLE item_modifier_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can read item-modifier relationships
CREATE POLICY "Public can view item modifier groups"
  ON item_modifier_groups FOR SELECT
  USING (true);

-- ===========================================
-- 8. ORDERS
-- ===========================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert orders (checkout creates order)
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update orders (only admin via service role)
-- Users cannot delete orders

-- ===========================================
-- 9. ORDER_ITEMS
-- ===========================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can view items for their own orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Users can insert items for their own orders
CREATE POLICY "Users can create own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ===========================================
-- 10. ORDER_ITEM_MODIFIERS
-- ===========================================
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;

-- Users can view modifiers for their own order items
CREATE POLICY "Users can view own order item modifiers"
  ON order_item_modifiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_modifiers.order_item_id
      AND orders.user_id = auth.uid()
    )
  );

-- Users can insert modifiers for their own order items
CREATE POLICY "Users can create own order item modifiers"
  ON order_item_modifiers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_modifiers.order_item_id
      AND orders.user_id = auth.uid()
    )
  );

-- ===========================================
-- GRANT SERVICE ROLE BYPASS
-- ===========================================
-- Note: Service role automatically bypasses RLS in Supabase.
-- No additional grants needed.

-- ===========================================
-- ADMIN ROLE POLICIES (for future admin dashboard)
-- ===========================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update orders
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all order item modifiers
CREATE POLICY "Admins can view all order item modifiers"
  ON order_item_modifiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ===========================================
-- RLS TEST HELPER FUNCTION
-- ===========================================
CREATE OR REPLACE FUNCTION test_rls_isolation()
RETURNS TEXT AS $$
DECLARE
  result TEXT := 'RLS Test Results: ';
BEGIN
  -- This function is for documentation purposes
  -- Actual testing done via Supabase client
  result := result || 'Use Supabase client to test cross-user access';
  RETURN result;
END;
$$ LANGUAGE plpgsql;
