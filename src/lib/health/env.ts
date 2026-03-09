import { z } from "zod";

import type { EnvCheckResult } from "./types";

// ===========================================
// Environment Variable Validation
// ===========================================

/**
 * Critical vars block production_ready if missing.
 */
const criticalVars = {
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  RESEND_API_KEY: z.string().startsWith("re_"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
} as const;

/**
 * Important vars warn but don't block production_ready.
 */
const importantVars = {
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  CRON_SECRET: z.string().min(1),
  GOOGLE_MAPS_API_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url(),
  SENTRY_AUTH_TOKEN: z.string().min(1),
  GOOGLE_SITE_VERIFICATION: z.string().min(1),
} as const;

const criticalSchema = z.object(criticalVars);
const fullSchema = z.object({ ...criticalVars, ...importantVars });

const TOTAL_KEYS = Object.keys({ ...criticalVars, ...importantVars });

/**
 * Read env var using bracket notation to prevent Next.js static replacement.
 * Next.js replaces `process.env.KEY` at build time — if the var isn't set
 * during build, it becomes `undefined` in the bundle permanently.
 * Bracket notation (`process.env[key]`) is evaluated at runtime.
 */
function readEnv(key: string): string | undefined {
  return process.env[key];
}

/** Build runtime env snapshot for Zod validation. */
function getEnvSnapshot(): Record<string, string | undefined> {
  const snapshot: Record<string, string | undefined> = {};
  for (const key of TOTAL_KEYS) {
    snapshot[key] = readEnv(key);
  }
  return snapshot;
}

/**
 * Validate env var presence. Reports missing var names, never values.
 */
export function checkEnvVars(): EnvCheckResult {
  const env = getEnvSnapshot();
  const fullResult = fullSchema.safeParse(env);
  const criticalResult = criticalSchema.safeParse(env);

  const missing: string[] = [];

  if (!fullResult.success) {
    for (const issue of fullResult.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") {
        missing.push(key);
      }
    }
  }

  return {
    configured: TOTAL_KEYS.length - missing.length,
    missing,
    total: TOTAL_KEYS.length,
    all_critical_present: criticalResult.success,
  };
}
