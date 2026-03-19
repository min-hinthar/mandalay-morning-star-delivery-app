# Technology Stack: v2.2 Stability & Correctness

**Project:** Morning Star Delivery App
**Researched:** 2026-03-19
**Overall confidence:** HIGH

## No New Dependencies Required

Every fix in v2.2 uses existing packages or built-in platform capabilities. Zero `pnpm add` needed.

## Existing Stack (Relevant to Fixes)

| Technology | Installed Version | Purpose | Status |
|------------|-------------------|---------|--------|
| `@upstash/redis` | ^1.36.2 | Redis HTTP client for rate limiting | **Installed but unused** -- all limiters null |
| `@upstash/ratelimit` | ^2.0.8 | Distributed rate limiter | **Installed but unused** -- no Redis provisioned |
| `date-fns` | ^4.1.0 | Date manipulation | Used but NOT for timezone work |
| `Intl.DateTimeFormat` | Built-in | Timezone-aware formatting | **Already the timezone strategy** -- custom `getZonedParts()`, `toISOWithTimezone()` |
| Supabase RPCs | N/A | Atomic DB operations | **Pattern established** -- `split_route`, `merge_routes`, `batch_update_stop_indices` |

## Fix-by-Fix Stack Analysis

### 1. Distributed Rate Limiting (CONCERNS Area 3)

**What exists:** `@upstash/redis@^1.36.2` and `@upstash/ratelimit@^2.0.8` are already in `package.json`. The `check.ts` wrapper is production-ready with proper fallback, logging, and header management.

**What's missing:** Upstash REST Redis provisioning. The current production Redis is Redis Cloud (TCP `redis://` URL), which is incompatible with `@upstash/redis` (HTTP-based).

**Fix:** Provision Upstash Redis via Vercel Marketplace. This auto-sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars. Then restore `Redis.fromEnv()` + `Ratelimit` constructors in `client.ts`.

| Item | Decision | Rationale |
|------|----------|-----------|
| Provider | **Upstash REST Redis** (not Redis Cloud, not Vercel KV) | Already have `@upstash/redis` + `@upstash/ratelimit` installed. Vercel KV is deprecated/sunsetted in favor of Upstash directly. Redis Cloud TCP connections are incompatible with serverless (connection pooling, cold starts). |
| Provisioning | Vercel Marketplace integration | Auto-injects env vars, integrated billing, zero config |
| Algorithm | Sliding window (existing choice) | Best balance of accuracy and cost for API rate limiting at 20-50 user scale |
| Cost | Free tier: 500K commands/month | At 20-50 weekly orders, rate limit checks are well under 500K/month even with 13 limiters |
| Version change | None -- keep `@upstash/redis@^1.36.2`, `@upstash/ratelimit@^2.0.8` | Latest npm versions are 1.37.0 and 2.0.8 respectively; caret ranges already cover compatible updates |

**Code change scope:** `src/lib/rate-limit/client.ts` only. Restore ~30 lines of `Ratelimit` constructors that were commented out.

**Confidence:** HIGH -- this is the documented, supported, recommended path. Upstash + Vercel is the canonical serverless rate limiting stack.

---

### 2. Timezone-Safe Date Handling (CONCERNS Areas 1, 2, 6)

**What exists:** Custom `Intl.DateTimeFormat`-based timezone utilities in `src/lib/utils/delivery-dates.ts` and `src/lib/utils/delivery-timezone.ts`. These use `TIMEZONE` constant (`"America/Los_Angeles"`) with `getZonedParts()`, `getZonedDayOfWeek()`, `toISOWithTimezone()`.

**What's missing:** Nothing. The utilities exist. The bugs are in code that *does not use them*:
- Issue A: `new Date(input.scheduledDate + "T12:00:00")` instead of using `toISOWithTimezone()`
- Issue B: Bare ISO strings `${date}T${time}:00` instead of `toISOWithTimezone(date, time)`
- Issue 6: `new Date().toISOString().split("T")[0]` (UTC date) instead of LA-zoned date

| Item | Decision | Rationale |
|------|----------|-----------|
| Library | **None -- use existing `Intl.DateTimeFormat` utilities** | Already built, tested, DST-aware. Adding `date-fns-tz` would be redundant -- the codebase already chose native Intl over library. |
| Pattern | Consistent use of `getZonedParts()` / `toISOWithTimezone()` / `formatDateString()` | Every date operation touching business logic must go through these helpers |
| Cron fix | `Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE })` for YYYY-MM-DD | `en-CA` locale outputs ISO date format natively. No library needed. |

**Code change scope:**
- `src/app/api/checkout/session/route.ts` -- use `toISOWithTimezone()` for scheduled date
- `src/app/api/checkout/session/helpers.ts` -- use `toISOWithTimezone()` for email delivery windows
- `src/app/api/cron/delivery-reminders/route.ts` -- use `Intl.DateTimeFormat` with LA timezone

**Do NOT add:** `date-fns-tz`, `luxon`, `dayjs`, `moment-timezone`. The project's native Intl approach is lighter, already works, and avoids bundle bloat. `date-fns` is installed but deliberately not used for timezone work.

**Confidence:** HIGH -- the utilities are proven in production. The bugs are inconsistent usage, not missing capability.

---

### 3. Database RPC for Atomic Counter Increment (CONCERNS Area J)

**What exists:**
- Trigger `trg_update_driver_deliveries` on `route_stops` table -- fires `update_driver_deliveries_count()` on each stop status change to `delivered`. This ALREADY increments `drivers.deliveries_count` per-stop.
- Application code calls `supabase.rpc("increment_driver_deliveries", { p_driver_id, p_count })` which does NOT exist, silently fails.

**The real issue:** The trigger handles per-stop incrementing. The explicit RPC call in `complete/route.ts` was intended to do a bulk increment on route completion, but:
1. The trigger already fires per-stop, so the count is updated incrementally
2. Adding a bulk RPC on completion would DOUBLE-COUNT deliveries

| Item | Decision | Rationale |
|------|----------|-----------|
| Approach | **Remove the `rpc("increment_driver_deliveries")` call** | The trigger `update_driver_deliveries_count()` already handles this atomically per-stop. Adding a bulk RPC on route completion would double-count. |
| Verification | Verify trigger exists in production DB | The trigger is defined in `002_functions.sql` (lines 194-215). Confirm it was applied. |
| Fallback | If trigger is missing in prod, create migration to re-apply it | The function + trigger SQL already exists -- just needs a new migration file to ensure it's applied |

**Code change scope:**
- `src/app/api/driver/routes/[routeId]/complete/route.ts` -- remove the try/catch RPC block (lines 107-118)
- Optionally add a verification query: `SELECT deliveries_count FROM drivers WHERE id = $1` to log if count seems wrong

**Confidence:** HIGH -- the trigger is the correct atomic pattern. Per-stop counting via trigger is more reliable than bulk application-level RPC because it cannot miss stops.

---

### 4. Race Condition Prevention (CONCERNS Area 9)

**What exists:** SELECT next pending stop + UPDATE to enroute as two separate Supabase client calls (lines 168-180 of `stops/[stopId]/route.ts`).

**What's needed:** Atomic UPDATE...WHERE...RETURNING pattern via PostgreSQL RPC.

| Item | Decision | Rationale |
|------|----------|-----------|
| Approach | **PostgreSQL RPC `promote_next_stop(p_route_id, p_after_index)`** | Single atomic operation. Cannot race -- PostgreSQL row-level lock ensures only one caller wins. |
| Alternative rejected | Supabase client `.update().eq().select()` chain | Cannot express `ORDER BY` + `LIMIT 1` in an UPDATE via PostgREST. Must be server-side SQL. |
| Pattern | Matches existing `update_route_stats`, `batch_update_stop_indices`, `split_route` RPC pattern | Project already has 8+ RPCs. This is the established pattern for atomic multi-step DB operations. |

**Migration SQL pattern:**
```sql
CREATE OR REPLACE FUNCTION promote_next_stop(p_route_id uuid, p_after_index int)
RETURNS TABLE(stop_id uuid, stop_index int) AS $$
BEGIN
  RETURN QUERY
  UPDATE route_stops
  SET status = 'enroute'
  WHERE id = (
    SELECT id FROM route_stops
    WHERE route_id = p_route_id
      AND status = 'pending'
      AND route_stops.stop_index > p_after_index
    ORDER BY route_stops.stop_index
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING route_stops.id AS stop_id, route_stops.stop_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Key detail:** `FOR UPDATE SKIP LOCKED` ensures that if two concurrent requests race, the second one skips the already-locked row and finds no match (returns empty), rather than blocking or double-promoting.

**Code change scope:**
- New migration file for `promote_next_stop` RPC
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` -- replace SELECT+UPDATE with `supabase.rpc("promote_next_stop", { p_route_id: routeId, p_after_index: currentStopIndex })`

**Confidence:** HIGH -- atomic UPDATE with subquery + SKIP LOCKED is the standard PostgreSQL race condition prevention pattern. Well-documented, battle-tested.

---

### 5. Minor Fixes (No Stack Impact)

| Fix | Stack Impact | Approach |
|-----|-------------|----------|
| `revalidateTag` invalid second arg (Area 5) | None | Remove `{ expire: 0 }` argument |
| `updateRouteStats` counting `enroute` as pending (Issue I) | None | Change filter: separate `enroute` from `pending` in stats |
| `customer_name`/`customer_phone` fallback (Area 7) | None | Add fields to Supabase select query |
| `delivery_zones` missing types (Area 4) | None | Run `npx supabase gen types typescript` |
| Future date upper bound (Issue E) | None | Add Zod validation `scheduledDate <= today + 30 days` |
| Route status lifecycle guard (Issue G) | None | Add transition validation in admin PATCH handler |
| Driver route start status mismatch (Issue F) | None | UI gating: show "Accept" for `assigned`, "Start" for `accepted` |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Rate limiting | Upstash REST Redis | Redis Cloud TCP | TCP connections leak/timeout in serverless. Already have `@upstash/redis` installed. |
| Rate limiting | Upstash REST Redis | Vercel KV | Deprecated, migrating to Upstash anyway. Was just a whitelabel of Upstash at 2x cost. |
| Rate limiting | Upstash REST Redis | Cloudflare Workers KV | Wrong platform -- app is on Vercel, not Cloudflare. |
| Timezone | Native `Intl.DateTimeFormat` | `date-fns-tz` | Adds dependency for something already solved. Codebase chose native Intl from the start. |
| Timezone | Native `Intl.DateTimeFormat` | `luxon` | Heavy (68KB gzipped). Overkill for "format date in LA timezone." |
| Race condition | PostgreSQL RPC | Application-level mutex | No shared state in serverless. Can't lock across instances. |
| Race condition | PostgreSQL RPC | Optimistic locking (version column) | Adds schema complexity. Atomic UPDATE is simpler and sufficient. |
| Driver count | Existing trigger | New `increment_driver_deliveries` RPC | Would double-count. Trigger already handles per-stop increments atomically. |

## Installation

```bash
# No new packages needed.
# Existing deps already cover all fixes:
#   @upstash/redis@^1.36.2 (installed, needs Redis provisioning)
#   @upstash/ratelimit@^2.0.8 (installed, needs Redis provisioning)
#   date-fns@^4.1.0 (installed, not used for timezone)
#   Intl.DateTimeFormat (built-in Node.js)
#   PostgreSQL RPCs (via Supabase migrations)
```

## Infrastructure Provisioning Required

| Service | Action | Environment Variables |
|---------|--------|----------------------|
| Upstash Redis | Provision via Vercel Marketplace | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (auto-injected) |

## New Migrations Required

| Migration | Purpose | Pattern |
|-----------|---------|---------|
| `promote_next_stop` RPC | Atomic next-stop promotion to prevent race condition | `UPDATE...WHERE...RETURNING` with `FOR UPDATE SKIP LOCKED` |
| (verify) `trg_update_driver_deliveries` | Confirm trigger is applied in production | Trigger from `002_functions.sql` -- re-apply if missing |

## Sources

- [@upstash/redis npm](https://www.npmjs.com/package/@upstash/redis) -- v1.37.0 latest (HIGH confidence)
- [@upstash/ratelimit npm](https://www.npmjs.com/package/@upstash/ratelimit) -- v2.0.8 latest (HIGH confidence)
- [Upstash Ratelimit Getting Started](https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted) -- `Redis.fromEnv()` pattern (HIGH confidence)
- [Upstash Vercel Integration](https://upstash.com/docs/redis/howto/vercelintegration) -- auto env var provisioning (HIGH confidence)
- [Vercel Redis docs](https://vercel.com/docs/redis) -- Upstash as recommended provider (HIGH confidence)
- [Upstash Pricing](https://upstash.com/pricing/redis) -- 500K commands/month free tier (HIGH confidence)
- [PostgreSQL race condition prevention](https://dev.to/mistval/winning-race-conditions-with-postgresql-54gn) -- atomic UPDATE pattern (HIGH confidence)
- [PostgreSQL SELECT FOR UPDATE](https://stormatics.tech/blogs/select-for-update-in-postgresql) -- SKIP LOCKED pattern (HIGH confidence)
- Codebase: `src/lib/utils/delivery-dates.ts`, `src/lib/utils/delivery-timezone.ts` -- native Intl approach (HIGH, direct inspection)
- Codebase: `supabase/migrations/002_functions.sql` lines 194-215 -- `update_driver_deliveries_count` trigger (HIGH, direct inspection)
- Codebase: `src/lib/rate-limit/client.ts`, `src/lib/rate-limit/check.ts` -- rate limiter infrastructure (HIGH, direct inspection)
