# Phase 108: Rate Limiting Restoration — Enhancement Recommendations

## Priority Matrix

| Priority | Count | Description |
|----------|-------|-------------|
| MUST-HAVE | 5 | Required for success criteria |
| SHOULD-HAVE | 4 | Correctness/quality improvements |
| NICE-TO-HAVE | 3 | Polish and future-proofing |

---

## Recommendations

### 1. Restore Redis Client + 13 Ratelimit Constructors
**Priority:** MUST-HAVE
**What:** Replace all 13 null limiter exports in `client.ts` with `Ratelimit.slidingWindow()` constructors using Upstash REST Redis client.
**Why:** Success criterion #2 — "All 13 Ratelimit constructors return functional instances (not null)." Currently all rate limiting falls back to conservative 15 req/min in-memory, losing tiered enforcement (2-120 req/min per role).
**Design compliance:** Matches Phase 69 original architecture (sliding window, ephemeral cache, `rl:` prefix, env-var-driven config).
**Implementation hint:** Conditional init pattern — `const redis = process.env.UPSTASH_REDIS_REST_URL ? new Redis({...}) : null;` preserves null-safety for environments without Redis. Use `createLimiter()` helper consuming `RATE_LIMITS` config.

---

### 2. Document Upstash REST Provisioning Steps
**Priority:** MUST-HAVE
**What:** Add UPSTASH_REDIS_REST_TOKEN to `.env.example`. Document provisioning: Vercel Dashboard → Storage → Create Database → Upstash Redis.
**Why:** Success criterion #1 — env vars must be set. Token is currently undocumented. Without clear provisioning docs, the phase can't be verified in production.
**Design compliance:** Matches existing .env.example documentation pattern (grouped, commented, with format examples).
**Implementation hint:** Add after existing `UPSTASH_REST_REDIS_URL` line. Include note about free tier (500K commands/month) and auto-region selection.

---

### 3. Fix Health Endpoint Redis Status
**Priority:** MUST-HAVE
**What:** Replace hardcoded `const redisConfigured = true` (health/route.ts line 57) with actual env var check: `Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)`.
**Why:** Health endpoint currently lies — reports Redis "healthy" when it's disabled. Monitoring (BetterStack) can't detect Redis provisioning gaps. After restoration, health endpoint should reflect real connectivity.
**Design compliance:** Health endpoint pattern: `configOnlyService(redisConfigured)` already supports boolean input.
**Implementation hint:** One-line change. Optionally add Redis PING in deep check mode (`?deep=true`).

---

### 4. Fix checkServerActionRateLimit Missing Fallback
**Priority:** MUST-HAVE
**What:** Add in-memory fallback + try/catch error handling to `checkServerActionRateLimit()` in check.ts, matching the pattern in `checkRateLimit()`.
**Why:** Currently when limiter is null, server actions silently allow all requests (`{ limited: false }`) with no logging. API routes have proper fallback (lines 63-80) but server actions don't (line 163-164). This is a security gap — auth server actions (signInWithMagicLink, resendDriverInvite) are unprotected during Redis outage.
**Design compliance:** H-05 fail-closed requirement applies equally to server actions and API routes.
**Implementation hint:** Mirror lines 63-80 and 86-104 from checkRateLimit. Add `inMemoryRateLimit()` call + `logger.warn()` for null limiter case. Wrap `opts.limiter.limit()` in try/catch with same fallback.

---

### 5. Add Unit Tests for Rate Limit Module
**Priority:** MUST-HAVE
**What:** Create `src/lib/rate-limit/__tests__/check.test.ts` and `identifiers.test.ts` with Vitest. Test: null limiter path (in-memory), mocked Ratelimit success/failure, server action fallback, IP extraction from headers.
**Why:** Zero test coverage currently. Phase 109 depends on Phase 108 delivering testable rate limiting. Unit tests catch regressions during restoration without requiring live Redis.
**Design compliance:** Project uses Vitest. Exempt from 400-line rule (test files).
**Implementation hint:** Mock `@upstash/ratelimit` Ratelimit class. Test discriminated union return types. Test in-memory bucket reset behavior. Test `getClientIp` with various header combinations.

---

### 6. Fix Misleading "Fails Open" Comment
**Priority:** SHOULD-HAVE
**What:** Change check.ts line 60 JSDoc from "Fails open when limiter is null" to "Falls back to conservative in-memory limiter (15 req/min) when Redis is unavailable."
**Why:** Comment contradicts actual behavior. Code is fail-closed (in-memory enforces limits). Misleading docs could cause future developers to assume requests are unprotected during Redis outage.
**Design compliance:** Accurate documentation is a project standard.
**Implementation hint:** One-line comment change. Also update line 6 ("Sensitive endpoints fail CLOSED") to match.

---

### 7. Document Unwired Limiters (authSignUp, global, adminBulk)
**Priority:** SHOULD-HAVE
**What:** Add inline comments in client.ts explaining why 3 limiters are exported but unwired: authSignUpLimiter (OTP app, no signup endpoint), globalLimiter (per-IP safety net, reserved), adminBulkLimiter (no bulk endpoints exist yet).
**Why:** Future developers may see unused exports and either wire them incorrectly or remove them. Documentation prevents both.
**Design compliance:** Code comments for non-obvious decisions per project standards.
**Implementation hint:** 1-line comment above each unwired limiter: `/** Unwired: OTP app has no discrete signup endpoint */`

---

### 8. Add Redis PING in Deep Health Check
**Priority:** SHOULD-HAVE
**What:** When `?deep=true` is passed to health endpoint and Redis is configured, execute `redis.ping()` to verify actual connectivity (not just env var presence).
**Why:** env var check only confirms configuration, not connectivity. Deep mode should verify Redis is reachable, matching existing deep checks for Supabase and API routes.
**Design compliance:** Health endpoint deep mode pattern: `checkRedis()` in `src/lib/health/checks.ts` already exists but returns static "healthy".
**Implementation hint:** Import `getRedisClient()` from rate-limit module. If client exists, `await client.ping()` with 3s timeout. Return `{ status: "healthy", latencyMs }` or `{ status: "degraded", error }`.

---

### 9. Add Ephemeral Cache to Reduce Redis Roundtrips
**Priority:** SHOULD-HAVE
**What:** Include `ephemeralCache: new Map()` option in each Ratelimit constructor. This is an Upstash SDK feature that caches recent limit results in-memory, reducing Redis HTTP calls for repeat identifiers within the same serverless invocation.
**Why:** Reduces Redis command count by ~30-50% for users making multiple requests in quick succession. Keeps within free tier limits. Was part of original Phase 69 design.
**Design compliance:** Performance optimization from 69-RESEARCH.md. No behavior change — just fewer Redis roundtrips.
**Implementation hint:** Add `ephemeralCache: new Map()` to `createLimiter()` options object.

---

### 10. Enable Upstash Analytics
**Priority:** NICE-TO-HAVE
**What:** Set `analytics: true` in Ratelimit constructor options. This enables Upstash's built-in analytics dashboard showing rate limit hits, misses, and patterns per prefix.
**Why:** Provides free monitoring without Sentry configuration. Visible in Upstash console. Was part of original Phase 69 design.
**Design compliance:** Observability requirement from 69-RESEARCH.md. Zero code changes to consuming routes.
**Implementation hint:** Add `analytics: true` to `createLimiter()` options. Requires Upstash REST to be provisioned (won't work without Redis).

---

### 11. Update CI Workflow with Dummy Redis Env Vars
**Priority:** NICE-TO-HAVE
**What:** Export `UPSTASH_REDIS_REST_URL=https://dummy.upstash.io` and `UPSTASH_REDIS_REST_TOKEN=dummy` in CI build steps. This prevents `process.env` inlining from producing undefined values in the bundle.
**Why:** After restoration, `client.ts` will reference env vars at module init time. CI builds without these vars will get `undefined` inlined, causing the conditional init to correctly produce null limiters — but explicit dummy values are cleaner and match existing Supabase CI pattern.
**Design compliance:** Matches existing CI pattern for SUPABASE_URL/SUPABASE_ANON_KEY dummy values.
**Implementation hint:** Add to `.github/workflows/*.yml` env blocks alongside existing dummy Supabase vars.

---

### 12. Document Sentry Alert Rule Creation Steps
**Priority:** NICE-TO-HAVE
**What:** Add a markdown section to Phase 108 PLAN documenting manual Sentry alert rule creation: filter on `flowId: "rate-limit-fallback"` → alert immediately (Redis outage detection), and `flowId: "rate-limit"` with threshold >50 in 5min → alert on abuse.
**Why:** PROJECT.md tech debt: "Sentry alert rule 'Rate Limit Spike' needs manual dashboard creation." Can't be automated but can be documented with exact filter syntax.
**Design compliance:** Matches existing Sentry breadcrumb pattern (`flowId` tag).
**Implementation hint:** Document in PLAN.md as human-required step. Include Sentry UI navigation path and filter expressions.

---

## Priority Summary

| # | Recommendation | Priority | Scope |
|---|---------------|----------|-------|
| 1 | Restore Redis client + 13 constructors | MUST-HAVE | client.ts |
| 2 | Document Upstash provisioning + env vars | MUST-HAVE | .env.example |
| 3 | Fix health endpoint Redis status | MUST-HAVE | health/route.ts |
| 4 | Fix Server Action rate limit fallback | MUST-HAVE | check.ts |
| 5 | Add unit tests | MUST-HAVE | __tests__/ |
| 6 | Fix "fails open" comment | SHOULD-HAVE | check.ts |
| 7 | Document unwired limiters | SHOULD-HAVE | client.ts |
| 8 | Add Redis PING in deep health check | SHOULD-HAVE | checks.ts |
| 9 | Add ephemeral cache | SHOULD-HAVE | client.ts |
| 10 | Enable Upstash analytics | NICE-TO-HAVE | client.ts |
| 11 | Update CI workflow env vars | NICE-TO-HAVE | .github/ |
| 12 | Document Sentry alert creation | NICE-TO-HAVE | PLAN.md |

---

_Generated: 2026-03-20 from 12-agent deep phase assumptions protocol._
