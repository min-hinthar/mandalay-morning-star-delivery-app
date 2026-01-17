/**
 * V2 Sprint 3: Customer Order Tracking API
 * GET /api/tracking/{orderId}
 *
 * Returns comprehensive tracking data for a customer's order including:
 * - Order details and status
 * - Route stop information (if assigned)
 * - Driver information (if assigned)
 * - Live driver location (if out for delivery)
 * - Calculated ETA
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { calculateETA, calculateRemainingStops } from "@/lib/utils/eta";
import type { OrderStatus } from "@/types/database";
import type { RouteStatus, RouteStopStatus, VehicleType } from "@/types/driver";
import type {
  TrackingData,
  TrackingOrderInfo,
  TrackingRouteStopInfo,
  TrackingOrderItem,
  TrackingAddressInfo,
  TrackingApiError,
} from "@/types/tracking";

// ===========================================
// QUERY RESULT TYPES
// ===========================================

interface OrderItemModifierData {
  name_snapshot: string;
}

interface OrderItemData {
  id: string;
  name_snapshot: string;
  quantity: number;
  order_item_modifiers: OrderItemModifierData[];
}

interface AddressData {
  line_1: string;
  line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
}

interface OrderQueryResult {
  id: string;
  user_id: string;
  status: string;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  addresses: AddressData | null;
  order_items: OrderItemData[];
}

interface RouteData {
  id: string;
  status: string;
  driver_id: string | null;
}

interface DriverProfileData {
  full_name: string | null;
  phone: string | null;
}

interface DriverData {
  id: string;
  profile_image_url: string | null;
  vehicle_type: string | null;
  profiles: DriverProfileData | null;
}

interface RouteStopQueryResult {
  id: string;
  stop_index: number;
  status: string;
  eta: string | null;
  delivery_photo_url: string | null;
  routes: RouteData | null;
}

interface LocationUpdateData {
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
  heading: number | null;
}

interface CurrentStopData {
  stop_index: number;
}

// ===========================================
// ROUTE HANDLER
// ===========================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse<{ data: TrackingData } | { error: TrackingApiError }>> {
  try {
    const { orderId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED" as const,
            message: "You must be logged in to view tracking information",
          },
        },
        { status: 401 }
      );
    }

    // Fetch order with items and address
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        status,
        placed_at,
        confirmed_at,
        delivered_at,
        delivery_window_start,
        delivery_window_end,
        special_instructions,
        subtotal_cents,
        delivery_fee_cents,
        tax_cents,
        total_cents,
        addresses (
          line_1,
          line_2,
          city,
          state,
          postal_code,
          lat,
          lng
        ),
        order_items (
          id,
          name_snapshot,
          quantity,
          order_item_modifiers (
            name_snapshot
          )
        )
      `
      )
      .eq("id", orderId)
      .returns<OrderQueryResult[]>()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND" as const,
            message: "Order not found",
          },
        },
        { status: 404 }
      );
    }

    // Verify user owns this order
    if (order.user_id !== user.id) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN" as const,
            message: "You do not have permission to view this order",
          },
        },
        { status: 403 }
      );
    }

    // Transform order items
    const items: TrackingOrderItem[] = order.order_items.map((item) => ({
      id: item.id,
      name: item.name_snapshot,
      quantity: item.quantity,
      modifiers: item.order_item_modifiers.map((m) => m.name_snapshot),
    }));

    // Transform address
    const address: TrackingAddressInfo = order.addresses
      ? {
          line1: order.addresses.line_1,
          line2: order.addresses.line_2,
          city: order.addresses.city,
          state: order.addresses.state,
          postalCode: order.addresses.postal_code,
          lat: order.addresses.lat,
          lng: order.addresses.lng,
        }
      : {
          line1: "",
          line2: null,
          city: "",
          state: "",
          postalCode: "",
          lat: null,
          lng: null,
        };

    // Build order info
    const orderInfo: TrackingOrderInfo = {
      id: order.id,
      status: order.status as OrderStatus,
      placedAt: order.placed_at,
      confirmedAt: order.confirmed_at,
      deliveredAt: order.delivered_at,
      deliveryWindowStart: order.delivery_window_start,
      deliveryWindowEnd: order.delivery_window_end,
      specialInstructions: order.special_instructions,
      address,
      items,
      subtotalCents: order.subtotal_cents,
      deliveryFeeCents: order.delivery_fee_cents,
      taxCents: order.tax_cents,
      totalCents: order.total_cents,
    };

    // Default response (no route assigned)
    let routeStop: TrackingRouteStopInfo | null = null;
    let driver: TrackingData["driver"] = null;
    let driverLocation: TrackingData["driverLocation"] = null;
    let eta: TrackingData["eta"] = null;

    // Check if order is assigned to a route
    const { data: routeStopData } = await supabase
      .from("route_stops")
      .select(
        `
        id,
        stop_index,
        status,
        eta,
        delivery_photo_url,
        routes (
          id,
          status,
          driver_id
        )
      `
      )
      .eq("order_id", orderId)
      .returns<RouteStopQueryResult[]>()
      .single();

    if (routeStopData?.routes) {
      // Get total stops for this route
      const { count: totalStops } = await supabase
        .from("route_stops")
        .select("*", { count: "exact", head: true })
        .eq("route_id", routeStopData.routes.id);

      routeStop = {
        id: routeStopData.id,
        stopIndex: routeStopData.stop_index,
        totalStops: totalStops ?? 0,
        currentStop: routeStopData.stop_index,
        status: routeStopData.status as RouteStopStatus,
        eta: routeStopData.eta,
        deliveryPhotoUrl: routeStopData.delivery_photo_url,
      };

      // Get driver info if route has a driver
      if (routeStopData.routes.driver_id) {
        const { data: driverData } = await supabase
          .from("drivers")
          .select(
            `
            id,
            profile_image_url,
            vehicle_type,
            profiles!drivers_user_id_fkey (
              full_name,
              phone
            )
          `
          )
          .eq("id", routeStopData.routes.driver_id)
          .returns<DriverData[]>()
          .single();

        if (driverData) {
          driver = {
            id: driverData.id,
            fullName: driverData.profiles?.full_name ?? null,
            profileImageUrl: driverData.profile_image_url,
            phone: driverData.profiles?.phone ?? null,
            vehicleType: (driverData.vehicle_type as VehicleType) ?? null,
          };
        }
      }

      // Get driver location only if:
      // 1. Route is in_progress
      // 2. Order status is out_for_delivery
      const routeStatus = routeStopData.routes.status as RouteStatus;
      const orderStatus = order.status as OrderStatus;

      if (
        routeStatus === "in_progress" &&
        orderStatus === "out_for_delivery" &&
        routeStopData.routes.driver_id
      ) {
        const { data: locationData } = await supabase
          .from("location_updates")
          .select("latitude, longitude, recorded_at, accuracy, heading")
          .eq("route_id", routeStopData.routes.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .returns<LocationUpdateData[]>()
          .single();

        if (locationData) {
          driverLocation = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            recorded_at: locationData.recorded_at,
            accuracy: locationData.accuracy,
            heading: locationData.heading,
          };

          // Calculate ETA if we have both driver and customer locations
          if (address.lat && address.lng) {
            // Find current stop index (first pending or enroute stop)
            const { data: currentStopData } = await supabase
              .from("route_stops")
              .select("stop_index")
              .eq("route_id", routeStopData.routes.id)
              .in("status", ["pending", "enroute"])
              .order("stop_index", { ascending: true })
              .limit(1)
              .returns<CurrentStopData[]>()
              .single();

            const currentStopIndex = currentStopData?.stop_index ?? routeStopData.stop_index;
            const remainingStops = calculateRemainingStops(
              currentStopIndex,
              routeStopData.stop_index
            );

            const etaResult = calculateETA({
              driverLocation: {
                lat: locationData.latitude,
                lng: locationData.longitude,
              },
              customerLocation: {
                lat: address.lat,
                lng: address.lng,
              },
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

    const trackingData: TrackingData = {
      order: orderInfo,
      routeStop,
      driver,
      driverLocation,
      eta,
    };

    return NextResponse.json({ data: trackingData });
  } catch (error) {
    logger.exception(error, { api: "tracking/[orderId]" });
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR" as const,
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
