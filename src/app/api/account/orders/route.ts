import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, customerLimiter, getClientIp } from "@/lib/rate-limit";
import type { OrderStatus } from "@/types/order";
import type { RefundStatus } from "@/types/database";

const paramsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

interface OrderRow {
  id: string;
  status: OrderStatus;
  refund_status: RefundStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  order_items: Array<{ quantity: number }>;
}

interface DecodedCursor {
  placed_at: string;
  id: string;
}

function decodeCursor(cursor: string): DecodedCursor | null {
  try {
    const decoded = JSON.parse(atob(cursor));
    if (typeof decoded.placed_at === "string" && typeof decoded.id === "string") {
      return decoded as DecodedCursor;
    }
    return null;
  } catch {
    return null;
  }
}

function encodeCursor(row: { placed_at: string; id: string }): string {
  return btoa(JSON.stringify({ placed_at: row.placed_at, id: row.id }));
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: ip,
      role: "customer",
      route: "account/orders",
    });
    if (rl.limited) return rl.response;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url);
    const parseResult = paramsSchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid parameters" } },
        { status: 400 }
      );
    }

    const { cursor, limit } = parseResult.data;

    // Build base query — RLS enforces user_id = auth.uid()
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
        order_items (quantity)
      `
      )
      .eq("user_id", user.id)
      .order("placed_at", { ascending: false })
      .order("id", { ascending: false });

    // Apply cursor filter for pagination
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid cursor" } },
          { status: 400 }
        );
      }
      // Composite cursor: (placed_at, id) descending
      query = query.or(
        `placed_at.lt.${decoded.placed_at},and(placed_at.eq.${decoded.placed_at},id.lt.${decoded.id})`
      );
    }

    // Fetch N+1 to detect hasMore without count query
    const { data: rows, error: queryError } = await query.limit(limit + 1).returns<OrderRow[]>();

    if (queryError) {
      logger.exception(queryError, { api: "account/orders", flowId: "fetch" });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to fetch orders" } },
        { status: 500 }
      );
    }

    const allRows = rows ?? [];
    const hasMore = allRows.length > limit;
    const pageRows = hasMore ? allRows.slice(0, limit) : allRows;

    // Map to camelCase response
    const orders = pageRows.map((row) => ({
      id: row.id,
      status: row.status,
      refundStatus: row.refund_status,
      totalCents: row.total_cents,
      deliveryWindowStart: row.delivery_window_start,
      placedAt: row.placed_at,
      itemCount: row.order_items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    const lastRow = pageRows[pageRows.length - 1];

    return NextResponse.json({
      data: orders,
      pagination: {
        nextCursor: hasMore && lastRow ? encodeCursor(lastRow) : null,
        hasMore,
        limit,
      },
    });
  } catch (error) {
    logger.exception(error, { api: "account/orders", flowId: "fetch" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch orders" } },
      { status: 500 }
    );
  }
}
