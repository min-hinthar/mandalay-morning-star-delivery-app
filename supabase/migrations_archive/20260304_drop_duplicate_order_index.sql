-- Allow multiple orders per customer per delivery day
-- Previously CHKT-05 enforced one non-cancelled order per user per Saturday
DROP INDEX IF EXISTS idx_orders_user_delivery_date;
