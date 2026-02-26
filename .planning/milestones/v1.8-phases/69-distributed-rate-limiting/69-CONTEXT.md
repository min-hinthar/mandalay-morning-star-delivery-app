# Phase 69: Distributed Rate Limiting - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Protect API endpoints with distributed rate limiting using Upstash Redis that works correctly across Vercel serverless instances. Replace existing in-memory Map-based rate limiter. Auth, API, and public endpoints all covered. Stripe webhooks exempt.

</domain>

<decisions>
## Implementation Decisions

### Limit Policies
- Auth endpoint limits: Claude's discretion (roadmap suggests 5/min signIn, 3/hr signUp as starting point)
- Limit key strategy: Claude's discretion (per-IP for unauthenticated, per-user for authenticated is expected)
- Per-route limit values: Claude's discretion — set different limits based on expected traffic patterns per route
- Public menu/catalog endpoints: must be rate-limited (prevent scraping and bot abuse)
- Stripe webhook endpoint: exempt from all rate limiting
- Window algorithm (sliding vs fixed): Claude's discretion based on Upstash SDK capabilities
- Global per-IP fallback limit: Claude's discretion
- Role-based limit tiers: Claude's discretion
- Order creation limit: Claude's discretion (prevent double-orders)
- Supabase auth endpoint proxy-level limits: Claude's discretion (consider Supabase's built-in limits)
- Driver location update burst allowance: Claude's discretion
- Rate limit configuration values stored in **env vars** for tuning without redeploy

### 429 Response Behavior
- User-facing feedback: **toast notification** ("Too many requests. Please wait a moment.")
- Order placement 429: **special reassuring message** ("Your order is being processed. Please don't submit again.")
- Rate limit headers (X-RateLimit-*): Claude's discretion on which responses include them
- Toast specificity (generic vs countdown): Claude's discretion
- JSON error body structure: Claude's discretion (match existing API response patterns)
- Client-side auto-retry on 429: Claude's discretion
- Progressive escalation (increasing cooldowns): Claude's discretion
- Login button disable + countdown on 429: Claude's discretion

### Bypass & Allow-Lists
- Admin bypass: Claude's discretion (full bypass or higher limits)
- Internal calls (Vercel cron, server-to-server): Claude's discretion
- Temporary per-user limit overrides: Claude's discretion
- External webhook exemptions beyond Stripe: Claude's discretion (check codebase for other inbound webhooks)
- Enforcement point (middleware vs per-route): Claude's discretion based on codebase architecture
- Cross-endpoint blocking on abuse: Claude's discretion
- IP blocklist: Claude's discretion
- In-memory fallback when Redis unavailable: Claude's discretion
- Redis health check approach: Claude's discretion (serverless context)
- Rate limit state persistence: **best effort** — acceptable if Redis evicts counters

### Monitoring & Alerts
- Sentry integration for 429 events: Claude's discretion
- Admin dashboard rate limit stats: Claude's discretion
- Log verbosity (all checks vs 429s only): Claude's discretion
- Rate limit logs must include **user role** (customer/driver/admin/anon) for incident analysis
- Use **Vercel Analytics** for tracking 429 metrics over time (already tracks HTTP status codes)
- Automated alert: **yes** — Sentry alert rule when 429 rate exceeds threshold in production
- Admin IP lookup tool: Claude's discretion
- Cost monitoring for Upstash usage: Claude's discretion
- Health endpoint for Redis connectivity: Claude's discretion

### Prerequisites
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

</decisions>

<specifics>
## Specific Ideas

- Env vars for all rate limit values so limits can be tuned on Vercel dashboard without redeploy
- Order placement gets a reassuring "processing" message, not a punitive "too many requests"
- Rate limit logs enriched with user role for distinguishing legitimate driver traffic from abuse
- Sentry alert rule for sustained 429 spikes (possible attack indicator)
- Vercel Analytics already tracks HTTP status — leverage that for 429 monitoring
- Stripe webhooks fully exempt (Stripe controls its own retry/rate behavior)
- Redis state persistence is best-effort — acceptable if counters reset on eviction

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 69-distributed-rate-limiting*
*Context gathered: 2026-02-18*
