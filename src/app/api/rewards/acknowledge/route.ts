import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
  { status: 401 }
);

/**
 * POST /api/rewards/acknowledge — mark the customer's rewards as seen, so the
 * in-app celebration (confetti + banner) fires once. Writes go through the
 * service role since loyalty_rewards is read-only under RLS.
 */
export async function POST() {
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
      route: "rewards/acknowledge",
    });
    if (rl.limited) return rl.response;

    const service = createServiceClient();
    await service
      .from("loyalty_rewards")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("acknowledged_at", null);

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    logger.exception(error, { api: "rewards/acknowledge" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to acknowledge rewards" } },
      { status: 500 }
    );
  }
}
