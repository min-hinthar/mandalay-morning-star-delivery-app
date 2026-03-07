-- ===========================================
-- 025: Driver Pay Rate Setting
-- Configurable per-stop pay rate for driver earnings computation
-- ===========================================

-- Add driver_pay_per_stop_cents to app_settings
-- Default: 500 cents ($5.00 per stop)
INSERT INTO app_settings (key, value, category) VALUES
  ('driver_pay_per_stop_cents', '500'::jsonb, 'operations')
ON CONFLICT (key) DO NOTHING;
