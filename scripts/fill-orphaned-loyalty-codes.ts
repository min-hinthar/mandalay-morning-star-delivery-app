/**
 * One-time back-fill: mint promo codes for loyalty milestone rewards that were
 * orphaned by a failed mint/email — `loyalty_rewards` rows with `kind='milestone'`
 * and `reward_code IS NULL`. The in-app self-heal (`maybeIssueMilestoneReward`) only
 * recovers an orphan lazily, on the customer's NEXT paid order; this sweeps every
 * orphan at once so customers who won't reorder soon still get their earned reward.
 *
 * Reuses the exact in-app fill logic (`src/lib/loyalty/fill-orphaned.ts`) so the two
 * paths can't drift — same `.is("reward_code", null)`-guarded write, same per-row
 * `reward_cents`. Runs SILENTLY: no push/email (the reward simply appears in the
 * customer's wallet), avoiding a retroactive notification flood.
 *
 * Usage:
 *   pnpm backfill:loyalty --dry-run   # list orphans per user, NO Stripe/DB writes
 *   pnpm backfill:loyalty             # mint + fill (writes to Stripe + Supabase)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + STRIPE_SECRET_KEY.
 * The Stripe key MUST match the environment whose orphans you're filling (live key
 * for prod) — the script prints the detected key mode so you can confirm before it
 * writes.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { fillOrphanedMilestoneCodes } from "../src/lib/loyalty/fill-orphaned";

// Some envs set NEXT_PUBLIC_SUPABASE_URL with a doubled protocol — scrub it.
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
  /^https?:\/\/https:\/\//,
  "https://"
);
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const DRY_RUN = process.argv.includes("--dry-run");

function client(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function stripeMode(): string {
  if (!STRIPE_SECRET_KEY) return "MISSING";
  if (STRIPE_SECRET_KEY.startsWith("sk_live_") || STRIPE_SECRET_KEY.startsWith("rk_live_"))
    return "LIVE";
  if (STRIPE_SECRET_KEY.startsWith("sk_test_") || STRIPE_SECRET_KEY.startsWith("rk_test_"))
    return "test";
  return "unknown";
}

async function main(): Promise<void> {
  const supabase = client();

  const { data: orphans, error } = await supabase
    .from("loyalty_rewards")
    .select("user_id, milestone, reward_cents")
    .eq("kind", "milestone")
    .is("reward_code", null);

  if (error) throw error;
  const rows = orphans ?? [];

  if (rows.length === 0) {
    console.log("✓ No orphaned milestone rewards found — nothing to back-fill.");
    return;
  }

  const byUser = new Map<string, number>();
  let centsAtRisk = 0;
  for (const r of rows) {
    byUser.set(r.user_id, (byUser.get(r.user_id) ?? 0) + 1);
    centsAtRisk += r.reward_cents ?? 0;
  }
  console.log(
    `Found ${rows.length} orphaned milestone row(s) across ${byUser.size} user(s) ` +
      `(~$${(centsAtRisk / 100).toFixed(2)} in stranded rewards). Stripe key: ${stripeMode()}.`
  );

  if (DRY_RUN) {
    for (const [userId, count] of byUser) {
      console.log(`  [dry-run] user ${userId}: ${count} orphan(s) would be filled`);
    }
    console.log("\nDry run — no Stripe/DB writes. Re-run without --dry-run to fill.");
    return;
  }

  if (stripeMode() === "MISSING") {
    throw new Error("STRIPE_SECRET_KEY is required to mint codes (omit --dry-run only with a key)");
  }

  let filledCount = 0;
  let failedUsers = 0;
  const userIds = [...byUser.keys()];
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    try {
      const filled = await fillOrphanedMilestoneCodes(supabase, userId);
      filledCount += filled.length;
      console.log(`  [${i + 1}/${userIds.length}] user ${userId}: filled ${filled.length}`);
    } catch (err) {
      failedUsers += 1;
      console.error(`  [${i + 1}/${userIds.length}] user ${userId}: FAILED —`, err);
    }
  }

  console.log(`\nDone. Filled ${filledCount} reward(s); ${failedUsers} user(s) errored.`);
  if (failedUsers > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
