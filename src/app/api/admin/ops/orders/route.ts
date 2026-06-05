import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { getZonedDayRangeUtc } from "@/lib/utils/delivery-dates";
import type { OrderStatus, RefundStatus } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

// ============================================
// TYPES
// ============================================

interface OrderRow {
  id: string;
  status: OrderStatus;
  refund_status: RefundStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  needs_contact: boolean | null;
  order_items: Array<{ quantity: number }>;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
  route_stops: Array<{ id: string }> | null;
  notification_logs: Array<{ status: string; created_at: string }> | null;
}

// ============================================
// GET /api/admin/ops/orders
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
      route: "admin/ops/orders",
    });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

    // Optional ?date=YYYY-MM-DD filters to one LA-local delivery day (used by the
    // Delivery Day hub). Without it, behavior is unchanged (100 most recent).
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let query = supabase.from("orders").select(
      `
        id,
        status,
        refund_status,
        total_cents,
        delivery_window_start,
        placed_at,
        needs_contact,
        order_items (quantity),
        profiles!orders_user_id_fkey (
          full_name,
          email
        ),
        route_stops (id),
        notification_logs (status, created_at)
      `
    );

    // Filters must precede order/limit transforms.
    if (date) {
      const { startUtc, endUtc } = getZonedDayRangeUtc(date);
      query = query.gte("delivery_window_start", startUtc).lt("delivery_window_start", endUtc);
    }

    const { data: orders, error: ordersError } = await query
      .order("placed_at", { ascending: false })
      .limit(100)
      .returns<OrderRow[]>();

    if (ordersError) {
      logger.exception(ordersError, {
        api: "admin/ops/orders",
        flowId: "fetch",
        userId: auth.userId,
      });
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const mapped = (orders ?? []).map((row) => {
      // Get latest email status from joined notification_logs (sorted by created_at DESC)
      const latestLog = row.notification_logs?.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )?.[0];

      return {
        id: row.id,
        status: row.status,
        refundStatus: row.refund_status,
        totalCents: row.total_cents,
        deliveryWindowStart: row.delivery_window_start,
        placedAt: row.placed_at,
        itemCount: row.order_items.reduce((sum, i) => sum + i.quantity, 0),
        customerName: row.profiles?.full_name ?? null,
        customerEmail: row.profiles?.email ?? "",
        isAssigned: (row.route_stops?.length ?? 0) > 0,
        emailStatus: (latestLog?.status ?? null) as
          | "delivered"
          | "failed"
          | "pending"
          | "sent"
          | "bounced"
          | "opened"
          | null,
        needsContact: row.needs_contact ?? false,
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    logger.exception(error, { api: "admin/ops/orders", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
