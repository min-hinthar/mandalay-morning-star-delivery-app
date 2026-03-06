-- Atomic refund function with FOR UPDATE to prevent concurrent refunds
-- exceeding order total.
CREATE OR REPLACE FUNCTION apply_item_refunds(
  p_order_id uuid,
  p_items jsonb,        -- [{ "orderItemId": uuid, "quantity": int, "reason": text }]
  p_refund_shipping boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_order record;
  v_item record;
  v_req jsonb;
  v_already_refunded int;
  v_remaining int;
  v_unit_price numeric;
  v_refund_amount int;
  v_total_refund int := 0;
  v_shipping_refund int := 0;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Lock the order row
  SELECT id, total_cents, delivery_fee_cents
    INTO v_order
    FROM orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Process each item
  FOR v_req IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Lock the order item row
    SELECT id, order_id, name_snapshot, quantity, line_total_cents,
           COALESCE(refunded_quantity, 0) AS refunded_qty
      INTO v_item
      FROM order_items
     WHERE id = (v_req->>'orderItemId')::uuid
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Order item not found: %', v_req->>'orderItemId';
    END IF;

    IF v_item.order_id != p_order_id THEN
      RAISE EXCEPTION 'Item % does not belong to order %', v_item.id, p_order_id;
    END IF;

    v_already_refunded := v_item.refunded_qty;
    v_remaining := v_item.quantity - v_already_refunded;

    IF (v_req->>'quantity')::int > v_remaining THEN
      RAISE EXCEPTION 'Cannot refund % of "%" — only % remaining',
        (v_req->>'quantity')::int, v_item.name_snapshot, v_remaining;
    END IF;

    v_unit_price := v_item.line_total_cents::numeric / v_item.quantity;
    v_refund_amount := round(v_unit_price * (v_req->>'quantity')::int);

    UPDATE order_items
       SET refunded_quantity = v_already_refunded + (v_req->>'quantity')::int
     WHERE id = v_item.id;

    v_total_refund := v_total_refund + v_refund_amount;

    v_results := v_results || jsonb_build_object(
      'orderItemId', v_item.id,
      'name', v_item.name_snapshot,
      'quantityRefunded', (v_req->>'quantity')::int,
      'refundAmountCents', v_refund_amount
    );
  END LOOP;

  -- Shipping refund
  IF p_refund_shipping AND v_order.delivery_fee_cents > 0 THEN
    v_shipping_refund := v_order.delivery_fee_cents;
    v_total_refund := v_total_refund + v_shipping_refund;
  END IF;

  -- Validate total
  IF v_total_refund > v_order.total_cents THEN
    RAISE EXCEPTION 'Refund $% exceeds order total $%',
      (v_total_refund / 100.0)::numeric(10,2),
      (v_order.total_cents / 100.0)::numeric(10,2);
  END IF;

  RETURN jsonb_build_object(
    'refundedItems', v_results,
    'shippingRefundCents', v_shipping_refund,
    'totalRefundCents', v_total_refund
  );
END;
$$;
