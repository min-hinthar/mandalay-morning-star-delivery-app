-- ===========================================
-- Direction-Based Delivery & Distance-Tiered Fees
--
-- 1. Add direction column to delivery_days
-- 2. Add distance_miles to addresses and orders
-- 3. Create delivery_zones table (bearing ranges)
-- 4. Add fee tier settings to app_settings
-- 5. Update create_order_with_items RPC for distance_miles
-- ===========================================

-- ===========================================
-- 1. ADD DIRECTION TO DELIVERY_DAYS
-- ===========================================

ALTER TABLE delivery_days
  ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'all'
  CHECK (direction IN ('east', 'west', 'south', 'all'));

UPDATE delivery_days SET direction = 'east' WHERE day_of_week = 1;   -- Monday
UPDATE delivery_days SET direction = 'west' WHERE day_of_week = 3;   -- Wednesday
UPDATE delivery_days SET direction = 'south' WHERE day_of_week = 4;  -- Thursday
UPDATE delivery_days SET direction = 'all' WHERE day_of_week = 6;    -- Saturday

-- ===========================================
-- 2. ADD DISTANCE_MILES TO ADDRESSES AND ORDERS
-- ===========================================

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS distance_miles DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_miles DOUBLE PRECISION;

-- ===========================================
-- 3. CREATE DELIVERY_ZONES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL UNIQUE CHECK (direction IN ('east', 'west', 'south')),
  bearing_start DOUBLE PRECISION NOT NULL,
  bearing_end DOUBLE PRECISION NOT NULL,
  reference_cities TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed bearing ranges
INSERT INTO delivery_zones (direction, bearing_start, bearing_end, reference_cities)
VALUES
  ('east',  350, 80,  ARRAY['Pomona', 'San Bernardino', 'Riverside']),
  ('west',  230, 320, ARRAY['Pasadena', 'Glendale', 'Long Beach', 'Santa Monica']),
  ('south', 140, 220, ARRAY['Anaheim', 'Santa Ana', 'Huntington Beach', 'Irvine'])
ON CONFLICT (direction) DO NOTHING;

-- RLS: admin full access, authenticated + anon read
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_zones_read_all" ON delivery_zones
  FOR SELECT USING (true);

CREATE POLICY "delivery_zones_admin_all" ON delivery_zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Updated_at trigger
CREATE OR REPLACE TRIGGER delivery_zones_updated_at
  BEFORE UPDATE ON delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 4. ADD FEE TIER SETTINGS TO APP_SETTINGS
-- ===========================================

INSERT INTO app_settings (key, value, category)
VALUES
  ('long_distance_fee_cents', '2000', 'delivery'),
  ('long_distance_threshold_miles', '25', 'delivery')
ON CONFLICT (key) DO NOTHING;

-- ===========================================
-- 5. UPDATE create_order_with_items RPC
-- Now accepts distance_miles in p_order
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

  -- 1. Insert order
  INSERT INTO orders (
    user_id, address_id, status, payment_method,
    subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
    tip_cents, promo_code, discount_cents,
    delivery_window_start, delivery_window_end,
    special_instructions, delivery_instructions,
    customer_phone, customer_name, distance_miles
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
    p_order->>'delivery_instructions',
    p_order->>'customer_phone',
    p_order->>'customer_name',
    (p_order->>'distance_miles')::DOUBLE PRECISION
  )
  RETURNING id INTO v_order_id;

  -- 2. Insert order items and collect their IDs
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, menu_item_id, name_snapshot, name_my_snapshot,
      base_price_snapshot, quantity, line_total_cents, special_instructions
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      v_item->>'name_snapshot',
      v_item->>'name_my_snapshot',
      (v_item->>'base_price_snapshot')::INTEGER,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'line_total_cents')::INTEGER,
      v_item->>'special_instructions'
    )
    RETURNING id INTO v_inserted_id;

    v_item_ids := array_append(v_item_ids, v_inserted_id);
  END LOOP;

  -- 3. Insert modifiers
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
