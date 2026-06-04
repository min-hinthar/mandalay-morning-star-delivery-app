import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, OrderStatus } from "@/types/database";
import { STAR_EARNING_STATUSES, orderSpendCents, tierForSpend, type LoyaltyTier } from ".";

export interface LoyaltyStats {
  /** Qualifying order count (Stars) — drives per-order milestone coupons. */
  orderCount: number;
  /** Lifetime net spend (cents) — drives tier. */
  spendCents: number;
}

/**
 * The customer's loyalty stats, computed server-side from their real qualifying
 * orders (paid/approved, excludes pending COD). Returns both the order count
 * (Stars / milestones) and lifetime net spend (subtotal − discount; tier).
 * One query, summed in app code so the spend basis stays explicit.
 */
export async function loyaltyStatsForUser(
  service: SupabaseClient<Database>,
  userId: string
): Promise<LoyaltyStats> {
  const { data } = await service
    .from("orders")
    .select("subtotal_cents, discount_cents")
    .eq("user_id", userId)
    .in("status", STAR_EARNING_STATUSES as unknown as OrderStatus[]);

  const rows = data ?? [];
  const spendCents = rows.reduce(
    (sum, o) => sum + orderSpendCents(o.subtotal_cents ?? 0, o.discount_cents ?? 0),
    0
  );
  return { orderCount: rows.length, spendCents };
}

/** Convenience: the customer's current tier from their lifetime net spend. */
export async function tierForUser(
  service: SupabaseClient<Database>,
  userId: string
): Promise<LoyaltyTier> {
  const { spendCents } = await loyaltyStatsForUser(service, userId);
  return tierForSpend(spendCents);
}
