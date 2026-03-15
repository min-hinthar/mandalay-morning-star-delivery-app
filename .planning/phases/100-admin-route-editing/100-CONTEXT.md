# Phase 100: Admin Route Editing - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can fully edit route composition and stop order from both desktop and mobile during Saturday ops. Covers: drag-reorder stops, mobile move-up/move-down, split overloaded route into two, merge two light routes into one, reassign driver on in-progress route. Does NOT cover: route creation wizard, optimization algorithm changes, stop status changes, driver acceptance/decline (Phase 101), admin mobile layout overhaul (Phase 102).

</domain>

<decisions>
## Implementation Decisions

### Drag Reorder Interaction
- Desktop: drag handle (6-dot grip icon) on left side of RouteStopCard, always visible — only handle initiates drag, rest of card stays clickable
- Ghost card overlay while dragging (semi-transparent clone follows cursor, dashed placeholder at original position)
- Smooth spring transition animation as cards shift positions (~200ms, @dnd-kit built-in CSS transitions)
- Auto-scroll when dragging near viewport edges (@dnd-kit built-in)
- Keyboard accessibility: Space/Enter to pick up, arrow keys to move, Space/Enter to drop, Escape to cancel (@dnd-kit KeyboardSensor)
- Same-route drag only — cross-route moves use existing Reassign dropdown (matches REQUIREMENTS.md out-of-scope)
- Immediate save on each drag-drop (optimistic UI, API call in background, silent success, error toast + revert)
- Fire immediately per drag, no debounce — each call contains full stop order, latest wins
- Instant stop number renumbering after drag (optimistic, server confirms in background)
- Only pending stops are draggable on in_progress routes — delivered/skipped stops locked at their position
- Completed routes: fully locked, no drag handle renders (DragReorderList disabled={true})
- After manual reorder: "Manually reordered" warning badge on route header (existing isManuallyReordered flag). Optimize button stays available with confirm dialog: "Override manual order with optimized route?"
- Badge-only indicator (no per-stop position change indicators)

### Mobile Move Buttons
- Up/down chevron buttons stacked vertically on right edge of each stop card
- 44px touch targets per button
- First stop: up button disabled; last stop: down button disabled
- Responsive switch at md: breakpoint — desktop shows drag handle (hide buttons), mobile shows buttons (hide handle)
- Same immediate save behavior as drag reorder

### Split Route Flow
- Initiated from route detail Actions dropdown (⋮) → "Split Route"
- Checkbox multi-select: "Split Route" button enters selection mode, checkboxes appear on each stop card
- Selection mode: simplified card layout (checkbox + stop number + customer name + address, action buttons hidden)
- "Select All" / "Deselect All" toggle at top of stops list with selected count
- Minimum 1 stop must remain in source route (can't split ALL stops out)
- Only pending stops are selectable on in_progress routes — delivered/skipped locked
- Split hidden in Actions dropdown when route has ≤1 pending stops
- Confirmation modal: driver picker + summary (selected stops with addresses, remaining stops count, optional driver dropdown for new route)
- New route always starts as "planned" regardless of source route status
- Delivery date inherited from source route (no date picker in modal)
- RPC assigns sequential stop_index (0, 1, 2...) based on original source route order — admin can drag-reorder new route after
- Single atomic RPC: split_route(source_route_id, stop_ids[], new_driver_id) — creates route, moves stops, reindexes both, updates stats, returns new route ID. Trigger-safe.
- After split: admin stays on original route, success toast with "View new route →" link
- Source route auto-completes if all remaining stops are terminal (existing check_route_completion trigger)

### Merge Route Flow
- Initiated from route detail Actions dropdown (⋮) → "Merge Route"
- Modal: route picker listing same-date routes to merge INTO current route (radio buttons, shows driver + stop count + status)
- Only planned routes appear as merge candidates (absorbed route must be planned)
- Destination route can be planned OR in_progress — absorbed stops appended as pending
- Same-date only — cross-date routes not shown
- Merge hidden in Actions dropdown when no other same-date planned routes exist
- Absorbed route's stops appended to end of destination route (admin can reorder after)
- Absorbed route is deleted after merge
- Single atomic RPC: merge_routes(destination_route_id, source_route_id) — moves stops, reindexes, updates stats, deletes source, returns total stop count
- After merge: admin stays on destination route, success toast suggesting optimization: "✓ Merged Route B (3 stops). Route may need reordering. [Optimize]"

### Route Editing Constraints
- **Planned routes:** all operations available, no confirmations needed (except delete)
- **In-progress routes:** reorder pending stops, split pending stops, reassign driver (with confirmation dialog), merge INTO (absorb planned route). Delete blocked. Merge FROM blocked.
- **Completed routes:** fully read-only — no split, merge, delete, reorder, or reassign. Actions dropdown hidden entirely. Driver dropdown disabled/locked.
- Driver reassignment on in_progress: confirmation dialog showing current driver name and progress ("Min is currently delivering this route (3/7 stops done)")
- Driver reassignment on planned: no confirmation needed
- Actions dropdown items contextually filtered by route status (hide unavailable, don't disable)
- No undo mechanism — confirmations sufficient. Recovery: reorder by dragging back, split→merge back, merge→split out
- Delete route: confirmation dialog with route name and stop count
- Existing status dropdown behavior unchanged — check_route_completion trigger enforces rules
- AddStopsModal: left as-is, no changes in Phase 100

### Route Header & Actions Dropdown
- Primary actions stay as direct buttons: [Optimize] [Add Stops]
- Secondary/destructive actions behind three-dot (⋮) dropdown trigger
- ⋮ trigger: Radix DropdownMenu (already installed), 44px touch target via padding
- Dropdown items: icons + text labels (Lucide: Scissors for Split, GitMerge for Merge, Trash2 for Delete)
- Delete Route in red text (text-destructive token) below separator line
- Split/Merge in normal text above separator

### Component Architecture
- RouteStopCard extracted into subfolder: RouteStopCard/index.tsx (barrel), StopCardContent.tsx (display), StopCardActions.tsx (actions). Before adding drag/selection features.
- RouteStopCard accepts selectionMode prop — when true: checkbox + simplified layout; when false: normal view with drag handle or move buttons
- DragReorderList: generic reusable component in src/components/ui/DragReorderList/
  - Props: items, onReorder, renderItem, disabled, getItemId
  - Vertical only, no orientation prop
  - Subcomponents exported: DragHandle, MoveButtons, SortableItem
  - Phase 101 reuses for driver stop reordering

### API Endpoints
- POST /api/admin/routes/[id]/split — Body: { stopIds: string[], driverId?: string }, Returns: { newRouteId: string }
- POST /api/admin/routes/[id]/merge — Body: { sourceRouteId: string }, Returns: { totalStops: number }
- Existing PATCH for reorder: uses existing endpoint + reorderStopsSchema + batch_update_stop_indices RPC
- Existing PATCH for driver/status: unchanged
- Same admin auth pattern as existing admin API routes (role check from user.app_metadata)

### Supabase Migration
- Single migration: 20260315_route_editing_rpcs.sql with both split_route() and merge_routes()
- SECURITY DEFINER + SET search_path = public (matches existing RPCs)
- Manual type entries in database.ts immediately after writing migration (per learning)
- isManuallyReordered: verify during research whether DB column or client-only state

### React Query & State Management
- Split/merge: invalidate + refetch (invalidateQueries for route detail + route list). No optimistic cache manipulation.
- Reorder: local state in RouteDetailClient (optimistic), revert on error. Query cache syncs on refetch.
- Separate mutation hooks: useReorderStops, useSplitRoute, useMergeRoutes, useReassignDriver
- Hooks own toast messages (success/error in onSuccess/onError callbacks)
- No debounce on reorder mutations — fire immediately per drag-drop

### Loading & Error States
- Split/merge: button loading state (spinner + disabled) during RPC. Modal stays open on error.
- Reorder failure: error toast with retry button, cards revert to previous order
- Error toast with retry button for all failed operations

### Testing
- Vitest unit tests only — no E2E for drag-and-drop (fragile in Playwright)
- Test files: useReorderStops.test.ts, useSplitRoute.test.ts, useMergeRoutes.test.ts, useReassignDriver.test.ts, route-validation.test.ts
- Test: Zod schema edge cases, hook mutation calls + cache invalidation, error handling (revert), selection logic (min 1 remaining)
- Skip: drag interaction tests, E2E full flow tests

### Implementation Order (Plan Structure)
- Plan 100-01: Infrastructure — install @dnd-kit, extract RouteStopCard/, build DragReorderList, build Actions dropdown shell. No behavior changes.
- Plan 100-02: Drag reorder — wire DragReorderList to StopsList, add mobile move buttons, optimistic reorder + API call
- Plan 100-03+: Split route flow, merge route flow, driver reassignment, migration + API endpoints

### Claude's Discretion
- Exact @dnd-kit sensor configuration (activation distance, keyboard coordinate getter)
- DragOverlay styling details (opacity, shadow, scale)
- Selection mode transition animation (if any)
- Exact Zod schema constraints (UUID format validation, max stops per route)
- Toast message wording and duration
- Split/merge modal spacing and typography

</decisions>

<specifics>
## Specific Ideas

- Saturday ops context: admin is multitasking in kitchen — everything should be fast, one-tap where possible
- Ghost card drag overlay like Trello/Linear — semi-transparent, follows cursor
- Merge toast with "Optimize" action button — non-blocking suggestion after combining routes
- 44px touch targets proactively (ahead of Phase 102 MOBL-03 requirement)
- Contextually filtered Actions dropdown — show only what's applicable, never disabled/greyed items

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `batch_update_stop_indices` RPC: already exists with DEFERRABLE constraint — handles atomic stop reindexing
- `reindex_route_stops` RPC: CTE-based atomic reindex after stop deletion
- `update_route_stats` RPC: single aggregate query for route stats
- `reorderStopsSchema` Zod validation: already accepts {stopId, stopIndex} tuples
- `reassignStopSchema` Zod validation: for moving stops between routes
- `check_route_completion` trigger: auto-completes route when all stops terminal
- `prevent_duplicate_active_assignment` trigger: prevents order in multiple active routes — split/merge RPCs must be atomic to avoid trigger violations
- `RouteStopCard.tsx` (350+ lines): needs extraction before adding drag/selection
- `StopsList.tsx`: container for stops, sorted by stopIndex
- `RouteDetailClient.tsx`: main route detail view, has unused `isManuallyReordered` state flag
- `RouteHeader.tsx`: route info + action buttons (Optimize, Add Stops)
- `DriverInfoCard.tsx`: driver assignment dropdown
- `OptimizationModal.tsx`: before/after optimization comparison
- `OrderDetailPanel` (Phase 99): reusable for route detail views
- Radix DropdownMenu: already installed, used in multiple admin components

### Established Patterns
- React Compiler auto-memoizes — no manual useMemo for @dnd-kit sensors/config
- Vercel kills fire-and-forget — all API route async ops must be awaited
- PostgREST FK hints only for multi-FK tables (route_stops has single FK)
- `.update()` needs `.select("id")` for row count verification
- Admin auth: role check from user.app_metadata in API routes
- Service client for Supabase RPCs (bypasses RLS)

### Integration Points
- Route detail API: GET /api/admin/routes/[id] — returns stops with all fields needed for drag
- Route list API: GET /api/admin/routes — needs cache invalidation after split/merge
- New API routes: POST .../split and POST .../merge in src/app/api/admin/routes/[id]/
- Migration: supabase/migrations/20260315_route_editing_rpcs.sql
- Type entries: src/types/database.ts Functions block (manual, per learning)

### Critical Risks (from learnings cross-check)
1. @dnd-kit + React 19 compatibility — check peer deps before install
2. prevent_duplicate_active_assignment trigger — atomic RPCs prevent violations
3. RouteStopCard 400-line ESLint limit — extract before adding features
4. Nested scroll + DndOverlay — don't add overflow-y-auto without explicit height
5. touchAction conflicts — drag handle needs touch-none, content needs pan-y
6. useRef on conditional renders — use stable wrapper for drag container

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 100-admin-route-editing*
*Context gathered: 2026-03-15*
