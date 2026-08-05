-- apply_item_refunds: discount-proportional item refunds (audit D4) + the
-- shipping once-per-order guard and cumulative refund cap (audit D5).
--
-- D4 — the order's own math is
--   total = subtotal + delivery + tax(on the FULL subtotal) + tip - discount
-- so on a discounted order the customer paid line*(1 - discount/subtotal)
-- for each line's goods but FULL tax on it. The previous function refunded
-- the raw line total: over-refunding goods by the discount share (real card
-- money out on every welcome/referral/promo order) while never returning the
-- tax the customer also paid on that line. Now each line refunds
--   round(gross * (1 - discount_ratio)) + round(gross * tax/subtotal).
--
-- D5 — the delivery fee could be refunded on EVERY partial-refund call that
-- checked "refund shipping": Stripe caps the card at the charge (so the
-- overage silently ate goods refunds), but a COD order has no rail and the
-- overage became an uncapped cash over-payment. The fee now refunds at most
-- once per order (subsequent requests get the remainder, normally 0), and a
-- cumulative cap holds every call to what the customer actually paid: a
-- ≤1¢/line rounding overshoot clamps down to the remainder, anything beyond
-- rejects. Prior refunds are summed from order_audit_log —
-- the same rows the Stripe delta reconciles against, written atomically with
-- the marking since 20260612160000. Cancel-flow refunds (refund-on-cancel.ts)
-- write totalRefundCents rows too, so a fully cancel-refunded order is also
-- capped out of further item refunds — previously it wasn't.
--
-- The cumulative-cap exception reuses the phrase 'exceeds order total' —
-- the refund route's card-refund recovery path matches on it.
--
-- TS mirror: src/lib/orders/refund-math.ts previews these exact amounts in
-- the admin RefundDialog; keep the two expression-for-expression identical
-- (refund-math.test.ts pins parity, migration-source guard pins this file).
--
-- Signature unchanged -> generated types unchanged (db-drift-neutral).

CREATE OR REPLACE FUNCTION public.apply_item_refunds(p_order_id uuid, p_items jsonb, p_refund_shipping boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order record;
  v_item record;
  v_req jsonb;
  v_already_refunded int;
  v_remaining int;
  v_gross int;
  v_goods int;
  v_tax int;
  v_refund_amount int;
  v_discount_ratio numeric;
  v_prior_shipping int;
  v_prior_total int;
  v_remaining int;
  v_overshoot int;
  v_last int;
  v_total_refund int := 0;
  v_shipping_refund int := 0;
  v_results jsonb := '[]'::jsonb;
  v_reason text;
  v_audit_id uuid;
BEGIN
  -- Lock the order row (money columns included for the proportional math)
  SELECT id, total_cents, delivery_fee_cents, subtotal_cents, discount_cents, tax_cents
    INTO v_order
    FROM orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Discount ratio applied to goods. Tax was charged on the FULL subtotal,
  -- so it is attributed per line UNSCALED by the discount.
  v_discount_ratio := CASE
    WHEN v_order.subtotal_cents > 0
      THEN LEAST(1, v_order.discount_cents::numeric / v_order.subtotal_cents)
    ELSE 0
  END;

  -- What this order has already refunded (any source: item refunds, cancel
  -- refunds). The order row lock serializes concurrent calls, so this read
  -- is race-free within the refund flow.
  SELECT COALESCE(SUM((new_value->>'totalRefundCents')::int), 0),
         COALESCE(SUM((new_value->>'shippingRefundCents')::int), 0)
    INTO v_prior_total, v_prior_shipping
    FROM order_audit_log
   WHERE order_id = p_order_id
     AND action = 'refund';

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

    -- Mirrored in refund-math.ts: gross line share, goods net of the
    -- discount ratio, plus this line's share of the order tax — each rounded
    -- independently.
    v_gross := round(v_item.line_total_cents::numeric / v_item.quantity * (v_req->>'quantity')::int);
    v_goods := round(v_gross * (1 - v_discount_ratio));
    v_tax := CASE
      WHEN v_order.subtotal_cents > 0
        THEN round(v_gross::numeric * v_order.tax_cents / v_order.subtotal_cents)
      ELSE 0
    END;
    v_refund_amount := v_goods + v_tax;

    UPDATE order_items
       SET refunded_quantity = v_already_refunded + (v_req->>'quantity')::int
     WHERE id = v_item.id;

    v_total_refund := v_total_refund + v_refund_amount;

    v_results := v_results || jsonb_build_object(
      'orderItemId', v_item.id,
      'name', v_item.name_snapshot,
      'quantityRefunded', (v_req->>'quantity')::int,
      'refundAmountCents', v_refund_amount,
      'grossCents', v_gross,
      'discountShareCents', v_gross - v_goods,
      'taxShareCents', v_tax
    );
  END LOOP;

  -- Shipping refund: at most once per order. A repeat request refunds only
  -- the remainder (normally 0) instead of stacking the full fee again.
  IF p_refund_shipping AND v_order.delivery_fee_cents > 0 THEN
    v_shipping_refund := GREATEST(0, v_order.delivery_fee_cents - v_prior_shipping);
    v_total_refund := v_total_refund + v_shipping_refund;
  END IF;

  -- Cumulative cap: everything ever audited for this order, plus this call,
  -- must fit inside what the customer actually paid.
  --
  -- One overshoot is LEGITIMATE and must not reject: each line rounds its
  -- goods and tax shares independently (≤ +0.5¢ each), so a full refund of a
  -- discounted no-/low-tip order can sum up to jsonb_array_length(p_items)
  -- cents ABOVE the paid total (e.g. 2 × $1.00, 1¢ discount, 21¢ tax →
  -- 2 × (100+11) = $2.22 vs $2.20 paid). Within that bound — and only while
  -- something remains refundable — clamp DOWN to the remainder (the customer
  -- gets back exactly what they paid) and shave the difference off the last
  -- line so the itemization still sums to the total. Anything beyond the
  -- bound is a genuine over-refund and still raises. The phrase 'exceeds
  -- order total' is matched by the refund route's recovery path.
  v_remaining := v_order.total_cents - v_prior_total;
  v_overshoot := v_total_refund - v_remaining;
  IF v_overshoot > 0 THEN
    IF v_remaining > 0 AND v_overshoot <= jsonb_array_length(p_items) THEN
      v_total_refund := v_remaining;
      v_last := jsonb_array_length(v_results) - 1;
      v_results := jsonb_set(
        v_results,
        ARRAY[v_last::text, 'refundAmountCents'],
        to_jsonb(GREATEST(0, (v_results->v_last->>'refundAmountCents')::int - v_overshoot))
      );
    ELSE
      RAISE EXCEPTION 'Cumulative refund $% exceeds order total $% ($% already refunded)',
        ((v_prior_total + v_total_refund) / 100.0)::numeric(10,2),
        (v_order.total_cents / 100.0)::numeric(10,2),
        (v_prior_total / 100.0)::numeric(10,2);
    END IF;
  END IF;

  -- Audit entry, atomic with the item marking (the durable record the card
  -- refund reconciles against).
  v_reason := COALESCE(
    NULLIF(p_items->0->>'reason', ''),
    'Refund processed for ' || jsonb_array_length(v_results) || ' item(s)'
  );

  INSERT INTO order_audit_log (order_id, action, actor_id, actor_role, old_value, new_value, reason)
  VALUES (
    p_order_id,
    'refund',
    auth.uid(),
    'admin',
    NULL,
    jsonb_build_object(
      'items', v_results,
      'shippingRefundCents', v_shipping_refund,
      'totalRefundCents', v_total_refund
    ),
    v_reason
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object(
    'refundedItems', v_results,
    'shippingRefundCents', v_shipping_refund,
    'totalRefundCents', v_total_refund,
    'audit_log_id', v_audit_id
  );
END;
$function$;
