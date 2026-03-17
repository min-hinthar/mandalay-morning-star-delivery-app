# Phase 98: Delivery Photo Signed URL Fix - Research

**Researched:** 2026-03-04
**Domain:** Supabase Storage signed URLs, API route data transformation
**Confidence:** HIGH

## Summary

The `delivery-photos` Supabase Storage bucket is private, but the photo upload endpoint (`POST /api/driver/routes/[routeId]/stops/[stopId]/photo/route.ts`) stores a `getPublicUrl()` URL in `route_stops.delivery_photo_url` (line 115-120). Public URLs on private buckets return 403. The fix is straightforward: store the storage path instead of the full URL, then generate time-limited signed URLs on-demand in the API routes that serve data to admin and customer clients.

Three API routes serve `delivery_photo_url` to clients. Two UI components display the photo but need no changes -- they consume the URL from API responses. The Supabase JS SDK v2.x `createSignedUrl(path, expiresIn)` method is the standard approach. A shared utility in `src/lib/supabase/storage.ts` avoids duplication. Backward compatibility for existing rows with full public URLs requires path extraction before signing.

**Primary recommendation:** Store storage path (not URL) in DB; generate signed URLs server-side in each API route via a shared `getDeliveryPhotoSignedUrl()` helper.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- all decisions delegated to Claude's discretion.

### Claude's Discretion
- **URL storage strategy:** Store the storage *path* (not full URL) in `delivery_photo_url` column. Generate time-limited signed URLs on-demand in the API routes that serve photo data.
- **Signed URL expiry:** 1 hour
- **Scope of fix:** Both admin (`RouteStopCard`) and customer (`DeliveredScreen`) views
- **Upload endpoint change:** Store `{routeId}/{orderId}.{ext}` path instead of `getPublicUrl()` result. Return a signed URL in response for immediate use.
- **API read endpoints:** Both tracking API and admin routes API generate signed URLs from stored paths before returning to clients.
- **Backward compatibility:** Handle existing rows with full public URLs -- detect URL vs path format and generate signed URL from extracted path.
- **Shared utility:** Create `getDeliveryPhotoSignedUrl(path)` helper in `src/lib/supabase/storage.ts` for reuse.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DRV-03 | Driver must capture photo proof on delivery completion | Integration fix -- DRV-03 already implemented in Phase 94. This phase fixes the broken admin/customer viewing of those photos by replacing `getPublicUrl` with signed URLs on the private `delivery-photos` bucket. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.90.1 | Storage SDK -- `createSignedUrl` | Already installed; native signed URL support |
| @supabase/ssr | ^0.8.0 | Server-side Supabase client | Already installed; used by all API routes |

### Supporting
No additional libraries needed. All functionality is built into the existing Supabase SDK.

## Architecture Patterns

### Files to Modify

```
src/
  lib/supabase/
    storage.ts                      # ADD: getDeliveryPhotoSignedUrl() helper
  app/api/
    driver/routes/[routeId]/stops/[stopId]/photo/
      route.ts                      # FIX: store path, return signed URL
    admin/routes/[id]/
      route.ts                      # FIX: generate signed URLs for stops
    tracking/[orderId]/
      route.ts                      # FIX: generate signed URL for routeStop
    driver/routes/active/
      route.ts                      # FIX: generate signed URLs for stops
    driver/routes/[routeId]/
      route.ts                      # FIX: generate signed URLs for stops
```

### Pattern 1: Shared Signed URL Helper
**What:** Server-side utility that takes a storage path (or legacy full URL) and returns a signed URL.
**When to use:** Every API route that returns `delivery_photo_url` data.

```typescript
// src/lib/supabase/storage.ts
import { createServiceClient } from "./server";

const DELIVERY_PHOTOS_BUCKET = "delivery-photos";
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * Generate a signed URL for a delivery photo.
 * Handles both new paths ("routeId/orderId.jpg") and legacy full URLs.
 * Returns null if path is null/empty.
 */
export async function getDeliveryPhotoSignedUrl(
  pathOrUrl: string | null
): Promise<string | null> {
  if (!pathOrUrl) return null;

  // Extract path from legacy full URL if needed
  const path = extractDeliveryPhotoPath(pathOrUrl);
  if (!path) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(DELIVERY_PHOTOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error) {
    // Log but don't throw -- photo is non-critical
    console.error("Failed to create signed URL for delivery photo:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Extract storage path from a value that may be a path or full public URL.
 * Full URL format: https://<project>.supabase.co/storage/v1/object/public/delivery-photos/<path>
 * Path format: routeId/orderId.ext
 */
function extractDeliveryPhotoPath(pathOrUrl: string): string | null {
  // Already a path (no protocol)
  if (!pathOrUrl.startsWith("http")) return pathOrUrl;

  // Extract from full public URL
  const match = pathOrUrl.match(/delivery-photos\/(.+)$/);
  return match ? match[1] : null;
}
```

### Pattern 2: Upload Endpoint Fix
**What:** Store path instead of public URL after upload; return signed URL in response.

```typescript
// In photo upload route.ts, replace:
//   const { data: urlData } = supabase.storage.from("delivery-photos").getPublicUrl(filename);
//   const photoUrl = urlData.publicUrl;
//   await supabase.from("route_stops").update({ delivery_photo_url: photoUrl }).eq("id", stopId);
// With:
//   await supabase.from("route_stops").update({ delivery_photo_url: filename }).eq("id", stopId);
//   const signedUrl = await getDeliveryPhotoSignedUrl(filename);
```

### Pattern 3: API Response Transformation
**What:** Transform stored paths to signed URLs before returning JSON to client.

```typescript
// In admin routes GET, after building the stops array:
// For each stop with a delivery_photo_url, generate a signed URL
const stopsWithSignedUrls = await Promise.all(
  route.route_stops.map(async (stop) => ({
    ...stop,
    delivery_photo_url: await getDeliveryPhotoSignedUrl(stop.delivery_photo_url),
  }))
);
```

### Anti-Patterns to Avoid
- **Storing signed URLs in DB:** Signed URLs expire -- never persist them. Store paths only.
- **Generating signed URLs client-side:** Requires exposing service role key or anon key with storage permissions. Generate server-side only.
- **Using `createClient()` (anon) for signed URLs on private bucket:** The anon key may not have permission to sign URLs on private buckets. Use `createServiceClient()` (service role).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL signing | Custom token-based URL scheme | `supabase.storage.createSignedUrl()` | Handles token generation, expiry, path encoding |
| Path extraction | Complex URL parsing | Simple regex on known URL format | Supabase URL format is stable; `delivery-photos/(.+)$` is sufficient |
| Batch signed URLs | Sequential signing in loop | `createSignedUrls()` (plural) for multiple files | Single API call; but for 5-15 stops per route, `Promise.all` with individual calls is fine |

## Common Pitfalls

### Pitfall 1: Next.js Image Component with Signed URLs
**What goes wrong:** `RouteStopCard` uses `next/image` with `src={stop.deliveryPhotoUrl}`. Signed URLs include query parameters (`?token=...`) which may not match `remotePatterns`.
**Why it happens:** The existing `next.config.ts` allows `pathname: "/storage/v1/object/public/**"` but signed URLs use `/storage/v1/object/sign/**`.
**How to avoid:** The second remote pattern (`hostname: "ukuzkhuppqwtrdkjqrkv.supabase.co", pathname: "/storage/**"`) already covers signed URLs. Verify this pattern matches.
**Warning signs:** 403 or "Invalid src" errors from next/image in admin panel.

### Pitfall 2: Realtime Subscription Passes Raw DB Value
**What goes wrong:** `useTrackingSubscription` receives `delivery_photo_url` directly from Supabase Realtime (line 119-124 of the hook). After the fix, this will be a storage path, not a URL.
**Why it happens:** Realtime pushes raw column values from `route_stops` table updates.
**How to avoid:** The tracking API GET endpoint generates signed URLs. The realtime hook updates `deliveryPhotoUrl` state with the raw path, but the UI re-fetches via the tracking API on significant state changes. For the photo specifically: the `DeliveredScreen` renders when `orderStatus === "delivered"`, and at that point `routeStop.deliveryPhotoUrl` comes from the initial API fetch or a `refresh()` call -- both go through the tracking API which generates signed URLs. The realtime update for `delivery_photo_url` is a path, but the page re-renders with the API-fetched signed URL. This is acceptable because photo viewing only matters once delivery is complete.
**Warning signs:** Broken image on `DeliveredScreen` if it renders using a raw path before the API re-fetch completes.

### Pitfall 3: Service Role Client Import in Client-Side File
**What goes wrong:** `src/lib/supabase/storage.ts` is currently a client-side file (uses `createClient` from `./client`). Adding `createServiceClient` (which uses `process.env.SUPABASE_SERVICE_ROLE_KEY`) will fail client-side.
**How to avoid:** The signed URL helper must be server-only. Options:
1. Add the helper to `storage.ts` but guard with `"use server"` or keep it in a separate server-only module.
2. Better: Create the helper as a standalone function that accepts a Supabase client as parameter, so callers pass their own client.
3. Best for this project: Add it to `storage.ts` but use a separate export section clearly marked server-only. Since the helper is only called from API routes (server-side), tree-shaking will prevent client bundle inclusion.

**Recommended approach:** Add the helper to `storage.ts` with a server-side import of `createServiceClient`. Since all consumers are API routes, this won't leak to client bundles. But to be safe, consider creating a separate `src/lib/supabase/delivery-photos.ts` file for server-only delivery photo utilities.

### Pitfall 4: Driver Routes Also Serve delivery_photo_url
**What goes wrong:** Fixing only admin and tracking endpoints but missing driver endpoints.
**Why it happens:** The CONTEXT.md lists 3 integration points but the codebase has 5 endpoints that serve `delivery_photo_url`:
1. `POST .../photo/route.ts` (upload -- fix storage)
2. `GET /api/admin/routes/[id]` (admin detail)
3. `GET /api/tracking/[orderId]` (customer tracking)
4. `GET /api/driver/routes/active` (driver active route)
5. `GET /api/driver/routes/[routeId]` (driver route detail)
**How to avoid:** Fix all 5 endpoints. Endpoints 4 and 5 also pass `deliveryPhotoUrl` in their response.

### Pitfall 5: Backward Compatibility Detection
**What goes wrong:** New path format (`routeId/orderId.jpg`) vs old URL format (`https://...supabase.co/storage/v1/object/public/delivery-photos/routeId/orderId.jpg`).
**How to avoid:** Check if value starts with `http` -- if yes, extract path with regex. If no, treat as path. The `extractDeliveryPhotoPath` function handles both cases.

## Code Examples

### Upload Endpoint Fix (photo/route.ts lines 114-125)

Current (broken):
```typescript
// Get public URL
const { data: urlData } = supabase.storage.from("delivery-photos").getPublicUrl(filename);
const photoUrl = urlData.publicUrl;

// Update stop with photo URL
await supabase.from("route_stops").update({ delivery_photo_url: photoUrl }).eq("id", stopId);

return NextResponse.json({ success: true, photoUrl });
```

Fixed:
```typescript
import { getDeliveryPhotoSignedUrl } from "@/lib/supabase/delivery-photos";

// Store path (not URL) in DB
await supabase.from("route_stops").update({ delivery_photo_url: filename }).eq("id", stopId);

// Generate signed URL for immediate response
const signedUrl = await getDeliveryPhotoSignedUrl(filename);

return NextResponse.json({ success: true, photoUrl: signedUrl });
```

### Admin Route GET Transformation (admin/routes/[id]/route.ts line 170)

Current (passes raw DB value):
```typescript
deliveryPhotoUrl: stop.delivery_photo_url,
```

Fixed (generates signed URL):
```typescript
deliveryPhotoUrl: await getDeliveryPhotoSignedUrl(stop.delivery_photo_url),
```

### Tracking API Transformation (tracking/[orderId]/route.ts line 235)

Current:
```typescript
deliveryPhotoUrl: routeStopData.delivery_photo_url,
```

Fixed:
```typescript
deliveryPhotoUrl: await getDeliveryPhotoSignedUrl(routeStopData.delivery_photo_url),
```

### Supabase createSignedUrl API (verified)

```typescript
// Source: Supabase JS SDK v2.x
const { data, error } = await supabase.storage
  .from("bucket-name")
  .createSignedUrl("path/to/file.jpg", 3600); // expiresIn in seconds

// data.signedUrl contains the time-limited URL
// error is non-null if file doesn't exist or permissions fail
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getPublicUrl()` on private bucket | `createSignedUrl()` with expiry | Always been the correct approach | Public URLs on private buckets return 403 |
| Store full URL in DB | Store storage path in DB | Best practice | Paths are stable; URLs can change if project migrates |

**Current bug:** The upload endpoint was written with `getPublicUrl()` assuming the bucket would be public. The bucket is private (correct for delivery photos -- they contain customer addresses), so the URL returns 403 to anyone without a valid session.

## Open Questions

1. **Realtime delivery_photo_url for in-flight renders**
   - What we know: Realtime pushes raw `delivery_photo_url` from DB. After fix, this will be a path, not a URL.
   - What's unclear: Whether `DeliveredScreen` ever renders using the realtime-pushed path before the API re-fetch provides the signed URL.
   - Recommendation: Acceptable risk. The `DeliveredScreen` only renders when `orderStatus === "delivered"`, and the initial data comes from the tracking API (which generates signed URLs). The realtime update for `delivery_photo_url` would only trigger a re-render if someone is watching the tracking page at the exact moment the driver uploads the photo. Even then, the `<img>` would briefly show a broken image until the next API poll or page refresh. This is a minor edge case.

2. **next/image vs img tag**
   - What we know: `RouteStopCard` uses `next/image` (optimized). `DeliveredScreen` uses raw `<img>` tag.
   - What's unclear: Whether signed URLs work correctly with `next/image`'s optimization proxy.
   - Recommendation: The `next.config.ts` has a remote pattern `hostname: "ukuzkhuppqwtrdkjqrkv.supabase.co", pathname: "/storage/**"` which covers signed URL paths. Should work. If not, the fallback is changing `next/image` to `<img>` for delivery photos (matches `DeliveredScreen` pattern).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRV-03-fix | Signed URL helper extracts path from URL and path formats | unit | `pnpm test -- src/lib/supabase/__tests__/delivery-photos.test.ts -x` | No -- Wave 0 |
| DRV-03-fix | Signed URL helper returns null for null input | unit | Same file | No -- Wave 0 |
| DRV-03-fix | Legacy URL backward compatibility (full URL -> path extraction) | unit | Same file | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/supabase/__tests__/delivery-photos.test.ts` -- covers path extraction and null handling (SDK call must be mocked)
- [ ] `src/lib/supabase/delivery-photos.ts` -- new server-only module for the helper

## Sources

### Primary (HIGH confidence)
- Codebase analysis -- direct reading of all 5 affected API routes, 2 UI components, types, and existing storage utilities
- [Supabase JS SDK createSignedUrl docs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl) -- API signature verified
- [Supabase Storage Buckets docs](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- private bucket behavior confirmed

### Secondary (MEDIUM confidence)
- next/image remote patterns compatibility with signed URLs -- inferred from existing `pathname: "/storage/**"` pattern covering signed paths

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Supabase SDK already installed, `createSignedUrl` is documented API
- Architecture: HIGH -- all affected files read and analyzed; pattern is simple data transformation
- Pitfalls: HIGH -- identified 5 endpoints (not 3), realtime edge case, next/image compatibility, server-only import concern

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- Supabase Storage API is mature)
