-- ===========================================
-- 20260531: Morning Star Rewards (loyalty)
-- ===========================================
-- Stars = completed-order count (computed, no counter to drift). Every Nth
-- order auto-issues a $5 "Kyay-Zu-Par!" thank-you coupon (minted as a one-time
-- Stripe promo code, redeemed via the normal checkout promo flow). Existing
-- customers also get a one-time thank-you blast.
-- ===========================================

-- One-time stamp so the loyalty thank-you blast fires once per customer.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_thanked_at TIMESTAMPTZ;

-- Issued loyalty rewards (one row per reward). The minted promo code lives in
-- reward_code; the wallet surfaces rows where it's non-null.
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'milestone' CHECK (kind IN ('milestone', 'thank_you')),
  -- Completed-order count that triggered a milestone reward (NULL for thank_you).
  milestone INTEGER,
  reward_code TEXT,
  reward_cents INTEGER NOT NULL DEFAULT 0 CHECK (reward_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One reward per milestone per customer (insert is the dedupe lock).
  CONSTRAINT loyalty_rewards_milestone_unique UNIQUE (user_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_user ON loyalty_rewards(user_id);

-- ===========================================
-- RLS — a customer reads their own rewards; writes are server-only
-- (issuance runs through the service role, which bypasses RLS).
-- ===========================================
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_rewards_select" ON loyalty_rewards;
CREATE POLICY "loyalty_rewards_select" ON loyalty_rewards FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR public.is_admin()
  );

COMMENT ON TABLE loyalty_rewards IS
  'Issued loyalty rewards (milestone + one-time thank-you). One milestone row per customer per milestone.';

-- ===========================================
-- Cron-only: existing customers eligible for the one-time thank-you blast.
-- Eligible = has a real (non-cancelled) order, marketing opted-in, has an
-- email, and not yet thanked. Most loyal first.
-- ===========================================
CREATE OR REPLACE FUNCTION get_loyalty_thankyou_candidates(p_limit INT DEFAULT 100)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, oc.cnt
  FROM profiles p
  LEFT JOIN customer_settings cs ON cs.user_id = p.id
  JOIN (
    SELECT o.user_id, COUNT(*) AS cnt
    FROM orders o
    WHERE o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered', 'pending_approval')
    GROUP BY o.user_id
  ) oc ON oc.user_id = p.id
  WHERE p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((cs.notification_prefs->>'marketing')::boolean, true) = true
    AND p.loyalty_thanked_at IS NULL
  ORDER BY oc.cnt DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Returns customer PII — lock to the service role (cron) only.
REVOKE ALL ON FUNCTION get_loyalty_thankyou_candidates(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_loyalty_thankyou_candidates(INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_thankyou_candidates(INT) TO service_role;

COMMENT ON FUNCTION get_loyalty_thankyou_candidates(INT) IS
  'Cron-only: existing customers (>=1 non-cancelled order) eligible for the one-time loyalty thank-you, marketing opted-in, not yet thanked.';
