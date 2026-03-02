# Phase 84: Production Hardening - Research

**Researched:** 2026-03-02
**Domain:** API hardening, query optimization, pagination, database indexes, error handling
**Confidence:** HIGH

## Summary

Phase 84 focuses on hardening the existing delivery app for production use at 50-order/4-driver Saturday cycle scale. The codebase already has solid foundations: distributed rate limiting via @upstash/ratelimit with 9 tier-based limiters, Sentry integration through a structured logger, and Supabase PostgREST queries with relation joins. The work is primarily refactoring and augmentation of existing patterns rather than greenfield development.

The main N+1 query is in `/api/admin/ops/orders` where notification_logs are fetched in a separate query after orders. Admin list endpoints (orders, drivers, menu, categories, routes) currently return all rows with `.limit()` but no offset pagination or total counts. Only the emails endpoint has proper pagination. Error handling uses a generic `logger.exception(error, { api, flowId })` pattern but lacks domain-specific Sentry context (order amounts, driver IDs, route details).

**Primary recommendation:** Execute in 4 parallel-safe waves: DB migration (indexes) first, then API hardening (rate limits + error context + N+1 fix + pagination) in parallel, followed by modifier validation, then verification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Keep existing 9 tier-based limiters as defaults
- Add endpoint-specific overrides for sensitive/expensive endpoints
- Bulk status endpoint: validate request body (max 100 order IDs) AND apply stricter rate limit
- Keep current 429 + Retry-After response pattern (useRateLimitToast already handles client-side)
- Offset pagination with numbered pages on ALL admin list pages
- Display "Showing X of Y" with correct totals
- Default page size: 25 rows
- Pagination state in URL query params (?page=2) -- shareable, survives refresh
- Applies to: orders, drivers, emails, menu items, categories, routes, analytics -- every list
- Critical paths = money + delivery: checkout, payment retry, refunds, order status changes, route operations, driver delivery actions
- Structured Sentry context per domain: order ID + status + amount for checkout, driver ID + route ID for delivery, customer ID for payment
- Error tracking only -- no Sentry performance tracing/spans
- All critical paths get specific catch blocks with correct HTTP status codes
- Full join in single query: orders + driver info + delivery addresses (through route_stops relations)
- Eliminates N+1 pattern (currently does sequential query for notification_logs)
- Add indexes based on code query patterns (no benchmarking needed at 50-order scale)
- Target patterns: orders by status/date, unassigned orders, notification logs, routes by date

### Claude's Discretion
- Which specific endpoints get rate limit overrides (based on query complexity and external calls)
- N+1 fix approach for ops dashboard (DB view vs joined query vs parallel queries)
- Error response format to clients (error codes vs generic messages)
- Modifier price delta validation layer (API-only vs API + DB constraint)
- Pagination component design and UX details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HARD-01 | Rate limit fallback -- reduce to 5 req/min, endpoint-specific limits | Existing rate-limit infrastructure supports endpoint-specific overrides via `checkRateLimit({ limiter })` -- need new limiter instances per endpoint |
| HARD-02 | Error context -- specific catch blocks, correct HTTP status codes | Logger already integrates Sentry; upgrade `extra` context with domain-specific fields per critical path |
| HARD-03 | N+1 fix -- join driver info in order queries | Ops dashboard does 2 queries (orders + notification_logs); fix with single Supabase join query using relation syntax |
| HARD-04 | Admin pagination -- total counts + "showing X of Y" | Emails endpoint already implements pagination pattern with `.select(*, { count: 'exact' })` + `.range()` -- replicate to all admin list endpoints |
| HARD-05 | Audit missing DB indexes | Composite indexes needed: orders(status, placed_at), orders(status) WHERE status NOT IN ('delivered','cancelled') for unassigned, notification_logs(order_id, created_at DESC) |
| HARD-06 | Modifier price delta validation in checkout | Checkout already validates base price drift (BUG-08); extend to validate modifier price_delta_cents against DB at checkout time |
| HARD-07 | Sentry integration review -- all critical paths covered | All API routes have try/catch with logger.exception but lack structured context; add orderId, amount, status, driverId to Sentry extra fields |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @upstash/ratelimit | installed | Distributed rate limiting | Already in use with 9 tiers; add endpoint-specific instances |
| @sentry/nextjs | installed | Error tracking | Already configured; enhance context fields |
| @supabase/supabase-js | installed | Database queries | PostgREST relation joins for N+1 fix, `.range()` for pagination |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | installed | Request validation | Validate pagination params, bulk request body size |

### Alternatives Considered
None -- phase uses only existing installed dependencies (v1.9 decision: zero new npm packages).

## Architecture Patterns

### Pattern 1: Paginated API Response
**What:** Standard pagination shape for all admin list endpoints
**When to use:** Every GET endpoint returning lists
**Example:**
```typescript
// Supabase query with count + range
const query = supabase
  .from("orders")
  .select("id, status, ...", { count: "exact" })
  .order("placed_at", { ascending: false })
  .range(offset, offset + limit - 1);

const { data, error, count } = await query;

// Standard response shape
return NextResponse.json({
  data: data ?? [],
  pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
});
```

### Pattern 2: Endpoint-Specific Rate Limiter
**What:** Create specific limiter instances for sensitive endpoints beyond tier defaults
**When to use:** Checkout, refunds, bulk operations, external API calls
**Example:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "@/lib/rate-limit";

// In rate-limit/config.ts - add endpoint-specific configs
export const ENDPOINT_LIMITS = {
  "checkout/session": { max: 3, window: "1 m" },
  "admin/orders/bulk-status": { max: 5, window: "1 m" },
  // ... etc
};
```

### Pattern 3: Structured Sentry Context
**What:** Domain-specific extra fields in logger.exception calls
**When to use:** All critical API paths
**Example:**
```typescript
// Before (generic):
logger.exception(error, { api: "checkout-session", flowId: "checkout" });

// After (structured):
logger.exception(error, {
  api: "checkout-session",
  flowId: "checkout",
  orderId: order.id,
  userId: user.id,
  totalCents: totals.totalCents,
  itemCount: input.items.length,
});
```

### Pattern 4: N+1 Fix via Supabase Join
**What:** Replace sequential queries with a single joined query
**When to use:** Ops dashboard order list
**Example:**
```typescript
// Before: 2 queries
const { data: orders } = await supabase.from("orders").select("...");
const { data: emailLogs } = await supabase.from("notification_logs").select("...").in("order_id", orderIds);

// After: single query with lateral join (or embed notification status in select)
const { data: orders } = await supabase
  .from("orders")
  .select(`
    id, status, ...,
    profiles (full_name, email),
    route_stops (id),
    notification_logs (status, created_at)
  `)
  .order("placed_at", { ascending: false });
```

### Anti-Patterns to Avoid
- **Over-indexing:** At 50-order scale, single-column indexes on frequently filtered columns are sufficient. No need for complex GIN/GiST indexes.
- **Cursor pagination for admin:** At this scale, offset pagination is simpler and allows page jumping. Cursor pagination adds complexity without benefit.
- **Global rate limit reduction:** Don't lower the global `admin` tier from 120/min -- add endpoint-specific limits on top instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Token bucket/sliding window | @upstash/ratelimit (already used) | Edge-compatible, Redis-backed, fail-open |
| Error tracking | Custom error aggregation | Sentry SDK (already configured) | Dedup, alerting, source maps |
| Pagination | Custom pagination logic | Supabase `.range()` + `{ count: 'exact' }` | PostgREST handles offset/count natively |

## Common Pitfalls

### Pitfall 1: Supabase Count Performance
**What goes wrong:** `{ count: 'exact' }` on large tables causes sequential scan
**Why it happens:** PostgreSQL needs to scan all matching rows for exact count
**How to avoid:** At 50-order scale this is negligible. If scaling beyond ~10K rows, switch to `{ count: 'estimated' }` or cache counts.
**Warning signs:** API response times >500ms on list endpoints

### Pitfall 2: N+1 Fix Breaking Response Shape
**What goes wrong:** Changing the ops orders query changes the response shape, breaking the frontend
**Why it happens:** Supabase returns nested objects for joins vs flat objects for direct queries
**How to avoid:** Keep the same mapped response shape -- transform the joined data to match existing API contract
**Warning signs:** Frontend errors after API change, TypeScript type mismatches

### Pitfall 3: Rate Limit Config Collision
**What goes wrong:** Endpoint-specific limiters overriding tier limiters instead of stacking
**Why it happens:** Each `checkRateLimit` call uses ONE limiter; calling it twice would require two checks
**How to avoid:** For endpoints needing stricter limits, just use the stricter limiter directly instead of the tier default. Don't call `checkRateLimit` twice.
**Warning signs:** Endpoints bypassing intended limits

### Pitfall 4: Pagination Off-by-One with Supabase range()
**What goes wrong:** `.range(0, 24)` returns 25 items (inclusive both ends)
**Why it happens:** Supabase range is 0-indexed and inclusive
**How to avoid:** `range((page - 1) * limit, (page - 1) * limit + limit - 1)`
**Warning signs:** Page 1 showing 26 items, last page missing items

### Pitfall 5: Missing Index on Composite Query
**What goes wrong:** Query on `orders WHERE status = X ORDER BY placed_at` does sequential scan
**Why it happens:** Separate indexes on status and placed_at can't be combined efficiently
**How to avoid:** Create composite index `(status, placed_at DESC)` for the most common query pattern
**Warning signs:** Slow response times (though negligible at 50 orders)

## Code Examples

### Existing Pagination Pattern (from emails endpoint)
```typescript
// src/app/api/admin/emails/route.ts -- reference implementation
const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
const rangeStart = (page - 1) * limit;
const rangeEnd = rangeStart + limit - 1;

const query = supabase
  .from("notification_logs")
  .select("...", { count: "exact" })
  .order(sort, { ascending })
  .range(rangeStart, rangeEnd);

const { data, error, count } = await query;
return NextResponse.json({
  data: data ?? [],
  pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
});
```

### Existing Rate Limit Pattern
```typescript
// All API routes follow this pattern:
const rl = await checkRateLimit({
  limiter: adminLimiter,  // tier-based
  identifier: auth.userId,
  role: "admin",
  route: "admin/orders",
});
if (rl.limited) return rl.response;
```

### Existing Error Handling Pattern
```typescript
// Generic pattern used everywhere:
try {
  // ... business logic
} catch (error) {
  logger.exception(error, { api: "admin/orders/[id]/status" });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.limit(100)` no pagination | `.range()` + `{ count: 'exact' }` | Already in emails route | Standard Supabase pagination |
| Generic `logger.exception` | Structured Sentry context | This phase | Better error triage |
| Tier-only rate limits | Endpoint-specific overrides | This phase | Protect expensive paths |

## Open Questions

1. **Bulk status endpoint location**
   - What we know: Success criteria mentions "Bulk status endpoint is rate-limited (max 100 orders per call)"
   - What's unclear: This may refer to the ops dashboard order fetch or a specific bulk update endpoint
   - Recommendation: Check if there's a bulk status update endpoint (ops dashboard already fetches 200 orders). The existing bulk operations in ops use server-side RPC. Rate-limit the ops orders endpoint specifically and validate array size.

2. **Admin pages needing frontend pagination**
   - What we know: API pagination is backend-only; frontend components must add page controls
   - What's unclear: Whether "all admin list pages" includes ops dashboard (real-time polling) and analytics (aggregated data)
   - Recommendation: Add to all admin list API endpoints. Frontend pagination components can be added incrementally. The phase success criteria focuses on API-side "Showing X of Y".

## Sources

### Primary (HIGH confidence)
- Codebase analysis: src/lib/rate-limit/* (config, check, client, identifiers, index)
- Codebase analysis: src/app/api/admin/emails/route.ts (pagination reference)
- Codebase analysis: src/app/api/admin/ops/orders/route.ts (N+1 query)
- Codebase analysis: src/app/api/checkout/session/route.ts (modifier validation)
- Codebase analysis: supabase/migrations/000_initial_schema.sql (existing indexes)
- Codebase analysis: src/lib/utils/logger.ts (Sentry integration)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - patterns derived from existing codebase (emails endpoint pagination, rate limit infrastructure)
- Pitfalls: HIGH - pitfalls identified from actual code patterns in the codebase

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable -- internal refactoring, no external API changes)
