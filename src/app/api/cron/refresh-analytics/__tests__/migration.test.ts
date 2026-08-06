/**
 * Source guards for the service_role refresh migration + its cron wiring.
 *
 * The migration is a function-body-only CREATE OR REPLACE: the signature must
 * stay byte-identical to the baseline (that is what makes it db-drift-neutral),
 * and the ONLY semantic change is the body gate admitting service_role. These
 * guards pin both halves so a later edit can't silently break the cron
 * (gate reverted → every scheduled run 500s) or drift the generated types
 * (signature change → blocking db-drift job fails).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const MIGRATION_NAME = "20260806001000_allow_service_role_refresh_analytics.sql";
const migrationSql = readFileSync(join(MIGRATIONS_DIR, MIGRATION_NAME), "utf8");
const routeSource = readFileSync(
  join(process.cwd(), "src", "app", "api", "cron", "refresh-analytics", "route.ts"),
  "utf8"
);
const vercelJson = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
  crons: Array<{ path: string; schedule: string }>;
};

describe("service_role refresh migration", () => {
  it("uses a CLI-recognized timestamped filename", () => {
    // Non-matching names are silently SKIPPED by the Supabase CLI.
    expect(MIGRATION_NAME).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/);
  });

  it("is the LAST migration to define refresh_analytics_views", () => {
    // CREATE OR REPLACE is last-writer-wins: if a later migration redefines the
    // function without the service_role gate, the cron silently breaks.
    const defining = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .filter((f) =>
        readFileSync(join(MIGRATIONS_DIR, f), "utf8").includes("refresh_analytics_views")
      )
      .sort();
    expect(defining).toContain(MIGRATION_NAME);
    expect(defining[defining.length - 1]).toBe(MIGRATION_NAME);
  });

  it("widens the body gate to admit service_role alongside admins", () => {
    // auth.role() is NULL-safe via COALESCE (NULL for direct DB connections),
    // and is_admin() must remain — the admin dashboards still call this RPC.
    expect(migrationSql).toContain(
      "IF NOT (public.is_admin() OR COALESCE(auth.role(), '') = 'service_role') THEN"
    );
  });

  it("keeps the signature byte-identical to the baseline (db-drift-neutral)", () => {
    const signature = [
      "CREATE OR REPLACE FUNCTION public.refresh_analytics_views()",
      " RETURNS void",
      " LANGUAGE plpgsql",
      " SECURITY DEFINER",
      " SET search_path TO 'public'",
    ].join("\n");
    expect(migrationSql).toContain(signature);
    const baseline = readFileSync(join(MIGRATIONS_DIR, "00000000000000_baseline.sql"), "utf8");
    expect(baseline).toContain(signature);
  });

  it("still refreshes both analytics MVs CONCURRENTLY", () => {
    expect(migrationSql).toContain("REFRESH MATERIALIZED VIEW CONCURRENTLY driver_stats_mv;");
    expect(migrationSql).toContain("REFRESH MATERIALIZED VIEW CONCURRENTLY delivery_metrics_mv;");
  });

  it("touches ONLY the function (no other DDL rides along)", () => {
    const creates = migrationSql.match(/^\s*(CREATE|ALTER|DROP|GRANT|REVOKE)\b/gim) ?? [];
    expect(creates).toHaveLength(1);
    expect(creates[0]?.trim()).toBe("CREATE");
  });
});

describe("refresh-analytics cron wiring", () => {
  it("route calls the RPC (not a direct MV read) via the service client", () => {
    expect(routeSource).toContain('.rpc("refresh_analytics_views")');
    expect(routeSource).toContain("createServiceClient()");
    expect(routeSource).not.toMatch(/\.from\(["'](driver_stats_mv|delivery_metrics_mv)/);
  });

  it("route fails CLOSED when CRON_SECRET is unset", () => {
    const idx = routeSource.indexOf("if (!CRON_SECRET)");
    expect(idx).toBeGreaterThan(-1);
    // Everything between the missing-secret guard and the bearer comparison
    // must bail out — a fall-through here would authorize with no secret set.
    const guardBody = routeSource.slice(idx, routeSource.indexOf("return request.headers", idx));
    expect(guardBody).toContain("return false");
  });

  it("route returns 500 on RPC failure (cron dashboard must show red)", () => {
    expect(routeSource).toMatch(/apiError\("INTERNAL_ERROR",[^)]*500\)/);
  });

  it("vercel.json schedules the cron daily", () => {
    const entry = vercelJson.crons.find((c) => c.path === "/api/cron/refresh-analytics");
    expect(entry).toBeDefined();
    // Five-field cron with concrete minute+hour and daily cadence.
    expect(entry?.schedule).toMatch(/^\d{1,2} \d{1,2} \* \* \*$/);
  });
});
