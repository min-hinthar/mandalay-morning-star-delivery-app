import React from "react";
import { render } from "@react-email/render";
import type { SupabaseClient } from "@supabase/supabase-js";

import { LoyaltyReward } from "@/emails/LoyaltyReward";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { sendPushToUser } from "@/lib/push/send";
import { formatPrice } from "@/lib/utils/currency";
import type { Database } from "@/types/database";
import { LOYALTY_ANNIVERSARY_CENTS } from ".";
import { mintLoyaltyPromoCode } from "./mint";

interface AnniversaryRecipient {
  userId: string;
  email: string;
  fullName: string | null;
  years: number;
}

/**
 * Mint a $10 anniversary Kyay-Zu-Par! code, record it, push + email the
 * customer to mark another year with the kitchen. Caller dedupes (stamps
 * profiles.last_anniversary_at before calling). Throws on failure so the caller
 * can count it.
 */
export async function issueLoyaltyAnniversary(
  service: SupabaseClient<Database>,
  recipient: AnniversaryRecipient,
  appUrl: string
): Promise<void> {
  const { code: promoCode, expiresAt } = await mintLoyaltyPromoCode(LOYALTY_ANNIVERSARY_CENTS);

  await service.from("loyalty_rewards").insert({
    user_id: recipient.userId,
    kind: "anniversary",
    reward_cents: LOYALTY_ANNIVERSARY_CENTS,
    reward_code: promoCode,
    expires_at: expiresAt,
  });

  const amount = formatPrice(LOYALTY_ANNIVERSARY_CENTS);

  await sendPushToUser(service, recipient.userId, {
    title: `Happy ${recipient.years}-year anniversary! 🎉`,
    body: `Thank you for ${recipient.years} year(s) with us — here's ${amount} off, with love.`,
    url: "/account?tab=rewards",
    tag: "loyalty-anniversary",
  });

  const emailComponent = React.createElement(LoyaltyReward, {
    customerName: recipient.fullName?.split(" ")[0] || "friend",
    rewardCents: LOYALTY_ANNIVERSARY_CENTS,
    promoCode,
    menuUrl: `${appUrl}/menu?src=loyalty_anniversary`,
    variant: "anniversary",
    years: recipient.years,
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
    subject: `Happy anniversary! 🎉 ${recipient.years} year(s) of Burmese feasts`,
    html,
    text,
  });
}
