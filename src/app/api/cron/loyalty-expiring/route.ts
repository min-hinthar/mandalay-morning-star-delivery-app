/**
 * Loyalty Expiring-Reward Cron
 *
 * Nudges customers whose Kyay-Zu-Par! reward expires within the window (default
 * 7 days) and hasn't been redeemed or reminded. Eligibility + dedupe live in
 * get_expiring_loyalty_rewards + loyalty_rewards.reminded_at; this route pushes,
 * emails, and stamps. Runs daily.
 */

import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/supabase/actions";
import { createServiceClient } from "@/lib/supabase/server";
import { issueExpiringReminder } from "@/lib/loyalty/expiring";
import { LOYALTY_EXPIRING_SOON_DAYS } from "@/lib/loyalty";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";

const CRON_SECRET = process.env.CRON_SECRET;
const FLOW_ID = "loyalty-expiring";
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
    route: "cron/loyalty-expiring",
  });
  if (rl.limited) return rl.response;

  const supabase = createServiceClient();

  const { data: rewards, error } = await supabase.rpc("get_expiring_loyalty_rewards", {
    p_days: LOYALTY_EXPIRING_SOON_DAYS,
    p_limit: MAX_PER_RUN,
  });

  if (error) {
    logger.exception(error, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Failed to query expiring rewards", 500);
  }

  if (!rewards || rewards.length === 0) {
    return NextResponse.json({ sent: 0, candidates: 0 });
  }

  const appUrl = await getAppUrl();

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < rewards.length; i++) {
    const reward = rewards[i];

    // Stamp up-front so a mid-run failure can't re-nudge this reward.
    await supabase
      .from("loyalty_rewards")
      .update({ reminded_at: new Date().toISOString() })
      .eq("id", reward.id);

    if (!reward.email || !reward.reward_code) continue;

    try {
      await issueExpiringReminder(
        supabase,
        {
          id: reward.id,
          userId: reward.user_id,
          email: reward.email,
          fullName: reward.full_name,
          rewardCode: reward.reward_code,
          rewardCents: reward.reward_cents,
          expiresAt: reward.expires_at,
        },
        appUrl
      );
      sent++;
    } catch (sendError) {
      failed++;
      logger.exception(sendError, { flowId: FLOW_ID, api: "cron", userId: reward.user_id });
    }

    if (i < rewards.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, STAGGER_DELAY_MS));
    }
  }

  logger.info("Loyalty expiring cron completed", {
    flowId: FLOW_ID,
    api: "cron",
    candidates: rewards.length,
    sent,
    failed,
  } as Record<string, unknown>);

  return NextResponse.json({ candidates: rewards.length, sent, failed });
}
