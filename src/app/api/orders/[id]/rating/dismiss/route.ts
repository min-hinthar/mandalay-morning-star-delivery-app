import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, apiWriteLimiter } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/orders/[id]/rating/dismiss
 * Hide the "How was your order?" prompt for the caller's delivered order.
 *
 * The banner used to write `rating_dismissed` through the browser client, but
 * no customer UPDATE policy admits a delivered order (orders_update_customer_cancel
 * only matches pre-fulfillment rows and requires status='cancelled'), so the
 * write matched 0 rows and the banner came back on every load. The service
 * client writes it instead, with the owner and status pinned by explicit filters.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    if (!UUID_RE.test(orderId)) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit({
      limiter: apiWriteLimiter,
      identifier: user.id,
      role: "customer",
      route: "orders/rating/dismiss",
    });
    if (rl.limited) return rl.response;

    const { data: updated, error } = await createServiceClient()
      .from("orders")
      .update({ rating_dismissed: true })
      .eq("id", orderId)
      .eq("user_id", user.id)
      .eq("status", "delivered")
      .select("id");

    if (error) {
      logger.exception(error, { api: "orders/[id]/rating/dismiss", orderId, userId: user.id });
      return NextResponse.json({ error: "Failed to dismiss" }, { status: 500 });
    }
    // Not the caller's order, or not delivered: same answer, no existence leak.
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "orders/[id]/rating/dismiss" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
