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

export async function GET() {
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

    const { data: orders, error: ordersError } = await supabase
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
        profiles (
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
      .in("status", ["confirmed", "preparing"])
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

    return NextResponse.json(mapped);
  } catch (error) {
    logger.exception(error, { api: "admin/routes/builder-orders", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
