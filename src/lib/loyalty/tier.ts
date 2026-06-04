import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, OrderStatus } from "@/types/database";
import {
  STAR_EARNING_STATUSES,
  orderRefundedCents,
  orderSpendCents,
  tierForSpend,
  type LoyaltyTier,
} from ".";

export interface LoyaltyStats {
  /** Qualifying order count (Stars) — drives per-order milestone coupons. */
  orderCount: number;
  /** Lifetime net spend (cents), net of discounts AND refunds — drives tier. */
  spendCents: number;
}

interface OrderWithItems {
  subtotal_cents: number | null;
  discount_cents: number | null;
  order_items: {
    line_total_cents: number | null;
    quantity: number | null;
    refunded_quantity: number | null;
  }[];
}

/**
 * The customer's loyalty stats, computed server-side from their real qualifying
 * orders (paid/approved, excludes pending COD). Returns both the order count
 * (Stars / milestones) and lifetime net spend (subtotal − discount − refunds;
 * tier). Embeds order_items so refunded value is subtracted — a refunded order
 * can't keep its spend toward tier.
 */
export async function loyaltyStatsForUser(
  service: SupabaseClient<Database>,
  userId: string
): Promise<LoyaltyStats> {
  const { data } = await service
    .from("orders")
    .select(
      "subtotal_cents, discount_cents, order_items(line_total_cents, quantity, refunded_quantity)"
    )
    .eq("user_id", userId)
    .in("status", STAR_EARNING_STATUSES as unknown as OrderStatus[])
    .returns<OrderWithItems[]>();

  const rows = data ?? [];
  const spendCents = rows.reduce((sum, o) => {
    const refunded = orderRefundedCents(o.order_items ?? []);
    return sum + orderSpendCents(o.subtotal_cents ?? 0, o.discount_cents ?? 0, refunded);
  }, 0);
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
