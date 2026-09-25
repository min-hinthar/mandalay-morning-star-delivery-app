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
  updated_at: string;
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
  /** The viewer owns the order (not a share-token holder). */
  isOwner: boolean;
}): Promise<RouteTracking> {
  const { orderId, orderStatus, customerLocation, isOwner } = args;
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
    .select(
      "id, stop_index, status, eta, delivery_photo_url, updated_at, routes (id, status, driver_id)"
    )
    .eq("order_id", orderId)
    // An order skipped on one route can be re-delivered on a later one (UNIQUE
    // is per route) — track the newest stop, not an ambiguous pair.
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<StopRow[]>()
    .maybeSingle();

  if (!stop?.routes) return result;
  const route = stop.routes;
  result.routeId = route.id;

  const { count: totalStops } = await service
    .from("route_stops")
    .select("*", { count: "exact", head: true })
    .eq("route_id", route.id);

  // The driver's actual position on the route: the first stop not yet
  // delivered/skipped (0-based, like stop_index). Every stop terminal → the run
  // is done, so progress reads full.
  const { data: current } = await service
    .from("route_stops")
    .select("stop_index")
    .eq("route_id", route.id)
    .in("status", ["pending", "enroute", "arrived"])
    .order("stop_index", { ascending: true })
    .limit(1)
    .returns<{ stop_index: number }[]>()
    .maybeSingle();
  const currentStop = current?.stop_index ?? totalStops ?? 0;

  result.routeStop = {
    id: stop.id,
    stopIndex: stop.stop_index,
    totalStops: totalStops ?? 0,
    currentStop,
    status: stop.status as RouteStopStatus,
    eta: stop.eta,
    deliveryPhotoUrl: await getDeliveryPhotoSignedUrl(stop.delivery_photo_url),
  };

  if (!route.driver_id) return result;

  // The driver is on THIS customer's leg: their stop is the current one on an
  // in-progress route and the order is out for delivery. Only then does the
  // customer get the driver's phone, plate and live position — never while the
  // driver is still at earlier customers' doors, and never after this stop is
  // delivered or skipped. Mirrors app_private.location_visible_to_my_order
  // (the realtime channel's RLS), 20260925180000 §6.
  // Owner only: a share-token holder is a bearer of a forwarded link, and the
  // realtime policy (o.user_id = auth.uid()) never streams to them either.
  const onMyLeg =
    isOwner &&
    (route.status as RouteStatus) === "in_progress" &&
    orderStatus === "out_for_delivery" &&
    (stop.status === "enroute" || stop.status === "arrived");

  const { data: driver } = await service
    .from("drivers")
    .select(
      "id, profile_image_url, vehicle_type, license_plate, profiles!drivers_user_id_fkey (full_name, phone)"
    )
    .eq("id", route.driver_id)
    .returns<DriverRow[]>()
    .maybeSingle();

  if (driver) {
    // Name + photo are fine to show for the whole order (and to rate by);
    // the personal phone and the plate only while the driver is on this leg.
    result.driver = {
      id: driver.id,
      fullName: driver.profiles?.full_name ?? null,
      profileImageUrl: driver.profile_image_url,
      phone: onMyLeg ? (driver.profiles?.phone ?? null) : null,
      vehicleType: onMyLeg ? ((driver.vehicle_type as VehicleType) ?? null) : null,
      licensePlate: onMyLeg ? (driver.license_plate ?? null) : null,
    };
  }

  if (!onMyLeg) return result;

  const { data: loc } = await service
    .from("location_updates")
    .select("latitude, longitude, recorded_at, accuracy, heading")
    .eq("route_id", route.id)
    .gte("recorded_at", stop.updated_at)
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

  const remainingStops = calculateRemainingStops(currentStop, stop.stop_index);
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
