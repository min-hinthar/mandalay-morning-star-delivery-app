import { stripe } from "@/lib/stripe/server";
import { generateReferralCode } from "@/lib/referrals";
import { LOYALTY_MIN_SUBTOTAL_CENTS, LOYALTY_REWARD_CENTS } from ".";

/**
 * Configured Stripe coupons by discount amount (cents). Each tier's reward is a
 * fixed-amount coupon, so we keep one shared coupon per amount and mint unique,
 * one-time promo codes off it. Falls back to creating a coupon if the env var
 * isn't set yet (mirrors the referral reward flow).
 */
function configuredCoupon(amountCents: number): string | undefined {
  switch (amountCents) {
    case 500:
      return process.env.STRIPE_LOYALTY_COUPON_ID;
    case 800:
      return process.env.STRIPE_LOYALTY_COUPON_ID_800;
    case 1000:
      return process.env.STRIPE_LOYALTY_COUPON_ID_1000;
    case 1200:
      return process.env.STRIPE_LOYALTY_COUPON_ID_1200;
    default:
      return undefined;
  }
}

async function couponFor(amountCents: number): Promise<string> {
  const configured = configuredCoupon(amountCents);
  if (configured) return configured;
  const coupon = await stripe.coupons.create({
    amount_off: amountCents,
    currency: "usd",
    duration: "once",
    name: `Kyay-Zu-Par! ($${(amountCents / 100).toFixed(0)} loyalty)`,
  });
  return coupon.id;
}

/**
 * Mint a one-time "Kyay-Zu-Par!" promo code worth `amountCents`, redeemed via
 * the normal checkout promo flow ($50+ minimum).
 */
export async function mintLoyaltyPromoCode(
  amountCents: number = LOYALTY_REWARD_CENTS
): Promise<string> {
  const couponId = await couponFor(amountCents);
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
