/**
 * Source guards for the D6 DB belt: the partial unique index that closes the
 * concurrent-tab first-order discount race, and the 23505 handling that
 * turns the losing tab's failure into a friendly 409.
 *
 * These are source guards (the SW/refund-math pattern) because the index
 * lives in SQL this container cannot execute, and the route's RPC path has
 * no unit harness — CI's db-drift job applies the migration for real.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const MIGRATION_NAME = "20260806000000_unique_open_auto_discount_pending.sql";

describe("D6 DB belt migration", () => {
  const sql = readFileSync(join(MIGRATIONS_DIR, MIGRATION_NAME), "utf8");

  it("is a real, correctly-named migration the CLI will apply", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    expect(files).toContain(MIGRATION_NAME);
    // must sort after the last prior migration or the CLI applies out of order
    expect(MIGRATION_NAME > "20260805200000_discount_proportional_refunds.sql").toBe(true);
    expect(/^\d{14}_[a-z0-9_]+\.sql$/.test(MIGRATION_NAME)).toBe(true);
  });

  it("creates the unique index with the NARROWED predicate (promo_code IS NULL is load-bearing)", () => {
    // A blanket discount_cents>0 predicate would 23505 legitimate
    // abandon-and-retry with amount_off / non-first-time promo codes for up
    // to the 30-minute Stripe session lifetime. promo_code IS NULL scopes
    // the belt to exactly the auto-granted first-order rows.
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_open_auto_discount/);
    expect(sql).toMatch(
      /ON public\.orders \(user_id\)\s*\n?\s*WHERE status = 'pending' AND discount_cents > 0 AND promo_code IS NULL/
    );
  });

  it("pre-cleans existing race artifacts with the SAME predicate, keeping the newest", () => {
    expect(sql).toMatch(/SET status = 'cancelled'/);
    // Tuple tie-break (created_at, id): parallel inserts can share a
    // transaction-start timestamp; a bare created_at comparison keeps both
    // rows on a tie and the CREATE UNIQUE INDEX rolls the migration back.
    expect(sql).toMatch(/\(newer\.created_at, newer\.id\) > \(o\.created_at, o\.id\)/);
    // the pre-clean must be scoped exactly like the index or it could cancel
    // legitimate promo-coded pendings
    const preClean = sql.slice(sql.indexOf("UPDATE public.orders"), sql.indexOf("CREATE UNIQUE"));
    expect(preClean).toContain("o.promo_code IS NULL");
    expect(preClean).toContain("newer.promo_code IS NULL");
  });
});

describe("23505 surfaces as a friendly 409, not a generic 500", () => {
  it("checkout maps the losing tab's unique violation before the generic handler", () => {
    // The mapping lives in validation.ts (orderCreateErrorResponse); the
    // route must actually delegate its RPC-failure path to it.
    const route = readFileSync(
      join(process.cwd(), "src", "app", "api", "checkout", "session", "route.ts"),
      "utf8"
    );
    expect(route).toContain("orderCreateErrorResponse(rpcError");

    const validation = readFileSync(
      join(process.cwd(), "src", "app", "api", "checkout", "session", "validation.ts"),
      "utf8"
    );
    const idx23505 = validation.indexOf('rpcError?.code === "23505"');
    const idxGenericLog = validation.indexOf("logger.exception(rpcError", idx23505);
    expect(idx23505).toBeGreaterThan(-1);
    expect(idxGenericLog).toBeGreaterThan(idx23505);
    // expected contention must not page Sentry: the 23505 branch (everything
    // before the generic handler's logger.exception) warns and 409s
    const block = validation.slice(idx23505, idxGenericLog);
    expect(block).toContain("logger.warn");
    expect(block).not.toContain("logger.exception");
    expect(block).toContain("409");
  });

  it("admin status route maps reactivation-blocked to 409 with clear copy", () => {
    const route = readFileSync(
      join(process.cwd(), "src", "app", "api", "admin", "orders", "[id]", "status", "route.ts"),
      "utf8"
    );
    const idx = route.indexOf('updateError.code === "23505"');
    expect(idx).toBeGreaterThan(-1);
    const block = route.slice(idx, idx + 400);
    expect(block).toContain("409");
    expect(block).toContain("open discounted checkout");
  });

  it("the resolver's race docs reference the live index (doc lockstep)", () => {
    const resolver = readFileSync(
      join(process.cwd(), "src", "lib", "referrals", "first-order-discount.ts"),
      "utf8"
    );
    expect(resolver).toContain("idx_orders_unique_open_auto_discount");
    expect(resolver).not.toContain("deferred at current scale");
  });
});
