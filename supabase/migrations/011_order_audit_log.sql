-- ===========================================
-- 011: Order Audit Log
-- Tracks status changes, cancellations, refunds
-- ===========================================

-- Order audit log for tracking all order actions
CREATE TABLE IF NOT EXISTS order_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('status_change', 'cancel', 'refund', 'edit')),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('customer', 'admin', 'driver', 'system')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for quick lookup by order
CREATE INDEX idx_order_audit_log_order_id ON order_audit_log(order_id);

-- Index for audit queries by actor
CREATE INDEX idx_order_audit_log_actor_id ON order_audit_log(actor_id);

-- Index for time-based queries
CREATE INDEX idx_order_audit_log_created_at ON order_audit_log(created_at DESC);

-- ===========================================
-- RLS Policies
-- ===========================================
ALTER TABLE order_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON order_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Customers can view audit logs for their own orders
CREATE POLICY "Customers can view own order audit logs"
  ON order_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_audit_log.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Authenticated users can insert audit logs (via API)
CREATE POLICY "Authenticated users can insert audit logs"
  ON order_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No updates or deletes - audit log is immutable
-- (No UPDATE or DELETE policies)

-- ===========================================
-- Add refunded_quantity to order_items
-- ===========================================
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS refunded_quantity INTEGER DEFAULT 0 CHECK (refunded_quantity >= 0);
