# Phase 108: Rate Limiting Restoration - Research

**Researched:** 2026-03-20
**Domain:** Upstash REST Redis + @upstash/ratelimit distributed rate limiting
**Confidence:** HIGH

## Summary

This phase restores 13 disabled rate limiters by provisioning Upstash REST Redis (HTTP protocol) to replace the incompatible Redis Cloud (TCP protocol) that forced all limiters to null on 2026-03-08. The in-memory fallback (15 req/min flat) has been running for 12 days without incident, but lacks tiered enforcement (2-120 req/min per role) and cross-instance consistency.

All infrastructure exists: `@upstash/ratelimit@2.0.8` and `@upstash/redis@1.36.2` are installed, `config.ts` has all 13 tier definitions with env-var overrides, 110+ API routes already call `checkRateLimit()` with appropriate limiters, and client-side 429 handling is wired. The work is surgical: restore `client.ts` constructors, fix `checkServerActionRateLimit` fallback gap, fix health endpoint lies, add unit tests.

**Primary recommendation:** Use conditional init pattern (`process.env.UPSTASH_REDIS_REST_URL ? new Redis({...}) : null`) with `createLimiter()` helper consuming `RATE_LIMITS` config. Fix the `.env.example` typo (`UPSTASH_REST_REDIS_URL` -> `UPSTASH_REDIS_REST_URL`). All 13 limiters use `Ratelimit.slidingWindow()` with `ephemeralCache: new Map()` and `analytics: true`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Provision Upstash REST Redis via Vercel Dashboard -> Storage -> Create Database (HTTP protocol, not TCP)
- **D-02:** Two env vars: `UPSTASH_REDIS_REST_URL` (https://...) + `UPSTASH_REDIS_REST_TOKEN` -- add token to `.env.example` (currently undocumented)
- **D-03:** Free tier sufficient (~5K-15K commands/day at current scale of 1 admin, 2-4 drivers, 10-50 customers)
- **D-04:** Redis Cloud (TCP `redis://`) is incompatible with `@upstash/redis` (HTTP-only) -- this is why limiters were disabled on 2026-03-08
- **D-05:** Conditional init: `const redis = process.env.UPSTASH_REDIS_REST_URL ? new Redis({...}) : null` -- preserves null-safety for dev environments
- **D-06:** `createLimiter()` helper consuming `RATE_LIMITS` config from `config.ts` with `Ratelimit.slidingWindow()`
- **D-07:** Each constructor gets `ephemeralCache: new Map()` to reduce Redis roundtrips (~30-50% fewer commands for repeat identifiers)
- **D-08:** Each constructor gets `analytics: true` for Upstash dashboard monitoring
- **D-09:** Prefix pattern: `rl:{tier-name}` -- matches Phase 69 original design
- **D-10:** All 13 limiter exports restored: authSignIn (5/1m), authSignUp (3/1h), apiWrite (10/1m), publicRead (60/1m), driverLocation (2/1m), driverAction (10/1m), customer (30/1m), admin (120/1m), global (120/1m), checkout (3/1m), refund (5/1m), adminBulk (10/1m), webhook (30/1m)
- **D-11:** `authSignUpLimiter` -- unwired by design (OTP app, no discrete signup endpoint). Add inline comment.
- **D-12:** `globalLimiter` -- per-IP safety net, reserved for future use. Add inline comment.
- **D-13:** `adminBulkLimiter` -- no bulk admin endpoints exist. Add inline comment.
- **D-14:** `checkServerActionRateLimit()` gets in-memory fallback + try/catch matching `checkRateLimit()` pattern
- **D-15:** Fallback uses `inMemoryRateLimit()` with 15 req/min (matches H-05 defense-in-depth pattern)
- **D-16:** Redis errors caught and logged with `flowId: "rate-limit-fallback"`, then fall back to in-memory
- **D-17:** Replace hardcoded `const redisConfigured = true` with `Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)`
- **D-18:** Add Redis PING in deep health check (`?deep=true`) -- import `getRedisClient()`, call `client.ping()` with 3s timeout, return latency or degraded status
- **D-19:** Fix check.ts line 60 JSDoc: "Fails open when limiter is null" -> "Falls back to conservative in-memory limiter (15 req/min) when Redis is unavailable"
- **D-20:** Create `src/lib/rate-limit/__tests__/check.test.ts` -- test null limiter path (in-memory), mocked Ratelimit success/failure, server action fallback, discriminated union return types
- **D-21:** Create `src/lib/rate-limit/__tests__/identifiers.test.ts` -- test IP extraction from various header combinations
- **D-22:** Mock `@upstash/ratelimit` Ratelimit class, not live Redis
- **D-23:** Integration tests with live Redis deferred to Phase 109
- **D-24:** Export dummy `UPSTASH_REDIS_REST_URL=https://dummy.upstash.io` and `UPSTASH_REDIS_REST_TOKEN=dummy` in CI workflow env blocks
- **D-25:** Deploy with 2x env var overrides for first week
- **D-26:** Bump webhook default from 30/1m to 60/1m in config.ts
- **D-27 to D-52:** See 108-CONTEXT.md for full decision list (rate limit tuning, failure modes, health check depth, testing scope)

### Claude's Discretion
- Exact provisioning documentation format in .env.example
- Log message wording in server action fallback
- Test file organization (describe blocks, test naming)
- Sentry alert rule documentation format in plan (human action, not automatable)
- Whether to add inline comments per unwired limiter or single block comment
- Exact assertion style in tests (toEqual vs toMatchObject vs individual expects)

### Deferred Ideas (OUT OF SCOPE)
- Integration tests with live Redis -- Phase 109 (QUAL-01)
- Sentry alert rule "Rate Limit Spike" creation -- manual dashboard task, documented as human action
- Wiring globalLimiter/adminBulkLimiter to endpoints -- no current endpoints need them
- authSignUpLimiter wiring -- OTP app has no discrete signup endpoint
- Redis connection pooling optimization -- not needed for HTTP-based Upstash REST
- Per-endpoint rate limit configuration -- tier system sufficient at current scale
- Tiered in-memory fallback -- simplicity preferred during degradation
- Circuit breaker pattern -- over-engineering for HTTP-based Upstash REST

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Distributed rate limiting restored -- Upstash REST Redis provisioned, all 13 `Ratelimit` constructors enabled in `client.ts`, verified functional | Standard Stack + Architecture Patterns sections provide exact constructor pattern, verified `@upstash/ratelimit@2.0.8` API types, conditional init with `createLimiter()` helper |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/ratelimit` | 2.0.8 (installed, latest) | Sliding window rate limiting for serverless | Only serverless-native rate limiter with HTTP transport; peer dependency on `@upstash/redis` |
| `@upstash/redis` | 1.36.2 (installed; 1.37.0 on npm) | HTTP/REST Redis client | Required by `@upstash/ratelimit`; HTTP-only transport, no TCP connections |
| `vitest` | (installed) | Unit test framework | Project standard per `vitest.config.ts`, jsdom environment, `@` path alias configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/server` (`after()`) | Next.js 16 | Post-response work | If `pending` promise from `analytics: true` needs explicit handling (see Pitfall 4) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@upstash/redis` | `ioredis` | TCP-based, incompatible with serverless (no connection pooling). This is exactly why limiters were disabled. |
| `@upstash/redis` | `@vercel/kv` | Different API, not installed, would require code rewrite |
| `@upstash/ratelimit` | Custom sliding window | 200+ lines of bug-prone code vs battle-tested library |
| `Redis.fromEnv()` | Manual `new Redis({url, token})` | `fromEnv()` only `console.warn`s on missing vars (doesn't throw), passes `undefined` to constructor. Manual init with conditional check is safer. |

**No installation needed.** Both packages already in `pnpm-lock.yaml`.

**Version note:** `@upstash/redis` 1.37.0 is available on npm (installed: 1.36.2). The `^1.36.2` range in `package.json` satisfies `@upstash/ratelimit`'s peer dep of `^1.34.3`. No update required but safe to update.

## Architecture Patterns

### Rate Limit Module Structure (existing, unchanged)
```
src/lib/rate-limit/
  index.ts          # Barrel re-export (42 lines, no changes)
  client.ts         # 13 limiter exports + getRedisClient() [RESTORE]
  check.ts          # checkRateLimit + checkServerActionRateLimit [FIX]
  config.ts         # RATE_LIMITS tier config with env-var overrides [BUMP webhook]
  identifiers.ts    # IP/user extraction (43 lines, no changes)
  __tests__/
    check.test.ts   # [CREATE]
    identifiers.test.ts  # [CREATE]
```

### Pattern 1: Conditional Module Init with Helper Factory
**What:** Single Redis client created at module scope (evaluated once at import time in serverless). Factory function creates all 13 limiters from config.
**When to use:** Always -- this is the locked pattern (D-05, D-06).
**Example:**
```typescript
// Source: Verified against @upstash/ratelimit@2.0.8 type definitions + D-05/D-06
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Duration } from "@upstash/ratelimit";
import { RATE_LIMITS, type RateLimitTier } from "./config";

// Module-scope singleton -- null when env vars not set (dev, CI without Redis)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export function getRedisClient(): Redis | null {
  return redis;
}

function createLimiter(tier: RateLimitTier, prefix: string): Ratelimit | null {
  if (!redis) return null;
  const config = RATE_LIMITS[tier];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, config.window as Duration),
    prefix: `rl:${prefix}`,
    ephemeralCache: new Map(),
    analytics: true,
  });
}

export const authSignInLimiter = createLimiter("auth-signin", "auth-signin");
// ... 12 more following same pattern
```

### Pattern 2: Server Action Fallback (fix for check.ts)
**What:** Add in-memory fallback + try/catch to `checkServerActionRateLimit()`, mirroring `checkRateLimit()`.
**When to use:** Lines 157-183 of check.ts (D-14, D-15, D-16).
**Example:**
```typescript
// Source: Mirror of checkRateLimit lines 63-104, adapted for server action return type
export async function checkServerActionRateLimit(opts: {
  limiter: Ratelimit | null;
  identifier: string;
  role: UserRole;
  route: string;
}): Promise<ServerActionRateLimitResult> {
  if (!opts.limiter) {
    // H-05: In-memory fallback (matches checkRateLimit behavior)
    const limited = inMemoryRateLimit(`${opts.route}:${opts.identifier}`);
    if (limited) {
      logger.warn("In-memory rate limit exceeded (Server Action)", {
        api: opts.route,
        flowId: "rate-limit-fallback",
        role: opts.role,
      });
      return { limited: true, retryAfterSeconds: 60 };
    }
    return { limited: false };
  }

  try {
    const result = await opts.limiter.limit(opts.identifier);
    if (!result.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      );
      logger.warn("Rate limit exceeded (Server Action)", {
        api: opts.route,
        flowId: "rate-limit",
        role: opts.role,
        identifier: opts.identifier.substring(0, 8) + "...",
      });
      return { limited: true, retryAfterSeconds };
    }
    return { limited: false };
  } catch (err) {
    // H-05: Redis timeout/error -- use in-memory fallback
    logger.error("Redis rate limiter error (Server Action)", {
      api: opts.route,
      flowId: "rate-limit-fallback",
      error: err instanceof Error ? err.message : "unknown",
    });
    const limited = inMemoryRateLimit(`${opts.route}:${opts.identifier}`);
    if (limited) {
      return { limited: true, retryAfterSeconds: 60 };
    }
    return { limited: false };
  }
}
```

### Pattern 3: Health Check Deep Mode with Redis PING
**What:** Replace static `checkRedis()` with real connectivity check.
**When to use:** `src/lib/health/checks.ts` `checkRedis()` function (D-18, D-37-D-44).
**Example:**
```typescript
// Source: Follows existing checkSupabase/checkStripe deep check pattern
export async function checkRedis(): Promise<ServiceStatus> {
  const configured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (!configured) {
    return { status: "down", configured: false };
  }

  const start = Date.now();
  try {
    const { getRedisClient } = await import("@/lib/rate-limit");
    const client = getRedisClient();
    if (!client) {
      // D-38: Redis unavailable but app works (in-memory fallback)
      return { status: "degraded", configured: true, connected: false };
    }
    // D-40: 3-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await client.ping();
    clearTimeout(timeout);
    return {
      status: "healthy",
      configured: true,
      connected: true,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      status: "degraded",
      configured: true,
      connected: false,
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
```

**Note on PING timeout:** The `@upstash/redis` client is HTTP-based; `client.ping()` returns `Promise<string>` (verified in type definitions at `zmscore-BjNXmrug.d.ts:4100`). Upstash REST typical latency is 5-15ms. The 3s timeout is generous and catches actual connectivity failures. However, `AbortSignal` is not natively supported by `@upstash/redis` HTTP client -- use `Promise.race` with a timeout promise instead.

### Pattern 4: Vitest Mock Pattern for Ratelimit
**What:** Mock `@upstash/ratelimit` module; test our integration code, not Upstash internals.
**When to use:** All unit tests (D-22, D-45).
**Example:**
```typescript
// Source: Project test pattern from role-redirect.test.ts + vi.mock convention
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock logger to avoid console noise
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Ratelimit class
const mockLimit = vi.fn();
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: mockLimit,
  })),
}));

// Test: successful rate limit check
it("returns limited: false when under limit", async () => {
  mockLimit.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60000,
    pending: Promise.resolve(),
  });
  // ... call checkRateLimit with the mock limiter
});
```

### Anti-Patterns to Avoid
- **Using `Redis.fromEnv()` without guard:** Only `console.warn`s on missing vars, passes `undefined` to constructor. Always use conditional init.
- **Forgetting `ephemeralCache: new Map()`:** Without it, every request hits Redis even for already-blocked identifiers. Wastes commands.
- **Testing live Redis in unit tests:** Mock the Ratelimit class. Live Redis belongs in Phase 109 integration tests.
- **Using `AbortSignal` with `@upstash/redis`:** The HTTP client doesn't support signal-based cancellation. Use `Promise.race` for timeouts.
- **Hardcoding rate limit values in tests:** Import from `RATE_LIMITS` config or use the in-memory constants. Don't duplicate magic numbers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sliding window rate limiting | Custom token bucket / leaky bucket | `Ratelimit.slidingWindow()` | Boundary-burst prevention, atomic Redis operations, edge cases handled |
| Redis HTTP transport | Custom fetch wrapper around Redis REST API | `@upstash/redis` `Redis` class | Auth, retries, error handling, connection management |
| Ephemeral cache for blocked IDs | Custom Map with TTL tracking | `ephemeralCache: new Map()` constructor option | SDK manages reset timestamps and eviction automatically |
| Rate limit analytics | Custom Redis counter per endpoint | `analytics: true` constructor option | Free Upstash dashboard, async submission via `pending` promise |
| IP extraction from headers | Custom header parsing | Existing `getClientIp()` / `getServerActionIp()` | Already handles x-forwarded-for, x-real-ip, multi-IP chains |

**Key insight:** The entire rate limiting stack was designed and wired in Phase 69. Phase 108 is purely a restoration -- re-enable what exists, don't redesign.

## Common Pitfalls

### Pitfall 1: .env.example Has Wrong Env Var Name
**What goes wrong:** `.env.example` line 85 has `UPSTASH_REST_REDIS_URL` but the SDK expects `UPSTASH_REDIS_REST_URL`. Developers copying .env.example get a non-functional env var.
**Why it happens:** Typo introduced during original documentation (never caught because limiters were disabled before provisioning).
**How to avoid:** Fix to `UPSTASH_REDIS_REST_URL` and add `UPSTASH_REDIS_REST_TOKEN` below it.
**Warning signs:** Limiters stay null despite env vars being set.

### Pitfall 2: process.env Inlined at Build Time
**What goes wrong:** `process.env.UPSTASH_REDIS_REST_URL` is replaced with its literal value at Next.js build time. You cannot validate env vars dynamically at runtime.
**Why it happens:** Next.js optimization for tree-shaking.
**How to avoid:** The conditional init pattern (`process.env.X ? new Redis({...}) : null`) works because the build inlines the check correctly. CI needs dummy env vars (D-24) so the build inlines non-undefined values, but tests still mock properly.
**Warning signs:** `undefined` appearing in bundled code; rate limiters null despite env vars set in Vercel (but not at build time).

### Pitfall 3: Server Action Security Gap (Current Bug)
**What goes wrong:** `checkServerActionRateLimit()` returns `{ limited: false }` when limiter is null, silently allowing all requests. Auth server actions (magic link, driver invite) are unprotected during Redis outage.
**Why it happens:** Server action function was added later and didn't mirror the API route pattern.
**How to avoid:** Add in-memory fallback + try/catch matching lines 63-104 of `checkRateLimit()`.
**Warning signs:** Auth rate limit log entries show only API route checks, never server action checks.

### Pitfall 4: Analytics `pending` Promise Not Awaited
**What goes wrong:** With `analytics: true`, the `limit()` method returns a `pending` promise that submits analytics data asynchronously. If ignored, analytics may be dropped when the serverless function terminates.
**Why it happens:** The `checkRateLimit()` function destructures only `success`, `limit`, `remaining`, `reset` from the result -- `pending` is never handled.
**How to avoid:** This is acceptable for now (D-08 enables analytics as best-effort). Analytics data is non-critical. The `pending` promise completes within milliseconds in most cases. If analytics become critical, wrap with `after(() => { pending })` in route handlers. Not a Phase 108 concern.
**Warning signs:** Upstash analytics dashboard shows fewer events than expected.

### Pitfall 5: Health Endpoint Hardcoded `true` (Current Bug)
**What goes wrong:** `const redisConfigured = true` always reports Redis as healthy, even when it's disabled.
**Why it happens:** Shortcut taken when Redis was disabled (c1a74a8d) -- never restored.
**How to avoid:** Replace with `Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)`.
**Warning signs:** BetterStack shows Redis "healthy" when it shouldn't be.

### Pitfall 6: Redis PING Timeout in Deep Health Check
**What goes wrong:** `@upstash/redis` HTTP client doesn't support `AbortSignal` for request cancellation.
**Why it happens:** The client uses its own HTTP transport, not native `fetch`.
**How to avoid:** Use `Promise.race([client.ping(), new Promise((_, reject) => setTimeout(() => reject(new Error("PING timeout")), 3000))])` instead of `AbortSignal.timeout()`.
**Warning signs:** Deep health checks hang or take longer than expected during Redis outages.

### Pitfall 7: CI Build Failing Without Dummy Env Vars
**What goes wrong:** After restoring `client.ts`, the build step evaluates `process.env.UPSTASH_REDIS_REST_URL` at build time. Without dummy values in CI, it inlines `undefined`, making the conditional init always produce `null` -- even on Vercel where real vars exist.
**Why it happens:** Next.js build-time inlining of env vars.
**How to avoid:** Add dummy env vars to `.github/workflows/ci.yml` build step env block, matching existing Supabase pattern.
**Warning signs:** Build succeeds in CI but rate limiters are always null in production.

### Pitfall 8: Ratelimit `timeout` Default is 5 Seconds (Fail-Open!)
**What goes wrong:** `@upstash/ratelimit` has a default `timeout: 5000` (5 seconds). If Redis doesn't respond within 5s, the SDK returns `success: true` -- allowing the request through (fail-open).
**Why it happens:** SDK design decision to prevent network issues from blocking traffic.
**How to avoid:** The existing try/catch + in-memory fallback in `checkRateLimit()` catches this case. The `timeout` only affects the SDK's internal behavior. If the SDK itself throws (network error vs timeout), the catch block activates. This is fine as-is -- the 5s timeout is a safety valve, and our H-05 fallback handles both paths.
**Warning signs:** During extended Redis outages, some requests may pass through for up to 5 seconds before the in-memory fallback kicks in.

## Code Examples

### Verified Ratelimit Constructor Config (from installed type definitions)
```typescript
// Source: node_modules/@upstash/ratelimit/dist/index.d.ts lines 574-644
type RegionRatelimitConfig = {
  redis: Redis;
  limiter: Algorithm<RegionContext>;
  prefix?: string;             // default: "@upstash/ratelimit"
  ephemeralCache?: Map<string, number> | false;  // default: auto-created Map
  timeout?: number;            // default: 5000 (ms) -- FAIL OPEN after timeout
  analytics?: boolean;         // default: false
  enableProtection?: boolean;  // default: false (deny list feature)
  denyListThreshold?: number;  // default: 6
  dynamicLimits?: boolean;     // default: false
  cacheScripts?: boolean;      // @deprecated since v2.0.3
};
```

### Verified limit() Return Type
```typescript
// Source: node_modules/@upstash/ratelimit/dist/index.d.ts lines 39-91
type RatelimitResponse = {
  success: boolean;       // Whether request may pass
  limit: number;          // Max requests in window
  remaining: number;      // Requests left in current window
  reset: number;          // Unix timestamp (ms) when window resets
  pending: Promise<unknown>;  // Analytics submission (if analytics: true)
  reason?: "timeout" | "cacheBlock" | "denyList";  // Why success/fail
  deniedValue?: string;   // Value that was in deny list
};
```

### Verified Duration Type
```typescript
// Source: node_modules/@upstash/ratelimit/dist/index.d.ts lines 175-176
type Unit = "ms" | "s" | "m" | "h" | "d";
type Duration = `${number} ${Unit}` | `${number}${Unit}`;
// Examples: "1 m", "1m", "30 s", "1 h", "500 ms"
```

### Verified Redis.ping() Method
```typescript
// Source: node_modules/@upstash/redis/zmscore-BjNXmrug.d.ts line 4100
ping: (args?: CommandArgs<typeof PingCommand>) => Promise<string>;
// Returns "PONG" on success
```

### Verified Redis.fromEnv() Behavior
```typescript
// Source: node_modules/@upstash/redis/nodejs.js lines 4943-4960
// fromEnv() only console.warn()s on missing vars -- does NOT throw
// Passes undefined to constructor, which may cause runtime errors later
// Conclusion: Use conditional init (D-05) instead of fromEnv()
```

### CI Env Block Pattern (existing)
```yaml
# Source: .github/workflows/ci.yml lines 108-111
- name: Build Next.js
  env:
    NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
    NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder
  run: pnpm build
```

### Test Setup Pattern (existing)
```typescript
// Source: src/test/setup.ts -- project-wide Vitest setup
// Currently sets: GOOGLE_MAPS_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
// NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// Does NOT set UPSTASH env vars -- tests should mock at module level, not rely on env
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Redis.fromEnv()` | Conditional `new Redis({url, token})` | Phase 108 (this phase) | Safer null handling; `fromEnv()` only warns on missing vars |
| `@upstash/ratelimit` v1.x | v2.0.8 | Jan 2026 | `ephemeralCache` auto-created by default; `cacheScripts` deprecated |
| `void asyncFn()` for fire-and-forget | `after()` from `next/server` | Next.js 15+ | Prevents premature termination on Vercel |
| Manual `waitUntil(pending)` | Analytics `pending` is best-effort | Current | SDK handles graceful abandonment in serverless |

**Deprecated/outdated:**
- `cacheScripts` option: Deprecated since v2.0.3. Hash values are now hardcoded in the SDK. Do not set.
- `Redis.fromEnv()` for conditional init: Only warns, doesn't throw. Use manual construction with env var check.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (installed, configured in `vitest.config.ts`) |
| Config file | `vitest.config.ts` (jsdom environment, `@` alias, globals: true) |
| Quick run command | `pnpm test -- --run src/lib/rate-limit` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01a | checkRateLimit returns limited:false when under limit (Redis path) | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | Wave 0 |
| INFRA-01b | checkRateLimit returns limited:true with 429 response when over limit | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | Wave 0 |
| INFRA-01c | checkRateLimit falls back to in-memory when limiter is null | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | Wave 0 |
| INFRA-01d | checkRateLimit falls back to in-memory on Redis error | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | Wave 0 |
| INFRA-01e | checkServerActionRateLimit mirrors API route fallback behavior | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | Wave 0 |
| INFRA-01f | In-memory bucket expires after 60s window | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | Wave 0 |
| INFRA-01g | All 13 limiter exports are non-null when Redis configured | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | Wave 0 |
| INFRA-01h | getClientIp extracts IP from x-forwarded-for, x-real-ip, fallback | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/identifiers.test.ts` | Wave 0 |
| INFRA-01i | 429 response has correct shape, headers, RATE_LIMITED code | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test -- --run src/lib/rate-limit`
- **Per wave merge:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full verification suite before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/rate-limit/__tests__/check.test.ts` -- covers INFRA-01a through INFRA-01g, INFRA-01i
- [ ] `src/lib/rate-limit/__tests__/identifiers.test.ts` -- covers INFRA-01h

## Open Questions

1. **`pending` promise handling with `analytics: true`**
   - What we know: The SDK returns a `pending` promise for async analytics submission. Current code ignores it. Analytics data may be dropped when serverless function terminates.
   - What's unclear: What percentage of analytics events are actually lost in practice on Vercel.
   - Recommendation: Accept as best-effort (D-08). Not a Phase 108 concern. If analytics become critical later, wrap with `after()`.

2. **Redis PING timeout implementation**
   - What we know: `@upstash/redis` ping returns `Promise<string>`. The client doesn't support `AbortSignal`.
   - What's unclear: Whether `Promise.race` with a timeout rejection is the cleanest pattern or if `@upstash/redis` has a built-in timeout option.
   - Recommendation: Use `Promise.race` with 3s timeout. The Redis constructor's `timeout` option is for rate limit operations only, not general commands.

## Sources

### Primary (HIGH confidence)
- `@upstash/ratelimit` installed type definitions (`node_modules/@upstash/ratelimit/dist/index.d.ts`) -- verified `RegionRatelimitConfig`, `RatelimitResponse`, `Duration`, `slidingWindow` signatures
- `@upstash/redis` installed type definitions + source (`nodejs.js:4943-4960`) -- verified `Redis.fromEnv()` behavior, `ping()` method, constructor options
- Project source files (`src/lib/rate-limit/*.ts`, `src/app/api/health/route.ts`, `src/lib/health/checks.ts`) -- verified current state of all files to modify

### Secondary (MEDIUM confidence)
- [Upstash Ratelimit Features Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/features) -- confirmed ephemeralCache, analytics, timeout behavior
- [Upstash Ratelimit GitHub](https://github.com/upstash/ratelimit-js) -- confirmed v2.0.8 release date (Jan 12, 2026)
- [npm @upstash/ratelimit](https://www.npmjs.com/package/@upstash/ratelimit) -- confirmed 2.0.8 is latest

### Tertiary (LOW confidence)
- None -- all critical claims verified against installed type definitions or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- both packages installed, type definitions verified, API confirmed against source
- Architecture: HIGH -- pattern is restoration of Phase 69 design; all integration points verified in source code
- Pitfalls: HIGH -- all pitfalls verified against actual code (env var typo, server action gap, health hardcode) or installed SDK behavior (timeout default, fromEnv warnings)

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable packages, no upcoming breaking changes)
