# Domain Pitfalls

**Domain:** Route editing/optimization, driver execution flow, admin mobile UX, manual tracking, auth routing -- additions to existing Next.js/Supabase Saturday meal delivery app
**Researched:** 2026-03-14
**Confidence:** HIGH (all findings verified against existing codebase inspection)

---

## Critical Pitfalls

### Pitfall 1: Drag-Reorder Violating UNIQUE(route_id, stop_index) Constraint

**What goes wrong:** Adding drag-to-reorder on the `StopsList` component triggers individual `stop_index` updates that violate the `UNIQUE(route_id, stop_index)` constraint. Swapping stop 0 and stop 1 fails because setting stop 1 to index 0 conflicts with the existing row at index 0.
**Why it happens:** The constraint is `DEFERRABLE INITIALLY IMMEDIATE` (migration `20260313_fix_stop_index_unique_deferrable.sql`), meaning individual UPDATE statements within a non-deferred transaction still fail. The existing `batch_update_stop_indices` RPC handles this by deferring the constraint, but developers building the drag-reorder UI will naturally issue sequential PATCH calls per stop instead.
**Consequences:** 500 errors on reorder, lost stop order, confused admin during Saturday ops.
**Prevention:**
1. Always use the existing `batch_update_stop_indices` RPC for any stop reordering.
2. Build a new API endpoint (e.g., `PATCH /api/admin/routes/[id]/reorder`) that accepts the full ordered array of stop IDs and calls the RPC in one transaction.
3. Never issue per-stop index updates.
**Detection:** Test reorder with 3+ stops. If any swap fails with a unique constraint error, the per-stop approach is in use.

### Pitfall 2: Admin Sidebar Breaks Mobile Layout

**What goes wrong:** `AdminNav` is a fixed 256px sidebar (`flex h-screen`) with layout using `<div className="flex min-h-screen"><AdminNav /><main className="flex-1 overflow-auto">`. On mobile, the sidebar either overlaps content or creates horizontal scroll. The sidebar uses Framer Motion `animate={{ width: isCollapsed ? 64 : 256 }}` with purely local `useState` -- no responsive behavior.
**Why it happens:** `AdminNav` was designed desktop-only. Adding a hamburger menu + off-canvas drawer requires rethinking the layout without breaking the existing desktop sidebar UX, its `layoutId="admin-nav-indicator"` animation, and the 12-item nav structure.
**Consequences:** Admin pages unusable on phone during Saturday kitchen ops -- the primary stated use case for mobile admin. A partially responsive admin is worse than not trying.
**Prevention:**
1. Replace `AdminNav` with a responsive pattern: sidebar on `lg:` screens, off-canvas Drawer on mobile. Reuse the existing portal-based Drawer component from the component library.
2. Persist `isCollapsed` state (localStorage/cookie) so desktop users keep their preference across refreshes.
3. On mobile, remove the sidebar entirely -- don't just collapse it to 64px (icon bar is useless on phones).
4. Test every admin page at 375px width before marking mobile UX complete.
**Detection:** Open any admin page on a phone. If you can't see full content or sidebar overlaps, this pitfall is active.

### Pitfall 3: Driver Route Execution State Machine Missing Transitions

**What goes wrong:** The DB supports `pending -> enroute -> arrived -> delivered/skipped` for stops, but current code only uses `pending -> delivered`. `ActiveRouteView` has `Start Route` (planned -> in_progress) and `Complete Route` (all done -> completed). `SimpleStopView` goes directly from showing the current pending stop to marking it delivered. There's no `arrived` button, no `enroute` transition when navigating, and no way for drivers to mark intermediate statuses.
**Why it happens:** v1.9 built minimal flows: simple mode (photo -> delivered) and active route view (start -> list -> complete). The full execution flow was deferred. But `route_stop_status` enum includes `enroute` and `arrived` -- they exist in the schema but are never written. Building on top without documenting which transitions are allowed leads to inconsistent states.
**Consequences:** Drivers see buttons that don't match their mental model. Admin sees stops stuck in wrong states. Status-based queries become unreliable because `enroute`/`arrived` are never set.
**Prevention:**
1. Document the complete state machine BEFORE writing code: which transitions are allowed, who triggers them (driver vs admin), what side effects each has (timestamps, notifications).
2. Create a shared `isValidTransition(currentStatus, newStatus, role)` function used by both API routes and UI components.
3. For simple mode: keep the simplified flow (photo -> delivered) but auto-set `enroute` when the stop is displayed. Don't force intermediate clicks.
4. For advanced mode: add "Navigate" (sets `enroute`), "I'm Here" (sets `arrived`), "Delivered" (sets `delivered`).
**Detection:** Query the database after a delivery day. If `enroute` or `arrived` statuses never appear, the state machine is incomplete.

### Pitfall 4: Optimistic Updates Without Rollback in Offline Driver Flow

**What goes wrong:** `SimpleStopView` uses `localStatuses` for optimistic updates and `useOfflineSync` for queuing. Adding more status transitions (enroute, arrived) multiplies offline edge cases. Driver marks "arrived" offline, then "delivered" offline. First sync fails (409 conflict). The queue processes in order but can't handle dependency between operations.
**Why it happens:** The existing offline sync queues individual operations without dependency tracking. It was designed for a single `delivered` update per stop.
**Consequences:** Stops in impossible states (e.g., `delivered` without ever being `enroute`). Admin sees data that doesn't match reality.
**Prevention:**
1. For manual tracking (no live GPS), simplify driver-side transitions: `pending -> delivered` or `pending -> skipped`. Don't require intermediate states from drivers.
2. If intermediate states are needed, make the API idempotent: a `delivered` update succeeds even if `enroute` was never recorded. The API should accept any "forward" transition.
3. The offline queue should treat status updates as "set to at-least-this-state" rather than "transition from X to Y".
**Detection:** Put phone in airplane mode, mark 3 stops delivered, re-enable network. Check if all 3 sync correctly.

### Pitfall 5: Auth Callback Role Redirect Regression

**What goes wrong:** The auth callback (`/auth/callback/route.ts`) already has role-based redirect via `getRoleDashboard()`. The "auth routing fix" says admin/driver should land on their dashboard after login -- which the callback already handles for OAuth. The bug is likely in the `?next=` parameter override logic (lines 171-184) or magic link flows. Fixing one path breaks another.
**Why it happens:** The callback has 4 distinct flows: (1) OAuth normal, (2) OAuth with driver invite, (3) magic link normal, (4) magic link expired. The `next` parameter interacts with role authorization checks. The `isStandardLogin` check (line 171: `const isStandardLogin = next === "/login" || next === "/"`) means if `next` is `/`, the user gets role-based redirect -- but if `next` is anything else, it's honored. A magic link without `?next=` sets `next` to `/`, which correctly triggers role-based redirect. The bug may be in the OAuth flow where the `?next=` from the login page persists as `/`.
**Consequences:** Admin logs in and lands on homepage. Driver accepts invite but gets redirected to `/menu`. Customer ends up on `/driver`.
**Prevention:**
1. Write E2E tests for all 4 auth flows BEFORE changing any redirect logic.
2. Map current behavior: for each (role x auth_method x next_param) combination, document where the user lands.
3. Don't touch the driver invite flow -- it works. Isolate the fix.
4. The fix is likely ensuring that the OAuth login page sets `?next=` correctly (or omits it) so the callback's `isStandardLogin` check fires.
**Detection:** Log in as admin via Google OAuth with no explicit `?next=` param. If you land on `/` instead of `/admin`, the bug is confirmed.

---

## Moderate Pitfalls

### Pitfall 6: Leaflet Map SSR Crash When Adding Interactive Features

**What goes wrong:** Adding drag-reorder markers or interactive overlays to the existing `LazyRouteMap`/`RouteBuilderMap` causes SSR hydration errors because Leaflet accesses `window` during import. The existing code uses `ssr: false` dynamic imports, but new Leaflet plugins or custom marker components that aren't dynamically imported cause server-side crashes.
**Prevention:** Every new Leaflet-dependent component must use `dynamic(() => import(...), { ssr: false })`. Keep Leaflet code in dedicated files that are only dynamically imported. Never import Leaflet at module level in server components.

### Pitfall 7: Drag Library Bundle Size and Touch/Scroll Conflict

**What goes wrong:** Adding `@dnd-kit` or `react-beautiful-dnd` for drag-reorder increases bundle. `react-beautiful-dnd` is unmaintained and has React 19 issues. On mobile, drag-reorder conflicts with page scroll -- users try to scroll the stops list but accidentally reorder stops.
**Prevention:**
1. Use `@dnd-kit/core` + `@dnd-kit/sortable` (smallest footprint, React 19 compatible).
2. Add a visible drag handle (grip icon) so touch users distinguish drag from scroll. Without a handle, any touch on the card triggers drag.
3. Test on actual phones -- simulator touch events behave differently.
4. Note: this adds a new npm dependency, breaking v1.9's "zero new packages" streak. Accept this tradeoff for drag-reorder.
5. Consider: for 5-15 stops, "move up/move down" buttons may be more usable on mobile than drag-and-drop.

### Pitfall 8: Route Optimization Overwrites Manual Drag Reorder

**What goes wrong:** Admin manually reorders stops via drag, then clicks "Optimize" which calls `POST /api/admin/routes/optimize` and immediately applies the new order via `batch_update_stop_indices`. The `isManuallyReordered` state already exists in `RouteDetailClient` but isn't used to gate the optimize action. There's no undo.
**Prevention:**
1. Show a confirmation dialog if `isManuallyReordered` is true: "You've manually reordered stops. Optimization will overwrite your changes."
2. Store previous stop order before optimization to enable undo.
3. Rename the "Done" button in `OptimizationModal` to "Apply" and add an "Undo" option post-application.

### Pitfall 9: Admin Tables Not Responsive -- Data Invisible on Mobile

**What goes wrong:** Admin pages use full-width tables (`RouteListTable`, `MenuItemsTable`, `OrdersTable`). On mobile, tables get horizontal scroll (users miss columns) or overflow hidden (data invisible). Adding `overflow-x-auto` doesn't fix usability -- users don't know to scroll horizontally.
**Prevention:**
1. Convert tables to card layouts below `md:` breakpoint. Each row becomes a stacked card showing key fields.
2. Prioritize columns for mobile: status + customer name + total. Hide address and timestamps.
3. Use existing `Badge` component for status indicators in card view.
4. The `RouteCardRow` component already exists in `RouteListTable/` -- extend it as the mobile representation.

### Pitfall 10: Photo Proof Upload Fails on Slow 3G Networks

**What goes wrong:** `PhotoCapture` uploads photos as FormData blobs. On slow networks during delivery, uploads time out or fail silently. The offline queue (`queuePhoto`) stores blobs in IndexedDB, but large photos (2-5MB from phone cameras) can exceed IndexedDB quota on some devices.
**Prevention:**
1. Compress photos client-side before upload (canvas resize to max 1200px, JPEG quality 0.7).
2. Show upload progress indicator.
3. Decouple photo upload from delivery confirmation -- delivery status should succeed even if photo upload fails. The current `SimpleStopView` gates delivery behind photo (`!hasPhoto ? Take Photo : Mark Delivered`), which blocks delivery if camera fails.
4. Make photo optional but encouraged (show a "skip photo" option after 5 seconds).

### Pitfall 11: Manual Tracking Schema Confusion with Existing GPS Tables

**What goes wrong:** The database has a `location_updates` table designed for live GPS tracking (lat/lng, accuracy, heading, speed). The v2.1 requirement is "manual delivery tracking -- no live GPS." Building manual tracking on top of the GPS table creates confusing data. The `LocationTracker` component in `ActiveRouteView` actively uses `useLocationTracking` which watches the browser's geolocation API.
**Prevention:**
1. Manual tracking should use `route_stops.status` + `route_stops.arrived_at`/`route_stops.delivered_at` (already exist in schema). No need for `location_updates`.
2. Remove/disable `LocationTracker` component from `ActiveRouteView` -- it does live GPS which is out of scope.
3. "Manual tracking" means: admin/customer sees which stop the driver is on (based on stop statuses), not GPS coordinates.
4. Don't add manual tracking columns to `location_updates`. Keep that table for potential future GPS use.

---

## Minor Pitfalls

### Pitfall 12: Stop Index Gaps After Remove

**What goes wrong:** Removing a stop (`handleRemoveStop` in `RouteDetailClient`) deletes the row but doesn't reindex remaining stops. Indices become 0, 1, 3, 4 (gap at 2). The optimization algorithm expects contiguous indices.
**Prevention:** After removing a stop, call `batch_update_stop_indices` to reindex remaining stops to 0, 1, 2, 3. Handle this atomically in the stop removal API endpoint.

### Pitfall 13: Driver Page Audit Scope Creep

**What goes wrong:** "Fix all broken/placeholder features end-to-end" is unbounded. The driver section has: earnings, history, schedule, profile, test-delivery, and route execution. Trying to fix everything in one phase leads to a massive PR.
**Prevention:** Audit first, then prioritize. Create a checklist of every driver page. Categorize issues as (a) broken/crashes, (b) placeholder/fake data, (c) works but incomplete. Fix (a) first, then (b). Skip (c) for later.

### Pitfall 14: Framer Motion AnimatePresence Stale Closure in Stop Transitions

**What goes wrong:** Adding step-by-step transitions (current stop slides out, next slides in) can cause stale closure bugs where the exiting animation references wrong stop data because the stops array has already updated.
**Prevention:** Use `key={currentStop.id}` on the stop card wrapper inside `AnimatePresence`. Don't animate the same DOM element between different stops -- let AnimatePresence handle the swap via keys.

### Pitfall 15: Split/Merge Routes Without Updating order.assigned_driver_id

**What goes wrong:** Moving stops between routes doesn't update `orders.assigned_driver_id`. The existing reassign endpoint (`/api/admin/routes/[id]/stops/reassign`) moves the `route_stops` row but may not sync the order's driver assignment.
**Prevention:** Check the reassign API. If it only moves `route_stops`, add logic to update `orders.assigned_driver_id` based on the target route's `driver_id`. Wrap in a transaction.

### Pitfall 16: React Compiler + @dnd-kit Interaction

**What goes wrong:** React Compiler auto-memoizes components, which can interfere with drag-and-drop libraries that rely on specific re-render timing for position updates. Drag handles may become unresponsive or animations may stutter.
**Prevention:** Test drag-reorder thoroughly with React Compiler enabled. If issues arise, add `'use no memo'` directive to the specific drag-sortable component file. The project already uses React Compiler globally (`babel-plugin-react-compiler`).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Route editing (drag-reorder) | #1 UNIQUE constraint, #7 drag library, #8 overwrites manual order, #16 React Compiler | Use batch RPC, @dnd-kit with grip handle, confirm before optimize, test with compiler |
| Route optimization | #8 optimization overwrites, #12 index gaps | Store previous order for undo, reindex on remove |
| Driver route execution | #3 state machine, #4 offline sync, #14 animation conflicts | Document transitions first, simplify offline states, use AnimatePresence keys |
| Manual tracking | #11 GPS table confusion | Use existing stop status columns, disable LocationTracker |
| Photo proof delivery | #10 slow network uploads | Compress client-side, decouple from delivery confirmation |
| Admin mobile UX | #2 sidebar layout, #9 tables not responsive | Drawer nav for mobile, card layouts below md: |
| Auth routing fix | #5 regression across 4 flows | E2E tests first, isolate fix to standard login path |
| Driver page audit | #13 scope creep | Audit -> categorize -> prioritize broken pages first |
| Order detail completeness | Minor -- mostly missing query joins | Verify all fields fetched in order detail API, test with real orders |
| Split/merge routes | #1 constraint, #15 assigned_driver_id drift | Transaction wrapping, update order driver assignment |

---

## "Looks Done But Isn't" Checklist

- [ ] **Drag reorder:** Reorder 5 stops to reverse order. Refresh page. Order persists. No 500 errors in console.
- [ ] **Drag reorder on mobile:** Use actual phone, not simulator. Scroll the page past the stops list without triggering a drag.
- [ ] **Optimization after manual reorder:** Manually reorder, then optimize. Confirm dialog appears warning about overwrite.
- [ ] **Driver execution flow:** Complete a full route: start -> navigate to stop 1 -> mark arrived -> mark delivered -> navigate to stop 2 -> ... -> complete route. All status timestamps populated in DB.
- [ ] **Simple mode execution:** Non-technical user completes 5-stop route with no verbal instructions. Photo capture works. All stops sync.
- [ ] **Offline delivery:** Mark 3 stops delivered with airplane mode. Re-enable network. All 3 sync within 30 seconds.
- [ ] **Admin on mobile:** Open ops dashboard, orders page, routes page, route detail on 375px-width phone. All content visible, all actions reachable.
- [ ] **Auth routing:** Log in as admin via OAuth -> lands on /admin. Log in as driver via magic link -> lands on /driver. Log in as customer -> lands on /menu.
- [ ] **Photo upload on slow network:** Throttle to 3G. Take photo. Mark delivered. Delivery succeeds even if photo upload is still pending.
- [ ] **Manual tracking visibility:** Admin opens route detail. Can see which stop driver is currently on (based on stop statuses, not GPS).
- [ ] **Remove stop reindex:** Remove middle stop from 5-stop route. Remaining stop indices are 0,1,2,3 (no gaps).
- [ ] **Driver page audit:** Every driver page loads without error. No "Coming soon" placeholders remain. Earnings chart shows real data (or graceful empty state).

---

## Sources

- Codebase inspection: `AdminNav.tsx` (sidebar layout), `RouteDetailClient.tsx` (stop management), `StopsList.tsx` (no drag support), `SimpleStopView.tsx` (delivery flow), `ActiveRouteView.tsx` (route execution), `LocationTracker.tsx` (GPS tracking), `optimizer.ts` (nearest-neighbor + Google Routes), `OptimizationModal.tsx` (before/after comparison)
- Database schema: `001_schema.sql` (routes, route_stops, location_updates tables, UNIQUE constraints)
- Migration: `20260313_fix_stop_index_unique_deferrable.sql` (deferrable constraint + batch_update_stop_indices RPC)
- Auth callback: `/auth/callback/route.ts` (4-flow role redirect logic, isStandardLogin check)
- Admin layout: `/admin/layout.tsx` (flex sidebar + main, no responsive breakpoints)
- Driver layout: `/driver/layout.tsx` (SimpleModeProvider, DriverNav bottom nav)
- Known gotchas from project `.claude/CLAUDE.md` learnings section
- v1.9 key decisions: zero new npm packages, greedy clustering, 5s polling, click-to-assign
