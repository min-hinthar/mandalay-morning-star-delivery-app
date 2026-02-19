-- Seed admin contact info for deactivated driver page
INSERT INTO app_settings (key, value, category, description)
VALUES (
  'admin_contact_info',
  '{"email": "admin@morningstar.com", "phone": ""}'::jsonb,
  'operations',
  'Contact information shown to deactivated drivers'
)
ON CONFLICT (key) DO NOTHING;
