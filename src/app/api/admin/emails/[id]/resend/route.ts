import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendEmail, buildEmailElement } from "@/lib/email";
import type { EmailType } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface NotificationLogRow {
  id: string;
  order_id: string;
  user_id: string;
  notification_type: string;
  status: string;
  recipient: string;
  subject: string | null;
}

interface OrderRow {
  id: string;
  user_id: string;
  total_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  subtotal_cents: number;
  tip_cents: number | null;
  status: string;
  created_at: string;
  delivery_address: Record<string, unknown> | null;
  delivery_instructions: string | null;
  special_instructions: string | null;
}

interface OrderItemRow {
  name_snapshot: string;
  quantity: number;
  line_total_cents: number;
}

interface ProfileRow {
  email: string;
  full_name: string | null;
}

/**
 * POST /api/admin/emails/[id]/resend
 *
 * Resend a failed email. Only works for emails with status 'failed'.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: logId } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/emails/:id/resend",
    });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

    // Fetch the notification log entry — cast due to missing Database type
    const { data: logEntry, error: logError } = (await supabase
      .from("notification_logs")
      .select("id, order_id, user_id, notification_type, status, recipient, subject")
      .eq("id", logId)
      .single()) as {
      data: NotificationLogRow | null;
      error: { message: string } | null;
    };

    if (logError || !logEntry) {
      return NextResponse.json({ error: "Email log not found" }, { status: 404 });
    }

    // Only resend failed emails
    if (logEntry.status !== "failed") {
      return NextResponse.json({ error: "Only failed emails can be resent" }, { status: 400 });
    }

    // Fetch order data to reconstruct the email
    const { data: order, error: orderError } = (await supabase
      .from("orders")
      .select(
        "id, user_id, total_cents, delivery_fee_cents, tax_cents, subtotal_cents, tip_cents, status, created_at, delivery_address, delivery_instructions, special_instructions"
      )
      .eq("id", logEntry.order_id)
      .single()) as {
      data: OrderRow | null;
      error: { message: string } | null;
    };

    if (orderError || !order) {
      return NextResponse.json({ error: "Original order not found" }, { status: 404 });
    }

    // Fetch order items
    const { data: orderItems } = (await supabase
      .from("order_items")
      .select("name_snapshot, quantity, line_total_cents")
      .eq("order_id", order.id)) as {
      data: OrderItemRow[] | null;
    };

    // Fetch customer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .returns<ProfileRow[]>()
      .single();

    const customerName = profile?.full_name || "Valued Customer";
    const emailType = logEntry.notification_type as EmailType;

    // Build email data based on type
    const items = (orderItems || []).map((item) => ({
      name: item.name_snapshot,
      quantity: item.quantity,
      lineTotalCents: item.line_total_cents,
    }));

    const address = (order.delivery_address || {}) as {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };

    const orderData = {
      customerName,
      orderId: order.id,
      items,
      subtotalCents: order.subtotal_cents,
      deliveryFeeCents: order.delivery_fee_cents,
      taxCents: order.tax_cents,
      tipCents: order.tip_cents,
      totalCents: order.total_cents,
      address: {
        line1: address.line1 || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        line2: address.line2,
      },
      specialInstructions: order.special_instructions,
      deliveryInstructions: order.delivery_instructions,
      placedAt: order.created_at,
      // Cancellation-specific
      cancellationReason: "Order was cancelled",
      cancelledAt: new Date().toISOString(),
      refundIssued: false,
      // Refund-specific
      isPartialRefund: false,
      refundedItems: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        refundAmountCents: item.lineTotalCents,
      })),
      originalTotalCents: order.total_cents,
      refundAmountCents: order.total_cents,
      refundMethod: "Original payment method",
      refundTimeline: "3-5 business days",
      processedAt: new Date().toISOString(),
      // Delivery reminder-specific
      itemCount: items.length,
      itemNames: items.map((item) => item.name),
    };

    const react = buildEmailElement(emailType, orderData);

    // Send the email via sendEmail pipeline
    const result = await sendEmail({
      to: logEntry.recipient,
      subject: logEntry.subject || `Order update for #${order.id.slice(0, 8).toUpperCase()}`,
      react,
      type: emailType,
      orderId: order.id,
      userId: order.user_id,
      idempotencyKey: `resend-${logId}-${Date.now()}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to resend email" },
        { status: 500 }
      );
    }

    logger.info("Email resent successfully", {
      api: "admin/emails/[id]/resend",
      originalLogId: logId,
      orderId: order.id,
    });

    return NextResponse.json({
      success: true,
      originalLogId: logId,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/emails/[id]/resend" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
