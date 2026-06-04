import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import {
  STAR_EARNING_STATUSES,
  hasEarlyAccess,
  nextRewardCents,
  ordersToNextMilestone,
  tierForOrders,
} from "@/lib/loyalty";
import type { OrderStatus } from "@/types/database";

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
    const { count } = await service
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", STAR_EARNING_STATUSES as unknown as OrderStatus[]);

    const stars = count ?? 0;
    const tier = tierForOrders(stars);

    return NextResponse.json({
      data: {
        stars,
        ordersToNext: ordersToNextMilestone(stars),
        nextRewardCents: nextRewardCents(stars),
        tier: { id: tier.id, name: tier.name, english: tier.english, emoji: tier.emoji },
        earlyAccess: hasEarlyAccess(stars),
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
