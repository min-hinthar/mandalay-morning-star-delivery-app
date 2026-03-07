-- ===========================================
-- 021: Driver Gamification
-- Badges table + streak/weekly delivery functions
-- ===========================================

-- ===========================================
-- 1. DRIVER BADGES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS driver_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (driver_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_driver_badges_driver_id ON driver_badges(driver_id);

-- ===========================================
-- 2. RLS POLICIES
-- ===========================================

ALTER TABLE driver_badges ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own badges
CREATE POLICY "driver_badges_select_own"
  ON driver_badges FOR SELECT
  USING (
    driver_id = public.get_my_driver_id()
  );

-- Admins can view all badges
CREATE POLICY "driver_badges_select_admin"
  ON driver_badges FOR SELECT
  USING (public.is_admin());

-- Only admins can insert badges
CREATE POLICY "driver_badges_insert_admin"
  ON driver_badges FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can delete badges
CREATE POLICY "driver_badges_delete_admin"
  ON driver_badges FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 3. STREAK CALCULATION FUNCTION
-- Walks backwards from yesterday through consecutive
-- dates with completed routes. Adds +1 if today has
-- a completed or in_progress route.
-- ===========================================

CREATE OR REPLACE FUNCTION calculate_driver_streak(p_driver_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_route BOOLEAN;
BEGIN
  -- Check if today has an active/completed route
  SELECT EXISTS(
    SELECT 1 FROM routes
    WHERE driver_id = p_driver_id
      AND delivery_date = CURRENT_DATE
      AND status IN ('in_progress', 'completed')
  ) INTO v_has_route;

  IF v_has_route THEN
    v_streak := 1;
  END IF;

  -- Walk backwards from yesterday
  v_check_date := CURRENT_DATE - 1;

  LOOP
    SELECT EXISTS(
      SELECT 1 FROM routes
      WHERE driver_id = p_driver_id
        AND delivery_date = v_check_date
        AND status = 'completed'
    ) INTO v_has_route;

    EXIT WHEN NOT v_has_route;

    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  RETURN v_streak;
END;
$$;

-- ===========================================
-- 4. WEEKLY DELIVERIES FUNCTION
-- Counts delivered stops for current week (Mon-Sun)
-- ===========================================

CREATE OR REPLACE FUNCTION calculate_driver_weekly_deliveries(p_driver_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_week_start DATE;
BEGIN
  -- ISO week starts Monday
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM route_stops rs
  JOIN routes r ON r.id = rs.route_id
  WHERE r.driver_id = p_driver_id
    AND r.delivery_date >= v_week_start
    AND r.delivery_date < v_week_start + 7
    AND rs.status = 'delivered';

  RETURN v_count;
END;
$$;

-- ===========================================
-- 5. GRANTS
-- ===========================================

GRANT SELECT, INSERT, DELETE ON driver_badges TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_driver_streak TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_driver_weekly_deliveries TO authenticated;
