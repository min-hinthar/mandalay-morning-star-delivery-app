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
 * Self-healing: minting is driven off "claimed milestone rows that still have
 * no reward_code", not just the rows claimed in THIS call. So if a prior run
 * claimed a milestone but then threw before/while minting (Stripe/email blip),
 * the orphaned row — which the old code stranded forever, since the milestone
 * already read as "issued" — gets its code on the customer's next paid order.
 *
 * Only the highest filled milestone sends a push + email, so back-filling
 * several at once doesn't spam the customer.
 */
export async function maybeIssueMilestoneReward(
  service: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  try {
    const { orderCount, spendCents } = await loyaltyStatsForUser(service, userId);
    const milestones = milestonesReached(orderCount);

    // Coupon size for NEW milestones tracks the customer's current spend tier.
    // (Recovered orphans keep their own stored reward_cents — see below.)
    const rewardCents = rewardCentsForSpend(spendCents);
    const tier = tierForSpend(spendCents);

    // Claim each reached milestone. The UNIQUE (user_id, milestone) constraint
    // makes an already-claimed milestone a no-op (the duplicate insert just
    // errors, which we ignore), so this is safe to re-run and concurrency-safe.
    for (const milestone of milestones) {
      await service
        .from("loyalty_rewards")
        .insert({ user_id: userId, kind: "milestone", milestone, reward_cents: rewardCents });
    }

    // Mint a code for every milestone row that still lacks one. This covers the
    // rows just claimed above AND any orphaned by a PRIOR run whose mint/email
    // threw AFTER the row was claimed — previously those were stranded with a
    // null code and never retried (the milestone read as "already issued"), so
    // the customer silently lost an earned reward. Each row keeps its own
    // reward_cents, so a back-filled old orphan stays at the amount it earned.
    const { data: needsCode } = await service
      .from("loyalty_rewards")
      .select("id, milestone, reward_cents")
      .eq("user_id", userId)
      .eq("kind", "milestone")
      .is("reward_code", null)
      .order("milestone", { ascending: true });

    if (!needsCode || needsCode.length === 0) return;

    // Fill each row, guarding the write (.is reward_code null) so a concurrent
    // runner can't double-fill — its minted code is simply wasted (one-time +
    // TTL-expiring, never saved to the wallet), which is harmless.
    const filled: { milestone: number; code: string; rewardCents: number }[] = [];
    for (const row of needsCode) {
      if (row.milestone == null) continue; // milestone rows always have one — defensive
      const amountCents = row.reward_cents ?? rewardCents;
      const { code, expiresAt } = await mintLoyaltyPromoCode(amountCents);
      const { data: written } = await service
        .from("loyalty_rewards")
        .update({ reward_code: code, expires_at: expiresAt })
        .eq("id", row.id)
        .is("reward_code", null)
        .select("id");
      if (written && written.length > 0) {
        filled.push({ milestone: row.milestone, code, rewardCents: amountCents });
      }
    }
    if (filled.length === 0) return;

    // Notify once, for the highest milestone we just filled.
    const top = filled[filled.length - 1];
    const amount = formatPrice(top.rewardCents);

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
      rewardCents: top.rewardCents,
      promoCode: top.code,
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
