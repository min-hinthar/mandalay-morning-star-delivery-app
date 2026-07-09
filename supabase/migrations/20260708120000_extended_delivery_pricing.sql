-- Extended delivery pricing: graduated 0–50mi bands + 50–100mi long-distance auto-quote.
-- Data-only (seeds app_settings rows); no schema change, so generated types are unaffected.
-- Runtime already falls back to BUSINESS_RULES_DEFAULTS when these keys are absent; this
-- makes them visible/editable in the admin Settings → Delivery form.

INSERT INTO app_settings (key, value, category, description) VALUES
  (
    'delivery_fee_bands',
    '[{"maxMiles":40,"feeCents":2000},{"maxMiles":50,"feeCents":3000}]'::jsonb,
    'delivery',
    'Graduated distance fee bands (local zone edge → standard radius)'
  ),
  (
    'extended_delivery_enabled',
    'true'::jsonb,
    'delivery',
    'Offer long-distance delivery beyond the standard radius (per-mile auto-quote)'
  ),
  (
    'extended_delivery_per_mile_cents',
    '150'::jsonb,
    'delivery',
    'Per-mile surcharge beyond the standard radius (cents)'
  ),
  (
    'max_delivery_radius_miles',
    '100'::jsonb,
    'delivery',
    'Absolute maximum delivery radius including the long-distance tier (miles)'
  )
ON CONFLICT (key) DO NOTHING;

-- Align the standard radius with the top graduated band. Only touches the legacy
-- default (40); never clobbers an admin-customized value.
UPDATE app_settings
SET value = '50'::jsonb
WHERE key = 'delivery_radius_miles' AND value = '40'::jsonb;
