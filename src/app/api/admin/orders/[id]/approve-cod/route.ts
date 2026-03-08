import { after, NextResponse } from "next/server";
import React from "react";
import { requireAdmin } from "@/lib/auth";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { sendEmail, fetchSuggestedItemNames } from "@/lib/email";
import { OrderConfirmation } from "@/emails/OrderConfirmation";
import type { OrderStatus } from "@/types/database";

interface OrderRow {
  status: OrderStatus;
  payment_method: string;
  user_id: string;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      route: "admin/orders/approve-cod",
    });
    if (rl.limited) return rl.response;

    // Fetch order
    const { data: order, error: fetchError } = await auth.supabase
      .from("orders")
      .select("status, payment_method, user_id")
      .eq("id", orderId)
      .returns<OrderRow[]>()
      .single();

    if (fetchError || !order) {
      return apiError("NOT_FOUND", "Order not found", 404);
    }

    // Validate COD order in pending_approval status
    if (order.payment_method !== "cod") {
      return apiError("BAD_REQUEST", "Order is not a cash-on-delivery order", 400);
    }

    if (order.status !== "pending_approval") {
      return apiError(
        "BAD_REQUEST",
        `Order cannot be approved — current status is "${order.status}"`,
        400
      );
    }

    // Update order: approve COD (with race-condition guard + row-count verification)
    const approvedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await auth.supabase
      .from("orders")
      .update({
        status: "confirmed" as OrderStatus,
        cod_approved_at: approvedAt,
        cod_approved_by: auth.userId,
      })
      .eq("id", orderId)
      .eq("status", "pending_approval" as OrderStatus)
      .select("id");

    if (updateError) {
      return apiError("INTERNAL_ERROR", `Failed to approve order: ${updateError.message}`, 500);
    }

    if (!updated?.length) {
      return apiError("CONFLICT", "Order was already approved or its status changed", 409);
    }

    // Create audit log entry
    await auth.supabase.from("order_audit_log").insert({
      order_id: orderId,
      action: "status_change",
      actor_id: auth.userId,
      actor_role: "admin",
      reason: "Cash on delivery order approved by admin",
      old_value: { status: "pending_approval" },
      new_value: { status: "confirmed" },
    });

    logger.info("COD order approved", {
      api: "admin/orders/approve-cod",
      flowId: "cod-approval",
      orderId,
      adminId: auth.userId,
    });

    // Send COD-approved confirmation email after response (keeps serverless function alive)
    const approvedOrderId = orderId;
    const approvedSupabase = auth.supabase;
    after(async () => {
      try {
        const { data: fullOrder } = await approvedSupabase
          .from("orders")
          .select(
            `*, addresses(line_1,line_2,city,state,postal_code),
             order_items(name_snapshot,quantity,line_total_cents,
               order_item_modifiers(name_snapshot,price_delta_snapshot))`
          )
          .eq("id", approvedOrderId)
          .single();

        if (!fullOrder) return;

        const { data: profile } = await approvedSupabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", fullOrder.user_id)
          .single();

        if (!profile?.email) return;

        const addr = fullOrder.addresses as {
          line_1: string;
          line_2: string | null;
          city: string;
          state: string;
          postal_code: string;
        } | null;

        const items =
          (fullOrder.order_items as Array<{
            name_snapshot: string;
            quantity: number;
            line_total_cents: number;
            order_item_modifiers: Array<{ name_snapshot: string; price_delta_snapshot: number }>;
          }>) || [];

        const shortId = approvedOrderId.slice(0, 8).toUpperCase();

        // Fetch real menu items for "you might also like" section
        const orderedNames = items.map((item) => item.name_snapshot);
        const suggestedItems = await fetchSuggestedItemNames(approvedSupabase, orderedNames);

        await sendEmail({
          to: profile.email,
          subject: `\u2705 Your order #${shortId} is confirmed!`,
          type: "order_confirmation",
          orderId: approvedOrderId,
          userId: fullOrder.user_id,
          idempotencyKey: `cod-approved-${approvedOrderId}`,
          react: React.createElement(OrderConfirmation, {
            customerName: profile.full_name || "Valued Customer",
            orderId: approvedOrderId,
            items: items.map((item) => ({
              name: item.name_snapshot,
              quantity: item.quantity,
              lineTotalCents: item.line_total_cents,
              modifiers: item.order_item_modifiers?.map((m) => ({
                name: m.name_snapshot,
                priceDelta: m.price_delta_snapshot,
              })),
            })),
            subtotalCents: fullOrder.subtotal_cents,
            deliveryFeeCents: fullOrder.delivery_fee_cents,
            taxCents: fullOrder.tax_cents,
            tipCents: fullOrder.tip_cents ?? undefined,
            totalCents: fullOrder.total_cents,
            deliveryWindowStart: fullOrder.delivery_window_start ?? undefined,
            deliveryWindowEnd: fullOrder.delivery_window_end ?? undefined,
            address: addr
              ? {
                  line1: addr.line_1,
                  line2: addr.line_2 ?? undefined,
                  city: addr.city,
                  state: addr.state,
                  postalCode: addr.postal_code,
                }
              : { line1: "Address on file", city: "", state: "", postalCode: "" },
            specialInstructions: fullOrder.special_instructions ?? undefined,
            paymentMethod: "cod",
            isPendingApproval: false,
            placedAt: fullOrder.placed_at,
            suggestedItems,
          }),
        });
      } catch (emailErr) {
        logger.error("Failed to send COD approval email", {
          orderId: approvedOrderId,
          error: emailErr instanceof Error ? emailErr.message : String(emailErr),
        });
      }
    });

    return NextResponse.json({
      data: { orderId, status: "confirmed", approvedAt: new Date().toISOString() },
    });
  } catch (error) {
    logger.error("COD approval failed", {
      api: "admin/orders/approve-cod",
      flowId: "cod-approval",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}
