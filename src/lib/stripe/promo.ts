import { stripe } from "@/lib/stripe/server";
import { logger } from "@/lib/utils/logger";

export interface PromoValidationResult {
  valid: true;
  discountCents: number;
  /** Stripe coupon ID (the underlying discount). */
  couponId: string;
  /**
   * Stripe promotion code ID (e.g. promo_123) — pass this to the session
   * `discounts` param so Stripe natively enforces the code's restrictions
   * (max_redemptions, minimum_amount, expires_at). Null only for malformed data.
   */
  promotionCodeId: string;
  /** Whether discount is percentage-based (needs subtotal to compute) */
  percentOff: number | null;
  /** Minimum order subtotal (cents) required by the promo code, if any. */
  minimumAmountCents: number | null;
}

export interface PromoValidationError {
  valid: false;
  message: string;
}

/**
 * Validate a promo code against Stripe Promotion Codes API.
 *
 * Returns the coupon ID and discount info on success.
 * For percent_off coupons, `discountCents` is 0 — caller must compute
 * `Math.round(subtotalCents * percentOff / 100)` after calculating subtotal.
 */
export async function validatePromoCode(
  code: string
): Promise<PromoValidationResult | PromoValidationError> {
  try {
    const promos = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ["data.promotion.coupon"],
    });

    if (promos.data.length === 0) {
      return { valid: false, message: "Invalid or expired promo code" };
    }

    const promo = promos.data[0];
    const coupon = promo.promotion.coupon;

    // coupon can be null or a string (unexpanded) — guard against both
    if (!coupon || typeof coupon === "string") {
      return { valid: false, message: "Invalid promo code configuration" };
    }

    // The code's per-redemption minimum lives in restrictions.minimum_amount.
    const minimumAmountCents = promo.restrictions?.minimum_amount ?? null;

    if (coupon.amount_off) {
      return {
        valid: true,
        discountCents: coupon.amount_off,
        couponId: coupon.id,
        promotionCodeId: promo.id,
        percentOff: null,
        minimumAmountCents,
      };
    }

    if (coupon.percent_off) {
      return {
        valid: true,
        discountCents: 0, // Caller computes from subtotal
        couponId: coupon.id,
        promotionCodeId: promo.id,
        percentOff: coupon.percent_off,
        minimumAmountCents,
      };
    }

    // Coupon with no discount type — treat as invalid
    return { valid: false, message: "Invalid promo code configuration" };
  } catch (err) {
    logger.exception(err, { api: "checkout-session", promoCode: code });
    return { valid: false, message: "Failed to validate promo code" };
  }
}
