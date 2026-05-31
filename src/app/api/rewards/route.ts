import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { referralShareUrl, REFERRAL_REWARD_CENTS } from "@/lib/referrals";
import { ensureReferralCode } from "@/lib/referrals/code";
import {
  LOYALTY_MILESTONE_STEP,
  STAR_EARNING_STATUSES,
  nextMilestone,
  nextRewardCents,
  nextTier,
  ordersToNextMilestone,
  ordersToNextTier,
  progressInCycle,
  tierForOrders,
} from "@/lib/loyalty";
import type { OrderStatus } from "@/types/database";

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
  { status: 401 }
);

interface WalletItem {
  id: string;
  code: string;
  kind: "loyalty" | "referral";
  amountCents: number;
  label: string;
  createdAt: string;
}

/**
 * GET /api/rewards — everything the Morning Star Rewards hub needs: Stars +
 * milestone progress, the coupon wallet (loyalty + referral codes), and the
 * customer's referral code/stats.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return UNAUTHORIZED;

    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: user.id,
      role: "customer",
      route: "rewards",
    });
    if (rl.limited) return rl.response;

    const service = createServiceClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";

    const [orderCountRes, code, loyaltyRes, referralRes] = await Promise.all([
      service
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", STAR_EARNING_STATUSES as unknown as OrderStatus[]),
      ensureReferralCode(service, user.id),
      service
        .from("loyalty_rewards")
        .select("id, reward_code, reward_cents, kind, milestone, created_at, acknowledged_at")
        .eq("user_id", user.id)
        .not("reward_code", "is", null)
        .order("created_at", { ascending: false }),
      service
        .from("referrals")
        .select("id, status, reward_cents, reward_code, completed_at, created_at")
        .eq("referrer_id", user.id),
    ]);

    if (!code) throw new Error("Could not assign a referral code");

    const stars = orderCountRes.count ?? 0;
    const referrals = referralRes.data ?? [];
    const completed = referrals.filter((r) => r.status === "completed");
    const loyaltyRows = loyaltyRes.data ?? [];

    const tier = tierForOrders(stars);
    const upcomingTier = nextTier(stars);

    // Most recent reward the customer hasn't seen celebrated in-app yet.
    const fresh = loyaltyRows.find((r) => r.reward_code && !r.acknowledged_at);
    const justUnlocked = fresh
      ? {
          code: fresh.reward_code as string,
          amountCents: fresh.reward_cents,
          kind: fresh.kind,
        }
      : null;

    const loyaltyLabel = (kind: string, milestone: number | null): string => {
      if (kind === "anniversary") return "Anniversary thank-you";
      if (kind === "milestone") return `${milestone}-order thank-you`;
      return "Loyalty thank-you";
    };

    // Build the coupon wallet from loyalty rewards + earned referral rewards.
    const wallet: WalletItem[] = [];
    for (const r of loyaltyRows) {
      if (!r.reward_code) continue;
      wallet.push({
        id: r.id,
        code: r.reward_code,
        kind: "loyalty",
        amountCents: r.reward_cents,
        label: loyaltyLabel(r.kind, r.milestone),
        createdAt: r.created_at,
      });
    }
    for (const r of completed) {
      if (!r.reward_code) continue;
      wallet.push({
        id: r.id,
        code: r.reward_code,
        kind: "referral",
        amountCents: r.reward_cents,
        label: "Referral reward",
        createdAt: r.completed_at ?? r.created_at,
      });
    }
    wallet.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return NextResponse.json({
      data: {
        stars,
        milestoneStep: LOYALTY_MILESTONE_STEP,
        nextMilestone: nextMilestone(stars),
        ordersToNext: ordersToNextMilestone(stars),
        progressInCycle: progressInCycle(stars),
        nextRewardCents: nextRewardCents(stars),
        tier: { id: tier.id, name: tier.name, english: tier.english, emoji: tier.emoji },
        nextTier: upcomingTier
          ? {
              id: upcomingTier.id,
              name: upcomingTier.name,
              english: upcomingTier.english,
              emoji: upcomingTier.emoji,
              minOrders: upcomingTier.minOrders,
            }
          : null,
        ordersToNextTier: ordersToNextTier(stars),
        justUnlocked,
        wallet,
        referral: {
          code,
          shareUrl: referralShareUrl(appUrl, code),
          rewardCents: REFERRAL_REWARD_CENTS,
          stats: {
            pending: referrals.length - completed.length,
            completed: completed.length,
            earnedCents: completed.reduce((sum, r) => sum + (r.reward_cents ?? 0), 0),
          },
        },
      },
    });
  } catch (error) {
    logger.exception(error, { api: "rewards" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load rewards" } },
      { status: 500 }
    );
  }
}
