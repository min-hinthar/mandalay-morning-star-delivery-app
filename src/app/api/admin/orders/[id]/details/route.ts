import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";

interface OrderRow {
  id: string;
  status: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  special_instructions: string | null;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  assigned_driver_id: string | null;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  stripe_payment_intent_id: string | null;
  is_priority: boolean | null;
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
  addresses: {
    line_1: string;
    line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
  } | null;
}

interface OrderItemRow {
  id: string;
  name_snapshot: string;
  base_price_snapshot: number;
  quantity: number;
  line_total_cents: number;
  refunded_quantity: number;
  special_instructions: string | null;
}

interface AuditLogRow {
  id: string;
  action: string;
  actor_role: string;
  reason: string | null;
  created_at: string;
}

interface DriverRow {
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

/**
 * GET /api/admin/orders/[id]/details
 *
 * Fetch complete order details for expanded view.
 * Includes customer info, items, address, and audit log.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    // Fetch order with customer and address info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        subtotal_cents,
        delivery_fee_cents,
        tax_cents,
        total_cents,
        special_instructions,
        placed_at,
        confirmed_at,
        delivered_at,
        assigned_driver_id,
        delivery_window_start,
        delivery_window_end,
        stripe_payment_intent_id,
        is_priority,
        user_id,
        profiles (
          full_name,
          email,
          phone
        ),
        addresses (
          line_1,
          line_2,
          city,
          state,
          postal_code
        )
      `)
      .eq("id", orderId)
      .returns<OrderRow[]>()
      .single();

    if (orderError) {
      logger.exception(orderError, { api: "admin/orders/[id]/details", orderId });
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: 500 }
      );
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        id,
        name_snapshot,
        base_price_snapshot,
        quantity,
        line_total_cents,
        refunded_quantity,
        special_instructions
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .returns<OrderItemRow[]>();

    if (itemsError) {
      logger.exception(itemsError, { api: "admin/orders/[id]/details" });
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    // Fetch audit log
    const { data: auditLog, error: auditError } = await supabase
      .from("order_audit_log")
      .select(`
        id,
        action,
        actor_role,
        reason,
        created_at
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<AuditLogRow[]>();

    if (auditError) {
      // Non-fatal, log but continue
      logger.exception(auditError, { api: "admin/orders/[id]/details" });
    }

    // Fetch assigned driver name if exists
    let assignedDriverName: string | null = null;
    if (order.assigned_driver_id) {
      const { data: driver } = await supabase
        .from("drivers")
        .select(`
          profiles (
            full_name,
            email
          )
        `)
        .eq("id", order.assigned_driver_id)
        .returns<DriverRow[]>()
        .single();

      if (driver?.profiles) {
        assignedDriverName = driver.profiles.full_name ?? driver.profiles.email ?? null;
      }
    }

    // Transform to API response
    const response = {
      id: order.id,
      status: order.status,
      customerName: order.profiles?.full_name ?? null,
      customerEmail: order.profiles?.email ?? "",
      customerPhone: order.profiles?.phone ?? null,
      address: order.addresses
        ? {
            street: order.addresses.line_1,
            apt: order.addresses.line_2,
            city: order.addresses.city,
            state: order.addresses.state,
            zip: order.addresses.postal_code,
          }
        : null,
      items: (items || []).map((item) => ({
        id: item.id,
        name: item.name_snapshot,
        quantity: item.quantity,
        basePrice: item.base_price_snapshot,
        lineTotal: item.line_total_cents,
        refundedQuantity: item.refunded_quantity || 0,
        specialInstructions: item.special_instructions,
      })),
      subtotalCents: order.subtotal_cents,
      deliveryFeeCents: order.delivery_fee_cents,
      taxCents: order.tax_cents,
      totalCents: order.total_cents,
      discountCents: 0,
      specialInstructions: order.special_instructions,
      placedAt: order.placed_at,
      confirmedAt: order.confirmed_at,
      deliveredAt: order.delivered_at,
      assignedDriverId: order.assigned_driver_id,
      assignedDriverName,
      deliveryWindowStart: order.delivery_window_start ?? null,
      deliveryWindowEnd: order.delivery_window_end ?? null,
      stripePaymentIntentId: order.stripe_payment_intent_id ?? null,
      isPriority: order.is_priority ?? false,
      auditLog: (auditLog || []).map((entry) => ({
        id: entry.id,
        action: entry.action,
        actorRole: entry.actor_role,
        reason: entry.reason,
        createdAt: entry.created_at,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/details" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
