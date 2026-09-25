import { createServiceClient } from "@/lib/supabase/server";
import { getDeliveryPhotoSignedUrl } from "@/lib/supabase/delivery-photos";
import { calculateETA, calculateRemainingStops } from "@/lib/utils/eta";
import type { OrderStatus } from "@/types/database";
import type { RouteStatus, RouteStopStatus, VehicleType } from "@/types/driver";
import type { TrackingData } from "@/types/tracking";

/**
 * Route / driver / live-location half of the customer tracking payload.
 *
 * SERVICE CLIENT — call ONLY after the caller has proven the viewer may see
 * `orderId` (an owner-scoped order read that returned the row). Every read
 * below is scoped to that order: its stop, that stop's route, that route's
 * driver and location.
 *
 * Why not the customer's own client: routes_select / drivers_select /
 * profiles_select are driver-or-admin (or owner-only), so through the
 * customer's client the routes embed was always null — tracking never showed
 * the driver, "stop X of Y", the ETA, the live map or the delivery photo, and
 * a stop count on the customer's client only ever counted their own stop.
 * Widening those policies instead would expose other customers' stops and the
 * route polyline, and the driver's email/role/availability.
 */

interface StopRow {
  id: string;
  stop_index: number;
  status: string;
  eta: string | null;
  delivery_photo_url: string | null;
  routes: { id: string; status: string; driver_id: string | null } | null;
}

interface DriverRow {
  id: string;
  profile_image_url: string | null;
  vehicle_type: string | null;
  license_plate: string | null;
  profiles: { full_name: string | null; phone: string | null } | null;
}

interface LocationRow {
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
  heading: number | null;
}

export type RouteTracking = Pick<
  TrackingData,
  "routeStop" | "driver" | "driverLocation" | "eta" | "routeId"
>;

export async function loadRouteTracking(args: {
  orderId: string;
  orderStatus: OrderStatus;
  customerLocation: { lat: number | null; lng: number | null };
}): Promise<RouteTracking> {
  const { orderId, orderStatus, customerLocation } = args;
  const result: RouteTracking = {
    routeStop: null,
    driver: null,
    driverLocation: null,
    eta: null,
    routeId: null,
  };

  const service = createServiceClient();

  const { data: stop } = await service
    .from("route_stops")
    .select("id, stop_index, status, eta, delivery_photo_url, routes (id, status, driver_id)")
    .eq("order_id", orderId)
    .returns<StopRow[]>()
    .maybeSingle();

  if (!stop?.routes) return result;
  const route = stop.routes;
  result.routeId = route.id;

  const { count: totalStops } = await service
    .from("route_stops")
    .select("*", { count: "exact", head: true })
    .eq("route_id", route.id);

  result.routeStop = {
    id: stop.id,
    stopIndex: stop.stop_index,
    totalStops: totalStops ?? 0,
    currentStop: stop.stop_index,
    status: stop.status as RouteStopStatus,
    eta: stop.eta,
    deliveryPhotoUrl: await getDeliveryPhotoSignedUrl(stop.delivery_photo_url),
  };

  if (!route.driver_id) return result;

  const { data: driver } = await service
    .from("drivers")
    .select(
      "id, profile_image_url, vehicle_type, license_plate, profiles!drivers_user_id_fkey (full_name, phone)"
    )
    .eq("id", route.driver_id)
    .returns<DriverRow[]>()
    .maybeSingle();

  if (driver) {
    result.driver = {
      id: driver.id,
      fullName: driver.profiles?.full_name ?? null,
      profileImageUrl: driver.profile_image_url,
      phone: driver.profiles?.phone ?? null,
      vehicleType: (driver.vehicle_type as VehicleType) ?? null,
      licensePlate: driver.license_plate ?? null,
    };
  }

  // Live location only while THIS order is out on an in-progress route — not
  // before dispatch, and not after it's delivered while the driver carries on.
  if ((route.status as RouteStatus) !== "in_progress" || orderStatus !== "out_for_delivery") {
    return result;
  }

  const { data: loc } = await service
    .from("location_updates")
    .select("latitude, longitude, recorded_at, accuracy, heading")
    .eq("route_id", route.id)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .returns<LocationRow[]>()
    .maybeSingle();

  if (!loc) return result;
  result.driverLocation = {
    latitude: loc.latitude,
    longitude: loc.longitude,
    recorded_at: loc.recorded_at,
    accuracy: loc.accuracy,
    heading: loc.heading,
  };

  if (customerLocation.lat == null || customerLocation.lng == null) return result;

  // The driver's actual next stop (first pending/enroute on the route).
  const { data: current } = await service
    .from("route_stops")
    .select("stop_index")
    .eq("route_id", route.id)
    .in("status", ["pending", "enroute"])
    .order("stop_index", { ascending: true })
    .limit(1)
    .returns<{ stop_index: number }[]>()
    .maybeSingle();

  const remainingStops = calculateRemainingStops(
    current?.stop_index ?? stop.stop_index,
    stop.stop_index
  );
  const etaResult = calculateETA({
    driverLocation: { lat: loc.latitude, lng: loc.longitude },
    customerLocation: { lat: customerLocation.lat, lng: customerLocation.lng },
    remainingStops,
  });
  result.eta = {
    minMinutes: etaResult.minMinutes,
    maxMinutes: etaResult.maxMinutes,
    estimatedArrival: etaResult.estimatedArrival.toISOString(),
  };

  return result;
}
