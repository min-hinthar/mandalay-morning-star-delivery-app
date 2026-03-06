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
import { getDeliveryPhotoSignedUrl } from "@/lib/supabase/delivery-photos";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
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
} from "@/types/tracking";
import type {
  OrderQueryResult,
  RouteStopQueryResult,
  DriverData,
  LocationUpdateData,
  CurrentStopData,
} from "./types";

// Restaurant location constant (Mandalay Morning Star, Los Angeles)
const RESTAURANT_LOCATION = { lat: 34.0522, lng: -118.2437 };

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const url = new URL(request.url);
    const shareToken = url.searchParams.get("token");
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

    // Rate limit by authenticated user
    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: user.id,
      role: "customer",
      route: "tracking/[orderId]",
    });
    if (rl.limited) return rl.response;

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
        cancelled_at,
        cancellation_reason,
        delivery_window_start,
        delivery_window_end,
        special_instructions,
        subtotal_cents,
        delivery_fee_cents,
        tax_cents,
        total_cents,
        share_token,
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

    // Verify user owns this order or has valid share token
    const hasValidShareToken =
      shareToken != null && order.share_token != null && shareToken === order.share_token;
    if (!hasValidShareToken && order.user_id !== user.id) {
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
    };

    // Default response (no route assigned)
    let routeStop: TrackingRouteStopInfo | null = null;
    let driver: TrackingData["driver"] = null;
    let driverLocation: TrackingData["driverLocation"] = null;
    let eta: TrackingData["eta"] = null;
    let routeId: string | null = null;

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
      // Extract routeId for location subscription
      routeId = routeStopData.routes.id;

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
        deliveryPhotoUrl: await getDeliveryPhotoSignedUrl(routeStopData.delivery_photo_url),
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
            license_plate,
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
            licensePlate: driverData.license_plate ?? null,
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

    // Lookup existing rating for this order
    let rating: number | null = null;
    const { data: driverRating } = await supabase
      .from("driver_ratings")
      .select("rating")
      .eq("order_id", orderId)
      .single();
    if (driverRating) {
      rating = driverRating.rating;
    }

    const trackingData: TrackingData = {
      order: orderInfo,
      routeStop,
      driver,
      driverLocation,
      eta,
      routeId,
      restaurantLocation: RESTAURANT_LOCATION,
      rating,
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
