-- Minimum order for deliveries beyond the LOCAL radius (> long_distance_threshold_miles).
--
-- A long-haul run costs the same to drive whether the order is $27 or $127, so
-- low-value far orders lose money (real case: a 38.8mi delivery for a $27
-- subtotal — ~78 miles round trip). This sets the floor those orders must clear.
-- Local orders keep the existing global minimum_order_cents ($25).
--
-- Data-only (app_settings is key/value JSONB) → no schema change, so the
-- blocking db-drift job and generated types are unaffected.

INSERT INTO app_settings (key, value, category, description) VALUES
  (
    'extended_min_order_cents',
    '10000'::jsonb,
    'delivery',
    'Minimum subtotal (cents) required for delivery beyond the local radius'
  )
ON CONFLICT (key) DO NOTHING;
