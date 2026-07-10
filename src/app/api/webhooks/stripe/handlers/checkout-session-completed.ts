import React from "react";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { maybeRewardReferral } from "@/lib/referrals/reward";
import { maybeIssueMilestoneReward } from "@/lib/loyalty/reward";
import { markLoyaltyRedeemed } from "@/lib/loyalty/redeem";
import {
  sendEmail,
  fetchSuggestedItems,
  fetchDietaryRestrictions,
  getAdminEmails,
} from "@/lib/email";
import { getLoyaltyNudge } from "@/lib/email/nudges";
import { logger } from "@/lib/utils/logger";
import {
  captureStrandedPayment,
  emailAdminsStrandedPayment,
} from "@/lib/orders/stranded-payment-alert";
import { AdminNewOrderAlert } from "@/emails/AdminNewOrderAlert";
import { OrderConfirmation } from "@/emails/OrderConfirmation";
import type Stripe from "stripe";

/**
 * Handle successful checkout session completion
 */
export async function handleCheckoutSessionCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    logger.error("No order_id in session metadata", {
      sessionId: session.id,
      api: "stripe-webhook",
      flowId: "checkout",
    });
    return;
  }

  // H-01 FIX: Safely extract payment_intent — can be null, string, or PaymentIntent object
  const rawPaymentIntent = session.payment_intent;
  const paymentIntentId =
    typeof rawPaymentIntent === "string"
      ? rawPaymentIntent
      : typeof rawPaymentIntent === "object" && rawPaymentIntent !== null
        ? rawPaymentIntent.id
        : null;

  if (!paymentIntentId) {
    logger.warn(
      "payment_intent is null on checkout.session.completed — storing session ID as fallback",
      {
        sessionId: session.id,
        orderId,
        api: "stripe-webhook",
        flowId: "checkout",
      }
    );
  }

  // Update order status to confirmed — select("id") to verify rows affected
  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: paymentIntentId ?? `session_${session.id}`,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending") // Only update if still pending (idempotency)
    .select("id");

  if (error) {
    logger.exception(error, { orderId, api: "stripe-webhook", flowId: "checkout" });
    throw error;
  }

  // 0 rows updated — order doesn't exist or already processed
  if (!updated || updated.length === 0) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (!existing) {
      logger.error("Webhook: order not found in database", {
        orderId,
        sessionId: session.id,
        api: "stripe-webhook",
        flowId: "checkout",
      });
    } else if (existing.status === "cancelled" && session.payment_status === "paid") {
      // The order was cancelled BEFORE this paid completion landed (a
      // cancel/expiry-vs-payment race). The customer was charged but the order
      // is cancelled — otherwise silent (this handler would just log "skipping").
      // Surface it so it can be refunded/reinstated. No refund has happened yet,
      // so amountRefunded = 0 and amount = the session total.
      const inspection = {
        paid: true,
        amountCents: session.amount_total ?? 0,
        amountRefundedCents: 0,
        paymentIntentId: paymentIntentId,
        sessionId: session.id,
      };
      const alertCtx = {
        orderId,
        userId: session.metadata?.user_id,
        source: "stripe-webhook",
        inspection,
      };
      captureStrandedPayment("paid_but_cancelled", alertCtx);
      after(() => emailAdminsStrandedPayment("paid_but_cancelled", alertCtx));
    } else {
      // Already processed (idempotent) — not an error
      logger.info(`Order ${orderId} already ${existing.status}, skipping`, {
        orderId,
        currentStatus: existing.status,
        api: "stripe-webhook",
        flowId: "checkout",
      });
    }
    return;
  }

  logger.info(`Order ${orderId} confirmed via webhook`, {
    orderId,
    api: "stripe-webhook",
    flowId: "checkout",
  });

  // Fetch full order data for email
  const { data: orderData } = await supabase
    .from("orders")
    .select(
      `
      id, user_id, subtotal_cents, delivery_fee_cents, tax_cents, tip_cents, discount_cents, total_cents, promo_code,
      delivery_window_start, delivery_window_end, special_instructions, delivery_instructions, placed_at,
      profiles!orders_user_id_fkey ( email, full_name ),
      addresses ( line_1, line_2, city, state, postal_code ),
      order_items (
        name_snapshot, name_my_snapshot, special_instructions, quantity, line_total_cents,
        menu_items ( image_url ),
        order_item_modifiers ( name_snapshot, price_delta_snapshot )
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (!orderData) {
    logger.error("Could not fetch order data for confirmation email", {
      orderId,
      api: "stripe-webhook",
      flowId: "email",
    });
    return;
  }

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
      name_my_snapshot: string | null;
      special_instructions: string | null;
      quantity: number;
      line_total_cents: number;
      menu_items: { image_url: string | null } | null;
      order_item_modifiers: Array<{ name_snapshot: string; price_delta_snapshot: number }>;
    }>) || [];

  const customerEmail = profile?.email;
  if (!customerEmail) {
    logger.error("No customer email for order confirmation", {
      orderId,
      api: "stripe-webhook",
      flowId: "email",
    });
    return;
  }

  const shortId = orderId.slice(0, 8).toUpperCase();

  // Schedule email after response (keeps serverless function alive on Vercel)
  after(async () => {
    try {
      // Fetch real menu items for "you might also like" section
      const orderedNames = items.map((item) => item.name_snapshot);
      const [suggestedItems, dietaryRestrictions, loyalty] = await Promise.all([
        fetchSuggestedItems(supabase, orderedNames),
        fetchDietaryRestrictions(supabase, orderData.user_id),
        getLoyaltyNudge(supabase, orderData.user_id),
      ]);

      const mappedItems = items.map((item) => ({
        name: item.name_snapshot,
        nameMy: item.name_my_snapshot,
        quantity: item.quantity,
        lineTotalCents: item.line_total_cents,
        notes: item.special_instructions,
        imageUrl: item.menu_items?.image_url ?? null,
        modifiers: item.order_item_modifiers?.map((m) => ({
          name: m.name_snapshot,
          priceDelta: m.price_delta_snapshot,
        })),
      }));

      await sendEmail({
        to: customerEmail,
        subject: `\uD83C\uDF5C Your order is confirmed! Order #${shortId}`,
        react: React.createElement(OrderConfirmation, {
          customerName: profile?.full_name || "Valued Customer",
          orderId,
          items: mappedItems,
          subtotalCents: orderData.subtotal_cents,
          deliveryFeeCents: orderData.delivery_fee_cents,
          taxCents: orderData.tax_cents,
          tipCents: orderData.tip_cents ?? undefined,
          discountCents: orderData.discount_cents ?? undefined,
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
          deliveryInstructions: orderData.delivery_instructions ?? undefined,
          dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
          placedAt: orderData.placed_at,
          suggestedItems,
          loyalty,
        }),
        type: "order_confirmation",
        orderId,
        userId: orderData.user_id,
        mandatory: true,
        idempotencyKey: `order-confirmation-${orderId}`,
      });
    } catch (emailErr) {
      logger.error("Failed to send order confirmation email", {
        orderId,
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }
  });

  // Schedule admin new-order alert after response
  after(async () => {
    try {
      const admins = await getAdminEmails();
      const STAGGER_MS = 100;
      const adminDietary = await fetchDietaryRestrictions(supabase, orderData.user_id);
      const adminItems = items.map((item) => ({
        name: item.name_snapshot,
        nameMy: item.name_my_snapshot,
        quantity: item.quantity,
        lineTotalCents: item.line_total_cents,
        notes: item.special_instructions,
        imageUrl: item.menu_items?.image_url ?? null,
        modifiers: item.order_item_modifiers?.map((m) => ({
          name: m.name_snapshot,
          priceDelta: m.price_delta_snapshot,
        })),
      }));

      for (let i = 0; i < admins.length; i++) {
        const admin = admins[i];
        await sendEmail({
          to: admin.email,
          subject: `New Order #${shortId} from ${profile?.full_name || "Customer"}`,
          react: React.createElement(AdminNewOrderAlert, {
            orderId,
            customerName: profile?.full_name || "Unknown Customer",
            customerEmail: customerEmail,
            items: adminItems,
            subtotalCents: orderData.subtotal_cents,
            deliveryFeeCents: orderData.delivery_fee_cents,
            taxCents: orderData.tax_cents,
            tipCents: orderData.tip_cents ?? undefined,
            discountCents: orderData.discount_cents ?? undefined,
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
            deliveryInstructions: orderData.delivery_instructions ?? undefined,
            dietaryRestrictions: adminDietary.length > 0 ? adminDietary : undefined,
            paymentMethod: "stripe",
            placedAt: orderData.placed_at,
          }),
          type: "admin_new_order",
          orderId,
          userId: admin.id,
          mandatory: true,
          idempotencyKey: `admin-new-order-${orderId}-${admin.id}`,
        });

        if (i < admins.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, STAGGER_MS));
        }
      }
    } catch (adminEmailErr) {
      logger.error("Failed to send admin new-order alert", {
        orderId,
        error: adminEmailErr instanceof Error ? adminEmailErr.message : String(adminEmailErr),
      });
    }
  });

  // Referral reward (best-effort): if this customer was referred, reward the
  // referrer on this first confirmed order. Never affects the order itself.
  after(async () => {
    try {
      await maybeRewardReferral(supabase, orderData.user_id);
    } catch (referralErr) {
      logger.error("Referral reward failed", {
        orderId,
        error: referralErr instanceof Error ? referralErr.message : String(referralErr),
      });
    }
  });

  // Loyalty milestone (best-effort): if this order lands the customer on a
  // milestone (every Nth order), issue a $5 Kyay-Zu-Par! reward. Idempotent.
  after(async () => {
    try {
      await maybeIssueMilestoneReward(supabase, orderData.user_id);
    } catch (loyaltyErr) {
      logger.error("Loyalty milestone reward failed", {
        orderId,
        error: loyaltyErr instanceof Error ? loyaltyErr.message : String(loyaltyErr),
      });
    }
  });

  // Loyalty redemption (best-effort): if a Kyay-Zu-Par! code was used on this
  // order, mark it redeemed so the wallet + admin show live state.
  after(async () => {
    try {
      await markLoyaltyRedeemed(supabase, orderData.promo_code);
    } catch (redeemErr) {
      logger.error("Loyalty redemption marking failed", {
        orderId,
        error: redeemErr instanceof Error ? redeemErr.message : String(redeemErr),
      });
    }
  });

  logger.info(`Order confirmation email triggered for ${orderId}`, {
    orderId,
    api: "stripe-webhook",
    flowId: "email",
  });
}
