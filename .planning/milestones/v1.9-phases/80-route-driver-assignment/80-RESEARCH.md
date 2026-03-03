# Phase 80: Route & Driver Assignment - Research

**Researched:** 2026-03-01
**Domain:** Admin route builder, geographic clustering, Leaflet maps, driver ownership enforcement
**Confidence:** HIGH

## Summary

Phase 80 replaces the existing `CreateRouteModal` dialog with a full-page route builder at `/admin/routes/new`. The codebase already has substantial route infrastructure: CRUD APIs for routes/stops, driver availability checks, Haversine distance utilities, Zod validation schemas, RLS policies, and route detail views. The primary new work is: (1) full-page builder with two-column layout, (2) Leaflet map integration replacing Google Maps, (3) geographic clustering using existing Haversine utility, (4) order reassignment between routes, and (5) auditing driver API ownership enforcement (already largely implemented).

**Primary recommendation:** Build the full-page route builder by extracting and extending patterns from `CreateRouteModal`, add Leaflet via `react-leaflet` (exception to zero-new-packages constraint per user decision), implement client-side proximity clustering with the existing `calculateHaversineDistance`, and add reassignment UI to `RouteDetailClient`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full-page route builder at `/admin/routes/new` -- not a modal dialog
- Two-column layout: left = unassigned orders + driver selector, right = map with selected stops
- Click-to-add interaction: click an order card to add to route, checkboxes for bulk selection
- One route at a time: build, save, then start another. Unassigned list updates after save
- Default delivery date to the upcoming Saturday (matches existing CreateRouteModal behavior), changeable if needed
- Visual clustering of unassigned orders by geographic proximity
- Simple proximity clustering using Haversine distance in JS -- no external API needed
- Cluster labels on the order list (e.g., "North Side -- 4 orders") with color coding
- Click a cluster to select all its orders into the current route; can deselect individually after
- Visual yellow warning badge if orders in the route have tight/overlapping delivery time windows (informational, doesn't block)
- Leaflet + OpenStreetMap for interactive map -- free, no API key, ~40KB
- Map lives in the right panel of the route builder, updates live as orders are added/removed
- Pins for each stop on the map
- Estimated duration from simple distance calculation (straight-line between stops + fixed time-per-stop), no external routing API
- Route summary (stop count, driver, estimated duration) shown on both the routes list page and detail view
- Action menu on each stop in route detail view: "Reassign" dropdown listing other routes for that day
- Reassignment only allowed on planned routes -- locked once in_progress
- Reassigned orders append to end of target route; operator can manually reorder
- "Remove from route" action also available (returns order to unassigned pool) with confirmation dialog
- All driver API queries enforce ownership -- drivers only see their own routes and stops

### Claude's Discretion
- Loading skeletons and animation details
- Exact clustering radius/threshold for geographic grouping
- Map zoom level and pin styling
- Stop reorder UI within a route (drag handles or up/down buttons)
- Error state designs
- Driver ownership enforcement approach (RLS policies vs API middleware)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUTE-01 | Unassigned orders panel -- confirmed orders not on a route | Extend existing `OrderSelectionList` + `/api/admin/orders` with route-assignment filter; addresses have lat/lng for map pins |
| ROUTE-02 | Available drivers panel -- drivers with capacity indicator | Reuse `OpsDriverPanel` patterns + `deriveDriverReadiness()` + `isDriverAvailable()` from existing code |
| ROUTE-03 | One-click route creation -- select orders + driver = route | Existing `POST /api/admin/routes` handles atomic create with rollback; extend to full-page builder |
| ROUTE-04 | Auto-suggest grouping by geography / time window | Client-side clustering using existing `calculateHaversineDistance` from `src/lib/utils/eta.ts` |
| ROUTE-05 | Route summary -- stop count, estimated duration, map preview | New Leaflet map component + duration calc from Haversine + existing `RouteStats` type |
| ROUTE-06 | Reassign orders between routes | New API endpoint + UI in `RouteDetailClient` stop cards; status guard (planned only) already exists in stop APIs |
| ROUTE-07 | Driver ownership check on all driver API queries | RLS policies already enforce at DB level; API middleware (`requireDriver` + `route.driver_id !== driverId`) already in all 6 driver endpoints |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-leaflet | 5.0.0 | React wrapper for Leaflet maps | User decision; free, no API key, ~40KB |
| leaflet | 1.9.4 | Interactive map library | Peer dependency of react-leaflet |
| @types/leaflet | latest | TypeScript types for Leaflet | Required for TS support (react-leaflet has its own types) |

### Already Installed (reuse heavily)
| Library | Version | Purpose | Usage in Phase |
|---------|---------|---------|----------------|
| framer-motion | 12.26.1 | Animation | Card transitions, panel entrance animations |
| date-fns | 4.1.0 | Date utilities | `nextSaturday()`, `isSaturday()`, `format()` for delivery dates |
| lucide-react | 0.562.0 | Icons | Map pins, route icons, action menu icons |
| zod | (installed) | Validation | Route creation schema, reassignment schema |
| @supabase/supabase-js | 2.90.1 | Database client | All CRUD operations |
| @react-google-maps/api | 2.20.8 | Existing map (kept) | RouteMap.tsx stays for route detail; new Leaflet for builder |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Leaflet | Google Maps (existing) | Already installed, but requires API key; user chose Leaflet for free/no-key |
| react-leaflet | Vanilla Leaflet | Direct Leaflet is lighter but requires manual React integration; react-leaflet provides declarative API |
| Client-side clustering | Server-side SQL clustering | More scalable, but at 20-50 orders client-side is trivially fast |

**Installation:**
```bash
pnpm add leaflet react-leaflet @types/leaflet
```

**Note:** This is an exception to the v1.9 "zero new npm packages" constraint, explicitly decided by the user in the discuss phase.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(admin)/admin/routes/
│   ├── page.tsx                    # Routes list (existing, enhance with summary stats)
│   ├── RoutesStatsCards.tsx         # Existing stats cards
│   ├── new/
│   │   └── page.tsx                # NEW: Route builder page (server wrapper)
│   └── [id]/
│       └── page.tsx                # Existing route detail
├── components/ui/admin/routes/
│   ├── RouteBuilder/               # NEW: Full-page builder
│   │   ├── index.tsx               # Barrel exports
│   │   ├── RouteBuilderClient.tsx  # Main builder component
│   │   ├── UnassignedOrdersPanel.tsx # Left panel: orders list with clustering
│   │   ├── DriverSelector.tsx      # Driver grid selector
│   │   ├── RouteSummaryBar.tsx     # Summary: stop count, duration, driver
│   │   └── helpers.ts             # Clustering, duration estimation
│   ├── RouteBuilderMap/            # NEW: Leaflet map for builder
│   │   ├── index.tsx               # Barrel + dynamic import
│   │   ├── RouteBuilderMap.tsx     # Leaflet map component
│   │   └── MapSkeleton.tsx         # Loading skeleton
│   ├── RouteDetailClient/          # Existing (enhance with reassignment)
│   │   ├── ...existing files
│   │   └── ReassignMenu.tsx        # NEW: Reassign dropdown
│   ├── RouteStopCard.tsx           # Existing (add reassign action)
│   └── StopsList.tsx               # Existing (add reassign callback)
└── lib/
    └── utils/
        └── clustering.ts           # NEW: Geographic clustering logic
```

### Pattern 1: Next.js Dynamic Import for Leaflet (SSR bypass)
**What:** Leaflet accesses `window`/`document` at import time, incompatible with SSR
**When to use:** Always for Leaflet components in Next.js
**Example:**
```typescript
// RouteBuilderMap/index.tsx
import dynamic from 'next/dynamic';

const RouteBuilderMapInner = dynamic(
  () => import('./RouteBuilderMap').then(mod => ({ default: mod.RouteBuilderMap })),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export function RouteBuilderMap(props: RouteBuilderMapProps) {
  return <RouteBuilderMapInner {...props} />;
}
```

### Pattern 2: Haversine Proximity Clustering
**What:** Group orders by geographic proximity using existing `calculateHaversineDistance`
**When to use:** When building unassigned orders panel with cluster labels
**Example:**
```typescript
// src/lib/utils/clustering.ts
import { calculateHaversineDistance } from '@/lib/utils/eta';

interface ClusterableOrder {
  id: string;
  lat: number;
  lng: number;
}

interface OrderCluster {
  label: string;
  color: string;
  orderIds: string[];
  centroid: { lat: number; lng: number };
}

const CLUSTER_RADIUS_KM = 2.0; // ~1.2 miles

export function clusterOrders(orders: ClusterableOrder[]): OrderCluster[] {
  // Simple greedy clustering:
  // 1. Sort orders by lat (stable grouping)
  // 2. For each unassigned order, find nearest cluster centroid
  // 3. If within CLUSTER_RADIUS_KM, add to cluster; else start new cluster
  // 4. Recalculate centroid after each addition
  const sorted = [...orders].sort((a, b) => a.lat - b.lat);
  const clusters: { orderIds: string[]; centroid: { lat: number; lng: number } }[] = [];

  for (const order of sorted) {
    let assigned = false;
    for (const cluster of clusters) {
      const dist = calculateHaversineDistance(
        order.lat, order.lng,
        cluster.centroid.lat, cluster.centroid.lng
      );
      if (dist <= CLUSTER_RADIUS_KM) {
        cluster.orderIds.push(order.id);
        // Recalculate centroid
        const allOrders = cluster.orderIds.map(id => orders.find(o => o.id === id)!);
        cluster.centroid = {
          lat: allOrders.reduce((s, o) => s + o.lat, 0) / allOrders.length,
          lng: allOrders.reduce((s, o) => s + o.lng, 0) / allOrders.length,
        };
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      clusters.push({ orderIds: [order.id], centroid: { lat: order.lat, lng: order.lng } });
    }
  }

  // Label clusters with area names or directional labels
  return clusters.map((c, i) => ({
    label: generateClusterLabel(c.centroid, i),
    color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
    orderIds: c.orderIds,
    centroid: c.centroid,
  }));
}
```

### Pattern 3: Atomic Route Creation with Rollback
**What:** Create route + stops in one operation, rollback route if stops fail
**When to use:** POST /api/admin/routes -- already implemented
**Example:**
```typescript
// Already exists in src/app/api/admin/routes/route.ts
// Create route -> create stops -> if stops fail, delete route
// This pattern is correct. The new builder just calls the same API.
```

### Pattern 4: Order Reassignment Between Routes
**What:** Move a stop from one planned route to another
**When to use:** Admin action on route detail view
**Example:**
```typescript
// New API: POST /api/admin/routes/[id]/stops/reassign
// Body: { stopId: string, targetRouteId: string }
// Steps:
// 1. Verify source route is "planned"
// 2. Verify target route is "planned" and same delivery_date
// 3. Delete stop from source route
// 4. Add stop to target route (appended at end)
// 5. Reindex both routes' stops
// 6. Update stats for both routes
```

### Anti-Patterns to Avoid
- **Multiple sequential Supabase calls without error aggregation:** Each call can fail independently; handle all errors and rollback if any step in a multi-step operation fails
- **Client-side route creation logic:** Never build the route object client-side and send it; let the API validate order statuses, check for duplicates, and create atomically
- **Importing Leaflet at module level in server components:** Leaflet accesses `window` at import time; always use dynamic import with `ssr: false`
- **Re-fetching all routes after reassignment:** Only refresh the affected routes, not the entire list
- **Hardcoded colors/styling:** Use design tokens (`text-text-primary`, `bg-surface-secondary`, etc.) per project convention

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Geographic distance | Custom distance formula | `calculateHaversineDistance` from `src/lib/utils/eta.ts` | Already tested, handles edge cases |
| Driver availability | Custom availability check | `isDriverAvailable()` from `src/lib/availability.ts` + `deriveDriverReadiness()` from ops helpers | Multiple edge cases (blocked dates, day-of-week, inactive) |
| Route validation | Custom date/order validation | `createRouteSchema` from `src/lib/validations/route.ts` | Saturday check, UUID validation, min-1-order all handled |
| Map SSR handling | Custom lazy loading | `next/dynamic` with `ssr: false` | Framework-level solution, handles hydration correctly |
| Duration estimation | External routing API | Haversine distance * 1.3 road factor + 5 min/stop | Matches existing `calculateETA` pattern in eta.ts |
| Driver auth | Custom auth check | `requireDriver()` from `src/lib/auth/driver.ts` | Returns typed result with driverId, handles all edge cases |

**Key insight:** Nearly all supporting infrastructure exists. This phase is primarily UI composition and one new API endpoint (reassignment).

## Common Pitfalls

### Pitfall 1: Leaflet CSS Not Loaded
**What goes wrong:** Map renders but tiles don't display, markers are missing/broken
**Why it happens:** Leaflet requires its CSS (`leaflet/dist/leaflet.css`) to be imported; Next.js doesn't auto-include it
**How to avoid:** Import Leaflet CSS in the map component file: `import 'leaflet/dist/leaflet.css'`
**Warning signs:** Map container appears but is gray/blank, marker icons show as broken images

### Pitfall 2: Leaflet Default Marker Icon Path
**What goes wrong:** Default marker icons show as broken images
**Why it happens:** Leaflet's default icon references URLs relative to the CSS file, which breaks in webpack/next.js bundling
**How to avoid:** Explicitly set the default icon:
```typescript
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerRetina.src,
  shadowUrl: markerShadow.src,
});
```
Or use custom div icons (circle markers) to avoid the issue entirely.
**Warning signs:** Console errors about missing `/marker-icon.png`

### Pitfall 3: Stale Unassigned Orders After Route Save
**What goes wrong:** Orders that were just added to a route still appear in the unassigned list
**Why it happens:** Client state not refreshed after POST /api/admin/routes
**How to avoid:** After successful route creation, re-fetch unassigned orders. The user decided "unassigned list updates after save."
**Warning signs:** Operator can accidentally add same order to two routes (though API prevents this)

### Pitfall 4: Reassignment Race Condition
**What goes wrong:** Two admins reassign the same order simultaneously, or reassign to a route that changed status
**Why it happens:** No optimistic locking on route status
**How to avoid:** Re-check both source and target route status in the API handler before modifying. The existing `route_stops` duplicate check (`existing_stops` query in POST) already prevents duplicate assignment.
**Warning signs:** 400 errors during reassignment that the UI doesn't handle gracefully

### Pitfall 5: Orders Without Lat/Lng Break Clustering
**What goes wrong:** Clustering algorithm fails or produces nonsensical clusters
**Why it happens:** Some addresses may have null lat/lng if geocoding failed
**How to avoid:** Filter out orders with null coordinates before clustering; show them in a separate "Location Unknown" group
**Warning signs:** NaN in distance calculations, empty cluster groups

### Pitfall 6: Leaflet Map Not Resizing on Panel Changes
**What goes wrong:** Map tiles don't fill the container after layout changes
**Why it happens:** Leaflet calculates container size on init; if container resizes (e.g., sidebar collapse), tiles have gaps
**How to avoid:** Call `map.invalidateSize()` after any layout change, or use ResizeObserver
**Warning signs:** Gray gaps at edges of map, tiles loading but not covering full area

## Code Examples

### Leaflet Map Component with Dynamic Import
```typescript
// RouteBuilderMap/RouteBuilderMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface MapStop {
  id: string;
  lat: number;
  lng: number;
  label: string;
  clusterColor?: string;
}

interface RouteBuilderMapProps {
  stops: MapStop[];
  center?: [number, number];
  onStopClick?: (id: string) => void;
}

// Auto-fit bounds component
function FitBounds({ stops }: { stops: MapStop[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, stops]);
  return null;
}

export function RouteBuilderMap({ stops, center, onStopClick }: RouteBuilderMapProps) {
  const defaultCenter: [number, number] = center ?? [34.0858, -117.8896]; // Kitchen location

  return (
    <MapContainer center={defaultCenter} zoom={12} className="h-full w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stops={stops} />
      {stops.map(stop => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          eventHandlers={{ click: () => onStopClick?.(stop.id) }}
        >
          <Popup>{stop.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### Unassigned Orders Query (Enhanced Admin Orders API)
```typescript
// Enhanced query: GET /api/admin/orders?status=confirmed,preparing&unassigned=true
// Adds left join exclusion to filter out orders already on active routes
const { data: orders } = await supabase
  .from('orders')
  .select(`
    id, status, total_cents, delivery_window_start, delivery_window_end,
    profiles (full_name, phone, email),
    addresses (lat, lng, line_1, city),
    order_items (quantity)
  `)
  .in('status', ['confirmed', 'preparing'])
  .order('delivery_window_start', { ascending: true });

// Filter out orders already on active routes (client-side or via RPC)
const { data: assignedOrderIds } = await supabase
  .from('route_stops')
  .select('order_id, routes!inner(status)')
  .neq('routes.status', 'completed');

const assignedIds = new Set(assignedOrderIds?.map(s => s.order_id) ?? []);
const unassigned = orders?.filter(o => !assignedIds.has(o.id)) ?? [];
```

### Route Duration Estimation
```typescript
// Uses existing calculateHaversineDistance from eta.ts
import { calculateHaversineDistance } from '@/lib/utils/eta';

const ROAD_FACTOR = 1.3;
const AVG_SPEED_KMH = 35 * 1.60934; // 35mph -> km/h
const STOP_DURATION_MIN = 5;

export function estimateRouteDuration(
  stops: Array<{ lat: number; lng: number }>
): { durationMinutes: number; distanceKm: number } {
  if (stops.length < 2) {
    return { durationMinutes: stops.length * STOP_DURATION_MIN, distanceKm: 0 };
  }

  let totalDistanceKm = 0;
  for (let i = 1; i < stops.length; i++) {
    totalDistanceKm += calculateHaversineDistance(
      stops[i - 1].lat, stops[i - 1].lng,
      stops[i].lat, stops[i].lng
    );
  }

  const roadDistanceKm = totalDistanceKm * ROAD_FACTOR;
  const drivingMinutes = (roadDistanceKm / AVG_SPEED_KMH) * 60;
  const stopMinutes = stops.length * STOP_DURATION_MIN;

  return {
    durationMinutes: Math.round(drivingMinutes + stopMinutes),
    distanceKm: Math.round(roadDistanceKm * 10) / 10,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CreateRouteModal (dialog) | Full-page builder at /admin/routes/new | Phase 80 (now) | More room for map + order list side-by-side |
| Google Maps (RouteMap.tsx) | Leaflet for builder, Google Maps kept for detail | Phase 80 (now) | No API key needed for builder map |
| Manual order selection | Cluster-based selection + individual toggle | Phase 80 (now) | Faster route creation for geographic groups |
| No reassignment | Action menu on stop cards | Phase 80 (now) | Orders movable between planned routes |

**Deprecated/outdated:**
- `CreateRouteModal` dialog: Still functional but replaced by full-page builder for new route creation. Keep modal for backward compatibility or remove -- user decision.

## Driver Ownership Enforcement Audit (ROUTE-07)

### Current State: Already Implemented via API Middleware + RLS

**API Middleware Layer (all 6 driver endpoints):**

| Endpoint | Ownership Check | Method |
|----------|----------------|--------|
| `GET /api/driver/routes/active` | `.eq("driver_id", driverId)` in query | Query filter |
| `GET /api/driver/routes/upcoming` | `.eq("driver_id", driverId)` in query | Query filter |
| `GET /api/driver/routes/history` | `.eq("driver_id", driverId)` in query | Query filter |
| `GET /api/driver/routes/[routeId]` | `route.driver_id !== driverId` -> 403 | Post-fetch check |
| `POST /api/driver/routes/[routeId]/start` | `route.driver_id !== driverId` -> 403 | Post-fetch check |
| `POST /api/driver/routes/[routeId]/complete` | `route.driver_id !== driverId` -> 403 | Post-fetch check |
| `PATCH /api/driver/routes/[routeId]/stops/[stopId]` | `route.driver_id !== driverId` -> 403 | Post-fetch check |
| `POST .../stops/[stopId]/exception` | `route.driver_id !== driverId` check | Post-fetch check |
| `POST .../stops/[stopId]/photo` | Route ownership verified via route query | Post-fetch check |

**RLS Policy Layer (defense in depth):**
- `routes_select`: `driver_id = public.get_my_driver_id() OR public.is_admin()`
- `routes_update`: Same USING + WITH CHECK
- `route_stops_select`: JOIN check on `routes.driver_id = get_my_driver_id()`
- `route_stops_update`: Same pattern

**Recommendation (Claude's Discretion):** Keep both layers. RLS is defense-in-depth; API middleware provides clear error messages (403 vs silent empty result). No additional work needed for ROUTE-07 beyond verification/documentation.

## Open Questions

1. **Leaflet marker icon bundling**
   - What we know: Leaflet default icons break in webpack/Next.js bundling
   - What's unclear: Whether to use custom circle div markers (simpler, matches existing RouteMap pattern) or fix default icon paths
   - Recommendation: Use custom `L.divIcon` with colored circles (matches existing Google Maps marker style) -- avoids icon bundling issues entirely

2. **Cluster label generation**
   - What we know: User wants labels like "North Side -- 4 orders"
   - What's unclear: Whether to use cardinal directions (N/S/E/W) relative to kitchen, or area names, or numbered groups
   - Recommendation: Use cardinal direction relative to KITCHEN_LOCATION (already defined at `34.0858, -117.8896`) + order count. Simple and intuitive.

3. **CreateRouteModal fate**
   - What we know: Full-page builder replaces modal for new route creation
   - What's unclear: Whether to keep the modal as fallback or remove it
   - Recommendation: Keep the modal -- it's used from the routes list page "Create Route" button. Redirect that button to `/admin/routes/new` instead. Modal code can be removed in a cleanup phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test -- --run` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-01 | Unassigned orders filtered correctly | unit | `pnpm test -- --run src/lib/utils/__tests__/clustering.test.ts` | Wave 0 |
| ROUTE-02 | Driver availability + capacity logic | unit | `pnpm test -- --run src/components/ui/admin/ops/__tests__/helpers.test.ts` | Existing |
| ROUTE-03 | Route creation validation (Saturday, min 1 order) | unit | `pnpm test -- --run src/lib/validations/__tests__/route.test.ts` | Wave 0 |
| ROUTE-04 | Geographic clustering produces correct groups | unit | `pnpm test -- --run src/lib/utils/__tests__/clustering.test.ts` | Wave 0 |
| ROUTE-05 | Duration estimation calculation | unit | `pnpm test -- --run src/lib/utils/__tests__/clustering.test.ts` | Wave 0 |
| ROUTE-06 | Reassignment validation (planned-only, same date) | unit | `pnpm test -- --run src/lib/validations/__tests__/route.test.ts` | Wave 0 |
| ROUTE-07 | Driver ownership enforcement | manual-only | Manual verification -- already implemented in all 6+ endpoints | N/A |

### Sampling Rate
- **Per task commit:** `pnpm test -- --run`
- **Per wave merge:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/utils/__tests__/clustering.test.ts` -- covers ROUTE-01, ROUTE-04, ROUTE-05 (clustering, duration estimation)
- [ ] `src/lib/validations/__tests__/route.test.ts` -- covers ROUTE-03, ROUTE-06 (route creation validation, reassignment schema)
- [ ] Framework install: `pnpm add leaflet react-leaflet @types/leaflet` -- new packages per user decision

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/app/api/admin/routes/route.ts` (POST handler with atomic creation + rollback)
- Codebase analysis: `src/app/api/driver/routes/*/route.ts` (all 6+ endpoints verified for ownership enforcement)
- Codebase analysis: `supabase/migrations/002_rls_policies.sql` (RLS policies for routes + route_stops verified)
- Codebase analysis: `src/lib/utils/eta.ts` (`calculateHaversineDistance` verified, tested)
- Codebase analysis: `src/lib/availability.ts` (`isDriverAvailable` verified)
- Codebase analysis: `src/components/ui/admin/routes/CreateRouteModal/` (extraction target, patterns confirmed)
- Codebase analysis: `src/types/driver.ts` (RouteStats, RoutesRow, RouteStopsRow, etc. all verified)

### Secondary (MEDIUM confidence)
- [react-leaflet installation docs](https://react-leaflet.js.org/docs/start-installation/) - v5.0.0 with leaflet 1.9.4
- [Next.js + Leaflet SSR pattern](https://dev.to/wellywahyudi/i-built-a-google-maps-clone-using-nextjs-16-leaflet-now-its-an-open-source-starter-kit-9n5) - dynamic import with ssr: false confirmed working in Next.js 16
- [Leaflet default icon fix](https://janmueller.dev/blog/react-leaflet/) - known webpack bundling issue, multiple solutions documented

### Tertiary (LOW confidence)
- Cluster radius recommendation (2km) -- based on typical urban delivery area, may need tuning for Covina, CA geography

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Leaflet/react-leaflet well-documented, user decision locked
- Architecture: HIGH -- All patterns derived from existing codebase analysis, minimal new infrastructure
- Pitfalls: HIGH -- Leaflet SSR issues well-known, clustering edge cases identified from codebase data model

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable domain, no fast-moving dependencies)
