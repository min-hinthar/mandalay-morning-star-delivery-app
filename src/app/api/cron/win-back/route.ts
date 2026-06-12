/**
 * Win-back Cron
 *
 * Re-engages lapsed customers (last non-cancelled order 30-90 days ago, marketing
 * opted-in, not win-backed in 60 days) with one branded "we miss you" email.
 * Eligibility + dedupe windowing live in the get_lapsed_customers SQL function;
 * this route just sends and stamps profiles.last_winback_at.
 */

import React from "react";
import { NextResponse } from "next/server";

import { WinBack } from "@/emails/WinBack";
import { getNextDeliveryCutoffText, getTierPerkNudge } from "@/lib/email/nudges";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { getAppUrl } from "@/lib/supabase/actions";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { render } from "@react-email/render";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";

const CRON_SECRET = process.env.CRON_SECRET;
const FLOW_ID = "win-back";
const STAGGER_DELAY_MS = 100;
const MAX_PER_RUN = 100;

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) {
    logger.error("CRON_SECRET is not configured — rejecting cron request", {
      flowId: FLOW_ID,
      api: "cron",
    });
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const rl = await checkRateLimit({
    limiter: webhookLimiter,
    identifier: getClientIp(request),
    role: "anon",
    route: "cron/win-back",
  });
  if (rl.limited) return rl.response;

  const supabase = createServiceClient();

  const { data: customers, error } = await supabase.rpc("get_lapsed_customers", {
    p_limit: MAX_PER_RUN,
  });

  if (error) {
    logger.exception(error, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Failed to query lapsed customers", 500);
  }

  if (!customers || customers.length === 0) {
    return NextResponse.json({ sent: 0, candidates: 0 });
  }

  const appUrl = await getAppUrl();
  const menuUrl = `${appUrl}/menu`;
  const resend = getResendClient();

  // Same for every recipient in this run; per-customer tier is fetched in-loop.
  const nextDeliveryCutoffText = await getNextDeliveryCutoffText();

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];

    // Stamp up-front so a mid-run failure can't re-target this customer.
    await supabase
      .from("profiles")
      .update({ last_winback_at: new Date().toISOString() })
      .eq("id", customer.user_id);

    if (!customer.email) continue;

    try {
      const tier = await getTierPerkNudge(supabase, customer.user_id);
      const emailComponent = React.createElement(WinBack, {
        customerName: customer.full_name?.split(" ")[0] || "friend",
        menuUrl,
        tier,
        nextDeliveryCutoffText,
      });
      const [html, text] = await Promise.all([
        render(emailComponent),
        render(emailComponent, { plainText: true }),
      ]);

      await resend.emails.send({
        from: EMAIL_FROM,
        to: customer.email,
        cc: EMAIL_CC,
        replyTo: EMAIL_REPLY_TO,
        subject: "We've missed you at Mandalay Morning Star 🍜",
        html,
        text,
      });
      sent++;
    } catch (sendError) {
      failed++;
      logger.exception(sendError, { flowId: FLOW_ID, api: "cron", userId: customer.user_id });
    }

    if (i < customers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, STAGGER_DELAY_MS));
    }
  }

  logger.info("Win-back cron completed", {
    flowId: FLOW_ID,
    api: "cron",
    candidates: customers.length,
    sent,
    failed,
  } as Record<string, unknown>);

  return NextResponse.json({ candidates: customers.length, sent, failed });
}
