import React from "react";
import { render } from "@react-email/render";
import type { SupabaseClient } from "@supabase/supabase-js";

import { LoyaltyReward } from "@/emails/LoyaltyReward";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { logger } from "@/lib/utils/logger";
import type { Database, OrderStatus } from "@/types/database";
import { LOYALTY_REWARD_CENTS, STAR_EARNING_STATUSES, milestoneReached } from ".";
import { mintLoyaltyPromoCode } from "./mint";

/**
 * If this completed order lands the customer on a loyalty milestone (every Nth
 * order), issue a one-time $5 "Kyay-Zu-Par!" reward. Best-effort and idempotent:
 * the loyalty_rewards insert (UNIQUE user_id+milestone) is the lock, so concurrent
 * webhooks can't double-issue. Call only after an order is confirmed.
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

    // Claim the milestone — the unique constraint means only the first wins.
    const { data: claimed } = await service
      .from("loyalty_rewards")
      .insert({ user_id: userId, kind: "milestone", milestone, reward_cents: LOYALTY_REWARD_CENTS })
      .select("id");
    if (!claimed || claimed.length === 0) return;
    const rewardId = claimed[0].id;

    const promoCode = await mintLoyaltyPromoCode();
    await service.from("loyalty_rewards").update({ reward_code: promoCode }).eq("id", rewardId);

    const { data: profile } = await service
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.email) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";
    const emailComponent = React.createElement(LoyaltyReward, {
      customerName: profile.full_name?.split(" ")[0] || "friend",
      rewardCents: LOYALTY_REWARD_CENTS,
      promoCode,
      menuUrl: `${appUrl}/menu?src=loyalty_milestone`,
      variant: "milestone",
      milestone,
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
      subject: `${milestone} orders in — here's $5, with love 🙏`,
      html,
      text,
    });
  } catch (error) {
    // Reward row may already be claimed; a failed mint/email is logged for
    // manual follow-up rather than retried (avoids duplicate coupons).
    logger.exception(error, { api: "loyalty/reward", userId });
  }
}
