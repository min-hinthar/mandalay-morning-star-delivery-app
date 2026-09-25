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
import { loadRouteTracking } from "@/lib/tracking/route-tracking";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { getOrderCancellation } from "@/lib/orders/cancellation";
import type { OrderStatus } from "@/types/database";
import type {
  TrackingData,
  TrackingOrderInfo,
  TrackingOrderItem,
  TrackingAddressInfo,
} from "@/types/tracking";
import type { OrderQueryResult } from "./types";
import { KITCHEN_COORDS } from "@/lib/constants/kitchen";

// Restaurant location constant (Mandalay Morning Star, Covina CA)
const RESTAURANT_LOCATION = { lat: KITCHEN_COORDS.lat, lng: KITCHEN_COORDS.lng };

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
        delivery_window_start,
        delivery_window_end,
        special_instructions,
        subtotal_cents,
        delivery_fee_cents,
        tax_cents,
        tip_cents,
        discount_cents,
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

    // Only cancelled orders have a cancellation record to read — and only the
    // OWNER sees it, not a share-token holder.
    //
    // Whether the reason is customer-facing at all is decided in the reader,
    // which withholds it unless the admin opted to notify. This extra gate is
    // about a different question: even a customer-safe reason is the business's
    // explanation OF the customer's order. Sharing the order is the customer's
    // call; passing on the explanation is not theirs to make.
    const isOwner = order.user_id === user.id;
    // Not cancelled, or not the owner -> there is nothing to look up, so a null
    // answer IS authoritative. Only a failed read is "unknown".
    const cancellation =
      (order.status as OrderStatus) === "cancelled" && isOwner
        ? await getOrderCancellation(order.id)
        : { ok: true, cancellation: null };

    // Build order info
    const orderInfo: TrackingOrderInfo = {
      id: order.id,
      status: order.status as OrderStatus,
      placedAt: order.placed_at,
      confirmedAt: order.confirmed_at,
      deliveredAt: order.delivered_at,
      // From order_audit_log, matching fetchTrackingData — see that file and
      // lib/orders/cancellation.ts. Only queried when the order is cancelled.
      cancelledAt: cancellation.cancellation?.cancelledAt ?? null,
      cancellationReason: cancellation.cancellation?.reason ?? null,
      cancellationKnown: cancellation.ok,
      deliveryWindowStart: order.delivery_window_start,
      deliveryWindowEnd: order.delivery_window_end,
      specialInstructions: order.special_instructions,
      deliveryNotes: order.special_instructions,
      address,
      items,
      subtotalCents: order.subtotal_cents,
      deliveryFeeCents: order.delivery_fee_cents,
      taxCents: order.tax_cents,
      tipCents: order.tip_cents,
      discountCents: order.discount_cents,
      totalCents: order.total_cents,
    };

    // Route / driver / live location. The order read + owner/share-token check
    // above is the authorization; loadRouteTracking reads with the service
    // client because the customer's own client can't see routes/drivers.
    const { routeStop, driver, driverLocation, eta, routeId } = await loadRouteTracking({
      orderId,
      orderStatus: order.status as OrderStatus,
      customerLocation: { lat: address.lat, lng: address.lng },
      isOwner,
    });

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
