import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { OrderStatus, RefundStatus } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface OrderRow {
  id: string;
  status: OrderStatus;
  refund_status: RefundStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  order_items: Array<{ quantity: number }>;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

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
      route: "admin/orders",
    });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const rangeStart = (page - 1) * limit;
    const rangeEnd = rangeStart + limit - 1;

    const {
      data: orders,
      error: ordersError,
      count,
    } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        refund_status,
        total_cents,
        delivery_window_start,
        placed_at,
        order_items (quantity),
        profiles!orders_user_id_fkey (
          full_name,
          email
        )
      `,
        { count: "exact" }
      )
      .order("placed_at", { ascending: false })
      .range(rangeStart, rangeEnd)
      .returns<OrderRow[]>();

    if (ordersError) {
      logger.exception(ordersError, { api: "admin/orders", flowId: "fetch" });
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const total = count ?? 0;

    return NextResponse.json({
      data: orders ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
