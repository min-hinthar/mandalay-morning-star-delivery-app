-- ===========================================
-- 019: Customer Settings Table + Admin Settings Expansion
-- Adds per-customer preferences table and new admin settings keys
-- for delivery zones, store hours, order slots, stock alerts, and daily summaries.
-- ===========================================

-- ===========================================
-- 1. CREATE CUSTOMER_SETTINGS TABLE
-- ===========================================
-- Lazy row creation pattern: INSERT ... ON CONFLICT (user_id) DO NOTHING
-- App code creates the row on first access if it doesn't exist.

CREATE TABLE IF NOT EXISTS customer_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dietary_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_instructions TEXT DEFAULT '',
  default_address JSONB DEFAULT NULL,
  notification_prefs JSONB NOT NULL DEFAULT '{"order_updates": true, "marketing": true, "reminders": true}'::jsonb,
  theme TEXT DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 2. UPDATED_AT TRIGGER
-- ===========================================
-- Reuses update_updated_at_column() from migration 001

DROP TRIGGER IF EXISTS update_customer_settings_updated_at ON customer_settings;
CREATE TRIGGER update_customer_settings_updated_at
  BEFORE UPDATE ON customer_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. RLS POLICIES
-- ===========================================
ALTER TABLE customer_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read own row; admins can read all
CREATE POLICY customer_settings_select ON customer_settings
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR public.is_admin()
  );

-- Authenticated users can insert own row only
CREATE POLICY customer_settings_insert ON customer_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- Authenticated users can update own row only
CREATE POLICY customer_settings_update ON customer_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ===========================================
-- 4. COMMENTS
-- ===========================================
COMMENT ON TABLE customer_settings IS 'Per-customer preferences using lazy row creation (INSERT ON CONFLICT DO NOTHING on first access)';
COMMENT ON COLUMN customer_settings.user_id IS 'References profiles(id), one row per customer';
COMMENT ON COLUMN customer_settings.dietary_restrictions IS 'JSON array of dietary restriction strings (e.g. ["vegetarian", "gluten-free"])';
COMMENT ON COLUMN customer_settings.delivery_instructions IS 'Default delivery instructions for this customer';
COMMENT ON COLUMN customer_settings.default_address IS 'JSON object with default delivery address fields, or NULL';
COMMENT ON COLUMN customer_settings.notification_prefs IS 'Notification preferences: order_updates, marketing, reminders';
COMMENT ON COLUMN customer_settings.theme IS 'UI theme preference: system, light, or dark';

-- ===========================================
-- 5. NEW ADMIN SETTINGS KEYS
-- ===========================================
-- Expands app_settings with delivery zones, store hours, order capacity,
-- stock alerts, and daily summary toggle.

-- Delivery zones: array of {name, fee_cents, description}
INSERT INTO app_settings (key, value, category) VALUES
  ('delivery_zones', '[]'::jsonb, 'delivery')
ON CONFLICT (key) DO NOTHING;

-- Store hours: per-day open/close/closed schedule
INSERT INTO app_settings (key, value, category) VALUES
  ('store_hours', '{"monday":{"open":"09:00","close":"21:00","closed":false},"tuesday":{"open":"09:00","close":"21:00","closed":false},"wednesday":{"open":"09:00","close":"21:00","closed":false},"thursday":{"open":"09:00","close":"21:00","closed":false},"friday":{"open":"09:00","close":"21:00","closed":false},"saturday":{"open":"10:00","close":"22:00","closed":false},"sunday":{"open":"10:00","close":"20:00","closed":false}}'::jsonb, 'operations')
ON CONFLICT (key) DO NOTHING;

-- Max orders per delivery time slot
INSERT INTO app_settings (key, value, category) VALUES
  ('max_orders_per_slot', '20'::jsonb, 'operations')
ON CONFLICT (key) DO NOTHING;

-- Low stock threshold for alerts
INSERT INTO app_settings (key, value, category) VALUES
  ('low_stock_threshold', '10'::jsonb, 'notifications')
ON CONFLICT (key) DO NOTHING;

-- Daily summary email toggle
INSERT INTO app_settings (key, value, category) VALUES
  ('daily_summary_enabled', 'false'::jsonb, 'notifications')
ON CONFLICT (key) DO NOTHING;
