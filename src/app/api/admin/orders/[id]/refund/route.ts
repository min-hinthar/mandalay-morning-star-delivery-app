import React from "react";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { refundOrderSchema } from "@/lib/validations/order";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { RefundNotification } from "@/emails/RefundNotification";
import type { Json } from "@/types/database";

interface OrderItemRow {
  id: string;
  order_id: string;
  name_snapshot: string;
  quantity: number;
  line_total_cents: number;
  refunded_quantity: number | null;
}

interface RefundedItem {
  orderItemId: string;
  name: string;
  quantityRefunded: number;
  refundAmountCents: number;
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
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const parsed = refundOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, refundShipping, notifyCustomer } = parsed.data;

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, delivery_fee_cents, total_cents")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch all requested order items
    const itemIds = items.map((i) => i.orderItemId);
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("id, order_id, name_snapshot, quantity, line_total_cents, refunded_quantity")
      .in("id", itemIds)
      .returns<OrderItemRow[]>();

    if (itemsError) {
      logger.exception(itemsError, { api: "admin/orders/[id]/refund" });
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 });
    }

    // Validate all items belong to this order
    const invalidItems = orderItems?.filter((item) => item.order_id !== orderId) || [];
    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          error: "Some items do not belong to this order",
          invalidItemIds: invalidItems.map((i) => i.id),
        },
        { status: 400 }
      );
    }

    // Check for missing items
    const foundIds = new Set(orderItems?.map((i) => i.id) || []);
    const missingIds = itemIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Some items not found", missingItemIds: missingIds },
        { status: 404 }
      );
    }

    // Process refunds for each item
    const refundedItems: RefundedItem[] = [];
    let totalRefundCents = 0;

    for (const refundItem of items) {
      const orderItem = orderItems!.find((oi) => oi.id === refundItem.orderItemId)!;

      // Calculate already refunded quantity
      const alreadyRefunded = orderItem.refunded_quantity || 0;
      const remainingQuantity = orderItem.quantity - alreadyRefunded;

      // Validate refund quantity
      if (refundItem.quantity > remainingQuantity) {
        return NextResponse.json(
          {
            error: `Cannot refund ${refundItem.quantity} of "${orderItem.name_snapshot}". Only ${remainingQuantity} remaining.`,
            orderItemId: refundItem.orderItemId,
          },
          { status: 400 }
        );
      }

      // Calculate refund amount (proportional to quantity)
      const unitPrice = orderItem.line_total_cents / orderItem.quantity;
      const refundAmount = Math.round(unitPrice * refundItem.quantity);

      // Update order_items with refunded_quantity
      const newRefundedQuantity = alreadyRefunded + refundItem.quantity;
      const { error: updateError } = await supabase
        .from("order_items")
        .update({ refunded_quantity: newRefundedQuantity })
        .eq("id", refundItem.orderItemId);

      if (updateError) {
        logger.exception(updateError, {
          api: "admin/orders/[id]/refund",
          orderItemId: refundItem.orderItemId,
        });
        return NextResponse.json({ error: "Failed to update order item" }, { status: 500 });
      }

      refundedItems.push({
        orderItemId: refundItem.orderItemId,
        name: orderItem.name_snapshot,
        quantityRefunded: refundItem.quantity,
        refundAmountCents: refundAmount,
      });

      totalRefundCents += refundAmount;
    }

    // Add shipping refund if requested
    let shippingRefundCents = 0;
    if (refundShipping && order.delivery_fee_cents > 0) {
      shippingRefundCents = order.delivery_fee_cents;
      totalRefundCents += shippingRefundCents;
    }

    // Create audit log entry
    const auditReason = items[0].reason || `Refund processed for ${refundedItems.length} item(s)`;

    // Prepare audit values as Json-compatible objects
    const oldValue = {
      items: orderItems?.map((oi) => ({
        id: oi.id,
        name: oi.name_snapshot,
        quantity: oi.quantity,
        refundedQuantity: oi.refunded_quantity || 0,
      })),
    };

    const newValue = {
      items: refundedItems.map((ri) => ({
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
      old_value: oldValue as Json,
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

        void sendEmail({
          to: profile.email,
          subject: `Your refund of $${(totalRefundCents / 100).toFixed(2)} has been processed`,
          react: React.createElement(RefundNotification, {
            customerName: profile.full_name || "Valued Customer",
            orderId,
            isPartialRefund,
            refundedItems: refundedItems.map((ri) => ({
              name: ri.name,
              quantity: ri.quantityRefunded,
              refundAmountCents: ri.refundAmountCents,
            })),
            originalTotalCents: order.total_cents ?? 0,
            refundAmountCents: totalRefundCents,
            shippingRefundCents: shippingRefundCents > 0 ? shippingRefundCents : undefined,
            refundMethod: "Original payment method",
            refundTimeline: "3-5 business days",
            processedAt: new Date().toISOString(),
          }),
          type: "refund",
          orderId,
          userId: order.user_id,
          mandatory: true,
          idempotencyKey: `refund-${orderId}-${Date.now()}`,
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
    logger.exception(error, { api: "admin/orders/[id]/refund" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
