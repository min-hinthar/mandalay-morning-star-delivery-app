import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { normalizeReferralCode } from "@/lib/referrals";

const claimSchema = z.object({ code: z.string().min(3).max(32) });

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
  { status: 401 }
);

/**
 * POST /api/referrals/claim — attribute the current (new) user to a referrer.
 * Guards: valid code, not self, not already referred, and no prior orders
 * (referrals are for new customers only).
 */
export async function POST(request: NextRequest) {
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
      route: "referrals/claim",
    });
    if (rl.limited) return rl.response;

    const parsed = claimSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid code" } },
        { status: 400 }
      );
    }
    const code = normalizeReferralCode(parsed.data.code);
    if (!code) {
      return NextResponse.json({ data: { attributed: false, reason: "invalid_code" } });
    }

    const service = createServiceClient();

    const { data: referrer } = await service
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!referrer || referrer.id === user.id) {
      return NextResponse.json({ data: { attributed: false, reason: "invalid_code" } });
    }

    const { data: existing } = await service
      .from("referrals")
      .select("id")
      .eq("referee_id", user.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ data: { attributed: false, reason: "already_referred" } });
    }

    const { count } = await service
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) > 0) {
      return NextResponse.json({ data: { attributed: false, reason: "existing_customer" } });
    }

    const { error } = await service.from("referrals").insert({
      referrer_id: referrer.id,
      referee_id: user.id,
      status: "pending",
    });
    if (error) {
      // Unique (referee) race — treat as already referred.
      return NextResponse.json({ data: { attributed: false, reason: "already_referred" } });
    }

    return NextResponse.json({ data: { attributed: true } });
  } catch (error) {
    logger.exception(error, { api: "referrals/claim" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to record referral" } },
      { status: 500 }
    );
  }
}
