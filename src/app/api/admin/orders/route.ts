import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { apiError } from "@/lib/utils/api-error";
import type { OrderStatus, RefundStatus } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface OrderItemRow {
  quantity: number;
  name_snapshot: string;
  name_my_snapshot: string | null;
  menu_items: { name_my: string | null } | null;
}

interface OrderRow {
  id: string;
  status: OrderStatus;
  refund_status: RefundStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  payment_method: string | null;
  order_items: OrderItemRow[];
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
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
    const statusFilter = searchParams.get("status");
    const rangeStart = (page - 1) * limit;
    const rangeEnd = rangeStart + limit - 1;

    let query = supabase
      .from("orders")
      .select(
        `
        id,
        status,
        refund_status,
        total_cents,
        delivery_window_start,
        placed_at,
        payment_method,
        order_items (quantity, name_snapshot, name_my_snapshot, menu_items(name_my)),
        profiles!orders_user_id_fkey (
          full_name,
          email
        )
      `,
        { count: "exact" }
      )
      .order("placed_at", { ascending: false });

    // Apply status filter if provided (comma-separated statuses)
    if (statusFilter) {
      const statuses: readonly OrderStatus[] = statusFilter
        .split(",")
        .map((s) => s.trim()) as OrderStatus[];
      query = query.in("status", statuses);
    }

    const {
      data: orders,
      error: ordersError,
      count,
    } = await query.range(rangeStart, rangeEnd).returns<OrderRow[]>();

    if (ordersError) {
      logger.exception(ordersError, { api: "admin/orders", flowId: "fetch" });
      return apiError("INTERNAL_ERROR", "Failed to fetch orders", 500);
    }

    const total = count ?? 0;

    const transformedOrders = (orders ?? []).map((order) => ({
      ...order,
      order_items: order.order_items.map((oi) => ({
        quantity: oi.quantity,
        name_snapshot: oi.name_snapshot,
        name_my: oi.name_my_snapshot ?? oi.menu_items?.name_my ?? null,
      })),
    }));

    return NextResponse.json({
      data: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders", flowId: "fetch" });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
