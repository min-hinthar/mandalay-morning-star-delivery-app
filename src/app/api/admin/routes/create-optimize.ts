import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";
import { optimizeRouteStops } from "@/lib/services/route-optimization";
import { logger } from "@/lib/utils/logger";
import { isAutoOptimizeEnabled } from "./create-guards";

/**
 * Result of the post-create auto-optimization pass.
 *
 * Extracted from route.ts purely for the 400-line `max-lines` cap — wiring the
 * `route_optimization_enabled` gate pushed the handler to 401 counted lines.
 * Behaviour is unchanged from the inline version.
 */
export interface RouteOptimizationOutcome {
  autoOptimizeEnabled: boolean;
  optimized: boolean;
  totalDurationSeconds?: number;
  totalDistanceMeters?: number;
  optimizationMethod?: string;
  timeWindowViolations: Array<{
    stopId: string;
    orderId: string;
    eta: string;
    windowEnd: string;
    minutesLate: number;
  }>;
}

interface StopRow {
  id: string;
  order_id: string;
  orders: {
    delivery_window_start: string | null;
    delivery_window_end: string | null;
    addresses: {
      lat: number | null;
      lng: number | null;
      line_1: string;
      city: string;
      state: string;
      postal_code: string;
    } | null;
  } | null;
}

/**
 * Optimize a freshly-created route's stop order, honouring the
 * `route_optimization_enabled` operations setting.
 *
 * Never throws: optimization is a nice-to-have on top of a route that is
 * already committed, so a failure is logged and the route stands unoptimized.
 */
export async function optimizeNewRoute(
  // Typed as the concrete client rather than a structural subset — a subset
  // trips TS2589 against the generated Database generics (see create-guards).
  supabase: SupabaseClient<Database>,
  routeId: string
): Promise<RouteOptimizationOutcome> {
  const autoOptimizeEnabled = await isAutoOptimizeEnabled(() =>
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "route_optimization_enabled")
      .maybeSingle()
  );

  const outcome: RouteOptimizationOutcome = {
    autoOptimizeEnabled,
    optimized: false,
    timeWindowViolations: [],
  };

  if (!autoOptimizeEnabled) return outcome;

  try {
    const { data: routeStops } = await supabase
      .from("route_stops")
      .select(
        `
        id,
        order_id,
        orders (
          delivery_window_start,
          delivery_window_end,
          addresses (
            lat,
            lng,
            line_1,
            city,
            state,
            postal_code
          )
        )
      `
      )
      .eq("route_id", routeId)
      .order("stop_index", { ascending: true })
      .returns<StopRow[]>();

    // Only optimize if all stops have coordinates
    const validStops = routeStops?.filter(
      (s) => s.orders?.addresses?.lat != null && s.orders?.addresses?.lng != null
    );

    if (validStops && validStops.length === routeStops?.length && validStops.length > 1) {
      const stopsForOptimization = validStops.map((stop) => ({
        id: stop.id,
        order_id: stop.order_id,
        address: {
          lat: stop.orders!.addresses!.lat,
          lng: stop.orders!.addresses!.lng,
          line_1: stop.orders!.addresses!.line_1,
          city: stop.orders!.addresses!.city,
          state: stop.orders!.addresses!.state,
          postal_code: stop.orders!.addresses!.postal_code,
        },
        deliveryWindowStart: stop.orders?.delivery_window_start,
        deliveryWindowEnd: stop.orders?.delivery_window_end,
      }));

      const result = await optimizeRouteStops(routeId, stopsForOptimization);

      // Batch update stop indices via RPC
      await supabase.rpc("batch_update_stop_indices", {
        p_stop_ids: result.orderedStopIds,
        p_indices: result.orderedStopIds.map((_, i) => i),
      });

      // Update route with polyline
      if (result.polyline) {
        await supabase
          .from("routes")
          .update({ optimized_polyline: result.polyline })
          .eq("id", routeId);
      }

      outcome.optimized = true;
      outcome.totalDurationSeconds = result.totalDuration;
      outcome.totalDistanceMeters = result.totalDistance;
      outcome.optimizationMethod = result.method;
      outcome.timeWindowViolations = result.timeWindowViolations;
    }
  } catch (optimizeError) {
    // Don't block route creation on optimization failure
    logger.warn("Auto-optimization failed for new route", {
      api: "admin/routes",
      routeId,
      error: optimizeError instanceof Error ? optimizeError.message : String(optimizeError),
    });
  }

  return outcome;
}
