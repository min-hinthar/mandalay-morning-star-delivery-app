# Phase 99: Foundation Fixes - Research

**Researched:** 2026-03-14
**Domain:** Auth redirects, order detail completeness, driver delivery notes, admin route timestamps
**Confidence:** HIGH

## Summary

Phase 99 fixes existing bugs and fills UI gaps -- no new libraries, no new tables, no new migrations. The auth redirect bug has TWO redirect mechanisms (server callback + client-side `onAuthStateChange`) that may conflict. Order detail already shows most fields; gaps are delivery notes from `route_stops` join and prominent contact info. Driver delivery notes PATCH endpoint already exists (accepts `deliveryNotes` in the status update schema). Timestamp display is pure UI -- data already flows from API.

**Primary recommendation:** Write E2E tests for auth flows first, then fix the redirect bug by auditing both server and client redirect paths. Batch FOUND-02/03/04 into a single OrderDetailPanel extraction. FOUND-05 and FOUND-06 are low-risk UI additions.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Write E2E tests for all 4 auth flows BEFORE fixing redirect bug
- Build reusable OrderDetailPanel component for Phase 100 reuse
- Show delivery notes from `route_stops` joined through `order_id`
- Customer contact prominent at top with `tel:` and `sms:` links
- Separate "Delivery Info" card section
- Driver notes: manual save button, require connectivity, 2-row textarea
- Timestamps: hide until populated
- Progress summary ("4/7 delivered") on route list + detail, page load only
- Leave LocationTracker alone (defer to Phase 101)

### Claude's Discretion
- Exact layout of "Delivery Info" section within order detail
- E2E test structure and assertion patterns
- RouteStopCard timestamp formatting (relative vs absolute)
- Progress summary visual treatment (text vs progress bar vs badge)

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Auth redirect -- admin/driver land on correct dashboard | Dual redirect mechanism identified (server callback + client AuthSessionListener); `SocialLoginButtons` defaults to `?next=/login`; `isStandardLogin` check triggers role-based redirect; client-side uses `user_metadata.role` which may be stale |
| FOUND-02 | Order detail shows full items with modifiers/instructions | Already implemented in `OrderItemsCard` -- verify no gaps |
| FOUND-03 | Order detail shows tip amount in totals | Already returned as `tipCents` from API, rendered in `TotalsCard` -- verify display |
| FOUND-04 | Order detail shows delivery notes, payment, contact on one screen | API needs `route_stops` join for delivery notes; contact info exists but needs prominence; new "Delivery Info" card section needed |
| FOUND-05 | Driver can add delivery notes per stop | PATCH endpoint exists at `/api/driver/routes/[routeId]/stops/[stopId]` accepting `deliveryNotes`; RLS allows driver update on own routes; UI textarea + save button needed in `StopDetail.tsx` |
| FOUND-06 | Admin route detail shows arrived_at/delivered_at per stop | API already returns timestamps; `RouteStopCard.tsx` just needs timestamp display added |

</phase_requirements>

## Standard Stack

### Core (already installed -- no new deps)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Next.js | 16 | App Router, auth callback route | `proxy.ts` not `middleware.ts` |
| Supabase | latest | Auth, PostgREST queries, RLS | Service client for auth callback |
| Playwright | project version | E2E auth flow tests | Existing `e2e/authentication.spec.ts` to extend |
| date-fns | project version | Timestamp formatting | Already used in `RouteStopCard` |

### No New Dependencies
Phase 99 requires zero new npm packages. Everything is UI wiring, API query changes, and bug fixes using existing stack.

## Architecture Patterns

### Auth Redirect: Dual Path Architecture

The login flow has TWO redirect mechanisms that must be understood:

**Path 1 -- Server callback (authoritative):**
```
Login page -> Supabase OAuth/OTP -> /auth/callback
  -> exchangeCodeForSession()
  -> getRoleDashboard(serviceClient, userId)
  -> NextResponse.redirect(rolePath)
```

**Path 2 -- Client-side listener (cosmetic):**
```
LoginPageClient -> AuthSessionListener -> onAuthStateChange(SIGNED_IN)
  -> reads user_metadata.role
  -> sets successProfile.redirectTo
  -> LoginSuccessCeremony -> router.replace(redirectTo) after 2.8s delay
```

**The bug:** For OAuth, Path 1 fires FIRST (server redirect from callback). The user never sees `LoginSuccessCeremony`. Path 2 only matters for magic link confirmation (where user stays on login page waiting). The actual redirect bug is likely in Path 1 -- specifically in `getRoleDashboard()` falling into the catch block (returns `path: "/"`) or the `isStandardLogin` check not firing correctly.

**Key investigation points:**
1. `getRoleDashboard()` catch block returns `path: "/"` on any DB error -- this would explain landing on homepage
2. Service client RLS vs admin queries -- is `profiles.role` query succeeding?
3. Magic link flow: `signInWithOtp` sets `emailRedirectTo` to `/auth/callback?next=/login` -- should trigger same server path
4. Client-side `AuthSessionListener` uses `user_metadata.role` which can be stale/missing for OAuth users

### OrderDetailPanel: Extracted Reusable Component

```
src/components/ui/admin/orders/OrderDetailPanel/
  index.tsx              # Barrel exports
  OrderDetailPanel.tsx   # Main panel (props-driven, no params/fetch)
  CustomerContactCard.tsx # Name + phone with tel:/sms: links
  DeliveryInfoCard.tsx   # Delivery notes, instructions, route assignment, timestamps
  types.ts               # Shared types extending existing OrderDetail
```

**Pattern:** OrderDetailPanel receives data as props (not fetching itself). This allows Phase 100 to embed it in route detail views with data from the route API. The existing `OrderDetailClient.tsx` becomes a wrapper that fetches data and passes to `OrderDetailPanel`.

### Driver Notes Save: Dedicated PATCH vs Piggyback

The existing PATCH endpoint at `/api/driver/routes/[routeId]/stops/[stopId]` already accepts `deliveryNotes` but ONLY alongside a `status` change (the schema requires `status`). For standalone notes save, either:

**Option A (recommended):** Add a separate API endpoint or modify the validation schema to make `status` optional when `deliveryNotes` is provided.

**Option B:** Create new endpoint `PATCH /api/driver/routes/[routeId]/stops/[stopId]/notes` that only updates `delivery_notes`.

### Route Progress Summary

```typescript
// Computed from route.stats_json (already exists on routes table)
const progress = {
  delivered: route.stats_json?.delivered_stops ?? 0,
  total: route.stats_json?.total_stops ?? 0,
};
// Display: "4/7 delivered"
```

The `stats_json` column is already updated after every stop status change via `updateRouteStats()`. No new queries needed -- just display the existing data.

### Anti-Patterns to Avoid

- **Don't add client-side redirect logic** for auth -- server callback is authoritative
- **Don't query `route_stops` separately** from order detail -- add to existing API query with join
- **Don't auto-save driver notes** -- decision: manual save button
- **Don't poll for progress counts** -- decision: page load only

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth role resolution | Custom metadata parsing | `getRoleDashboard()` service | Already handles profile lookup, self-healing, driver status |
| Timestamp formatting | Custom date logic | `date-fns` `format` + `parseISO` | Already used in `RouteStopCard.formatTime()` |
| Route progress counts | Separate aggregate query | `routes.stats_json` | Already computed and stored by `updateRouteStats()` |
| Contact display | Custom phone formatting | `tel:` and `sms:` link patterns | Already established in `StopDetail.tsx` and `RouteStopCard.tsx` |

## Common Pitfalls

### Pitfall 1: Auth Callback Error Swallowing (FOUND-01)
**What goes wrong:** `getRoleDashboard()` wraps everything in try/catch and returns `path: "/"` on any error. If the profiles query fails (RLS issue, timeout), user silently lands on homepage with no error indication.
**Why it happens:** Defensive error handling meant to prevent crash loops instead hides the bug.
**How to avoid:** In E2E tests, assert the EXACT redirect path. Log the catch block error in production. Consider returning `path: "/login?error=role_lookup_failed"` instead of `/`.
**Warning signs:** User consistently lands on `/` after OAuth login. No error visible.

### Pitfall 2: Client-Side vs Server-Side Redirect Race (FOUND-01)
**What goes wrong:** For magic link flow, user stays on login page. `AuthSessionListener` fires `onAuthStateChange(SIGNED_IN)` and reads `user_metadata.role`. If metadata is stale or missing, redirect goes to `/menu` regardless of actual role.
**Why it happens:** `user_metadata.role` is set by admin update, not guaranteed to be in the JWT immediately. The server callback flow uses DB lookup (reliable), but client listener uses metadata (unreliable).
**How to avoid:** For magic link, rely on server callback redirect (user clicks link, goes to `/auth/callback`, server redirects). Client listener is a fallback -- should NOT override server redirect.

### Pitfall 3: Delivery Notes Schema Requires Status (FOUND-05)
**What goes wrong:** Trying to PATCH just `{ deliveryNotes: "..." }` without `status` field fails validation because `updateStopStatusSchema` requires `status`.
**Why it happens:** The endpoint was designed for status transitions, notes were a secondary field.
**How to avoid:** Either modify schema to make `status` optional when `deliveryNotes` is present, or create a dedicated notes endpoint.

### Pitfall 4: Route Stops Join for Order Detail (FOUND-04)
**What goes wrong:** Order detail API doesn't join `route_stops` because orders can exist without route assignment. A LEFT JOIN through `route_stops.order_id` may return multiple rows if an order was ever reassigned between routes.
**Why it happens:** `route_stops` has a trigger preventing duplicate active assignments, but completed routes may have historical records.
**How to avoid:** Filter `route_stops` join to only include stops from non-completed routes, or take the most recent stop record.

### Pitfall 5: E2E Auth Tests Need Real Supabase (FOUND-01)
**What goes wrong:** Auth E2E tests that mock Supabase don't actually test the redirect bug. The existing `authentication.spec.ts` tests only verify page rendering, not actual login flows.
**Why it happens:** Real auth requires test accounts in Supabase, which may not be configured.
**How to avoid:** Create test users in Supabase (admin + driver + customer roles). Use env vars for test credentials. If OAuth is hard to E2E test, focus on magic link flow which can be simulated.

### Pitfall 6: `.update()` No Row Count Verification (FOUND-05)
**What goes wrong:** Driver saves notes, gets success response, but `.update()` silently affected 0 rows (wrong stop ID, RLS rejection).
**Why it happens:** Known gotcha -- Supabase `.update()` returns no row count by default.
**How to avoid:** Chain `.select("id")` after `.update()` to verify the row was actually modified. Return 404 if no rows affected.

## Code Examples

### Auth Callback -- Identifying the Bug Location
```typescript
// Source: src/app/auth/callback/route.ts, lines 164-186
// The server-side redirect logic (authoritative path)
const result = await getRoleDashboard(serviceClient, sessionData.session!.user.id, email);
const isStandardLogin = next === "/login" || next === "/";

// BUG HUNT: If result.path is "/" (from catch block), user lands on homepage
// Check: Is the profiles query succeeding? Is userId valid?
let redirectPath = result.path;
if (!isStandardLogin) {
  // Deep link authorization check
}
return NextResponse.redirect(`${origin}${redirectPath}`, { status: 302 });
```

### OAuth `?next=` Parameter Flow
```typescript
// Source: src/components/ui/auth/SocialLoginButtons.tsx, line 26
// When redirectTo is undefined (no ?next= on login page), defaults to "/login"
redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo || "/login")}`,
// Result: /auth/callback?next=%2Flogin
// In callback: next === "/login" -> isStandardLogin === true -> role-based redirect
```

### Delivery Notes Save Pattern
```typescript
// Source: existing pattern from src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts
// Must chain .select("id") to verify update succeeded (known gotcha)
const { data, error } = await supabase
  .from("route_stops")
  .update({ delivery_notes: notes })
  .eq("id", stopId)
  .eq("route_id", routeId)  // extra safety
  .select("id");

if (error || !data?.length) {
  return NextResponse.json({ error: "Failed to save notes" }, { status: error ? 500 : 404 });
}
```

### Order Detail API -- Adding Route Stops Join
```typescript
// Add to existing order detail query for delivery notes
// route_stops.order_id is a single FK -- no hint needed (PostgREST FK hint caveat)
const { data: routeStop } = await supabase
  .from("route_stops")
  .select("delivery_notes, arrived_at, delivered_at, route_id, routes(id, status, driver_id)")
  .eq("order_id", orderId)
  .neq("routes.status", "completed")  // only active/planned routes
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
```

### Timestamp Display in RouteStopCard
```typescript
// Source: RouteStopCard.tsx already has formatTime() helper
// Add after delivery notes display (line ~205)
{stop.arrivedAt && (
  <p className="text-xs text-text-muted mt-1">
    Arrived: {formatTime(stop.arrivedAt)}
  </p>
)}
{stop.deliveredAt && (
  <p className="text-xs text-text-muted mt-1">
    Delivered: {formatTime(stop.deliveredAt)}
  </p>
)}
```

### Progress Summary Display
```typescript
// Route list card -- add to RouteCardRow
// stats_json already on the route object from API
const delivered = route.statsJson?.delivered_stops ?? 0;
const total = route.statsJson?.total_stops ?? 0;
// Display: "4/7 delivered" or "0/7" when none delivered
<Badge variant="outline" size="sm">
  {delivered}/{total} delivered
</Badge>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 | File already renamed in this project |
| `auth.getUser()` on service client | `auth.admin.getUserById()` | Supabase learning | Already applied in `getRoleDashboard` |
| `ignoreDuplicates` for upserts | `DO UPDATE WHERE col IS NULL` | DB trigger fix | Already applied in `ensureProfile` |

No deprecated patterns to worry about. All code is current.

## Open Questions

1. **What exactly triggers the auth redirect bug?**
   - What we know: Admin/driver lands on `/` after login. Server callback has `getRoleDashboard()` which should return correct path. Client listener uses metadata which may be stale.
   - What's unclear: Is it the server path failing (catch block returning "/"), or the client path overriding, or something else entirely?
   - Recommendation: E2E tests with real test accounts first. Add logging to `getRoleDashboard()` to identify which path fires in production.

2. **Does the driver notes PATCH need a schema change?**
   - What we know: `updateStopStatusSchema` requires `status` field. Delivery notes are only accepted alongside a status change.
   - What's unclear: Can we make `status` optional without breaking existing callers?
   - Recommendation: Create a separate notes-only endpoint to avoid regression risk. Keep the existing status+notes combo endpoint untouched.

3. **How to handle route_stops join when order has no route?**
   - What we know: Orders exist before route assignment. The join should be LEFT/optional.
   - What's unclear: Can an order appear in multiple `route_stops` across different routes (after reassignment)?
   - Recommendation: Query `route_stops` separately (not as a join), filter to non-completed routes, take most recent.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) + Vitest (unit) |
| Config file | `playwright.config.ts` + `vitest.config.ts` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Admin lands on /admin after OAuth login | E2E | `pnpm test:e2e -- e2e/auth-redirect.spec.ts` | Wave 0 |
| FOUND-01 | Driver lands on /driver after magic link | E2E | `pnpm test:e2e -- e2e/auth-redirect.spec.ts` | Wave 0 |
| FOUND-02 | Order detail shows items with modifiers | unit | `pnpm test -- OrderDetailPanel` | Wave 0 |
| FOUND-03 | Order detail shows tip amount | unit | `pnpm test -- OrderDetailPanel` | Wave 0 |
| FOUND-04 | Order detail shows delivery info section | unit | `pnpm test -- OrderDetailPanel` | Wave 0 |
| FOUND-05 | Driver can save delivery notes | E2E/unit | `pnpm test -- DeliveryNotes` | Wave 0 |
| FOUND-06 | RouteStopCard shows timestamps | unit | `pnpm test -- RouteStopCard` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm typecheck && pnpm test`
- **Per wave merge:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full verification suite before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/auth-redirect.spec.ts` -- E2E tests for 4 auth flows with role-based redirect assertions
- [ ] Unit tests for OrderDetailPanel component (delivery info, contact display)
- [ ] Unit test for driver notes save API (delivery_notes update + .select("id") verification)
- [ ] Unit test for RouteStopCard timestamp rendering (show when populated, hide when null)

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `auth/callback/route.ts`, `role-redirect.ts`, `SocialLoginButtons.tsx`, `LoginPageClient.tsx`, `LoginSuccessCeremony.tsx` -- full auth flow traced
- Codebase inspection: `OrderDetailClient.tsx`, `OrderDetailPage/types.ts`, order detail API -- identified existing fields and gaps
- Codebase inspection: `StopDetail.tsx` (driver), `RouteStopCard.tsx` (admin) -- identified UI components to modify
- Codebase inspection: `driver/routes/[routeId]/stops/[stopId]/route.ts` -- existing PATCH endpoint with `deliveryNotes` support
- Codebase inspection: `003_rls.sql` -- RLS policy `route_stops_update` allows driver update on own routes
- Project learnings: `supabase-auth.md`, `data-schema.md`, `nextjs.md` -- all gotchas cross-referenced

### Secondary (MEDIUM confidence)
- ASSUMPTIONS.md -- cross-referenced analysis of all requirements against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new deps, all existing libraries
- Architecture: HIGH - all components and APIs inspected, patterns clear
- Pitfalls: HIGH - specific bug locations identified, learnings cross-referenced
- Auth bug root cause: MEDIUM - two possible paths identified, needs E2E verification

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain, no moving targets)
