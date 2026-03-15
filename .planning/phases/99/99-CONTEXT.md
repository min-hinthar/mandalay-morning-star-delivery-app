# Phase 99: Foundation Fixes - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix auth redirects so admin/driver land on correct dashboard after login. Complete admin order detail to show all order + delivery info on one screen. Add driver delivery notes input. Display tracking timestamps and route progress for admins. Build a reusable OrderDetailPanel for Phase 100.

</domain>

<decisions>
## Implementation Decisions

### Auth Redirect Fix
- Admin/driver currently lands on homepage (`/`) after login — confirmed bug
- Unsure which login method(s) affected — test all
- Write Playwright E2E tests for all 4 auth flows BEFORE fixing: OAuth normal, OAuth + driver invite, magic link normal, magic link expired
- Include driver invite flow in the audit — unknown if it works correctly
- Pitfall #5: "fixing one path breaks another" — isolate fix, don't touch working flows

### Order Detail Completeness
- Build a reusable OrderDetailPanel component that Phase 100 can embed in route detail views
- Show delivery notes from associated `route_stops` (join through `order_id`) when order is assigned to a route
- Customer contact (name + phone) prominent at top with click-to-call and click-to-SMS action buttons
- Add separate "Delivery Info" card/section showing: delivery notes, delivery instructions, route assignment, timestamps
- Use denormalized `orders.customer_name` / `orders.customer_phone` with fallback to `profiles` fields

### Driver Delivery Notes UX
- Notes textarea on stop detail screen, available before marking delivered
- Manual save button (not auto-save) — clearer for non-technical family drivers
- Require network connectivity — no offline sync for notes (Pitfall #4: offline sync wasn't designed for this)
- Short notes expected: 1-2 lines (e.g., "Left at door", "Gate code 1234"). Small textarea, 2 rows.
- Use `.select("id")` after `.update()` to verify write succeeded (known gotcha)

### Timestamp & Tracking Display
- Show `arrived_at` / `delivered_at` on admin RouteStopCard only when populated — hide empty fields
- "Manual tracking" = stop status badges + progress summary, NOT GPS
- Route progress summary ("4/7 delivered") on both route list cards AND route detail page top
- Progress counts update on page load only — no polling
- Leave LocationTracker component alone — defer removal to Phase 101

### Claude's Discretion
- Exact layout of the "Delivery Info" section within order detail
- E2E test structure and assertion patterns
- RouteStopCard timestamp formatting (relative vs absolute)
- Progress summary visual treatment (text vs progress bar vs badge)

</decisions>

<specifics>
## Specific Ideas

- Contact buttons should be tappable `tel:` and `sms:` links for Saturday mobile ops
- Progress counts on route list give admin at-a-glance delivery status without opening each route
- OrderDetailPanel should be extracted as a subfolder component with barrel export (400-line file limit)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OrderDetailClient.tsx`: Existing admin order detail — already shows items, modifiers, tip, payment, timeline
- `StopDetail.tsx` / `StopDetailView.tsx`: Driver stop view — displays delivery notes read-only, has contact buttons
- `RouteStopCard.tsx`: Admin route stop card — has status badges, missing timestamps
- `RouteListTable` / `RouteCardRow`: Route list components — need progress count addition

### Established Patterns
- Denormalized contact: `order.customer_name ?? order.profiles?.full_name ?? null` (data-schema.md)
- PostgREST FK hints: only for multi-FK tables; `route_stops.order_id` single FK — no hint needed
- `.update()` no row count — chain `.select("id")` to verify
- Auth callback: 4-flow structure in `/auth/callback/route.ts`, `getRoleDashboard()` in `role-redirect.ts`
- Proxy (was middleware): `proxy.ts` handles route protection (Next.js 16 rename)

### Integration Points
- Auth callback `isStandardLogin` check (line 171) — likely bug location
- Admin routes API (`/api/admin/routes/[id]`) already returns `arrivedAt`/`deliveredAt` — just not rendered
- Route list API needs aggregate stop counts added to response
- Driver stop detail API needs PATCH endpoint for `delivery_notes`
- RLS check needed: verify driver role can UPDATE `route_stops.delivery_notes`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 99-foundation-fixes*
*Context gathered: 2026-03-14*
