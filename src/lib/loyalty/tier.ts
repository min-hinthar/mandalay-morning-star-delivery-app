import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, OrderStatus } from "@/types/database";
import { STAR_EARNING_STATUSES, tierForOrders, type LoyaltyTier } from ".";

/**
 * The customer's current loyalty tier, computed server-side from their real
 * star-earning order count. Use when sending email/push so the tier badge
 * reflects the moment of sending. Defaults to the base tier on any error.
 */
export async function tierForUser(
  service: SupabaseClient<Database>,
  userId: string
): Promise<LoyaltyTier> {
  const { count } = await service
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", STAR_EARNING_STATUSES as unknown as OrderStatus[]);
  return tierForOrders(count ?? 0);
}
