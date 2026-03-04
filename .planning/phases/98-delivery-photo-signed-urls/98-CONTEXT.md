# Phase 98: Delivery Photo Signed URL Fix - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix admin and customer viewing of driver delivery proof photos. The `delivery-photos` Supabase Storage bucket is private, but the upload endpoint stores a `getPublicUrl()` URL in `route_stops.delivery_photo_url` — this returns 403. Replace with signed URLs so photos render correctly.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User delegated all implementation decisions. Claude will use these approaches:

- **URL storage strategy:** Store the storage *path* (not full URL) in `delivery_photo_url` column. Generate time-limited signed URLs on-demand in the API routes that serve photo data. This avoids storing expiring URLs in the DB.
- **Signed URL expiry:** 1 hour — sufficient for an admin session or customer viewing. Pages rarely sit open longer without refresh.
- **Scope of fix:** Both admin (`RouteStopCard`) and customer (`DeliveredScreen`) views — both consume the same `delivery_photo_url` field and both are broken.
- **Upload endpoint change:** `POST /api/driver/routes/[routeId]/stops/[stopId]/photo` — store the storage path (`{routeId}/{orderId}.{ext}`) instead of `getPublicUrl()` result. Return a signed URL in the response for immediate use.
- **API read endpoints:** Both tracking API (`/api/tracking/[orderId]`) and admin routes API (`/api/admin/routes/[id]`) will generate signed URLs from stored paths before returning to clients.
- **Backward compatibility:** Handle existing rows that already have full public URLs stored — detect URL vs path format and generate signed URL from extracted path.
- **Shared utility:** Create a `getDeliveryPhotoSignedUrl(path)` helper in `src/lib/supabase/storage.ts` for reuse across endpoints.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — straightforward infrastructure fix with clear success criteria from the roadmap.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/storage.ts`: Existing storage utilities (menu photos). Add delivery photo signed URL helper here.
- `src/lib/supabase/driver-storage.ts`: Driver profile photo utilities (uses `driver-photos` bucket with `getPublicUrl` — that bucket may be public).

### Established Patterns
- Service role client used for admin operations (Phase 95 pattern) — signed URL generation needs service role or appropriate permissions.
- `createSignedUrl` is Supabase Storage SDK method — returns `{ data: { signedUrl }, error }`.

### Integration Points
- **Upload:** `src/app/api/driver/routes/[routeId]/stops/[stopId]/photo/route.ts` — change storage after upload
- **Admin read:** `src/app/api/admin/routes/[id]/route.ts` — generate signed URL when returning stop data
- **Customer read:** `src/app/api/tracking/[orderId]/route.ts` — generate signed URL for `deliveryPhotoUrl`
- **Admin display:** `src/components/ui/admin/routes/RouteStopCard.tsx` — no change needed (consumes URL)
- **Customer display:** `src/components/ui/orders/tracking/DeliveredScreen.tsx` — no change needed (consumes URL)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 98-delivery-photo-signed-urls*
*Context gathered: 2026-03-04*
