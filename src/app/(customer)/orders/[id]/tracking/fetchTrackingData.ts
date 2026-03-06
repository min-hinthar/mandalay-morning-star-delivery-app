import type { SupabaseClient } from "@supabase/supabase-js";
import { getDeliveryPhotoSignedUrl } from "@/lib/supabase/delivery-photos";
import { calculateETA, calculateRemainingStops } from "@/lib/utils/eta";
import type { TrackingData } from "@/types/tracking";
import type { OrderStatus } from "@/types/database";
import type { RouteStatus, RouteStopStatus, VehicleType } from "@/types/driver";

const RESTAURANT_LOCATION = { lat: 34.0522, lng: -118.2437 };

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  addresses: {
    line_1: string;
    line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    lat: number | null;
    lng: number | null;
  } | null;
  order_items: {
    id: string;
    name_snapshot: string;
    quantity: number;
    order_item_modifiers: { name_snapshot: string }[];
  }[];
}

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

export async function fetchTrackingData(
  supabase: SupabaseClient,
  orderId: string,
  userId: string
): Promise<TrackingData | null> {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `id, user_id, status, placed_at, confirmed_at, delivered_at,
       cancelled_at, cancellation_reason, delivery_window_start,
       delivery_window_end, special_instructions, subtotal_cents,
       delivery_fee_cents, tax_cents, total_cents,
       addresses (line_1, line_2, city, state, postal_code, lat, lng),
       order_items (id, name_snapshot, quantity, order_item_modifiers (name_snapshot))`
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .returns<OrderRow[]>()
    .single();

  if (orderError || !order) return null;

  const address = order.addresses
    ? {
        line1: order.addresses.line_1,
        line2: order.addresses.line_2,
        city: order.addresses.city,
        state: order.addresses.state,
        postalCode: order.addresses.postal_code,
        lat: order.addresses.lat,
        lng: order.addresses.lng,
      }
    : { line1: "", line2: null, city: "", state: "", postalCode: "", lat: null, lng: null };

  const items = order.order_items.map((i) => ({
    id: i.id,
    name: i.name_snapshot,
    quantity: i.quantity,
    modifiers: i.order_item_modifiers.map((m) => m.name_snapshot),
  }));

  let routeStop: TrackingData["routeStop"] = null;
  let driver: TrackingData["driver"] = null;
  let driverLocation: TrackingData["driverLocation"] = null;
  let eta: TrackingData["eta"] = null;
  let routeId: string | null = null;
  let rating: number | null = null;

  // Route stop
  const { data: stopData } = await supabase
    .from("route_stops")
    .select(`id, stop_index, status, eta, delivery_photo_url, routes (id, status, driver_id)`)
    .eq("order_id", orderId)
    .returns<StopRow[]>()
    .single();

  if (stopData?.routes) {
    routeId = stopData.routes.id;

    const { count: totalStops } = await supabase
      .from("route_stops")
      .select("*", { count: "exact", head: true })
      .eq("route_id", routeId);

    routeStop = {
      id: stopData.id,
      stopIndex: stopData.stop_index,
      totalStops: totalStops ?? 0,
      currentStop: stopData.stop_index,
      status: stopData.status as RouteStopStatus,
      eta: stopData.eta,
      deliveryPhotoUrl: await getDeliveryPhotoSignedUrl(stopData.delivery_photo_url),
    };

    // Driver info
    if (stopData.routes.driver_id) {
      const { data: driverData } = await supabase
        .from("drivers")
        .select(
          `id, profile_image_url, vehicle_type, license_plate,
           profiles!drivers_user_id_fkey (full_name, phone)`
        )
        .eq("id", stopData.routes.driver_id)
        .returns<DriverRow[]>()
        .single();

      if (driverData) {
        driver = {
          id: driverData.id,
          fullName: driverData.profiles?.full_name ?? null,
          profileImageUrl: driverData.profile_image_url,
          phone: driverData.profiles?.phone ?? null,
          vehicleType: (driverData.vehicle_type as VehicleType) ?? null,
          licensePlate: driverData.license_plate ?? null,
        };
      }
    }

    // Live location + ETA
    const routeStatus = stopData.routes.status as RouteStatus;
    const orderStatus = order.status as OrderStatus;

    if (
      routeStatus === "in_progress" &&
      orderStatus === "out_for_delivery" &&
      stopData.routes.driver_id
    ) {
      const { data: loc } = await supabase
        .from("location_updates")
        .select("latitude, longitude, recorded_at, accuracy, heading")
        .eq("route_id", routeId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .returns<LocationRow[]>()
        .single();

      if (loc) {
        driverLocation = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          recorded_at: loc.recorded_at,
          accuracy: loc.accuracy,
          heading: loc.heading,
        };

        if (address.lat && address.lng) {
          const { data: currentStopData } = await supabase
            .from("route_stops")
            .select("stop_index")
            .eq("route_id", routeId)
            .in("status", ["pending", "enroute"])
            .order("stop_index", { ascending: true })
            .limit(1)
            .single();

          const currentStopIndex = currentStopData?.stop_index ?? stopData.stop_index;
          const remainingStops = calculateRemainingStops(currentStopIndex, stopData.stop_index);
          const etaResult = calculateETA({
            driverLocation: { lat: loc.latitude, lng: loc.longitude },
            customerLocation: { lat: address.lat, lng: address.lng },
            remainingStops,
          });

          eta = {
            minMinutes: etaResult.minMinutes,
            maxMinutes: etaResult.maxMinutes,
            estimatedArrival: etaResult.estimatedArrival.toISOString(),
          };
        }
      }
    }
  }

  // Rating
  const { data: driverRating } = await supabase
    .from("driver_ratings")
    .select("rating")
    .eq("order_id", orderId)
    .single();
  if (driverRating) rating = driverRating.rating;

  return {
    order: {
      id: order.id,
      status: order.status as OrderStatus,
      placedAt: order.placed_at,
      confirmedAt: order.confirmed_at,
      deliveredAt: order.delivered_at,
      cancelledAt: order.cancelled_at ?? null,
      cancellationReason: order.cancellation_reason ?? null,
      deliveryWindowStart: order.delivery_window_start,
      deliveryWindowEnd: order.delivery_window_end,
      specialInstructions: order.special_instructions,
      deliveryNotes: order.special_instructions,
      address,
      items,
      subtotalCents: order.subtotal_cents,
      deliveryFeeCents: order.delivery_fee_cents,
      taxCents: order.tax_cents,
      totalCents: order.total_cents,
    },
    routeStop,
    driver,
    driverLocation,
    eta,
    routeId,
    restaurantLocation: RESTAURANT_LOCATION,
    rating,
  };
}
