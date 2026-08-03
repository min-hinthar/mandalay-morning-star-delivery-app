/**
 * The driver dashboard's queries must only reference columns that EXIST, and
 * no read on it may fail invisibly.
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
 * The consequence is silent: PostgREST rejects the unknown column with a 400
 * (Postgres `42703`), so the query returns `{ data: null, error }` — and the
 * loader read only `.data`. `todayRoute` is null, the driver HOME screen
 * reports "no route today" to a driver who has one, and its
 * `AcceptDeclineCard` never renders.
 *
 * Note the root cause precisely, because an earlier version of this comment got
 * it wrong: the error was always perfectly distinguishable (`42703`, not
 * `PGRST116`). Nothing was BINDING it. `.maybeSingle()` matters going forward —
 * now that errors are reported, `.single()` would raise PGRST116 on every
 * legitimately empty day — but it is not what hid the phantom column.
 *
 * Drivers are not blocked: `AcceptDeclineBar` on /driver/route (a primary tab
 * in DriverNav) is a second accept/decline surface, and that page's query does
 * NOT select the phantom column, so it works. Today's earnings survive too —
 * they come from a separate query. Scoping this correctly matters: the first
 * version of this comment claimed the whole accept/decline flow was dead.
 *
 * This pins every column the loader references — in SELECTs *and* in filters —
 * against the generated schema, so the next phantom column fails here instead
 * of in a driver's hands.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LOADER = "src/app/(driver)/driver/page.tsx";

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/**
 * Comments are not code, and letting them through cuts both ways: a comment
 * EXPLAINING why we avoid `.single()` contains that literal string (the first
 * version of the runtime assertion matched its own documentation), and a
 * commented-out `.select("id, zzz")` would fail the column guard spuriously.
 * Worse, a `/* … *\/` block naming the result variables satisfied the
 * reporting assertion while the real loop was gutted. Strip both forms.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

interface ParsedQuery {
  table: string;
  /** Columns named in `.select(...)`. */
  columns: string[];
  /** Columns named in `.eq(...)` / `.in(...)` / `.order(...)` and friends. */
  filters: string[];
}

/**
 * Every `.from("<table>")` query in a source file, with the columns it names.
 *
 * A query's slice runs from its `.from(` to the next one, so filters land on
 * the table they actually apply to.
 *
 * Filters are parsed as well as selects because a phantom column in `.eq(...)`
 * fails IDENTICALLY — same 400, same `{data:null, error}`, same "no route
 * today" — and postgrest-js does not type-check them: `eq` is
 * `<ColumnName extends string>` (unconstrained), and `gt`/`order` follow their
 * `keyof Row` overloads with a permissive `(column: string, …)` fallback.
 *
 * Both quoted select forms the loader uses are handled — `.select("a, b")` and
 * the multi-line `.select(\`\n a,\n b\n\`)`. A `.select(SOME_CONST)` is NOT,
 * deliberately: it yields zero columns and the caller fails loudly rather than
 * skipping the query. That is not hypothetical — hoisting one column list to a
 * module constant was shown to drop a query from this guard while a phantom
 * column rode along, all three tests still green.
 */
function parseQueries(source: string): ParsedQuery[] {
  const fromRe = /\.from\("(\w+)"\)/g;
  const heads: Array<{ table: string; at: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(source)) !== null) heads.push({ table: m[1], at: m.index });

  return heads.map((head, i) => {
    const slice = source.slice(head.at, i + 1 < heads.length ? heads[i + 1].at : source.length);

    const select = /\.select\(\s*(["`])([\s\S]*?)\1/.exec(slice);
    const columns = (select?.[2] ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const filters: string[] = [];
    const filterRe = /\.(?:eq|neq|gt|gte|lt|lte|in|is|like|ilike|contains|order)\(\s*"(\w+)"/g;
    let f: RegExpExecArray | null;
    while ((f = filterRe.exec(slice)) !== null) filters.push(f[1]);

    return { table: head.table, columns, filters };
  });
}

/**
 * The generated `Row` block for one table.
 *
 * Sliced to `Row` specifically, not the whole table entry: the entry also holds
 * Insert / Update / Relationships, whose structural keys (`columns`,
 * `foreignKeyName`, `referencedRelation`, `Row`, `Insert`, …) would all satisfy
 * a column lookup. Only real column names should.
 */
function generatedRowBlock(generated: string, table: string): string {
  const start = generated.indexOf(`      ${table}: {`);
  expect(start, `${table} not found in database.generated.ts`).toBeGreaterThan(-1);
  // The generated file is alphabetical, so a hardcoded end-marker can slice
  // BACKWARDS to an empty string (route_stops precedes routes) and make every
  // assertion vacuously pass. Scan forward for the next 6-space-indented table.
  const rest = generated.slice(start + table.length + 12);
  const next = /\n {6}\w+: \{/.exec(rest);
  const entry = generated.slice(
    start,
    next ? start + table.length + 12 + next.index : generated.length
  );

  const rowAt = entry.indexOf("Row: {");
  const insertAt = entry.indexOf("Insert: {");
  expect(rowAt, `${table} has no Row block`).toBeGreaterThan(-1);
  expect(insertAt, `${table} has no Insert block`).toBeGreaterThan(rowAt);
  return entry.slice(rowAt, insertAt);
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
  // query parser mis-read the source (a nested relation select, say), and a
  // silently-skipped column is exactly the failure mode this file exists to
  // prevent — so reject it loudly rather than regex-escaping it into a pass.
  expect(
    column,
    `unexpected column token "${column}" — the query parser mis-read the source`
  ).toMatch(/^\w+$/);
  return new RegExp(`(^|[\\s{])${column}\\s*:`, "m").test(block);
}

describe("driver dashboard queries", () => {
  it("references only columns that exist — in selects AND filters", () => {
    const code = stripComments(read(LOADER));
    const generated = read("src/types/database.generated.ts");

    const queries = parseQueries(code);

    // Pin the parse against the source itself rather than a literal floor. A
    // hardcoded `>= 6` against seven real queries tolerated exactly one query
    // vanishing from the guard — demonstrated live, with a phantom column in
    // the query that dropped out and all three tests still green. Comparing to
    // the raw `.from(` count makes any unparsed query loud instead of absorbed.
    const fromCount = (code.match(/\.from\(/g) ?? []).length;
    expect(queries.length, "a .from(...) call did not parse — the guard would skip it").toBe(
      fromCount
    );
    expect(queries.length, "no queries parsed at all").toBeGreaterThanOrEqual(7);

    for (const { table, columns, filters } of queries) {
      const block = generatedRowBlock(generated, table);
      // Guard the slice itself — an empty block passes everything. (This guard
      // already earned its keep: the first version sliced backwards.)
      expect(block.length, `${table} Row block looks empty`).toBeGreaterThan(60);
      expect(columns.length, `no select columns parsed for ${table}`).toBeGreaterThan(0);

      for (const [kind, list] of [
        ["selected", columns],
        ["filtered on", filters],
      ] as const) {
        for (const column of list) {
          expect(
            hasColumn(block, column),
            `${table}.${column} is ${kind} by the driver dashboard but does not exist in ` +
              `database.generated.ts. .returns<T>() CASTS the result to a hand-written ` +
              `interface, so tsc cannot catch this — PostgREST rejects the whole query at ` +
              `runtime with a 400 and the loader sees no data.`
          ).toBe(true);
        }
      }
    }
  });

  it("surfaces every read's error, so a failure cannot read as an empty day", () => {
    // The COMPILE-time half of this fix is the column guard above; this is the
    // runtime half. `.single()` returns PGRST116 for zero rows, so once errors
    // are actually reported it would fire on every legitimately empty day —
    // hence maybeSingle on the reads that tolerate absence.
    const code = stripComments(read(LOADER));

    // Every routes query must terminate in maybeSingle (or not be a
    // single-row query at all); none may use .single().
    const routeQueries = code.split('.from("routes")').slice(1);
    expect(routeQueries.length).toBeGreaterThanOrEqual(2);
    for (const q of routeQueries) {
      const end = q.indexOf("),");
      // A missing terminator would slice to "" and pass vacuously.
      expect(end, "could not find the end of a routes query chain").toBeGreaterThan(-1);
      expect(q.slice(0, end + 1)).not.toMatch(/\.single\(\)/);
    }

    // Stronger: exactly ONE .single() survives on this loader — the `drivers`
    // lookup, which is a genuine must-exist read and notFound()s on its error,
    // so PGRST116 there is unambiguous. Every other read tolerates absence via
    // `?? …`, which is precisely where .single() turns a failure into an empty
    // day. A new .single() anywhere else fails here.
    const singles = code.match(/\.single\(\)/g) ?? [];
    expect(
      singles.length,
      "a new .single() appeared — use maybeSingle unless the row genuinely must exist"
    ).toBe(1);

    const driversAt = code.indexOf('.from("drivers")');
    const singleAt = code.indexOf(".single()");
    expect(driversAt, "the drivers lookup moved — this anchor is stale").toBeGreaterThan(-1);
    expect(singleAt, "the surviving .single() is not the drivers lookup").toBeGreaterThan(
      driversAt
    );
    expect(
      code.slice(driversAt + 1, singleAt),
      'another query sits between .from("drivers") and the surviving .single()'
    ).not.toContain('.from("');

    // Every result of the parallel load must have its error reported. Read the
    // destructured names out of the source rather than hardcoding them, so an
    // eighth query added without logging fails here.
    const awaitAt = code.indexOf("] = await Promise.all([");
    expect(awaitAt, "the parallel data load moved — this anchor is stale").toBeGreaterThan(-1);
    // Anchoring on the FIRST parallel load is only sound while there is one.
    // With two, a decoy earlier load hijacks every offset below and the real
    // load goes unguarded — reproduced: the seven-entry loop could be deleted
    // entirely and this test stayed green.
    expect(awaitAt, "more than one parallel load — these anchors are ambiguous").toBe(
      code.lastIndexOf("] = await Promise.all([")
    );

    const openAt = code.lastIndexOf("const [", awaitAt);
    expect(openAt, "could not find the destructure of the parallel load").toBeGreaterThan(-1);
    const names = code
      .slice(openAt + "const [".length, awaitAt)
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    expect(names.length, "parsed no result names — the destructure shape changed").toBe(7);

    // Anchor to the reporting LOOP, not to "everything before the first log".
    // The loose version passed when the loop was collapsed to a single
    // `if (routeResult.error)` with the other six names merely mentioned
    // nearby, and it FAILED spuriously when an unrelated logger.exception was
    // added above the loop.
    const loopAt = code.indexOf("for (const [label, result] of [", awaitAt);
    expect(loopAt, "the per-result reporting loop is gone").toBeGreaterThan(-1);
    const logAt = code.indexOf("logger.exception", loopAt);
    expect(logAt, "the reporting loop does not log").toBeGreaterThan(-1);

    const reporting = code.slice(loopAt, logAt);
    for (const name of names) {
      expect(reporting, `${name} can fail silently — nothing reports its error`).toContain(name);
    }
    expect(reporting, "nothing reads .error").toMatch(/\.error\b/);

    // The reads OUTSIDE the parallel block need the same rule, and asserting it
    // per-query would just go stale. Generalize: no `await supabase` read may
    // destructure `data` without also destructuring `error`. That is literally
    // what went wrong — the phantom column produced a perfectly good `error`
    // object that nothing was binding.
    //
    // This assertion exists because deleting the profiles error capture passed
    // every OTHER assertion in this file. A guard nobody falsifies is decoration.
    const destructures = code.match(/const \{[^;]*?\} = await supabase/g) ?? [];
    expect(
      destructures.length,
      "parsed no supabase destructures — the loader's shape changed"
    ).toBeGreaterThan(2);
    for (const d of destructures) {
      expect(d, `this read binds .data but not .error, so a failure is invisible:\n${d}`).toMatch(
        /\berror\b/
      );
    }
  });

  it("bounds the today-route lookup, so two routes are not an error", () => {
    // maybeSingle() synthesizes PGRST116 when MORE than one row comes back, and
    // nothing stops a driver having two active routes on one date:
    // idx_routes_driver_date is a plain non-unique index, and split_route
    // INSERTs a second route at the same delivery_date with a caller-chosen
    // driver (merge_routes exists to undo exactly that state).
    //
    // Unbounded, that turns a legitimate data shape into a Sentry exception on
    // every dashboard load, all day, while the driver still sees "no route
    // today" — the new reporting poisoning its own signal. Bounded, the driver
    // sees their first route and nothing is logged.
    const code = stripComments(read(LOADER));

    const todayAt = code.indexOf('.from("routes")');
    const chain = code.slice(todayAt, code.indexOf("),", todayAt));
    expect(chain).toContain(".limit(1)");
    expect(chain, "an unordered limit(1) picks an arbitrary route").toMatch(/\.order\(/);
  });

  it("no longer references the phantom area_description anywhere", () => {
    // It survived in three files (the query, the switch, and the card), so a
    // partial removal would leave a dead prop chain behind.
    for (const file of [
      LOADER,
      "src/app/(driver)/driver/DriverHomeSwitch.tsx",
      "src/components/ui/driver/AcceptDeclineCard.tsx",
    ]) {
      expect(read(file)).not.toContain("area_description");
      expect(read(file)).not.toContain("areaDescription");
    }
  });
});
