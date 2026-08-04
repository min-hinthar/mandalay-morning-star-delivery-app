/**
 * Materialized views must be read through their admin wrapper, never directly.
 *
 * `driver_stats_mv` and `delivery_metrics_mv` are created by the baseline
 * (`:639`, `:613`) but **no grant of any form names either one** — the baseline
 * emits 99 `GRANT ... ON TABLE` lines and not one mentions an `_mv`. So the
 * caller-scoped `authenticated` client holds no SELECT privilege on them, and
 * `.from("driver_stats_mv")` fails at runtime no matter how well the route
 * authenticates the caller.
 *
 * That failure is invisible in every way that matters: `tsc` is happy, the
 * repo's phantom-column guard is happy (the columns genuinely exist), and the
 * routes' own admin checks pass. Two of the five call sites swallowed the error
 * into an empty list and the others 500'd — which is how the admin analytics
 * pages shipped broken.
 *
 * The correct path already existed. `get_driver_stats_admin()` (`:1164`) and
 * `get_delivery_metrics_admin()` (`:1103`) are `SECURITY DEFINER`, re-check
 * `is_admin()` themselves, `RETURNS SETOF` the view so PostgREST filters still
 * work, and — unlike the views — are granted to `authenticated`.
 *
 * This is a source guard rather than a runtime test because the failure needs a
 * real database to reproduce, and by then it is in production.
 *
 * If a future migration DOES grant SELECT on one of these views, this guard
 * becomes over-strict rather than wrong: relax it deliberately, and note that
 * reading the view directly then also skips the wrapper's `is_admin()` check.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");
const BASELINE = join(process.cwd(), "supabase/migrations/00000000000000_baseline.sql");

/** Views with no SELECT grant, mapped to the wrapper that must be used instead. */
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
        `read ${view} via supabase.rpc("${wrapper}") instead — nothing grants SELECT on the view, so a direct read fails at runtime for every caller`
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

  it.each(Object.keys(GUARDED_VIEWS))("nothing grants SELECT on %s by name", (view) => {
    // The premise. If this ever fails, a migration granted access to the view
    // and the guard above can be reconsidered — deliberately, not by accident.
    const grants = baseline
      .split("\n")
      .filter((line) => line.startsWith("GRANT") && line.includes(view));

    expect(grants).toEqual([]);
  });

  it("no blanket grant could reach the views without naming them", () => {
    // The test above only rejects grants that NAME a view, so on its own it
    // would keep passing after a `GRANT ... ON ALL TABLES IN SCHEMA public` or
    // an `ALTER DEFAULT PRIVILEGES` — the assertion would still be green while
    // its stated meaning ("nothing grants SELECT") had become false. That is
    // the same passes-for-the-wrong-reason shape as the $function$ slice above.
    //
    // Today the dump contains exactly two GRANT forms: `ON TABLE <name>` and
    // `ON FUNCTION <name>`, both explicit. Pinning that keeps the premise
    // honest rather than merely unfalsified.
    const blanket = baseline
      .split("\n")
      .filter((line) => /^(GRANT|ALTER DEFAULT PRIVILEGES)\b/.test(line))
      .filter((line) => /ON ALL \w+ IN SCHEMA|^ALTER DEFAULT PRIVILEGES/.test(line));

    expect(
      blanket,
      "a blanket grant may now cover the materialized views — re-verify the premise of this whole guard"
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
