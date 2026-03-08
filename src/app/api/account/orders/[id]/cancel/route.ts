import React from "react";
import { after, NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelOrderSchema } from "@/lib/validations/account";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/utils/logger";
import { OrderCancellation } from "@/emails/OrderCancellation";
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

    // Verify order exists and belongs to user
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, user_id, total_cents")
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

    // Cancel the order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        special_instructions: newInstructions,
        updated_at: cancelledAt,
      })
      .eq("id", orderId)
      .in("status", CANCELLABLE_STATUSES); // Idempotency check

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

    // Trigger cancellation email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("name_snapshot, quantity, line_total_cents")
      .eq("order_id", orderId);

    if (user.email) {
      const custEmail = user.email;
      const custName = profile?.full_name || "Valued Customer";
      const custItems = (orderItems || []).map((item) => ({
        name: item.name_snapshot,
        quantity: item.quantity,
        lineTotalCents: item.line_total_cents,
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
              refundIssued: false,
            }),
            type: "cancellation",
            orderId,
            userId: custUserId,
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
        message: "Order cancelled successfully",
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
