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

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== "node_modules") sourceFiles(path, out);
    } else if (/\.tsx?$/.test(entry)) {
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

/**
 * Pull `.from("<table>").select("<cols>")` out of a source file.
 *
 * Handles the quoted and multi-line template forms, and a newline between
 * `.from(...)` and `.select(...)` — all three appear in this repo, and a
 * parser that understands only one silently skips the rest, which would gut
 * the guard while still reporting green.
 *
 * Embedded relation selects (`addresses ( line_1, city )`) name a TABLE, not a
 * column on the parent, so the relation name and its parenthesised body are
 * both dropped — the body's columns belong to the joined table and would fail
 * against the parent's Row block.
 */
function selectsIn(source: string, file: string): Select[] {
  const out: Select[] = [];
  const re = /\.from\(\s*"(\w+)"\s*\)\s*(?:\r?\n\s*)?\.select\(\s*(["'`])([\s\S]*?)\2/g;

  for (const m of source.matchAll(re)) {
    const [, table, , raw] = m;
    const line = source.slice(0, m.index).split("\n").length;

    // Keep only depth-0 text, so nested relation bodies drop out entirely.
    let depth = 0;
    let topLevel = "";
    for (const ch of raw) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (depth === 0) topLevel += ch;
    }

    // A token immediately before "(" is a relation name (optionally carrying a
    // !fk_name disambiguation hint), never a column.
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
  return out;
}

const ALL_SELECTS = sourceFiles(join(ROOT, "src")).flatMap((f) =>
  selectsIn(readFileSync(f, "utf8"), f)
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
});
