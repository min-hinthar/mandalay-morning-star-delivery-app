-- ===========================================
-- 20260529: Delivery metrics revenue excludes cancelled orders
-- ===========================================
-- delivery_metrics_mv previously summed o.total_cents across ALL orders
-- attached to route stops, so a cancelled order inflated revenue and the
-- average order value. Revenue should reflect confirmed orders only.
--
-- This migration recreates the materialized view so that:
--   * total_revenue_cents / avg_order_cents exclude cancelled orders
--   * confirmed_orders, cancelled_orders, cancelled_revenue_cents are
--     surfaced for visibility (cancelled detail is still useful to see)
--   * total_orders keeps its existing meaning (all routed orders)
--
-- A materialized view's SELECT cannot be altered in place, and
-- get_delivery_metrics_admin() returns SETOF delivery_metrics_mv (a hard
-- dependency), so both are dropped and recreated. refresh_analytics_views()
-- references the view by name only and is left untouched.
-- ===========================================

DROP FUNCTION IF EXISTS get_delivery_metrics_admin();
DROP MATERIALIZED VIEW IF EXISTS delivery_metrics_mv;

CREATE MATERIALIZED VIEW delivery_metrics_mv AS
SELECT
  r.delivery_date,

  -- Order metrics — revenue counts confirmed orders only; cancelled excluded
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status <> 'cancelled') AS confirmed_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders,
  COALESCE(SUM(o.total_cents) FILTER (WHERE o.status <> 'cancelled'), 0) AS total_revenue_cents,
  COALESCE(SUM(o.total_cents) FILTER (WHERE o.status = 'cancelled'), 0) AS cancelled_revenue_cents,
  ROUND(AVG(o.total_cents) FILTER (WHERE o.status <> 'cancelled')) AS avg_order_cents,

  -- Delivery metrics (route-stop based, unaffected by order status)
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered') AS delivered_count,
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'skipped') AS skipped_count,
  COUNT(DISTINCT rs.id) AS total_stops,

  -- Success rate
  COALESCE(
    ROUND(
      (COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered')::NUMERIC /
       NULLIF(COUNT(DISTINCT rs.id), 0)) * 100
    , 1)
  , 0) AS delivery_success_rate,

  -- ETA accuracy
  COALESCE(
    ROUND(
      (COUNT(DISTINCT rs.id) FILTER (
        WHERE rs.status = 'delivered'
        AND rs.eta IS NOT NULL
        AND ABS(EXTRACT(EPOCH FROM (rs.delivered_at - rs.eta))) <= 600
      )::NUMERIC /
       NULLIF(COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered' AND rs.eta IS NOT NULL), 0)) * 100
    , 1)
  , 0) AS eta_accuracy_rate,

  -- Route efficiency
  COUNT(DISTINCT r.id) AS total_routes,
  COUNT(DISTINCT r.driver_id) AS active_drivers,

  -- Timing metrics
  ROUND(AVG(
    EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 60
  ) FILTER (WHERE r.status = 'completed'), 1) AS avg_route_duration_minutes,

  -- Exceptions
  COUNT(DISTINCT de.id) AS total_exceptions

FROM routes r
LEFT JOIN route_stops rs ON r.id = rs.route_id
LEFT JOIN orders o ON rs.order_id = o.id
LEFT JOIN delivery_exceptions de ON rs.id = de.route_stop_id

WHERE r.delivery_date >= NOW() - INTERVAL '90 days'
GROUP BY r.delivery_date
ORDER BY r.delivery_date DESC;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX idx_delivery_metrics_mv_date ON delivery_metrics_mv(delivery_date);

-- Recreate admin-only accessor (return type follows the recreated view)
CREATE OR REPLACE FUNCTION get_delivery_metrics_admin()
RETURNS SETOF delivery_metrics_mv AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY SELECT * FROM delivery_metrics_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restore grants: callers use the admin wrapper; direct access stays revoked
GRANT EXECUTE ON FUNCTION get_delivery_metrics_admin TO authenticated;
REVOKE ALL ON delivery_metrics_mv FROM authenticated;

COMMENT ON MATERIALIZED VIEW delivery_metrics_mv IS
  'Daily delivery KPIs for operations dashboard. Revenue (total_revenue_cents, avg_order_cents) excludes cancelled orders; cancelled_orders / cancelled_revenue_cents are tracked separately.';
COMMENT ON FUNCTION get_delivery_metrics_admin() IS 'Admin-only access to delivery metrics';
