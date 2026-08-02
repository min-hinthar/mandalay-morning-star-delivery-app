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

/** Pull the `.select("…")` column list out of a `.from("routes")` chain. */
function selectedColumns(source: string, afterMarker: string): string[] {
  const from = source.indexOf(afterMarker);
  expect(from).toBeGreaterThan(-1);
  const select = source.indexOf('.select("', from);
  expect(select).toBeGreaterThan(-1);
  const open = select + '.select("'.length;
  const close = source.indexOf('")', open);
  return source
    .slice(open, close)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

describe("driver dashboard route query", () => {
  it("selects only columns that exist on routes in the generated schema", () => {
    const page = read("src/app/(driver)/driver/page.tsx");
    const generated = read("src/types/database.generated.ts");

    const columns = selectedColumns(page, '.from("routes")');
    expect(columns.length).toBeGreaterThan(0);

    // The generated Row type for `routes` is the source of truth for what
    // PostgREST will accept. A column absent from it makes the whole query
    // fail — not just that field come back null.
    // Slice from `routes: {` to whichever table is declared NEXT at the same
    // indent — the generated file is alphabetical, so `route_stops` comes
    // BEFORE `routes` and a hardcoded end-marker slices backwards to nothing.
    const start = generated.indexOf("      routes: {");
    expect(start).toBeGreaterThan(-1);
    const nextTable = /\n {6}\w+: \{/.exec(generated.slice(start + 20));
    const routesBlock = generated.slice(
      start,
      nextTable ? start + 20 + nextTable.index : generated.length
    );
    // Guard the slice itself: an empty or truncated block would make every
    // assertion below vacuously pass. (This guard already earned its keep —
    // it caught the backwards slice above.)
    expect(routesBlock).toContain("delivery_date");
    expect(routesBlock.length).toBeGreaterThan(200);

    for (const column of columns) {
      expect(
        routesBlock.includes(`${column}:`),
        `routes.${column} is selected by the driver dashboard but does not exist in database.generated.ts. ` +
          `.returns<T>() casts the result, so tsc will not catch this — PostgREST rejects the query at runtime ` +
          `and the driver silently sees no route.`
      ).toBe(true);
    }
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
