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
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { issueStripeRefundDelta, type StripeRefundOutcome } from "./stripe-refund";

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
  /** Present once the atomic-audit RPC migration is live (audit row written
   * in the RPC's transaction); absent from the legacy RPC. */
  audit_log_id?: string;
}

/**
 * POST /api/admin/orders/[id]/refund
 *
 * Refund specific items from an order with audit logging.
 * Item-level refunds per CONTEXT.md requirements.
 *
 * Stripe orders: after the DB refund commits + the audit entry is written,
 * the card is refunded for the cumulative audited amount minus what Stripe
 * has already refunded (idempotent delta — see ./stripe-refund.ts). A failed
 * card refund is recoverable by re-submitting the same refund.
 * COD orders: no payment rail — the customer email says the team will
 * arrange the cash refund.
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
      .select("id, user_id, total_cents, payment_method, stripe_payment_intent_id")
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
        // Recovery path: a previous attempt may have marked the DB refunded
        // but failed the card refund. If the audited total still exceeds what
        // Stripe has refunded, re-drive the card refund instead of rejecting.
        if (order.payment_method === "stripe" && order.stripe_payment_intent_id) {
          try {
            const recovery = await issueStripeRefundDelta({
              stripe,
              serviceClient: createServiceClient(),
              orderId,
              paymentIntentId: order.stripe_payment_intent_id,
            });
            if (recovery.succeeded && recovery.refundedNowCents > 0) {
              return NextResponse.json({
                success: true,
                orderId,
                recovered: true,
                refundedItems: [],
                shippingRefundCents: 0,
                totalRefundCents: recovery.refundedNowCents,
                stripeRefund: recovery,
                message: `Recovered a previously failed card refund: ${recovery.message}`,
              });
            }
          } catch (recoveryErr) {
            logger.exception(recoveryErr, {
              api: "admin/orders/[id]/refund",
              orderId,
              message: "Card-refund recovery attempt failed",
            });
          }
        }
        return apiError("BAD_REQUEST", msg, 400);
      }
      logger.exception(rpcError, { api: "admin/orders/[id]/refund" });
      return apiError("INTERNAL_ERROR", "Failed to process refund", 500);
    }

    const { refundedItems, shippingRefundCents, totalRefundCents, audit_log_id } =
      rpcResult as unknown as RpcResult;

    // The atomic-audit RPC writes the audit entry in its own transaction and
    // returns its id. The legacy RPC doesn't — insert here for compatibility
    // until the migration is live (deploy-order safe in both directions).
    if (!audit_log_id) {
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
        // Items are marked refunded but the audit record (the card-refund
        // reconciliation target) is missing. Do NOT advise re-submitting the
        // same items: the RPC would double-mark remaining quantity.
        logger.exception(auditError, {
          api: "admin/orders/[id]/refund",
          orderId,
          message: "Audit record failed after refund marking (legacy RPC path)",
        });
        return apiError(
          "INTERNAL_ERROR",
          "Items were marked refunded but the audit record failed. Do NOT re-submit — refund the card manually in the Stripe dashboard and contact support to reconcile.",
          500
        );
      }
    }

    // Move the actual money for card orders (COD has no payment rail; the
    // email below tells the customer the team will arrange the cash refund).
    let stripeRefund: StripeRefundOutcome | null = null;
    if (order.payment_method === "stripe") {
      if (!order.stripe_payment_intent_id) {
        stripeRefund = {
          attempted: false,
          succeeded: true,
          refundedNowCents: 0,
          alreadyRefundedCents: 0,
          message: "No payment was captured for this order — nothing to refund on card.",
        };
      } else {
        try {
          stripeRefund = await issueStripeRefundDelta({
            stripe,
            serviceClient: createServiceClient(),
            orderId,
            paymentIntentId: order.stripe_payment_intent_id,
          });
        } catch (stripeErr) {
          logger.exception(stripeErr, {
            api: "admin/orders/[id]/refund",
            orderId,
            message: "Stripe refund failed after DB refund committed",
          });
          return apiError(
            "STRIPE_ERROR",
            "Items are marked refunded in our records, but the CARD refund failed. Re-submit this refund to retry the card refund, or refund manually in the Stripe dashboard.",
            502
          );
        }
        if (!stripeRefund.succeeded) {
          return apiError("STRIPE_ERROR", stripeRefund.message, 502);
        }
      }
    }

    // Trigger refund email if requested — only once the money side is settled
    // (Stripe refund issued, or COD where the team arranges cash).
    if (notifyCustomer) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", order.user_id)
        .single();

      if (profile?.email) {
        const isCod = order.payment_method === "cod";
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
              subject: `Your refund of $${(totalRefundCents / 100).toFixed(2)} has been ${isCod ? "approved" : "processed"}`,
              react: React.createElement(RefundNotification, {
                customerName: refundCustomerName,
                orderId,
                isPartialRefund,
                refundedItems: refundItemsList,
                originalTotalCents: refundOrigTotalCents,
                refundAmountCents: totalRefundCents,
                shippingRefundCents: refundShippingCents,
                refundMethod: isCod
                  ? "Cash — arranged by our delivery team"
                  : "Original payment method",
                refundTimeline: isCod
                  ? "a few days — our team will contact you to arrange your cash refund"
                  : "3-5 business days",
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
      stripeRefund,
      message:
        order.payment_method === "cod"
          ? `Refund of $${(totalRefundCents / 100).toFixed(2)} recorded — arrange the cash refund with the customer`
          : `Refund of $${(totalRefundCents / 100).toFixed(2)} processed`,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/refund", orderId });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
