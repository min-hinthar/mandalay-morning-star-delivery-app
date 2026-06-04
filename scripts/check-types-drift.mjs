#!/usr/bin/env node
/**
 * Schema-drift guard.
 *
 * Regenerates the Supabase types from the LOCAL stack and compares them to the
 * committed src/types/database.generated.ts. Fails if they differ — meaning a
 * migration changed the schema but the generated types weren't regenerated
 * (the class of bug that broke two crons when profiles.notification_prefs
 * drifted). Run in CI after `supabase db start` + migrations are applied.
 *
 * No production credentials: generates from the local DB (`--local`).
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const COMMITTED = resolve("src/types/database.generated.ts");
const HEADER = `/**
 * GENERATED FILE — do not edit by hand.
 * Run \`pnpm gen:types\` to regenerate from the Supabase schema.
 * App-level custom aliases live in ./database-custom.ts.
 */
`;

/** Normalize for comparison: strip our hand-added header + trailing whitespace. */
function normalize(src) {
  return src.replace(HEADER, "").replace(/\s+$/g, "").trim();
}

function fail(msg) {
  console.error(`\n❌ DB type drift: ${msg}\n`);
  console.error("   The committed generated types don't match the migrations.");
  console.error("   Fix: apply migrations locally, run `pnpm gen:types`, commit the result.\n");
  process.exit(1);
}

let fresh;
try {
  fresh = execFileSync(
    "pnpm",
    ["exec", "supabase", "gen", "types", "typescript", "--local", "--schema", "public"],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
  );
} catch (err) {
  fail(
    `failed to generate types from the local stack — is \`supabase db start\` running?\n${err.message}`
  );
}

// Match the formatting `pnpm gen:types` applies (prettier) before comparing.
let formattedFresh;
try {
  formattedFresh = execFileSync("pnpm", ["exec", "prettier", "--parser", "typescript"], {
    input: fresh,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
} catch (err) {
  fail(`prettier failed on the freshly generated types\n${err.message}`);
}

const committed = readFileSync(COMMITTED, "utf8");

if (normalize(committed) !== normalize(formattedFresh)) {
  fail("committed src/types/database.generated.ts is out of date");
}

console.log("✅ DB types match the schema (no drift).");
