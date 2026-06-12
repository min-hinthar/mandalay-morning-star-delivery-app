-- Strip the PUBLIC EXECUTE grant from the locked-down SECURITY DEFINER
-- functions.
--
-- Production's function ACLs carried an explicit PUBLIC entry (`=X/postgres`),
-- so 20260612120000's `REVOKE ... FROM anon` removed the anon entry but anon
-- (and any role) could still execute via PUBLIC — verified live with
-- has_function_privilege() after the first apply. Local stacks built from the
-- baseline don't have the PUBLIC entry; these statements are no-ops there.
--
-- Explicit authenticated/service_role grants are preserved (admin/driver
-- user-scoped callers + the service-client checkout). is_admin/is_driver/
-- get_my_driver_id are intentionally untouched: RLS policies evaluate them as
-- the querying role, so anon/authenticated need EXECUTE.
--
-- Already applied to production 2026-06-12 (recorded as this version).

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_routes(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.split_route(uuid, uuid[], uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.promote_next_stop(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_driver_streak(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_driver_weekly_deliveries(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_driver_latest_location(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_route_stats(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_driver_performance(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_delivery_metrics_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_driver_stats_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_analytics_views() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_menu_item_photo() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_driver_deliveries_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_driver_rating_avg() FROM PUBLIC;

-- Re-assert the role-level revokes now that PUBLIC is gone (idempotent).
REVOKE EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.merge_routes(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.split_route(uuid, uuid[], uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.promote_next_stop(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_driver_streak(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_driver_weekly_deliveries(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_driver_latest_location(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_route_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_driver_performance(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_delivery_metrics_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_driver_stats_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_analytics_views() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_menu_item_photo() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_driver_deliveries_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_driver_rating_avg() FROM anon, authenticated;
