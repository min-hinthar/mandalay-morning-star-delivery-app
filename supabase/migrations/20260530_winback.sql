-- ===========================================
-- 20260530: Win-back (lapsed customer re-engagement)
-- ===========================================
-- Adds a per-customer dedupe timestamp and a cron-only function that returns
-- customers who haven't ordered in a while (so we can email them once).
-- ===========================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_winback_at TIMESTAMPTZ;

-- Cron-only: lapsed customers eligible for a win-back email.
-- Eligible = real (non-cancelled) last order was 30–90 days ago, marketing
-- opted-in, has an email, and not win-backed in the last 60 days.
CREATE OR REPLACE FUNCTION get_lapsed_customers(p_limit INT DEFAULT 100)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  last_order_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, last_orders.last_order_at
  FROM profiles p
  JOIN (
    SELECT o.user_id, MAX(o.placed_at) AS last_order_at
    FROM orders o
    WHERE o.status <> 'cancelled'
    GROUP BY o.user_id
  ) last_orders ON last_orders.user_id = p.id
  WHERE p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((p.notification_prefs->>'marketing')::boolean, true) = true
    AND last_orders.last_order_at < NOW() - INTERVAL '30 days'
    AND last_orders.last_order_at > NOW() - INTERVAL '90 days'
    AND (p.last_winback_at IS NULL OR p.last_winback_at < NOW() - INTERVAL '60 days')
  ORDER BY last_orders.last_order_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Returns customer PII — lock to the service role (cron) only.
REVOKE ALL ON FUNCTION get_lapsed_customers(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_lapsed_customers(INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_lapsed_customers(INT) TO service_role;

COMMENT ON FUNCTION get_lapsed_customers(INT) IS
  'Cron-only: customers whose last non-cancelled order was 30-90 days ago, marketing opted-in, not win-backed in 60 days.';
