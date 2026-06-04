#!/usr/bin/env node
/**
 * Generate src/types/database.generated.ts from the LOCAL Supabase stack,
 * prepending the "do not edit" header and prettier-formatting the body. Keeping
 * the header here (rather than letting the raw CLI output land headerless) means
 * the committed file always carries the banner that database.ts + the drift
 * guard reference. The drift guard (check-types-drift.mjs) strips the same
 * header before comparing, so the two stay in lock-step.
 *
 * Requires `supabase db start` to be running (local Docker). No prod creds.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve("src/types/database.generated.ts");
const HEADER = `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`pnpm gen:types\` to regenerate from the Supabase schema.
 * App-level custom aliases live in ./database-custom.ts.
 */
`;

const raw = execFileSync(
  "pnpm",
  ["exec", "supabase", "gen", "types", "typescript", "--local", "--schema", "public"],
  { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
);

const formatted = execFileSync("pnpm", ["exec", "prettier", "--parser", "typescript"], {
  input: raw,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});

writeFileSync(OUT, HEADER + formatted);
console.log(`✅ Wrote ${OUT}`);
