import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
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

  return NextResponse.json({ status: "confirmed" });
}
