-- ===========================================
-- 003: Analytics & Materialized Views
-- Driver statistics and delivery metrics
-- ===========================================

-- ===========================================
-- 1. DRIVER STATS MATERIALIZED VIEW
-- ===========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS driver_stats_mv AS
SELECT
  d.id AS driver_id,
  d.user_id,
  p.full_name,
  p.email,
  d.is_active,
  d.vehicle_type,
  d.profile_image_url,

  -- Delivery counts
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered') AS total_deliveries,
  COUNT(DISTINCT rs.id) FILTER (
    WHERE rs.status = 'delivered' AND rs.delivered_at >= NOW() - INTERVAL '7 days'
  ) AS deliveries_last_7_days,
  COUNT(DISTINCT rs.id) FILTER (
    WHERE rs.status = 'delivered' AND rs.delivered_at >= NOW() - INTERVAL '30 days'
  ) AS deliveries_last_30_days,

  -- On-time rate
  COALESCE(
    ROUND(
      (COUNT(DISTINCT rs.id) FILTER (
        WHERE rs.status = 'delivered'
        AND (rs.eta IS NULL OR rs.delivered_at <= rs.eta + INTERVAL '10 minutes')
      )::NUMERIC /
      NULLIF(COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'), 0)) * 100
    , 1)
  , 0) AS on_time_rate,

  -- Average delivery time (minutes)
  ROUND(
    AVG(EXTRACT(EPOCH FROM (rs.delivered_at - rs.arrived_at)) / 60)
    FILTER (WHERE rs.status = 'delivered' AND rs.arrived_at IS NOT NULL)
  , 1) AS avg_delivery_minutes,

  -- Ratings
  COUNT(DISTINCT dr.id) AS total_ratings,
  ROUND(AVG(dr.rating)::NUMERIC, 2) AS avg_rating,

  -- Rating distribution
  COUNT(dr.id) FILTER (WHERE dr.rating = 5) AS ratings_5_star,
  COUNT(dr.id) FILTER (WHERE dr.rating = 4) AS ratings_4_star,
  COUNT(dr.id) FILTER (WHERE dr.rating = 3) AS ratings_3_star,
  COUNT(dr.id) FILTER (WHERE dr.rating = 2) AS ratings_2_star,
  COUNT(dr.id) FILTER (WHERE dr.rating = 1) AS ratings_1_star,

  -- Exceptions
  COUNT(DISTINCT de.id) AS total_exceptions,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'customer_not_home') AS exceptions_not_home,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'wrong_address') AS exceptions_wrong_address,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'access_issue') AS exceptions_access,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'refused_delivery') AS exceptions_refused,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'damaged_order') AS exceptions_damaged,

  -- Activity
  d.created_at AS driver_since,
  MAX(r.completed_at) AS last_route_completed

FROM drivers d
LEFT JOIN profiles p ON d.user_id = p.id
LEFT JOIN routes r ON d.id = r.driver_id
LEFT JOIN route_stops rs ON r.id = rs.route_id
LEFT JOIN driver_ratings dr ON d.id = dr.driver_id
LEFT JOIN delivery_exceptions de ON rs.id = de.route_stop_id

GROUP BY d.id, d.user_id, p.full_name, p.email, d.is_active, d.vehicle_type, d.profile_image_url, d.created_at;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_stats_mv_driver_id ON driver_stats_mv(driver_id);

-- ===========================================
-- 2. DELIVERY METRICS MATERIALIZED VIEW
-- ===========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS delivery_metrics_mv AS
SELECT
  r.delivery_date,

  -- Order metrics
  COUNT(DISTINCT o.id) AS total_orders,
  SUM(o.total_cents) AS total_revenue_cents,
  ROUND(AVG(o.total_cents)) AS avg_order_cents,

  -- Delivery metrics
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_metrics_mv_date ON delivery_metrics_mv(delivery_date);

-- ===========================================
-- 3. ADMIN-ONLY ACCESS FUNCTIONS
-- Materialized views don't support RLS, so we use wrapper functions
-- ===========================================

-- Refresh function (admin only)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  REFRESH MATERIALIZED VIEW CONCURRENTLY driver_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY delivery_metrics_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get driver stats (admin only)
CREATE OR REPLACE FUNCTION get_driver_stats_admin()
RETURNS SETOF driver_stats_mv AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY SELECT * FROM driver_stats_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get delivery metrics (admin only)
CREATE OR REPLACE FUNCTION get_delivery_metrics_admin()
RETURNS SETOF delivery_metrics_mv AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY SELECT * FROM delivery_metrics_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get individual driver performance
CREATE OR REPLACE FUNCTION get_driver_performance(p_driver_id UUID)
RETURNS TABLE (
  total_deliveries BIGINT,
  deliveries_last_7_days BIGINT,
  deliveries_last_30_days BIGINT,
  on_time_rate NUMERIC,
  avg_rating NUMERIC,
  total_ratings BIGINT,
  total_exceptions BIGINT
) AS $$
BEGIN
  -- Allow admin or the driver themselves
  IF NOT public.is_admin() AND p_driver_id != public.get_my_driver_id() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    ds.total_deliveries,
    ds.deliveries_last_7_days,
    ds.deliveries_last_30_days,
    ds.on_time_rate,
    ds.avg_rating,
    ds.total_ratings,
    ds.total_exceptions
  FROM driver_stats_mv ds
  WHERE ds.driver_id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================
-- 4. GRANT PERMISSIONS
-- ===========================================
GRANT EXECUTE ON FUNCTION refresh_analytics_views TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_stats_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_delivery_metrics_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_performance TO authenticated;

-- Revoke direct access to materialized views
REVOKE ALL ON driver_stats_mv FROM authenticated;
REVOKE ALL ON delivery_metrics_mv FROM authenticated;

-- ===========================================
-- 5. COMMENTS
-- ===========================================
COMMENT ON MATERIALIZED VIEW driver_stats_mv IS 'Aggregated driver performance metrics';
COMMENT ON MATERIALIZED VIEW delivery_metrics_mv IS 'Daily delivery KPIs for operations dashboard';
COMMENT ON FUNCTION refresh_analytics_views() IS 'Admin-only function to refresh analytics views';
COMMENT ON FUNCTION get_driver_stats_admin() IS 'Admin-only access to driver statistics';
COMMENT ON FUNCTION get_delivery_metrics_admin() IS 'Admin-only access to delivery metrics';
