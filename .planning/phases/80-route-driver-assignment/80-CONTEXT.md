# Phase 80: Route & Driver Assignment - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Operator creates delivery routes and assigns drivers through a visual dashboard — replacing texting and spreadsheets. Includes unassigned orders panel, driver selection with capacity, one-click route creation, geographic auto-suggest grouping, route summary with map preview, order reassignment between routes, and driver API ownership enforcement.

</domain>

<decisions>
## Implementation Decisions

### Assignment Workflow
- Full-page route builder at `/admin/routes/new` — not a modal dialog
- Two-column layout: left = unassigned orders + driver selector, right = map with selected stops
- Click-to-add interaction: click an order card to add to route, checkboxes for bulk selection
- One route at a time: build, save, then start another. Unassigned list updates after save
- Default delivery date to the upcoming Saturday (matches existing CreateRouteModal behavior), changeable if needed

### Auto-Suggest Grouping
- Visual clustering of unassigned orders by geographic proximity
- Simple proximity clustering using Haversine distance in JS — no external API needed
- Cluster labels on the order list (e.g., "North Side — 4 orders") with color coding
- Click a cluster to select all its orders into the current route; can deselect individually after
- Visual yellow warning badge if orders in the route have tight/overlapping delivery time windows (informational, doesn't block)

### Map & Route Summary
- Leaflet + OpenStreetMap for interactive map — free, no API key, ~40KB
- Map lives in the right panel of the route builder, updates live as orders are added/removed
- Pins for each stop on the map
- Estimated duration from simple distance calculation (straight-line between stops + fixed time-per-stop), no external routing API
- Route summary (stop count, driver, estimated duration) shown on both the routes list page and detail view

### Order Reassignment
- Action menu on each stop in route detail view: "Reassign" dropdown listing other routes for that day
- Reassignment only allowed on planned routes — locked once in_progress
- Reassigned orders append to end of target route; operator can manually reorder
- "Remove from route" action also available (returns order to unassigned pool) with confirmation dialog

### Driver Ownership (ROUTE-07)
- All driver API queries enforce ownership — drivers only see their own routes and stops
- Claude's Discretion: implementation approach for RLS vs middleware enforcement

### Claude's Discretion
- Loading skeletons and animation details
- Exact clustering radius/threshold for geographic grouping
- Map zoom level and pin styling
- Stop reorder UI within a route (drag handles or up/down buttons)
- Error state designs
- Driver ownership enforcement approach (RLS policies vs API middleware)

</decisions>

<specifics>
## Specific Ideas

- Existing CreateRouteModal pattern (date + driver + orders in a dialog) provides the foundation, but evolve it into the full-page builder
- Clusters should feel natural to the operator — group by neighborhood/area, not arbitrary distance
- Map should show pins updating in real-time as orders are selected/deselected
- Keep the "one-click" feel: select a cluster + pick a driver = route created

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CreateRouteModal` (`src/components/ui/admin/routes/CreateRouteModal/`): Order selection list, driver grid, date picker — extract and reuse in full-page builder
- `OpsDriverPanel` (`src/components/ui/admin/ops/OpsDriverPanel.tsx`): Driver readiness with availability check — reuse pattern for driver selector
- `RouteListTable` + `RouteCardRow`: Route list display — enhance with summary stats
- `RouteMap` (`src/components/ui/admin/routes/RouteMap.tsx`): Existing map component — replace/enhance with Leaflet
- `RouteDetailClient`: Route detail view with stops list, timeline, driver info — add reassignment actions here
- `isDriverAvailable()` (`src/lib/availability`): Availability check utility
- `deriveDriverReadiness()` (`src/components/ui/admin/ops/helpers.ts`): Driver readiness derivation

### Established Patterns
- Admin pages use `AdminPageHeader` + `SkeletonCrossfade` + `InlineErrorCard`
- Framer Motion `m` for animations with `cardContainer`/`cardItem` variants
- Fetch-based API calls with toast notifications for errors
- Route status flow: planned → in_progress → completed
- Design tokens enforced (no hardcoded colors, use semantic tokens)
- Saturday-only delivery dates with `nextSaturday()` / `isSaturday()` checks

### Integration Points
- Admin routes API: `/api/admin/routes` (GET, POST), `/api/admin/routes/[id]` (GET, PATCH, DELETE)
- Admin routes stops API: `/api/admin/routes/[id]/stops` (GET, POST, PATCH)
- Admin drivers API: `/api/admin/drivers` (GET)
- Admin orders API: `/api/admin/orders?status=confirmed,preparing`
- Route optimization endpoint: `/api/admin/routes/optimize`
- Driver API routes: `/api/driver/routes/*` — need ownership enforcement
- Types: `src/types/driver.ts` (RouteStatus, RoutesRow, RouteStopsRow, RouteListItem, etc.)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 80-route-driver-assignment*
*Context gathered: 2026-03-01*
