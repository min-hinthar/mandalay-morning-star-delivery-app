import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Updates route stats using a single SQL aggregate query via RPC.
 * Replaces the previous N+1 pattern (SELECT all stops + filter in JS + UPDATE).
 */
export async function updateRouteStats(supabase: ServerClient, routeId: string) {
  const { error } = await supabase.rpc("update_route_stats", {
    p_route_id: routeId,
  });

  if (error) {
    // Fallback to client-side computation if RPC not available
    const { data: allStops } = await supabase
      .from("route_stops")
      .select("status")
      .eq("route_id", routeId)
      .returns<{ status: string }[]>();

    if (allStops) {
      const stats = {
        total_stops: allStops.length,
        pending_stops: allStops.filter((s) => s.status === "pending").length,
        delivered_stops: allStops.filter((s) => s.status === "delivered").length,
        skipped_stops: allStops.filter((s) => s.status === "skipped").length,
        completion_rate:
          allStops.length > 0
            ? Math.round(
                (allStops.filter((s) => s.status === "delivered").length / allStops.length) * 100
              )
            : 0,
      };

      await supabase.from("routes").update({ stats_json: stats }).eq("id", routeId);
    }
  }
}

/**
 * Atomically reindexes all stops for a route via SQL RPC.
 * Replaces N separate UPDATE queries that could leave corrupted indices on failure.
 */
export async function reindexRouteStops(supabase: ServerClient, routeId: string) {
  const { error } = await supabase.rpc("reindex_route_stops", {
    p_route_id: routeId,
  });

  if (error) {
    // Fallback to client-side reindexing if RPC not available
    const { data: remainingStops } = await supabase
      .from("route_stops")
      .select("id")
      .eq("route_id", routeId)
      .order("stop_index", { ascending: true })
      .returns<{ id: string }[]>();

    if (remainingStops) {
      for (let i = 0; i < remainingStops.length; i++) {
        await supabase.from("route_stops").update({ stop_index: i }).eq("id", remainingStops[i].id);
      }
    }
  }
}
