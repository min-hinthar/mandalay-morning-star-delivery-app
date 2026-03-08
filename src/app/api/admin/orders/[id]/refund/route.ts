import React from "react";
import { after, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { refundOrderSchema } from "@/lib/validations/order";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { apiError } from "@/lib/utils/api-error";
import { RefundNotification } from "@/emails/RefundNotification";
import type { Json } from "@/types/database";
import { checkRateLimit, refundLimiter } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/utils/origin-check";

interface RefundedItem {
  orderItemId: string;
  name: string;
  quantityRefunded: number;
  refundAmountCents: number;
}

interface RpcResult {
  refundedItems: RefundedItem[];
  shippingRefundCents: number;
  totalRefundCents: number;
}

/**
 * POST /api/admin/orders/[id]/refund
 *
 * Refund specific items from an order with audit logging.
 * Item-level refunds per CONTEXT.md requirements.
 *
 * Note: Actual payment refund integration (Stripe, etc.) is out of scope.
 * This creates the audit trail and marks items as refunded.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  try {
    const originError = checkOrigin(request);
    if (originError) return originError;

    const auth = await requireAdmin();
    if (!auth.success) {
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
    }

    const rl = await checkRateLimit({
      limiter: refundLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/orders/:id/refund",
    });
    if (rl.limited) return rl.response;
    const { supabase, userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const parsed = refundOrderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request", 400, parsed.error.flatten());
    }

    const { items, refundShipping, notifyCustomer } = parsed.data;

    // Verify order exists (need user_id + total for email/audit)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, total_cents")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return apiError("NOT_FOUND", "Order not found", 404);
    }

    // Atomic refund via database function (FOR UPDATE prevents concurrent races)
    const rpcItems = items.map((i) => ({
      orderItemId: i.orderItemId,
      quantity: i.quantity,
      reason: i.reason,
    }));

    const { data: rpcResult, error: rpcError } = await supabase.rpc("apply_item_refunds", {
      p_order_id: orderId,
      p_items: rpcItems as unknown as import("@/types/database").Json,
      p_refund_shipping: refundShipping ?? false,
    });

    if (rpcError) {
      const msg = rpcError.message;
      // Surface validation errors from the function
      if (msg.includes("not found") || msg.includes("does not belong")) {
        return apiError("NOT_FOUND", msg, 404);
      }
      if (msg.includes("Cannot refund") || msg.includes("exceeds order total")) {
        return apiError("BAD_REQUEST", msg, 400);
      }
      logger.exception(rpcError, { api: "admin/orders/[id]/refund" });
      return apiError("INTERNAL_ERROR", "Failed to process refund", 500);
    }

    const { refundedItems, shippingRefundCents, totalRefundCents } =
      rpcResult as unknown as RpcResult;

    // Create audit log entry
    const auditReason = items[0].reason || `Refund processed for ${refundedItems.length} item(s)`;

    const newValue = {
      items: refundedItems.map((ri: RefundedItem) => ({
        orderItemId: ri.orderItemId,
        name: ri.name,
        quantityRefunded: ri.quantityRefunded,
        refundAmountCents: ri.refundAmountCents,
      })),
      shippingRefundCents,
      totalRefundCents,
    };

    const { error: auditError } = await supabase.from("order_audit_log").insert({
      order_id: orderId,
      action: "refund",
      actor_id: userId,
      actor_role: "admin",
      old_value: null as Json,
      new_value: newValue as Json,
      reason: auditReason,
    });

    if (auditError) {
      // Log but don't fail - refund was processed
      logger.exception(auditError, {
        api: "admin/orders/[id]/refund",
        message: "Failed to create audit log",
      });
    }

    // Trigger refund email if requested
    if (notifyCustomer) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", order.user_id)
        .single();

      if (profile?.email) {
        const isPartialRefund = totalRefundCents < (order.total_cents ?? 0);
        const refundEmailTo = profile.email;
        const refundCustomerName = profile.full_name || "Valued Customer";
        const refundOrigTotalCents = order.total_cents ?? 0;
        const refundUserId = order.user_id;
        const refundProcessedAt = new Date().toISOString();
        const refundIdempotencyKey = `refund-${orderId}-${Date.now()}`;
        const refundItemsList = refundedItems.map((ri) => ({
          name: ri.name,
          quantity: ri.quantityRefunded,
          refundAmountCents: ri.refundAmountCents,
        }));
        const refundShippingCents = shippingRefundCents > 0 ? shippingRefundCents : undefined;

        after(async () => {
          try {
            await sendEmail({
              to: refundEmailTo,
              subject: `Your refund of $${(totalRefundCents / 100).toFixed(2)} has been processed`,
              react: React.createElement(RefundNotification, {
                customerName: refundCustomerName,
                orderId,
                isPartialRefund,
                refundedItems: refundItemsList,
                originalTotalCents: refundOrigTotalCents,
                refundAmountCents: totalRefundCents,
                shippingRefundCents: refundShippingCents,
                refundMethod: "Original payment method",
                refundTimeline: "3-5 business days",
                processedAt: refundProcessedAt,
              }),
              type: "refund",
              orderId,
              userId: refundUserId,
              mandatory: true,
              idempotencyKey: refundIdempotencyKey,
            });
          } catch (emailErr) {
            logger.error("Failed to send refund email", {
              orderId,
              error: emailErr instanceof Error ? emailErr.message : String(emailErr),
            });
          }
        });

        logger.info("Refund email triggered", {
          orderId,
          totalRefundCents,
          api: "admin/orders/[id]/refund",
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      refundedItems,
      shippingRefundCents,
      totalRefundCents,
      notifyCustomer,
      message: `Refund of $${(totalRefundCents / 100).toFixed(2)} processed`,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/refund", orderId });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
