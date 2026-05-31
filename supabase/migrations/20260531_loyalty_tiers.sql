-- ===========================================
-- 20260531b: Rewards elevation — tiers, celebration, anniversary
-- ===========================================
-- Adds: in-app celebration tracking (acknowledged_at), the anniversary reward
-- kind + dedupe stamp, and a cron source for 1-year anniversaries. Tier sizing
-- itself lives in app code (lib/loyalty); the DB just records issued rewards.
-- ===========================================

-- When the customer has seen the in-app celebration for a reward.
ALTER TABLE loyalty_rewards ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

-- Allow anniversary rewards alongside milestone + thank_you.
ALTER TABLE loyalty_rewards DROP CONSTRAINT IF EXISTS loyalty_rewards_kind_check;
ALTER TABLE loyalty_rewards
  ADD CONSTRAINT loyalty_rewards_kind_check
  CHECK (kind IN ('milestone', 'thank_you', 'anniversary'));

-- One anniversary send per customer per calendar year (cron stamps after send).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_anniversary_at TIMESTAMPTZ;

-- ===========================================
-- Cron-only: customers whose first-order anniversary (LA time) is today and who
-- haven't been celebrated this calendar year. Longest-standing first.
-- ===========================================
CREATE OR REPLACE FUNCTION get_anniversary_customers(p_limit INT DEFAULT 100)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  years INTEGER
) AS $$
DECLARE
  la_today DATE := (now() AT TIME ZONE 'America/Los_Angeles')::date;
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    (EXTRACT(YEAR FROM la_today) - EXTRACT(YEAR FROM fo.first_at))::INTEGER AS years
  FROM profiles p
  JOIN (
    SELECT o.user_id, MIN(o.placed_at AT TIME ZONE 'America/Los_Angeles') AS first_at
    FROM orders o
    WHERE o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered', 'pending_approval')
    GROUP BY o.user_id
  ) fo ON fo.user_id = p.id
  WHERE p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((p.notification_prefs->>'marketing')::boolean, true) = true
    -- Anniversary day (month + day) matches today...
    AND EXTRACT(MONTH FROM fo.first_at) = EXTRACT(MONTH FROM la_today)
    AND EXTRACT(DAY FROM fo.first_at) = EXTRACT(DAY FROM la_today)
    -- ...and the first order was in a prior year (so years >= 1).
    AND fo.first_at < date_trunc('year', la_today::timestamp)
    -- ...and not already celebrated this calendar year.
    AND (
      p.last_anniversary_at IS NULL
      OR EXTRACT(YEAR FROM (p.last_anniversary_at AT TIME ZONE 'America/Los_Angeles'))
         < EXTRACT(YEAR FROM la_today)
    )
  ORDER BY years DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Returns customer PII — lock to the service role (cron) only.
REVOKE ALL ON FUNCTION get_anniversary_customers(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_anniversary_customers(INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_anniversary_customers(INT) TO service_role;

COMMENT ON FUNCTION get_anniversary_customers(INT) IS
  'Cron-only: customers whose first-order anniversary (LA time) is today, marketing opted-in, not yet celebrated this year.';
