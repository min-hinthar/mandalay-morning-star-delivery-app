import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { OrderStatus } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

// ============================================
// TYPES
// ============================================

interface OrderRow {
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
  route_stops: Array<{ id: string }> | null;
}

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
        route_stops (id)
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

    // Only return orders not currently on an active (non-completed) route
    const mapped = (orders ?? [])
      .filter((row) => (row.route_stops?.length ?? 0) === 0)
      .map((row) => ({
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
      const { data: otherOrders } = await supabase
        .from("orders")
        .select("id, delivery_window_start, route_stops(id)")
        .in("status", ["confirmed", "preparing"])
        .or(`delivery_window_start.lt.${startBound},delivery_window_start.gte.${endBound}`)
        .limit(200)
        .returns<
          {
            id: string;
            delivery_window_start: string | null;
            route_stops: { id: string }[] | null;
          }[]
        >();

      if (otherOrders) {
        const unassignedOther = otherOrders.filter((o) => (o.route_stops?.length ?? 0) === 0);
        otherDateCounts = {};
        for (const o of unassignedOther) {
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
