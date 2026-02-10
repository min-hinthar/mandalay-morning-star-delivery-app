import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendEmail, buildEmailElement } from "@/lib/email";
import type { EmailType } from "@/lib/email";
import { logger } from "@/lib/utils/logger";

const VALID_EMAIL_TYPES: EmailType[] = [
  "order_confirmation",
  "cancellation",
  "refund",
  "delivery_reminder",
];

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
 * POST /api/admin/emails/send
 *
 * Manually trigger any email type for a specific order.
 * Body: { orderId: string, emailType: EmailType }
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    const body = await request.json();
    const { orderId, emailType } = body as {
      orderId?: string;
      emailType?: string;
    };

    // Validate input
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    if (!emailType || !VALID_EMAIL_TYPES.includes(emailType as EmailType)) {
      return NextResponse.json(
        { error: `Invalid emailType. Valid: ${VALID_EMAIL_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const type = emailType as EmailType;

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, user_id, total_cents, delivery_fee_cents, tax_cents, subtotal_cents, tip_cents, status, created_at, delivery_address, delivery_instructions, special_instructions",
      )
      .eq("id", orderId)
      .single() as {
      data: OrderRow | null;
      error: { message: string } | null;
    };

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    // Fetch order items
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("name_snapshot, quantity, line_total_cents")
      .eq("order_id", orderId) as {
      data: OrderItemRow[] | null;
    };

    // Fetch customer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .returns<ProfileRow[]>()
      .single();

    if (!profile?.email) {
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 404 },
      );
    }

    const customerName = profile.full_name || "Valued Customer";
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

    // Build order data for template
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
      cancellationReason: "Manually triggered by admin",
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
      deliveryWindowStart: new Date().toISOString(),
      deliveryWindowEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    const subject = getSubjectForType(type, order.id);
    const react = buildEmailElement(type, orderData);

    void sendEmail({
      to: profile.email,
      subject,
      react,
      type,
      orderId: order.id,
      userId: order.user_id,
      idempotencyKey: `manual-${type}-${orderId}-${Date.now()}`,
    });

    logger.info("Manual email trigger initiated", {
      api: "admin/emails/send",
      emailType: type,
      orderId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "admin/emails/send" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function getSubjectForType(type: EmailType, orderId: string): string {
  const shortId = orderId.slice(0, 8).toUpperCase();
  switch (type) {
    case "order_confirmation":
      return `Order #${shortId} confirmed`;
    case "cancellation":
      return `Order #${shortId} has been cancelled`;
    case "refund":
      return `Refund processed for order #${shortId}`;
    case "delivery_reminder":
      return `Your order #${shortId} is arriving today!`;
    default:
      return `Update for order #${shortId}`;
  }
}
