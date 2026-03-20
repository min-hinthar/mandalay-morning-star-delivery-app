-- Atomic stop promotion: prevents double-promotion on concurrent stop completions
-- Uses FOR UPDATE SKIP LOCKED to ensure two concurrent requests never promote the same stop

CREATE OR REPLACE FUNCTION promote_next_stop(
  p_route_id uuid,
  p_completed_stop_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_next_stop_id uuid;
  v_next_stop_index int;
BEGIN
  -- Validate completed stop belongs to this route and is in terminal state
  IF NOT EXISTS (
    SELECT 1 FROM route_stops
    WHERE id = p_completed_stop_id
      AND route_id = p_route_id
      AND status IN ('delivered', 'skipped')
  ) THEN
    RAISE EXCEPTION 'Stop % is not a completed stop in route %',
      p_completed_stop_id, p_route_id
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Atomically select and lock the next pending stop
  -- SKIP LOCKED: if another transaction has this row locked, skip it
  -- and find the next one (prevents double-promotion)
  SELECT id, stop_index
  INTO v_next_stop_id, v_next_stop_index
  FROM route_stops
  WHERE route_id = p_route_id
    AND status = 'pending'
  ORDER BY stop_index ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- No pending stops remain - all stops are complete
  IF v_next_stop_id IS NULL THEN
    -- Still update stats to reflect final state
    PERFORM update_route_stats(p_route_id);
    RETURN jsonb_build_object(
      'promoted_stop_id', NULL,
      'stop_index', NULL
    );
  END IF;

  -- Promote the locked stop to enroute
  UPDATE route_stops
  SET status = 'enroute'
  WHERE id = v_next_stop_id;

  -- Update route stats atomically within the same transaction
  PERFORM update_route_stats(p_route_id);

  RETURN jsonb_build_object(
    'promoted_stop_id', v_next_stop_id,
    'stop_index', v_next_stop_index
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users (matches existing RPC grants)
GRANT EXECUTE ON FUNCTION promote_next_stop(uuid, uuid) TO authenticated;
