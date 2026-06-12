import React from "react";
import { render } from "@react-email/render";
import type { SupabaseClient } from "@supabase/supabase-js";

import { LoyaltyReward } from "@/emails/LoyaltyReward";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { tierPerkFromTier } from "@/lib/email/nudges";
import type { Database } from "@/types/database";
import { LOYALTY_REWARD_CENTS } from ".";
import { mintLoyaltyPromoCode } from "./mint";
import { tierForUser } from "./tier";

interface ThankYouRecipient {
  userId: string;
  email: string;
  fullName: string | null;
}

/**
 * Mint a $5 Kyay-Zu-Par! code, record it, and email an existing customer the
 * one-time loyalty thank-you. Caller is responsible for dedupe (stamping
 * profiles.loyalty_thanked_at before calling). Throws on failure so the caller
 * can count it.
 */
export async function issueLoyaltyThankYou(
  service: SupabaseClient<Database>,
  recipient: ThankYouRecipient,
  appUrl: string
): Promise<void> {
  const { code: promoCode, expiresAt } = await mintLoyaltyPromoCode();

  await service.from("loyalty_rewards").insert({
    user_id: recipient.userId,
    kind: "thank_you",
    reward_cents: LOYALTY_REWARD_CENTS,
    reward_code: promoCode,
    expires_at: expiresAt,
  });

  const tier = await tierForUser(service, recipient.userId);
  const emailComponent = React.createElement(LoyaltyReward, {
    customerName: recipient.fullName?.split(" ")[0] || "friend",
    rewardCents: LOYALTY_REWARD_CENTS,
    promoCode,
    menuUrl: `${appUrl}/menu?src=loyalty_thankyou`,
    variant: "thankyou",
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
    to: recipient.email,
    cc: EMAIL_CC,
    replyTo: EMAIL_REPLY_TO,
    subject: "Kyay-Zu-Par! 🙏 A little thank-you from our kitchen ($5 off)",
    html,
    text,
  });
}
