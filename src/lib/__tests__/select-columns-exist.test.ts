/**
 * Every column this app SELECTs must exist in the generated schema.
 *
 * This is the repo-wide generalization of the driver-dashboard guard added in
 * #230. That one pinned a single loader; this one scans all of `src/`, because
 * the same bug was sitting in the customer tracking path the whole time:
 *
 *   orders.cancelled_at, orders.cancellation_reason
 *
 * Neither column has ever existed — not in the baseline, not in any migration,
 * not in `database.generated.ts`. PostgREST rejects a select naming an unknown
 * column, so the WHOLE query failed, `fetchTrackingData` returned null, and
 * `orders/[id]/tracking/page.tsx` called `notFound()`. Every customer's order
 * tracking page 404'd, and the `/api/tracking/[orderId]` polling refresh died
 * with it.
 *
 * Nothing caught it, for the same reasons as #230:
 *   - `tsc` can't: these queries use `.returns<HandWrittenRow[]>()`, which
 *     CASTS past the generated `Database` types. The hand-written interface
 *     declared both phantom columns, so it type-checked perfectly.
 *   - `db-drift` can't: it compares the local schema to the generated types.
 *     Neither of them knows what the application selects.
 *
 * So the check has to live here: parse the real select strings out of the
 * source and hold them against the generated Row blocks.
 *
 * SCOPE — this catches phantom COLUMNS. It does not catch a hand-written
 * interface that names real columns with the wrong TYPE or nullability (e.g.
 * `rating_avg: number` where the schema says `number | null`). Only dropping
 * the `.returns<T>()` casts fixes that class; see the PR for why that is a
 * separate change.
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
 * Scan forward for the next 6-space-indented table instead, and let the caller
 * assert the result is non-empty.
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
 * Application sources only.
 *
 * Test files and stories are excluded: a mock or fixture may deliberately name
 * a column that does not exist, and failing the build for that would be a false
 * positive on code that never reaches PostgREST. Only queries that actually run
 * against the database are in scope.
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

interface Select {
  file: string;
  line: number;
  table: string;
  columns: string[];
}

// Matches EVERY .from(...) form, including `.from("x" as any)` and `.from(v)`,
// so a chunk boundary is never missed and columns cannot leak to a prior table.
const ANY_FROM = /\.from\(\s*(?:"(\w+)")?[^)]*\)/g;

/**
 * Split a file into one chunk per `.from(...)`, each running to the next one.
 *
 * Selects and filters both bind to the nearest preceding `.from(...)`, so this
 * is the single place that mapping is decided. Chunks whose table cannot be
 * read from the source are dropped rather than guessed: `.from(variable)` is
 * unknowable, and `.from("customer_feedback" as any)` names a table that is
 * deliberately absent from the generated types. Skipping the chunk (rather
 * than not matching it at all) is what stops its columns being attributed to
 * whatever `.from()` came before — four of seven initial false positives.
 */
function fromChunks(source: string): Array<{ table: string; chunk: string; offset: number }> {
  const froms = [...source.matchAll(ANY_FROM)];
  const out: Array<{ table: string; chunk: string; offset: number }> = [];

  for (let i = 0; i < froms.length; i++) {
    const table = froms[i][1];
    const start = froms[i].index;
    const end = i + 1 < froms.length ? froms[i + 1].index : source.length;
    if (!table) continue;
    out.push({ table, chunk: source.slice(start, end), offset: start });
  }
  return out;
}

/**
 * Every `.select(...)` belonging to a `.from("<table>")`, with its columns.
 *
 * Deliberately NOT anchored to `.select(` immediately following `.from(...)`.
 * That shape sees 418 of the 493 select calls in app code; chunking on `.from(`
 * sees 473. The extra 55 are mostly the `.update({...}).eq(...).select("id")`
 * verify-affected-rows pattern, whose columns are just as capable of being
 * phantom. It also matches how the filter scan below binds a column to a table,
 * so both checks share one definition of "which table does this belong to".
 *
 * Embedded relation selects (`addresses ( line_1, city )`) name a TABLE, not a
 * column on the parent, so the relation name and its parenthesised body are
 * both dropped — the body's columns belong to the joined table and would fail
 * against the parent's Row block.
 */
function selectsIn(source: string, file: string): Select[] {
  const out: Select[] = [];

  for (const { table, chunk, offset } of fromChunks(source)) {
    for (const m of chunk.matchAll(/\.select\(\s*(["'`])([\s\S]*?)\1/g)) {
      const raw = m[2];
      const line = source.slice(0, offset + m.index).split("\n").length;

      // Keep only depth-0 text, so nested relation bodies drop out entirely.
      let depth = 0;
      let topLevel = "";
      for (const ch of raw) {
        if (ch === "(") depth++;
        else if (ch === ")") depth--;
        else if (depth === 0) topLevel += ch;
      }

      // A token immediately before "(" is a relation name (optionally carrying
      // a !fk_name disambiguation hint), never a column.
      const relations = new Set([...raw.matchAll(/([\w!]+)\s*\(/g)].map((r) => r[1].split("!")[0]));

      const columns: string[] = [];
      for (const part of topLevel.split(",")) {
        let col = part.trim();
        if (!col || col === "*") continue;
        if (col.includes(":")) col = col.split(":").pop()!.trim(); // alias:column
        col = col.replace(/->.*$/, "").replace(/::.*$/, "").trim(); // json path / cast
        if (!col || !/^\w+$/.test(col)) continue;
        if (relations.has(col)) continue;
        columns.push(col);
      }

      out.push({ file: file.replace(`${ROOT}/`, ""), line, table, columns });
    }
  }
  return out;
}

const ALL_SELECTS = sourceFiles(join(ROOT, "src")).flatMap((f) =>
  selectsIn(readFileSync(f, "utf8"), f)
);

/**
 * Columns named in FILTERS — `.eq()`, `.order()`, `.in()`, and friends.
 *
 * PostgREST rejects an unknown column in a filter exactly as it rejects one in
 * a select, so a phantom `.eq("nope", x)` fails the whole query the same way.
 * #230's single-file guard checked these; the repo-wide version has to as well.
 *
 * Filters bind to the nearest preceding `.from(...)`, so the file is chunked on
 * `.from(` and each chunk's filters are held against that table. Two forms must
 * be excluded or this reports pure noise — both were live false positives the
 * first time this ran:
 *
 *   - `.order("stop_index", { referencedTable: "route_stops" })` orders the
 *     EMBEDDED relation, so the column belongs to route_stops, not the parent.
 *     (Verified load-bearing: dropping this exclusion false-positives on three
 *     legitimate call sites.)
 *   - `.from("customer_feedback" as any)` — a table deliberately cast past the
 *     generated types. It resolves to no Row block and is skipped rather than
 *     being attributed to whatever `.from()` came before it.
 */
interface Filter {
  file: string;
  line: number;
  table: string;
  column: string;
  method: string;
}

const FILTER_CALL =
  /\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in|contains|order)\(\s*"([\w.]+)"([^)]*)\)/g;
function filtersIn(source: string, file: string): Filter[] {
  const out: Filter[] = [];

  for (const { table, chunk, offset } of fromChunks(source)) {
    for (const m of chunk.matchAll(FILTER_CALL)) {
      const [, method, column, args] = m;
      if (column.includes(".")) continue; // embedded-relation path
      if (/referencedTable|foreignTable/.test(args)) continue; // orders the relation
      out.push({
        file: file.replace(`${ROOT}/`, ""),
        line: source.slice(0, offset + m.index).split("\n").length,
        table,
        column,
        method,
      });
    }
  }
  return out;
}

const ALL_FILTERS = sourceFiles(join(ROOT, "src")).flatMap((f) =>
  filtersIn(readFileSync(f, "utf8"), f)
);

describe("every selected column exists in the generated schema", () => {
  it("parses a realistic number of selects — a broken parser must not read as green", () => {
    // The whole guard is worthless if the regex silently stops matching, so
    // pin a floor well under today's count but far above zero.
    expect(ALL_SELECTS.length).toBeGreaterThan(300);
    expect(ALL_SELECTS.flatMap((s) => s.columns).length).toBeGreaterThan(900);
  });

  it("resolves every queried table in database.generated.ts", () => {
    const unknown = [...new Set(ALL_SELECTS.map((s) => s.table))].filter((t) => !rowColumns(t));
    expect(
      unknown,
      `queried tables missing from database.generated.ts: ${unknown.join(", ")}. ` +
        `Either the table is misspelled, or a migration landed without a matching ` +
        `\`pnpm gen:types\`.`
    ).toEqual([]);
  });

  it("names no column that does not exist", () => {
    const phantom: string[] = [];

    for (const { file, line, table, columns } of ALL_SELECTS) {
      const existing = rowColumns(table);
      if (!existing) continue; // reported by the test above

      for (const column of columns) {
        if (!existing.has(column)) phantom.push(`${table}.${column} — ${file}:${line}`);
      }
    }

    expect(
      phantom,
      `These columns are SELECTed but do not exist in database.generated.ts.\n` +
        `PostgREST rejects the entire query, so the caller sees {data: null, error} — ` +
        `and any caller that reads only .data renders this as "no results" rather than ` +
        `as a failure. .returns<T>() CASTS past the generated types, so tsc cannot ` +
        `catch it and a green build proves nothing.\n\n` +
        phantom.map((p) => `  ${p}`).join("\n")
    ).toEqual([]);
  });

  it("filters on no column that does not exist", () => {
    expect(ALL_FILTERS.length, "the filter parser stopped matching").toBeGreaterThan(500);

    const phantom: string[] = [];
    for (const { file, line, table, column, method } of ALL_FILTERS) {
      const existing = rowColumns(table);
      if (!existing) continue;
      if (!existing.has(column)) phantom.push(`${table}.${column} — ${file}:${line} (.${method})`);
    }

    expect(
      phantom,
      `These columns are used in a FILTER but do not exist in database.generated.ts.\n` +
        `PostgREST rejects an unknown filter column exactly as it rejects an unknown ` +
        `selected one — the whole query fails.\n\n` +
        phantom.map((p) => `  ${p}`).join("\n")
    ).toEqual([]);
  });
});
