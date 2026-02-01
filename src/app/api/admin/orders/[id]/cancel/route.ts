import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { cancelOrderSchema } from "@/lib/validations/order";
import { logger } from "@/lib/utils/logger";
import type { OrderStatus, Json } from "@/types/database";

interface OrderRow {
  status: OrderStatus;
  user_id: string;
}

/**
 * POST /api/admin/orders/[id]/cancel
 *
 * Cancel an order with reason and audit logging.
 * Admin can cancel any order at any time.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const parsed = cancelOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reason, notifyCustomer } = parsed.data;

    // Fetch current order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("status, user_id")
      .eq("id", orderId)
      .returns<OrderRow[]>()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if already cancelled
    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 400 }
      );
    }

    // Check if delivered
    if (order.status === "delivered") {
      return NextResponse.json(
        { error: "Cannot cancel a delivered order" },
        { status: 400 }
      );
    }

    const previousStatus = order.status;

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (updateError) {
      logger.exception(updateError, { api: "admin/orders/[id]/cancel" });
      return NextResponse.json(
        { error: "Failed to cancel order" },
        { status: 500 }
      );
    }

    // Create audit log entry
    const { error: auditError } = await supabase.from("order_audit_log").insert({
      order_id: orderId,
      action: "cancel",
      actor_id: userId,
      actor_role: "admin",
      old_value: { status: previousStatus } as Json,
      new_value: { status: "cancelled" } as Json,
      reason,
    });

    if (auditError) {
      // Log but don't fail - order was cancelled successfully
      logger.exception(auditError, {
        api: "admin/orders/[id]/cancel",
        message: "Failed to create audit log",
      });
    }

    // TODO: If notifyCustomer is true, trigger notification
    // This would integrate with a notification service in the future
    if (notifyCustomer) {
      logger.info("Customer notification requested for order cancellation", {
        orderId,
        customerId: order.user_id,
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      previousStatus,
      newStatus: "cancelled",
      reason,
      notifyCustomer,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/cancel" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
