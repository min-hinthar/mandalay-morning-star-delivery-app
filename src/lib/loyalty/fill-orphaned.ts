import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { mintLoyaltyPromoCode } from "./mint";

export interface FilledMilestone {
  milestone: number;
  code: string;
  rewardCents: number;
}

/**
 * Mint + write a promo code for every claimed milestone row for `userId` that still
 * lacks one (`kind='milestone'`, `reward_code IS NULL`) — both rows just claimed and
 * any orphaned by a prior failed mint/email. Each row mints at its OWN stored
 * `reward_cents`. The fill `UPDATE` is guarded `.is("reward_code", null)` so a
 * concurrent runner can't double-fill (its minted code is simply wasted — one-time +
 * TTL-expiring, never saved to the wallet, so harmless).
 *
 * Returns the rows actually filled by THIS call, ascending by milestone (so the
 * caller can notify on the highest). PURE fill — no push/email — so it is safe to
 * reuse from a one-off batch back-fill that must not flood customers with retroactive
 * notifications. The in-app `maybeIssueMilestoneReward` wraps this and notifies.
 */
export async function fillOrphanedMilestoneCodes(
  service: SupabaseClient<Database>,
  userId: string
): Promise<FilledMilestone[]> {
  const { data: needsCode, error } = await service
    .from("loyalty_rewards")
    .select("id, milestone, reward_cents")
    .eq("user_id", userId)
    .eq("kind", "milestone")
    .is("reward_code", null)
    .order("milestone", { ascending: true });

  // Surface a read failure rather than swallowing it into `[]`. On the request path
  // the caller's try/catch logs it (best-effort, retried next order); in the batch
  // back-fill a returned `[]` would otherwise read as "this user had no orphans" and
  // silently under-fill — the script's per-user catch records it as a failed user
  // (→ process.exitCode = 1) so a transient blip can't masquerade as "filled 0".
  if (error) throw error;
  if (!needsCode || needsCode.length === 0) return [];

  const filled: FilledMilestone[] = [];
  for (const row of needsCode) {
    if (row.milestone == null) continue; // milestone rows always have one — defensive
    const amountCents = row.reward_cents; // its own earned amount (NOT NULL; app writes ≥ 500)
    const { code, expiresAt } = await mintLoyaltyPromoCode(amountCents);
    const { data: written } = await service
      .from("loyalty_rewards")
      .update({ reward_code: code, expires_at: expiresAt })
      .eq("id", row.id)
      .is("reward_code", null)
      .select("id");
    if (written && written.length > 0) {
      filled.push({ milestone: row.milestone, code, rewardCents: amountCents });
    }
  }
  return filled;
}
