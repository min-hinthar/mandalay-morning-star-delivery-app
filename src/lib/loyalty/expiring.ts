import React from "react";
import { render } from "@react-email/render";
import type { SupabaseClient } from "@supabase/supabase-js";

import { LoyaltyReward } from "@/emails/LoyaltyReward";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { sendPushToUser } from "@/lib/push/send";
import { formatPrice } from "@/lib/utils/currency";
import type { Database } from "@/types/database";
import { daysUntilExpiry } from ".";
import { expiringDayLabel } from "./copy";

interface ExpiringReward {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  rewardCode: string;
  rewardCents: number;
  expiresAt: string;
}

/**
 * Push + email a "your reward expires soon" nudge, then stamp reminded_at so it
 * fires once per reward. Caller stamps reminded_at up-front for crash-safety;
 * this throws on send failure so the caller can count it.
 */
export async function issueExpiringReminder(
  service: SupabaseClient<Database>,
  reward: ExpiringReward,
  appUrl: string
): Promise<void> {
  const amount = formatPrice(reward.rewardCents);
  const daysLeft = daysUntilExpiry(reward.expiresAt) ?? 0;
  const dayLabel = expiringDayLabel(daysLeft);

  await sendPushToUser(service, reward.userId, {
    title: `Your ${amount} reward expires ${dayLabel} ⏳`,
    body: `Don't miss your Kyay-Zu-Par! ${amount} off — tap to use it before it's gone.`,
    url: `/checkout?promo=${encodeURIComponent(reward.rewardCode)}`,
    tag: "loyalty-expiring",
  });

  const emailComponent = React.createElement(LoyaltyReward, {
    customerName: reward.fullName?.split(" ")[0] || "friend",
    rewardCents: reward.rewardCents,
    promoCode: reward.rewardCode,
    menuUrl: `${appUrl}/menu?src=loyalty_expiring`,
    variant: "expiring",
    daysLeft,
  });
  const [html, text] = await Promise.all([
    render(emailComponent),
    render(emailComponent, { plainText: true }),
  ]);

  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: reward.email,
    cc: EMAIL_CC,
    replyTo: EMAIL_REPLY_TO,
    subject: `⏳ Your ${amount} Kyay-Zu-Par! reward expires ${dayLabel}`,
    html,
    text,
  });
}
