# Task: V0-004 — Row Level Security (RLS) Policies

> **Priority**: P0 (Blocking)
> **Milestone**: V0 — Skeleton
> **Depends On**: V0-003 (Auth Integration)
> **Branch**: `project-init`

---

## Objective

Implement Row Level Security policies on all database tables to ensure users can only access their own data. Menu data should be publicly readable, while user-specific data (profiles, addresses, orders) must be isolated per user.

---

## Acceptance Criteria

- [ ] RLS enabled on all public tables
- [ ] Users can only read/update their own profile
- [ ] Users can only CRUD their own addresses
- [ ] Users can only read their own orders
- [ ] Menu data (categories, items, modifiers) publicly readable
- [ ] Service role bypasses RLS for admin operations
- [ ] Cross-user access test fails (User A cannot see User B's data)

---

## Technical Specification

### 1. Create RLS Migration

Create `supabase/migrations/20260112000002_rls_policies.sql`:

```sql
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
```

### 2. RLS Test Helper Functions

Add to migration or create separate test file:

```sql
-- Helper function to test RLS (for development)
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
```

---

## Test Plan

### Cross-User Isolation Test

Create a test script or manually test:

```typescript
// Test script concept (run in Node or via API route)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testRLSIsolation() {
  // 1. Create User A and User B (via auth)
  // 2. Log in as User A
  // 3. Create an address for User A
  // 4. Log out
  // 5. Log in as User B
  // 6. Try to read User A's address
  // 7. Should return empty array (not User A's data)

  console.log("RLS Isolation Test");

  // As User B, try to query addresses
  const { data, error } = await supabase
    .from("addresses")
    .select("*");

  // Should only see User B's addresses (or empty if none)
  console.log("Addresses visible to current user:", data);
  console.log("Error:", error);
}
```

### Manual Testing Checklist

1. **Profile Isolation**
   - [ ] User A logs in → can see own profile
   - [ ] User A cannot query other profiles by ID
   - [ ] User A can update own profile

2. **Address Isolation**
   - [ ] User A can create address
   - [ ] User A can read own addresses
   - [ ] User A cannot read User B's addresses
   - [ ] User A can update/delete own addresses

3. **Menu Public Access**
   - [ ] Unauthenticated user can read menu_categories
   - [ ] Unauthenticated user can read menu_items
   - [ ] Unauthenticated user can read modifier_groups/options

4. **Order Isolation**
   - [ ] User A can create order
   - [ ] User A can read own orders
   - [ ] User A cannot read User B's orders
   - [ ] User A cannot update orders (admin only)

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] RLS migration applied successfully
2. [ ] All tables have RLS enabled
3. [ ] Profile policies: read/update own only
4. [ ] Address policies: full CRUD own only
5. [ ] Menu policies: public read
6. [ ] Order policies: read/insert own only
7. [ ] Admin policies: view/update all orders
8. [ ] Cross-user isolation verified manually
9. [ ] Service role can bypass RLS
10. [ ] `pnpm lint` passes
11. [ ] `pnpm typecheck` passes
12. [ ] `pnpm build` succeeds
13. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- RLS uses `auth.uid()` which returns the current user's ID from JWT
- Service role (using `SUPABASE_SERVICE_ROLE_KEY`) bypasses all RLS
- The admin check queries the `profiles` table for role
- Order items/modifiers use JOIN to check ownership via parent order
- Menu data is public read but admin-only write (via service role)

---

## Security Considerations

1. **Never expose service role key to client**
2. **Always use anon key for client-side queries**
3. **RLS is the last line of defense** - also validate in application code
4. **Test isolation with two real user accounts**
5. **Review policies after any schema changes**

---

*Task created: 2026-01-12 | Ready for implementation*
