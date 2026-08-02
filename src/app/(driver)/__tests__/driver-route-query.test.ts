/**
 * The driver dashboard's route query must only select columns that EXIST.
 *
 * `src/app/(driver)/driver/page.tsx` selected `area_description` from `routes`.
 * That column has never existed — not in the squashed baseline, not in
 * `database.generated.ts`, and not in any migration in the repo's history.
 *
 * Nothing caught it:
 *   - `tsc` can't, because the query uses `.returns<RouteQueryResult[]>()`,
 *     which CASTS the result to a hand-written interface and bypasses the
 *     generated `Database` types entirely.
 *   - the `db-drift` CI job can't, because it compares the local schema to the
 *     generated types — neither of which knows what the app SELECTS.
 *   - no test covered the driver dashboard loader.
 *
 * The consequence is silent: PostgREST rejects the unknown column, `.single()`
 * returns `{ data: null, error }`, the page reads only `routeResult.data`, so
 * `todayRoute` is null. The driver HOME screen then reports "no route today"
 * to a driver who has one, and its `AcceptDeclineCard` never renders.
 *
 * Drivers are not blocked: `AcceptDeclineBar` on /driver/route (a primary tab
 * in DriverNav) is a second accept/decline surface, and that page's query does
 * NOT select the phantom column, so it works. Today's earnings survive too —
 * they come from a separate query. Scoping this correctly matters: the first
 * version of this comment claimed the whole accept/decline flow was dead.
 *
 * This pins every column the loader asks for against the generated schema, so
 * the next phantom column fails here instead of in a driver's hands.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/**
 * Every `.from("<table>").select(...)` in a source file, as
 * `{ table, columns }`.
 *
 * Handles BOTH select forms the loader uses — `.select("a, b")` and the
 * multi-line `.select(\`\n a,\n b\n\`)` — because the first version of this
 * guard only understood the quoted form, which silently covered one of the
 * three queries in the file and skipped the rest.
 *
 * Embedded relation selects (`profiles ( email )`) are not used by this loader;
 * a nested one would surface here as a column name containing "(" and fail
 * loudly rather than being silently mis-parsed.
 */
function tableSelects(source: string): Array<{ table: string; columns: string[] }> {
  const out: Array<{ table: string; columns: string[] }> = [];
  const fromRe = /\.from\("(\w+)"\)\s*\.select\(\s*(["`])([\s\S]*?)\2/g;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(source)) !== null) {
    const columns = m[3]
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    out.push({ table: m[1], columns });
  }
  return out;
}

/** The generated Row block for one table, sliced to the NEXT table at the same indent. */
function generatedTableBlock(generated: string, table: string): string {
  const start = generated.indexOf(`      ${table}: {`);
  expect(start, `${table} not found in database.generated.ts`).toBeGreaterThan(-1);
  // The generated file is alphabetical, so a hardcoded end-marker can slice
  // BACKWARDS to an empty string (route_stops precedes routes) and make every
  // assertion vacuously pass. Scan forward for the next 6-space-indented table.
  const rest = generated.slice(start + table.length + 12);
  const next = /\n {6}\w+: \{/.exec(rest);
  return generated.slice(start, next ? start + table.length + 12 + next.index : generated.length);
}

/**
 * Does the generated Row block declare EXACTLY this column?
 *
 * A substring check (`block.includes(column + ":")`) matches a SUFFIX of a real
 * column, so a phantom `type` would false-pass against `vehicle_type:`, `at`
 * against `started_at:`, and `id` against every `*_id:` — quietly gutting a
 * guard whose entire value is rigor. Anchor to a boundary so the assertion
 * means "this column exists", not "some column ends with this".
 */
function hasColumn(block: string, column: string): boolean {
  // Postgres identifiers reaching here are [a-z0-9_]; anything else means the
  // select parser mis-read the source (a nested relation select, say), and a
  // silently-skipped column is exactly the failure mode this file exists to
  // prevent — so reject it loudly rather than regex-escaping it into a pass.
  expect(
    column,
    `unexpected column token "${column}" — the select parser mis-read the source`
  ).toMatch(/^\w+$/);
  return new RegExp(`(^|[\\s{])${column}\\s*:`, "m").test(block);
}

describe("driver dashboard queries", () => {
  it("selects only columns that exist, for EVERY table the loader queries", () => {
    const page = read("src/app/(driver)/driver/page.tsx");
    const generated = read("src/types/database.generated.ts");

    const selects = tableSelects(page);
    // The loader queries drivers, profiles, routes (x3), driver_badges and
    // app_settings. If this drops, the parser silently stopped matching and
    // every assertion below would pass vacuously.
    expect(selects.length).toBeGreaterThanOrEqual(6);

    for (const { table, columns } of selects) {
      const block = generatedTableBlock(generated, table);
      // Guard the slice itself — an empty block passes everything. (This guard
      // already earned its keep: the first version sliced backwards.)
      expect(block.length, `${table} block looks empty`).toBeGreaterThan(120);
      expect(columns.length, `no columns parsed for ${table}`).toBeGreaterThan(0);

      for (const column of columns) {
        expect(
          hasColumn(block, column),
          `${table}.${column} is selected by the driver dashboard but does not exist in ` +
            `database.generated.ts. .returns<T>() CASTS the result to a hand-written ` +
            `interface, so tsc cannot catch this — PostgREST rejects the whole query at ` +
            `runtime and the loader, which reads only .data, silently sees nothing.`
        ).toBe(true);
      }
    }
  });

  it("uses maybeSingle + surfaces errors, so a failure cannot read as 'no route'", () => {
    // The COMPILE-time half of this fix is the column guard above. This is the
    // runtime half: `.single()` returns PGRST116 for zero rows, so an empty
    // schedule and a real failure are indistinguishable in `.error` — which is
    // precisely what let the phantom column masquerade as "no route today".
    const page = read("src/app/(driver)/driver/page.tsx");

    // Strip line comments first — the explanation of WHY we avoid .single()
    // naturally contains the string ".single()", and the first version of this
    // assertion matched its own documentation.
    const code = page.replace(/^\s*\/\/.*$/gm, "");

    // Every routes query must terminate in maybeSingle (or not be a
    // single-row query at all); none may use .single().
    const routeQueries = code.split('.from("routes")').slice(1);
    expect(routeQueries.length).toBeGreaterThanOrEqual(2);
    for (const q of routeQueries) {
      const chain = q.slice(0, q.indexOf("),") + 1);
      expect(chain).not.toMatch(/\.single\(\)/);
    }

    // And a real error must be reported rather than swallowed — for EVERY
    // result, not just the two that were provably broken. All of them reach the
    // view through `?? 0` / `?? []` / `?? null`, so any one failing renders as
    // an ordinary empty day. Rather than hardcode today's list (which would go
    // stale the moment a query is added), read the destructured names straight
    // out of the source and require each to be reported. Add an eighth query
    // and forget to log it, and this fails.
    const awaitAt = code.indexOf("] = await Promise.all([");
    expect(awaitAt, "the parallel data load moved — this anchor is stale").toBeGreaterThan(-1);

    const openAt = code.lastIndexOf("const [", awaitAt);
    expect(openAt, "could not find the destructure of the parallel load").toBeGreaterThan(-1);
    const names = code
      .slice(openAt + "const [".length, awaitAt)
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    expect(names.length, "parsed no result names — the destructure shape changed").toBeGreaterThan(
      5
    );

    const afterAwait = code.slice(code.indexOf("]);", awaitAt));
    const reportAt = afterAwait.indexOf("logger.exception");
    expect(reportAt, "no logger.exception after the parallel load").toBeGreaterThan(-1);

    const reporting = afterAwait.slice(0, reportAt);
    for (const name of names) {
      expect(reporting, `${name} can fail silently — nothing reports its error`).toContain(name);
    }
    expect(reporting, "nothing reads .error").toMatch(/\.error\b/);
  });

  it("no longer references the phantom area_description anywhere", () => {
    // It survived in three files (the query, the switch, and the card), so a
    // partial removal would leave a dead prop chain behind.
    for (const file of [
      "src/app/(driver)/driver/page.tsx",
      "src/app/(driver)/driver/DriverHomeSwitch.tsx",
      "src/components/ui/driver/AcceptDeclineCard.tsx",
    ]) {
      expect(read(file)).not.toContain("area_description");
      expect(read(file)).not.toContain("areaDescription");
    }
  });
});
