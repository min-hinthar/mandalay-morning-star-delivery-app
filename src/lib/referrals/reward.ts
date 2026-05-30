import React from "react";
import { render } from "@react-email/render";
import type { SupabaseClient } from "@supabase/supabase-js";

import { stripe } from "@/lib/stripe/server";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { ReferralReward } from "@/emails/ReferralReward";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";
import { FIRST_ORDER_MIN_SUBTOTAL_CENTS, generateReferralCode, REFERRAL_REWARD_CENTS } from ".";

/**
 * If this user was referred and hasn't been rewarded yet, complete the referral
 * and issue the referrer a one-time Stripe promo code (redeemed via the normal
 * checkout promo flow). Best-effort and idempotent: the pending→completed claim
 * is the lock, so concurrent webhooks can't double-issue. Call only after an
 * order is confirmed; a referral exists only for customers who had no orders
 * when they joined, so the first confirmed order is the trigger.
 */
export async function maybeRewardReferral(
  service: SupabaseClient<Database>,
  refereeUserId: string
): Promise<void> {
  const { data: referral } = await service
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referee_id", refereeUserId)
    .maybeSingle();
  if (!referral || referral.status !== "pending") return;

  // Atomically claim the referral — only the first caller transitions it.
  const { data: claimed } = await service
    .from("referrals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", referral.id)
    .eq("status", "pending")
    .select("id");
  if (!claimed || claimed.length === 0) return;

  try {
    const promoCode = `THANKS-${generateReferralCode()}`;
    // Reuse the configured $10 coupon (PC6weyTH); fall back to minting one so
    // the flow still works if the env var isn't set yet.
    const couponId =
      process.env.STRIPE_REFERRAL_COUPON_ID ??
      (
        await stripe.coupons.create({
          amount_off: REFERRAL_REWARD_CENTS,
          currency: "usd",
          duration: "once",
          name: "Referral reward",
        })
      ).id;
    await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: couponId },
      code: promoCode,
      max_redemptions: 1,
      restrictions: {
        minimum_amount: FIRST_ORDER_MIN_SUBTOTAL_CENTS,
        minimum_amount_currency: "usd",
      },
    });

    await service
      .from("referrals")
      .update({ reward_code: promoCode, reward_cents: REFERRAL_REWARD_CENTS })
      .eq("id", referral.id);

    const { data: referrer } = await service
      .from("profiles")
      .select("email, full_name")
      .eq("id", referral.referrer_id)
      .maybeSingle();
    if (!referrer?.email) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";
    const emailComponent = React.createElement(ReferralReward, {
      referrerName: referrer.full_name?.split(" ")[0] || "friend",
      rewardCents: REFERRAL_REWARD_CENTS,
      promoCode,
      menuUrl: `${appUrl}/menu`,
    });
    const [html, text] = await Promise.all([
      render(emailComponent),
      render(emailComponent, { plainText: true }),
    ]);

    await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: referrer.email,
      cc: EMAIL_CC,
      replyTo: EMAIL_REPLY_TO,
      subject: "You earned a referral reward! 🎉",
      html,
      text,
    });
  } catch (error) {
    // Referral is already marked completed; a failed reward is logged for
    // manual follow-up rather than retried (avoids duplicate coupons).
    logger.exception(error, { api: "referrals/reward", refereeUserId });
  }
}
