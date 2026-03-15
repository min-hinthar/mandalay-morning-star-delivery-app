# Phase 99: Foundation Fixes — Assumptions Analysis

**Analyzed:** 2026-03-14
**Cross-referenced:** learnings (supabase-auth, data-schema, nextjs, react-patterns, mobile-ux, state-management), research/PITFALLS.md, codebase exploration

---

## FOUND-01: Auth Redirect Bug

**Current state:** Auth callback (`/auth/callback/route.ts`) has role-based redirect via `getRoleDashboard()`. 4 distinct flows: OAuth normal, OAuth + driver invite, magic link normal, magic link expired.

**Likely bug:** OAuth flow's `?next=` parameter logic. `isStandardLogin` check (line 171) treats `next === "/" || next === "/login"` as standard → role-based redirect. Bug may be OAuth login page persisting `next=/` incorrectly, or `next` param missing entirely in some OAuth flows.

**Key files:**
- `src/app/auth/callback/route.ts` — 4-flow redirect logic
- `src/lib/auth/role-redirect.ts` — `getRoleDashboard()`
- `proxy.ts` (was middleware.ts, renamed for Next.js 16)

**Learnings to apply:**
- Service client `auth.getUser()` returns null — use `auth.admin.getUserById()`
- `middleware.ts` → `proxy.ts` rename in Next.js 16
- User metadata may be stale after admin update — fallback to query by email

**Risk (HIGH):** Pitfall #5 warns "fixing one path breaks another." Must map all 4 flows, write E2E test stubs BEFORE changing redirect logic. Don't touch driver invite flow — it works.

**Detection:** Log in as admin via Google OAuth with no explicit `?next=` param. If lands on `/` instead of `/admin`, bug confirmed.

---

## FOUND-02/03/04: Order Detail Completeness

**Current state:** Admin `OrderDetailClient.tsx` already shows:
- Order items with modifiers ✓
- Special instructions ✓
- Tip amount in totals ✓
- Payment status (Stripe PI, COD approval) ✓
- Status timeline with timestamps ✓

**Gaps identified:**
- Delivery notes — live on `route_stops`, not `orders`. Order detail page may not join through to `route_stops`.
- Customer contact — `orders.customer_phone` / `orders.customer_name` are denormalized snapshots (migration 20260310). Query pattern: `order.customer_name ?? order.profiles?.full_name ?? null`. Need to verify these are displayed prominently.

**Key files:**
- `src/components/ui/admin/orders/OrderDetailPage/OrderDetailClient.tsx`
- `src/app/api/admin/orders/[id]/details/route.ts`

**Learnings to apply:**
- PostgREST FK hints: only needed for multiple FKs to same table. `route_stops.order_id` is likely single FK — no hint needed.
- `orders` table has two FKs to `profiles` (`user_id` and `contacted_by`) — existing hint `profiles!orders_user_id_fkey` already applied.

**Risk (LOW):** Mostly UI wiring. May need to add route_stops join to order detail API for delivery notes.

---

## FOUND-05: Driver Delivery Notes Input

**Current state:**
- `delivery_notes TEXT` column exists on `route_stops` (migration 001_schema.sql)
- Driver `StopDetail.tsx` displays notes if present (lines 259-275)
- Admin `RouteStopCard.tsx` displays notes if present (lines 202-205)
- **No input/edit UI exists** — read-only display only

**Implementation needed:**
- Textarea + save button on `StopDetail.tsx`
- API endpoint to PATCH `route_stops.delivery_notes`
- No migration needed — column already exists

**Learnings to apply:**
- `.update()` returns no row count — chain `.select("id")` to verify affected rows
- Offline concern (Pitfall #4): `useOfflineSync` was designed for single `delivered` updates. Notes save may need connectivity or queue integration.
- RLS policy check needed — verify driver can update their own route's stops

**Risk (MEDIUM):** Offline sync complexity if driver saves notes during delivery without connectivity.

---

## FOUND-06: Admin Route Timestamps Display

**Current state:**
- `arrived_at TIMESTAMPTZ` and `delivered_at TIMESTAMPTZ` exist on `route_stops`
- Admin route detail API (`/api/admin/routes/[id]`) already returns `arrivedAt` and `deliveredAt` in response
- `RouteStopCard.tsx` does NOT display these timestamps

**Implementation needed:**
- Add formatted timestamps to `RouteStopCard.tsx` UI

**Critical caveat (Pitfall #3):** `arrived_at` may NEVER be populated because driver state machine currently skips `arrived` status (`pending -> delivered` only). Displaying empty timestamps is expected until Phase 101 adds intermediate status transitions.

**Key files:**
- `src/components/ui/admin/routes/RouteStopCard.tsx`
- `src/types/driver.ts` — `StopDetail` interface has `arrivedAt: string | null`

**Risk (VERY LOW):** Pure display addition. Accept empty values until Phase 101.

---

## "Manual Tracking Display"

**Clarification from Pitfall #11:** "Manual tracking" means admin/customer sees which stop the driver is on based on stop statuses, not GPS coordinates. The `LocationTracker` component does live GPS which is out of scope.

**Likely mapping:** This overlaps with FOUND-06 (showing timestamps) and the existing stop status display. May also mean a "current stop" indicator on the admin route detail — showing which stop is `enroute` or `arrived`.

**Key decision:** Whether to disable `LocationTracker` in Phase 99 or defer to Phase 101. Recommend deferring — removing it could break things, and it's not hurting anything if unused.

---

## Implementation Order (Revised)

1. **FOUND-01** — Auth redirect. Map all 4 flows, E2E stubs, then fix. Highest user impact.
2. **FOUND-02/03/04** — Order detail completeness. Batch together, same component/API.
3. **FOUND-06** — Timestamp display. Pure UI, zero risk. Quick win.
4. **FOUND-05** — Driver notes input. Most moving parts (API, RLS, offline considerations).

---

## Dependencies

**From prior phases:** None — Phase 99 is first in v2.1.

**External:** None — all columns/APIs exist.

**Feeds into Phase 100:** OrderDetailPanel may become shared component for route detail. If FOUND-02/03/04 work results in a reusable panel, extract for Phase 100 reuse.

---

## Pitfalls Summary (Phase 99 specific)

| Pitfall | Applies to | Severity | Mitigation |
|---------|-----------|----------|------------|
| #5 Auth callback regression | FOUND-01 | HIGH | E2E tests first, isolate fix |
| #3 State machine missing transitions | FOUND-06 | LOW | Accept empty timestamps |
| #4 Offline sync limitations | FOUND-05 | MEDIUM | Accept notes need connectivity |
| #11 Manual tracking confusion | Scope | LOW | Use stop statuses, not GPS |
| #13 Driver page audit scope creep | General | LOW | Not in Phase 99 scope |

---

## Learnings Index (relevant to Phase 99)

| Learning | File | Relevance |
|----------|------|-----------|
| Service client auth.getUser() null | supabase-auth.md | FOUND-01 auth fix |
| User metadata stale after update | supabase-auth.md | FOUND-01 auth fix |
| Google OAuth email multi-source | supabase-auth.md | FOUND-01 auth fix |
| middleware.ts → proxy.ts | nextjs.md | FOUND-01 auth fix |
| Denormalized contact info on orders | data-schema.md | FOUND-02/03/04 |
| PostgREST FK hints | data-schema.md | FOUND-02/03/04 API joins |
| .update() no row count | CLAUDE.md gotchas | FOUND-05 notes save |
| Vercel kills fire-and-forget | nextjs.md | Any async side effects |
| NEXT_REDIRECT cannot be caught | nextjs.md | FOUND-01 redirect logic |
