-- Reset all order-related data for production launch.
-- Keeps users, addresses, menu items, and all other non-order data intact.
-- Run via Supabase Dashboard SQL Editor or `supabase db push`.

TRUNCATE TABLE
  delivery_exceptions,
  route_stops,
  driver_ratings,
  notification_logs,
  order_audit_log,
  order_item_modifiers,
  order_items,
  webhook_events,
  orders
CASCADE;
