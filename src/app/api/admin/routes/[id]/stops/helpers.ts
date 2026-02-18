import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function updateRouteStats(supabase: ServerClient, routeId: string) {
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
