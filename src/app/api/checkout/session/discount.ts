import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { validatePromoCode } from "@/lib/stripe/promo";
import { resolveFirstOrderDiscount } from "@/lib/referrals/first-order-discount";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";

export interface CheckoutDiscount {
  discountCents: number;
  /** Bare coupon id — used for the server-gated first-order auto-discount. */
  couponId: string | null;
  /**
   * Promotion code id for a customer-entered code. When set, checkout applies
   * it as `discounts: [{ promotion_code }]` so Stripe natively enforces the
   * code's max_redemptions / minimum_amount / expires_at.
   */
  promotionCodeId: string | null;
  /**
   * True when the code is percent_off. Percent codes must NOT be passed to
   * Stripe as a promotion_code: Stripe applies percent discounts to EVERY
   * line item — including the Sales Tax and Tip lines — so the charge comes
   * in below the stored total (tip shaved, tax under-collected). Checkout
   * instead converts the server-computed `discountCents` into a one-off
   * amount_off coupon (see resolveStripeSessionDiscounts).
   */
  isPercent: boolean;
}

export type ResolveDiscountResult =
  | { ok: true; discount: CheckoutDiscount }
  | { ok: false; message: string };

/**
 * Resolve the discount for a checkout session.
 *
 * - A customer-entered `promoCode` is validated against Stripe; its minimum
 *   subtotal is enforced here (friendly error) rather than letting Stripe 500
 *   at session creation. Applied as a promotion code so restrictions hold.
 * - With no code, falls back to the server-gated first-order auto-discount
 *   (welcome/referee), applied as a bare coupon (no shareable code).
 */
export async function resolveCheckoutDiscount(
  supabase: SupabaseClient<Database>,
  userId: string,
  subtotalCents: number,
  promoCode: string | undefined,
  /** Service-role client, used ONLY for the loyalty-code ownership lookup (must
   * see rows the customer doesn't own to reject cross-account use). */
  serviceClient: SupabaseClient<Database>
): Promise<ResolveDiscountResult> {
  if (promoCode) {
    const promo = await validatePromoCode(promoCode);
    if (!promo.valid) {
      return { ok: false, message: promo.message };
    }
    // Loyalty codes (KYAYZU-) are issued to one customer. Stripe's
    // max_redemptions:1 already blocks reuse, but bind the code to its owner
    // here so a leaked code can't be redeemed by another account and the
    // customer gets a clear message before paying. Referral codes are
    // intentionally shareable, so they're exempt. Uses the service client so
    // RLS doesn't hide another account's row (which would mask the real cause).
    if (promoCode.toUpperCase().startsWith("KYAYZU-")) {
      const { data: reward } = await serviceClient
        .from("loyalty_rewards")
        .select("user_id")
        .eq("reward_code", promoCode)
        .maybeSingle();
      if (!reward) {
        return { ok: false, message: "Invalid or expired promo code" };
      }
      if (reward.user_id !== userId) {
        return { ok: false, message: "This reward is linked to a different account." };
      }
    }
    if (promo.minimumAmountCents !== null && subtotalCents < promo.minimumAmountCents) {
      return {
        ok: false,
        message: `This code needs a subtotal of at least $${(promo.minimumAmountCents / 100).toFixed(2)}.`,
      };
    }
    const isPercent = promo.percentOff !== null;
    // Percent codes are charged via a one-off amount_off coupon, so Stripe's
    // native times_redeemed never increments for them. Enforce the code's
    // max_redemptions here: Stripe-counted redemptions (historical
    // promotion-code checkouts) + orders this app has taken with the code.
    // Pending (unpaid Stripe sessions) and cancelled orders don't consume a
    // redemption; the small race window between concurrent sessions matches
    // Stripe's own count-at-completion behavior.
    if (isPercent && promo.maxRedemptions != null) {
      const { count, error: countError } = await serviceClient
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("promo_code", promoCode)
        .not("status", "in", "(pending,cancelled)");
      if (countError) {
        logger.exception(countError, { api: "checkout-session", promoCode });
        return { ok: false, message: "Failed to validate promo code" };
      }
      if ((promo.timesRedeemed ?? 0) + (count ?? 0) >= promo.maxRedemptions) {
        return { ok: false, message: "This promo code has reached its redemption limit." };
      }
    }
    const discountCents =
      promo.percentOff !== null
        ? Math.round((subtotalCents * promo.percentOff) / 100)
        : promo.discountCents;
    return {
      ok: true,
      discount: {
        discountCents,
        couponId: promo.couponId,
        promotionCodeId: promo.promotionCodeId,
        isPercent,
      },
    };
  }

  const autoDiscount = await resolveFirstOrderDiscount(supabase, userId, subtotalCents);
  if (autoDiscount) {
    return {
      ok: true,
      discount: {
        discountCents: autoDiscount.discountCents,
        couponId: autoDiscount.couponId,
        promotionCodeId: null,
        isPercent: false,
      },
    };
  }

  return {
    ok: true,
    discount: { discountCents: 0, couponId: null, promotionCodeId: null, isPercent: false },
  };
}

/**
 * Build the Stripe Checkout `discounts` param for a resolved discount.
 *
 * - amount_off promotion codes pass through as `{ promotion_code }` (Stripe's
 *   flat discount matches the stored discount_cents exactly, and its native
 *   max_redemptions counting keeps working).
 * - percent_off codes are converted to a ONE-OFF amount_off coupon equal to
 *   the server-computed discount on the FOOD SUBTOTAL only. Passing the raw
 *   percent code would discount the Sales Tax and Tip line items too,
 *   charging less than the stored total. Redemption caps for percent codes
 *   are enforced app-side in resolveCheckoutDiscount.
 * - the server-gated first-order discount stays a bare `{ coupon }`.
 */
export async function resolveStripeSessionDiscounts(
  stripe: Stripe,
  discount: CheckoutDiscount,
  promoCode: string | undefined
): Promise<Stripe.Checkout.SessionCreateParams.Discount[] | undefined> {
  if (discount.isPercent && discount.discountCents > 0) {
    const oneOff = await stripe.coupons.create({
      amount_off: discount.discountCents,
      currency: "usd",
      duration: "once",
      name: promoCode ? `${promoCode.toUpperCase()} (applied)` : "Discount",
      metadata: { source: "percent-conversion", promo_code: promoCode ?? "" },
    });
    return [{ coupon: oneOff.id }];
  }
  if (discount.promotionCodeId) {
    return [{ promotion_code: discount.promotionCodeId }];
  }
  if (discount.couponId) {
    return [{ coupon: discount.couponId }];
  }
  return undefined;
}
