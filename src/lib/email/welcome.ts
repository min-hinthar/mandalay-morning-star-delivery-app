import React from "react";
import { render } from "@react-email/render";
import type { SupabaseClient } from "@supabase/supabase-js";

import { WelcomeOffer } from "@/emails/WelcomeOffer";
import { WELCOME_DISCOUNT_CENTS } from "@/lib/referrals";
import { logger } from "@/lib/utils/logger";
import type { Database, OrderStatus } from "@/types/database";
import { getResendClient } from "./client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "./constants";

const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "pending_approval",
];

/**
 * Send the one-time "welcome, here's $5" email to a brand-new customer.
 * Idempotent + best-effort: claims profiles.welcomed_at atomically (so it can't
 * double-send), skips customers who already ordered, and never throws.
 */
export async function maybeSendWelcomeEmail(
  service: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  try {
    const { data: profile } = await service
      .from("profiles")
      .select("email, full_name, welcomed_at")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.email || profile.welcomed_at) return;

    // Claim the welcome slot — only the first caller proceeds.
    const { data: claimed } = await service
      .from("profiles")
      .update({ welcomed_at: new Date().toISOString() })
      .eq("id", userId)
      .is("welcomed_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) return;

    // Already a customer? Stamp (above) but don't send a "welcome".
    const { count } = await service
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", COMPLETED_ORDER_STATUSES);
    if ((count ?? 0) > 0) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";
    const emailComponent = React.createElement(WelcomeOffer, {
      customerName: profile.full_name?.split(" ")[0] || "friend",
      discountCents: WELCOME_DISCOUNT_CENTS,
      menuUrl: `${appUrl}/menu?src=welcome_email`,
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
      subject: "Welcome to Mandalay Morning Star — here's $5 off 🎁",
      html,
      text,
    });
  } catch (error) {
    logger.exception(error, { api: "email/welcome", userId });
  }
}
