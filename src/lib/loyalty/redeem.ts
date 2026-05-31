import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";

/**
 * Mark a loyalty reward redeemed when its code is used on a confirmed order.
 * Best-effort and idempotent (only stamps rows not already redeemed). Loyalty
 * codes are the `KYAYZU-` prefix; anything else is ignored cheaply.
 */
export async function markLoyaltyRedeemed(
  service: SupabaseClient<Database>,
  promoCode: string | null | undefined
): Promise<void> {
  if (!promoCode || !promoCode.toUpperCase().startsWith("KYAYZU-")) return;
  try {
    await service
      .from("loyalty_rewards")
      .update({ redeemed_at: new Date().toISOString() })
      .eq("reward_code", promoCode)
      .is("redeemed_at", null);
  } catch (error) {
    logger.exception(error, { api: "loyalty/redeem" });
  }
}
