import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import type { Json, OrderStatus } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

// Items that can't be modified after certain statuses
const NON_EDITABLE_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

const updateItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        quantity: z.number().int().min(0), // 0 = remove item
      })
    )
    .min(1, "Must provide at least one item"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

interface OrderRow {
  id: string;
  status: OrderStatus;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  user_id: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  name_snapshot: string;
  base_price_snapshot: number;
  quantity: number;
  line_total_cents: number;
  refunded_quantity: number | null;
}

/**
 * PATCH /api/admin/orders/[id]/items
 *
 * Update order item quantities. Quantity 0 removes the item.
 * Recalculates order total and logs to audit.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/orders/:id/items" });
    if (rl.limited) return rl.response;
    const { supabase, userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, reason } = parsed.data;

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, subtotal_cents, delivery_fee_cents, tax_cents, total_cents, user_id")
      .eq("id", orderId)
      .returns<OrderRow[]>()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order can be edited
    if (NON_EDITABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot edit items for ${order.status} order` },
        { status: 409 }
      );
    }

    // Fetch order items
    const itemIds = items.map((i) => i.id);
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(
        "id, order_id, name_snapshot, base_price_snapshot, quantity, line_total_cents, refunded_quantity"
      )
      .in("id", itemIds)
      .returns<OrderItemRow[]>();

    if (itemsError) {
      logger.exception(itemsError, { api: "admin/orders/[id]/items" });
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 });
    }

    // Validate items belong to this order
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

    // Track changes for audit
    const oldValues: Record<string, { name: string; quantity: number; lineTotal: number }> = {};
    const newValues: Record<string, { name: string; quantity: number; lineTotal: number }> = {};
    let subtotalDelta = 0;

    // Process each item update
    for (const update of items) {
      const orderItem = orderItems!.find((oi) => oi.id === update.id)!;
      const oldQuantity = orderItem.quantity;
      const newQuantity = update.quantity;

      // Skip if no change
      if (oldQuantity === newQuantity) continue;

      oldValues[orderItem.id] = {
        name: orderItem.name_snapshot,
        quantity: oldQuantity,
        lineTotal: orderItem.line_total_cents,
      };

      if (newQuantity === 0) {
        // Remove item
        const { error: deleteError } = await supabase
          .from("order_items")
          .delete()
          .eq("id", orderItem.id);

        if (deleteError) {
          logger.exception(deleteError, {
            api: "admin/orders/[id]/items",
            orderItemId: orderItem.id,
          });
          return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
        }

        newValues[orderItem.id] = {
          name: orderItem.name_snapshot,
          quantity: 0,
          lineTotal: 0,
        };

        subtotalDelta -= orderItem.line_total_cents;
      } else {
        // Update quantity
        const newLineTotal = orderItem.base_price_snapshot * newQuantity;
        const { error: updateError } = await supabase
          .from("order_items")
          .update({
            quantity: newQuantity,
            line_total_cents: newLineTotal,
          })
          .eq("id", orderItem.id);

        if (updateError) {
          logger.exception(updateError, {
            api: "admin/orders/[id]/items",
            orderItemId: orderItem.id,
          });
          return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
        }

        newValues[orderItem.id] = {
          name: orderItem.name_snapshot,
          quantity: newQuantity,
          lineTotal: newLineTotal,
        };

        subtotalDelta += newLineTotal - orderItem.line_total_cents;
      }
    }

    // Recalculate order totals
    const newSubtotal = order.subtotal_cents + subtotalDelta;
    // Recalculate tax (assuming same rate)
    const taxRate = order.tax_cents / order.subtotal_cents;
    const newTax = Math.round(newSubtotal * taxRate);
    const newTotal = newSubtotal + order.delivery_fee_cents + newTax;

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        subtotal_cents: newSubtotal,
        tax_cents: newTax,
        total_cents: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (orderUpdateError) {
      logger.exception(orderUpdateError, { api: "admin/orders/[id]/items" });
      return NextResponse.json({ error: "Failed to update order total" }, { status: 500 });
    }

    // Create audit log entry
    const { error: auditError } = await supabase.from("order_audit_log").insert({
      order_id: orderId,
      action: "update_items",
      actor_id: userId,
      actor_role: "admin",
      old_value: {
        items: oldValues,
        subtotal_cents: order.subtotal_cents,
        tax_cents: order.tax_cents,
        total_cents: order.total_cents,
      } as Json,
      new_value: {
        items: newValues,
        subtotal_cents: newSubtotal,
        tax_cents: newTax,
        total_cents: newTotal,
      } as Json,
      reason,
    });

    if (auditError) {
      // Log but don't fail
      logger.exception(auditError, {
        api: "admin/orders/[id]/items",
        message: "Failed to create audit log",
      });
    }

    // Notification would be triggered here
    logger.info("Order items updated", {
      orderId,
      itemChanges: Object.keys(newValues).length,
      customerId: order.user_id,
    });

    return NextResponse.json({
      success: true,
      orderId,
      changes: Object.keys(newValues).length,
      newSubtotal: newSubtotal,
      newTax: newTax,
      newTotal: newTotal,
      reason,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/items" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
