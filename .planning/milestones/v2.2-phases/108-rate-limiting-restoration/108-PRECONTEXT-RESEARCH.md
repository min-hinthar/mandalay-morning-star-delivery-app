# Phase 108: Rate Limiting Restoration — Precontext Research

## 1. Resolved Assumptions

### Technical Approach
- **Provision Upstash REST Redis** (not reuse Redis Cloud). `@upstash/redis` is HTTP-only; incompatible with TCP `redis://` protocol. Confidence: HIGH
- **Restore 13 Ratelimit constructors** in `client.ts` using `Ratelimit.slidingWindow()` with config from `config.ts`. Confidence: HIGH
- **Keep in-memory fallback** in `check.ts` as defense-in-depth. Confidence: HIGH
- **Fix checkServerActionRateLimit** missing in-memory fallback + try/catch. Confidence: HIGH
- **Fix health endpoint** to report real Redis status instead of hardcoded `true`. Confidence: HIGH
- **Fix misleading comment** in check.ts line 60 ("fails open" → actually fails closed). Confidence: HIGH

### Scope Boundaries
- **IN**: Redis provisioning docs, client.ts restoration, server action fix, health check fix, .env.example update, comment fixes
- **IN**: Unit tests for rate limit check functions (in-memory path, mocked Redis path, identifier extraction)
- **OUT**: Integration tests with live Redis (Phase 109)
- **OUT**: Sentry alert rule creation (manual dashboard task, documented as prerequisite)
- **OUT**: Wiring globalLimiter/adminBulkLimiter to endpoints (no existing endpoints need them)
- **AMBIGUOUS → RESOLVED OUT**: authSignUpLimiter wiring — app uses OTP (no discrete signup endpoint). Verified in 69-VERIFICATION.md.

### Implementation Order
1. Update .env.example with UPSTASH_REDIS_REST_TOKEN documentation
2. Restore getRedisClient() and 13 Ratelimit constructors in client.ts
3. Fix checkServerActionRateLimit in check.ts (add fallback + try/catch)
4. Fix health endpoint Redis status reporting
5. Fix check.ts line 60 comment
6. Add unit tests
7. Verification suite

### Backend Requirements
- Upstash REST Redis provisioned via Vercel Dashboard → Storage → Create Database
- Two env vars set in Vercel: `UPSTASH_REDIS_REST_URL` (https://...) + `UPSTASH_REDIS_REST_TOKEN`
- Free tier: 500K commands/month (sufficient for ~50 identifiers at current scale)

---

## 2. Realistic Data/Scale Analysis

| Metric | Current | With Redis |
|--------|---------|------------|
| API endpoints protected | 110+ | 110+ (same) |
| Rate limit enforcement | In-memory 15 req/min flat | Tiered 2-120 req/min per role |
| Cross-instance consistency | None (per-isolate) | Full (shared Redis state) |
| Users (concurrent) | ~1 admin, 2-4 drivers, 10-50 customers | Same |
| Redis commands/day (est.) | 0 | ~5K-15K (well within free tier) |
| Latency impact | 0ms (in-memory) | ~5-15ms (Upstash REST HTTP) |

---

## 3. Cross-Phase Contract Inventory

### From Phase 104 (Type Safety)
- `delivery_zones` table typed in database.ts — no impact on rate limiting
- `revalidateTag` 2-arg signature — no impact
- **Must NOT break**: OrderData interface, delivery_zones type safety

### From Phase 105 (Route Lifecycle)
- `VALID_ROUTE_TRANSITIONS` constant — no impact on rate limiting
- Admin PATCH lifecycle guard returns 400 on invalid transition — rate limiter runs BEFORE guard
- Sentry audit trail (`captureMessage`) — async, no interaction with rate limiting
- **Must NOT break**: Route status validation, Sentry audit trail

### From Phase 106 (Timezone)
- `TIMEZONE` constant, `toISOWithTimezone()` — no impact
- Checkout 30-day validation — runs after rate limit check
- **Must NOT break**: Timezone utilities, date validation

### From Phase 107 (Data Integrity)
- `promote_next_stop` RPC — no interaction with rate limiting
- Badge `totalDeliveries = deliveries_count` — no impact
- **Must NOT break**: Atomic stop promotion, driver delivery counts

### Feeds Into Phase 109
- Phase 109 assumes all 13 limiters are functional
- Phase 109 integration tests will exercise rate-limited endpoints
- Phase 109 webhook handler split must preserve rate limiter imports

---

## 4. Gotcha Inventory

### Critical

| # | Gotcha | Source | Fix |
|---|--------|--------|-----|
| G1 | `process.env.KEY` inlined at build time — can't validate dynamically | nextjs.md, CLAUDE.md | Validate at client creation time (`new Redis(...)` throws if URL invalid), NOT via Zod schema on `process.env` object |
| G2 | `void asyncFn()` killed on Vercel — fire-and-forget dies | nextjs.md | Rate limit check is `await`ed inline (correct). Side effects (alerts) must use `after()` |
| G3 | checkServerActionRateLimit has NO in-memory fallback | check.ts:163 | Add fallback + try/catch matching checkRateLimit pattern |
| G4 | Health endpoint hardcodes `redisConfigured = true` | health/route.ts:57 | Replace with actual env var check |

### High

| # | Gotcha | Source | Fix |
|---|--------|--------|-----|
| G5 | check.ts line 60 comment says "fails open" but code fails closed | check.ts:60 | Fix comment to match behavior |
| G6 | In-memory Map not shared across Vercel instances | Infrastructure | Document: in-memory fallback is per-instance, not distributed. Acceptable at current scale |
| G7 | UPSTASH_REDIS_REST_TOKEN missing from .env.example | .env.example | Add alongside URL documentation |
| G8 | Stale test expectations after limit changes | testing.md | Grep for hardcoded `15` and `429` in test files after restoration |
| G9 | Redis timeout in cold start may exceed 3s default | performance.md | Upstash REST is HTTP with ~5-15ms latency; cold start not an issue for REST (no TCP handshake) |

### Medium

| # | Gotcha | Source | Fix |
|---|--------|--------|-----|
| G10 | authSignUpLimiter exported but unwired | client.ts:18 | By design (OTP app). Add code comment documenting this |
| G11 | globalLimiter exported but unwired | client.ts:25 | Designed as per-IP safety net. Not wired to any route. Document as intentional |
| G12 | adminBulkLimiter exported but unwired | client.ts:28 | No bulk admin endpoints exist. Document as reserved for future use |
| G13 | Cleanup interval (5min) may not fire in short-lived serverless | check.ts:32 | Safe: buckets are small, function lifetimes ~15min max on Vercel |
| G14 | CI build needs dummy UPSTASH env vars | tooling.md | Export dummy values in CI workflow env block |

---

## 5. Data Contracts

### Rate Limiter Exports (client.ts)
```typescript
// 13 limiter instances — currently null, to be restored
export const authSignInLimiter: Ratelimit | null;    // 5/1m
export const authSignUpLimiter: Ratelimit | null;    // 3/1h (unwired)
export const apiWriteLimiter: Ratelimit | null;       // 10/1m
export const publicReadLimiter: Ratelimit | null;     // 60/1m
export const driverLocationLimiter: Ratelimit | null; // 2/1m
export const driverActionLimiter: Ratelimit | null;   // 10/1m
export const customerLimiter: Ratelimit | null;       // 30/1m
export const adminLimiter: Ratelimit | null;          // 120/1m
export const globalLimiter: Ratelimit | null;         // 120/1m (unwired)
export const checkoutLimiter: Ratelimit | null;       // 3/1m (HARD-01)
export const refundLimiter: Ratelimit | null;         // 5/1m (HARD-01)
export const adminBulkLimiter: Ratelimit | null;      // 10/1m (unwired)
export const webhookLimiter: Ratelimit | null;        // 30/1m (HARD-01)
export function getRedisClient(): Redis | null;
```

### Rate Limit Check API (check.ts)
```typescript
// Discriminated union return for API routes
type RateLimitResult =
  | { limited: true; response: NextResponse }  // Return immediately
  | { limited: false; headers: Record<string, string> }; // Append headers

// Plain object return for Server Actions
interface ServerActionRateLimitResult {
  limited: boolean;
  retryAfterSeconds?: number;
}
```

### 429 Response Format
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please wait a moment."
  }
}
```
Headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Config Tiers (config.ts)
```typescript
type RateLimitTier =
  | "auth-signin" | "auth-signup" | "api-write" | "public-read"
  | "driver-location" | "driver-action" | "customer" | "admin" | "global"
  | "checkout" | "refund" | "admin-bulk" | "webhook";

const RATE_LIMITS: Record<RateLimitTier, { max: number; window: string }>;
```

### Identifier Extraction (identifiers.ts)
```typescript
function getClientIp(request: Request): string;        // x-forwarded-for → x-real-ip → "unknown"
function getServerActionIp(): Promise<string>;          // Same via next/headers
function getIdentifier(request: Request, userId?: string): string; // userId || IP
```

---

## 6. Existing Infrastructure Analysis

### Rate Limit Module (`src/lib/rate-limit/`)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `index.ts` | 42 | Barrel re-export | Working |
| `client.ts` | 30 | 13 null limiter exports | **Needs restoration** |
| `check.ts` | 184 | Check + in-memory fallback | **Server action gap** |
| `config.ts` | 99 | Env-driven tier config | Working |
| `identifiers.ts` | 43 | IP/user extraction | Working |

### Client-Side 429 Handling
- `src/lib/hooks/useRateLimitToast.ts` — `handleRateLimitResponse()` with checkout-specific reassuring message
- `src/lib/utils/api-client.ts` — Fetch wrapper with 429 detection
- PaymentStepV8 integration — "Your order is being processed" toast on 429

### Package Dependencies
- `@upstash/ratelimit@^2.0.8` (resolved 2.0.8) — latest stable
- `@upstash/redis@^1.36.2` (resolved 1.36.2) — latest stable
- No `@vercel/kv` or `ioredis` installed

### Environment Variables (.env.example)
- `UPSTASH_REST_REDIS_URL` — documented (line 85)
- `UPSTASH_REDIS_REST_TOKEN` — **NOT documented** (gap)
- 26 `RATE_LIMIT_*` variables — all documented with defaults

---

## 7. Design Compliance Matrix

| Principle | Compliance | Evidence |
|-----------|-----------|---------|
| Fail-closed on sensitive endpoints | YES | H-05: in-memory fallback enforces 15 req/min when Redis unavailable |
| Sliding window algorithm | YES | All limiters use `Ratelimit.slidingWindow()` per 69-RESEARCH.md |
| Role-based tier separation | YES | 13 tiers mapped to auth/customer/driver/admin/public roles |
| Env-var configurability | YES | All limits tunable without redeploy via `RATE_LIMIT_*` vars |
| Structured logging | YES | `flowId: "rate-limit"` and `"rate-limit-fallback"` Sentry breadcrumbs |
| Client-side UX | YES | Toast with checkout-specific reassuring message |
| Privacy | YES | Identifier truncated to 8 chars in logs |
| No manual useMemo | YES | React Compiler handles memoization (no rate-limit UI components) |
| 400-line file limit | YES | All rate-limit files well under limit |

---

## 8. Architectural Decisions

### AD-1: Upstash REST Redis (not Redis Cloud / Vercel KV / ioredis)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Upstash REST** | HTTP-based (serverless-friendly), `@upstash/ratelimit` native, free tier sufficient, Vercel Marketplace integration | Adds external dependency, ~5-15ms latency per check | **CHOSEN** |
| Redis Cloud + ioredis | Reuses existing infra | TCP connection pooling incompatible with serverless, requires new package, breaks existing code | Rejected |
| Vercel KV | Vercel-native | Different API, requires code rewrite, `@vercel/kv` not installed | Rejected |
| In-memory only | Zero dependencies | Not distributed, per-instance limits, already proven insufficient for production | Rejected |

### AD-2: Keep In-Memory Fallback as Defense-in-Depth

**Rationale:** H-05 fix from Phase 84 proved its value during launch. When Redis was disabled, fallback kept the app protected. Keep it as safety net for Redis outages.

### AD-3: Sliding Window Algorithm

**Rationale:** Prevents boundary-burst exploit where attacker sends N requests at window boundary, getting 2N effective requests. Per 69-RESEARCH.md recommendation.

### AD-4: Unit Tests in Phase 108, Integration Tests in Phase 109

**Rationale:** Unit tests (mocked Redis, in-memory paths) are self-contained. Integration tests with live Redis belong in Phase 109 (Quality & Maintenance) after provisioning is verified in production.

---

## 9. File Map

### Create
| File | Purpose |
|------|---------|
| `src/lib/rate-limit/__tests__/check.test.ts` | Unit tests for checkRateLimit + checkServerActionRateLimit |
| `src/lib/rate-limit/__tests__/identifiers.test.ts` | Unit tests for IP extraction |

### Modify
| File | Change |
|------|--------|
| `src/lib/rate-limit/client.ts` | Restore getRedisClient() + 13 Ratelimit constructors |
| `src/lib/rate-limit/check.ts` | Fix checkServerActionRateLimit fallback + comment |
| `src/app/api/health/route.ts` | Fix hardcoded Redis status |
| `.env.example` | Add UPSTASH_REDIS_REST_TOKEN documentation |

### Read (dependencies)
| File | Why |
|------|-----|
| `src/lib/rate-limit/config.ts` | Tier definitions consumed by client.ts |
| `src/lib/rate-limit/identifiers.ts` | Identifier extraction (no changes needed) |
| `src/lib/rate-limit/index.ts` | Barrel (no changes needed) |
| `src/lib/health/checks.ts` | Health check Redis validation |

### Reuse (no changes)
| File | Pattern |
|------|---------|
| `src/lib/hooks/useRateLimitToast.ts` | Client-side 429 handling |
| `src/lib/utils/api-client.ts` | Fetch wrapper with 429 |
| 110+ API route files | All already call `checkRateLimit()` with appropriate limiter |

---

## 10. Gray Area Resolutions

| # | Issue | Resolution | Confidence |
|---|-------|------------|------------|
| GA-1 | Upstash REST vs Redis Cloud | Must provision NEW Upstash REST — can't reuse Redis Cloud (protocol incompatible) | HIGH |
| GA-2 | Fail-open vs fail-closed | Code is fail-closed (correct); comment is wrong. Fix comment. | HIGH |
| GA-3 | 13 limiters vs 13 tiers | Perfect 1:1 mapping verified | HIGH |
| GA-4 | Server Action missing fallback | Bug — add in-memory fallback + try/catch to match API route pattern | HIGH |
| GA-5 | authSignUpLimiter unused | By design (OTP app, no discrete signup endpoint) | HIGH |
| GA-6 | globalLimiter unused | Designed as per-IP safety net, never wired. Leave unwired, document. | MEDIUM |
| GA-7 | adminBulkLimiter unused | No bulk admin endpoints exist. Leave unwired, document. | MEDIUM |
| GA-8 | Testing strategy | Unit tests Phase 108, integration Phase 109 | MEDIUM |
| GA-9 | Vercel region | Auto-selected by Upstash on Vercel Marketplace provision | MEDIUM |
| GA-10 | Sliding vs fixed window | All use sliding window by design. Correct, no change. | HIGH |

---

## 11. Implementation Patterns

### Ratelimit Constructor Pattern (from Phase 69 original)
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMITS } from "./config";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function createLimiter(tier: RateLimitTier, prefix: string): Ratelimit {
  const config = RATE_LIMITS[tier];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, config.window as Duration),
    prefix: `rl:${prefix}`,
    ephemeralCache: new Map(),
    analytics: true,
  });
}
```

### Conditional Initialization Pattern
```typescript
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
    })
  : null;

export function getRedisClient(): Redis | null {
  return redis;
}

export const authSignInLimiter = redis ? createLimiter("auth-signin", "auth-signin") : null;
// ... 12 more
```

### Server Action Fix Pattern
```typescript
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
      const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      logger.warn("Rate limit exceeded", {
        api: opts.route,
        flowId: "rate-limit",
        role: opts.role,
        identifier: opts.identifier.substring(0, 8) + "...",
      });
      return { limited: true, retryAfterSeconds };
    }
    return { limited: false };
  } catch (err) {
    // H-05: Redis timeout/error — use in-memory fallback
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

---

## 12. Health Check Fix Pattern

### Current (hardcoded)
```typescript
// health/route.ts line 57
const redisConfigured = true; // WRONG — always reports healthy
```

### Restored
```typescript
const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
```

---

## 13. Historical Context

### Timeline
| Date | Event | Commit |
|------|-------|--------|
| 2026-02-18 | Phase 69: Rate limiting implemented (9 limiters) | f0880b61 |
| 2026-02-18 | Phase 69: Wired to 85+ API routes | 84d45d86 |
| 2026-02-26 | Phase 84: H-05 in-memory fallback added | b2db35e3 |
| 2026-03-02 | Phase 84: HARD-01 endpoint-specific limiters (4 more) | ba67c826 |
| 2026-03-08 | Launch prep: env var rename | d2d41e7f |
| 2026-03-08 | **All limiters disabled** (Redis Cloud incompatible) | c1a74a8d |
| 2026-03-20 | Phase 108: Restoration (this phase) | — |

### Why Limiters Were Disabled
Production infrastructure was provisioned with **Redis Cloud** (TCP `redis://` protocol). The rate limiting library (`@upstash/redis`) requires **Upstash REST** (HTTP `https://` protocol). Protocol mismatch made them incompatible. All limiters set to null, triggering the H-05 in-memory fallback (15 req/min).

---

## 14. Limiter-to-Endpoint Mapping (Top-Level)

| Limiter | Endpoint Count | Auth | Identifier | Config |
|---------|---------------|------|------------|--------|
| adminLimiter | ~91 | admin | user.id | 120/1m |
| driverActionLimiter | ~19 | driver | driverId | 10/1m |
| customerLimiter | ~14 | customer | user.id | 30/1m |
| publicReadLimiter | ~8 | anon | IP | 60/1m |
| apiWriteLimiter | ~7 | mixed | user.id/IP | 10/1m |
| webhookLimiter | 4 | anon | IP | 30/1m |
| checkoutLimiter | 2 | customer | user.id | 3/1m |
| driverLocationLimiter | 1 | driver | driverId | 2/1m |
| refundLimiter | 1 | admin | user.id | 5/1m |
| authSignInLimiter | 2 (server actions) | anon | email | 5/1m |
| authSignUpLimiter | 0 (by design) | — | — | 3/1h |
| globalLimiter | 0 (unwired) | — | — | 120/1m |
| adminBulkLimiter | 0 (unwired) | — | — | 10/1m |

---

## 15. Design Token Audit Results

N/A — Phase 108 is infrastructure-only. No UI components, design tokens, animations, or visual elements are affected. All existing client-side 429 handling (toast, fetch wrapper) remains unchanged.

---

_Research completed: 2026-03-20. 12 parallel agents across 2 waves._
_Sources: 15 learnings files, 5 rate-limit module files, 4 prior phase directories, 110+ API routes, git history (7 key commits), Phase 69 archive, MEMORY.md._
