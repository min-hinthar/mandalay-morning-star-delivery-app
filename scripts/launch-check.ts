#!/usr/bin/env tsx
/**
 * Launch readiness checker.
 * Validates environment variables, connectivity, and service health.
 *
 * Usage: pnpm launch:check
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local if present (for local dev testing)
function loadEnvFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // File not found -- ok
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

// ─── Types ────────────────────────────────────────────────────

type CheckStatus = "PASS" | "FAIL" | "WARN" | "SKIP";

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string;
}

// ─── Configuration ────────────────────────────────────────────

const REQUIRED_VARS: Array<{
  name: string;
  prefix?: string;
  description: string;
}> = [
  {
    name: "STRIPE_SECRET_KEY",
    prefix: "sk_live_",
    description: "Stripe live secret key",
  },
  {
    name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    prefix: "pk_live_",
    description: "Stripe live publishable key",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    description: "Supabase project URL",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Supabase service role key",
  },
  {
    name: "RESEND_API_KEY",
    description: "Resend email API key",
  },
  {
    name: "GOOGLE_MAPS_API_KEY",
    description: "Google Maps API key",
  },
  {
    name: "UPSTASH_REST_REDIS_URL",
    description: "Upstash Redis REST URL",
  },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    description: "Sentry DSN for error tracking",
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    description: "Production app URL",
  },
];

const OPTIONAL_VARS: Array<{
  name: string;
  default: string;
  description: string;
}> = [
  {
    name: "DELIVERY_TIMEZONE",
    default: "America/Los_Angeles",
    description: "Delivery timezone",
  },
];

// ─── Check Functions ──────────────────────────────────────────

function checkRequiredEnvVars(): CheckResult[] {
  return REQUIRED_VARS.map(({ name, prefix, description }) => {
    const value = process.env[name];

    if (!value) {
      return {
        name: `ENV: ${name}`,
        status: "FAIL" as const,
        details: `Missing - ${description}`,
      };
    }

    if (prefix && !value.startsWith(prefix)) {
      return {
        name: `ENV: ${name}`,
        status: "FAIL" as const,
        details: `Expected prefix "${prefix}", got "${value.slice(0, 10)}..."`,
      };
    }

    return {
      name: `ENV: ${name}`,
      status: "PASS" as const,
      details: `Set${prefix ? ` (${prefix}...)` : ""}`,
    };
  });
}

function checkOptionalEnvVars(): CheckResult[] {
  return OPTIONAL_VARS.map(({ name, default: defaultVal, description }) => {
    const value = process.env[name];

    if (!value) {
      return {
        name: `ENV: ${name}`,
        status: "WARN" as const,
        details: `Not set - using default "${defaultVal}" (${description})`,
      };
    }

    return {
      name: `ENV: ${name}`,
      status: "PASS" as const,
      details: `Set to "${value}"`,
    };
  });
}

async function checkHealthEndpoint(): Promise<CheckResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return {
      name: "CONNECTIVITY: Health endpoint",
      status: "SKIP",
      details: "NEXT_PUBLIC_APP_URL not set",
    };
  }

  try {
    const url = `${appUrl}/api/health?deep=true`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const body = await res.json();

    if (res.ok && body.production_ready) {
      return {
        name: "CONNECTIVITY: Health endpoint",
        status: "PASS",
        details: `${url} -> ${res.status}, production_ready=true`,
      };
    }

    return {
      name: "CONNECTIVITY: Health endpoint",
      status: "WARN",
      details: `${url} -> ${res.status}, production_ready=${body.production_ready ?? false}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: "CONNECTIVITY: Health endpoint",
      status: "WARN",
      details: `Could not reach health endpoint: ${message}`,
    };
  }
}

async function checkStripeConnectivity(): Promise<CheckResult> {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return {
      name: "CONNECTIVITY: Stripe API",
      status: "SKIP",
      details: "STRIPE_SECRET_KEY not set",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch("https://api.stripe.com/v1/customers?limit=1", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const isLive = key.startsWith("sk_live_");
      return {
        name: "CONNECTIVITY: Stripe API",
        status: "PASS",
        details: `Connected (${isLive ? "LIVE" : "TEST"} mode)`,
      };
    }

    return {
      name: "CONNECTIVITY: Stripe API",
      status: "FAIL",
      details: `Stripe returned ${res.status}: ${res.statusText}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: "CONNECTIVITY: Stripe API",
      status: "FAIL",
      details: `Could not reach Stripe: ${message}`,
    };
  }
}

async function checkRedisConnectivity(): Promise<CheckResult> {
  const url = process.env.UPSTASH_REST_REDIS_URL;

  if (!url) {
    return {
      name: "CONNECTIVITY: Upstash Redis",
      status: "SKIP",
      details: "UPSTASH_REST_REDIS_URL not set",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(`${url}/ping`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return {
        name: "CONNECTIVITY: Upstash Redis",
        status: "PASS",
        details: "Redis PING successful",
      };
    }

    return {
      name: "CONNECTIVITY: Upstash Redis",
      status: "FAIL",
      details: `Redis returned ${res.status}: ${res.statusText}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: "CONNECTIVITY: Upstash Redis",
      status: "FAIL",
      details: `Could not reach Redis: ${message}`,
    };
  }
}

// ─── Output ───────────────────────────────────────────────────

function printResults(results: CheckResult[]): void {
  const STATUS_ICONS: Record<CheckStatus, string> = {
    PASS: "PASS",
    FAIL: "FAIL",
    WARN: "WARN",
    SKIP: "SKIP",
  };

  const maxName = Math.max(...results.map((r) => r.name.length));

  console.log("\n=== Launch Readiness Check ===\n");
  console.log(`${"Check".padEnd(maxName)}  Status  Details`);
  console.log("-".repeat(maxName + 50));

  for (const r of results) {
    const icon = STATUS_ICONS[r.status];
    console.log(`${r.name.padEnd(maxName)}  [${icon}]  ${r.details}`);
  }

  const failCount = results.filter((r) => r.status === "FAIL").length;
  const warnCount = results.filter((r) => r.status === "WARN").length;
  const passCount = results.filter((r) => r.status === "PASS").length;
  const skipCount = results.filter((r) => r.status === "SKIP").length;

  console.log("\n" + "-".repeat(maxName + 50));
  console.log(`Total: ${passCount} PASS, ${failCount} FAIL, ${warnCount} WARN, ${skipCount} SKIP`);

  if (failCount > 0) {
    console.log(`\n${failCount} required check(s) FAILED. Fix before launching.\n`);
  } else {
    console.log("\nAll required checks passed.\n");
  }
}

// ─── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  const results: CheckResult[] = [];

  // Env var checks
  results.push(...checkRequiredEnvVars());
  results.push(...checkOptionalEnvVars());

  // Connectivity checks
  const [health, stripe, redis] = await Promise.all([
    checkHealthEndpoint(),
    checkStripeConnectivity(),
    checkRedisConnectivity(),
  ]);
  results.push(health, stripe, redis);

  printResults(results);

  const hasFails = results.some((r) => r.status === "FAIL");
  process.exit(hasFails ? 1 : 0);
}

main().catch((err) => {
  console.error("Launch check failed unexpectedly:", err);
  process.exit(2);
});
