import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { headers } from "next/headers";
import { checkRateLimit, customerLimiter, getClientIp } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderShareTokenRow {
  share_token: string | null;
  user_id: string;
}

/**
 * POST /api/orders/[id]/share-token
 * Lazily generates a share token for an order.
 * Returns existing token if already generated.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: ip,
      role: "customer",
      route: "orders/:id/share-token",
    });
    if (rl.limited) return rl.response;

    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!orderId || !uuidRegex.test(orderId)) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch order (RLS ensures user owns it)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("share_token, user_id")
      .eq("id", orderId)
      .returns<OrderShareTokenRow[]>()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "You can only share your own orders" }, { status: 403 });
    }

    // Determine origin for shareUrl
    const headerList = await headers();
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      headerList.get("origin") ||
      "http://localhost:3000";

    // If token already exists, return it
    if (order.share_token) {
      return NextResponse.json({
        shareToken: order.share_token,
        shareUrl: `${origin}/orders/${order.share_token}/share`,
      });
    }

    // Generate new token
    const shareToken = crypto.randomUUID();

    // Persist via the service-role client: the customer orders UPDATE policy
    // (orders_update_customer_cancel) only permits a status→cancelled transition, so a user-scoped
    // share_token write matches 0 rows silently (or errors on WITH CHECK) — the token never persists and
    // /orders/[token]/share can never resolve. Ownership is already verified above, so a scoped
    // service-role update is safe; chain .select("id") to confirm a row was actually written.
    // Claim only an UNCLAIMED row (`.is("share_token", null)`) so a double-POST race can't orphan a token:
    // two concurrent requests both read null, but only one update lands — the other matches 0 rows and
    // returns the winner's persisted token below (not an unsaved UUID, not a 500).
    const admin = createServiceClient();
    const { data: updated, error: updateError } = await admin
      .from("orders")
      .update({ share_token: shareToken })
      .eq("id", orderId)
      .eq("user_id", user.id)
      .is("share_token", null)
      .select("share_token")
      .maybeSingle();

    if (updateError) {
      logger.exception(updateError, { api: "orders/[id]/share-token", flowId: "generate" });
      return NextResponse.json({ error: "Failed to generate share token" }, { status: 500 });
    }

    // 0 rows (no error) = a concurrent request won the race and already set the token. Return that
    // persisted token — the URL that will actually resolve — rather than the UUID we failed to write.
    let persistedToken = updated?.share_token ?? null;
    if (!persistedToken) {
      const { data: winner } = await admin
        .from("orders")
        .select("share_token")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      persistedToken = winner?.share_token ?? null;
    }
    if (!persistedToken) {
      logger.exception(new Error("share-token update affected 0 rows and no token present"), {
        api: "orders/[id]/share-token",
        flowId: "generate",
      });
      return NextResponse.json({ error: "Failed to generate share token" }, { status: 500 });
    }

    return NextResponse.json({
      shareToken: persistedToken,
      shareUrl: `${origin}/orders/${persistedToken}/share`,
    });
  } catch (error) {
    logger.exception(error, { api: "orders/[id]/share-token" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
