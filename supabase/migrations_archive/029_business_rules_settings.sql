-- Migration 029: Business rules settings
-- Adds new delivery config keys and fixes mismatched seed values.

-- Insert new business-rule keys (idempotent)
INSERT INTO app_settings (key, value, category)
VALUES
  ('cutoff_day', '5'::jsonb, 'delivery'),
  ('cutoff_hour', '15'::jsonb, 'delivery'),
  ('delivery_start_hour', '11'::jsonb, 'delivery'),
  ('delivery_end_hour', '19'::jsonb, 'delivery'),
  ('max_delivery_duration_minutes', '60'::jsonb, 'delivery')
ON CONFLICT (key) DO NOTHING;

-- Fix mismatched seed values (only if they still hold old defaults)
UPDATE app_settings
SET value = '1500'::jsonb
WHERE key = 'base_delivery_fee_cents'
  AND value = '599'::jsonb;

UPDATE app_settings
SET value = '10000'::jsonb
WHERE key = 'free_delivery_threshold_cents'
  AND value = '5000'::jsonb;
