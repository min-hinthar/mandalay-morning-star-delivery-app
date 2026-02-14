# Phase 58: Deployment Verification - Research

**Researched:** 2026-02-13
**Domain:** Production health endpoint, environment validation, service connectivity
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Check three services: Supabase, Stripe, Resend
- Two-tier health check: quick config-presence check by default, `?deep=true` for live connectivity tests (actually call each service)
- Response includes a top-level `production_ready: true/false` flag summarizing all checks
- Health endpoint also verifies auth/callback route and Stripe webhook route are reachable and configured
- Reports missing env var names (not values) when config is incomplete
- Full error details exposed when a service is down (error message and type visible in response)
- Sensitive values (API keys, connection strings) should be redacted -- show error type, mask credentials
- Publicly accessible at `/api/health` -- no authentication required (standard for uptime monitors)
- CORS: allow all origins (monitoring dashboards can call it from browsers)
- Main domain path only: `delivery.mandalaymorningstar.com/api/health` -- no custom subdomain
- Exclude from service worker caching and analytics
- Same env vars across all Vercel scopes (preview, production, development)
- Health endpoint reports which env vars are missing by name
- Both automated detection (health endpoint) and manual checklist for initial Vercel setup
- Health endpoint verifies auth/callback and webhook routes are reachable (not 404)
- Included as part of the health check response, not separate endpoints

### Claude's Discretion
- Response format (JSON structure, field naming)
- Timeout per service check
- Status levels (healthy/degraded/down vs binary)
- Whether to include version/commit hash
- Parallel vs sequential service checks
- Logging/alerting behavior on failure
- Caching strategy for rapid polling
- Rate limiting strategy
- Sensitive value redaction approach
- Zod schema vs presence-only env var validation
- Criticality tiers for env vars (which block start vs warn)
- .env.example template creation
- Separate /api/health/env endpoint vs unified
- Resend check depth (API key, domain verification, or just env var)
- Supabase auth config validation depth
- Stripe webhook signing secret verification depth

### Deferred Ideas (OUT OF SCOPE)
- Uptime monitoring service integration (BetterUptime, UptimeRobot) -- Phase 59 scope
- Full OAuth redirect URL configuration -- Phase 62 scope
- Stripe webhook signing secret configuration -- Phase 62 scope
- Resend domain DNS setup (SPF/DKIM/DMARC) -- Phase 62 scope
</user_constraints>

## Summary

This phase builds a `/api/health` endpoint in the existing Next.js 16 App Router API structure. The endpoint performs two tiers of checks: a quick config-presence check (default) and a deep connectivity check (`?deep=true`). Three services are validated: Supabase (via `supabase.from().select()`), Stripe (via `stripe.balance.retrieve()`), and Resend (via `resend.domains.list()`). The endpoint also verifies that auth/callback and webhook routes are reachable by performing internal fetch calls to check they don't return 404.

The project already has well-established patterns for API routes, service clients (lazy-init singletons in `src/lib/`), structured logging via `logger`, and Zod-based validation. The health endpoint follows these patterns exactly. No new dependencies are needed -- everything uses existing `@supabase/supabase-js`, `stripe`, and `resend` packages already in `package.json`.

**Primary recommendation:** Build a single `src/app/api/health/route.ts` file with GET handler. Use `Promise.allSettled()` for parallel deep checks with per-service timeouts. Return three-level status per service (`healthy`/`degraded`/`down`) plus a top-level `production_ready` boolean. Add CORS headers via `next.config.ts` `headers()`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.2 | API route handler at `/api/health` | Already in project; native route handlers |
| `@supabase/supabase-js` | 2.90.1 | Supabase connectivity check | Already in project at `src/lib/supabase/server.ts` |
| `stripe` | 20.1.2 | Stripe connectivity check | Already in project at `src/lib/stripe/server.ts` |
| `resend` | 6.9.1 | Resend connectivity check | Already in project at `src/lib/email/client.ts` |
| `zod` | 4.3.5 | Env var schema validation | Already in project; consistent with all validations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sentry/nextjs` | 10.34.0 | Logger integration (breadcrumbs) | Already integrated via `src/lib/utils/logger.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom health endpoint | `next-health` npm package | Unnecessary dep -- the endpoint is simple enough to hand-write |
| Zod env validation | `@t3-oss/env-nextjs` | Good library but overkill -- we only need presence checks, not full env schema |

**Installation:**
```bash
# No new packages needed -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/api/health/
│   └── route.ts         # GET handler with ?deep=true support
├── lib/
│   ├── health/
│   │   ├── index.ts     # Barrel re-exports
│   │   ├── checks.ts    # Service check functions (supabase, stripe, resend, routes)
│   │   ├── env.ts       # Env var validation schema and checker
│   │   └── types.ts     # HealthResponse, ServiceStatus types
│   ├── supabase/server.ts  # Existing -- createPublicClient() for health checks
│   ├── stripe/server.ts    # Existing -- stripe proxy for balance.retrieve()
│   └── email/client.ts     # Existing -- getResendClient() for domains.list()
```

### Pattern 1: Two-Tier Health Check
**What:** Default GET returns config-presence checks only (fast, ~10ms). `?deep=true` performs actual API calls to each service.
**When to use:** Always -- uptime monitors call the default (fast); operators use `?deep=true` for debugging.
**Example:**
```typescript
// Source: Codebase pattern from existing API routes
export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get("deep") === "true";

  // Config presence check (always runs)
  const envStatus = checkEnvVars();

  // Deep connectivity check (only on ?deep=true)
  let serviceStatus: ServiceCheckResult[];
  if (deep) {
    serviceStatus = await Promise.allSettled([
      checkSupabase(),
      checkStripe(),
      checkResend(),
      checkRoutes(request),
    ]);
  }

  return NextResponse.json(buildResponse(envStatus, serviceStatus), {
    status: allHealthy ? 200 : 503,
    headers: corsHeaders,
  });
}
```

### Pattern 2: Promise.allSettled for Parallel Deep Checks
**What:** Run all service checks in parallel. If one fails, others still complete. Each has its own timeout via `AbortSignal.timeout()`.
**When to use:** Deep check mode -- prevents one slow service from blocking the entire response.
**Example:**
```typescript
// Source: Standard Node.js pattern
async function checkSupabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabase = createPublicClient();
    const { error } = await supabase
      .from("app_settings")
      .select("key")
      .limit(1)
      .abortSignal(AbortSignal.timeout(5000));

    return {
      service: "supabase",
      status: error ? "degraded" : "healthy",
      latencyMs: Date.now() - start,
      error: error?.message,
    };
  } catch (err) {
    return {
      service: "supabase",
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
```

### Pattern 3: Internal Route Reachability Check
**What:** Use `fetch()` with HEAD method against internal routes to verify auth/callback and webhook endpoints return non-404 status.
**When to use:** Verifying that routes are deployed and not accidentally removed.
**Example:**
```typescript
// Source: Standard Next.js internal fetch pattern
async function checkRoutes(request: NextRequest): Promise<RouteCheck[]> {
  const origin = request.nextUrl.origin;
  const routes = [
    { path: "/auth/callback", name: "auth_callback" },
    { path: "/api/webhooks/stripe", name: "stripe_webhook" },
  ];

  return Promise.all(routes.map(async ({ path, name }) => {
    try {
      const res = await fetch(`${origin}${path}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      return {
        route: name,
        path,
        reachable: res.status !== 404,
        statusCode: res.status,
      };
    } catch {
      return { route: name, path, reachable: false, statusCode: 0 };
    }
  }));
}
```

### Pattern 4: Three-Level Service Status
**What:** Use `healthy` / `degraded` / `down` instead of binary. `degraded` means config is present but connectivity check failed with a non-fatal error. `down` means missing config or hard failure.
**When to use:** Provides actionable granularity for operators.

### Pattern 5: CORS via next.config.ts headers()
**What:** Add CORS headers for `/api/health` in the existing `headers()` function in `next.config.ts`.
**When to use:** Simpler and more maintainable than setting headers in the route handler. Already established pattern in the codebase.
**Example:**
```typescript
// Source: next.config.ts existing pattern
async headers() {
  return [
    // ... existing font/icon headers
    {
      source: "/api/health",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
      ],
    },
  ];
},
```

### Anti-Patterns to Avoid
- **Exposing env var values:** Never include actual API keys, connection strings, or secrets in the response. Report presence (`configured: true/false`) and names of missing vars only.
- **Blocking deep checks:** Don't run service checks sequentially -- use `Promise.allSettled()` with per-service timeouts.
- **Auth/callback self-fetch loops:** The route check fetches `/auth/callback` which may redirect. Use HEAD method and check for non-404 status, not for 200.
- **Caching health responses:** Health endpoints must always return fresh data. Set `Cache-Control: no-store`.
- **Using service role key for health checks:** Use the anon key / public client for Supabase health checks. Service role bypasses RLS and is more privileged than needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supabase connectivity | Custom REST call to Supabase API | `createPublicClient().from("app_settings").select("key").limit(1)` | Already have the client; `app_settings` table exists in project |
| Stripe connectivity | Custom HTTP to Stripe API | `stripe.balance.retrieve()` | Simplest Stripe API call, no parameters needed, validates auth |
| Resend connectivity | Custom HTTP to Resend API | `resend.domains.list()` | Validates API key and connectivity in one call |
| Timeout management | Manual setTimeout/race | `AbortSignal.timeout(5000)` | Native API, supported in Node.js 18+, Supabase client accepts it |
| CORS headers | Middleware or per-route | `next.config.ts headers()` | Already established pattern in codebase |

**Key insight:** All three service clients already exist in the codebase with proper singleton/lazy-init patterns. The health endpoint just calls them in a controlled way with timeouts and error handling.

## Common Pitfalls

### Pitfall 1: Auth Callback Route Returns Redirect, Not 200
**What goes wrong:** Fetching `/auth/callback` without a code param returns a 302 redirect to `/login`, not 200. Treating non-200 as "unreachable" would be incorrect.
**Why it happens:** The auth callback route expects OAuth code/token parameters and redirects when they're missing.
**How to avoid:** Check for non-404 status only. A 302 redirect means the route exists and is working correctly.
**Warning signs:** Route check reports auth/callback as "down" when it's actually healthy.

### Pitfall 2: Stripe Webhook Route Requires POST
**What goes wrong:** HEAD/GET request to `/api/webhooks/stripe` returns 405 Method Not Allowed because it only exports `POST`.
**Why it happens:** Next.js returns 405 for unsupported methods on API routes.
**How to avoid:** Accept 405 as "reachable" -- it confirms the route handler is deployed. Only 404 means the route is missing.
**Warning signs:** Route check reports webhook as "down" when actually it's deployed.

### Pitfall 3: Deep Checks Causing Cold Start Cascades on Vercel
**What goes wrong:** On Vercel serverless, each service check might trigger cold starts for the target routes, causing slow response times.
**Why it happens:** Serverless functions spin down after inactivity.
**How to avoid:** Set reasonable timeouts (5s per service, 15s overall). Internal route checks to same-origin routes share the same function if they're part of the health check request.
**Warning signs:** Health endpoint response time >10s on first call.

### Pitfall 4: Rate Limiting on Deep Checks
**What goes wrong:** Aggressive uptime monitoring (every 30s) with `?deep=true` burns through Stripe/Resend API quotas.
**Why it happens:** `balance.retrieve()` and `domains.list()` count against API rate limits.
**How to avoid:** Add simple in-memory cache (30s TTL) for deep check results. Uptime monitors should poll default (config-only) check, not deep check. Document this for Phase 59.
**Warning signs:** 429 responses from Stripe/Resend APIs.

### Pitfall 5: Missing Env Vars Crash the Health Endpoint
**What goes wrong:** Service clients throw on missing env vars before the health check can report them gracefully.
**Why it happens:** `getStripe()` throws if `STRIPE_SECRET_KEY` is unset. `getResendClient()` throws if `RESEND_API_KEY` is unset.
**How to avoid:** Wrap client instantiation in try/catch. For the config-only check, validate env var presence directly via `process.env` without instantiating clients.
**Warning signs:** Health endpoint returns 500 instead of a structured degraded/down response.

### Pitfall 6: Service Worker Caching Health Responses
**What goes wrong:** Cached health response returns stale data.
**Why it happens:** Service worker matches the request.
**How to avoid:** The current SW config in `src/app/sw.ts` only caches specific matchers (external images, menu API, static assets). `/api/health` does not match any of these, so it is already excluded by default. Set `Cache-Control: no-store` header as additional protection.
**Warning signs:** Health response doesn't change after fixing an issue.

## Code Examples

Verified patterns from official sources and existing codebase:

### Health Endpoint Response Structure (Recommended)
```typescript
// Recommended JSON response format
interface HealthResponse {
  status: "healthy" | "degraded" | "down";
  production_ready: boolean;
  timestamp: string;
  version: string;        // From package.json or NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  environment: string;    // "production" | "preview" | "development"

  services: {
    supabase: ServiceStatus;
    stripe: ServiceStatus;
    resend: ServiceStatus;
  };

  routes: {
    auth_callback: RouteStatus;
    stripe_webhook: RouteStatus;
  };

  env: {
    configured: number;    // Count of configured vars
    missing: string[];     // Names of missing vars (never values)
    total: number;         // Total required vars
  };
}

interface ServiceStatus {
  status: "healthy" | "degraded" | "down";
  configured: boolean;     // Env vars present
  connected?: boolean;     // Deep check result (only with ?deep=true)
  latency_ms?: number;     // Deep check latency
  error?: string;          // Error message (redacted of secrets)
}

interface RouteStatus {
  path: string;
  reachable: boolean;
  status_code?: number;    // Only with ?deep=true
}
```

### Env Var Validation with Zod
```typescript
// Source: Codebase pattern (src/lib/validations/*.ts use Zod)
import { z } from "zod";

const requiredEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  // Resend
  RESEND_API_KEY: z.string().startsWith("re_"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: z.string().url(),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().min(1),

  // Cron
  CRON_SECRET: z.string().min(1),
});

type EnvCheckResult = {
  configured: number;
  missing: string[];
  total: number;
};

function checkEnvVars(): EnvCheckResult {
  const result = requiredEnvSchema.safeParse(process.env);
  const total = Object.keys(requiredEnvSchema.shape).length;

  if (result.success) {
    return { configured: total, missing: [], total };
  }

  // Extract missing var names from Zod errors
  const missing = result.error.issues
    .map((issue) => issue.path[0] as string)
    .filter(Boolean);

  return {
    configured: total - missing.length,
    missing,
    total,
  };
}
```

### Supabase Deep Check
```typescript
// Source: Existing codebase pattern (src/lib/supabase/server.ts createPublicClient)
import { createPublicClient } from "@/lib/supabase/server";

async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const client = createPublicClient();
    const { error } = await client
      .from("app_settings")
      .select("key")
      .limit(1);

    return {
      service: "supabase",
      status: error ? "degraded" : "healthy",
      connected: !error,
      latency_ms: Date.now() - start,
      error: error?.message,
    };
  } catch (err) {
    return {
      service: "supabase",
      status: "down",
      connected: false,
      latency_ms: Date.now() - start,
      error: redactSecrets(err instanceof Error ? err.message : "Connection failed"),
    };
  }
}
```

### Stripe Deep Check
```typescript
// Source: Stripe API docs -- balance.retrieve() is simplest call
// https://docs.stripe.com/api/balance/balance_retrieve
import { stripe } from "@/lib/stripe/server";

async function checkStripe(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await stripe.balance.retrieve();
    return {
      service: "stripe",
      status: "healthy",
      connected: true,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      service: "stripe",
      status: "down",
      connected: false,
      latency_ms: Date.now() - start,
      error: redactSecrets(err instanceof Error ? err.message : "Connection failed"),
    };
  }
}
```

### Resend Deep Check
```typescript
// Source: Resend API docs -- domains.list() validates key + connectivity
// https://resend.com/docs/api-reference/domains/list-domains
import { getResendClient } from "@/lib/email/client";

async function checkResend(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const resend = getResendClient();
    const { error } = await resend.domains.list();
    return {
      service: "resend",
      status: error ? "degraded" : "healthy",
      connected: !error,
      latency_ms: Date.now() - start,
      error: error?.message,
    };
  } catch (err) {
    return {
      service: "resend",
      status: "down",
      connected: false,
      latency_ms: Date.now() - start,
      error: redactSecrets(err instanceof Error ? err.message : "Connection failed"),
    };
  }
}
```

### Secret Redaction Helper
```typescript
function redactSecrets(message: string): string {
  return message
    // Redact API keys (sk_live_xxx, pk_live_xxx, re_xxx, whsec_xxx)
    .replace(/(sk_(?:live|test)_)[a-zA-Z0-9]+/g, "$1***")
    .replace(/(pk_(?:live|test)_)[a-zA-Z0-9]+/g, "$1***")
    .replace(/(re_)[a-zA-Z0-9]+/g, "$1***")
    .replace(/(whsec_)[a-zA-Z0-9]+/g, "$1***")
    // Redact JWT tokens (eyJ...)
    .replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "eyJ***")
    // Redact URLs with credentials
    .replace(/(https?:\/\/)[^:]+:[^@]+@/g, "$1***:***@");
}
```

## Recommendations for Discretion Areas

### Response Format
Use the `HealthResponse` interface documented above. snake_case field names for JSON consistency with Supabase/Stripe conventions. Include `timestamp`, `version` (from `process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "dev"`), and `environment` (`process.env.VERCEL_ENV || "development"`).

### Timeout per Service Check
5 seconds per service. 15 seconds overall via `AbortSignal.timeout()`. Vercel serverless functions have a 10s default timeout (extendable to 60s on Pro), so 5s per check with parallel execution stays well within limits.

### Status Levels
Use three levels: `healthy` / `degraded` / `down`. Top-level status is the worst of all individual statuses. `production_ready` is `true` only when all services are `healthy` and all env vars configured.

### Version/Commit Hash
Include `version` field using Vercel's auto-injected `VERCEL_GIT_COMMIT_SHA` env var (available on all Vercel deployments without configuration). Fallback to `"dev"` locally.

### Parallel vs Sequential
Parallel via `Promise.allSettled()`. Each check is independent; no reason to serialize them.

### Caching Strategy for Rapid Polling
30-second in-memory cache for deep check results. Config-only checks are cheap enough to skip caching. Use a module-level `Map` with TTL, similar to the existing rate limit pattern in `src/lib/utils/rate-limit.ts`.

### Rate Limiting
None for config-only checks (extremely cheap). For deep checks, the 30s cache effectively rate-limits to ~2 deep checks/minute per serverless instance. Vercel's edge caching won't cache `no-store` responses, so polling is fine.

### Env Var Criticality Tiers
- **Critical (block `production_ready`):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`
- **Important (warn, don't block):** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

### .env.example Update
The existing `.env.example` already lists all required variables with documentation. No changes needed -- it's comprehensive.

### Unified vs Separate Endpoints
Single `/api/health` endpoint. No need for separate `/api/health/env` -- the env check is fast and always included in the main response.

### Resend Check Depth
`domains.list()` for deep check. Validates API key authentication and network connectivity. Don't verify domain DNS (deferred to Phase 62).

### Supabase Check Depth
`from("app_settings").select("key").limit(1)` for deep check. Tests database connectivity and anon key validity. The `app_settings` table already exists (used by email kill switch). Don't validate auth config depth (Phase 62).

### Stripe Check Depth
`balance.retrieve()` for deep check. Simplest Stripe API call -- no parameters, validates secret key. Don't verify webhook signing secret (Phase 62 scope).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API route in `pages/api/` | Route Handler in `app/api/` | Next.js 13+ (2023) | Use `route.ts` with named exports |
| `setTimeout` + `Promise.race` for timeouts | `AbortSignal.timeout()` | Node.js 18 (2022) | Cleaner timeout management |
| `cors` npm package | `next.config.ts headers()` or inline headers | Next.js 13+ | No external dependency needed |
| `process.env` manual checks | Zod schema validation | Established pattern | Type-safe, reports all missing at once |

**Deprecated/outdated:**
- `pages/api/` directory: This project uses App Router exclusively
- `cors` npm package: Unnecessary with Next.js built-in header support
- `next-health` npm package: Adds dependency for trivial functionality

## Open Questions

1. **Vercel Function Timeout Configuration**
   - What we know: Default is 10s for Hobby, 60s max for Pro. The app is deployed on Vercel.
   - What's unclear: Which Vercel plan this project uses.
   - Recommendation: 5s per-service timeout works on all plans. No action needed unless deep checks exceed 10s total.

2. **`app_settings` Table Availability**
   - What we know: The table exists (used by email kill switch in `src/lib/email/send.ts`). The public client (anon key) needs SELECT permission.
   - What's unclear: Whether RLS policies allow anon-key SELECT on `app_settings`.
   - Recommendation: Test the query. If RLS blocks it, use a simpler check like `supabase.auth.getSession()` (returns null session for anon, but confirms connectivity).

3. **Route Reachability from Same Serverless Function**
   - What we know: On Vercel, fetching internal routes from the same function works.
   - What's unclear: Whether internal fetch to `localhost` or the public domain is needed.
   - Recommendation: Use `request.nextUrl.origin` to get the correct domain. This resolves correctly on Vercel.

## Sources

### Primary (HIGH confidence)
- Next.js official docs -- Route Handler CORS configuration: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js official docs -- headers() configuration: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- Stripe API Reference -- balance.retrieve(): https://docs.stripe.com/api/balance/balance_retrieve
- Resend API Reference -- domains.list(): https://resend.com/docs/api-reference/domains/list-domains
- Codebase analysis -- existing service clients, patterns, env vars (direct file reads)

### Secondary (MEDIUM confidence)
- Resend GitHub Issue #138 -- health check discussion: https://github.com/resend/resend-node/issues/138
- Hyperping blog -- Next.js health check patterns: https://hyperping.com/blog/nextjs-health-check-endpoint
- Vercel CORS KB -- enabling CORS: https://vercel.com/kb/guide/how-to-enable-cors

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, verified via package.json and source files
- Architecture: HIGH -- follows existing API route patterns in codebase, verified via Next.js docs
- Pitfalls: HIGH -- identified from codebase analysis (auth callback redirect behavior, webhook POST-only, SW matcher list)
- Deep check APIs: HIGH -- `stripe.balance.retrieve()` and `resend.domains.list()` verified via official API docs

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (stable domain -- no fast-moving APIs)
