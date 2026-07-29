-- Graduate the 25–40mi fee band into $5 steps (incident: 38.8mi Santa Monica
-- order charged the same $20 as a 26mi trip — the 25–40 band was seeded at the
-- legacy flat fee, so "graduated" pricing changed nothing below 40mi).
-- New schedule: 25–30mi $20 · 30–40mi $25 · 40–50mi $30 (local ≤25mi and the
-- >50mi per-mile tier unchanged).
--
-- Data-only (no schema change → generated types unaffected). Guarded so an
-- admin-customized schedule is never clobbered: only the exact legacy seed is
-- rewritten (jsonb equality is structural, so key order doesn't matter).

UPDATE app_settings
SET value = '[{"maxMiles":30,"feeCents":2000},{"maxMiles":40,"feeCents":2500},{"maxMiles":50,"feeCents":3000}]'::jsonb
WHERE key = 'delivery_fee_bands'
  AND value = '[{"maxMiles":40,"feeCents":2000},{"maxMiles":50,"feeCents":3000}]'::jsonb;
