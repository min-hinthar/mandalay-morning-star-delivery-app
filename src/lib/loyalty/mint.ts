import { stripe } from "@/lib/stripe/server";
import { generateReferralCode } from "@/lib/referrals";
import { LOYALTY_MIN_SUBTOTAL_CENTS, LOYALTY_REWARD_CENTS } from ".";

/**
 * Mint a one-time "Kyay-Zu-Par!" promo code off the shared $5 loyalty coupon.
 * Redeemed via the normal checkout promo flow. Reuses the configured coupon
 * (STRIPE_LOYALTY_COUPON_ID); falls back to minting one so the flow still works
 * if the env var isn't set yet.
 */
export async function mintLoyaltyPromoCode(): Promise<string> {
  const couponId =
    process.env.STRIPE_LOYALTY_COUPON_ID ??
    (
      await stripe.coupons.create({
        amount_off: LOYALTY_REWARD_CENTS,
        currency: "usd",
        duration: "once",
        name: "Kyay-Zu-Par! (loyalty)",
      })
    ).id;

  const code = `KYAYZU-${generateReferralCode()}`;
  await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: couponId },
    code,
    max_redemptions: 1,
    restrictions: {
      minimum_amount: LOYALTY_MIN_SUBTOTAL_CENTS,
      minimum_amount_currency: "usd",
    },
  });
  return code;
}
