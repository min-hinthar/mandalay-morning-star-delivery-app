import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRouteTracking } from "@/lib/tracking/route-tracking";
import { getOrderCancellation } from "@/lib/orders/cancellation";
import type { TrackingData } from "@/types/tracking";
import type { OrderStatus } from "@/types/database";
import { KITCHEN_COORDS } from "@/lib/constants/kitchen";

// Same source as /api/tracking — the old literal here was downtown LA, not the kitchen.
const RESTAURANT_LOCATION = { lat: KITCHEN_COORDS.lat, lng: KITCHEN_COORDS.lng };

interface OrderRow {
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
  tip_cents: number;
  discount_cents: number;
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

export async function fetchTrackingData(
  supabase: SupabaseClient,
  orderId: string,
  userId: string
): Promise<TrackingData | null> {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `id, user_id, status, placed_at, confirmed_at, delivered_at,
       delivery_window_start,
       delivery_window_end, special_instructions, subtotal_cents,
       delivery_fee_cents, tax_cents, tip_cents, discount_cents, total_cents,
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

  // Route / driver / live location. The owner-scoped order read above is the
  // authorization; loadRouteTracking reads with the service client because the
  // customer's own client can't see routes/drivers (see that module).
  const { routeStop, driver, driverLocation, eta, routeId } = await loadRouteTracking({
    orderId,
    orderStatus: order.status as OrderStatus,
    customerLocation: { lat: address.lat, lng: address.lng },
    // The order read above is pinned to user_id = the viewer.
    isOwner: true,
  });

  // Rating
  let rating: number | null = null;
  const { data: driverRating } = await supabase
    .from("driver_ratings")
    .select("rating")
    .eq("order_id", orderId)
    .single();
  if (driverRating) rating = driverRating.rating;

  // Only cancelled orders have anything to look up.
  const cancellation =
    (order.status as OrderStatus) === "cancelled"
      ? await getOrderCancellation(order.id)
      : { ok: true, cancellation: null };

  return {
    order: {
      id: order.id,
      status: order.status as OrderStatus,
      placedAt: order.placed_at,
      confirmedAt: order.confirmed_at,
      deliveredAt: order.delivered_at,
      // Sourced from order_audit_log, not from a column: `orders` has no
      // cancelled_at / cancellation_reason and never has. Only queried for an
      // order that IS cancelled, so an ordinary tracking load costs nothing.
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
