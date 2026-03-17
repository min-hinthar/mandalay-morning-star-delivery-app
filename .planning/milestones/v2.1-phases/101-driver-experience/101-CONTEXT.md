# Phase 101: Driver Experience - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Drivers can accept or decline assigned routes before starting deliveries. All driver pages verified end-to-end in both simple and advanced modes. Advanced-mode drivers can drag-reorder remaining pending+enroute stops on their active route. LocationTracker component and orphaned dependencies removed. Does NOT cover: admin mobile layout (Phase 102), push notifications, GPS tracking, route optimization changes.

</domain>

<decisions>
## Implementation Decisions

### Accept/Decline Flow
- Driver sees full route preview before deciding: stop count, addresses, customer names, estimated duration
- Accept and start route are separate actions — driver can accept night before, start Saturday morning
- Decline unassigns route (driver_id nulled, status reverts to planned) + flags ops dashboard + sends email to admin
- Decline confirmation has optional reason text field — reason stored in DB and included in email
- Driver can un-accept (decline after accepting) as long as route hasn't started (not in_progress)
- Accept/decline UI appears on BOTH dashboard and route page (/driver/route)
- Same accept/decline flow for simple mode and advanced mode — no auto-accept
- No time limit for acceptance — admin follows up by phone if needed
- Admin auto-assigns by setting driver_id (dropdown save) — no separate "publish" action

### Route Status State Machine
- Add two new enum values: `assigned` and `accepted`
- Full lifecycle: `planned` → `assigned` (admin sets driver) → `accepted` (driver confirms) → `in_progress` (driver starts) → `completed`
- Decline: `assigned` or `accepted` → `planned` (driver_id nulled)
- Admin reassign on accepted route: reverts to `assigned` for new driver (accepted_at cleared)
- Admin can manually override status (e.g., force assigned → in_progress if driver unresponsive)
- `assigned` and `accepted` count as "active" for `prevent_duplicate_active_assignment` trigger
- Split/merge available on planned + assigned + accepted routes (resets to assigned after operation)
- Auto-transition: admin saves driver assignment → route becomes `assigned`

### Page Audit
- E2E verification pass: load each page with test data, verify buttons work, API calls succeed, empty states render, no console errors
- Include new assigned/accepted route states in verification — all pages must handle new statuses
- Check both simple mode AND advanced mode views for each page
- Verify test-delivery page still works (quick check, no changes)
- Fix bugs inline during audit — no separate bug list
- Manual verify + fix only — no new automated test files for the audit itself

### Driver Stop Reorder
- Same pattern as admin: DragReorderList + DragHandle (desktop) + MoveButtons (mobile), md: breakpoint switch
- Reorderable stops: pending + enroute (delivered/skipped locked in place)
- Always visible — drag handles and move buttons shown on reorderable stops, no toggle needed
- Available on both accepted and in_progress routes
- Immediate save per drag-drop: optimistic UI, error toast + revert (same as admin)
- New driver endpoint: POST /api/driver/routes/[routeId]/reorder — driver auth + ownership check
- Reuses batch_update_stop_indices RPC — no new RPC needed
- No "Manually reordered" badge for driver (admin-only context)
- Admin sees driver's reordered stop_index — single source of truth, shared field

### Email Notification
- Decline only — no email on accept (acceptance is expected case)
- Urgent/actionable tone: subject with warning emoji, driver name, route details, stop count, reason if provided, direct link to reassign
- React Email template in src/emails/ matching existing branded patterns
- Admin email address from app_settings table (existing configurable business rules pattern), fallback to ADMIN_EMAIL env var

### Admin Ops Dashboard Updates
- Distinct status badges: planned = gray, assigned = blue, accepted = green, in_progress = amber, completed = green check
- Declined routes included in existing "Unassigned" badge counter (they ARE unassigned after decline)
- 'Declined by [Driver]' annotation on declined routes to distinguish from never-assigned
- Add assigned/accepted to existing status filter dropdown

### Simple Mode Accept UI
- Dashboard: large stacked buttons — full-width green "Accept Route" + smaller red "Decline" link below. Route preview above.
- Same decline confirmation dialog in both modes (with optional reason field)
- Accept card replaces today's route card when status is assigned — after accepting, normal route card appears
- Success toast + Framer Motion card transition animation on accept
- Route page: sticky bottom bar with Accept/Decline buttons, stops scrollable above for preview. Safe-area-aware.

### Testing Strategy
- Vitest unit tests for accept/decline hooks (useAcceptRoute, useDeclineRoute) + Zod schema validation
- New test file for driver reorder hook — different auth context than admin
- Mock email send in decline hook test (verify Resend called with correct params)
- No E2E tests — manual verification during page audit

### Migration
- ALTER TYPE route_status ADD VALUE 'assigned' and 'accepted'
- Add columns: accepted_at (TIMESTAMPTZ nullable), declined_at (TIMESTAMPTZ nullable), declined_reason (TEXT nullable)
- Backfill: UPDATE routes SET status = 'assigned' WHERE driver_id IS NOT NULL AND status = 'planned'
- Update Zod schemas in route.ts, TypeScript types in database.ts

### LocationTracker Cleanup
- Remove LocationTracker component + full dependency tree (hooks, types, API routes that only it uses)
- Also remove any other dead code found during page audit — opportunistic cleanup

### Claude's Discretion
- Exact accept/decline card layout dimensions and spacing
- Framer Motion transition animation parameters for card swap
- Email template HTML structure and styling details
- Exact badge color tokens from design system
- Sticky bottom bar height and safe-area padding values
- Hook internals (optimistic update strategy, cache invalidation timing)
- Zod schema constraints (UUID format, max lengths)
- Toast message wording and duration

</decisions>

<specifics>
## Specific Ideas

- Saturday ops context: driver may accept route the night before (Friday), then start delivering Saturday morning — two-step flow supports this
- Simple mode family drivers get same big accept/decline buttons — no cognitive complexity difference between modes
- Decline is rare (family operation) but when it happens, admin needs to know IMMEDIATELY — hence email + dashboard flag
- Sticky bottom bar on route page lets driver scroll through all stop addresses before committing to accept — informed decision like DoorDash
- Route preview on accept card should show stop count and city/area summary at minimum

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Route lifecycle and database
- `.planning/REQUIREMENTS.md` — DRV-01, DRV-02, DRV-03 requirements and acceptance criteria
- `supabase/migrations/20260315_route_editing_rpcs.sql` — split_route, merge_routes RPCs (reference for atomic operations pattern)
- `supabase/migrations/20260312_route_pipeline_hardening.sql` — batch_update_stop_indices, prevent_duplicate_active_assignment, check_route_completion
- `src/types/database.ts` — route_status enum definition, routes table type, Functions block for RPC types
- `src/lib/validations/route.ts` — routeStatusSchema, reorderStopsSchema (need extension for new statuses)

### Driver pages and components
- `src/app/(driver)/driver/page.tsx` — Driver dashboard server component (getDriverData)
- `src/app/(driver)/driver/DriverHomeSwitch.tsx` — Simple/advanced mode switch for dashboard
- `src/app/(driver)/driver/route/page.tsx` — Route page server component (getActiveRoute)
- `src/app/(driver)/driver/route/DriverRouteSwitch.tsx` — Simple/advanced mode switch for route
- `src/components/ui/driver/ActiveRouteView.tsx` — Advanced mode route view (wire DragReorderList here)
- `src/components/ui/driver/SimpleHome.tsx` — Simple mode dashboard
- `src/components/ui/driver/SimpleStopView.tsx` — Simple mode stop view
- `src/components/ui/driver/DriverDashboard.tsx` — Advanced mode dashboard
- `src/app/(driver)/driver/layout.tsx` — Driver layout with SimpleModeProvider

### Reusable components from Phase 100
- `src/components/ui/DragReorderList/` — Generic DragReorderList, SortableItem, DragHandle, MoveButtons
- `src/lib/hooks/useReorderStops.ts` — Optimistic reorder hook pattern (reference for driver version)
- `src/components/ui/admin/routes/RouteStopCard/` — RouteStopCard subfolder pattern

### Driver API routes
- `src/app/api/driver/routes/` — All existing driver route endpoints (active, upcoming, history, start, complete, stops)

### Email infrastructure
- `src/emails/` — Existing React Email templates (reference for decline notification template)

### Prior phase context
- `.planning/phases/99/99-CONTEXT.md` — Phase 99 decisions (delivery notes UX, OrderDetailPanel, LocationTracker deferral)
- `.planning/phases/100-admin-route-editing/100-CONTEXT.md` — Phase 100 decisions (drag reorder, split/merge, DragReorderList architecture)

### Learnings
- `.claude/learnings/mobile-ux.md` — touchAction conflicts, safe-area insets, nested scroll
- `.claude/learnings/react-patterns.md` — useRef on conditional renders, loading="lazy" in animated containers
- `.claude/learnings/supabase.md` — .update() row count, new RPC manual type entries
- `.claude/learnings/data-schema.md` — DEFERRABLE constraint, prevent_duplicate_active_assignment trigger

### Memory
- `.claude/projects/C--Users-minkk-Documents-GitHub-mandalay-morning-star-delivery-app/memory/phase101_assumptions.md` — Deep-dive assumptions with driver page inventory, API routes list, applicable gotchas

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DragReorderList<T>` + `DragHandle` + `MoveButtons` + `SortableItem`: Generic drag-reorder from Phase 100 — direct reuse for driver stop reorder
- `batch_update_stop_indices` RPC: Exact match for driver reorder — same signature (stop_ids[], indices[])
- `useReorderStops` hook: Optimistic UI + error revert pattern — adapt for driver context
- `ConfirmDialog`: Existing admin component — reuse for decline confirmation
- React Email templates: Existing branded templates in src/emails/ — follow pattern for decline notification
- `app_settings` table: Configurable business rules — use for admin email address
- `check_route_completion` trigger: Auto-completes route when all stops terminal — no changes needed
- `DriverHomeSwitch` / `DriverRouteSwitch`: Existing simple/advanced mode switches — extend with new "assigned" state rendering

### Established Patterns
- Driver API: `requireDriver()` auth + `driverActionLimiter` rate limiting + ownership check (route.driver_id === driver.id)
- Optimistic UI: Local state update → API call → error toast + revert (Phase 100 pattern)
- Server component data fetching: SSR with Supabase queries, client switch components for mode
- Simple mode: DB-backed boolean via SimpleModeProvider context, conditional rendering
- Status badges: Existing badge component with color tokens (extend for assigned/accepted)
- Fire-and-forget email: `after()` or awaited in API route (never `void asyncFn()` per gotcha)

### Integration Points
- Driver dashboard query needs to handle `assigned` + `accepted` statuses (currently filters `planned` + `in_progress`)
- Route page query needs same filter update
- Ops dashboard route cards need new badge variants
- Ops dashboard filter dropdown needs new options
- Admin route detail reassignment needs to handle status reset to `assigned`
- Admin split/merge RPCs need status-aware behavior for assigned/accepted routes
- All `.in("status", ["planned", "in_progress"])` queries project-wide need audit for new statuses

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 101-driver-experience*
*Context gathered: 2026-03-15*
