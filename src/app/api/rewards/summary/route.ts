import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import {
  hasEarlyAccess,
  nextRewardCents,
  ordersToNextMilestone,
  tierForSpend,
} from "@/lib/loyalty";
import { loyaltyStatsForUser } from "@/lib/loyalty/tier";

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
  { status: 401 }
);

/**
 * GET /api/rewards/summary — lightweight Stars + tier for the header pill.
 * Just a count + pure helpers, so it's cheap to call on navigation.
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
      route: "rewards/summary",
    });
    if (rl.limited) return rl.response;

    const service = createServiceClient();
    const { orderCount, spendCents } = await loyaltyStatsForUser(service, user.id);
    const tier = tierForSpend(spendCents);

    return NextResponse.json({
      data: {
        stars: orderCount,
        ordersToNext: ordersToNextMilestone(orderCount),
        nextRewardCents: nextRewardCents(spendCents),
        tier: { id: tier.id, name: tier.name, english: tier.english, emoji: tier.emoji },
        earlyAccess: hasEarlyAccess(spendCents),
      },
    });
  } catch (error) {
    logger.exception(error, { api: "rewards/summary" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load summary" } },
      { status: 500 }
    );
  }
}
