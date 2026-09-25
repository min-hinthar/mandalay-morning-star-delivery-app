import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { effectFor, lookupCoupon, type CouponRow } from "@/lib/coupons";
import { validatePromoCode } from "@/lib/stripe/promo";
import { resolveFirstOrderDiscount } from "@/lib/referrals/first-order-discount";
import { reclaimPendingCheckouts } from "@/lib/referrals/reclaim-pending-checkouts";
import { logger } from "@/lib/utils/logger";

import { countAppRedemptions, reclaimOwnCheckoutsWithCode } from "./promo-redemptions";
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
  /**
   * App-issued one-time coupon (admin Coupons page). Claimed atomically once
   * the order row exists (claim_coupon). amount/percent coupons charge via a
   * one-off amount_off Stripe coupon; free-delivery coupons reduce the
   * delivery fee instead (see `deliveryWaiverFor`).
   */
  appCoupon: CouponRow | null;
}

export { PERCENT_CONVERSION_CUTOVER_ISO } from "./promo-redemptions";

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
  /** Service-role client: loyalty-code ownership lookup (must see rows the
   * customer doesn't own to reject cross-account use), first-order gates, and
   * stale-pending reclaim. */
  serviceClient: SupabaseClient<Database>,
  /** Used only to expire stale pending checkout sessions (first-order gates). */
  stripe: Stripe,
  /** COD orders never reach Stripe, so none of Stripe's native promotion-code
   * enforcement (max_redemptions, first_time_transaction) applies to them. */
  paymentMethod: "stripe" | "cod" = "stripe"
): Promise<ResolveDiscountResult> {
  if (promoCode) {
    const lookup = await lookupCoupon(serviceClient, promoCode, { userId, subtotalCents });
    if (lookup.status === "invalid") return { ok: false, message: lookup.message };
    if (lookup.status === "valid") {
      // No destructive work here: releasing the customer's own abandoned
      // holder happens at claim time (coupon-claim.ts), after every
      // non-destructive checkout gate has passed.
      return {
        ok: true,
        discount: {
          discountCents: effectFor(lookup.coupon, subtotalCents, 0).discountCents,
          couponId: null,
          promotionCodeId: null,
          isPercent: false,
          appCoupon: lookup.coupon,
        },
      };
    }

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
        .select("user_id, redeemed_at")
        .eq("reward_code", promoCode)
        .maybeSingle();
      if (!reward) {
        return { ok: false, message: "Invalid or expired promo code" };
      }
      if (reward.user_id !== userId) {
        return { ok: false, message: "This reward is linked to a different account." };
      }
      // Stamped on the first confirmed use (webhook / COD approval). Stripe
      // only counts Stripe-paid redemptions, so a code spent on a COD order
      // would otherwise stay live forever.
      if (reward.redeemed_at) {
        return { ok: false, message: "This reward has already been used." };
      }
    }
    if (promo.minimumAmountCents !== null && subtotalCents < promo.minimumAmountCents) {
      return {
        ok: false,
        message: `This code needs a subtotal of at least $${(promo.minimumAmountCents / 100).toFixed(2)}.`,
      };
    }
    const isPercent = promo.percentOff !== null;
    // Converted percent codes never pass through Stripe's promotion-code
    // machinery, so dashboard restrictions Stripe would normally enforce at
    // redemption must be enforced here.
    // The same holds for COD: Stripe never sees those orders — which also means
    // Stripe's own first-order check can't see a prior COD order, so the
    // prior-order gate runs for every first-time code on both paths.
    const appEnforced = isPercent || paymentMethod === "cod";
    if (promo.firstTimeTransaction) {
      const { count: priorOrders, error: priorError } = await serviceClient
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("status", "in", "(pending,cancelled)");
      if (priorError) {
        logger.exception(priorError, { api: "checkout-session", promoCode });
        return { ok: false, message: "Failed to validate promo code" };
      }
      if ((priorOrders ?? 0) > 0) {
        return { ok: false, message: "This code is only valid on your first order." };
      }
    }
    if (promo.maxRedemptions != null) {
      const used = await countAppRedemptions(serviceClient, promoCode, userId, isPercent);
      if ("error" in used) return { ok: false, message: "Failed to validate promo code" };
      if ((promo.timesRedeemed ?? 0) + used.count >= promo.maxRedemptions) {
        return { ok: false, message: "This promo code has reached its redemption limit." };
      }
    }
    // Same stacking hole as the auto first-order discount (audit D6): an open
    // unpaid checkout can still complete WITH its own discount, so DISCOUNTED
    // pendings must block — after attempting to reclaim stale ones (expire
    // the session, cancel the order) so an abandoned-checkout retry isn't
    // locked out for the 30-minute session lifetime. Undiscounted pendings
    // can't stack and are left alone. Deliberately the LAST gate: the reclaim
    // is destructive, so every non-destructive rejection above (ownership,
    // minimum, first-order, redemption cap) must have passed first — a code
    // that is going to be rejected anyway must not tear down a live checkout.
    if (appEnforced && promo.firstTimeTransaction) {
      const { count: pendingOrders, error: pendingError } = await serviceClient
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending")
        .gt("discount_cents", 0);
      if (pendingError) {
        logger.exception(pendingError, { api: "checkout-session", promoCode });
        return { ok: false, message: "Failed to validate promo code" };
      }
      if ((pendingOrders ?? 0) > 0) {
        const freed = await reclaimPendingCheckouts(stripe, serviceClient, userId);
        if (!freed) {
          return {
            ok: false,
            message:
              "You have another checkout in progress — finish or wait a few minutes, then try this code again.",
          };
        }
      }
    }
    if (
      promo.maxRedemptions != null &&
      !(await reclaimOwnCheckoutsWithCode(stripe, serviceClient, userId, promoCode))
    ) {
      return {
        ok: false,
        message:
          "You have another checkout in progress with this code — finish or wait a few minutes, then try again.",
      };
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
        appCoupon: null,
      },
    };
  }

  const autoDiscount = await resolveFirstOrderDiscount(supabase, userId, subtotalCents, {
    stripe,
    serviceClient,
  });
  if (autoDiscount) {
    return {
      ok: true,
      discount: {
        discountCents: autoDiscount.discountCents,
        couponId: autoDiscount.couponId,
        promotionCodeId: null,
        isPercent: false,
        appCoupon: null,
      },
    };
  }

  return {
    ok: true,
    discount: {
      discountCents: 0,
      couponId: null,
      promotionCodeId: null,
      isPercent: false,
      appCoupon: null,
    },
  };
}

/**
 * Drop an app coupon that would save nothing on this order (a free-delivery
 * code when delivery is already free) so it is never claimed — burning a
 * one-time gift for $0. Returns the SAME object when nothing changes.
 */
export function withoutIdleCoupon(
  discount: CheckoutDiscount,
  deliveryFeeCents: number
): CheckoutDiscount {
  if (!discount.appCoupon || discount.discountCents > 0) return discount;
  if (effectFor(discount.appCoupon, 0, deliveryFeeCents).deliveryWaiverCents > 0) return discount;
  return { ...discount, appCoupon: null };
}

interface OrderTotals {
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  tipCents: number;
  discountCents: number;
  totalCents: number;
}

/**
 * Apply a free-delivery app coupon to computed totals: the waived amount comes
 * off the CHARGED delivery fee (not discount_cents — that is a food discount
 * and feeds loyalty spend + the proportional item-refund math). Tax is on the
 * food subtotal only, so it is unaffected. No-op for every other discount.
 */
export function applyDeliveryWaiver<T extends OrderTotals>(
  totals: T,
  discount: CheckoutDiscount
): T {
  if (!discount.appCoupon) return totals;
  const waiver = effectFor(discount.appCoupon, 0, totals.deliveryFeeCents).deliveryWaiverCents;
  if (waiver <= 0) return totals;
  const deliveryFeeCents = totals.deliveryFeeCents - waiver;
  const totalCents = Math.max(
    0,
    totals.subtotalCents +
      deliveryFeeCents +
      totals.taxCents +
      totals.tipCents -
      totals.discountCents
  );
  return { ...totals, deliveryFeeCents, totalCents };
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
  // App coupons have no Stripe object; like percent codes they charge through
  // a one-off amount_off coupon sized to the server-computed food discount.
  // (Free-delivery coupons have discountCents 0 → no discount; the waived fee
  // simply isn't a line item.)
  if (discount.appCoupon) {
    if (discount.discountCents <= 0) return undefined;
    const oneOff = await stripe.coupons.create({
      amount_off: discount.discountCents,
      currency: "usd",
      duration: "once",
      // Stripe caps coupon names at 40 chars.
      name: `${discount.appCoupon.code} (applied)`.slice(0, 40),
      metadata: { source: "app-coupon", coupon_id: discount.appCoupon.id },
      redeem_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    });
    return [{ coupon: oneOff.id }];
  }
  if (discount.isPercent) {
    if (discount.discountCents <= 0) {
      // A percent of a tiny subtotal can round to zero — never fall through
      // to the raw promotion code (it would re-introduce the tax/tip bug).
      return undefined;
    }
    const oneOff = await stripe.coupons.create({
      amount_off: discount.discountCents,
      currency: "usd",
      duration: "once",
      name: (promoCode ? `${promoCode.toUpperCase()} (applied)` : "Discount").slice(0, 40),
      metadata: { source: "percent-conversion", promo_code: promoCode ?? "" },
      // Self-expire abandoned-session coupons (each checkout attempt creates
      // one; only the completed session redeems it).
      redeem_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
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
