-- ===========================================
-- 20260531c: Rewards engagement — expiry, redemption, tier insight
-- ===========================================
-- Adds reward lifecycle (expires_at, redeemed_at, reminded_at) so coupons
-- create urgency and the wallet/admin can show live state, plus two cron/admin
-- SECURITY DEFINER readers. Tier sizing stays in app code (lib/loyalty).
-- ===========================================

-- Reward lifecycle. expires_at mirrors the Stripe promo code's expiry; the
-- nudge cron stamps reminded_at; the checkout webhook stamps redeemed_at.
ALTER TABLE loyalty_rewards ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE loyalty_rewards ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;
ALTER TABLE loyalty_rewards ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;

-- Fast lookup for redemption marking (by code) and the expiring-soon sweep.
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_code ON loyalty_rewards(reward_code)
  WHERE reward_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_expiring ON loyalty_rewards(expires_at)
  WHERE redeemed_at IS NULL AND reminded_at IS NULL;

-- ===========================================
-- Admin-only: customer distribution across the Burmese-gem tiers, computed from
-- lifetime star-earning order counts. Service-role only (admin page uses it).
-- ===========================================
CREATE OR REPLACE FUNCTION get_loyalty_tier_distribution()
RETURNS TABLE (
  tier TEXT,
  customers BIGINT,
  orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH counts AS (
    SELECT o.user_id, COUNT(*) AS cnt
    FROM orders o
    JOIN profiles p ON p.id = o.user_id AND p.role = 'customer'
    WHERE o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered', 'pending_approval')
    GROUP BY o.user_id
  ),
  bucketed AS (
    SELECT
      CASE
        WHEN cnt >= 50 THEN 'gold'
        WHEN cnt >= 25 THEN 'ruby'
        WHEN cnt >= 10 THEN 'jade'
        ELSE 'new'
      END AS tier,
      cnt
    FROM counts
  )
  SELECT b.tier, COUNT(*)::BIGINT AS customers, SUM(b.cnt)::BIGINT AS orders
  FROM bucketed b
  GROUP BY b.tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_loyalty_tier_distribution() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_loyalty_tier_distribution() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_tier_distribution() TO service_role;

COMMENT ON FUNCTION get_loyalty_tier_distribution() IS
  'Admin/service-role: customer + order counts bucketed into loyalty tiers (new/jade/ruby/gold).';

-- ===========================================
-- Cron-only: active rewards expiring within p_days, not yet redeemed or
-- reminded, for the "expiring soon" nudge. Marketing opted-in only.
-- ===========================================
CREATE OR REPLACE FUNCTION get_expiring_loyalty_rewards(p_days INT DEFAULT 7, p_limit INT DEFAULT 100)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  reward_code TEXT,
  reward_cents INTEGER,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT lr.id, lr.user_id, p.email, p.full_name, lr.reward_code, lr.reward_cents, lr.expires_at
  FROM loyalty_rewards lr
  JOIN profiles p ON p.id = lr.user_id
  LEFT JOIN customer_settings cs ON cs.user_id = p.id
  WHERE lr.reward_code IS NOT NULL
    AND lr.redeemed_at IS NULL
    AND lr.reminded_at IS NULL
    AND lr.expires_at IS NOT NULL
    AND lr.expires_at > now()
    AND lr.expires_at <= now() + make_interval(days => p_days)
    AND p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((cs.notification_prefs->>'marketing')::boolean, true) = true
  ORDER BY lr.expires_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_expiring_loyalty_rewards(INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_expiring_loyalty_rewards(INT, INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_loyalty_rewards(INT, INT) TO service_role;

COMMENT ON FUNCTION get_expiring_loyalty_rewards(INT, INT) IS
  'Cron-only: active loyalty rewards expiring within p_days, not redeemed/reminded, marketing opted-in.';