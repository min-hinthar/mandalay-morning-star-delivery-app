import React from "react";
import { after, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { cancelOrderSchema } from "@/lib/validations/order";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { apiError } from "@/lib/utils/api-error";
import { OrderCancellation } from "@/emails/OrderCancellation";
import type { OrderStatus, Json } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { refundPaidOrderInFull } from "@/lib/orders/refund-on-cancel";

interface OrderRow {
  status: OrderStatus;
  user_id: string;
  total_cents: number;
  payment_method: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
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
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
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
      return apiError("VALIDATION_ERROR", "Invalid request", 400, parsed.error.flatten());
    }

    const { reason, notifyCustomer } = parsed.data;

    // Fetch current order (payment handles for auto-refund)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "status, user_id, total_cents, payment_method, stripe_payment_intent_id, stripe_checkout_session_id"
      )
      .eq("id", orderId)
      .returns<OrderRow[]>()
      .single();

    if (orderError || !order) {
      return apiError("NOT_FOUND", "Order not found", 404);
    }

    // Check if already cancelled
    if (order.status === "cancelled") {
      return apiError("BAD_REQUEST", "Order is already cancelled", 400);
    }

    // Check if delivered
    if (order.status === "delivered") {
      return apiError("BAD_REQUEST", "Cannot cancel a delivered order", 400);
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
      return apiError("INTERNAL_ERROR", "Failed to cancel order", 500);
    }

    // If no rows updated, status changed between our read and write (race condition)
    if (!updatedRows || updatedRows.length === 0) {
      return apiError(
        "CONFLICT",
        `Order status changed to '${previousStatus}' — cannot cancel. Refresh and try again.`,
        409
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

    // Resolve the customer email BEFORE refunding so the webhook-suppression
    // source is keyed on actual deliverability — not just notifyCustomer — the
    // same value that gates the OrderCancellation send below (mirrors the
    // account route so suppression and send can never disagree).
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .single();
    const customerHasEmail = !!profile?.email;

    // Auto-refund a paid order on cancellation. Paid cancels ALWAYS refund —
    // an opt-out would be silently reversed by the reconciliation cron anyway
    // (it auto-refunds any cancelled+paid order), so an illusory control is
    // worse than none. The order is already cancelled; a refund failure must
    // NOT fail the request — it stays cancelled and the safety net retries.
    let refundIssued = false;
    let refundedCents = 0;
    {
      try {
        const refundResult = await refundPaidOrderInFull({
          serviceClient: createServiceClient(),
          stripe,
          orderId,
          order,
          actorId: userId,
          actorRole: "admin",
          reason,
          // Suppress the webhook refund email ONLY when the OrderCancellation
          // email will actually be sent (notifyCustomer AND a deliverable email);
          // otherwise use a webhook-notified source so the refund is never silent.
          refundSource: notifyCustomer && customerHasEmail ? "cancellation" : "auto-reconcile",
        });
        refundIssued = refundResult.refunded;
        refundedCents = refundResult.refundedCents;
      } catch (refundErr) {
        logger.exception(refundErr, {
          api: "admin/orders/[id]/cancel",
          orderId,
          message: "Auto-refund on admin cancel failed — safety net will retry",
        });
      }
    }

    // Trigger cancellation email if requested
    if (notifyCustomer) {
      // Fetch order items for email summary (bilingual names + dish photos)
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(
          "name_snapshot, name_my_snapshot, quantity, line_total_cents, menu_items ( image_url )"
        )
        .eq("order_id", orderId);

      // Fetch order total
      const { data: orderData } = await supabase
        .from("orders")
        .select("total_cents")
        .eq("id", orderId)
        .single();

      if (profile?.email) {
        const cancelEmail = profile.email;
        const cancelCustomerName = profile.full_name || "Valued Customer";
        const cancelItems = (
          (orderItems || []) as Array<{
            name_snapshot: string;
            name_my_snapshot: string | null;
            quantity: number;
            line_total_cents: number;
            menu_items: { image_url: string | null } | null;
          }>
        ).map((item) => ({
          name: item.name_snapshot,
          nameMy: item.name_my_snapshot,
          quantity: item.quantity,
          lineTotalCents: item.line_total_cents,
          imageUrl: item.menu_items?.image_url ?? null,
        }));
        const cancelTotalCents = orderData?.total_cents ?? 0;
        const cancelUserId = order.user_id;
        const cancelledAt = new Date().toISOString();

        after(async () => {
          try {
            await sendEmail({
              to: cancelEmail,
              subject: "Your order has been cancelled",
              react: React.createElement(OrderCancellation, {
                customerName: cancelCustomerName,
                orderId,
                items: cancelItems,
                totalCents: cancelTotalCents,
                cancellationReason: reason,
                cancelledAt,
                refundIssued,
                refundAmountCents: refundIssued ? refundedCents : undefined,
                refundMethod: refundIssued ? "your original payment method" : undefined,
                refundTimeline: refundIssued ? "3–5 business days" : undefined,
              }),
              type: "cancellation",
              orderId,
              userId: cancelUserId,
              // Refunded → this email is the customer's only refund notice
              // (webhook email suppressed for "cancellation"); make it mandatory.
              mandatory: refundIssued,
              idempotencyKey: `cancellation-${orderId}`,
            });
          } catch (emailErr) {
            logger.error("Failed to send cancellation email", {
              orderId,
              error: emailErr instanceof Error ? emailErr.message : String(emailErr),
            });
          }
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
      refundIssued,
      refundedCents,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/cancel" });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
