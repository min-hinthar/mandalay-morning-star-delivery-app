/**
 * Every column this app names in a query must exist in the generated schema.
 *
 * This is the repo-wide generalization of the driver-dashboard guard from #230.
 * That one pinned a single loader; this scans all app sources, because the same
 * bug was sitting in the customer tracking path the whole time:
 *
 *   orders.cancelled_at, orders.cancellation_reason
 *
 * Neither has ever existed — not in the baseline, not in any migration, not in
 * `database.generated.ts`. PostgREST rejects a query naming an unknown column,
 * so the WHOLE select failed, `fetchTrackingData` returned null, and
 * `orders/[id]/tracking/page.tsx` called `notFound()`. Every customer's order
 * tracking page 404'd, and the polling refresh died with it.
 *
 * Nothing caught it, for the same reasons as #230:
 *   - `tsc` can't: these queries use `.returns<HandWrittenRow[]>()`, which
 *     CASTS past the generated `Database` types. The hand-written interface
 *     declared both phantom columns, so it type-checked perfectly.
 *   - `db-drift` can't: it compares the local schema to the generated types.
 *     Neither knows what the application queries.
 *
 * WHAT IS COVERED — top-level select columns, columns nested inside embedded
 * relation bodies (validated against the RELATION's table, not the parent's),
 * and filter columns. An adversarial pass proved each of those was needed: the
 * first version validated only top-level columns, and a phantom planted inside
 * `addresses (...)` — in the very loader this PR fixes — left it green.
 *
 * WHAT IS NOT — a `.select(someVariable)` cannot be read from source, so its
 * columns are unguarded. Those are COUNTED instead, and the count is pinned, so
 * adding a new one is a deliberate act rather than a silent gap.
 *
 * ALSO NOT — plain-JS calls that share a name with a PostgREST filter. The
 * filter matcher binds any `.match("x")` / `.order("x")` / `.in("x")` with a
 * string-literal first argument to the nearest preceding `.from(...)`. Every
 * current match is a real Supabase call, but a future `someString.match("x")`
 * sitting after a `.from()` in the same file would be read as a filter on that
 * table. If this fails on something that is plainly not a query, that is why.
 *
 * ALSO NOT — query-shaped text INSIDE a string literal. `stripComments` walks
 * past a quoted span without blanking it (it has to: the select columns live
 * inside exactly such a span), so an error message or doc string containing
 * `.from("orders").select("cancelled_at")` would be read as a real query. No
 * such string exists today. If this test ever fails on prose rather than on a
 * query, that is why — quote the offending text differently or move it into a
 * comment, which IS stripped.
 *
 * ALSO NOT — this catches phantom COLUMNS. It cannot catch a hand-written
 * interface naming real columns with the wrong TYPE or nullability (e.g.
 * `rating_avg: number` where the schema says `number | null`). Only dropping
 * the `.returns<T>()` casts fixes that class.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const GENERATED = readFileSync(join(ROOT, "src/types/database.generated.ts"), "utf8");

/**
 * The column names in one table's generated `Row` block.
 *
 * The generated file is alphabetical, so an end-marker guessed from a sibling
 * table can slice BACKWARDS into an empty string and make every assertion pass
 * vacuously (this happened for real in #230: `route_stops` precedes `routes`).
 * Scan forward for the next 6-space-indented table instead.
 *
 * Views resolve too: they have no `Insert:`, so the slice runs to the end of the
 * block, and `Relationships` entries are 12-space indented so nothing leaks in.
 */
function rowColumns(table: string): Set<string> | null {
  const start = GENERATED.indexOf(`      ${table}: {`);
  if (start < 0) return null;

  const afterHeader = start + table.length + 12;
  const next = /\n {6}\w+: \{/.exec(GENERATED.slice(afterHeader));
  const block = GENERATED.slice(start, next ? afterHeader + next.index : GENERATED.length);

  const rowStart = block.indexOf("Row: {");
  if (rowStart < 0) return null;
  const rowEnd = block.indexOf("Insert: {", rowStart);
  const row = block.slice(rowStart, rowEnd < 0 ? block.length : rowEnd);

  const cols = new Set<string>();
  for (const m of row.matchAll(/^\s{10}(\w+)\??:/gm)) cols.add(m[1]);
  return cols.size > 0 ? cols : null;
}

/**
 * The field names on a Postgres function's generated `Returns` shape.
 *
 * `.rpc("f")` on a `RETURNS SETOF <table>` function yields a filter builder, so
 * `.eq("is_active", true)` after it is a real PostgREST filter — and just as
 * capable of naming a column that does not exist. Those filters bind to the
 * FUNCTION, not to whatever `.from()` happened to come before it in the file,
 * which is why `queryChunks` splits on `.rpc(` too: without that they were
 * silently attributed to the previous table and reported as phantoms on it.
 *
 * Returns null for a function with a scalar return — there is nothing to filter
 * on, so nothing to validate.
 */
function rpcReturnColumns(fn: string): Set<string> | null {
  const start = GENERATED.indexOf(`      ${fn}: {`);
  if (start < 0) return null;

  const afterHeader = start + fn.length + 12;
  const next = /\n {6}\w+: \{/.exec(GENERATED.slice(afterHeader));
  const block = GENERATED.slice(start, next ? afterHeader + next.index : GENERATED.length);

  const returns = block.indexOf("Returns: {");
  if (returns < 0) return null; // scalar return — nothing to filter on

  // Stop at the close of the Returns object. Every `RETURNS SETOF` function
  // also emits a `SetofOptions: { from; to; isOneToOne; isSetofReturn }` block
  // whose keys sit at the SAME 10-space indent as the real columns, so scanning
  // to the end of the function folded those four names into the valid set —
  // `.rpc("f").eq("isSetofReturn", true)` would have passed the guard.
  const afterReturns = block.slice(returns);
  const close = afterReturns.search(/\n {8}\}/);
  const returnsBlock = close < 0 ? afterReturns : afterReturns.slice(0, close);

  const cols = new Set<string>();
  for (const m of returnsBlock.matchAll(/^\s{10}(\w+)\??:/gm)) cols.add(m[1]);
  return cols.size > 0 ? cols : null;
}

/** Columns available on whatever a ref was resolved against. */
function columnsFor(ref: Pick<Ref, "table" | "source">): Set<string> | null {
  return ref.source === "rpc" ? rpcReturnColumns(ref.table) : rowColumns(ref.table);
}

/**
 * Application sources only.
 *
 * Tests, mocks and stories are excluded: a fixture may deliberately name a
 * column that does not exist, and failing the build for that would be a false
 * positive on code that never reaches PostgREST.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== "node_modules" && entry !== "__tests__" && entry !== "__mocks__") {
        sourceFiles(path, out);
      }
    } else if (/\.tsx?$/.test(entry) && !/\.(test|spec|stories)\.tsx?$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

/**
 * Blank out comments, preserving offsets so reported line numbers stay true.
 *
 * Without this the parser reads prose as code: a comment reading
 * `// never re-add .from("orders").select("cancelled_at")` fails CI, so
 * DOCUMENTING this very bug would break the build. Quote-aware, because a
 * `//` inside a string (a URL) is not a comment.
 */
function stripComments(source: string): string {
  const out = source.split("");
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];

    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < n && source[i] !== quote) {
        if (source[i] === "\\") i++;
        i++;
      }
      i++;
    } else if (ch === "/" && next === "/") {
      while (i < n && source[i] !== "\n") out[i++] = " ";
    } else if (ch === "/" && next === "*") {
      out[i++] = " ";
      out[i++] = " ";
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] !== "\n") out[i] = " ";
        i++;
      }
      if (i < n) {
        out[i++] = " ";
        out[i++] = " ";
      }
    } else {
      i++;
    }
  }
  return out.join("");
}

interface Ref {
  file: string;
  line: number;
  table: string;
  column: string;
  kind: "select" | "filter";
  /** Whether `table` names a table/view or a Postgres function's result set. */
  source: "table" | "rpc";
  method?: string;
  /** Nesting depth inside embedded relation bodies; 0 = top-level column. */
  depth?: number;
}

// Matches EVERY .from(...) form, including `.from("x" as any)` and `.from(v)`,
// so a chunk boundary is never missed and columns cannot leak to a prior table.
const ANY_SOURCE = /\.(from|rpc)\(\s*(?:"(\w+)")?[^)]*\)/g;

/**
 * Split a file into one chunk per `.from(...)` OR `.rpc(...)`, each running to
 * the next.
 *
 * Selects and filters bind to the nearest preceding query head, so this is the
 * single place that mapping is decided. A chunk whose name cannot be read from
 * source — `.from(variable)` — is skipped rather than guessed, and skipping it
 * (rather than not matching it at all) is what stops its columns being
 * attributed to whatever came before.
 *
 * `.rpc(` is a head for exactly that reason: a `RETURNS SETOF <table>` function
 * is filterable, so `.eq(...)` after it belongs to the function. Before this,
 * those filters leaked onto the previous `.from()` and were reported as phantom
 * columns on an unrelated table.
 */
function queryChunks(
  source: string
): Array<{ table: string; source: "table" | "rpc"; chunk: string; offset: number }> {
  const heads = [...source.matchAll(ANY_SOURCE)];
  const out: Array<{ table: string; source: "table" | "rpc"; chunk: string; offset: number }> = [];

  for (let i = 0; i < heads.length; i++) {
    const name = heads[i][2];
    const start = heads[i].index;
    const end = i + 1 < heads.length ? heads[i + 1].index : source.length;
    if (!name) continue;
    out.push({
      table: name,
      source: heads[i][1] === "rpc" ? "rpc" : "table",
      chunk: source.slice(start, end),
      offset: start,
    });
  }
  return out;
}

/**
 * The table an FK column on `table` points at, per the generated Relationships.
 *
 * PostgREST lets you embed by foreign-key column as well as by table name, so
 * `profiles:invited_by ( full_name )` on `driver_invites` really does resolve
 * to `profiles`. Following the FK means the embed's body is validated against
 * the right table instead of being skipped.
 */
function fkTarget(table: string, column: string): string | null {
  const start = GENERATED.indexOf(`      ${table}: {`);
  if (start < 0) return null;
  const afterHeader = start + table.length + 12;
  const next = /\n {6}\w+: \{/.exec(GENERATED.slice(afterHeader));
  const block = GENERATED.slice(start, next ? afterHeader + next.index : GENERATED.length);

  for (const m of block.matchAll(
    /columns:\s*\[([^\]]*)\][\s\S]{0,120}?referencedRelation:\s*"(\w+)"/g
  )) {
    if (m[1].includes(`"${column}"`)) return m[2];
  }
  return null;
}

/** Split on commas that sit outside any parentheses. */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

/**
 * Walk a select body, yielding every column against the table it belongs to.
 *
 * Recurses into embedded relation bodies, resolving the relation to its table:
 * `alias:table!fk_name ( … )` in any combination. A relation whose table does
 * not resolve (a computed/aliased embed) is skipped rather than guessed. Nested
 * embeds recurse, so `order_items ( … order_item_modifiers ( … ) )` is covered
 * to full depth.
 */
function walkSelectBody(
  body: string,
  table: string,
  emit: (table: string, column: string, depth: number) => void,
  onUnknownRelation: (name: string) => void,
  depth = 0
): void {
  for (const rawPart of splitTopLevel(body)) {
    const part = rawPart.trim();
    if (!part) continue;

    const open = part.indexOf("(");
    if (open >= 0) {
      // An embedded relation: `[alias:]table[!hint] ( body )`
      const head = part.slice(0, open).trim();
      const close = part.lastIndexOf(")");
      const inner = close > open ? part.slice(open + 1, close) : "";

      let name = head.includes(":") ? head.split(":").pop()!.trim() : head;
      name = name.split("!")[0].trim();
      if (!/^\w+$/.test(name)) continue;

      // An embed names EITHER a table or a foreign-key column on the parent.
      // `profiles:invited_by ( full_name )` is the second form — valid, and
      // resolvable to `profiles` through the generated Relationships block.
      const target = rowColumns(name) ? name : fkTarget(table, name);

      // Neither a table nor an FK on the parent: the query fails exactly as it
      // would for a phantom column. Silently skipping this is how
      // `modifier:modifiers ( name )` — no such table; the value lives on
      // order_item_modifiers.name_snapshot — survived in the driver
      // stop-detail page until this guard reported it.
      if (!target) {
        onUnknownRelation(name);
        continue;
      }
      walkSelectBody(inner, target, emit, onUnknownRelation, depth + 1);
      continue;
    }

    let col = part;
    if (col.includes(":")) col = col.split(":").pop()!.trim(); // alias:column
    col = col.replace(/->.*$/, "").replace(/::.*$/, "").trim(); // json path / cast
    if (!col || col === "*" || !/^\w+$/.test(col)) continue;
    // PostgREST aggregates are not columns: `route_stops (count)` asks for the
    // number of related rows, and is valid against any table.
    if (AGGREGATES.has(col)) continue;
    emit(table, col, depth);
  }
}

/** PostgREST aggregate functions usable in place of a column name. */
const AGGREGATES = new Set(["count", "sum", "avg", "min", "max"]);

// Every PostgREST filter that takes a column name as its first argument.
// `.not()` alone covers 10 live call sites; it was missing from the first pass.
const FILTER_CALL =
  /\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in|not|filter|match|contains|containedBy|overlaps|textSearch|rangeGt|rangeGte|rangeLt|rangeLte|rangeAdjacent|order)\(\s*"([\w.]+)"([^)]*)\)/g;

// A `.select(...)` whose argument is NOT a string literal — its columns cannot
// be read from source. Counted, not validated.
const NON_LITERAL_SELECT = /\.select\(\s*(?!["'`])[A-Za-z_$]/g;

const refs: Ref[] = [];
const unknownRelations: string[] = [];
let nonLiteralSelects = 0;
let selectCalls = 0;

for (const file of sourceFiles(join(ROOT, "src"))) {
  const source = stripComments(readFileSync(file, "utf8"));
  const rel = file.replace(`${ROOT}/`, "");

  for (const { table, source: kind, chunk, offset } of queryChunks(source)) {
    nonLiteralSelects += [...chunk.matchAll(NON_LITERAL_SELECT)].length;

    for (const m of chunk.matchAll(/\.select\(\s*(["'`])([\s\S]*?)\1/g)) {
      selectCalls++;
      const line = source.slice(0, offset + m.index).split("\n").length;
      walkSelectBody(
        m[2],
        table,
        (t, column, depth) =>
          refs.push({
            file: rel,
            line,
            table: t,
            column,
            // An EMBEDDED relation is a real table whatever the head was, so a
            // nested column resolves against the table even under `.rpc(`.
            // Only depth-0 columns belong to the function's Returns shape.
            // Without this, `.rpc(f).select("*, profiles(full_name)")` — which
            // PostgREST allows on a RETURNS SETOF function — would look
            // `profiles` up as a FUNCTION, get null, and fail the
            // "resolves every queried table" assertion as an unknown table.
            // Latent today: no rpc chunk contains a select.
            source: (depth ?? 0) > 0 ? "table" : kind,
            kind: "select",
            depth,
          }),
        (name) => unknownRelations.push(`${name} — ${rel}:${line}`)
      );
    }

    for (const m of chunk.matchAll(FILTER_CALL)) {
      const [, method, column, args] = m;
      if (column.includes(".")) continue; // embedded-relation path
      if (/referencedTable|foreignTable/.test(args)) continue; // orders the relation
      refs.push({
        file: rel,
        line: source.slice(0, offset + m.index).split("\n").length,
        table,
        column,
        kind: "filter",
        source: kind,
        method,
      });
    }
  }
}

const SELECT_REFS = refs.filter((r) => r.kind === "select");
const FILTER_REFS = refs.filter((r) => r.kind === "filter");

describe("every queried column exists in the generated schema", () => {
  /**
   * Floors sized just under the real counts, NOT at a comfortable margin.
   *
   * Loose floors are not a canary. With >300/>900/>500 against actual
   * 473/1283/782, a `.from("x")` → `.from(TABLES.x)` refactor of the driver and
   * cron trees could hide 139 selects and 382 columns — the whole subsystem
   * #230's guard was written for — and still report green. These sit ~3% under
   * today's numbers so any real loss of coverage trips them.
   */
  it("parses essentially every query in the repo — losing coverage must fail here", () => {
    // IF YOU ARE READING THIS BECAUSE CI FAILED HERE: this is not necessarily a
    // bug. These floors sit ~3% under the real counts so a parser regression
    // (or a refactor that hides queries from it, e.g. `.from(TABLES.x)`) cannot
    // pass silently. If you DELIBERATELY reduced the number of queries — deleted
    // a feature, consolidated call sites — then nothing is broken: re-pin the
    // numbers to the new reality and say so in the PR. What you must not do is
    // lower them to make a red build green without checking which queries
    // disappeared, because that is exactly the failure this guards against.
    const reBaseline = "if you intentionally reduced query count, re-pin this floor";
    expect(selectCalls, `select calls parsed — ${reBaseline}`).toBeGreaterThan(455);
    expect(SELECT_REFS.length, `select columns validated — ${reBaseline}`).toBeGreaterThan(1750);
    expect(FILTER_REFS.length, `filter columns validated — ${reBaseline}`).toBeGreaterThan(770);
  });

  it("validates columns inside embedded relations, not just top-level ones", () => {
    // 25% of selected columns live inside `relation ( … )` bodies. The first
    // version of this guard discarded them all, so a phantom planted inside
    // `addresses ( … )` — in the loader this very PR fixes — read as green.
    const nested = SELECT_REFS.filter((r) => (r.depth ?? 0) > 0);
    expect(nested.length, "no columns resolved inside embedded relations").toBeGreaterThan(505);
    expect(
      nested.filter((r) => (r.depth ?? 0) > 1).length,
      "nothing resolved beyond one level of nesting — relations nest several deep here"
    ).toBeGreaterThan(175);
    expect(
      [...new Set(SELECT_REFS.map((r) => r.table))].length,
      "selects resolved against too few distinct tables"
    ).toBeGreaterThan(30);
  });

  it("resolves a function's columns without absorbing its SetofOptions", () => {
    // The generated types emit SetofOptions for every RETURNS SETOF function,
    // and its keys share the 10-space indent of the real columns. Unbounded,
    // the scan adopted them and a phantom filter on `isSetofReturn` would have
    // read as valid — quietly weakening the precision this guard exists for.
    const cols = rpcReturnColumns("get_driver_stats_admin");

    expect(cols, "get_driver_stats_admin has no resolvable Returns shape").toBeTruthy();
    expect(
      [...cols!].filter((c) => ["from", "to", "isOneToOne", "isSetofReturn"].includes(c))
    ).toEqual([]);
    expect(cols!.has("driver_id"), "lost a real column while excluding SetofOptions").toBe(true);
    expect(cols!.has("is_active")).toBe(true);
  });

  it("resolves every queried table in database.generated.ts", () => {
    const unknown = [...new Map(refs.map((r) => [`${r.source}:${r.table}`, r])).values()]
      .filter((r) => !columnsFor(r))
      .map((r) => r.table);
    expect(
      unknown,
      `queried tables missing from database.generated.ts: ${unknown.join(", ")}. ` +
        `Either the table is misspelled, or a migration landed without a matching ` +
        `\`pnpm gen:types\`.`
    ).toEqual([]);
  });

  it("names no column that does not exist", () => {
    const phantom = refs
      .filter((r) => {
        const existing = columnsFor(r);
        return existing && !existing.has(r.column);
      })
      .map(
        (r) =>
          `${r.table}.${r.column} — ${r.file}:${r.line}` +
          (r.kind === "filter" ? ` (.${r.method})` : "")
      );

    expect(
      phantom,
      `These columns are named in a query but do not exist in database.generated.ts.\n` +
        `PostgREST rejects the entire query — for a filter column exactly as for a ` +
        `selected one — so the caller sees {data: null, error}, and any caller that ` +
        `reads only .data renders this as "no results" rather than as a failure. ` +
        `.returns<T>() CASTS past the generated types, so tsc cannot catch it and a ` +
        `green build proves nothing.\n\n` +
        phantom.map((p) => `  ${p}`).join("\n")
    ).toEqual([]);
  });

  it("embeds no relation whose table does not exist", () => {
    expect(
      [...new Set(unknownRelations)],
      `These embedded relations name a table that is not in database.generated.ts. ` +
        `PostgREST rejects the whole query, exactly as for a phantom column.\n\n` +
        [...new Set(unknownRelations)].map((r) => `  ${r}`).join("\n")
    ).toEqual([]);
  });

  it("pins how many selects are built from a variable and therefore unguarded", () => {
    // `.select(selectStr)` can't be read from source. That's a real gap, so it
    // is counted rather than ignored: adding one becomes a deliberate act with
    // a failing test attached, not a silent hole.
    expect(
      nonLiteralSelects,
      `A .select() built from a variable cannot be validated by this guard. If you ` +
        `added one, prefer an inline string literal; if it must stay dynamic, raise ` +
        `this number and say why in the PR.`
    ).toBeLessThanOrEqual(1);
  });
});
