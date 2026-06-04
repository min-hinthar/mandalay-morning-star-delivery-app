-- ===========================================
-- 20260531d: Fix marketing opt-in source for loyalty cron readers
-- ===========================================
-- Marketing opt-in is stored in customer_settings.notification_prefs, NOT
-- profiles.notification_prefs (the column does not exist on profiles). The
-- loyalty SECURITY DEFINER readers were written against profiles and fail at
-- runtime. Redefine them to LEFT JOIN customer_settings, defaulting to opted-in
-- when a customer has no settings row (matches the app default).
--
-- NOTE: the pre-existing get_lapsed_customers (win-back cron) has the same bug
-- but is out of scope for this change; fix it separately.
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
  LEFT JOIN customer_settings cs ON cs.user_id = p.id
  JOIN (
    SELECT o.user_id, MIN(o.placed_at AT TIME ZONE 'America/Los_Angeles') AS first_at
    FROM orders o
    WHERE o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered', 'pending_approval')
    GROUP BY o.user_id
  ) fo ON fo.user_id = p.id
  WHERE p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((cs.notification_prefs->>'marketing')::boolean, true) = true
    AND EXTRACT(MONTH FROM fo.first_at) = EXTRACT(MONTH FROM la_today)
    AND EXTRACT(DAY FROM fo.first_at) = EXTRACT(DAY FROM la_today)
    AND fo.first_at < date_trunc('year', la_today::timestamp)
    AND (
      p.last_anniversary_at IS NULL
      OR EXTRACT(YEAR FROM (p.last_anniversary_at AT TIME ZONE 'America/Los_Angeles'))
         < EXTRACT(YEAR FROM la_today)
    )
  ORDER BY years DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
