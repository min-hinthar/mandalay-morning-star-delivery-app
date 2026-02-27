import React from "react";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { cancelOrderSchema } from "@/lib/validations/order";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { OrderCancellation } from "@/emails/OrderCancellation";
import type { OrderStatus, Json } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

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
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/orders/:id/cancel",
    });
    if (rl.limited) return rl.response;
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
      return NextResponse.json({ error: "Order is already cancelled" }, { status: 400 });
    }

    // Check if delivered
    if (order.status === "delivered") {
      return NextResponse.json({ error: "Cannot cancel a delivered order" }, { status: 400 });
    }

    const previousStatus = order.status;

    // Update order status to cancelled — guard against concurrent state changes.
    // Only cancel if order is still in a cancellable state (not already delivered/cancelled).
    const { data: updatedRows, error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .neq("status", "delivered")
      .neq("status", "cancelled")
      .select("id");

    if (updateError) {
      logger.exception(updateError, { api: "admin/orders/[id]/cancel" });
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
    }

    // If no rows updated, status changed between our read and write (race condition)
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          error: `Order status changed to '${previousStatus}' — cannot cancel. Refresh and try again.`,
        },
        { status: 409 }
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

    // Trigger cancellation email if requested
    if (notifyCustomer) {
      // Fetch customer profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", order.user_id)
        .single();

      // Fetch order items for email summary
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("name_snapshot, quantity, line_total_cents")
        .eq("order_id", orderId);

      // Fetch order total
      const { data: orderData } = await supabase
        .from("orders")
        .select("total_cents")
        .eq("id", orderId)
        .single();

      if (profile?.email) {
        void sendEmail({
          to: profile.email,
          subject: "Your order has been cancelled",
          react: React.createElement(OrderCancellation, {
            customerName: profile.full_name || "Valued Customer",
            orderId,
            items: (orderItems || []).map((item) => ({
              name: item.name_snapshot,
              quantity: item.quantity,
              lineTotalCents: item.line_total_cents,
            })),
            totalCents: orderData?.total_cents ?? 0,
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
            refundIssued: false,
          }),
          type: "cancellation",
          orderId,
          userId: order.user_id,
          idempotencyKey: `cancellation-${orderId}`,
        });

        logger.info("Cancellation email triggered", { orderId, api: "admin/orders/[id]/cancel" });
      }
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
