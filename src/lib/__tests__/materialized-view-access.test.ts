/**
 * Materialized views must be read through their admin wrapper, never directly.
 *
 * `driver_stats_mv` and `delivery_metrics_mv` hold every driver's name/email and
 * fleet revenue. A materialized view cannot carry RLS, so its ACL is the only
 * guard — and that ACL is NOT what the migration text suggests. The baseline
 * never GRANTs on either view by name, but Supabase's platform default ACL
 * (`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON
 * TABLES TO anon, authenticated, service_role`, which lives outside the repo's
 * migrations) grants on every relation `postgres` creates — views included.
 * Locally, before `20260925120000_privilege_hardening.sql`, even `anon` could
 * `SELECT * FROM driver_stats_mv`. An earlier version of this guard asserted
 * "nothing grants SELECT" by grepping the baseline, which cannot see a default
 * ACL: it passed for the wrong reason while the views were world-readable.
 *
 * The fix is an explicit `REVOKE ALL ... FROM anon, authenticated`. The app
 * reads through `get_driver_stats_admin()` / `get_delivery_metrics_admin()`,
 * which are `SECURITY DEFINER`, re-check `is_admin()` themselves, and
 * `RETURNS SETOF` the view so PostgREST filters still chain. A direct
 * `.from("<mv>")` now fails for every caller (and before the REVOKE it skipped
 * the admin check entirely) — invisible to `tsc` and the phantom-column guard.
 *
 * Default privileges apply again whenever a view is re-created, so any
 * migration that (re)creates one of these views must repeat the REVOKE after
 * it; the ordering test below enforces that. The live ACL itself is pinned by
 * `supabase/tests/02_materialized_views.test.sql` (`has_table_privilege`).
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");
const MIGRATIONS = join(process.cwd(), "supabase/migrations");
const BASELINE = join(MIGRATIONS, "00000000000000_baseline.sql");

/** Views revoked from anon/authenticated, mapped to the wrapper that must be used instead. */
const GUARDED_VIEWS: Record<string, string> = {
  driver_stats_mv: "get_driver_stats_admin",
  delivery_metrics_mv: "get_delivery_metrics_admin",
};

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, acc);
    } else if (/\.tsx?$/.test(entry) && !full.includes("__tests__")) {
      acc.push(full);
    }
  }
  return acc;
}

describe("materialized views are read through their admin wrapper", () => {
  const files = sourceFiles(SRC);

  it("scans a plausible number of source files", () => {
    // Floor so a broken walk cannot make the guard below vacuously pass.
    expect(files.length).toBeGreaterThan(500);
  });

  it.each(Object.entries(GUARDED_VIEWS))(
    "no source file reads %s directly — use %s()",
    (view, wrapper) => {
      const offenders = files.filter((f) =>
        new RegExp(`\\.from\\(\\s*["'\`]${view}["'\`]`).test(readFileSync(f, "utf8"))
      );

      expect(
        offenders.map((f) => f.replace(process.cwd() + "/", "")),
        `read ${view} via supabase.rpc("${wrapper}") instead — anon/authenticated are revoked on the view, so a direct read fails at runtime for every caller`
      ).toEqual([]);
    }
  );
});

describe("the grants this guard depends on", () => {
  const baseline = readFileSync(BASELINE, "utf8");

  it.each(Object.values(GUARDED_VIEWS))("%s is executable by authenticated", (wrapper) => {
    // Without this the "correct path" is not actually reachable either, and the
    // fix above would swap one permission error for another.
    expect(baseline).toContain(`GRANT EXECUTE ON FUNCTION public.${wrapper}() TO authenticated`);
  });

  // Migrations in apply order (the CLI sorts by the timestamp prefix).
  const migrations = readdirSync(MIGRATIONS)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort()
    .map((f) => ({ file: f, sql: readFileSync(join(MIGRATIONS, f), "utf8") }));

  /** Offsets in the concatenated apply-order stream, so "after" spans files. */
  function positions(re: RegExp): number[] {
    const hits: number[] = [];
    let offset = 0;
    for (const m of migrations) {
      for (const match of m.sql.matchAll(re)) hits.push(offset + (match.index ?? 0));
      offset += m.sql.length + 1;
    }
    return hits;
  }

  it("scans every migration", () => {
    expect(migrations.length).toBeGreaterThan(10);
    expect(migrations[0].file).toBe("00000000000000_baseline.sql");
  });

  it.each(Object.keys(GUARDED_VIEWS))(
    "%s is revoked from anon + authenticated after its LAST (re)creation",
    (view) => {
      // Default privileges re-grant anon/authenticated on every CREATE, so the
      // REVOKE only holds if nothing re-creates the view after it.
      const creates = positions(
        new RegExp(`CREATE MATERIALIZED VIEW (?:IF NOT EXISTS )?(?:public\\.)?${view}\\b`, "g")
      );
      const revokes = positions(
        new RegExp(
          `REVOKE ALL ON [^;]*\\b(?:public\\.)?${view}\\b[^;]*FROM anon, authenticated\\s*;`,
          "g"
        )
      );

      expect(creates.length, `no CREATE MATERIALIZED VIEW ${view} found`).toBeGreaterThan(0);
      expect(
        revokes.some((r) => r > Math.max(...creates)),
        `${view} is (re)created after its last REVOKE — default privileges re-grant anon/authenticated SELECT; repeat \`REVOKE ALL ON public.${view} FROM anon, authenticated\` after the CREATE`
      ).toBe(true);
    }
  );

  it.each(Object.keys(GUARDED_VIEWS))("no migration grants anything on %s by name", (view) => {
    const grants = migrations.flatMap(({ file, sql }) =>
      sql
        .split("\n")
        .filter((line) => /^\s*GRANT\b/.test(line) && new RegExp(`\\b${view}\\b`).test(line))
        .map((line) => `${file}: ${line.trim()}`)
    );

    expect(grants).toEqual([]);
  });

  it("no migration re-opens the schema to anon/authenticated wholesale", () => {
    // A blanket GRANT (or a default-privileges GRANT) would re-cover the views
    // without naming them, silently undoing the REVOKE above.
    const blanket = migrations.flatMap(({ file, sql }) =>
      sql
        .split(/;\s*\n/)
        .filter((stmt) => /\bGRANT\b/.test(stmt) && /\b(anon|authenticated)\b/.test(stmt))
        .filter((stmt) => /ON ALL \w+ IN SCHEMA|ALTER DEFAULT PRIVILEGES/.test(stmt))
        .map((stmt) => `${file}: ${stmt.trim().replace(/\s+/g, " ")}`)
    );

    expect(
      blanket,
      "a blanket grant may now cover the materialized views — re-verify the REVOKE still holds"
    ).toEqual([]);
  });

  /**
   * Slice out ONE function's body, bounded at its real terminator.
   *
   * The terminator is `$function$\n;` — the literal `$function$;` appears zero
   * times in the baseline. An `indexOf("$function$;")` therefore returns -1,
   * `slice(0, -1)` spans the rest of the file, and the gate assertion below
   * matches ANY later function's `is_admin()` check. There are only three in
   * the whole baseline, so deleting the gate from `get_delivery_metrics_admin`
   * would still have passed on `get_driver_stats_admin`'s — a guard whose
   * stated point is that this gate is load-bearing, passing for the wrong
   * reason.
   */
  function functionBody(name: string): string {
    const start = baseline.indexOf(`FUNCTION public.${name}()`);
    expect(start, `${name} not found in the baseline`).toBeGreaterThan(-1);

    const rest = baseline.slice(start);
    const end = rest.search(/\$function\$\s*;/);
    expect(end, `no terminator found for ${name} — has the dump format changed?`).toBeGreaterThan(
      -1
    );

    const body = rest.slice(0, end);
    // Belt for the exact failure above: if the slice ever overruns into a
    // neighbouring definition, say so instead of silently widening the search.
    expect(
      body.match(/CREATE OR REPLACE FUNCTION/g)?.length ?? 0,
      `${name}'s extracted body ran past its own definition`
    ).toBeLessThan(2);
    return body;
  }

  it.each(Object.values(GUARDED_VIEWS))("%s re-checks is_admin itself", (wrapper) => {
    // These are SECURITY DEFINER, so they bypass RLS by design. The is_admin()
    // gate inside them is the only thing standing between `authenticated` and
    // every driver's stats — it is load-bearing, not decorative.
    expect(functionBody(wrapper)).toMatch(
      /IF NOT public\.is_admin\(\) THEN\s*\n\s*RAISE EXCEPTION/
    );
  });
});
