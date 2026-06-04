-- Migration: Update split_route and merge_routes RPCs for assigned/accepted lifecycle
-- Phase 101: Driver Experience
-- Changes:
--   split_route: new route gets 'assigned' if driver assigned; source reset to 'assigned' if was accepted
--   merge_routes: allow merging assigned/accepted routes; target becomes 'assigned' if has driver

-- split_route: atomically move selected stops to a new route
CREATE OR REPLACE FUNCTION split_route(
  p_source_route_id uuid,
  p_stop_ids uuid[],
  p_new_driver_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_new_route_id uuid;
  v_delivery_date date;
  v_remaining_count int;
  v_source_status text;
  v_new_status text;
BEGIN
  -- Validate source route exists
  SELECT delivery_date, status INTO STRICT v_delivery_date, v_source_status
  FROM routes WHERE id = p_source_route_id;

  -- Validate all stop IDs belong to source route
  IF NOT (
    SELECT count(*) = array_length(p_stop_ids, 1)
    FROM route_stops
    WHERE id = ANY(p_stop_ids) AND route_id = p_source_route_id
  ) THEN
    RAISE EXCEPTION 'Some stop IDs do not belong to source route';
  END IF;

  -- Validate at least 1 stop remains in source after split
  SELECT count(*) INTO v_remaining_count
  FROM route_stops
  WHERE route_id = p_source_route_id AND id != ALL(p_stop_ids);

  IF v_remaining_count < 1 THEN
    RAISE EXCEPTION 'At least one stop must remain in the source route';
  END IF;

  -- Determine new route status: 'assigned' if driver provided, else 'planned'
  IF p_new_driver_id IS NOT NULL THEN
    v_new_status := 'assigned';
  ELSE
    v_new_status := 'planned';
  END IF;

  -- Create new route
  INSERT INTO routes (delivery_date, driver_id, status)
  VALUES (v_delivery_date, p_new_driver_id, v_new_status)
  RETURNING id INTO v_new_route_id;

  -- Defer unique constraint for reindexing
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  -- Move stops via UPDATE (avoids prevent_duplicate_active_assignment trigger on INSERT)
  UPDATE route_stops
  SET route_id = v_new_route_id, stop_index = sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE id = ANY(p_stop_ids)
  ) sub
  WHERE route_stops.id = sub.id;

  -- Reindex source route remaining stops
  PERFORM reindex_route_stops(p_source_route_id);

  -- If source was 'accepted', reset to 'assigned' (driver needs to re-accept modified route)
  IF v_source_status IN ('assigned', 'accepted') THEN
    UPDATE routes
    SET status = 'assigned', accepted_at = NULL
    WHERE id = p_source_route_id;
  END IF;

  -- Update stats for both routes
  PERFORM update_route_stats(p_source_route_id);
  PERFORM update_route_stats(v_new_route_id);

  RETURN v_new_route_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- merge_routes: atomically absorb source route stops into destination, delete source
CREATE OR REPLACE FUNCTION merge_routes(
  p_destination_route_id uuid,
  p_source_route_id uuid
)
RETURNS int AS $$
DECLARE
  v_max_index int;
  v_total_stops int;
  v_source_status text;
  v_dest_driver_id uuid;
BEGIN
  -- Validate source is not in_progress or completed (allow planned, assigned, accepted)
  SELECT status INTO STRICT v_source_status
  FROM routes WHERE id = p_source_route_id;

  IF v_source_status NOT IN ('planned', 'assigned', 'accepted') THEN
    RAISE EXCEPTION 'Can only merge planned/assigned/accepted routes (source is %)', v_source_status;
  END IF;

  -- Validate destination route exists and get its driver_id
  SELECT driver_id INTO STRICT v_dest_driver_id
  FROM routes WHERE id = p_destination_route_id;

  -- Get max stop_index in destination
  SELECT COALESCE(MAX(stop_index), -1) INTO v_max_index
  FROM route_stops WHERE route_id = p_destination_route_id;

  -- Defer unique constraint
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  -- Move all stops from source to destination, appending after last stop
  UPDATE route_stops
  SET route_id = p_destination_route_id,
      stop_index = v_max_index + 1 + sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE route_id = p_source_route_id
  ) sub
  WHERE route_stops.id = sub.id;

  -- Delete source route (no more stops, safe to delete)
  DELETE FROM routes WHERE id = p_source_route_id;

  -- After merge, if target has a driver, set to 'assigned' (driver needs to re-accept modified route)
  IF v_dest_driver_id IS NOT NULL THEN
    UPDATE routes
    SET status = 'assigned', accepted_at = NULL
    WHERE id = p_destination_route_id;
  END IF;

  -- Update destination stats
  PERFORM update_route_stats(p_destination_route_id);

  -- Return total stop count
  SELECT count(*) INTO v_total_stops
  FROM route_stops WHERE route_id = p_destination_route_id;

  RETURN v_total_stops;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
