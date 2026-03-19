# Research Summary: v2.2 Stability & Correctness

**Domain:** Bug fixes and correctness improvements for production delivery app
**Researched:** 2026-03-19
**Overall confidence:** HIGH

## Executive Summary

v2.2 is a pure correctness milestone: no new features, no new npm dependencies, no schema additions. Every fix uses existing installed packages or built-in platform capabilities. The four research areas -- distributed rate limiting, timezone-safe date handling, database RPCs for atomic operations, and race condition prevention -- all resolve to established patterns already partially implemented in the codebase.

The rate limiting fix is an infrastructure provisioning task, not a code task. `@upstash/redis` and `@upstash/ratelimit` are already installed; the code to construct limiters was previously written and then disabled when Redis Cloud (TCP) proved incompatible with the HTTP-based `@upstash/redis` client. Provisioning Upstash REST Redis via Vercel Marketplace and restoring the constructors in `client.ts` is the complete fix.

The timezone bugs are the most subtle. The codebase already has correct timezone utilities (`getZonedParts()`, `toISOWithTimezone()`, `formatDateString()`) built on native `Intl.DateTimeFormat`. The bugs are in code paths that bypass these utilities -- using `new Date().toISOString()` (UTC) or bare `${date}T${time}:00` strings (no offset) instead of the established helpers. The fix is consistency, not capability.

The "missing RPC" for driver delivery counts is a red herring. The `update_driver_deliveries_count()` trigger on `route_stops` already increments `drivers.deliveries_count` atomically per stop. The explicit `increment_driver_deliveries` RPC call in `complete/route.ts` was never needed and should be removed, not created -- adding it would double-count deliveries.

The race condition in stop promotion requires one new PostgreSQL RPC (`promote_next_stop`) using the atomic `UPDATE...WHERE...RETURNING` pattern with `FOR UPDATE SKIP LOCKED`. This matches the project's established RPC pattern (8+ existing RPCs).

## Key Findings

**Stack:** Zero new dependencies. Upstash Redis provisioning (infrastructure) + one new PostgreSQL RPC (migration) + consistent use of existing timezone utilities (code).

**Architecture:** All fixes are surgical modifications to existing files. No new components, no new API routes, no schema changes except one RPC migration.

**Critical pitfall:** Timezone fixes must audit email template consumers before changing data formats -- fixing the API to send timezone-aware strings breaks email templates that interpret naive strings as local time.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Type Regeneration & Trivial Fixes** - Low-risk foundation
   - Addresses: Supabase type regen (Issue 4), `revalidateTag` invalid arg (Issue 5), `customer_name`/`customer_phone` fallback (Issue 7), `updateRouteStats` enroute counting (Issue I)
   - Avoids: Type regeneration may expose hidden type errors from schema drift (Pitfall 11) -- better to discover early

2. **State Machine & Lifecycle Guards** - Driver route blocking issues
   - Addresses: Driver route start status mismatch (Issue F), admin route override guard (Issue G), re-backfill migration for orphaned `planned` routes
   - Avoids: Must ship start guard + admin guard + re-backfill together (Pitfall 3, 8) -- deploying one without others creates dead states

3. **Timezone Correctness** - Cross-cutting data integrity
   - Addresses: Checkout `scheduledDate` parsing (Issue A), COD email timestamps (Issue B), cron UTC vs LA date (Issue 6), cutoff-passed date pre-filtering (Issue C), future date upper bound (Issue E)
   - Avoids: All timezone code must be fixed in one pass to prevent format inconsistency (Pitfall 1, 2, 7)

4. **Race Conditions & Atomic Operations** - Data safety
   - Addresses: Next-stop promotion race (Issue 9), remove dead `increment_driver_deliveries` RPC call (Issue J)
   - Avoids: `FOR UPDATE SKIP LOCKED` prevents deadlocks (Pitfall 4); removing RPC call prevents double-counting (Pitfall 6)

5. **Rate Limiting Restoration** - Infrastructure + monitoring
   - Addresses: Provision Upstash REST Redis, restore `Ratelimit` constructors in `client.ts`
   - Avoids: Deploy last with monitoring -- highest operational risk (Pitfall 5); start with 2x intended limits

6. **Integration Tests & Tech Debt** - Confidence + cleanup
   - Addresses: Driver route lifecycle integration tests, `handlers.ts` split
   - Avoids: Cross-test state pollution (Pitfall 9); webhook routing breakage from split (Pitfall 14)

**Phase ordering rationale:**
- Type regen first: all other code changes benefit from accurate types; may surface hidden issues that affect other phases
- State machine before timezone: driver route blockers are higher priority than date format correctness
- Timezone as batch: cross-cutting fix that touches checkout, email, and cron -- must be consistent
- Race conditions mid-milestone: RPC migration deploys to DB before code references it
- Rate limiting last: highest operational risk, needs monitoring, all other fixes should be stable first
- Tests last: require all behavior to be final before writing assertions

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages already installed. Upstash + Vercel is documented canonical path. Zero version research needed. |
| Timezone | HIGH | Utilities exist and work. Bugs are inconsistent usage, not missing capability. Verified by code inspection. |
| Race Conditions | HIGH | Atomic UPDATE + SKIP LOCKED is standard PostgreSQL pattern. Project has 8+ existing RPCs following this pattern. |
| Rate Limiting | HIGH | Upstash REST Redis + Vercel Marketplace is the documented path. Free tier (500K cmd/month) sufficient. |
| Driver Count | HIGH | Trigger exists in migrations (002_functions.sql:194-215). Application RPC call is dead code that should be removed. |

## Gaps to Address

- **Trigger verification:** Confirm `trg_update_driver_deliveries` trigger exists in production DB (it is in migration files but may not have been applied)
- **Email template audit:** Before fixing COD email timestamps, audit `OrderConfirmation` and `AdminNewOrderAlert` templates for date formatting logic
- **Upstash provisioning:** This is a manual Vercel dashboard action, not automatable via code -- document steps for the operator
- **Cache staleness:** The 5-minute `unstable_cache` TTL for business rules is a known issue not fully solved by `revalidateTag` in multi-instance Vercel -- reducing to 60 seconds is a mitigation, not a fix
