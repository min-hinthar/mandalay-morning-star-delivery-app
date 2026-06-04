-- ===========================================
-- 001: Consolidated Schema
-- Extensions, ENUMs, all tables (final form), materialized views
-- Consolidated from 39 incremental migrations
-- ===========================================

-- ===========================================
-- EXTENSIONS
-- ===========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS (all values upfront — no ALTER TYPE needed)
-- ===========================================

CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
);

CREATE TYPE route_status AS ENUM ('planned', 'in_progress', 'completed');

CREATE TYPE route_stop_status AS ENUM ('pending', 'enroute', 'arrived', 'delivered', 'skipped');

CREATE TYPE vehicle_type AS ENUM ('car', 'motorcycle', 'bicycle', 'van', 'truck');

CREATE TYPE delivery_exception_type AS ENUM (
  'customer_not_home', 'wrong_address', 'access_issue', 'refused_delivery', 'damaged_order', 'other'
);

-- 8 values (includes cancellation, refund, delivery_reminder from 020)
CREATE TYPE notification_type AS ENUM (
  'order_confirmation', 'out_for_delivery', 'arriving_soon', 'delivered',
  'feedback_request', 'cancellation', 'refund', 'delivery_reminder'
);

-- 7 values (includes opened, clicked from 020)
CREATE TYPE notification_status AS ENUM (
  'pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'
);

-- ===========================================
-- 1. PROFILES (extends auth.users)
-- ===========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'driver')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- ===========================================
-- 2. ADDRESSES
-- ===========================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  line_1 TEXT NOT NULL,
  line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CA',
  postal_code TEXT NOT NULL,
  formatted_address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- ===========================================
-- 3. MENU_CATEGORIES
-- ===========================================
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_categories_sort ON menu_categories(sort_order);

-- ===========================================
-- 4. MENU_ITEMS (includes image_updated_at from 033)
-- ===========================================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_my TEXT,
  description_en TEXT,
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents >= 0),
  image_url TEXT,
  image_updated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_sold_out BOOLEAN NOT NULL DEFAULT false,
  allergens TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_active ON menu_items(is_active) WHERE is_active = true;

-- ===========================================
-- 5. MODIFIER_GROUPS
-- ===========================================
CREATE TABLE modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  selection_type TEXT NOT NULL DEFAULT 'single' CHECK (selection_type IN ('single', 'multiple')),
  min_select INTEGER NOT NULL DEFAULT 0,
  max_select INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- 6. MODIFIER_OPTIONS
-- ===========================================
CREATE TABLE modifier_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_delta_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modifier_options_group ON modifier_options(group_id);

-- ===========================================
-- 7. ITEM_MODIFIER_GROUPS (join table)
-- ===========================================
CREATE TABLE item_modifier_groups (
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, group_id)
);

CREATE INDEX idx_item_modifier_groups_item ON item_modifier_groups(item_id);
CREATE INDEX idx_item_modifier_groups_group ON item_modifier_groups(group_id);

-- ===========================================
-- 8. ORDERS (without assigned_driver_id — added after drivers table)
-- Includes: refund_status (028), needs_contact (030), tip/promo/discount (035),
--           rating_dismissed/share_token (036), is_priority (20260214)
-- ===========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  tip_cents INTEGER NOT NULL DEFAULT 0 CHECK (tip_cents >= 0),
  promo_code TEXT,
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  delivery_window_start TIMESTAMPTZ,
  delivery_window_end TIMESTAMPTZ,
  special_instructions TEXT,
  delivery_instructions TEXT,
  stripe_payment_intent_id TEXT,
  refund_status TEXT NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none', 'partial', 'full')),
  rating_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  share_token TEXT UNIQUE,
  is_priority BOOLEAN DEFAULT FALSE,
  needs_contact BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMPTZ,
  contacted_by UUID REFERENCES profiles(id),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_address ON orders(address_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at DESC);

-- ===========================================
-- 9. ORDER_ITEMS (includes refunded_quantity from 011)
-- ===========================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  base_price_snapshot INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0),
  special_instructions TEXT,
  refunded_quantity INTEGER DEFAULT 0 CHECK (refunded_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- ===========================================
-- 10. ORDER_ITEM_MODIFIERS
-- ===========================================
CREATE TABLE order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_option_id UUID REFERENCES modifier_options(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  price_delta_snapshot INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_item_modifiers_item ON order_item_modifiers(order_item_id);
CREATE INDEX idx_order_item_modifiers_option ON order_item_modifiers(modifier_option_id);

-- ===========================================
-- 11. DRIVERS (includes availability_json from 026, simple_mode from 031/20260302)
-- ===========================================
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type,
  license_plate TEXT,
  phone TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed_at TIMESTAMPTZ,
  rating_avg NUMERIC(3, 2) DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  deliveries_count INTEGER NOT NULL DEFAULT 0 CHECK (deliveries_count >= 0),
  availability_json JSONB DEFAULT '{"available_days": [], "blocked_dates": []}'::jsonb,
  simple_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_drivers_active ON drivers(is_active) WHERE is_active = true;
CREATE INDEX idx_drivers_user_id ON drivers(user_id);

COMMENT ON COLUMN drivers.availability_json IS
  'Driver weekly availability: available_days (recurring day-of-week) and blocked_dates (one-off YYYY-MM-DD)';
COMMENT ON COLUMN drivers.simple_mode IS
  'Simple mode UI for non-technical drivers. Default false; drivers opt in via profile page toggle.';

-- ===========================================
-- 12. CIRCULAR DEP: Add assigned_driver_id to orders
-- ===========================================
ALTER TABLE orders ADD COLUMN assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
COMMENT ON COLUMN orders.assigned_driver_id IS 'The driver assigned to deliver this order';

-- ===========================================
-- 13. ROUTES
-- ===========================================
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_date DATE NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status route_status NOT NULL DEFAULT 'planned',
  optimized_polyline TEXT,
  stats_json JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routes_date ON routes(delivery_date);
CREATE INDEX idx_routes_driver ON routes(driver_id);
CREATE INDEX idx_routes_status ON routes(status);

-- ===========================================
-- 14. ROUTE_STOPS
-- ===========================================
CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stop_index INTEGER NOT NULL CHECK (stop_index >= 0),
  eta TIMESTAMPTZ,
  status route_stop_status NOT NULL DEFAULT 'pending',
  arrived_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_photo_url TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(route_id, order_id),
  UNIQUE(route_id, stop_index)
);

CREATE INDEX idx_route_stops_route ON route_stops(route_id, stop_index);
CREATE INDEX idx_route_stops_order ON route_stops(order_id);
CREATE INDEX idx_route_stops_status ON route_stops(status);

-- ===========================================
-- 15. LOCATION_UPDATES (GPS Tracking)
-- ===========================================
CREATE TABLE location_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy NUMERIC,
  heading NUMERIC,
  speed NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT DEFAULT 'mobile',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_location_updates_driver_time ON location_updates(driver_id, recorded_at DESC);
CREATE INDEX idx_location_updates_route ON location_updates(route_id, recorded_at DESC);

-- ===========================================
-- 16. DELIVERY_EXCEPTIONS
-- ===========================================
CREATE TABLE delivery_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_stop_id UUID NOT NULL REFERENCES route_stops(id) ON DELETE CASCADE,
  exception_type delivery_exception_type NOT NULL,
  description TEXT,
  photo_url TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_exceptions_stop ON delivery_exceptions(route_stop_id);
CREATE INDEX idx_delivery_exceptions_resolved_by ON delivery_exceptions(resolved_by);
CREATE INDEX idx_delivery_exceptions_unresolved ON delivery_exceptions(route_stop_id) WHERE resolved_at IS NULL;

-- ===========================================
-- 17. NOTIFICATION_LOGS (includes retry_count from 030)
-- ===========================================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notification_type notification_type NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  recipient TEXT NOT NULL,
  subject TEXT,
  resend_id TEXT,
  status notification_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_order ON notification_logs(order_id);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at DESC);

-- ===========================================
-- 18. DRIVER_RATINGS
-- ===========================================
CREATE TABLE driver_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  route_stop_id UUID REFERENCES route_stops(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id)
);

CREATE INDEX idx_driver_ratings_driver ON driver_ratings(driver_id);
CREATE INDEX idx_driver_ratings_order ON driver_ratings(order_id);
CREATE INDEX idx_driver_ratings_stop ON driver_ratings(route_stop_id);
CREATE INDEX idx_driver_ratings_submitted ON driver_ratings(submitted_at DESC);

-- ===========================================
-- 19. ORDER_AUDIT_LOG (from 011)
-- ===========================================
CREATE TABLE order_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('status_change', 'cancel', 'refund', 'edit')),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('customer', 'admin', 'driver', 'system')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_order_audit_log_order_id ON order_audit_log(order_id);
CREATE INDEX idx_order_audit_log_actor_id ON order_audit_log(actor_id);
CREATE INDEX idx_order_audit_log_created_at ON order_audit_log(created_at DESC);

-- ===========================================
-- 20. DRIVER_INVITES (final form: nullable token, no unique constraint)
-- ===========================================
CREATE TABLE driver_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT,
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_invites_email ON driver_invites(email);

-- ===========================================
-- 21. FEATURED_SECTIONS (includes has_unpublished_changes from 009)
-- ===========================================
CREATE TABLE featured_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT,
  accent_color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 6,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_predefined BOOLEAN NOT NULL DEFAULT false,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_featured_sections_sort ON featured_sections(sort_order);
CREATE INDEX idx_featured_sections_visible ON featured_sections(is_visible) WHERE is_visible = true AND deleted_at IS NULL;
CREATE INDEX idx_featured_sections_slug ON featured_sections(slug);

COMMENT ON TABLE featured_sections IS 'Admin-manageable featured sections for homepage display';
COMMENT ON COLUMN featured_sections.is_predefined IS 'True for system sections: Featured Dishes, Most Popular, New Arrivals';
COMMENT ON COLUMN featured_sections.deleted_at IS 'Soft delete timestamp, allows 30-day recovery';
COMMENT ON COLUMN featured_sections.item_count IS 'Number of items to display in this section';
COMMENT ON COLUMN featured_sections.has_unpublished_changes IS 'True when section has been modified but not yet published';

-- ===========================================
-- 22. FEATURED_SECTION_ITEMS (junction table)
-- ===========================================
CREATE TABLE featured_section_items (
  section_id UUID NOT NULL REFERENCES featured_sections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, item_id)
);

CREATE INDEX idx_featured_section_items_section ON featured_section_items(section_id, sort_order);
CREATE INDEX idx_featured_section_items_item ON featured_section_items(item_id);

COMMENT ON TABLE featured_section_items IS 'Junction table linking featured sections to menu items';

-- ===========================================
-- 23. APP_SETTINGS (includes description column bugfix from 023)
-- ===========================================
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('delivery', 'operations', 'notifications')),
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_app_settings_category ON app_settings(category);
CREATE INDEX idx_app_settings_key ON app_settings(key);

COMMENT ON TABLE app_settings IS 'Configurable application settings for delivery, operations, and notifications';

-- ===========================================
-- 24. CUSTOMER_SETTINGS (from 019)
-- ===========================================
CREATE TABLE customer_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dietary_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_instructions TEXT DEFAULT '',
  default_address JSONB DEFAULT NULL,
  notification_prefs JSONB NOT NULL DEFAULT '{"order_updates": true, "marketing": true, "reminders": true}'::jsonb,
  theme TEXT DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE customer_settings IS 'Per-customer preferences using lazy row creation (INSERT ON CONFLICT DO NOTHING on first access)';

-- ===========================================
-- 25. WEBHOOK_EVENTS (idempotency table from 020)
-- ===========================================
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);

COMMENT ON TABLE webhook_events IS 'Idempotency table for Resend webhook events — prevents duplicate processing';

-- ===========================================
-- 26. DRIVER_BADGES (from 021)
-- ===========================================
CREATE TABLE driver_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (driver_id, badge_type)
);

CREATE INDEX idx_driver_badges_driver_id ON driver_badges(driver_id);

-- ===========================================
-- 27. WEBHOOK_AUDIT_LOGS (from 030)
-- ===========================================
CREATE TABLE webhook_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  svix_id TEXT,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  source_ip TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_audit_svix_id ON webhook_audit_logs(svix_id);
CREATE INDEX idx_webhook_audit_created ON webhook_audit_logs(created_at DESC);

-- ===========================================
-- MATERIALIZED VIEWS (from 003)
-- ===========================================

-- Driver Stats
CREATE MATERIALIZED VIEW driver_stats_mv AS
SELECT
  d.id AS driver_id,
  d.user_id,
  p.full_name,
  p.email,
  d.is_active,
  d.vehicle_type,
  d.profile_image_url,
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered') AS total_deliveries,
  COUNT(DISTINCT rs.id) FILTER (
    WHERE rs.status = 'delivered' AND rs.delivered_at >= NOW() - INTERVAL '7 days'
  ) AS deliveries_last_7_days,
  COUNT(DISTINCT rs.id) FILTER (
    WHERE rs.status = 'delivered' AND rs.delivered_at >= NOW() - INTERVAL '30 days'
  ) AS deliveries_last_30_days,
  COALESCE(
    ROUND(
      (COUNT(DISTINCT rs.id) FILTER (
        WHERE rs.status = 'delivered'
        AND (rs.eta IS NULL OR rs.delivered_at <= rs.eta + INTERVAL '10 minutes')
      )::NUMERIC /
      NULLIF(COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'), 0)) * 100
    , 1)
  , 0) AS on_time_rate,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (rs.delivered_at - rs.arrived_at)) / 60)
    FILTER (WHERE rs.status = 'delivered' AND rs.arrived_at IS NOT NULL)
  , 1) AS avg_delivery_minutes,
  COUNT(DISTINCT dr.id) AS total_ratings,
  ROUND(AVG(dr.rating)::NUMERIC, 2) AS avg_rating,
  COUNT(dr.id) FILTER (WHERE dr.rating = 5) AS ratings_5_star,
  COUNT(dr.id) FILTER (WHERE dr.rating = 4) AS ratings_4_star,
  COUNT(dr.id) FILTER (WHERE dr.rating = 3) AS ratings_3_star,
  COUNT(dr.id) FILTER (WHERE dr.rating = 2) AS ratings_2_star,
  COUNT(dr.id) FILTER (WHERE dr.rating = 1) AS ratings_1_star,
  COUNT(DISTINCT de.id) AS total_exceptions,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'customer_not_home') AS exceptions_not_home,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'wrong_address') AS exceptions_wrong_address,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'access_issue') AS exceptions_access,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'refused_delivery') AS exceptions_refused,
  COUNT(DISTINCT de.id) FILTER (WHERE de.exception_type = 'damaged_order') AS exceptions_damaged,
  d.created_at AS driver_since,
  MAX(r.completed_at) AS last_route_completed
FROM drivers d
LEFT JOIN profiles p ON d.user_id = p.id
LEFT JOIN routes r ON d.id = r.driver_id
LEFT JOIN route_stops rs ON r.id = rs.route_id
LEFT JOIN driver_ratings dr ON d.id = dr.driver_id
LEFT JOIN delivery_exceptions de ON rs.id = de.route_stop_id
GROUP BY d.id, d.user_id, p.full_name, p.email, d.is_active, d.vehicle_type, d.profile_image_url, d.created_at;

CREATE UNIQUE INDEX idx_driver_stats_mv_driver_id ON driver_stats_mv(driver_id);

-- Delivery Metrics
CREATE MATERIALIZED VIEW delivery_metrics_mv AS
SELECT
  r.delivery_date,
  COUNT(DISTINCT o.id) AS total_orders,
  SUM(o.total_cents) AS total_revenue_cents,
  ROUND(AVG(o.total_cents)) AS avg_order_cents,
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered') AS delivered_count,
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'skipped') AS skipped_count,
  COUNT(DISTINCT rs.id) AS total_stops,
  COALESCE(
    ROUND(
      (COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered')::NUMERIC /
       NULLIF(COUNT(DISTINCT rs.id), 0)) * 100
    , 1)
  , 0) AS delivery_success_rate,
  COALESCE(
    ROUND(
      (COUNT(DISTINCT rs.id) FILTER (
        WHERE rs.status = 'delivered'
        AND rs.eta IS NOT NULL
        AND ABS(EXTRACT(EPOCH FROM (rs.delivered_at - rs.eta))) <= 600
      )::NUMERIC /
       NULLIF(COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered' AND rs.eta IS NOT NULL), 0)) * 100
    , 1)
  , 0) AS eta_accuracy_rate,
  COUNT(DISTINCT r.id) AS total_routes,
  COUNT(DISTINCT r.driver_id) AS active_drivers,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 60
  ) FILTER (WHERE r.status = 'completed'), 1) AS avg_route_duration_minutes,
  COUNT(DISTINCT de.id) AS total_exceptions
FROM routes r
LEFT JOIN route_stops rs ON r.id = rs.route_id
LEFT JOIN orders o ON rs.order_id = o.id
LEFT JOIN delivery_exceptions de ON rs.id = de.route_stop_id
WHERE r.delivery_date >= NOW() - INTERVAL '90 days'
GROUP BY r.delivery_date
ORDER BY r.delivery_date DESC;

CREATE UNIQUE INDEX idx_delivery_metrics_mv_date ON delivery_metrics_mv(delivery_date);

COMMENT ON MATERIALIZED VIEW driver_stats_mv IS 'Aggregated driver performance metrics';
COMMENT ON MATERIALIZED VIEW delivery_metrics_mv IS 'Daily delivery KPIs for operations dashboard';
