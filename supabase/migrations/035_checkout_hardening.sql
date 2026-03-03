-- ===========================================
-- 035: Checkout Hardening
-- Adds tip/promo/discount/delivery instructions columns,
-- duplicate order prevention index, prep time setting,
-- and updated create_order_with_items RPC.
-- ===========================================

-- ===========================================
-- 1. ADD COLUMNS TO ORDERS TABLE
-- ===========================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tip_cents INTEGER NOT NULL DEFAULT 0 CHECK (tip_cents >= 0),
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- ===========================================
-- 2. DUPLICATE ORDER PREVENTION (CHKT-05)
-- Unique partial index: one active order per user per Saturday
-- ===========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_delivery_date
  ON orders (user_id, (delivery_window_start::date))
  WHERE status != 'cancelled';

-- ===========================================
-- 3. PREP TIME BUFFER SETTING
-- ===========================================
INSERT INTO app_settings (key, value, category)
VALUES ('prep_time_buffer_minutes', '30'::jsonb, 'delivery')
ON CONFLICT (key) DO NOTHING;

-- ===========================================
-- 4. UPDATE create_order_with_items RPC
-- Now accepts tip_cents, promo_code, discount_cents, delivery_instructions
-- Total = subtotal + delivery + tax + tip - discount
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
  -- 1. Insert order (total_cents = subtotal + delivery + tax + tip - discount)
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
      v_item_ids[(v_modifier->>'item_index')::INTEGER + 1], -- 0-based to 1-based
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

-- Grant execute to authenticated users (RLS on orders table still applies for reads)
GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated;
