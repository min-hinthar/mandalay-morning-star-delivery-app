import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: orderId } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "You must be logged in" } },
      { status: 401 }
    );
  }

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
      { error: { code: "INVALID_STATUS", message: "Only pending orders can be cancelled. Contact support for refunds." } },
      { status: 400 }
    );
  }

  // Cancel the order
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending"); // Idempotency check

  if (updateError) {
    Sentry.captureException(updateError, {
      tags: { api: "cancel-order" },
      extra: { orderId, userId: user.id },
    });
    console.error("Failed to cancel order:", updateError);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to cancel order" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
