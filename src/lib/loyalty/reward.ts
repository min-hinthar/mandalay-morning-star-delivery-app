import React from "react";
import { render } from "@react-email/render";
import type { SupabaseClient } from "@supabase/supabase-js";

import { LoyaltyReward } from "@/emails/LoyaltyReward";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { tierPerkFromTier } from "@/lib/email/nudges";
import { sendPushToUser } from "@/lib/push/send";
import { logger } from "@/lib/utils/logger";
import { formatPrice } from "@/lib/utils/currency";
import type { Database } from "@/types/database";
import { milestonesReached, rewardCentsForSpend, tierForSpend } from ".";
import { loyaltyStatsForUser } from "./tier";
import { mintLoyaltyPromoCode } from "./mint";

/**
 * Issue any unclaimed loyalty milestones the customer has reached (every Nth
 * qualifying order), back-filling so a count jump never skips a reward. Each
 * coupon is sized by the customer's current SPEND tier (so loyal big spenders
 * get bigger Kyay-Zu-Par!). Best-effort and idempotent: the loyalty_rewards
 * insert (UNIQUE user_id+milestone) is the lock, so re-runs and concurrent
 * webhooks can't double-issue. Call only after an order is paid/approved.
 *
 * Only the highest newly-issued milestone sends a push + email, so back-filling
 * several at once doesn't spam the customer.
 */
export async function maybeIssueMilestoneReward(
  service: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  try {
    const { orderCount, spendCents } = await loyaltyStatsForUser(service, userId);
    const milestones = milestonesReached(orderCount);
    if (milestones.length === 0) return;

    // Coupon size tracks the customer's current spend tier.
    const rewardCents = rewardCentsForSpend(spendCents);
    const tier = tierForSpend(spendCents);

    // Claim each milestone; the unique constraint makes already-issued ones a
    // no-op (0 rows). Collect the newly-claimed ones.
    const newlyIssued: { id: string; milestone: number }[] = [];
    for (const milestone of milestones) {
      const { data: claimed } = await service
        .from("loyalty_rewards")
        .insert({ user_id: userId, kind: "milestone", milestone, reward_cents: rewardCents })
        .select("id");
      if (claimed && claimed.length > 0) {
        newlyIssued.push({ id: claimed[0].id, milestone });
      }
    }
    if (newlyIssued.length === 0) return;

    // Mint a code for every newly-issued milestone so each is redeemable.
    // Remember the top milestone's code to feature in the celebration email.
    let topCode = "";
    for (const issued of newlyIssued) {
      const { code, expiresAt } = await mintLoyaltyPromoCode(rewardCents);
      await service
        .from("loyalty_rewards")
        .update({ reward_code: code, expires_at: expiresAt })
        .eq("id", issued.id);
      topCode = code;
    }

    // Notify once, for the highest milestone just reached.
    const top = newlyIssued[newlyIssued.length - 1];
    const amount = formatPrice(rewardCents);

    await sendPushToUser(service, userId, {
      title: `Kyay-Zu-Par! 🙏 ${amount} reward unlocked`,
      body: `${top.milestone} orders in — here's ${amount} off your next feast. Tap to view.`,
      url: "/account?tab=rewards",
      tag: "loyalty-reward",
    });

    const { data: profile } = await service
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.email) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";
    const emailComponent = React.createElement(LoyaltyReward, {
      customerName: profile.full_name?.split(" ")[0] || "friend",
      rewardCents,
      promoCode: topCode,
      menuUrl: `${appUrl}/menu?src=loyalty_milestone`,
      variant: "milestone",
      milestone: top.milestone,
      tierName: tier.name,
      tierEnglish: tier.english,
      tierEmoji: tier.emoji,
      tier: tierPerkFromTier(tier),
    });
    const [html, text] = await Promise.all([
      render(emailComponent),
      render(emailComponent, { plainText: true }),
    ]);

    await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      cc: EMAIL_CC,
      replyTo: EMAIL_REPLY_TO,
      subject: `${top.milestone} orders in — here's ${amount}, with love 🙏`,
      html,
      text,
    });
  } catch (error) {
    // Reward row may already be claimed; a failed mint/email is logged for
    // manual follow-up rather than retried (avoids duplicate coupons).
    logger.exception(error, { api: "loyalty/reward", userId });
  }
}
