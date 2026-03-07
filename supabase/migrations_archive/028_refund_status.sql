-- Migration 028: Add refund_status column to orders table
-- Phase 77 BUG-07: Track refund state as derived column
-- Values: 'none' | 'partial' | 'full'
-- Auto-computed via trigger when order_items.refunded_quantity changes

-- 1. Add refund_status column with CHECK constraint
ALTER TABLE orders ADD COLUMN refund_status text NOT NULL DEFAULT 'none'
  CHECK (refund_status IN ('none', 'partial', 'full'));

-- 2. Create trigger function to auto-compute refund_status
CREATE OR REPLACE FUNCTION compute_order_refund_status()
RETURNS TRIGGER AS $$
DECLARE
  total_qty integer;
  total_refunded integer;
BEGIN
  SELECT
    COALESCE(SUM(quantity), 0),
    COALESCE(SUM(COALESCE(refunded_quantity, 0)), 0)
  INTO total_qty, total_refunded
  FROM order_items
  WHERE order_id = NEW.order_id;

  UPDATE orders
  SET refund_status = CASE
    WHEN total_refunded = 0 THEN 'none'
    WHEN total_refunded >= total_qty THEN 'full'
    ELSE 'partial'
  END
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger on order_items
CREATE TRIGGER trg_compute_refund_status
AFTER UPDATE OF refunded_quantity ON order_items
FOR EACH ROW EXECUTE FUNCTION compute_order_refund_status();

-- 4. Partial index for filtering (only non-'none' values indexed)
CREATE INDEX idx_orders_refund_status ON orders (refund_status)
WHERE refund_status != 'none';

-- 5. Backfill existing orders with refunds
UPDATE orders o
SET refund_status = CASE
  WHEN agg.total_refunded = 0 THEN 'none'
  WHEN agg.total_refunded >= agg.total_qty THEN 'full'
  ELSE 'partial'
END
FROM (
  SELECT
    order_id,
    COALESCE(SUM(quantity), 0) AS total_qty,
    COALESCE(SUM(COALESCE(refunded_quantity, 0)), 0) AS total_refunded
  FROM order_items
  GROUP BY order_id
) agg
WHERE o.id = agg.order_id
  AND agg.total_refunded > 0;
