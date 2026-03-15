# Architecture Patterns

**Domain:** Route operations, driver execution, admin mobile UX for Saturday meal delivery (v2.1)
**Researched:** 2026-03-14
**Confidence:** HIGH (all findings verified against existing codebase)

## Existing Architecture Inventory

### What Already Exists (Modify, Don't Rebuild)

| Component | Location | Current State | v2.1 Action |
|-----------|----------|---------------|-------------|
| Route detail page | `(admin)/admin/routes/[id]/page.tsx` | Shows stops, driver, status | Enhance with editing UI |
| RouteDetailClient | `components/ui/admin/routes/RouteDetailClient/` | 6 sub-components, read-only stops | Add drag-reorder, inline editing |
| Route optimize API | `api/admin/routes/optimize/route.ts` | Google Routes + nearest-neighbor fallback | Already works, wire to UI button |
| Stop CRUD APIs | `api/admin/routes/[id]/stops/route.ts` | POST (add), PATCH (status), DELETE (remove) | Already works, wire to editing UI |
| Stop reorder API | `api/admin/routes/[id]/route.ts` PATCH | `batch_update_stop_indices` RPC with deferrable constraints | Already works, wire to drag UI |
| Stop reassign API | `api/admin/routes/[id]/stops/reassign/route.ts` | Reassign stop between routes | Already exists |
| Driver route page | `(driver)/driver/route/page.tsx` | SSR with stop list, timezone-aware | Add action buttons per stop |
| ActiveRouteView | `components/ui/driver/ActiveRouteView.tsx` | Start/complete route, progress bar, location tracker | Add per-stop action flow |
| SimpleStopView | `components/ui/driver/SimpleStopView.tsx` | Single-stop focus with photo capture, offline sync | Already has full flow, audit only |
| StopCard | `components/ui/driver/StopCard.tsx` | Display-only with status badges, animated | Add navigation/action buttons |
| StopDetailView | `components/ui/driver/StopDetailView.tsx` | Exists | Audit for completeness |
| DeliveryActions | `components/ui/driver/DeliveryActions.tsx` | Exists | Audit and wire |
| DeliveryConfirmDialog | `components/ui/driver/DeliveryConfirmDialog.tsx` | Exists | Already used by SimpleStopView |
| PhotoCapture | `components/ui/driver/PhotoCapture.tsx` | Exists with camera capture | Already used by SimpleStopView |
| ExceptionModal | `components/ui/driver/ExceptionModal.tsx` | Exists | Wire into stop detail |
| NavigationButton | `components/ui/driver/NavigationButton.tsx` | Exists | Wire into stop detail |
| Driver stop API | `api/driver/routes/[routeId]/stops/[stopId]/route.ts` | PATCH with status transitions, auto-next-stop, order status sync | Already works |
| Photo upload API | `api/driver/routes/[routeId]/stops/[stopId]/photo/route.ts` | 5MB limit, JPEG/PNG/WebP, Supabase Storage, signed URLs | Already works |
| Location tracker | `components/ui/driver/LocationTracker.tsx` | Posts to location_updates table | Already works for manual tracking |
| Route builder | `components/ui/admin/routes/RouteBuilder/` | 5 sub-components, Leaflet map, driver selector | Stable, no changes |
| RouteBuilderMap | `components/ui/admin/routes/RouteBuilderMap/` | Leaflet integration, dynamic import | Stable, no changes |
| AdminNav | `components/ui/admin/AdminNav.tsx` | Desktop sidebar only, collapsible, no mobile support | Add mobile bottom nav |
| Auth callback | `app/auth/callback/route.ts` | Role redirect via `getRoleDashboard()`, safe redirect validation | Fix `next` param handling |
| Role redirect | `lib/auth/role-redirect.ts` | `getRoleDashboard()` maps roles to paths | No changes needed |
| OpsCenter | `(admin)/admin/ops/OpsCenter.tsx` | Ops dashboard exists | Audit for mobile |

### Database Primitives Already In Place

| Table/RPC | What It Does | v2.1 Relevance |
|-----------|-------------|----------------|
| `routes` | delivery_date, driver_id, status (planned/in_progress/completed), stats_json, polyline | No schema changes needed |
| `route_stops` | order_id, stop_index (deferrable unique), status (5 states), photo_url, notes | No schema changes needed |
| `location_updates` | driver_id, route_id, lat/lng/accuracy/heading/speed, recorded_at | Use for manual tracking |
| `delivery_exceptions` | route_stop_id, type (6 enum values), photo_url, resolution_notes | Already exists |
| `orders` | Full order data including items, modifiers, contact, payment, tip, instructions | Expand API SELECT |
| `order_items` | name_snapshot, quantity, line_total_cents, special_instructions | Need to include in route detail |
| `order_item_modifiers` | name_snapshot, price_delta_snapshot | Need to include in route detail |
| `batch_update_stop_indices()` | Atomic reorder with deferred constraints | Use for drag reorder |
| `reindex_route_stops()` | Gap-free reindex after deletion | Use after stop removal |
| `update_route_stats()` | Aggregate stop statuses into route stats_json | Use after any stop change |
| `prevent_duplicate_active_assignment` | Trigger prevents order in multiple active routes | Protection in place |
| `check_route_completion` | Trigger prevents completing route with non-terminal stops | Protection in place |

**Key finding: The database layer is complete. No migrations needed for core route operations.**

### Existing Status Enums

```
route_status: 'planned' | 'in_progress' | 'completed'
route_stop_status: 'pending' | 'enroute' | 'arrived' | 'delivered' | 'skipped'
order_status: 'pending' | 'pending_approval' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded'
delivery_exception_type: 'customer_not_home' | 'wrong_address' | 'access_issue' | 'refused_delivery' | 'damaged_order' | 'other'
```

---

## Recommended Architecture

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `RouteEditor` (NEW) | Admin stop reorder/add/remove UI with drag | `api/admin/routes/[id]`, `api/admin/routes/[id]/stops` |
| `DragReorderList` (NEW) | Generic drag-and-drop list using @dnd-kit | RouteEditor, DriverStopReorder |
| `AdminMobileNav` (NEW) | Bottom tab nav for mobile admin | Conditional render in layout |
| `AdminResponsiveShell` (NEW) | Switches sidebar/bottom-nav by viewport | AdminLayout |
| `OrderDetailPanel` (NEW) | Full order info: items, modifiers, payment, contact | Route detail, stop detail, ops |
| `DriverStopActions` (NEW) | Arrived/delivered/skip buttons for current stop | ActiveRouteView, StopDetailView |
| `DriverStopReorder` (NEW) | Driver-side stop reorder (up/down or drag) | New driver reorder API |
| `RouteDetailClient` (MODIFY) | Add editing mode toggle, order detail expansion | RouteEditor, OrderDetailPanel |
| `ActiveRouteView` (MODIFY) | Integrate DriverStopActions into flow | DriverStopActions |
| `StopCard` (MODIFY) | Add action buttons, navigation link | ActiveRouteView |
| `StopDetailView` (MODIFY) | Add full order info, actions, photo | DriverStopActions, OrderDetailPanel |

### Data Flow

#### Admin Route Editing Flow
```
Admin opens /admin/routes/[id]
  -> RouteDetailClient fetches GET /api/admin/routes/[id]
     (already returns full stops + driver + addresses + exceptions)
  -> Toggle editing mode
     -> Drag reorder -> PATCH /api/admin/routes/[id] { stopOrder: [{stopId, stopIndex}] }
        -> batch_update_stop_indices() RPC (deferrable unique constraint)
        -> Clears optimized_polyline (stale after manual reorder)
     -> Remove stop -> DELETE /api/admin/routes/[id]/stops?stopId=xxx
        -> reindex_route_stops() RPC
        -> update_route_stats() RPC
     -> Add stops -> POST /api/admin/routes/[id]/stops { orderIds: [...] }
        -> Validates no duplicate assignment (trigger)
        -> Appends at max_stop_index + 1
     -> Optimize -> POST /api/admin/routes/optimize { routeId }
        -> Google Routes API or nearest-neighbor fallback
        -> batch_update_stop_indices() with optimized order
        -> Saves polyline
  -> TanStack Query invalidates ['admin', 'route', id]
  -> Split route -> POST /api/admin/routes/[id]/split { stopIds, driverId? }
  -> Merge routes -> POST /api/admin/routes/[id]/merge { sourceRouteId }
```

#### Driver Route Execution Flow (Existing, Audit-Only)
```
Driver opens /driver/route
  -> SSR fetches today's route via delivery_date filter
  -> DriverRouteSwitch conditionally renders:
     - SimpleStopView (simple_mode = true): single-stop focus
     - ActiveRouteView (simple_mode = false): full stop list
  -> Route planned -> "Start Route" button
     -> POST /api/driver/routes/[routeId]/start
        -> Sets route status = 'in_progress', started_at = now
        -> Sets first stop status = 'enroute'
        -> Batch-updates all route orders to 'out_for_delivery'
  -> Per-stop execution:
     -> "I'm Here" -> PATCH status: 'arrived' (sets arrived_at)
     -> "Delivered" -> confirm dialog -> PATCH status: 'delivered' (sets delivered_at)
        -> Server auto-updates order.status = 'delivered'
        -> Optional photo -> POST photo endpoint
        -> Server auto-advances next stop to 'enroute'
     -> "Skip" -> PATCH status: 'skipped'
        -> Server auto-advances next stop to 'enroute'
  -> All stops terminal -> "Complete Route" button
     -> POST /api/driver/routes/[routeId]/complete
        -> check_route_completion trigger validates
  -> router.refresh() re-fetches SSR data after each mutation
```

#### Manual Delivery Tracking Flow
```
Driver updates stop status via any of the above
  -> PATCH /api/driver/routes/[routeId]/stops/[stopId]
  -> Updates route_stops.status + timestamps (arrived_at, delivered_at)
  -> Updates orders.status when delivered
  -> update_route_stats() refreshes stats_json
  -> LocationTracker component posts to location_updates table
  -> Customer /tracking/[orderId] or /tracking?token=xxx reads:
     -> Order status + timestamps
     -> Driver info (name, photo, vehicle)
     -> Route stop position (currentStop / totalStops)
     -> Latest location from location_updates
  -> No live GPS stream -- status text + timestamps ARE the tracking data
```

---

## What Is NEW vs MODIFIED (Explicit Inventory)

### NEW Components (Create Fresh)

| Component | Path | Lines Est. | Rationale |
|-----------|------|------------|-----------|
| `RouteEditor` | `components/ui/admin/routes/RouteEditor/RouteEditor.tsx` | ~200 | Encapsulates editing mode: drag reorder, add/remove buttons |
| `RouteEditor/EditToolbar` | `components/ui/admin/routes/RouteEditor/EditToolbar.tsx` | ~80 | Action bar: Add Stops, Optimize, Split, Save |
| `DragReorderList` | `components/ui/DragReorderList.tsx` | ~120 | Reusable @dnd-kit sortable list |
| `AdminMobileNav` | `components/ui/admin/AdminMobileNav.tsx` | ~100 | Bottom tab bar (5 items + More sheet) |
| `AdminResponsiveShell` | `components/ui/admin/AdminResponsiveShell.tsx` | ~40 | Viewport switch: sidebar vs bottom nav |
| `OrderDetailPanel` | `components/ui/admin/orders/OrderDetailPanel/OrderDetailPanel.tsx` | ~250 | Items + modifiers, contact, address, payment, tip, delivery instructions |
| `OrderDetailPanel/OrderItemsList` | `components/ui/admin/orders/OrderDetailPanel/OrderItemsList.tsx` | ~100 | Item rows with modifier sub-rows |
| `OrderDetailPanel/PaymentSummary` | `components/ui/admin/orders/OrderDetailPanel/PaymentSummary.tsx` | ~80 | Subtotal, fee, tax, tip, discount, total |
| `DriverStopActions` | `components/ui/driver/DriverStopActions.tsx` | ~150 | Action buttons: Navigate, Arrived, Delivered, Skip |
| `DriverStopReorder` | `components/ui/driver/DriverStopReorder.tsx` | ~100 | Up/down arrows for driver stop reordering |

### NEW API Routes

| Route | Method | Purpose | Complexity |
|-------|--------|---------|------------|
| `api/admin/routes/[id]/split/route.ts` | POST | Split route: move selected stops to new route | Medium |
| `api/admin/routes/[id]/merge/route.ts` | POST | Merge source route stops into target route | Medium |
| `api/driver/routes/[routeId]/reorder/route.ts` | PATCH | Driver-initiated stop reorder | Low (reuses batch_update_stop_indices RPC) |

### MODIFIED Files

| File | Change | Risk |
|------|--------|------|
| `(admin)/admin/layout.tsx` | Replace static div + AdminNav with AdminResponsiveShell | Low |
| `AdminNav.tsx` | Add `className` prop, add `hidden md:flex` for responsive | Low |
| `RouteDetailClient/RouteDetailClient.tsx` | Add editing mode toggle, integrate RouteEditor | Medium |
| `RouteDetailClient/RouteHeader.tsx` | Add Edit/Save buttons | Low |
| `api/admin/routes/[id]/route.ts` GET | Expand order_items SELECT to include names, modifiers, payment fields | Low |
| `api/admin/routes/[id]/types.ts` | Expand RouteDetailRow type for full order data | Low |
| `ActiveRouteView.tsx` | Integrate DriverStopActions for in_progress route | Medium |
| `StopCard.tsx` | Add onClick -> navigate to stop detail | Low |
| `StopDetailView.tsx` | Add DriverStopActions, full order info, photo display | Medium |
| `StopList.tsx` | Support drag reorder via DragReorderList when editing | Medium |
| `auth/callback/route.ts` | Fix: use `next` param when it matches role prefix | Low |
| Admin page layouts (ops, orders, routes, drivers) | Add responsive Tailwind classes for mobile | Low per file |

### NO Changes Needed

| Area | Why |
|------|-----|
| Database schema | All tables, enums, triggers, RPCs already exist |
| `isValidStatusTransition()` | Already validates all stop status transitions |
| Photo upload pipeline | Storage bucket, upload API, signed URL generation all working |
| Route optimization service | Google Routes API + nearest-neighbor fallback in `lib/services/route-optimization/` |
| Route builder / creation UI | Leaflet map, geographic clustering, order selection all working |
| Auth role detection | `getRoleDashboard()` correctly maps roles to dashboards |
| Rate limiting | All route APIs already rate-limited via `checkRateLimit()` |
| Offline sync | `useOfflineSync()` hook already queues status updates + photos |
| Simple mode provider | `SimpleModeProvider` + `useSimpleMode()` already reads from server |

---

## Patterns to Follow

### Pattern 1: Editing Mode Toggle
**What:** Route detail defaults to read-only. Click "Edit" to enable drag-reorder and mutation buttons.
**When:** Admin views route detail.
**Why:** Prevents accidental changes during Saturday ops monitoring. Touch targets on mobile are large; accidental drags would be disruptive.

```typescript
// RouteDetailClient.tsx
const [isEditing, setIsEditing] = useState(false);

return (
  <>
    <RouteHeader onToggleEdit={() => setIsEditing(!isEditing)} isEditing={isEditing} />
    {isEditing ? (
      <RouteEditor routeId={id} stops={stops} onStopsChange={() => refetch()} />
    ) : (
      <RouteTimeline stops={stops} />
    )}
  </>
);
```

### Pattern 2: Optimistic Updates with TanStack Query (Admin Only)
**What:** Admin route editing uses TanStack Query mutations with optimistic rollback.
**When:** Stop reorder, status change, add/remove from admin UI.
**Why:** Saturday ops needs instant visual feedback.

```typescript
const reorderMutation = useMutation({
  mutationFn: (stopOrder) =>
    fetch(`/api/admin/routes/${routeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stopOrder }),
    }),
  onMutate: async (newOrder) => {
    await queryClient.cancelQueries({ queryKey: ['admin', 'route', routeId] });
    const previous = queryClient.getQueryData(['admin', 'route', routeId]);
    queryClient.setQueryData(['admin', 'route', routeId], applyReorder(previous, newOrder));
    return { previous };
  },
  onError: (_err, _data, context) => {
    queryClient.setQueryData(['admin', 'route', routeId], context?.previous);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'route', routeId] }),
});
```

### Pattern 3: SSR + router.refresh() for Driver Route (Keep Existing)
**What:** Driver route page uses SSR. After mutations, `router.refresh()` re-runs server component.
**When:** Driver completes any action (arrive, deliver, skip).
**Why:** Already established pattern. SSR ensures fresh data, works with service worker caching for offline-first, simpler mental model for non-technical family drivers.
**Do NOT switch to TanStack Query.** This is an explicit design decision from v1.9.

### Pattern 4: Responsive Admin Shell
**What:** Desktop shows sidebar, mobile shows bottom nav. Single layout component handles both.
**When:** Admin layout renders.
**Why:** Admin uses phone during Saturday kitchen ops.

```typescript
// AdminResponsiveShell.tsx
export function AdminResponsiveShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex min-h-screen bg-cream">
        <AdminNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      {/* Mobile */}
      <div className="flex flex-col min-h-screen bg-cream md:hidden">
        <main className="flex-1 overflow-auto pb-16">{children}</main>
        <AdminMobileNav />
      </div>
    </>
  );
}
```

### Pattern 5: Driver Action State Machine
**What:** Stop actions mirror the existing `isValidStatusTransition()` server-side validation.
**When:** Driver interacts with a stop.
**Why:** Client-side validation prevents rejected requests; server-side is the authority.

```typescript
const getAvailableActions = (status: RouteStopStatus): RouteStopStatus[] => {
  switch (status) {
    case 'pending': return []; // Only server sets to 'enroute' via auto-advance
    case 'enroute': return ['arrived', 'skipped'];
    case 'arrived': return ['delivered', 'skipped'];
    default: return []; // Terminal states
  }
};
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: TanStack Query for Driver Route
**What:** Converting driver route from SSR to client-side data fetching.
**Why bad:** Breaks offline-first caching. Adds loading spinners. Confuses non-technical drivers. SSR + service worker is simpler and more reliable.
**Instead:** Keep SSR. Use `router.refresh()` after mutations.

### Anti-Pattern 2: Custom Drag-and-Drop Implementation
**What:** Building drag-and-drop from scratch with pointer events.
**Why bad:** Accessibility (keyboard, screen reader), touch (scroll vs drag), scroll containers all need handling. 400-line file limit makes single-file implementation impractical.
**Instead:** Use `@dnd-kit/core` + `@dnd-kit/sortable`. Tree-shakeable (~12KB gzipped total), accessible, touch-friendly.

### Anti-Pattern 3: Separate Mobile Admin Pages
**What:** Creating `/admin/m/` routes with mobile-specific pages.
**Why bad:** Doubles maintenance surface. Same data, same APIs, just different viewport.
**Instead:** Make existing pages responsive. AdminResponsiveShell handles navigation. Tailwind `md:` classes handle layout.

### Anti-Pattern 4: Realtime Subscriptions for Route Updates
**What:** Using Supabase Realtime for live route stop updates during driver execution.
**Why bad:** v1.9 decision: 5s polling is indistinguishable at 20-50 orders. Realtime adds connection management. Admin already polls ops dashboard.
**Instead:** `router.refresh()` for driver. `invalidateQueries()` for admin.

### Anti-Pattern 5: Route Split/Merge as Client-Side Logic
**What:** Splitting/merging routes with multiple sequential API calls from the client.
**Why bad:** Partial failures leave routes in inconsistent state: stop_index gaps, orphaned stops, duplicate assignments.
**Instead:** Single API endpoint per operation. Server handles transactionally.

### Anti-Pattern 6: Expanding Route Detail API Response Everywhere
**What:** Adding full order items/modifiers to the route LIST endpoint.
**Why bad:** Route list shows 5-10 routes with 5-10 stops each. Full item data is 5-10x payload.
**Instead:** Only expand the route DETAIL endpoint (`GET /api/admin/routes/[id]`). List endpoint keeps summary data (item count, total).

---

## Split/Merge Route Architecture

### Route Split
```
POST /api/admin/routes/[id]/split
Body: { stopIds: string[], driverId?: string }

Server (single transaction):
1. Validate route status === 'planned' (reject in_progress/completed)
2. Validate all stopIds belong to this route
3. Create new route (same delivery_date, optional driverId)
4. UPDATE route_stops SET route_id = newRouteId WHERE id IN (stopIds)
5. reindex_route_stops(originalRouteId)
6. reindex_route_stops(newRouteId)
7. update_route_stats(originalRouteId)
8. update_route_stats(newRouteId)
9. Return { originalRouteId, newRouteId, movedStopCount }
```

### Route Merge
```
POST /api/admin/routes/[id]/merge
Body: { sourceRouteId: string }

Server (single transaction):
1. Validate BOTH routes status === 'planned'
2. Get max stop_index of target route
3. UPDATE source stops: SET route_id = targetId, stop_index += (maxIndex + 1)
4. DELETE source route (now empty, cascade-safe)
5. reindex_route_stops(targetRouteId)
6. update_route_stats(targetRouteId)
7. Return { mergedRouteId, stopsAdded }
```

---

## Order Detail Completeness Architecture

### Current Route Detail API Response (Per Stop)

The `GET /api/admin/routes/[id]` currently returns:
- `order.totalCents`, `order.specialInstructions`, `order.status`
- `order.itemCount` (computed: `order_items.reduce(sum, quantity)` -- NOT item details)
- `order.customer.id, fullName, phone` (missing: email)
- `order.address.*` (full address with lat/lng)
- `order.deliveryWindowStart, deliveryWindowEnd`

### What to Add (API SELECT Expansion Only)

```sql
-- Current order_items join:
order_items (quantity)

-- Expand to:
order_items (
  id,
  name_snapshot,
  base_price_snapshot,
  quantity,
  line_total_cents,
  special_instructions,
  order_item_modifiers (
    name_snapshot,
    price_delta_snapshot
  )
)
```

Also expand the orders SELECT:
```sql
-- Add these fields (already in schema, just not selected):
subtotal_cents,
delivery_fee_cents,
tax_cents,
tip_cents,
discount_cents,
delivery_instructions,
stripe_payment_intent_id,
placed_at,
confirmed_at,
delivered_at
```

And expand profile join:
```sql
-- Add email to customer profile select:
profiles!orders_user_id_fkey (id, full_name, phone, email)
```

### OrderDetailPanel TypeScript Interface

```typescript
interface OrderDetailData {
  id: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  tipCents: number;
  discountCents: number;
  specialInstructions: string | null;
  deliveryInstructions: string | null;
  stripePaymentIntentId: string | null; // null = COD
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  customer: {
    id: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
  };
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    lat: number | null;
    lng: number | null;
  };
  items: {
    id: string;
    nameSnapshot: string;
    quantity: number;
    lineTotalCents: number;
    specialInstructions: string | null;
    modifiers: {
      nameSnapshot: string;
      priceDeltaSnapshot: number;
    }[];
  }[];
}
```

**No schema changes. Just expanding the SELECT in the existing route detail API and adding a new UI component.**

---

## Admin Mobile UX Architecture

### Pages Requiring Mobile Audit

| Page | Current State | Mobile Fix |
|------|--------------|------------|
| `/admin` (dashboard) | Grid stat cards | Likely already responsive |
| `/admin/ops` | OpsCenter with counts + order table | Table needs horizontal scroll or card view |
| `/admin/orders` | Order table | Card view on mobile, table on desktop |
| `/admin/orders/[id]` | Detail view with sidebar info | Stack columns vertically |
| `/admin/routes` | Route list + stats cards | Stack cards, list below |
| `/admin/routes/[id]` | Route detail + map + stop list | Full-width stops, collapsible map |
| `/admin/routes/new` | Route builder with map + order panel | Sheet-based order selection on mobile |
| `/admin/drivers` | Driver list with stats | Card view on mobile |
| `/admin/settings` | Form | Already single-column |
| `/admin/emails` | Email log table | Card view on mobile |
| `/admin/feedback` | Feedback list | Card view on mobile |

### Mobile Navigation (AdminMobileNav)

Bottom tab bar: 5 items max for thumb reach.
```
1. Dashboard (LayoutDashboard)
2. Ops (Activity)
3. Orders (ClipboardList)
4. Routes (Route)
5. More... (Menu) -> opens sheet with remaining links
```

The "More" sheet contains: Drivers, Menu, Categories, Photos, Sections, Analytics, Feedback, Settings, Sign Out.

### Responsive Breakpoint Strategy
- `< md` (768px): Mobile layout, bottom nav, stacked content, card views for tables
- `>= md`: Desktop layout, sidebar nav, side-by-side content, table views
- Use Tailwind `md:` prefix consistently. No custom breakpoints.
- Admin pages should use `px-4 md:px-8` for edge spacing.

---

## Auth Routing Fix Architecture

### Current Bug

Auth callback has `next` param support but `getRoleDashboard()` always overrides it with role-based paths (`/admin`, `/driver`, `/menu`). When admin clicks a link like `/admin/routes/abc123` while logged out, the flow is:
1. Redirect to `/login?next=/admin/routes/abc123`
2. Login succeeds, callback gets `next=/admin/routes/abc123`
3. But `getRoleDashboard()` returns `{ path: '/admin' }` and callback uses that
4. Admin lands on `/admin` instead of `/admin/routes/abc123`

### Fix (Minimal, Safe)

In auth callback, after role resolution, check if `next` param is within the user's authorized prefix:

```typescript
// In auth/callback/route.ts, after getting roleResult:
const rolePrefixes: Record<string, string> = {
  admin: '/admin',
  driver: '/driver',
  customer: '/menu',
};
const prefix = rolePrefixes[roleResult.role] ?? '/';
// Use next param if it's within the user's authorized area
const finalPath = (next !== '/' && isSafeRedirect(next) && next.startsWith(prefix))
  ? next
  : roleResult.path;
```

This is ~5 lines of code. No other files need to change.

---

## New Dependency Assessment

| Package | Purpose | Bundle Impact | Justification |
|---------|---------|---------------|---------------|
| `@dnd-kit/core` | Drag-and-drop primitives | ~8KB gzipped | Admin route editor + driver stop reorder. Accessible, touch-friendly. |
| `@dnd-kit/sortable` | Sortable list preset | ~3KB gzipped | SortableContext for stop lists. |
| `@dnd-kit/utilities` | CSS transform utilities | ~1KB gzipped | Required by sortable. |

**Total new bundle: ~12KB gzipped.** Acceptable for the functionality gained. Dynamic import for both admin and driver route pages to avoid loading on unrelated pages.

**No other new dependencies.** Everything else uses existing stack: TanStack Query (admin mutations), Zustand (client state), Framer Motion (animations), Leaflet (maps).

---

## Scalability Considerations

| Concern | At 20 orders (current) | At 100 orders | At 500 orders |
|---------|----------------------|---------------|---------------|
| Route detail query | Single query with 3-level joins, fast | Same, Postgres handles it | Add pagination to stops list |
| Stop reorder | batch_update_stop_indices handles 50+ stops | Same, batch is efficient | Same |
| Order detail expansion | +2 joins (items, modifiers), ~50 items max | Same | Lazy-load item details on expand |
| Photo uploads | 5MB per stop, Supabase Storage | Same | Add client-side compression |
| Admin mobile | All data fits in viewport | Virtual scroll for order lists | Server-side pagination |
| Drag-and-drop | 10 stops per route | 30 stops, fine | Virtualized drag list |

---

## Build Order (Dependency-Aware)

```
Phase 1: Auth Fix + Admin Mobile Shell (Foundation)
  - Auth callback next param fix (standalone, ~5 lines)
  - AdminResponsiveShell + AdminMobileNav (layout-only)
  - AdminNav responsive hiding (add hidden md:flex)
  - Mobile audit of admin pages (CSS-only Tailwind changes)
  Dependencies: None. Enables all subsequent phases to be mobile-friendly.

Phase 2: Order Detail Completeness (Data Foundation)
  - Expand route detail API response (backend SELECT changes)
  - Update RouteDetailRow type
  - OrderDetailPanel component + sub-components
  - Wire into RouteDetailClient (expandable per-stop)
  Dependencies: None. Needed by Phase 3 and Phase 4.

Phase 3: Admin Route Editing (Admin Feature)
  - Install @dnd-kit/*
  - DragReorderList component
  - RouteEditor + EditToolbar components
  - Split/merge API endpoints
  - Wire into RouteDetailClient with edit mode toggle
  - Optimize button wiring (API exists, just add UI trigger)
  Dependencies: Phase 2 (OrderDetailPanel shown in edit mode).

Phase 4: Driver Route Execution (Driver Feature)
  - DriverStopActions component
  - Modify ActiveRouteView to show per-stop actions
  - Wire StopCard onClick to stop detail page
  - StopDetailView with full order info + actions + photo + navigation
  - Driver stop reorder API + DriverStopReorder component
  - Audit SimpleStopView for completeness
  - Audit all driver pages end-to-end (profile, earnings, history, schedule)
  Dependencies: Phase 2 (OrderDetailPanel reused in stop detail).

Phase 5: Manual Tracking + Photo Proof (Integration)
  - Verify customer tracking page reads stop status updates
  - Photo proof visibility in admin route detail (already in API, wire to UI)
  - Photo proof in customer tracking (if not already shown)
  - Email updates with delivery status (verify existing email templates)
  Dependencies: Phase 4 (driver must be updating statuses).
```

**Rationale:**
- Phase 1 is pure infrastructure with zero feature risk
- Phase 2 provides the data layer both admin and driver features need
- Phase 3 and Phase 4 are independent of each other (could parallelize)
- Phase 5 is mostly verification that existing pieces connect properly

---

## Sources

- Direct codebase analysis of all files referenced above (HIGH confidence)
- Database schema: `supabase/migrations/001_schema.sql`, `20260312_route_pipeline_hardening.sql`, `20260313_fix_stop_index_unique_deferrable.sql`
- Existing API contracts: `src/app/api/admin/routes/`, `src/app/api/driver/routes/`
- Existing components: `src/components/ui/admin/routes/`, `src/components/ui/driver/`
- Auth flow: `src/app/auth/callback/route.ts`, `src/lib/auth/role-redirect.ts`
- @dnd-kit bundle size: published package sizes on npm (HIGH confidence, well-known library)
