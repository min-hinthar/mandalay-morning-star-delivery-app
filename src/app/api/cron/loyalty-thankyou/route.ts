/**
 * Loyalty Thank-You Cron
 *
 * One-time "Kyay-Zu-Par!" $5 thank-you to existing customers (>=1 non-cancelled
 * order, marketing opted-in, not yet thanked). Self-draining: eligibility +
 * dedupe live in get_loyalty_thankyou_candidates + profiles.loyalty_thanked_at,
 * so re-runs naturally stop once everyone's been thanked. Most loyal first.
 */

import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/supabase/actions";
import { createServiceClient } from "@/lib/supabase/server";
import { issueLoyaltyThankYou } from "@/lib/loyalty/thankyou";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";

const CRON_SECRET = process.env.CRON_SECRET;
const FLOW_ID = "loyalty-thankyou";
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
    route: "cron/loyalty-thankyou",
  });
  if (rl.limited) return rl.response;

  const supabase = createServiceClient();

  const { data: customers, error } = await supabase.rpc("get_loyalty_thankyou_candidates", {
    p_limit: MAX_PER_RUN,
  });

  if (error) {
    logger.exception(error, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Failed to query loyalty candidates", 500);
  }

  if (!customers || customers.length === 0) {
    return NextResponse.json({ sent: 0, candidates: 0 });
  }

  const appUrl = await getAppUrl();

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];

    // Stamp up-front so a mid-run failure can't re-target this customer.
    await supabase
      .from("profiles")
      .update({ loyalty_thanked_at: new Date().toISOString() })
      .eq("id", customer.user_id);

    if (!customer.email) continue;

    try {
      await issueLoyaltyThankYou(
        supabase,
        {
          userId: customer.user_id,
          email: customer.email,
          fullName: customer.full_name,
        },
        appUrl
      );
      sent++;
    } catch (sendError) {
      failed++;
      logger.exception(sendError, { flowId: FLOW_ID, api: "cron", userId: customer.user_id });
    }

    if (i < customers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, STAGGER_DELAY_MS));
    }
  }

  logger.info("Loyalty thank-you cron completed", {
    flowId: FLOW_ID,
    api: "cron",
    candidates: customers.length,
    sent,
    failed,
  } as Record<string, unknown>);

  return NextResponse.json({ candidates: customers.length, sent, failed });
}
