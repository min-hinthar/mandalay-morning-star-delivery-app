import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, apiWriteLimiter } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id: orderId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "You must be logged in" } },
      { status: 401 }
    );
  }

  // Rate limit
  const rl = await checkRateLimit({
    limiter: apiWriteLimiter,
    identifier: user.id,
    role: "customer",
    route: "orders/cancel",
  });
  if (rl.limited) return rl.response;

  // Verify order exists and belongs to user
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Order not found" } },
      { status: 404 }
    );
  }

  if (order.user_id !== user.id) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "This order does not belong to you" } },
      { status: 403 }
    );
  }

  // Only pending orders can be cancelled by users
  if (order.status !== "pending") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATUS",
          message: "Only pending orders can be cancelled. Contact support for refunds.",
        },
      },
      { status: 400 }
    );
  }

  // Cancel the order. RLS no-ops (not just errors) must not be reported as
  // success — verify the affected row via .select() before responding.
  const { data: cancelledRows, error: updateError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending") // Idempotency check
    .select("id");

  if (updateError) {
    logger.exception(updateError, {
      api: "cancel-order",
      orderId,
      userId: user.id,
      flowId: "order",
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to cancel order" } },
      { status: 500 }
    );
  }

  if (!cancelledRows || cancelledRows.length === 0) {
    logger.warn("Order cancel affected no rows (status raced or not permitted)", {
      api: "cancel-order",
      orderId,
      userId: user.id,
      flowId: "order",
    });
    return NextResponse.json(
      {
        error: {
          code: "CONFLICT",
          message: "This order can no longer be cancelled. Please contact us for help.",
        },
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
