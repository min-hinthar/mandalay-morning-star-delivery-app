/**
 * Shared transformers for route and stop data.
 * Converts snake_case DB rows to camelCase API responses.
 */

import type { RoutesRow, RouteStopsRow, RouteStats } from "@/types/driver";

export interface TransformedRouteListItem {
  id: string;
  deliveryDate: string;
  status: string;
  stopCount: number;
  deliveredCount: number;
  completionRate: number;
  createdAt: string;
  estimatedDurationMinutes: number | null;
  driver: { id: string; fullName: string | null } | null;
  declinedByDriverName: string | null;
}

export interface TransformedStop {
  id: string;
  stopIndex: number;
  eta: string | null;
  status: string;
  arrivedAt: string | null;
  deliveredAt: string | null;
  deliveryPhotoUrl: string | null;
  deliveryNotes: string | null;
}

export function transformRouteForList(
  route: RoutesRow & {
    drivers: {
      id: string;
      profiles: { full_name: string | null } | null;
    } | null;
    route_stops: Array<{ id: string; status: string }>;
    declined_driver?: {
      profiles: { full_name: string | null } | null;
    } | null;
  }
): TransformedRouteListItem {
  const stopCount = route.route_stops?.length ?? 0;
  const deliveredCount = route.route_stops?.filter((s) => s.status === "delivered").length ?? 0;
  const statsJson = route.stats_json as RouteStats | null;

  return {
    id: route.id,
    deliveryDate: route.delivery_date,
    driver: route.drivers
      ? {
          id: route.drivers.id,
          fullName: route.drivers.profiles?.full_name ?? null,
        }
      : null,
    status: route.status,
    stopCount,
    deliveredCount,
    completionRate: stopCount > 0 ? Math.round((deliveredCount / stopCount) * 100) : 0,
    createdAt: route.created_at,
    estimatedDurationMinutes: statsJson?.total_duration_minutes ?? null,
    declinedByDriverName: route.declined_driver?.profiles?.full_name ?? null,
  };
}

export function transformStop(stop: RouteStopsRow): TransformedStop {
  return {
    id: stop.id,
    stopIndex: stop.stop_index,
    eta: stop.eta,
    status: stop.status,
    arrivedAt: stop.arrived_at,
    deliveredAt: stop.delivered_at,
    deliveryPhotoUrl: stop.delivery_photo_url,
    deliveryNotes: stop.delivery_notes,
  };
}
