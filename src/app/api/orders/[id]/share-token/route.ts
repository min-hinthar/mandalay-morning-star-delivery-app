import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { headers } from "next/headers";

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
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!orderId || !uuidRegex.test(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "You can only share your own orders" },
        { status: 403 }
      );
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

    const { error: updateError } = await supabase
      .from("orders")
      .update({ share_token: shareToken })
      .eq("id", orderId);

    if (updateError) {
      logger.exception(updateError, {
        api: "orders/[id]/share-token",
        flowId: "generate",
      });
      return NextResponse.json(
        { error: "Failed to generate share token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      shareToken,
      shareUrl: `${origin}/orders/${shareToken}/share`,
    });
  } catch (error) {
    logger.exception(error, { api: "orders/[id]/share-token" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
