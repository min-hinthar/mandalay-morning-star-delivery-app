-- ===========================================
-- 20260604: Loyalty tiers by lifetime net spend (was order count)
-- ===========================================
-- Tiers are now earned by lifetime NET SPEND (subtotal − discount), not order
-- count, so the admin distribution must bucket the same way. Also excludes
-- `pending_approval` (unpaid COD) to match STAR_EARNING_STATUSES in app code.
--
-- Spend thresholds mirror LOYALTY_TIERS in src/lib/loyalty/index.ts:
--   Jade $250 (25000c) · Ruby $750 (75000c) · Gold $1500 (150000c)
-- Keep these in sync if the ladder changes.
-- ===========================================

CREATE OR REPLACE FUNCTION get_loyalty_tier_distribution()
RETURNS TABLE (
  tier TEXT,
  customers BIGINT,
  orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH per_customer AS (
    SELECT
      o.user_id,
      COUNT(*) AS order_count,
      -- Net spend: food subtotal minus discount, floored at 0 per order.
      SUM(GREATEST(0, o.subtotal_cents - COALESCE(o.discount_cents, 0))) AS spend_cents
    FROM orders o
    JOIN profiles p ON p.id = o.user_id AND p.role = 'customer'
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
  'Admin/service-role: customers bucketed into loyalty tiers by lifetime net spend (subtotal − discount); excludes unpaid pending_approval.';
