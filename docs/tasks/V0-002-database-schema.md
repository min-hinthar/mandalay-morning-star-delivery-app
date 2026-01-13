# Task: V0-002 — Database Schema & Migrations

> **Priority**: P0 (Blocking)
> **Milestone**: V0 — Skeleton
> **Depends On**: V0-001 (Scaffold) ✅
> **Branch**: `project-init`

---

## Objective

Create the complete database schema for the Mandalay Morning Star application using Supabase migrations. This includes tables for user profiles, delivery addresses, menu system (categories, items, modifiers), and order management.

---

## Acceptance Criteria

- [ ] All 10 tables created with proper constraints
- [ ] Foreign keys with appropriate ON DELETE behavior
- [ ] Indexes on frequently queried columns (user_id, category_id, order_id, slugs)
- [ ] TypeScript types generated and exported (`src/types/database.ts`)
- [ ] Migrations run successfully on fresh Supabase project
- [ ] Profile trigger function created (for V0-003)

---

## Technical Specification

### 1. Create Migration File

Create `supabase/migrations/20260112000001_initial_schema.sql`:

```sql
-- ===========================================
-- V0-002: Initial Database Schema
-- ===========================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. PROFILES (extends auth.users)
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'driver')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ===========================================
-- 2. ADDRESSES (user delivery addresses)
-- ===========================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CA',
  zip_code TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- ===========================================
-- 3. MENU_CATEGORIES
-- ===========================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON menu_categories(sort_order);

-- ===========================================
-- 4. MENU_ITEMS
-- ===========================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_my TEXT,
  description_en TEXT,
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_sold_out BOOLEAN NOT NULL DEFAULT false,
  allergens TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active) WHERE is_active = true;

-- ===========================================
-- 5. MODIFIER_GROUPS
-- ===========================================
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  selection_type TEXT NOT NULL DEFAULT 'single' CHECK (selection_type IN ('single', 'multiple')),
  min_select INTEGER NOT NULL DEFAULT 0,
  max_select INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- 6. MODIFIER_OPTIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS modifier_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_delta_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for group lookups
CREATE INDEX IF NOT EXISTS idx_modifier_options_group ON modifier_options(group_id);

-- ===========================================
-- 7. ITEM_MODIFIER_GROUPS (join table)
-- ===========================================
CREATE TABLE IF NOT EXISTS item_modifier_groups (
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, group_id)
);

-- Index for item lookups
CREATE INDEX IF NOT EXISTS idx_item_modifier_groups_item ON item_modifier_groups(item_id);

-- ===========================================
-- 8. ORDERS
-- ===========================================
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  delivery_window_start TIMESTAMPTZ,
  delivery_window_end TIMESTAMPTZ,
  special_instructions TEXT,
  stripe_payment_intent_id TEXT,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at DESC);

-- ===========================================
-- 9. ORDER_ITEMS (snapshot)
-- ===========================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  base_price_snapshot INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0),
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for order lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ===========================================
-- 10. ORDER_ITEM_MODIFIERS (snapshot)
-- ===========================================
CREATE TABLE IF NOT EXISTS order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_option_id UUID REFERENCES modifier_options(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  price_delta_snapshot INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for order_item lookups
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_item ON order_item_modifiers(order_item_id);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- PROFILE TRIGGER (for auth signup)
-- ===========================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2. Generate TypeScript Types

After applying migration, generate types:

```bash
# If using Supabase CLI locally
pnpm supabase gen types typescript --local > src/types/database.ts

# Or from remote project
pnpm supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### 3. Update database.ts

Replace the placeholder in `src/types/database.ts` with generated types. The file should export:

```typescript
export type Database = {
  public: {
    Tables: {
      profiles: { /* ... */ };
      addresses: { /* ... */ };
      menu_categories: { /* ... */ };
      menu_items: { /* ... */ };
      modifier_groups: { /* ... */ };
      modifier_options: { /* ... */ };
      item_modifier_groups: { /* ... */ };
      orders: { /* ... */ };
      order_items: { /* ... */ };
      order_item_modifiers: { /* ... */ };
    };
    Enums: {
      order_status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
    };
  };
};
```

---

## Test Plan

### Migration Test

```bash
# Reset and apply migrations
pnpm supabase db reset

# Verify tables exist
pnpm supabase db query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
```

Expected tables:
- profiles
- addresses
- menu_categories
- menu_items
- modifier_groups
- modifier_options
- item_modifier_groups
- orders
- order_items
- order_item_modifiers

### Trigger Test

```sql
-- In Supabase SQL editor, verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Build Verification

```bash
pnpm typecheck  # Should pass with new types
pnpm build      # Should complete without errors
```

---

## Definition of Done

1. [ ] Migration file created at `supabase/migrations/20260112000001_initial_schema.sql`
2. [ ] All 10 tables created with constraints
3. [ ] Indexes added for performance
4. [ ] TypeScript types generated and exported
5. [ ] `update_updated_at` triggers working
6. [ ] `handle_new_user` trigger created for auth
7. [ ] `pnpm typecheck` passes
8. [ ] `pnpm build` succeeds
9. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Use `IF NOT EXISTS` for idempotent migrations
- The `order_status` enum is used instead of TEXT for type safety
- Foreign keys use `ON DELETE CASCADE` for user data, `ON DELETE RESTRICT` for orders (preserve history)
- Snapshot fields in order_items preserve pricing at order time
- The profile trigger uses `SECURITY DEFINER` to bypass RLS during signup

---

*Task created: 2026-01-12 | Ready for implementation*
