-- ===========================================
-- 20260605: Loyalty tier spend is NET OF REFUNDS
-- ===========================================
-- Supersedes 20260604_loyalty_tier_by_spend.sql. Tier spend must subtract the
-- value of refunded items, so a customer can't order big, get refunded, and
-- keep the spend-based tier. Refunded value per item = unit price
-- (line_total / quantity) × refunded_quantity. Mirrors orderRefundedCents() +
-- orderSpendCents() in src/lib/loyalty/index.ts — keep in sync.
-- ===========================================

CREATE OR REPLACE FUNCTION get_loyalty_tier_distribution()
RETURNS TABLE (
  tier TEXT,
  customers BIGINT,
  orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH order_refunds AS (
    -- Refunded food value per order, proportional to refunded_quantity.
    SELECT
      oi.order_id,
      COALESCE(
        SUM(
          CASE
            WHEN oi.quantity > 0 AND COALESCE(oi.refunded_quantity, 0) > 0
            THEN ROUND(
              (oi.line_total_cents::numeric / oi.quantity)
              * LEAST(oi.refunded_quantity, oi.quantity)
            )
            ELSE 0
          END
        ),
        0
      ) AS refunded_cents
    FROM order_items oi
    GROUP BY oi.order_id
  ),
  per_customer AS (
    SELECT
      o.user_id,
      COUNT(*) AS order_count,
      -- Net spend: subtotal − discount − refunds, floored at 0 per order.
      SUM(
        GREATEST(
          0,
          o.subtotal_cents
          - COALESCE(o.discount_cents, 0)
          - COALESCE(r.refunded_cents, 0)
        )
      ) AS spend_cents
    FROM orders o
    JOIN profiles p ON p.id = o.user_id AND p.role = 'customer'
    LEFT JOIN order_refunds r ON r.order_id = o.id
    WHERE o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered')
    GROUP BY o.user_id
  ),
  bucketed AS (
    SELECT
      CASE
        WHEN spend_cents >= 150000 THEN 'gold'
        WHEN spend_cents >= 75000 THEN 'ruby'
        WHEN spend_cents >= 25000 THEN 'jade'
        ELSE 'new'
      END AS tier,
      order_count
    FROM per_customer
  )
  SELECT b.tier, COUNT(*)::BIGINT AS customers, SUM(b.order_count)::BIGINT AS orders
  FROM bucketed b
  GROUP BY b.tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_loyalty_tier_distribution() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_loyalty_tier_distribution() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_tier_distribution() TO service_role;

COMMENT ON FUNCTION get_loyalty_tier_distribution() IS
  'Admin/service-role: customers bucketed into loyalty tiers by lifetime net spend (subtotal − discount − refunds); excludes unpaid pending_approval.';
