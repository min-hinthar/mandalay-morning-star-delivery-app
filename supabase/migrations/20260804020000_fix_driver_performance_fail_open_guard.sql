-- Repair get_driver_performance's fail-OPEN authorization guard.
--
-- Follow-up to #173 (20260612120000 / 120001 / 120002), which fixed exactly this
-- shape in three sibling RPCs and left this one behind.
--
-- Every claim below was re-verified against the tree at 2602a2fd before this
-- was committed, not taken on trust:
--
--   * baseline:1146 really is `IF NOT public.is_admin() AND p_driver_id !=
--     public.get_my_driver_id()`. get_my_driver_id() returns NULL for a caller
--     who is not a driver, so `p_driver_id != NULL` is NULL, `TRUE AND NULL` is
--     NULL, the IF is not taken, and the function returns another driver's
--     stats. It only ever fires for a caller who IS a driver asking about a
--     DIFFERENT driver — an ordinary customer session walks straight through.
--   * #173 fixed the siblings with the NULL-safe `IS DISTINCT FROM` at
--     20260612120000:401, :449 and :477. Same shape adopted verbatim here.
--   * get_driver_performance, calculate_route_stats and is_driver have ZERO
--     .rpc() callers in src/.
--   * is_driver appears 5 times in the baseline — its definition (1378) and its
--     four GRANT/REVOKE lines (1835-1838). No policy calls it.
--   * calculate_route_stats IS SECURITY DEFINER; apply_item_refunds,
--     batch_update_stop_indices, reindex_route_stops and update_route_stats are
--     all SECURITY INVOKER, so RLS already constrains them.
--   * No trigger calls any of them, so no revoke here can break a trigger.
--   * #173 already revoked `anon` on get_driver_performance and
--     calculate_route_stats (20260612120000:499-500), so the `authenticated`
--     revokes below are the new part, not a duplicate.
--   * apply_item_refunds(uuid, jsonb, boolean) still matches the signature
--     rewritten by 20260612160000, so the REVOKE resolves.
--
-- DB-DRIFT NEUTRAL. The signature is unchanged, so CREATE OR REPLACE cannot
-- move the generated Functions block. Revokes do not either: merge_routes was
-- revoked from anon by #173 and still appears in database.generated.ts, which
-- shows the generator introspects the schema rather than ACLs.

CREATE OR REPLACE FUNCTION public.get_driver_performance(p_driver_id uuid)
 RETURNS TABLE(total_deliveries bigint, deliveries_last_7_days bigint, deliveries_last_30_days bigint, on_time_rate numeric, avg_rating numeric, total_ratings bigint, total_exceptions bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.jwt() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.is_admin()
     AND p_driver_id IS DISTINCT FROM public.get_my_driver_id()
  THEN
    RAISE EXCEPTION 'Access denied'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    ds.total_deliveries,
    ds.deliveries_last_7_days,
    ds.deliveries_last_30_days,
    ds.on_time_rate,
    ds.avg_rating,
    ds.total_ratings,
    ds.total_exceptions
  FROM driver_stats_mv ds
  WHERE ds.driver_id = p_driver_id;
END;
$function$
;

-- ---------------------------------------------------------------------------
-- 2. Revokes. CREATE OR REPLACE above preserves the existing ACL, so these run
--    after it deliberately.
-- ---------------------------------------------------------------------------

-- get_driver_performance: zero app callers (only src/types/database.generated.ts:1781);
-- not referenced by any policy. Belt to go with the guard above, so a future
-- accidental GRANT cannot reopen it.
REVOKE EXECUTE ON FUNCTION public.get_driver_performance(uuid) FROM authenticated;

-- calculate_route_stats: SECURITY DEFINER read over route_stops with NO
-- authorization check at all, so it bypasses route_stops_select (baseline:2353)
-- which otherwise scopes a customer to their own stop. Route UUIDs are not
-- secret — src/app/api/tracking/[orderId]/route.ts:366 returns routeId to the
-- customer. Zero app callers (generated type only). Not referenced by any policy.
REVOKE EXECUTE ON FUNCTION public.calculate_route_stats(uuid) FROM authenticated;

-- is_driver: self-scoped on auth.uid() so it was never exploitable, but it is
-- dead — grep of the baseline finds it in zero policies, and no .rpc() caller
-- exists. The #173 comment (20260612120002:11-13) groups it with is_admin /
-- get_my_driver_id, which DO need the grant; is_driver does not.
-- (Left callable by `authenticated` so any future policy use still works.)
REVOKE EXECUTE ON FUNCTION public.is_driver() FROM anon;

-- The four below are SECURITY INVOKER (verified: no SECURITY DEFINER in the
-- baseline definitions), so RLS already constrains an anon caller and these are
-- hygiene, not a hole. All four have real admin/driver callers on caller-scoped
-- clients, which is why only `anon` is revoked and `authenticated` is kept.
REVOKE EXECUTE ON FUNCTION public.apply_item_refunds(uuid, jsonb, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.batch_update_stop_indices(uuid[], integer[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reindex_route_stops(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_route_stats(uuid) FROM anon;
