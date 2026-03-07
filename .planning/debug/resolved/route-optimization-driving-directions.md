---
status: awaiting_human_verify
trigger: "Routes should start from kitchen origin, use Google Maps Directions API for driving-based optimization and polylines"
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T00:00:00Z
---

## Current Focus

hypothesis: Route optimization uses straight-line distances; polylines are straight lines between stops; kitchen origin may not be wired as starting point
test: Read all route-related code to understand current implementation
expecting: Find haversine/straight-line calculations and straight-line polylines
next_action: Read route optimization logic, map components, and app settings

## Symptoms

expected: Routes start from kitchen origin, use driving distances for optimization, show driving polylines
actual: Routes likely use straight-line distances and straight-line polylines
errors: None - feature improvement
reproduction: Open route detail page, check map polylines and route starting point
started: Current state of route planning feature

## Eliminated

## Evidence

- timestamp: 2026-03-04T00:10:00Z
  checked: src/lib/services/route-optimization/optimizer.ts
  found: |
    - Google Routes API integration ALREADY EXISTS (optimizeWithGoogleRoutes)
    - Uses routes.googleapis.com/directions/v2:computeRoutes with optimizeWaypointOrder=true
    - KITCHEN_ORIGIN hardcoded in types.ts (34.0894, -117.8897, Covina CA)
    - Already requests routes.polyline.encodedPolyline in field mask
    - Fallback uses haversine nearest-neighbor (no polylines)
    - Returns optimizedPolyline from Google response
  implication: |
    The Google Routes API path already handles driving optimization and polylines.
    The fallback nearest-neighbor uses haversine (straight-line) but returns null polyline.
    When Google API key is set, the system ALREADY uses driving-based optimization.

- timestamp: 2026-03-04T00:11:00Z
  checked: src/components/ui/admin/routes/RouteMap.tsx
  found: |
    - RouteMap decodes encoded polyline via google.maps.geometry.encoding.decodePath
    - If polyline exists, renders actual decoded driving route
    - If no polyline (fallback case), NO polyline is shown at all
    - Does NOT show kitchen origin marker
    - Bounds fitting only considers stops, not origin
  implication: |
    When optimization runs with Google API, polylines ARE driving paths.
    When fallback is used, no polyline renders (not even straight lines).
    Missing: kitchen origin marker on the map.

- timestamp: 2026-03-04T00:12:00Z
  checked: .env.local
  found: Both GOOGLE_MAPS_API_KEY and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY are set
  implication: Google Routes API should work for optimization. The main gaps are visual/UX.

- timestamp: 2026-03-04T00:13:00Z
  checked: optimizeWithGoogleRoutes destination logic (optimizer.ts lines 108-124)
  found: |
    Destination is set to last stop in original (unoptimized) array when returnToOrigin=false.
    This is WRONG - it should be dynamic based on optimization, not fixed to stops[stops.length-1].
    The intermediates exclude the last stop (line 125: intermediates.slice(0, -1)).
    This means the last stop in the original order is always the destination, regardless of optimization.
  implication: |
    BUG: The destination is hardcoded to the last stop in the ORIGINAL order.
    After optimization, the actual last delivery stop may be different.
    Google Routes API needs all stops as intermediates and will optimize order.
    The destination should either be the last optimized stop or handled differently.

## Resolution

root_cause: |
  Three issues combined:
  1. Google Routes API destination was hardcoded to stops[stops.length-1] (last in ORIGINAL order),
     preventing true optimization since one stop was always fixed as the endpoint.
  2. RouteMap had no kitchen origin marker and didn't include origin in map bounds.
  3. When Google API polyline was unavailable (fallback), no polyline rendered at all.
  Per-leg polylines were not requested from the API (missing routes.legs.polyline.encodedPolyline
  in field mask), so even with Google API the polyline included the return-to-kitchen path.

fix: |
  1. optimizer.ts: Changed to round-trip strategy (kitchen→all stops as intermediates→kitchen)
     so Google freely optimizes ALL stop ordering. Strip return leg for distance/duration/polyline.
     Added routes.legs.polyline.encodedPolyline to field mask. Combined per-leg polylines
     (semicolon-separated) excluding return leg.
  2. RouteMap.tsx: Added kitchen origin marker (saffron "K" pin). Included origin in bounds.
     Added polyline decoding for semicolon-separated multi-segment format.
     Added fallback straight-line path (origin→stop1→stop2→...→stopN) when no API polyline.
  3. Updated tests to match new round-trip format with 3 legs for 2 stops.

verification: |
  - All 519 tests pass (26 files)
  - TypeScript: zero errors
  - ESLint: zero errors on changed files
  - Route optimization test specifically verifies: correct distance/duration (excludes return leg),
    correct polyline format (semicolon-separated per-leg), fallback behavior

files_changed:
  - src/lib/services/route-optimization/optimizer.ts
  - src/components/ui/admin/routes/RouteMap.tsx
  - src/lib/services/__tests__/route-optimization.test.ts
