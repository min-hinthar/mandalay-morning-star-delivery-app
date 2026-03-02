import React from "react";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import { sendEmail, buildEmailElement } from "@/lib/email";
import { OrderCancellation } from "@/emails/OrderCancellation";
import type { OrderStatus, Json } from "@/types/database";
import type { EmailType } from "@/lib/email/types";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

const updateStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
  notifyCustomer: z.boolean().default(true),
  reason: z.string().max(500).optional(),
});

// Valid status transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

// Map status transitions to email types (null = no email template available)
const STATUS_EMAIL_MAP: Partial<Record<OrderStatus, EmailType | null>> = {
  confirmed: "order_confirmation",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  cancelled: null, // Handled separately via cancel route
};

interface OrderRow {
  status: OrderStatus;
  user_id: string;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      route: "admin/orders/:id/status",
    });
    if (rl.limited) return rl.response;
    const { supabase, userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status: newStatus, notifyCustomer, reason } = parsed.data;

    // Fetch current order status and user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("status, user_id")
      .eq("id", orderId)
      .returns<OrderRow[]>()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentStatus = order.status;

    // Validate status transition
    const validNextStatuses = VALID_TRANSITIONS[currentStatus];
    if (!validNextStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          allowedTransitions: validNextStatuses,
        },
        { status: 400 }
      );
    }

    // Update order status
    const updateData: {
      status: OrderStatus;
      confirmed_at?: string;
      delivered_at?: string;
    } = { status: newStatus };

    if (newStatus === "confirmed" && currentStatus === "pending") {
      updateData.confirmed_at = new Date().toISOString();
    }

    if (newStatus === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateError) {
      logger.exception(updateError, { api: "admin/orders/[id]/status" });
      return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
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

    // Send email notification if requested
    let emailSent = false;
    if (notifyCustomer) {
      try {
        emailSent = await sendStatusEmail(
          supabase,
          orderId,
          order.user_id,
          currentStatus,
          newStatus,
          reason
        );
      } catch (emailError) {
        // Email failure must NOT block the status update response
        logger.exception(emailError, {
          api: "admin/orders/[id]/status",
          message: "Email notification failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      previousStatus: currentStatus,
      newStatus,
      emailSent: notifyCustomer ? emailSent : false,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/status", orderId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Send status transition email to customer.
 * Returns true if email was sent successfully, false otherwise.
 */
async function sendStatusEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orderId: string,
  orderUserId: string,
  _previousStatus: OrderStatus,
  newStatus: OrderStatus,
  reason?: string
): Promise<boolean> {
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

  const emailType = STATUS_EMAIL_MAP[newStatus];

  // Cancellation is handled via the dedicated cancel route
  if (newStatus === "cancelled") {
    // Fetch order items for cancellation email
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("name_snapshot, quantity, line_total_cents")
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
          (item: { name_snapshot: string; quantity: number; line_total_cents: number }) => ({
            name: item.name_snapshot,
            quantity: item.quantity,
            lineTotalCents: item.line_total_cents,
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

  // For transitions with a known email type and template in buildEmailElement
  if (emailType && emailType === "order_confirmation") {
    // Fetch full order data for confirmation email
    const { data: orderData } = await supabase
      .from("orders")
      .select(
        `
        total_cents, subtotal_cents, delivery_fee_cents, tax_cents,
        special_instructions, delivery_window_start, delivery_window_end,
        addresses (line_1, line_2, city, state, postal_code)
      `
      )
      .eq("id", orderId)
      .single();

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("name_snapshot, base_price_snapshot, quantity, line_total_cents")
      .eq("order_id", orderId);

    const react = buildEmailElement("order_confirmation", {
      customerName: profile.full_name || "Valued Customer",
      orderId,
      items: (orderItems || []).map(
        (item: {
          name_snapshot: string;
          base_price_snapshot: number;
          quantity: number;
          line_total_cents: number;
        }) => ({
          name: item.name_snapshot,
          basePrice: item.base_price_snapshot,
          quantity: item.quantity,
          lineTotal: item.line_total_cents,
        })
      ),
      subtotalCents: orderData?.subtotal_cents ?? 0,
      deliveryFeeCents: orderData?.delivery_fee_cents ?? 0,
      taxCents: orderData?.tax_cents ?? 0,
      tipCents: 0,
      totalCents: orderData?.total_cents ?? 0,
      deliveryWindowStart: orderData?.delivery_window_start ?? null,
      deliveryWindowEnd: orderData?.delivery_window_end ?? null,
      address: orderData?.addresses
        ? {
            street: orderData.addresses.line_1,
            apt: orderData.addresses.line_2,
            city: orderData.addresses.city,
            state: orderData.addresses.state,
            zip: orderData.addresses.postal_code,
          }
        : null,
      specialInstructions: orderData?.special_instructions ?? null,
    });

    const result = await sendEmail({
      to: profile.email,
      subject: "Your order has been confirmed!",
      react,
      type: "order_confirmation",
      orderId,
      userId: orderUserId,
      idempotencyKey: `status-confirmed-${orderId}-${Date.now()}`,
    });

    return result.success;
  }

  // For other status transitions without dedicated templates, log and skip
  if (emailType) {
    logger.info("No email template available for status transition", {
      orderId,
      newStatus,
      emailType,
    });
  }

  return false;
}
