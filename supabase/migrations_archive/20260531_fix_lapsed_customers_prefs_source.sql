-- ===========================================
-- 20260531e: Fix marketing opt-in source for the win-back cron
-- ===========================================
-- Pre-existing get_lapsed_customers references profiles.notification_prefs, a
-- column that does not exist on this database — marketing opt-in lives in
-- customer_settings.notification_prefs. As written the function errors at
-- runtime, so the win-back cron has been failing on every run.
--
-- Repoint it at customer_settings via LEFT JOIN, defaulting to opted-in when a
-- customer has no settings row (matches the app default and the loyalty cron
-- readers fixed in 20260531_loyalty_fix_prefs_source.sql). All other behavior
-- (30–90 day lapse window, 60-day re-target guard, ordering) is unchanged.
-- ===========================================

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
  LEFT JOIN customer_settings cs ON cs.user_id = p.id
  JOIN (
    SELECT o.user_id, MAX(o.placed_at) AS last_order_at
    FROM orders o
    WHERE o.status <> 'cancelled'
    GROUP BY o.user_id
  ) last_orders ON last_orders.user_id = p.id
  WHERE p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((cs.notification_prefs->>'marketing')::boolean, true) = true
    AND last_orders.last_order_at < NOW() - INTERVAL '30 days'
    AND last_orders.last_order_at > NOW() - INTERVAL '90 days'
    AND (p.last_winback_at IS NULL OR p.last_winback_at < NOW() - INTERVAL '60 days')
  ORDER BY last_orders.last_order_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
