-- ===========================================
-- 20260530b: Welcome email dedupe flag
-- ===========================================
-- One-time stamp so the "welcome, here's $5" email fires once per customer.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcomed_at TIMESTAMPTZ;
