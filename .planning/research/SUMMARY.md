# Project Research Summary

**Project:** Morning Star Delivery App — v2.1 Route Operations & Admin Mobile
**Domain:** Saturday meal delivery — route editing, driver execution, admin mobile UX
**Researched:** 2026-03-14
**Confidence:** HIGH

## Executive Summary

v2.1 is fundamentally an enhancement milestone, not a greenfield build. The existing codebase already contains the complete database layer (all tables, enums, RPCs, triggers), every major API route, and most UI components needed for this milestone. The core work is: wiring existing pieces together end-to-end, adding drag-reorder via `@dnd-kit` (one new package), expanding the route detail API response to include full order data, and making admin pages responsive for mobile phone use during Saturday kitchen operations. No database migrations are required for core route operations.

The recommended approach is incremental: fix the foundation first (auth routing, order detail completeness, manual tracking display), then layer on the route editing features (drag-reorder, split/merge), then harden driver execution flows, and finally apply the admin mobile responsive overhaul once all features are stable. This ordering prevents building responsive layouts on top of incomplete features, which would require double-touching the same pages. The only new npm dependency is `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (~15KB gzipped), chosen over Framer Motion's built-in `Reorder` due to verified mobile touch bugs in that library on iOS/Android (issues #1597, #1506, #2101).

The key risks are: (1) drag-reorder triggering UNIQUE constraint violations if implemented with per-stop PATCH calls instead of the existing `batch_update_stop_indices` RPC; (2) the admin sidebar breaking mobile layout if not fully replaced with a Drawer-based pattern (collapsing to 64px icon bar is useless on phones); and (3) the auth callback regression risk when fixing the `?next=` parameter handling across 4 distinct auth flows. All three risks have known solutions documented in the research with specific code patterns.

---

## Key Findings

### Recommended Stack

The stack requires only one addition: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Everything else — Framer Motion, Leaflet, Google Routes API, Supabase Storage, TanStack React Query, Zustand — is already installed and already used for the exact purposes v2.1 needs. Framer Motion's `Reorder` component was evaluated and rejected (verified open bugs #1597, #1506, #2101 for mobile touch: items snap back instead of reordering on iOS). The `@dnd-kit/react` v0.3.2 pre-release was also rejected in favor of the stable classic API (v6.3.1 + v10.0.0).

**Core technologies:**
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`: drag-to-reorder stop lists — mobile-reliable, accessible, React 19 compatible, ~15KB gzipped total
- `batch_update_stop_indices` RPC (already exists): the only safe way to reorder stops — avoids UNIQUE(route_id, stop_index) constraint violations from per-stop updates
- Tailwind v4 responsive utilities + existing Drawer component: admin mobile layout — zero new dependencies
- TanStack Query optimistic updates (already in use): admin route editing — instant visual feedback during Saturday ops
- SSR + `router.refresh()` (driver pages, keep existing): driver route execution — offline-first, works with service worker, appropriate for non-technical family drivers; do NOT switch to TanStack Query

### Expected Features

**Must have (table stakes):**
- Drag-reorder stops (admin) — every route planner tool has this; manual override after optimization is expected
- Driver status progression with all intermediate states — `arrived` status exists in DB schema but is never currently written
- Navigate to stop — already built via `SimpleStopView.openMaps()` Google Maps deep-link
- Photo proof of delivery — already built via `PhotoCapture.tsx` + Supabase Storage pipeline
- Auth routing fix — admin/driver must land on their dashboard, not homepage, after login
- Order detail completeness — items with modifiers, tip, special instructions visible during Saturday ops
- Manual tracking display (admin) — show which stop driver is on; data already exists in `arrived_at`/`delivered_at` columns

**Should have (differentiators):**
- Split route — overloaded route split into two with driver assignment via new transactional API endpoint
- Merge routes — two light routes combined when driver cancels
- Driver stop reordering — advanced mode only; most drivers use simple mode
- Admin mobile UX — solo operator runs Saturday kitchen from phone; high effort (~800 lines, 20+ pages)
- Delivery notes per stop — driver adds context ("left at door"); `delivery_notes` column already exists on `route_stops`
- Route progress widget on ops dashboard — compact cards: driver name + progress bar + delivered/total

**Defer (v2+):**
- Real-time GPS tracking map — out of scope, overkill at 20-50 orders, battery drain, WebSocket complexity
- Auto-dispatch / auto-assignment — manual control preferred for family operation
- Live ETA updates to customers — requires WebSocket infrastructure not justified at scale
- Driver route acceptance flow — family drivers; operator texts them; formal acceptance overhead at 2-4 drivers
- Driver chat / messaging — family drivers use phone/SMS; call button already exists
- Cross-route drag-and-drop — use existing "Reassign" dropdown instead; DnD multi-container is error-prone

### Architecture Approach

The architecture is entirely modification-based: 10 new components to create, 12 existing files to modify, zero database schema changes. The component split follows established project conventions — `RouteEditor` encapsulates drag-reorder editing mode, `OrderDetailPanel` handles full order data display (reused across admin route detail and driver stop detail), `AdminResponsiveShell` switches between sidebar and bottom-nav by viewport. Driver route execution deliberately stays on SSR + `router.refresh()` — switching to TanStack Query client-side would break offline-first caching and is an explicit anti-pattern from v1.9.

**Major components to create:**
1. `RouteEditor` + `EditToolbar` — admin editing mode: drag-reorder, add/remove, optimize, split; defaults to read-only to prevent accidental Saturday ops changes
2. `DragReorderList` — generic @dnd-kit sortable list, reused by both admin `StopsList` and driver stop reorder
3. `AdminResponsiveShell` + `AdminMobileNav` — viewport-aware layout switch; sidebar on `md:`, bottom tab nav on mobile
4. `OrderDetailPanel` + `OrderItemsList` + `PaymentSummary` — full order data display; API SELECT expansion only (no schema changes)
5. `DriverStopActions` — arrived/delivered/skip buttons wired to existing `isValidStatusTransition()` server validation

**Key patterns:**
- Editing mode toggle on route detail (read-only by default)
- Optimistic updates with rollback for admin mutations via TanStack Query
- `batch_update_stop_indices` RPC for all stop reordering (never per-stop PATCH calls)
- Card layouts below `md:` breakpoint for all admin tables
- Single transactional API endpoints for split/merge (never client-side multi-step operations)

### Critical Pitfalls

1. **Drag-reorder UNIQUE constraint violation** — Never issue per-stop index PATCH calls. The `UNIQUE(route_id, stop_index)` constraint is `DEFERRABLE INITIALLY IMMEDIATE`, so per-stop updates fail on index swaps. Always route through `batch_update_stop_indices` RPC via a dedicated `PATCH /api/admin/routes/[id]/reorder` endpoint that accepts the full ordered stop ID array.

2. **Admin sidebar breaking mobile** — Collapsing `AdminNav` to 64px icon bar is useless on phones. Replace with conditional render: `AdminNav` on `md:` and above, Drawer-based `AdminMobileNav` bottom tab bar on mobile. Test every admin page at 375px before marking mobile UX complete.

3. **Driver state machine incomplete transitions** — The DB has `enroute` and `arrived` statuses that are never written. Document the complete state machine before writing any driver UI code. Create a shared `isValidTransition(currentStatus, newStatus, role)` used by both API and UI. For simple mode: auto-set `enroute` on display; do not force extra taps.

4. **Optimistic offline sync conflicts** — Offline sync queue was designed for single `delivered` update per stop. Adding intermediate states multiplies edge cases. Mitigation: make the API idempotent (accept any forward transition); treat status updates as "set to at-least-this-state." Test: airplane mode, mark 3 stops delivered, re-enable network, verify all 3 sync.

5. **Auth callback regression across 4 flows** — The callback has 4 flows (OAuth normal, OAuth with driver invite, magic link normal, magic link expired). The `?next=` fix must be isolated to standard login path (~5 lines: check `next` param starts with user's role prefix). Write E2E tests for all 4 flows before touching any redirect logic.

---

## Implications for Roadmap

Based on combined research, all four researchers independently converged on the same 5-phase structure.

### Phase 1: Foundation Fixes
**Rationale:** Independent low-risk changes with immediate ops value. Auth fix needed before any login testing. Order detail data needed by both admin and driver phases. Manual tracking display requires no new components, just rendering existing DB data. All items are 30-150 lines each.
**Delivers:** Working auth redirects, full order visibility during ops (items/modifiers/tip/instructions), delivery notes per stop, manual stop tracking display in admin route detail
**Addresses:** Auth routing fix, order detail completeness, delivery notes input, manual tracking display, `OrderDetailPanel` as shared component for Phase 2+3
**Avoids:** Pitfall #5 (auth regression) — write E2E tests first, isolate fix to standard login flow

### Phase 2: Admin Route Editing
**Rationale:** Install `@dnd-kit` once and use it for both admin reorder and (Phase 3) driver reorder. Split/merge APIs must be implemented as single server-side transactions to avoid partial failure states (orphaned stops, index gaps, stale `assigned_driver_id`).
**Delivers:** Drag-reorder stops with read-only default + editing mode toggle, optimize-after-reorder confirmation dialog, route split/merge APIs + UI
**Uses:** `@dnd-kit/core` + `@dnd-kit/sortable` (install in this phase), `batch_update_stop_indices` RPC, TanStack Query optimistic updates, `OrderDetailPanel` from Phase 1
**Implements:** `RouteEditor`, `DragReorderList`, `EditToolbar`, split/merge API endpoints
**Avoids:** Pitfall #1 (UNIQUE constraint) — batch RPC only, never per-stop updates; Pitfall #8 (optimization overwrites manual order) — confirmation dialog; Pitfall #15 (split/merge `assigned_driver_id` drift) — single transaction per operation

### Phase 3: Driver Route Execution
**Rationale:** Depends on Phase 2's DnD library for driver stop reordering (same `DragReorderList` component). Depends on Phase 1's `OrderDetailPanel` for full order info in stop detail. Driver flow audit is scoped strictly: audit first, categorize by severity, fix broken/crashed pages before placeholder data.
**Delivers:** Complete driver execution flow with correct state machine (arrived/delivered/skip), NavigationButton wired in stop detail, full order info in stop detail, driver stop reordering (advanced mode only), SimpleStopView and all driver pages audited
**Uses:** `@dnd-kit/sortable` (installed in Phase 2), SSR + `router.refresh()` (keep existing — do NOT convert to TanStack Query), `DriverStopActions`, `OrderDetailPanel` (reuse from Phase 1)
**Avoids:** Pitfall #3 (state machine missing transitions) — document full state machine before coding; Pitfall #4 (offline sync conflicts) — idempotent API; Pitfall #13 (driver audit scope creep) — audit-first, categorize by severity; Pitfall #14 (AnimatePresence stale closure) — `key={stop.id}` on animated wrappers

### Phase 4: Admin Mobile UX
**Rationale:** Applied last because all features must be finalized before mobile audit. Adding responsive layout to incomplete pages wastes effort and doubles touch points. One-time responsive overhaul using only Tailwind — no new dependencies.
**Delivers:** Fully responsive admin on 375px devices — bottom tab nav (5 items + More sheet), card views for all tables, stacked layouts for detail pages, touch-friendly action targets across all 11 admin pages
**Implements:** `AdminResponsiveShell`, `AdminMobileNav`, responsive Tailwind classes across ops, orders, routes, drivers, and settings pages
**Avoids:** Pitfall #2 (sidebar breaking mobile) — Drawer pattern, not collapsed icon bar; Pitfall #9 (tables invisible on mobile) — card layout below `md:`

### Phase 5: Tracking & Integration Verification
**Rationale:** Verification pass that all pieces connect end-to-end after Phases 1-4 complete. Photo proof and customer tracking page depend on driver phase being complete. Mostly confirming existing systems work together, with minor UI wiring if gaps are found.
**Delivers:** Photo proof visible in admin route detail, customer tracking page reflecting current stop status (not GPS), email status updates verified, full "Looks Done But Isn't" checklist from PITFALLS.md executed
**Avoids:** Pitfall #10 (photo upload on slow 3G) — compress client-side, decouple photo from delivery confirmation; Pitfall #11 (manual tracking using GPS table) — use `route_stops` status columns only, disable `LocationTracker` GPS component

### Phase Ordering Rationale

- Phase 1 first: zero new dependencies, zero risk, maximizes feature surface for Saturday ops testing; `OrderDetailPanel` is a shared component needed by Phases 2 and 3
- Phase 2 before Phase 3: installs `@dnd-kit` once; `DragReorderList` reused in Phase 3 driver stop reorder
- Phases 2 and 3 could be parallelized by separate developers (no file conflicts between admin route editing and driver execution)
- Phase 4 last: responsive layout applied to finalized features; avoids double-touching the same pages
- Phase 5 last: integration verification requires all prior phases complete

### Research Flags

Phases needing deeper pre-implementation research:
- **Phase 3 (Driver Execution):** Document the complete `isValidTransition()` state machine in a design doc before writing any code. The 4-flow offline sync behavior of `useOfflineSync` must be fully understood before adding intermediate states. Start with a read-only audit pass of all driver pages.
- **Phase 4 (Admin Mobile UX):** Conduct a full page-by-page audit first — list every admin page, its current responsive state, and specific required changes. Prevents scope underestimation (~800 lines across 20+ files).

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Foundation Fixes):** All changes are small, isolated, and map to specific existing files. Straight implementation.
- **Phase 2 (Route Editing):** `@dnd-kit` docs are comprehensive; `batch_update_stop_indices` RPC already validated in production; architecture doc has explicit code patterns including optimistic update boilerplate.
- **Phase 5 (Integration):** Verification work only. Run the "Looks Done But Isn't" checklist from PITFALLS.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All new packages verified on npm (React 19 compat confirmed). Framer Motion bug reports directly inspected. Entire existing stack audited against v2.1 requirements. |
| Features | HIGH | Entire codebase read; feature status (built/exists/needs-work) confirmed per-file by direct inspection. Industry patterns cross-referenced with 8+ external sources. |
| Architecture | HIGH | All file paths, component names, API routes, RPC names verified by direct codebase inspection. Zero inference — every component location is confirmed. |
| Pitfalls | HIGH | Every pitfall identified from actual code: UNIQUE constraint from migration file, sidebar layout from `AdminNav.tsx`, state machine gaps from `SimpleStopView.tsx`, auth flows from `auth/callback/route.ts`. Not hypothetical. |

**Overall confidence:** HIGH

### Gaps to Address

- **Driver audit scope:** The full extent of broken/placeholder driver pages (earnings, history, schedule) is unknown until a structured audit runs. Phase 3 must start with an audit pass before any implementation. Budget may need adjustment once scope is known.
- **Photo compression configuration:** `browser-image-compression` is already installed but current usage is only for driver profile photos. Verify it handles 2-5MB camera captures at delivery time — may need `maxSizeMB` and `maxWidthOrHeight` tuning for stop photos vs. profile photos.
- **React Compiler + @dnd-kit interaction:** No production data exists for this specific combination. Test drag-reorder in isolation before building full feature. Fallback: `'use no memo'` directive on drag components if React Compiler auto-memoization interferes with position update re-renders.
- **Auth callback exact regression trigger:** The precise condition for admin landing on homepage post-OAuth is unconfirmed without live testing. The fix is clear (~5 lines, check `next` starts with role prefix) but E2E tests must cover all 4 auth flows before and after the change.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `src/components/ui/admin/routes/RouteDetailClient/` — existing route editing components (StopsList, RouteStopCard, OptimizationModal, AddStopsModal)
- `src/components/ui/driver/` — all driver execution components (ActiveRouteView, SimpleStopView, DeliveryActions, PhotoCapture, StopDetailView, LocationTracker)
- `src/app/api/admin/routes/` + `src/app/api/driver/routes/` — all route/stop/photo/reorder API endpoints
- `src/lib/services/route-optimization/optimizer.ts` — Google Routes API + nearest-neighbor fallback (already complete)
- `src/lib/hooks/useLocationTracking.ts` — adaptive GPS interval tracking
- `supabase/migrations/001_schema.sql` + `20260313_fix_stop_index_unique_deferrable.sql` — schema and deferrable UNIQUE constraint
- `src/app/auth/callback/route.ts` + `src/lib/auth/role-redirect.ts` — 4-flow auth redirect logic

### Secondary (HIGH confidence — official package sources)
- [@dnd-kit/sortable npm](https://www.npmjs.com/package/@dnd-kit/sortable) — v10.0.0, React 19 compat confirmed
- [@dnd-kit/core npm](https://www.npmjs.com/package/@dnd-kit/core) — v6.3.1, peer dep React >=16.8
- [dnd-kit Sortable docs](https://docs.dndkit.com/presets/sortable) — official API and patterns
- [Framer Motion Reorder bug #1597](https://github.com/motiondivision/motion/issues/1597) — mobile snap-back verified
- [Framer Motion scroll/drag conflict #1506](https://github.com/motiondivision/motion/issues/1506) — mobile drag vs scroll conflict verified

### Tertiary (MEDIUM confidence — industry patterns)
- [EZRoutePlanner — Multi-Stop Route Planners 2026](https://www.ezrouteplanner.com/blog/best-free-multi-stop-route-planners)
- [Track-POD — Delivery Driver App workflow](https://www.track-pod.com/delivery-driver-app/)
- [DispatchTrack — 6 Features for Delivery Apps](https://www.dispatchtrack.com/blog/app-delivery-driver/)
- [Puck — Top 5 DnD Libraries for React 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [Upper — Best Apps for Delivery Drivers 2026](https://www.upperinc.com/blog/best-apps-for-delivery-drivers/)

---
*Research completed: 2026-03-14*
*Ready for roadmap: yes*
