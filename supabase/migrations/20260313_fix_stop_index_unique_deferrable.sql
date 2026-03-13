-- Fix: UNIQUE(route_id, stop_index) blocks batch reorder because PostgreSQL
-- checks per-row during UPDATE. Make it DEFERRABLE so it's checked at COMMIT.
-- Also update the RPC to defer the constraint before updating.

-- 1. Replace the unique constraint with a deferrable version
ALTER TABLE route_stops
  DROP CONSTRAINT IF EXISTS route_stops_route_id_stop_index_key;

ALTER TABLE route_stops
  ADD CONSTRAINT route_stops_route_id_stop_index_key
  UNIQUE (route_id, stop_index)
  DEFERRABLE INITIALLY IMMEDIATE;

-- 2. Update the RPC to defer constraint during batch update
CREATE OR REPLACE FUNCTION batch_update_stop_indices(
  p_stop_ids uuid[],
  p_indices int[]
)
RETURNS void AS $$
BEGIN
  IF array_length(p_stop_ids, 1) != array_length(p_indices, 1) THEN
    RAISE EXCEPTION 'stop_ids and indices arrays must have same length';
  END IF;

  -- Defer uniqueness check until end of transaction
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  UPDATE route_stops rs
  SET stop_index = data.new_index
  FROM unnest(p_stop_ids, p_indices) AS data(stop_id, new_index)
  WHERE rs.id = data.stop_id;
END;
$$ LANGUAGE plpgsql;
