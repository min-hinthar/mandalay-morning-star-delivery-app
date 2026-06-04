-- ===========================================
-- 005: Performance Indexes
-- Composite, partial, and unique partial indexes
-- beyond basic CREATE TABLE inline indexes
-- ===========================================

-- Composite: admin order lists, ops dashboard
CREATE INDEX IF NOT EXISTS idx_orders_status_placed
  ON orders (status, placed_at DESC);

-- Partial: active unassigned orders for ops dashboard
CREATE INDEX IF NOT EXISTS idx_orders_active_status
  ON orders (status, placed_at DESC)
  WHERE status NOT IN ('delivered', 'cancelled', 'pending');

-- Partial: needs-contact flagging for ops dashboard
CREATE INDEX IF NOT EXISTS idx_orders_needs_contact
  ON orders(needs_contact) WHERE needs_contact = TRUE;

-- Partial: share token lookups (non-null only)
CREATE INDEX IF NOT EXISTS idx_orders_share_token
  ON orders(share_token) WHERE share_token IS NOT NULL;

-- Partial: refund status filtering (non-'none' only)
CREATE INDEX IF NOT EXISTS idx_orders_refund_status
  ON orders (refund_status) WHERE refund_status != 'none';

-- Partial: assigned driver lookups (non-null only)
CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver
  ON orders(assigned_driver_id) WHERE assigned_driver_id IS NOT NULL;

-- Unique partial: one active order per user per Saturday (duplicate prevention)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_delivery_date
  ON orders (user_id, delivery_date(delivery_window_start))
  WHERE status != 'cancelled';

-- Composite: per-order latest notification lookup
CREATE INDEX IF NOT EXISTS idx_notification_logs_order_created
  ON notification_logs (order_id, created_at DESC);

-- Composite: notification stats aggregation
CREATE INDEX IF NOT EXISTS idx_notification_logs_status_created
  ON notification_logs(status, created_at DESC);

-- Partial: resend_id lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_notification_logs_resend_id
  ON notification_logs(resend_id) WHERE resend_id IS NOT NULL;

-- Composite: admin routes by date + status
CREATE INDEX IF NOT EXISTS idx_routes_date_status
  ON routes (delivery_date, status);

-- Composite: route stop order assignment check
CREATE INDEX IF NOT EXISTS idx_route_stops_order_route
  ON route_stops (order_id, route_id);
