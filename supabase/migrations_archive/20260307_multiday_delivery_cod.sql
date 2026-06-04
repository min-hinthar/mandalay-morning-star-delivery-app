-- ===========================================
-- Multi-Day Delivery + Cash on Delivery (COD)
--
-- 1. delivery_days table (per-day schedule config)
-- 2. Add pending_approval to order_status enum
-- 3. Add payment_method + COD columns to orders
-- 4. Update create_order_with_items RPC for COD
-- 5. Seed delivery days + COD settings
-- ===========================================

-- ===========================================
-- 1. DELIVERY_DAYS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS delivery_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL UNIQUE CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_active BOOLEAN NOT NULL DEFAULT false,
  cutoff_day INTEGER NOT NULL CHECK (cutoff_day >= 0 AND cutoff_day <= 6),
  cutoff_hour INTEGER NOT NULL DEFAULT 15 CHECK (cutoff_hour >= 0 AND cutoff_hour <= 23),
  delivery_fee_cents INTEGER NOT NULL DEFAULT 1500 CHECK (delivery_fee_cents >= 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE delivery_days ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_delivery_days_all" ON delivery_days
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Authenticated users: read active days only
CREATE POLICY "authenticated_delivery_days_select" ON delivery_days
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Anon: read active days only
CREATE POLICY "anon_delivery_days_select" ON delivery_days
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Updated_at trigger
CREATE OR REPLACE TRIGGER delivery_days_updated_at
  BEFORE UPDATE ON delivery_days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 2. ADD pending_approval TO order_status ENUM
-- ===========================================

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_approval' BEFORE 'pending';

-- ===========================================
-- 3. ADD PAYMENT + COD COLUMNS TO ORDERS
-- ===========================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'stripe'
    CHECK (payment_method IN ('stripe', 'cod')),
  ADD COLUMN IF NOT EXISTS cod_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cod_approved_by UUID REFERENCES profiles(id);

-- Index for filtering COD orders in admin
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_status
  ON orders (payment_method, status)
  WHERE payment_method = 'cod';

-- ===========================================
-- 4. UPDATE create_order_with_items RPC
-- Now accepts payment_method and initial status
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
  v_status order_status;
  v_payment_method TEXT;
BEGIN
  -- Determine payment method and initial status
  v_payment_method := COALESCE(p_order->>'payment_method', 'stripe');
  IF v_payment_method = 'cod' THEN
    v_status := 'pending_approval';
  ELSE
    v_status := 'pending';
  END IF;

  -- 1. Insert order (total_cents = subtotal + delivery + tax + tip - discount)
  INSERT INTO orders (
    user_id, address_id, status, payment_method,
    subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
    tip_cents, promo_code, discount_cents,
    delivery_window_start, delivery_window_end,
    special_instructions, delivery_instructions
  ) VALUES (
    (p_order->>'user_id')::UUID,
    (p_order->>'address_id')::UUID,
    v_status,
    v_payment_method,
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

  -- 2. Insert order items and collect their IDs (preserving array order)
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

  -- 3. Insert modifiers (referencing order_item IDs by index)
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

  -- Return order ID and item IDs
  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'order_item_ids', to_jsonb(v_item_ids)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated;

-- ===========================================
-- 5. SEED DELIVERY DAYS
-- Mon(1), Wed(3), Thu(4), Sat(6) active
-- Each day's cutoff = day before at 3 PM
-- ===========================================

INSERT INTO delivery_days (day_of_week, is_active, cutoff_day, cutoff_hour, delivery_fee_cents, display_order)
VALUES
  (0, false, 6, 15, 1500, 0), -- Sunday (inactive), cutoff Sat 3 PM
  (1, true,  0, 15, 1500, 1), -- Monday (active),  cutoff Sun 3 PM
  (2, false, 1, 15, 1500, 2), -- Tuesday (inactive), cutoff Mon 3 PM
  (3, true,  2, 15, 1500, 3), -- Wednesday (active), cutoff Tue 3 PM
  (4, true,  3, 15, 1500, 4), -- Thursday (active), cutoff Wed 3 PM
  (5, false, 4, 15, 1500, 5), -- Friday (inactive), cutoff Thu 3 PM
  (6, true,  5, 15, 1500, 6)  -- Saturday (active), cutoff Fri 3 PM
ON CONFLICT (day_of_week) DO NOTHING;

-- ===========================================
-- 6. SEED COD SETTINGS
-- ===========================================

INSERT INTO app_settings (key, value, category)
VALUES
  ('cod_enabled', 'false'::jsonb, 'delivery')
ON CONFLICT (key) DO NOTHING;
