-- Route Pipeline Hardening Migration
-- Addresses: double-assignment prevention, stop_index bounds, composite indexes,
-- route completion guard, atomic reindexing, and SQL-based stats aggregation.

-- 1. Prevent order from being in multiple active (non-completed) routes
-- Can't use a partial unique index here because the filter needs to reference
-- the parent `routes` table (cross-table predicates must be immutable).
-- Use a BEFORE INSERT trigger instead.
CREATE OR REPLACE FUNCTION prevent_duplicate_active_assignment()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM route_stops rs
    JOIN routes r ON r.id = rs.route_id
    WHERE rs.order_id = NEW.order_id
      AND r.status != 'completed'
      AND rs.route_id != NEW.route_id
  ) THEN
    RAISE EXCEPTION 'Order % is already assigned to an active route', NEW.order_id
      USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_active_assignment ON route_stops;
CREATE TRIGGER trg_prevent_duplicate_active_assignment
  BEFORE INSERT ON route_stops
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_active_assignment();

-- 2. Stop index bounds check
ALTER TABLE route_stops
  ADD CONSTRAINT chk_stop_index_bounds
  CHECK (stop_index >= 0 AND stop_index < 1000);

-- 3. Composite index for driver schedule queries
CREATE INDEX IF NOT EXISTS idx_routes_driver_date
  ON routes (driver_id, delivery_date)
  WHERE driver_id IS NOT NULL;

-- 4. Route completion guard: can only complete if all stops are terminal
CREATE OR REPLACE FUNCTION check_route_completion()
RETURNS trigger AS $$
DECLARE
  non_terminal_count integer;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT count(*) INTO non_terminal_count
    FROM route_stops
    WHERE route_id = NEW.id
      AND status NOT IN ('delivered', 'skipped');

    IF non_terminal_count > 0 THEN
      RAISE EXCEPTION 'Cannot complete route: % stops are not in terminal state (delivered/skipped)', non_terminal_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_route_completion ON routes;
CREATE TRIGGER trg_check_route_completion
  BEFORE UPDATE ON routes
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION check_route_completion();

-- 5. Atomic stop reindexing RPC
-- Reindexes all stops for a route after a deletion, in a single transaction
CREATE OR REPLACE FUNCTION reindex_route_stops(p_route_id uuid)
RETURNS void AS $$
BEGIN
  -- Use a CTE to compute new indices and update in one shot
  WITH ranked AS (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE route_id = p_route_id
  )
  UPDATE route_stops rs
  SET stop_index = ranked.new_index
  FROM ranked
  WHERE rs.id = ranked.id
    AND rs.stop_index != ranked.new_index;
END;
$$ LANGUAGE plpgsql;

-- 6. SQL-based route stats aggregation RPC
-- Replaces N+1 pattern: single query to compute and update stats
CREATE OR REPLACE FUNCTION update_route_stats(p_route_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_stops', count(*),
    'pending_stops', count(*) FILTER (WHERE status = 'pending'),
    'delivered_stops', count(*) FILTER (WHERE status = 'delivered'),
    'skipped_stops', count(*) FILTER (WHERE status = 'skipped'),
    'completion_rate', CASE
      WHEN count(*) > 0
      THEN round((count(*) FILTER (WHERE status = 'delivered'))::numeric / count(*) * 100)
      ELSE 0
    END
  )
  INTO v_stats
  FROM route_stops
  WHERE route_id = p_route_id;

  UPDATE routes
  SET stats_json = v_stats
  WHERE id = p_route_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- 7. Batch update stop indices RPC (for optimization results)
-- Updates multiple stop indices in a single transaction
CREATE OR REPLACE FUNCTION batch_update_stop_indices(
  p_stop_ids uuid[],
  p_indices int[]
)
RETURNS void AS $$
BEGIN
  IF array_length(p_stop_ids, 1) != array_length(p_indices, 1) THEN
    RAISE EXCEPTION 'stop_ids and indices arrays must have same length';
  END IF;

  UPDATE route_stops rs
  SET stop_index = data.new_index
  FROM unnest(p_stop_ids, p_indices) AS data(stop_id, new_index)
  WHERE rs.id = data.stop_id;
END;
$$ LANGUAGE plpgsql;
