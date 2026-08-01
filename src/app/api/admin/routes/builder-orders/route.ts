import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { OrderStatus } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

// ============================================
// TYPES
// ============================================

/**
 * The columns the offerability predicates need. Both the picker query and the
 * other-date badge query select these, so the two can share one filter.
 */
interface OfferableColumns {
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  refund_status: string | null;
  route_stops: Array<{ id: string; routes: { status: string } | null }> | null;
}

/** SELECT fragment for `OfferableColumns` — keep the two in sync. */
const OFFERABLE_COLUMNS = `
  payment_method,
  stripe_payment_intent_id,
  refund_status,
  route_stops (
    id,
    routes (
      status
    )
  )
`;

interface OrderRow extends OfferableColumns {
  id: string;
  status: OrderStatus;
  total_cents: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  placed_at: string;
  order_items: Array<{ quantity: number }>;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
  addresses: {
    line_1: string | null;
    city: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
}

// Offer exactly what POST /api/admin/routes will accept — no more, no less.
//
// (a) Active-route collision. This used to reject an order that had ANY
//     route_stops row, including stops on COMPLETED routes, so an order that
//     was skipped on a finished run could never be re-added for redelivery.
//     POST only blocks stops whose route is not completed, and the comment
//     here always claimed the same — now it actually does it.
// (b) Payment. POST rejects the WHOLE batch when any order is an unpaid or
//     fully-refunded card order, so leaving one in the picker let a single
//     stale order 400 an otherwise-valid route. Unpaid orders are surfaced on
//     the orders dashboard (with its "Payment not received" badge) — the route
//     builder is not where you discover them.
const isOnActiveRoute = (row: OfferableColumns) =>
  (row.route_stops ?? []).some((stop) => stop.routes?.status !== "completed");

const isUnpaid = (row: OfferableColumns) =>
  row.payment_method !== "cod" && (!row.stripe_payment_intent_id || row.refund_status === "full");

/** True when POST /api/admin/routes would accept this order into a route. */
const isOfferable = (row: OfferableColumns) => !isOnActiveRoute(row) && !isUnpaid(row);

// ============================================
// GET /api/admin/routes/builder-orders
// Returns unassigned confirmed/preparing orders with address coordinates
// Used exclusively by the route builder UI
// ============================================

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/routes/builder-orders",
    });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    // Compute PST bounds once so both queries can reuse them
    let startBound: string | undefined;
    let endBound: string | undefined;

    if (dateParam) {
      // Use noon PST anchor to derive the correct calendar date
      const nextDate = new Date(`${dateParam}T12:00:00-08:00`);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split("T")[0];
      startBound = `${dateParam}T00:00:00-08:00`;
      endBound = `${nextDateStr}T00:00:00-08:00`;
    }

    let query = supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_cents,
        delivery_window_start,
        delivery_window_end,
        placed_at,
        order_items (quantity),
        profiles!orders_user_id_fkey (
          full_name,
          email
        ),
        addresses (
          line_1,
          city,
          lat,
          lng
        ),
        ${OFFERABLE_COLUMNS}
      `
      )
      .in("status", ["confirmed", "preparing"]);

    if (dateParam && startBound && endBound) {
      query = query.gte("delivery_window_start", startBound).lt("delivery_window_start", endBound);
    }

    const { data: orders, error: ordersError } = await query
      .order("placed_at", { ascending: false })
      .limit(200)
      .returns<OrderRow[]>();

    if (ordersError) {
      logger.exception(ordersError, { api: "admin/routes/builder-orders", flowId: "fetch" });
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const mapped = (orders ?? []).filter(isOfferable).map((row) => ({
      id: row.id,
      status: row.status,
      totalCents: row.total_cents,
      customerName: row.profiles?.full_name ?? null,
      customerEmail: row.profiles?.email ?? "",
      deliveryWindowStart: row.delivery_window_start,
      deliveryWindowEnd: row.delivery_window_end,
      itemCount: row.order_items.reduce((sum, i) => sum + i.quantity, 0),
      lat: row.addresses?.lat ?? null,
      lng: row.addresses?.lng ?? null,
      addressLine1: row.addresses?.line_1 ?? null,
      city: row.addresses?.city ?? null,
    }));

    // Compute counts of unassigned orders on other dates when filtering by date
    let otherDateCounts: Record<string, number> | undefined;
    if (dateParam && startBound && endBound) {
      // Same offerability rules as the picker above. This badge is a promise
      // about what you'd find by switching dates, so counting rows the picker
      // would then hide (a stop on a COMPLETED route, an unpaid card order)
      // sends the admin to a date that turns up empty.
      const { data: otherOrders } = await supabase
        .from("orders")
        .select(`id, delivery_window_start, ${OFFERABLE_COLUMNS}`)
        .in("status", ["confirmed", "preparing"])
        .or(`delivery_window_start.lt.${startBound},delivery_window_start.gte.${endBound}`)
        .limit(200)
        .returns<
          ({
            id: string;
            delivery_window_start: string | null;
          } & OfferableColumns)[]
        >();

      if (otherOrders) {
        otherDateCounts = {};
        for (const o of otherOrders.filter(isOfferable)) {
          if (o.delivery_window_start) {
            const d = o.delivery_window_start.split("T")[0];
            otherDateCounts[d] = (otherDateCounts[d] ?? 0) + 1;
          }
        }
      }
    }

    return NextResponse.json({ data: mapped, ...(otherDateCounts ? { otherDateCounts } : {}) });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/builder-orders", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
