import React from "react";
import { render } from "@react-email/render";
import type { SupabaseClient } from "@supabase/supabase-js";

import { LoyaltyReward } from "@/emails/LoyaltyReward";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { sendPushToUser } from "@/lib/push/send";
import { logger } from "@/lib/utils/logger";
import { formatPrice } from "@/lib/utils/currency";
import type { Database, OrderStatus } from "@/types/database";
import { STAR_EARNING_STATUSES, milestoneReached, rewardCentsForOrders, tierForOrders } from ".";
import { mintLoyaltyPromoCode } from "./mint";

/**
 * If this completed order lands the customer on a loyalty milestone (every Nth
 * order), issue a one-time tier-sized "Kyay-Zu-Par!" reward. Best-effort and
 * idempotent: the loyalty_rewards insert (UNIQUE user_id+milestone) is the lock,
 * so concurrent webhooks can't double-issue. Call only after an order is confirmed.
 */
export async function maybeIssueMilestoneReward(
  service: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  try {
    const { count } = await service
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", STAR_EARNING_STATUSES as unknown as OrderStatus[]);

    const milestone = milestoneReached(count ?? 0);
    if (milestone == null) return;

    const rewardCents = rewardCentsForOrders(milestone);
    const tier = tierForOrders(milestone);

    // Claim the milestone — the unique constraint means only the first wins.
    const { data: claimed } = await service
      .from("loyalty_rewards")
      .insert({ user_id: userId, kind: "milestone", milestone, reward_cents: rewardCents })
      .select("id");
    if (!claimed || claimed.length === 0) return;
    const rewardId = claimed[0].id;

    const { code: promoCode, expiresAt } = await mintLoyaltyPromoCode(rewardCents);
    await service
      .from("loyalty_rewards")
      .update({ reward_code: promoCode, expires_at: expiresAt })
      .eq("id", rewardId);

    const amount = formatPrice(rewardCents);

    // In-app/push celebration (best-effort; no-op without VAPID keys).
    await sendPushToUser(service, userId, {
      title: `Kyay-Zu-Par! 🙏 ${amount} reward unlocked`,
      body: `${milestone} orders in — here's ${amount} off your next feast. Tap to view.`,
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
      promoCode,
      menuUrl: `${appUrl}/menu?src=loyalty_milestone`,
      variant: "milestone",
      milestone,
      tierName: tier.name,
      tierEnglish: tier.english,
      tierEmoji: tier.emoji,
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
      subject: `${milestone} orders in — here's ${amount}, with love 🙏`,
      html,
      text,
    });
  } catch (error) {
    // Reward row may already be claimed; a failed mint/email is logged for
    // manual follow-up rather than retried (avoids duplicate coupons).
    logger.exception(error, { api: "loyalty/reward", userId });
  }
}
