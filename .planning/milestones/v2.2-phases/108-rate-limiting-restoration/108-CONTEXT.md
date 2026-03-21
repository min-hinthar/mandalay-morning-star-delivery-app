# Phase 108: Rate Limiting Restoration - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning
**Mode:** Auto-resolved with deep 4-area analysis (32+ questions, recommended choices selected)

<domain>
## Phase Boundary

Provision Upstash REST Redis and restore all 13 rate limiters from null to functional distributed instances. Fix server action fallback gap, health endpoint false reporting, and misleading comments. Add unit tests. No new endpoints, no UI changes, no new rate limit tiers.

</domain>

<decisions>
## Implementation Decisions

### Redis provisioning
- **D-01:** Provision Upstash REST Redis via Vercel Dashboard -> Storage -> Create Database (HTTP protocol, not TCP)
- **D-02:** Two env vars: `UPSTASH_REDIS_REST_URL` (https://...) + `UPSTASH_REDIS_REST_TOKEN` -- add token to `.env.example` (currently undocumented)
- **D-03:** Free tier sufficient (~5K-15K commands/day at current scale of 1 admin, 2-4 drivers, 10-50 customers)
- **D-04:** Redis Cloud (TCP `redis://`) is incompatible with `@upstash/redis` (HTTP-only) -- this is why limiters were disabled on 2026-03-08

### Client restoration pattern
- **D-05:** Conditional init: `const redis = process.env.UPSTASH_REDIS_REST_URL ? new Redis({...}) : null` -- preserves null-safety for dev environments
- **D-06:** `createLimiter()` helper consuming `RATE_LIMITS` config from `config.ts` with `Ratelimit.slidingWindow()`
- **D-07:** Each constructor gets `ephemeralCache: new Map()` to reduce Redis roundtrips (~30-50% fewer commands for repeat identifiers)
- **D-08:** Each constructor gets `analytics: true` for Upstash dashboard monitoring
- **D-09:** Prefix pattern: `rl:{tier-name}` -- matches Phase 69 original design
- **D-10:** All 13 limiter exports restored: authSignIn (5/1m), authSignUp (3/1h), apiWrite (10/1m), publicRead (60/1m), driverLocation (2/1m), driverAction (10/1m), customer (30/1m), admin (120/1m), global (120/1m), checkout (3/1m), refund (5/1m), adminBulk (10/1m), webhook (30/1m)

### Rate limit tuning & safety margins
- **D-25:** Deploy with 2x env var overrides for first week -- set doubled RATE_LIMIT_* values in Vercel, no code changes. Tune down after monitoring confirms no false positives.
- **D-26:** Bump webhook default from 30/1m to 60/1m in config.ts -- Stripe/Resend can burst during batch events, webhooks are server-to-server not abuse vectors
- **D-27:** No "dry run" mode -- over-engineering. In-memory fallback ran 12 days without incident. 2x limits provide sufficient safety margin.
- **D-28:** No per-endpoint rate limit configuration -- tier system already provides role-based grouping. Per-endpoint is over-engineering at current scale.
- **D-29:** Keep all other tier defaults unchanged: driver location (2/1m), checkout (3/1m), admin (120/1m) -- all have sufficient headroom for current usage patterns
- **D-30:** No env var bounds validation -- config.ts has sensible defaults, env vars are admin-controlled

### Unwired limiters documentation
- **D-11:** `authSignUpLimiter` -- unwired by design (OTP app, no discrete signup endpoint). Add inline comment.
- **D-12:** `globalLimiter` -- per-IP safety net, reserved for future use. Add inline comment.
- **D-13:** `adminBulkLimiter` -- no bulk admin endpoints exist. Add inline comment.

### Server action fix
- **D-14:** `checkServerActionRateLimit()` gets in-memory fallback + try/catch matching `checkRateLimit()` pattern -- currently silently allows all requests when limiter is null (security gap for auth server actions)
- **D-15:** Fallback uses `inMemoryRateLimit()` with 15 req/min (matches H-05 defense-in-depth pattern)
- **D-16:** Redis errors caught and logged with `flowId: "rate-limit-fallback"`, then fall back to in-memory

### Failure mode behavior & degradation
- **D-31:** Fail closed on Redis outage -- 15 req/min flat in-memory for ALL tiers. No tiered in-memory fallback (simplicity over precision during degradation).
- **D-32:** No retry logic or circuit breaker -- Upstash REST is HTTP, each request is independent. Next request tries Redis automatically.
- **D-33:** Degradation is invisible to users -- normal 429 if actually limited, never "Redis is down" messages
- **D-34:** Log Redis-to-in-memory transitions at WARN level with `flowId: "rate-limit-fallback"` (existing pattern in checkRateLimit, mirror for server actions)
- **D-35:** Redis errors trigger Sentry breadcrumb -- human action: create alert rule on `flowId: "rate-limit-fallback"` in Sentry dashboard
- **D-36:** Keep 5min cleanup interval for in-memory buckets -- Vercel functions live ~15min max, buckets are tiny Map entries

### Health endpoint fix
- **D-17:** Replace hardcoded `const redisConfigured = true` with `Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)`
- **D-18:** Add Redis PING in deep health check (`?deep=true`) -- import `getRedisClient()`, call `client.ping()` with 3s timeout, return latency or degraded status

### Health check & monitoring depth
- **D-37:** Dual-mode health: env var check for basic mode, actual PING for `?deep=true`
- **D-38:** Redis health reports as "degraded" not "unhealthy" when Redis is down -- app works without Redis (in-memory fallback)
- **D-39:** PING response includes latencyMs: `{ status: "healthy", latencyMs: X }` or `{ status: "degraded", error: "..." }`
- **D-40:** PING timeout: 3 seconds (Upstash REST typical latency is 5-15ms, >3s = problem)
- **D-41:** No PING result caching -- BetterStack calls ~every 30s, one PING per check is negligible
- **D-42:** No separate `/api/health/redis` endpoint -- health endpoint already aggregates all services
- **D-43:** No command count or connection stats in health -- Upstash dashboard has this natively
- **D-44:** No rate limit tier config in health response -- security risk exposing limit values

### Comment fix
- **D-19:** Fix check.ts line 60 JSDoc: "Fails open when limiter is null" -> "Falls back to conservative in-memory limiter (15 req/min) when Redis is unavailable"

### Unit tests
- **D-20:** Create `src/lib/rate-limit/__tests__/check.test.ts` -- test null limiter path (in-memory), mocked Ratelimit success/failure, server action fallback, discriminated union return types
- **D-21:** Create `src/lib/rate-limit/__tests__/identifiers.test.ts` -- test IP extraction from various header combinations (x-forwarded-for, x-real-ip, missing headers)
- **D-22:** Mock `@upstash/ratelimit` Ratelimit class, not live Redis
- **D-23:** Integration tests with live Redis deferred to Phase 109

### Testing scope & confidence
- **D-45:** Mock Ratelimit class (test our integration code, not Upstash internals)
- **D-46:** Test `createLimiter` helper once + verify all 13 exports are non-null when Redis configured. Don't test each limiter's config separately.
- **D-47:** Test in-memory bucket expiry with `vi.useFakeTimers()` -- verify 60s expiry and 5min cleanup
- **D-48:** Test all IP header edge cases: x-forwarded-for present, x-real-ip present, both missing (-> "unknown"), multiple IPs in x-forwarded-for (take first)
- **D-49:** Test 429 response format: status code, Retry-After header, RATE_LIMITED error code, discriminated union shape
- **D-50:** Test server action return type separately: `{ limited: true, retryAfterSeconds }` for both Redis and in-memory paths
- **D-51:** No concurrent rate limit tests -- race conditions are Redis's responsibility, covered in Phase 109
- **D-52:** No explicit coverage threshold, no snapshot tests -- cover all code paths organically (~90%+ of check.ts lines)

### CI environment
- **D-24:** Export dummy `UPSTASH_REDIS_REST_URL=https://dummy.upstash.io` and `UPSTASH_REDIS_REST_TOKEN=dummy` in CI workflow env blocks -- matches existing Supabase dummy var pattern

### Claude's Discretion
- Exact provisioning documentation format in .env.example
- Log message wording in server action fallback
- Test file organization (describe blocks, test naming)
- Sentry alert rule documentation format in plan (human action, not automatable)
- Whether to add inline comments per unwired limiter or single block comment
- Exact assertion style in tests (toEqual vs toMatchObject vs individual expects)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rate limit module
- `src/lib/rate-limit/client.ts` -- 13 null limiter exports to restore, `getRedisClient()` function
- `src/lib/rate-limit/check.ts` -- `checkRateLimit()` (correct pattern at lines 63-104) + `checkServerActionRateLimit()` (missing fallback at line 163)
- `src/lib/rate-limit/config.ts` -- `RATE_LIMITS` config consumed by constructors, env-var-driven tiers
- `src/lib/rate-limit/identifiers.ts` -- IP extraction (no changes needed, test target)
- `src/lib/rate-limit/index.ts` -- Barrel re-export (no changes needed)

### Health endpoint
- `src/app/api/health/route.ts` -- Hardcoded `redisConfigured = true` at line 57
- `src/lib/health/checks.ts` -- `checkRedis()` returns static "healthy" -- needs real PING

### Precontext research
- `.planning/phases/108-rate-limiting-restoration/108-PRECONTEXT-RESEARCH.md` -- Full analysis: resolved assumptions, data contracts, gotcha inventory (G1-G14), implementation patterns, limiter-to-endpoint mapping
- `.planning/phases/108-rate-limiting-restoration/108-ENHANCEMENT-RECOMMENDATIONS.md` -- Prioritized 12 recommendations (5 MUST, 4 SHOULD, 3 NICE)

### Phase 69 original implementation
- Phase 69 archive (v1.8) -- original sliding window design, wiring to 85+ routes

### Environment
- `.env.example` -- Missing `UPSTASH_REDIS_REST_TOKEN` documentation (line 85 has URL only)
- `.github/workflows/` -- CI env blocks need dummy Redis vars

### Prior phase contracts
- `.planning/phases/104-type-safety-api-corrections/104-CONTEXT.md` -- Type patterns
- `.planning/phases/105-route-lifecycle-guards/105-CONTEXT.md` -- Lifecycle guards
- `.planning/phases/106-timezone-correctness/106-CONTEXT.md` -- Utility reuse pattern
- `.planning/phases/107-data-integrity/107-CONTEXT.md` -- RPC patterns, database.ts maintenance

### Requirements
- `.planning/REQUIREMENTS.md` -- INFRA-01 (distributed rate limiting restored)

### Learnings
- `CLAUDE.md` -- `process.env.KEY` inlined at build time, `void asyncFn()` killed on Vercel
- `.claude/learnings/nextjs.md` -- Next.js env var behavior
- `.claude/learnings/testing.md` -- Mock patterns for Vitest

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `checkRateLimit()` in check.ts (lines 63-104) -- correct pattern to mirror for server action fix
- `inMemoryRateLimit()` in check.ts -- in-memory bucket with 15 req/min, 5min cleanup interval
- `RATE_LIMITS` config in config.ts -- all 13 tiers with env-var overrides
- `getClientIp()` / `getServerActionIp()` / `getIdentifier()` in identifiers.ts -- working, no changes needed
- `useRateLimitToast` hook -- client-side 429 handling with checkout-specific message
- `api-client.ts` fetch wrapper -- 429 detection already wired

### Established Patterns
- Conditional module init: `const x = process.env.VAR ? new Client({...}) : null`
- `configOnlyService(boolean)` pattern in health endpoint
- 110+ API routes already call `checkRateLimit()` with appropriate limiter -- no wiring changes needed
- `@upstash/ratelimit@2.0.8` and `@upstash/redis@1.36.2` already installed

### Integration Points
- `client.ts` -- restore `getRedisClient()` + 13 constructors (currently all null)
- `check.ts:163` -- add in-memory fallback to server action function
- `check.ts:60` -- fix misleading comment
- `health/route.ts:57` -- fix hardcoded Redis status
- `checks.ts` -- add real Redis PING for deep health check
- `config.ts` -- bump webhook default from 30 to 60
- `.env.example` -- add token documentation
- `.github/workflows/` -- add dummy env vars

</code_context>

<specifics>
## Specific Ideas

- Precontext research Section 11 has complete implementation patterns -- use `createLimiter()` helper with conditional Redis init
- All 110+ API routes already wired to correct limiters from Phase 69 -- zero route-level changes needed
- 3 unwired limiters (authSignUp, global, adminBulk) are intentional design decisions, not bugs -- document, don't wire
- Server action fix mirrors lines 63-104 of check.ts exactly -- structured logging with `flowId` tags
- Health endpoint deep mode should match existing Supabase deep check pattern
- Deploy with 2x RATE_LIMIT_* env var overrides in Vercel for first week, then tune down after monitoring

</specifics>

<deferred>
## Deferred Ideas

- Integration tests with live Redis -- Phase 109 (QUAL-01)
- Sentry alert rule "Rate Limit Spike" creation -- manual dashboard task, documented as human action
- Wiring globalLimiter/adminBulkLimiter to endpoints -- no current endpoints need them
- authSignUpLimiter wiring -- OTP app has no discrete signup endpoint
- Redis connection pooling optimization -- not needed for HTTP-based Upstash REST
- Per-endpoint rate limit configuration -- tier system sufficient at current scale
- Tiered in-memory fallback (matching Redis tier limits) -- simplicity preferred during degradation
- Circuit breaker pattern -- over-engineering for HTTP-based Upstash REST

</deferred>

---

*Phase: 108-rate-limiting-restoration*
*Context gathered: 2026-03-20*
