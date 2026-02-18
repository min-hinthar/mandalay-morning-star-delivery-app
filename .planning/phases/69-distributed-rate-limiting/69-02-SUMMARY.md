---
phase: 69-distributed-rate-limiting
plan: 02
subsystem: api
tags: [rate-limiting, upstash, redis, middleware, security, api-routes]

# Dependency graph
requires:
  - phase: 69-distributed-rate-limiting-01
    provides: Core rate-limit library (client.ts, check.ts, identifiers.ts, config.ts)
provides:
  - Upstash rate limiting applied to all 30+ non-exempt API route handlers
  - Auth Server Actions using distributed rate limiting instead of in-memory Map
  - Driver location endpoint using Upstash instead of DB-query-based rate check
  - Redis health check integration
  - Old in-memory rate-limit.ts deleted
affects: [70-role-based-auth-redirects, admin-dashboard, monitoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rate limit after auth check pattern: authenticate -> rate limit by userId/driverId -> business logic"
    - "IP-based rate limiting for public endpoints: getClientIp(request) -> publicReadLimiter"
    - "getRedisClient() getter pattern for health check Redis ping"

key-files:
  created: []
  modified:
    - src/lib/rate-limit/client.ts
    - src/lib/rate-limit/index.ts
    - src/lib/health/checks.ts
    - src/lib/health/types.ts
    - src/app/api/health/route.ts
    - src/lib/supabase/actions.ts
    - src/app/api/checkout/session/route.ts
    - src/app/api/driver/location/route.ts
    - src/app/api/menu/route.ts
    - src/app/api/menu/search/route.ts
    - src/app/api/sections/route.ts
    - src/app/api/coverage/check/route.ts
    - src/app/api/analytics/vitals/route.ts
    - src/app/api/tracking/[orderId]/route.ts
    - src/app/api/addresses/route.ts
    - src/app/api/addresses/[id]/route.ts
    - src/app/api/account/profile/route.ts
    - src/app/api/account/settings/route.ts
    - src/app/api/driver/me/route.ts
    - src/app/api/driver/routes/active/route.ts
    - src/app/api/driver/routes/history/route.ts
    - src/app/api/driver/routes/[routeId]/route.ts
    - src/app/api/driver/routes/[routeId]/start/route.ts
    - src/app/api/driver/routes/[routeId]/complete/route.ts
    - src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts
    - src/app/api/driver/routes/[routeId]/stops/[stopId]/photo/route.ts
    - src/app/api/driver/routes/[routeId]/stops/[stopId]/exception/route.ts

key-decisions:
  - "Removed narrow explicit return type annotations from 9 driver route handlers to accommodate NextResponse<unknown> from rate limit response"
  - "Added getRedisClient() getter to rate-limit/client.ts rather than exporting the redis singleton directly"
  - "checkRedis() deep health check added to checks.ts alongside existing service checks"
  - "Public endpoints use publicReadLimiter (60 req/min/IP); customer endpoints use customerLimiter (30 req/min/userId); driver endpoints use driverActionLimiter (10 req/min/driverId)"

patterns-established:
  - "Rate limit placement: always after auth check, before business logic"
  - "Discriminated union guard: `const rl = await checkRateLimit({...}); if (rl.limited) return rl.response;`"
  - "Public endpoint IP extraction: `const ip = getClientIp(request);`"

# Metrics
duration: 51min
completed: 2026-02-18
---

# Phase 69 Plan 02: Route Rate Limiting Summary

**Upstash distributed rate limiting applied to all 30+ API route handlers across public, customer, and driver endpoints with Redis health monitoring**

## Performance

- **Duration:** 51 min
- **Started:** 2026-02-18T11:52:32Z
- **Completed:** 2026-02-18T12:43:52Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments

- Replaced in-memory Map rate limiter in auth Server Actions with Upstash Redis sliding window
- Applied rate limiting to 5 public endpoints (menu, search, sections, coverage, vitals) by IP
- Applied rate limiting to 5 customer endpoint files (tracking, addresses, addresses/[id], profile, settings) by userId
- Applied rate limiting to 9 driver route files by driverId
- Replaced DB-query-based rate check in driver/location with Upstash (eliminates 1 DB query per request)
- Added Redis connectivity status to health endpoint (config + deep check modes)
- Deleted old in-memory `src/lib/utils/rate-limit.ts`
- Verified webhooks/stripe, webhooks/resend, cron/delivery-reminders, debug/sentry remain exempt

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace auth Server Action rate limiting and apply to critical write routes** - `84d45d86` (feat)
2. **Task 2: Apply rate limiting to public, customer read, and driver action routes + health check** - `ea13c7e6` (feat)

## Files Created/Modified

- `src/lib/rate-limit/client.ts` - Added getRedisClient() getter for health check
- `src/lib/rate-limit/index.ts` - Exported getRedisClient from barrel
- `src/lib/health/checks.ts` - Added checkRedis() deep health check function
- `src/lib/health/types.ts` - Added "redis" to ServiceName union and HealthResponse
- `src/app/api/health/route.ts` - Added Redis config-only status and deep check
- `src/lib/supabase/actions.ts` - Replaced old checkRateLimit with Upstash checkServerActionRateLimit
- `src/app/api/checkout/session/route.ts` - apiWriteLimiter with custom "processing" 429 message
- `src/app/api/driver/location/route.ts` - driverLocationLimiter replaces DB query
- `src/app/api/driver/onboard/route.ts` - apiWriteLimiter
- `src/app/api/orders/[id]/cancel/route.ts` - apiWriteLimiter
- `src/app/api/orders/[id]/retry-payment/route.ts` - apiWriteLimiter
- `src/app/api/orders/[id]/rating/route.ts` - apiWriteLimiter (POST) + customerLimiter (GET)
- `src/app/api/orders/[id]/notes/route.ts` - apiWriteLimiter
- `src/app/api/account/orders/[id]/reorder/route.ts` - apiWriteLimiter
- `src/app/api/menu/route.ts` - publicReadLimiter by IP
- `src/app/api/menu/search/route.ts` - publicReadLimiter by IP
- `src/app/api/sections/route.ts` - publicReadLimiter by IP
- `src/app/api/coverage/check/route.ts` - publicReadLimiter by IP
- `src/app/api/analytics/vitals/route.ts` - publicReadLimiter by IP
- `src/app/api/tracking/[orderId]/route.ts` - customerLimiter by userId
- `src/app/api/addresses/route.ts` - customerLimiter (GET + POST)
- `src/app/api/addresses/[id]/route.ts` - customerLimiter (GET + PUT + DELETE)
- `src/app/api/account/profile/route.ts` - customerLimiter (GET + PATCH)
- `src/app/api/account/settings/route.ts` - customerLimiter (GET + PATCH)
- `src/app/api/driver/me/route.ts` - driverActionLimiter
- `src/app/api/driver/routes/active/route.ts` - driverActionLimiter
- `src/app/api/driver/routes/history/route.ts` - driverActionLimiter
- `src/app/api/driver/routes/[routeId]/route.ts` - driverActionLimiter
- `src/app/api/driver/routes/[routeId]/start/route.ts` - driverActionLimiter
- `src/app/api/driver/routes/[routeId]/complete/route.ts` - driverActionLimiter
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` - driverActionLimiter
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/photo/route.ts` - driverActionLimiter
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/exception/route.ts` - driverActionLimiter

## Decisions Made

- **getRedisClient() getter instead of direct export:** The redis singleton in client.ts is a module-private const. Exporting a getter function is cleaner than making it a named export and avoids linter issues with unused exports during incremental builds.
- **Removed narrow return type annotations from driver routes:** 9 driver routes had explicit `Promise<NextResponse<SomeResponse | { error: string }>>` return types. The rate limit response returns `NextResponse<unknown>` which is incompatible with narrow generic types. Removed the annotations to let TypeScript infer the return type, matching the pattern used in Task 1's driver/location fix.
- **checkRedis in health checks.ts:** Added as a full deep check function alongside existing service checks (Supabase, Stripe, Resend) rather than inlining in the health route, following the established pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused response type interfaces from 8 driver routes + tracking route**

- **Found during:** Task 2 (TypeScript check after removing return type annotations)
- **Issue:** After removing explicit return type annotations to fix `NextResponse<unknown>` compatibility, the response interfaces (e.g., `ActiveRouteResponse`, `StartRouteResponse`) became unused since they were only referenced in the return type annotation
- **Fix:** Removed 8 unused response interfaces and 1 unused type import (`TrackingApiError`)
- **Files modified:** 8 driver route files + tracking/[orderId]/route.ts
- **Verification:** `pnpm typecheck` passes with zero errors
- **Committed in:** ea13c7e6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor cleanup of unused types. No scope creep.

## Issues Encountered

None - plan executed cleanly after addressing the return type compatibility issue.

## User Setup Required

None - no external service configuration required. Upstash Redis env vars were configured in Phase 69 Plan 01.

## Next Phase Readiness

- All non-exempt API routes now enforce distributed rate limiting
- Health endpoint reports Redis connectivity status
- Ready for Phase 70 (role-based auth redirects) which has no rate-limiting dependencies
- Blocker: Upstash Redis must be provisioned via Vercel Marketplace before rate limiting is active in production

---

_Phase: 69-distributed-rate-limiting_
_Completed: 2026-02-18_
