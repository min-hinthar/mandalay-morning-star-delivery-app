# Phase 84: Production Hardening - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

The app handles a full Saturday cycle (50 orders, 4 drivers) without performance degradation, data errors, or unmonitored failures. Covers: rate limiting, N+1 query fixes, admin pagination, database indexes, error handling with Sentry context, and modifier price validation.

</domain>

<decisions>
## Implementation Decisions

### Rate Limiting Granularity
- Keep existing 9 tier-based limiters as defaults
- Add endpoint-specific overrides for sensitive/expensive endpoints
- Bulk status endpoint: validate request body (max 100 order IDs) AND apply stricter rate limit
- Keep current 429 + Retry-After response pattern (useRateLimitToast already handles client-side)

### Admin Pagination
- Offset pagination with numbered pages on ALL admin list pages
- Display "Showing X of Y" with correct totals
- Default page size: 25 rows
- Pagination state in URL query params (?page=2) — shareable, survives refresh
- Applies to: orders, drivers, emails, menu items, categories, routes, analytics — every list

### Error Handling & Sentry
- Critical paths = money + delivery: checkout, payment retry, refunds, order status changes, route operations, driver delivery actions
- Structured Sentry context per domain: order ID + status + amount for checkout, driver ID + route ID for delivery, customer ID for payment
- Error tracking only — no Sentry performance tracing/spans
- All critical paths get specific catch blocks with correct HTTP status codes

### Ops Dashboard Query
- Full join in single query: orders + driver info + delivery addresses (through route_stops relations)
- Eliminates N+1 pattern (currently does sequential query for notification_logs)

### Database Indexes
- Add indexes based on code query patterns (no benchmarking needed at 50-order scale)
- Target patterns from success criteria: orders by status/date, unassigned orders, notification logs, routes by date

### Claude's Discretion
- Which specific endpoints get rate limit overrides (based on query complexity and external calls)
- N+1 fix approach for ops dashboard (DB view vs joined query vs parallel queries)
- Error response format to clients (error codes vs generic messages)
- Modifier price delta validation layer (API-only vs API + DB constraint)
- Pagination component design and UX details

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Phase is driven by HARD-01 through HARD-07 requirements with clear success criteria.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/rate-limit/` — Full distributed rate limiting with @upstash/ratelimit, 9 tier-based limiters, env-var-driven config
- `src/lib/rate-limit/check.ts` — `checkRateLimit()` and `checkServerActionRateLimit()` utilities
- `src/lib/hooks/useRateLimitToast.ts` — Client-side toast for 429 responses
- `src/lib/utils/logger.ts` — Logger with `logger.exception()` that integrates with Sentry
- `src/components/ui/admin/OrdersTable.tsx` — Existing orders table (needs pagination added)

### Established Patterns
- Rate limiting: `checkRateLimit({ limiter, identifier, role, route })` pattern used in all API routes
- Error handling: try/catch with `logger.exception(error, { api, flowId })` — needs structured context upgrade
- Supabase queries: `.from("orders").select("..., profiles(...), order_items(...)").order().limit()` — relation joins supported
- Auth: `requireAdmin()` returns `{ success, userId, supabase }` — consistent across all admin routes

### Integration Points
- Admin list pages: `src/app/(admin)/admin/` — orders, drivers, emails, menu pages need pagination
- API routes: `src/app/api/admin/` — 40+ endpoints need rate limit audit
- Ops dashboard: `src/app/api/admin/ops/orders/route.ts` — primary N+1 fix target
- Migrations: `supabase/migrations/` — new migration needed for indexes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 84-production-hardening*
*Context gathered: 2026-03-02*
