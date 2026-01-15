-- ===========================================
-- V2-001: Driver Operations & Tracking Schema
-- ===========================================

-- ===========================================
-- 1. ROUTE STATUS ENUM
-- ===========================================
DO $$
BEGIN
  CREATE TYPE route_status AS ENUM (
    'planned',
    'in_progress',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- 2. ROUTE STOP STATUS ENUM
-- ===========================================
DO $$
BEGIN
  CREATE TYPE route_stop_status AS ENUM (
    'pending',
    'enroute',
    'arrived',
    'delivered',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- 3. VEHICLE TYPE ENUM
-- ===========================================
DO $$
BEGIN
  CREATE TYPE vehicle_type AS ENUM (
    'car',
    'motorcycle',
    'bicycle',
    'van',
    'truck'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- 4. EXCEPTION TYPE ENUM
-- ===========================================
DO $$
BEGIN
  CREATE TYPE delivery_exception_type AS ENUM (
    'customer_not_home',
    'wrong_address',
    'access_issue',
    'refused_delivery',
    'damaged_order',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- 5. DRIVERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS drivers (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for active drivers
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);

-- ===========================================
-- 6. ROUTES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS routes (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(delivery_date);
CREATE INDEX IF NOT EXISTS idx_routes_driver ON routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);

-- ===========================================
-- 7. ROUTE STOPS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS route_stops (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id, stop_index);
CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops(order_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_status ON route_stops(status);

-- ===========================================
-- 8. LOCATION UPDATES TABLE (GPS Tracking)
-- ===========================================
CREATE TABLE IF NOT EXISTS location_updates (
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

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_location_updates_driver_time
  ON location_updates(driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_updates_route
  ON location_updates(route_id, recorded_at DESC);

-- Partition hint: Consider partitioning by month for production
-- ALTER TABLE location_updates
--   PARTITION BY RANGE (recorded_at);

-- ===========================================
-- 9. DELIVERY EXCEPTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS delivery_exceptions (
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

-- Index for unresolved exceptions
CREATE INDEX IF NOT EXISTS idx_delivery_exceptions_unresolved
  ON delivery_exceptions(route_stop_id)
  WHERE resolved_at IS NULL;

-- ===========================================
-- 10. TRIGGERS FOR updated_at
-- ===========================================
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_stops_updated_at
  BEFORE UPDATE ON route_stops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 11. ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all new tables
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_exceptions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- DRIVERS POLICIES
-- ---------------------------------------------
-- Admins can manage all drivers
CREATE POLICY "Admins can manage drivers" ON drivers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Drivers can read their own profile
CREATE POLICY "Drivers can read own profile" ON drivers
  FOR SELECT
  USING (user_id = auth.uid());

-- Drivers can update their own profile (limited fields handled in API)
CREATE POLICY "Drivers can update own profile" ON drivers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------
-- ROUTES POLICIES
-- ---------------------------------------------
-- Admins can manage all routes
CREATE POLICY "Admins can manage routes" ON routes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Drivers can read their assigned routes
CREATE POLICY "Drivers can read assigned routes" ON routes
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Drivers can update their assigned routes (status only, handled in API)
CREATE POLICY "Drivers can update assigned routes" ON routes
  FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------
-- ROUTE STOPS POLICIES
-- ---------------------------------------------
-- Admins can manage all route stops
CREATE POLICY "Admins can manage route stops" ON route_stops
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Drivers can read stops on their routes
CREATE POLICY "Drivers can read route stops" ON route_stops
  FOR SELECT
  USING (
    route_id IN (
      SELECT r.id FROM routes r
      JOIN drivers d ON r.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Drivers can update stops on their routes
CREATE POLICY "Drivers can update route stops" ON route_stops
  FOR UPDATE
  USING (
    route_id IN (
      SELECT r.id FROM routes r
      JOIN drivers d ON r.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Customers can read their own order's stop (for tracking)
CREATE POLICY "Customers can read own order stops" ON route_stops
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------
-- LOCATION UPDATES POLICIES
-- ---------------------------------------------
-- Admins can read all location updates
CREATE POLICY "Admins can read locations" ON location_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Drivers can insert their own location
CREATE POLICY "Drivers can insert own location" ON location_updates
  FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Drivers can read their own location history
CREATE POLICY "Drivers can read own locations" ON location_updates
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Customers can read driver location for their active order
CREATE POLICY "Customers can read driver location for their order" ON location_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM route_stops rs
      JOIN routes r ON rs.route_id = r.id
      JOIN orders o ON rs.order_id = o.id
      WHERE o.user_id = auth.uid()
      AND r.status = 'in_progress'
      AND location_updates.route_id = r.id
    )
  );

-- ---------------------------------------------
-- DELIVERY EXCEPTIONS POLICIES
-- ---------------------------------------------
-- Admins can manage all exceptions
CREATE POLICY "Admins can manage exceptions" ON delivery_exceptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Drivers can create exceptions on their stops
CREATE POLICY "Drivers can create exceptions" ON delivery_exceptions
  FOR INSERT
  WITH CHECK (
    route_stop_id IN (
      SELECT rs.id FROM route_stops rs
      JOIN routes r ON rs.route_id = r.id
      JOIN drivers d ON r.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Drivers can read exceptions on their routes
CREATE POLICY "Drivers can read exceptions" ON delivery_exceptions
  FOR SELECT
  USING (
    route_stop_id IN (
      SELECT rs.id FROM route_stops rs
      JOIN routes r ON rs.route_id = r.id
      JOIN drivers d ON r.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- ===========================================
-- 12. HELPER FUNCTION: Get driver's latest location
-- ===========================================
CREATE OR REPLACE FUNCTION get_driver_latest_location(p_driver_id UUID)
RETURNS TABLE (
  latitude NUMERIC,
  longitude NUMERIC,
  recorded_at TIMESTAMPTZ,
  accuracy NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lu.latitude,
    lu.longitude,
    lu.recorded_at,
    lu.accuracy
  FROM location_updates lu
  WHERE lu.driver_id = p_driver_id
  ORDER BY lu.recorded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 13. HELPER FUNCTION: Calculate route stats
-- ===========================================
CREATE OR REPLACE FUNCTION calculate_route_stats(p_route_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_stops', COUNT(*),
    'pending_stops', COUNT(*) FILTER (WHERE status = 'pending'),
    'delivered_stops', COUNT(*) FILTER (WHERE status = 'delivered'),
    'skipped_stops', COUNT(*) FILTER (WHERE status = 'skipped'),
    'completion_rate',
      CASE
        WHEN COUNT(*) > 0 THEN
          ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / COUNT(*)) * 100, 1)
        ELSE 0
      END
  ) INTO v_stats
  FROM route_stops
  WHERE route_id = p_route_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_driver_latest_location TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_route_stats TO authenticated;
