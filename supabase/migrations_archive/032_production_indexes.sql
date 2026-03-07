-- ===========================================
-- 032: Production Indexes
-- Composite and partial indexes for high-frequency query patterns
-- Phase 84: Production Hardening
-- ===========================================

-- 1. Orders: status + placed_at (admin order lists, ops dashboard)
-- Replaces need to merge separate idx_orders_status + idx_orders_placed_at
-- Used by: GET /api/admin/orders, GET /api/admin/ops/orders
CREATE INDEX IF NOT EXISTS idx_orders_status_placed
  ON orders (status, placed_at DESC);

-- 2. Orders: active unassigned detection
-- For ops dashboard "unassigned orders" badge and route builder panel
-- Covers orders that are confirmed/preparing but not yet on a route
CREATE INDEX IF NOT EXISTS idx_orders_active_status
  ON orders (status, placed_at DESC)
  WHERE status NOT IN ('delivered', 'cancelled', 'pending');

-- 3. Notification logs: per-order latest lookup
-- Ops dashboard fetches latest email status per order
-- Used by: GET /api/admin/ops/orders (joined query)
CREATE INDEX IF NOT EXISTS idx_notification_logs_order_created
  ON notification_logs (order_id, created_at DESC);

-- 4. Routes: date + status composite
-- Admin routes list filtered by date and ops dashboard route queries
-- Used by: GET /api/admin/routes?date=YYYY-MM-DD
CREATE INDEX IF NOT EXISTS idx_routes_date_status
  ON routes (delivery_date, status);

-- 5. Route stops: order assignment check
-- Fast lookup for "is this order assigned to an active route?"
-- Used by: POST /api/admin/routes (check existing assignments)
CREATE INDEX IF NOT EXISTS idx_route_stops_order_route
  ON route_stops (order_id, route_id);
