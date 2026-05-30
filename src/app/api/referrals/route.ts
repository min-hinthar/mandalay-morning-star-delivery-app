import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";
import { generateReferralCode, referralShareUrl, REFERRAL_REWARD_CENTS } from "@/lib/referrals";

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
  { status: 401 }
);

/** Assign a unique referral code to the user if they don't have one yet. */
async function ensureReferralCode(
  service: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data } = await service
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  if (data?.referral_code) return data.referral_code;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateReferralCode();
    const { error } = await service
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId)
      .is("referral_code", null);
    if (!error) {
      const { data: after } = await service
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .maybeSingle();
      if (after?.referral_code) return after.referral_code;
    }
    // Unique collision — try a different code.
  }
  return null;
}

/** GET /api/referrals — the user's code, share link, and referral stats. */
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
      route: "referrals",
    });
    if (rl.limited) return rl.response;

    const service = createServiceClient();
    const code = await ensureReferralCode(service, user.id);
    if (!code) throw new Error("Could not assign a referral code");

    const { data: rows } = await service
      .from("referrals")
      .select("status, reward_cents")
      .eq("referrer_id", user.id);
    const referrals = rows ?? [];
    const completed = referrals.filter((r) => r.status === "completed");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";
    return NextResponse.json({
      data: {
        code,
        shareUrl: referralShareUrl(appUrl, code),
        rewardCents: REFERRAL_REWARD_CENTS,
        stats: {
          pending: referrals.length - completed.length,
          completed: completed.length,
          earnedCents: completed.reduce((sum, r) => sum + (r.reward_cents ?? 0), 0),
        },
      },
    });
  } catch (error) {
    logger.exception(error, { api: "referrals" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load referrals" } },
      { status: 500 }
    );
  }
}
