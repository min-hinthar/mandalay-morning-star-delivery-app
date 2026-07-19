import React from "react";
import { after, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import { apiError } from "@/lib/utils/api-error";
import { sendEmail, sendOrderStatusEmail } from "@/lib/email";
import { OrderCancellation } from "@/emails/OrderCancellation";
import type { OrderStatus, Json } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";

// Live order updates worth a phone buzz. No-op without VAPID keys configured.
const STATUS_PUSH: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  confirmed: {
    title: "Order confirmed ✅",
    body: "We've got your order — we'll ping you when it's on the way.",
  },
  out_for_delivery: {
    title: "Your order is on its way! 🚗",
    body: "Your Mandalay Morning Star feast is out for delivery.",
  },
  delivered: { title: "Delivered! 🍜", body: "Your order has arrived — enjoy your meal!" },
};

async function sendStatusPush(
  userId: string,
  orderId: string,
  newStatus: OrderStatus
): Promise<void> {
  const message = STATUS_PUSH[newStatus];
  if (!message) return;
  // Service client: the customer's subscriptions are RLS-scoped to them.
  await sendPushToUser(createServiceClient(), userId, {
    title: message.title,
    body: message.body,
    url: `/orders/${orderId}/tracking`,
    tag: `order-${orderId}`,
  });
}

const updateStatusSchema = z.object({
  status: z.enum([
    "pending",
    "pending_approval",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
  notifyCustomer: z.boolean().default(true),
  reason: z.string().max(500).optional(),
});

// Valid status transitions (admin can move forward AND backward)
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  pending_approval: ["confirmed", "cancelled"],
  confirmed: ["preparing", "pending", "cancelled"],
  preparing: ["out_for_delivery", "confirmed", "cancelled"],
  out_for_delivery: ["delivered", "preparing"],
  delivered: ["out_for_delivery"],
  cancelled: ["pending"],
};

interface OrderRow {
  status: OrderStatus;
  user_id: string;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  refund_status: string | null;
}

// Statuses that mean the order is being fulfilled (kitchen/delivery). A card
// order must NOT enter any of these while unpaid.
const FULFILLMENT_STATUSES: readonly OrderStatus[] = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      route: "admin/orders/:id/status",
    });
    if (rl.limited) return rl.response;
    const { supabase, userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid status", 400, parsed.error.flatten());
    }

    const { status: newStatus, notifyCustomer, reason } = parsed.data;

    // Fetch current order status, user, and payment state
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("status, user_id, payment_method, stripe_payment_intent_id, refund_status")
      .eq("id", orderId)
      .returns<OrderRow[]>()
      .single();

    if (orderError || !order) {
      return apiError("NOT_FOUND", "Order not found", 404);
    }

    const currentStatus = order.status;

    // Block pending_approval→confirmed for COD through the generic status endpoint
    // This must go through /approve-cod to set cod_approved_at/cod_approved_by.
    // (Gated on payment_method so a card order isn't given the misleading COD
    // message — it falls through to the payment gate below.)
    if (
      currentStatus === "pending_approval" &&
      newStatus === "confirmed" &&
      order.payment_method === "cod"
    ) {
      return apiError(
        "BAD_REQUEST",
        "COD orders must be approved via the /approve-cod endpoint",
        400
      );
    }

    // PAYMENT GATE (root-cause fix for incident #71DC108A): a CARD order must
    // never be advanced into a fulfillment status unless we've been NET-paid for
    // it. A paid Stripe order ALWAYS carries a stripe_payment_intent_id — the
    // webhook and verify-payment paths are the only writers of that column and
    // both confirm real payment first (a `session_<id>` placeholder still counts
    // as non-null). So a null PI means the payment failed/declined or never
    // completed. A `refund_status='full'` order was paid but then fully refunded
    // (charge.refunded flips it to cancelled but keeps the PI), so re-confirming
    // it would fulfill food we net-collected $0 for. COD is exempt (approved via
    // /approve-cod). This route never sets stripe_payment_intent_id, so a card
    // order can only become paid through the payment flow, not here.
    if (
      FULFILLMENT_STATUSES.includes(newStatus) &&
      order.payment_method !== "cod" &&
      (!order.stripe_payment_intent_id || order.refund_status === "full")
    ) {
      return apiError(
        "BAD_REQUEST",
        "This card order hasn't been paid (or was fully refunded), so it can't be moved into fulfillment. A card order is confirmed automatically once payment succeeds — if the customer's payment failed, cancel the order or send them a new payment link.",
        400
      );
    }

    // Validate status transition
    const validNextStatuses = VALID_TRANSITIONS[currentStatus];
    if (!validNextStatuses.includes(newStatus)) {
      return apiError(
        "BAD_REQUEST",
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        400,
        { allowedTransitions: validNextStatuses }
      );
    }

    // Update order status
    const updateData: {
      status: OrderStatus;
      confirmed_at?: string | null;
      delivered_at?: string | null;
    } = { status: newStatus };

    if (
      newStatus === "confirmed" &&
      (currentStatus === "pending" || currentStatus === "pending_approval")
    ) {
      updateData.confirmed_at = new Date().toISOString();
    }

    if (newStatus === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .eq("status", currentStatus)
      .select("id");

    if (updateError) {
      logger.exception(updateError, { api: "admin/orders/[id]/status" });
      return apiError("INTERNAL_ERROR", "Failed to update order status", 500);
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "Order status was modified by another user. Please refresh and try again.",
          },
        },
        { status: 409 }
      );
    }

    // Create audit log entry
    const { error: auditError } = await supabase.from("order_audit_log").insert({
      order_id: orderId,
      action: "status_change",
      actor_id: userId,
      actor_role: "admin",
      old_value: { status: currentStatus } as Json,
      new_value: { status: newStatus } as Json,
      reason: reason ?? null,
    });

    if (auditError) {
      // Non-fatal: log but don't fail
      logger.exception(auditError, {
        api: "admin/orders/[id]/status",
        message: "Failed to create audit log",
      });
    }

    // Send email notification asynchronously if requested
    if (notifyCustomer) {
      after(async () => {
        try {
          await sendStatusEmail(supabase, orderId, order.user_id, currentStatus, newStatus, reason);
        } catch (emailError) {
          logger.exception(emailError, {
            api: "admin/orders/[id]/status",
            message: "Email notification failed",
          });
        }
        try {
          await sendStatusPush(order.user_id, orderId, newStatus);
        } catch (pushError) {
          logger.exception(pushError, {
            api: "admin/orders/[id]/status",
            message: "Push notification failed",
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      previousStatus: currentStatus,
      newStatus,
      emailSent: notifyCustomer ? "queued" : false,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/status", orderId });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

/**
 * Send status transition email to customer.
 * Returns true if email was sent successfully, false otherwise.
 */
async function sendStatusEmail(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  orderId: string,
  orderUserId: string,
  _previousStatus: OrderStatus,
  newStatus: OrderStatus,
  reason?: string
): Promise<boolean> {
  // Cancellation has its own template + refund-aware copy; everything else
  // (confirmed / out_for_delivery / delivered) goes through the shared sender —
  // full order detail, stable idempotency key, service-client reads. Sharing it
  // means an order confirmed here and one marked out_for_delivery/delivered from
  // the driver flow send byte-identical emails.
  if (newStatus !== "cancelled") {
    return sendOrderStatusEmail(orderId, newStatus);
  }

  // Fetch customer profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", orderUserId)
    .single();

  if (!profile?.email) {
    logger.warn("No customer email found for status notification", {
      orderId,
      userId: orderUserId,
    });
    return false;
  }

  // Cancellation email (a degraded fallback — the dedicated cancel routes own
  // the refund-aware path). Fetch items + total for the summary.
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      "name_snapshot, name_my_snapshot, special_instructions, quantity, line_total_cents, menu_items ( image_url ), order_item_modifiers ( name_snapshot, price_delta_snapshot )"
    )
    .eq("order_id", orderId);

  const { data: orderData } = await supabase
    .from("orders")
    .select("total_cents")
    .eq("id", orderId)
    .single();

  const result = await sendEmail({
    to: profile.email,
    subject: "Your order has been cancelled",
    react: React.createElement(OrderCancellation, {
      customerName: profile.full_name || "Valued Customer",
      orderId,
      items: (orderItems || []).map(
        (item: {
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
        }) => ({
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
        })
      ),
      totalCents: orderData?.total_cents ?? 0,
      cancellationReason: reason ?? "No reason provided",
      cancelledAt: new Date().toISOString(),
      refundIssued: false,
    }),
    type: "cancellation",
    orderId,
    userId: orderUserId,
    idempotencyKey: `status-cancel-${orderId}-${Date.now()}`,
  });

  return result.success;
}
