-- ===========================================
-- 010: App Settings Table
-- Configurable settings for delivery, operations, and notifications
-- ===========================================

-- ===========================================
-- 1. CREATE APP_SETTINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('delivery', 'operations', 'notifications')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- ===========================================
-- 2. ADD UPDATED_AT TRIGGER
-- ===========================================
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. RLS POLICIES
-- ===========================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read all settings
CREATE POLICY app_settings_admin_select ON app_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin can insert settings
CREATE POLICY app_settings_admin_insert ON app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin can update settings
CREATE POLICY app_settings_admin_update ON app_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No delete policy - settings should not be deleted
-- (restore defaults uses DELETE + INSERT which requires service role)

-- ===========================================
-- 4. SEED DEFAULT SETTINGS
-- ===========================================

-- Delivery settings
INSERT INTO app_settings (key, value, category) VALUES
  ('delivery_radius_miles', '40'::jsonb, 'delivery'),
  ('minimum_order_cents', '2500'::jsonb, 'delivery'),
  ('free_delivery_threshold_cents', '5000'::jsonb, 'delivery'),
  ('base_delivery_fee_cents', '599'::jsonb, 'delivery'),
  ('delivery_cutoff_time', '"18:00"'::jsonb, 'delivery'),
  ('delivery_time_windows', '[]'::jsonb, 'delivery')
ON CONFLICT (key) DO NOTHING;

-- Operations settings
INSERT INTO app_settings (key, value, category) VALUES
  ('max_stops_per_route', '15'::jsonb, 'operations'),
  ('auto_assign_enabled', 'false'::jsonb, 'operations'),
  ('route_optimization_enabled', 'true'::jsonb, 'operations'),
  ('default_vehicle_type', '"car"'::jsonb, 'operations')
ON CONFLICT (key) DO NOTHING;

-- Notification settings
INSERT INTO app_settings (key, value, category) VALUES
  ('email_notifications_enabled', 'true'::jsonb, 'notifications'),
  ('sms_notifications_enabled', 'false'::jsonb, 'notifications'),
  ('push_notifications_enabled', 'false'::jsonb, 'notifications'),
  ('notify_on_order_placed', 'true'::jsonb, 'notifications'),
  ('notify_on_order_status_change', 'true'::jsonb, 'notifications')
ON CONFLICT (key) DO NOTHING;

-- ===========================================
-- 5. COMMENTS
-- ===========================================
COMMENT ON TABLE app_settings IS 'Configurable application settings for delivery, operations, and notifications';
COMMENT ON COLUMN app_settings.key IS 'Unique setting identifier (snake_case)';
COMMENT ON COLUMN app_settings.value IS 'Setting value stored as JSONB for flexibility';
COMMENT ON COLUMN app_settings.category IS 'Setting category: delivery, operations, or notifications';
COMMENT ON COLUMN app_settings.updated_by IS 'Admin user who last updated this setting';
