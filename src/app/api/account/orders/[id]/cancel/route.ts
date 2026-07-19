import React from "react";
import { after, NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { cancelOrderSchema } from "@/lib/validations/account";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { OrderCancellation } from "@/emails/OrderCancellation";
import { refundPaidOrderInFull } from "@/lib/orders/refund-on-cancel";
import { checkRateLimit, customerLimiter, getClientIp } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/utils/origin-check";
import type { OrderStatus } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Statuses that allow customer cancellation
const CANCELLABLE_STATUSES: readonly OrderStatus[] = ["pending", "pending_approval", "confirmed"];

// POST /api/account/orders/[id]/cancel - Cancel order before preparation starts
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const originError = checkOrigin(request);
    if (originError) return originError;

    const ip = getClientIp(request);
    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: ip,
      role: "customer",
      route: "account/orders/:id/cancel",
    });
    if (rl.limited) return rl.response;

    const { id: orderId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Verify order exists and belongs to user (payment handles for auto-refund)
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id, status, user_id, total_cents, payment_method, stripe_payment_intent_id, stripe_checkout_session_id"
      )
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

    // Check if order can be cancelled
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        {
          error: {
            code: "CANCEL_NOT_ALLOWED",
            message: "Cannot cancel order - preparation has already started",
            currentStatus: order.status,
          },
        },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const result = cancelOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    const { reason } = result.data;
    const cancelledAt = new Date().toISOString();

    // Fetch current special_instructions to preserve them
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("special_instructions")
      .eq("id", orderId)
      .single();

    const existingNotes = currentOrder?.special_instructions || "";
    const cancellationNote = `[CANCELLED BY CUSTOMER at ${cancelledAt}] ${reason}`;
    const newInstructions = existingNotes
      ? `${existingNotes}\n\n${cancellationNote}`
      : cancellationNote;

    // Cancel the order. RLS no-ops (not just errors) must not be reported as
    // success — verify the affected row via .select() before emailing.
    const { data: cancelledRows, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        special_instructions: newInstructions,
        updated_at: cancelledAt,
      })
      .eq("id", orderId)
      .in("status", CANCELLABLE_STATUSES) // Idempotency check
      .select("id");

    if (updateError) {
      logger.exception(updateError, {
        api: "account/orders/[id]/cancel",
        orderId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to cancel order" } },
        { status: 500 }
      );
    }

    if (!cancelledRows || cancelledRows.length === 0) {
      logger.warn("Order cancel affected no rows (status raced or not permitted)", {
        api: "account/orders/[id]/cancel",
        orderId,
        userId: user.id,
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

    // Auto-refund a paid order on cancellation. The order is already cancelled
    // (committed above); if the refund fails, do NOT fail the request — the
    // order stays cancelled and the reconciliation safety net (paid_but_cancelled
    // detector + cron) retries the refund. Idempotent, so a retry is safe.
    let refundIssued = false;
    let refundedCents = 0;
    let refundPending = false;
    try {
      const refund = await refundPaidOrderInFull({
        serviceClient: createServiceClient(),
        stripe,
        orderId,
        order,
        actorId: user.id,
        actorRole: "customer",
        reason,
        // Suppress the webhook refund email ONLY when we'll actually send the
        // OrderCancellation email below (gated on user.email). Otherwise use a
        // webhook-notified source so a refund is never silent (mirrors admin).
        refundSource: user.email ? "cancellation" : "auto-reconcile",
      });
      refundIssued = refund.status === "refunded";
      // Cumulative returned (accurate when a prior partial refund exists).
      refundedCents = refund.totalRefundedCents;
      // Paid order whose refund is still settling — copy must reassure, not deny.
      refundPending = refund.status === "pending";
    } catch (refundErr) {
      logger.exception(refundErr, {
        api: "account/orders/[id]/cancel",
        orderId,
        userId: user.id,
        message: "Auto-refund on cancel failed — safety net will retry",
      });
      // The refund only reaches Stripe for a captured card order; a throw means
      // the charge likely exists but the refund didn't land — the reconciliation
      // safety net completes it. Tell the customer it's processing, not "no refund".
      refundPending = order.payment_method === "stripe";
    }

    // Trigger cancellation email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data: orderItems } = await supabase
      .from("order_items")
      .select(
        "name_snapshot, name_my_snapshot, special_instructions, quantity, line_total_cents, menu_items ( image_url ), order_item_modifiers ( name_snapshot, price_delta_snapshot )"
      )
      .eq("order_id", orderId);

    if (user.email) {
      const custEmail = user.email;
      const custName = profile?.full_name || "Valued Customer";
      const custItems = (
        (orderItems || []) as Array<{
          name_snapshot: string;
          name_my_snapshot: string | null;
          special_instructions: string | null;
          quantity: number;
          line_total_cents: number;
          menu_items: { image_url: string | null } | null;
          order_item_modifiers: Array<{
            name_snapshot: string;
            price_delta_snapshot: number;
          }> | null;
        }>
      ).map((item) => ({
        name: item.name_snapshot,
        nameMy: item.name_my_snapshot,
        quantity: item.quantity,
        lineTotalCents: item.line_total_cents,
        imageUrl: item.menu_items?.image_url ?? null,
        notes: item.special_instructions,
        modifiers: item.order_item_modifiers?.map((m) => ({
          name: m.name_snapshot,
          priceDelta: m.price_delta_snapshot,
        })),
      }));
      const custTotalCents = order.total_cents ?? 0;
      const custUserId = user.id;

      after(async () => {
        try {
          await sendEmail({
            to: custEmail,
            subject: "Your order has been cancelled",
            react: React.createElement(OrderCancellation, {
              customerName: custName,
              orderId,
              items: custItems,
              totalCents: custTotalCents,
              cancellationReason: reason,
              cancelledAt,
              refundIssued,
              refundPending,
              refundAmountCents: refundIssued ? refundedCents : undefined,
              refundMethod: refundIssued ? "your original payment method" : undefined,
              refundTimeline: refundIssued ? "3–5 business days" : undefined,
            }),
            type: "cancellation",
            orderId,
            userId: custUserId,
            // When money was refunded this email is the customer's ONLY notice
            // (the webhook email is suppressed for the "cancellation" source) —
            // make it mandatory so a transient send failure retries.
            mandatory: refundIssued,
            idempotencyKey: `cancellation-${orderId}`,
          });
        } catch (emailErr) {
          logger.error("Failed to send customer cancellation email", {
            orderId,
            error: emailErr instanceof Error ? emailErr.message : String(emailErr),
          });
        }
      });

      logger.info("Cancellation email triggered", { orderId, api: "account/orders/[id]/cancel" });
    }

    return NextResponse.json({
      data: {
        id: orderId,
        status: "cancelled",
        cancelledAt,
        refundIssued,
        refundedCents,
        refundPending,
        message: refundIssued
          ? `Order cancelled — $${(refundedCents / 100).toFixed(2)} refunded to your original payment method`
          : refundPending
            ? "Order cancelled — your refund is being processed and will arrive within 3–5 business days"
            : "Order cancelled successfully",
      },
    });
  } catch (error) {
    logger.exception(error, { api: "account/orders/[id]/cancel" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to cancel order" } },
      { status: 500 }
    );
  }
}
