# Phase 69: Distributed Rate Limiting - Research

**Researched:** 2026-02-18
**Domain:** Upstash Redis rate limiting for Next.js 16 serverless on Vercel
**Confidence:** HIGH

## Summary

The project currently uses an in-memory `Map<string, RateLimitEntry>` in `src/lib/utils/rate-limit.ts` for auth endpoint rate limiting. This is fundamentally broken on Vercel because each serverless function invocation gets its own memory space -- the Map is never shared across instances. The existing rate limiter is only consumed via `checkRateLimit()` in `src/lib/supabase/actions.ts` (signIn + resend driver invite). The driver location route has its own DB-query-based rate limiting.

The Upstash ecosystem provides `@upstash/redis` (HTTP-based Redis client) and `@upstash/ratelimit` (rate limiting algorithms built on top). These are specifically designed for serverless/edge: connectionless, HTTP-based, no TCP socket pools. The library supports sliding window, fixed window, and token bucket algorithms with built-in ephemeral caching to reduce Redis roundtrips.

**Primary recommendation:** Replace the in-memory rate limiter with `@upstash/ratelimit` using sliding window algorithm. Create multiple named rate limiter instances (auth, api-write, api-read, driver-location) with per-route configuration via env vars. Apply rate limiting per-route (not middleware) since the project has no `middleware.ts` and different routes need very different policies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Auth endpoint limits: Claude's discretion (roadmap suggests 5/min signIn, 3/hr signUp as starting point)
- Limit key strategy: Claude's discretion (per-IP for unauthenticated, per-user for authenticated is expected)
- Per-route limit values: Claude's discretion -- set different limits based on expected traffic patterns per route
- Public menu/catalog endpoints: must be rate-limited (prevent scraping and bot abuse)
- Stripe webhook endpoint: exempt from all rate limiting
- Window algorithm (sliding vs fixed): Claude's discretion based on Upstash SDK capabilities
- Global per-IP fallback limit: Claude's discretion
- Role-based limit tiers: Claude's discretion
- Order creation limit: Claude's discretion (prevent double-orders)
- Supabase auth endpoint proxy-level limits: Claude's discretion (consider Supabase's built-in limits)
- Driver location update burst allowance: Claude's discretion
- Rate limit configuration values stored in **env vars** for tuning without redeploy
- User-facing feedback: **toast notification** ("Too many requests. Please wait a moment.")
- Order placement 429: **special reassuring message** ("Your order is being processed. Please don't submit again.")
- Rate limit headers (X-RateLimit-*): Claude's discretion on which responses include them
- Toast specificity (generic vs countdown): Claude's discretion
- JSON error body structure: Claude's discretion (match existing API response patterns)
- Client-side auto-retry on 429: Claude's discretion
- Progressive escalation (increasing cooldowns): Claude's discretion
- Login button disable + countdown on 429: Claude's discretion
- Admin bypass: Claude's discretion (full bypass or higher limits)
- Internal calls (Vercel cron, server-to-server): Claude's discretion
- Temporary per-user limit overrides: Claude's discretion
- External webhook exemptions beyond Stripe: Claude's discretion (check codebase for other inbound webhooks)
- Enforcement point (middleware vs per-route): Claude's discretion based on codebase architecture
- Cross-endpoint blocking on abuse: Claude's discretion
- IP blocklist: Claude's discretion
- In-memory fallback when Redis unavailable: Claude's discretion
- Redis health check approach: Claude's discretion (serverless context)
- Rate limit state persistence: **best effort** -- acceptable if Redis evicts counters
- Sentry integration for 429 events: Claude's discretion
- Admin dashboard rate limit stats: Claude's discretion
- Log verbosity (all checks vs 429s only): Claude's discretion
- Rate limit logs must include **user role** (customer/driver/admin/anon) for incident analysis
- Use **Vercel Analytics** for tracking 429 metrics over time (already tracks HTTP status codes)
- Automated alert: **yes** -- Sentry alert rule when 429 rate exceeds threshold in production
- Admin IP lookup tool: Claude's discretion
- Cost monitoring for Upstash usage: Claude's discretion
- Health endpoint for Redis connectivity: Claude's discretion
- Upstash Redis provisioning via Vercel Marketplace must be **documented as prerequisite step** in the plan
- Env var setup (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) included in plan

### Claude's Discretion
- Window algorithm selection
- Exact limit values per endpoint
- Middleware vs per-route architecture
- Fallback strategy when Redis unavailable
- Admin rate limit handling
- Progressive escalation implementation
- Rate limit header strategy
- Client-side retry behavior
- Log verbosity level
- Internal call bypass mechanism

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/ratelimit` | latest (v2.x) | Rate limiting algorithms (sliding window, fixed window, token bucket) | Purpose-built for serverless; HTTP-based, no TCP; used by Vercel in official examples |
| `@upstash/redis` | latest | HTTP-based Redis client required by @upstash/ratelimit | Connectionless, works in serverless/edge; `Redis.fromEnv()` auto-reads env vars |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vercel/functions` | latest | `waitUntil()` for non-blocking analytics submission | Only if `analytics: true` is enabled on ratelimit instances |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @upstash/ratelimit | Custom Lua scripts on Upstash Redis | More flexible but hand-rolling what the library does better |
| Sliding window | Token bucket | Token bucket better for burst allowance; sliding window better for strict limits |
| Per-route enforcement | Next.js middleware | Project has no middleware.ts; adding one for just rate limiting adds complexity; per-route gives granular control |

**Installation:**
```bash
pnpm add @upstash/ratelimit @upstash/redis
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── rate-limit/
│       ├── index.ts           # Barrel exports
│       ├── client.ts          # Redis singleton + ratelimit instances
│       ├── config.ts          # Env-var-driven limit configs per route category
│       ├── check.ts           # checkRateLimit() wrapper with logging + headers
│       └── identifiers.ts     # Key strategy: IP extraction, user ID extraction
├── app/
│   └── api/
│       └── (every route)      # Each calls checkRateLimit() at top of handler
```

### Pattern 1: Redis Singleton with Multiple Named Limiters
**What:** Create one Redis client and multiple Ratelimit instances scoped by route category
**When to use:** Always -- prevents creating new connections per request
**Example:**
```typescript
// Source: Context7 @upstash/ratelimit-js + @upstash/redis-js
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Singleton Redis client -- reused across all limiters
const redis = Redis.fromEnv();

// Ephemeral cache shared across limiters -- reduces Redis calls
const cache = new Map();

// Auth endpoints: strict limits
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.RATE_LIMIT_AUTH_SIGNIN_MAX ?? "5"),
    process.env.RATE_LIMIT_AUTH_SIGNIN_WINDOW ?? "1 m"
  ),
  prefix: "rl:auth",
  ephemeralCache: cache,
  timeout: 3000,        // Fail open after 3s
  analytics: false,     // Skip analytics to avoid waitUntil dependency
});

// API write endpoints (checkout, order creation)
export const apiWriteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.RATE_LIMIT_API_WRITE_MAX ?? "10"),
    process.env.RATE_LIMIT_API_WRITE_WINDOW ?? "1 m"
  ),
  prefix: "rl:api-write",
  ephemeralCache: cache,
  timeout: 3000,
});

// Public read endpoints (menu, sections, search)
export const publicReadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.RATE_LIMIT_PUBLIC_READ_MAX ?? "60"),
    process.env.RATE_LIMIT_PUBLIC_READ_WINDOW ?? "1 m"
  ),
  prefix: "rl:public-read",
  ephemeralCache: cache,
  timeout: 3000,
});
```

### Pattern 2: Rate Limit Check Wrapper with Logging and Headers
**What:** Centralized function that checks rate limit, logs 429 events with role, sets response headers
**When to use:** Called at the top of every rate-limited route handler
**Example:**
```typescript
// Source: Project patterns + Upstash docs
import { NextResponse } from "next/server";
import type { Ratelimit } from "@upstash/ratelimit";
import { logger } from "@/lib/utils/logger";

interface RateLimitCheckOptions {
  limiter: Ratelimit;
  identifier: string;
  role: "customer" | "driver" | "admin" | "anon";
  route: string;
}

export async function checkRateLimit(opts: RateLimitCheckOptions) {
  const { limiter, identifier, role, route } = opts;
  const result = await limiter.limit(identifier);

  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);

    logger.warn("Rate limit exceeded", {
      api: route,
      flowId: "rate-limit",
      // Include role for incident analysis (locked decision)
      role,
      identifier: identifier.substring(0, 8) + "...",
    } as Record<string, unknown>);

    return {
      limited: true,
      response: NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.reset),
          },
        }
      ),
    };
  }

  return {
    limited: false,
    headers: {
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(result.reset),
    },
  };
}
```

### Pattern 3: IP Extraction for Unauthenticated Requests
**What:** Extract client IP from Vercel's headers for rate limiting anonymous requests
**When to use:** Public endpoints (menu, sections, coverage check)
**Example:**
```typescript
// Vercel provides x-forwarded-for and x-real-ip headers
// NextRequest.ip is available in middleware but NOT in route handlers
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
```

### Pattern 4: Fail-Open Timeout Strategy
**What:** If Redis is unavailable, allow requests through rather than blocking users
**When to use:** Always -- production availability > strict rate enforcement
**Example:**
```typescript
// Source: Context7 @upstash/ratelimit-js -- timeout configuration
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  timeout: 3000, // 3 seconds -- fail open after this
});

const result = await limiter.limit(identifier);
if (result.reason === "timeout") {
  // Redis unavailable -- allow request, log for monitoring
  logger.warn("Rate limit Redis timeout -- failing open", {
    api: route,
    flowId: "rate-limit",
  });
  // Proceed with request
}
```

### Anti-Patterns to Avoid
- **Global middleware rate limiting:** Project has ~85 API route handlers with very different limits needed. A single middleware with one limit would either be too strict for public reads or too loose for auth.
- **Creating Redis client per request:** Always use module-level singleton. Serverless functions reuse module scope across warm invocations.
- **Rate limiting webhooks:** Stripe and Resend control their own retry behavior. Rate limiting them causes missed events.
- **Rate limiting cron endpoints:** Internal CRON_SECRET-authenticated endpoints should be exempt.
- **Storing rate limit config in database:** Adds latency and circular dependency. Use env vars (locked decision).
- **Using `request.ip` in route handlers:** `NextRequest.ip` is only populated in Edge middleware, not in Node.js route handlers. Use `x-forwarded-for` / `x-real-ip` headers instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sliding window algorithm | Custom Redis Lua scripts | `Ratelimit.slidingWindow()` | Handles atomicity, race conditions, clock skew |
| Distributed state | In-memory Map (current) | Upstash Redis | Map is per-instance, not shared across serverless |
| Ephemeral caching | Custom LRU cache | `ephemeralCache: new Map()` built into @upstash/ratelimit | Already handles TTL, cache invalidation |
| Retry-after calculation | Manual math | `result.reset - Date.now()` from library | Library tracks window boundaries accurately |
| Rate limit key namespacing | String concatenation | `prefix` option on Ratelimit constructor | Prevents key collisions between limiters |

**Key insight:** Rate limiting in distributed systems has subtle correctness issues (race conditions between instances, clock drift, atomic increment-and-check). The Upstash library handles all of this via server-side Lua scripts executed atomically on Redis.

## Common Pitfalls

### Pitfall 1: `request.ip` Returns Undefined in Route Handlers
**What goes wrong:** Using `NextRequest.ip` or `request.ip` in API route handlers returns undefined
**Why it happens:** `request.ip` is only populated by Next.js in Edge middleware (`middleware.ts`), not in Node.js runtime route handlers
**How to avoid:** Use `request.headers.get("x-forwarded-for")` or `request.headers.get("x-real-ip")` which Vercel always sets
**Warning signs:** Rate limiting keys all resolve to "unknown" or "127.0.0.1"

### Pitfall 2: Module-Level Redis Not Surviving Cold Starts
**What goes wrong:** Assuming Redis client persists indefinitely; it does in warm functions but not across cold starts
**Why it happens:** Serverless function cold starts re-execute module-level code
**How to avoid:** `Redis.fromEnv()` at module level is fine -- it's lightweight, no persistent connection. Ephemeral cache resets on cold start (acceptable).
**Warning signs:** N/A -- this is a misconception. Module-level is actually the correct pattern.

### Pitfall 3: Blocking on Analytics Pending Promise
**What goes wrong:** If `analytics: true`, `ratelimit.limit()` returns a `pending` promise that must be handled with `waitUntil()` to avoid blocking
**Why it happens:** Analytics submission is async and shouldn't delay the response
**How to avoid:** Either set `analytics: false` (simpler) or import `waitUntil` from `@vercel/functions` and call `waitUntil(pending)`. Since the project doesn't use `@vercel/functions` yet, recommend `analytics: false` for now.
**Warning signs:** Slow rate limit checks (>500ms) when analytics is enabled without waitUntil

### Pitfall 4: Rate Limiting Server Actions (signInWithMagicLink)
**What goes wrong:** Server Actions in `src/lib/supabase/actions.ts` currently call `checkRateLimit()` which uses the in-memory Map. Simply replacing the import isn't enough -- Server Actions run on the server but don't receive a `Request` object with headers.
**Why it happens:** Server Actions don't have direct access to `NextRequest.headers` for IP extraction
**How to avoid:** Use `headers()` from `next/headers` inside Server Actions to get `x-forwarded-for`. Or pass the rate limit identifier (email) as the key instead of IP.
**Warning signs:** Server Action rate limiting uses email-only keys (acceptable for auth, since email is the natural identifier anyway)

### Pitfall 5: Upstash Free Tier Request Limits
**What goes wrong:** Upstash free tier has 10K requests/day. Each rate limit check = 1 Redis request (2 with analytics).
**Why it happens:** Not accounting for traffic volume during provisioning
**How to avoid:** Start with Pay-as-you-go plan. Ephemeral cache reduces Redis calls significantly (cache hit = 0 Redis calls).
**Warning signs:** 429 responses from Upstash itself (different from your app's 429s)

### Pitfall 6: Forgetting to Exempt Webhooks
**What goes wrong:** Rate limiting Stripe or Resend webhooks causes missed payment events or email delivery tracking
**Why it happens:** Applying rate limiting too broadly
**How to avoid:** Explicit exemption list. Current webhooks found in codebase:
- `POST /api/webhooks/stripe` -- Stripe payment events (MUST exempt)
- `POST /api/webhooks/resend` -- Resend email delivery events (MUST exempt)
- `GET /api/cron/delivery-reminders` -- Internal cron (MUST exempt, already CRON_SECRET protected)
**Warning signs:** Stripe webhook failures in Stripe Dashboard, missing email delivery tracking

## Codebase-Specific Findings

### Current Rate Limiting Usage (to replace)

| Location | Current Mechanism | New Approach |
|----------|------------------|--------------|
| `src/lib/utils/rate-limit.ts` | In-memory Map with fixed window | Delete entirely, replace with Upstash |
| `src/lib/supabase/actions.ts:44` | `checkRateLimit(email, "signIn")` | Use new `authLimiter.limit(email)` |
| `src/lib/supabase/actions.ts:86` | `checkRateLimit(email, "signIn")` for resend invite | Same |
| `src/app/api/driver/location/route.ts:39-58` | DB query-based rate limit (check last update timestamp) | Replace with `driverLocationLimiter.limit(driverId)` -- removes a DB query per request |

### Full API Route Inventory (85 handlers across ~55 route files)

**Exempt from rate limiting:**
- `POST /api/webhooks/stripe` -- Stripe-controlled
- `POST /api/webhooks/resend` -- Resend-controlled
- `GET /api/cron/delivery-reminders` -- CRON_SECRET protected
- `GET /api/health` -- monitoring endpoint
- `GET /api/debug/sentry` -- dev-only

**Public (unauthenticated) -- rate limit by IP:**
- `GET /api/menu` -- menu catalog (cacheable, `revalidate: 300`)
- `GET /api/menu/search` -- menu search
- `GET /api/sections` -- featured sections (CDN cached 60s)
- `POST /api/coverage/check` -- address coverage check
- `POST /api/analytics/vitals` -- web vitals beacon

**Auth (unauthenticated) -- rate limit by email/IP:**
- Server Action: `signInWithMagicLink` in `src/lib/supabase/actions.ts`
- Server Action: `resendDriverInvite` in `src/lib/supabase/actions.ts`

**Customer (authenticated) -- rate limit by user ID:**
- `POST /api/checkout/session` -- order creation (strict: prevent double-orders)
- `GET /api/tracking/[orderId]` -- order tracking
- `GET/POST /api/addresses/*` -- address CRUD
- `GET/PATCH /api/account/profile` -- profile
- `GET/PATCH /api/account/settings` -- settings
- `POST /api/orders/[id]/cancel` -- cancel order
- `POST /api/orders/[id]/rating` -- submit rating
- `POST /api/orders/[id]/retry-payment` -- retry payment
- `PATCH /api/orders/[id]/notes` -- delivery notes
- `POST /api/account/orders/[id]/reorder` -- reorder

**Driver (authenticated) -- rate limit by driver ID:**
- `POST /api/driver/location` -- location updates (currently 1/min via DB check)
- `GET /api/driver/me` -- driver profile
- `POST /api/driver/onboard` -- onboarding
- `GET /api/driver/routes/active` -- active route
- `GET /api/driver/routes/history` -- route history
- `POST /api/driver/routes/[routeId]/start` -- start route
- `POST /api/driver/routes/[routeId]/complete` -- complete route
- `PATCH /api/driver/routes/[routeId]/stops/[stopId]` -- update stop
- `POST /api/driver/routes/[routeId]/stops/[stopId]/photo` -- delivery photo
- `POST /api/driver/routes/[routeId]/stops/[stopId]/exception` -- report exception

**Admin (authenticated) -- higher limits or exempt:**
- ~35 routes under `/api/admin/*` (CRUD for menu, orders, drivers, routes, sections, photos, emails, analytics, settings, profile)

### Existing Error Response Patterns
The codebase uses two patterns for JSON error responses:
1. **Simple:** `{ error: "message" }` (driver routes, simple endpoints)
2. **Structured:** `{ error: { code: "ERROR_CODE", message: "..." } }` (checkout, tracking, menu)

Rate limit 429 responses should use the structured pattern for consistency with the more modern routes.

### Existing Toast System
- `src/lib/hooks/useToast.ts` -- custom toast with variants: `default`, `destructive`, `success`, `warning`
- Used extensively (44 files import `toast()`)
- Toast auto-dismisses after 5 seconds
- The 429 client-side handling should call `toast({ variant: "destructive", title: "...", description: "..." })`

### No middleware.ts Exists
The project has NO `src/middleware.ts`. Rate limiting should be per-route, not middleware-based. This avoids:
- Adding middleware complexity for a single concern
- Running rate limit checks on static assets
- Needing different limit logic per route in one file

### Env Var Pattern
Current env vars in `.env.example` follow `UPPER_SNAKE_CASE`. New rate limit env vars should follow the same pattern:
```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AX...
RATE_LIMIT_AUTH_SIGNIN_MAX=5
RATE_LIMIT_AUTH_SIGNIN_WINDOW=1 m
RATE_LIMIT_AUTH_SIGNUP_MAX=3
RATE_LIMIT_AUTH_SIGNUP_WINDOW=1 h
RATE_LIMIT_API_WRITE_MAX=10
RATE_LIMIT_API_WRITE_WINDOW=1 m
RATE_LIMIT_PUBLIC_READ_MAX=60
RATE_LIMIT_PUBLIC_READ_WINDOW=1 m
RATE_LIMIT_DRIVER_LOCATION_MAX=2
RATE_LIMIT_DRIVER_LOCATION_WINDOW=1 m
RATE_LIMIT_GLOBAL_IP_MAX=120
RATE_LIMIT_GLOBAL_IP_WINDOW=1 m
```

## Code Examples

Verified patterns from official sources:

### Sliding Window Rate Limiter Setup
```typescript
// Source: Context7 /upstash/ratelimit-js
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),                          // Reads UPSTASH_REDIS_REST_URL + TOKEN
  limiter: Ratelimit.slidingWindow(30, "30 s"),    // 30 requests per 30s sliding window
  ephemeralCache: new Map(),                        // In-memory cache to reduce Redis calls
  prefix: "rl:my-app",                             // Namespace in Redis
  timeout: 3000,                                   // Fail open after 3s
});
```

### Per-Route Rate Limit Check
```typescript
// Source: Context7 /upstash/ratelimit-js + project patterns
export async function POST(request: Request) {
  // Extract identifier
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  const { success, limit, remaining, reset } = await publicReadLimiter.limit(ip);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment." } },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  // ... normal route logic
}
```

### Redis Client with Timeout and Retry
```typescript
// Source: Context7 /upstash/redis-js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.exp(retryCount) * 50,
  },
  signal: () => AbortSignal.timeout(5000),
});
```

### Health Check for Redis Connectivity
```typescript
// Add to existing /api/health route
const redis = Redis.fromEnv();
try {
  await redis.ping();
  // Redis healthy
} catch {
  // Redis down -- report degraded, not down (rate limiting fails open)
}
```

## Recommended Limit Values

Based on codebase traffic patterns and the app's nature (local delivery service, not high-scale SaaS):

| Category | Endpoint(s) | Limit | Window | Key | Rationale |
|----------|-------------|-------|--------|-----|-----------|
| Auth signIn | Server Action | 5 | 1 min | email | Matches existing config; prevents brute force |
| Auth signUp | Server Action | 3 | 1 hour | email | Matches existing config; signUp is rare |
| Checkout | `POST /api/checkout/session` | 3 | 1 min | userId | Prevent double-orders; 3 allows retry |
| Order cancel | `POST /api/orders/*/cancel` | 5 | 1 min | userId | Low frequency, allow retries |
| Driver location | `POST /api/driver/location` | 2 | 1 min | driverId | Currently 1/min; 2 allows burst |
| Driver actions | `POST /api/driver/routes/*/start,complete,stops/*` | 10 | 1 min | driverId | Active delivery ops, needs headroom |
| Public read | `GET /api/menu, /api/sections, /api/menu/search` | 60 | 1 min | IP | Generous for browsing; blocks scrapers |
| Coverage check | `POST /api/coverage/check` | 10 | 1 min | IP | Each address check is intentional |
| Customer CRUD | Account, addresses, orders | 30 | 1 min | userId | Normal browsing patterns |
| Admin | `/api/admin/*` | 120 | 1 min | userId | Higher limits for admin operations |
| Global IP fallback | All non-exempt routes | 120 | 1 min | IP | Safety net for any missed route |

## Recommended Architectural Decisions

### Per-Route vs Middleware
**Recommendation: Per-route enforcement.**
- No `middleware.ts` exists; adding one introduces global state
- Each route needs different limits, keys, and exemption logic
- Per-route is explicit and debuggable
- Create a reusable `withRateLimit()` wrapper to keep route handlers clean

### Window Algorithm
**Recommendation: Sliding window for all limiters.**
- Prevents the "boundary burst" problem where fixed window allows 2x limit at window edges
- Upstash sliding window uses two fixed windows and interpolates (efficient, only 2 Redis keys)
- Token bucket is overkill for this use case

### Fallback Strategy
**Recommendation: Fail open with timeout.**
- Set `timeout: 3000` on all Ratelimit instances
- If Redis is unreachable, `result.reason === "timeout"` and `result.success === true`
- Log timeouts to Sentry for monitoring
- Users are never blocked by Redis downtime

### Admin Handling
**Recommendation: Higher limits, not full bypass.**
- Admins get 120 req/min (vs 30 for customers)
- No full bypass -- prevents compromised admin accounts from being weaponized
- Env var `RATE_LIMIT_ADMIN_MAX` for tuning

### Internal Call Bypass
**Recommendation: Route-level exemption by checking known headers/secrets.**
- Cron: Already checks `CRON_SECRET` in `authorization` header -- skip rate limit if authorized
- Webhooks: Stripe (signature verification), Resend (webhook secret) -- exempt by not calling rate limiter

### Client-Side 429 Handling
**Recommendation: No auto-retry; toast notification only.**
- Auto-retry creates retry storms under load
- Show toast with `variant: "destructive"` for generic 429
- Show toast with `variant: "warning"` and reassuring message for checkout 429
- No countdown timer (over-engineering for a local delivery app)

### Logging
**Recommendation: Log 429s only, not every check.**
- Every check = too noisy (could be 1000s/min)
- 429 events = actionable signal
- Include: route, role, identifier (truncated), timestamp
- Sentry: `logger.warn()` already sends breadcrumbs; add explicit `Sentry.captureMessage()` for 429 spikes

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-memory Map | Upstash Redis (@upstash/ratelimit) | Upstash v2.0, 2024 | Distributed state across serverless |
| Fixed window | Sliding window | Standard since inception | No boundary burst exploit |
| TCP Redis (ioredis) | HTTP Redis (@upstash/redis) | Designed for serverless | No connection pooling needed |
| `request.ip` in route handlers | `x-forwarded-for` header | Next.js 13+ (App Router) | IP only in Edge middleware |

**Deprecated/outdated:**
- In-memory rate limiting: Non-functional on multi-instance serverless (current broken state)
- `@upstash/ratelimit` v1.x: v2.x added custom rates, timeout, improved caching

## Open Questions

1. **Upstash Plan Tier**
   - What we know: Free tier = 10K requests/day. With ephemeral cache, real Redis calls will be ~30-50% of rate limit checks.
   - What's unclear: Expected daily traffic volume for this delivery app.
   - Recommendation: Start with Pay-as-you-go ($0.2/100K requests). Document as prerequisite for the plan.

2. **Rate Limiting signInWithMagicLink Server Action**
   - What we know: Server Actions don't receive a `Request` object. Currently uses email as identifier.
   - What's unclear: Whether to add IP-based limiting in addition to email-based.
   - Recommendation: Keep email-based for auth (it's the natural key). Use `headers()` from `next/headers` if IP is also needed.

3. **Sentry Alert Rule Configuration**
   - What we know: User wants Sentry alert when 429 rate exceeds threshold.
   - What's unclear: Exact threshold and notification channel.
   - Recommendation: Create alert rule for >50 occurrences of "Rate limit exceeded" in 5 minutes. Can be tuned post-deploy.

## Sources

### Primary (HIGH confidence)
- Context7 `/upstash/ratelimit-js` -- Sliding window, ephemeral cache, timeout, Next.js middleware examples, custom rate per request
- Context7 `/upstash/redis-js` -- Client initialization, `Redis.fromEnv()`, retry configuration, timeout handling

### Secondary (MEDIUM confidence)
- Codebase analysis -- 85 API handlers across 55 route files inventoried; current rate-limit.ts, actions.ts, driver/location/route.ts examined
- Existing project patterns -- toast system, logger, error response format, env var conventions

### Tertiary (LOW confidence)
- None -- all critical claims verified through Context7 or codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Context7 verified Upstash API, versions, and patterns
- Architecture: HIGH -- Based on codebase analysis (no middleware.ts, 85 handlers, existing patterns)
- Pitfalls: HIGH -- Verified `request.ip` behavior, timeout handling, webhook exemption through codebase + Context7
- Limit values: MEDIUM -- Reasonable defaults but may need production tuning (hence env vars)

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable domain; Upstash API is mature)
