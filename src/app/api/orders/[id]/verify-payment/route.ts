import React from "react";
import { after, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { sendEmail, fetchSuggestedItemNames } from "@/lib/email";
import { OrderConfirmation } from "@/emails/OrderConfirmation";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, apiWriteLimiter } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: orderId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("UNAUTHORIZED", "You must be logged in", 401);
  }

  // Rate limit
  const rl = await checkRateLimit({
    limiter: apiWriteLimiter,
    identifier: user.id,
    role: "customer",
    route: "orders/verify-payment",
  });
  if (rl.limited) return rl.response;

  // Parse body — sessionId is optional (falls back to stored session ID)
  let sessionId: string | undefined;
  try {
    const body = await request.json();
    sessionId = body.sessionId;
  } catch {
    // Empty body is OK — we'll fall back to stored session ID
  }

  // Verify order ownership (include stripe_checkout_session_id for fallback)
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, user_id, stripe_checkout_session_id")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return apiError("NOT_FOUND", "Order not found", 404);
  }

  // Already confirmed — return current status
  if (order.status !== "pending") {
    return NextResponse.json({ status: order.status });
  }

  // Resolve session ID: request body → stored on order
  const resolvedSessionId = sessionId || order.stripe_checkout_session_id;
  if (!resolvedSessionId || typeof resolvedSessionId !== "string") {
    return apiError("VALIDATION_ERROR", "No checkout session available for verification", 422);
  }

  // Verify with Stripe
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(resolvedSessionId);
  } catch (err) {
    logger.exception(err, {
      orderId,
      sessionId: resolvedSessionId,
      api: "verify-payment",
      flowId: "checkout",
    });
    return apiError("STRIPE_ERROR", "Could not verify payment session", 502);
  }

  // Validate session matches this order
  if (session.metadata?.order_id !== orderId) {
    return apiError("BAD_REQUEST", "Session does not match this order", 400);
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ status: "pending" });
  }

  // Payment confirmed — update order via service client (bypass RLS)
  const rawPaymentIntent = session.payment_intent;
  const paymentIntentId =
    typeof rawPaymentIntent === "string"
      ? rawPaymentIntent
      : typeof rawPaymentIntent === "object" && rawPaymentIntent !== null
        ? rawPaymentIntent.id
        : null;

  const serviceClient = createServiceClient();
  const { data: updated, error: updateError } = await serviceClient
    .from("orders")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: paymentIntentId ?? `session_${session.id}`,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");

  if (updateError) {
    logger.exception(updateError, {
      orderId,
      api: "verify-payment",
      flowId: "checkout",
    });
    return apiError("INTERNAL_ERROR", "Failed to confirm order", 500);
  }

  if (!updated || updated.length === 0) {
    // Race condition: webhook already confirmed it
    return NextResponse.json({ status: "confirmed" });
  }

  logger.info(`Order ${orderId} confirmed via verify-payment fallback`, {
    orderId,
    sessionId: resolvedSessionId,
    api: "verify-payment",
    flowId: "checkout",
  });

  // Send confirmation email (this endpoint may win the race vs webhook)
  const { data: orderData } = await serviceClient
    .from("orders")
    .select(
      `
      id, user_id, subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
      delivery_window_start, delivery_window_end, special_instructions, placed_at,
      profiles!orders_user_id_fkey ( email, full_name ),
      addresses ( line_1, line_2, city, state, postal_code ),
      order_items (
        name_snapshot, quantity, line_total_cents,
        order_item_modifiers ( name_snapshot, price_delta_snapshot )
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (orderData) {
    const profile = orderData.profiles as unknown as {
      email: string | null;
      full_name: string | null;
    } | null;
    const address = orderData.addresses as unknown as {
      line_1: string;
      line_2: string | null;
      city: string;
      state: string;
      postal_code: string;
    } | null;
    const items =
      (orderData.order_items as unknown as Array<{
        name_snapshot: string;
        quantity: number;
        line_total_cents: number;
        order_item_modifiers: Array<{ name_snapshot: string; price_delta_snapshot: number }>;
      }>) || [];

    const customerEmail = profile?.email;
    if (customerEmail) {
      const shortId = orderId.slice(0, 8).toUpperCase();
      const emailOrderId = orderId;
      const emailUserId = orderData.user_id;

      after(async () => {
        try {
          // Fetch real menu items for "you might also like" section
          const orderedNames = items.map((item) => item.name_snapshot);
          const suggestedItems = await fetchSuggestedItemNames(serviceClient, orderedNames);

          await sendEmail({
            to: customerEmail,
            subject: `\uD83C\uDF5C Your order is confirmed! Order #${shortId}`,
            react: React.createElement(OrderConfirmation, {
              customerName: profile?.full_name || "Valued Customer",
              orderId: emailOrderId,
              items: items.map((item) => ({
                name: item.name_snapshot,
                quantity: item.quantity,
                lineTotalCents: item.line_total_cents,
                modifiers: item.order_item_modifiers?.map((m) => ({
                  name: m.name_snapshot,
                  priceDelta: m.price_delta_snapshot,
                })),
              })),
              subtotalCents: orderData.subtotal_cents,
              deliveryFeeCents: orderData.delivery_fee_cents,
              taxCents: orderData.tax_cents,
              totalCents: orderData.total_cents,
              deliveryWindowStart: orderData.delivery_window_start ?? undefined,
              deliveryWindowEnd: orderData.delivery_window_end ?? undefined,
              address: address
                ? {
                    line1: address.line_1,
                    line2: address.line_2 ?? undefined,
                    city: address.city,
                    state: address.state,
                    postalCode: address.postal_code,
                  }
                : { line1: "Address on file", city: "", state: "", postalCode: "" },
              specialInstructions: orderData.special_instructions ?? undefined,
              placedAt: orderData.placed_at,
              suggestedItems,
            }),
            type: "order_confirmation",
            orderId: emailOrderId,
            userId: emailUserId,
            mandatory: true,
            idempotencyKey: `order-confirmation-${emailOrderId}`,
          });
        } catch (emailErr) {
          logger.error("Failed to send order confirmation email from verify-payment", {
            orderId: emailOrderId,
            error: emailErr instanceof Error ? emailErr.message : String(emailErr),
          });
        }
      });

      logger.info(`Order confirmation email triggered from verify-payment for ${orderId}`, {
        orderId,
        api: "verify-payment",
        flowId: "email",
      });
    }
  }

  return NextResponse.json({ status: "confirmed" });
}
