# Phase 71: Driver Profile Setup - Research

**Researched:** 2026-02-18
**Domain:** Driver profile management, photo upload with Supabase Storage, profile completeness UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Profile Form Layout
- Vehicle types: 3 fixed options — Motorcycle, Car, Van
- License plate: No format validation — accept any text
- Name: Editable anytime (not locked after onboarding)
- Email: Displayed as read-only field (login identity)
- Driver status: Show active/deactivated as a read-only badge on profile page
- Save feedback: Toast notification ("Profile updated")
- Unsaved changes: Warn before navigating away with unsaved edits
- Form style: Glassmorphism card styling matching the rest of the app
- Member since: Show account creation date on profile page

#### Photo Upload
- Preview before upload: Show selected photo in preview area before confirming
- Circular crop tool: Let driver crop to a circle for avatar use
- Camera and gallery: Support both camera capture and gallery selection
- Upload progress: Show progress bar/spinner during upload
- Client-side compression: Compress before upload to save bandwidth on Myanmar mobile networks
- File types accepted: JPEG, PNG, WebP, HEIC (modern phone formats)
- No-photo placeholder: Initials avatar (driver's initials in colored circle)
- Old photos: Delete from Supabase Storage when replaced (no version history)

#### Completeness Indicator
- Type: Checklist with action labels ("Add your name", "Upload a photo", etc.)
- Items tracked: Name + Phone + Vehicle type + License plate + Photo (all 5)
- Placement: Top of driver dashboard
- Percentage: Show "3/5 complete" alongside checklist
- Deep linking: Clicking incomplete item navigates to profile page and highlights that field
- Done styling: Green checkmark AND strikethrough text for completed items
- Color progression: Card border/accent shifts from amber/yellow to green as items complete
- Card title: Plain descriptive ("Complete your profile")
- Completion celebration: Animated celebration (confetti/checkmark bounce) when 100%
- Duration: Celebration shows for 3 seconds, then card auto-hides
- Not dismissible: Checklist persists until all items are complete
- Not reappearing: Once hidden after completion, stays hidden

#### Profile Display & Identity
- Avatar locations: Both header area AND bottom nav tab on driver pages
- Dashboard greeting: Static "Hello, [Name]!" (not time-of-day aware)
- Header avatar tap: Opens dropdown menu (Claude determines menu items)
- Admin driver list: Show small avatar next to each driver's name
- Admin avatar click: Navigate to driver detail/edit page
- Admin edit: Admin can modify driver profile fields from admin panel
- Customer delivery tracking: Show driver name, photo, phone number, vehicle type, and license plate
- Customer no-photo fallback: Generic driver icon (not initials — different from driver-facing)
- Driver phone to customers: Visible phone number for direct contact

### Claude's Discretion
- Form page structure (dedicated page vs inline, field grouping)
- Profile page navigation access (bottom nav tab vs settings/menu icon)
- Save pattern (explicit Save button vs auto-save)
- Validation error display pattern (inline vs toast)
- Required vs optional field designation
- Phone number format enforcement
- Burmese text input support
- Profile page header design (profile card + form vs form only)
- Reset to onboarding values option
- Crop modal implementation (modal vs inline, pinch-to-zoom)
- Photo remove option (remove + replace vs replace only)
- Storage bucket access level (public vs signed URLs)
- Upload timing (on crop confirm vs with form save)
- File size limit
- Checklist real-time update behavior
- Dropdown menu items
- Driver-to-driver profile visibility
- Data model (existing drivers table vs separate profile table)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DPROF-01 | Driver can edit name, phone, vehicle type, and license plate from profile page | Existing `drivers` table has all columns; `profiles` table stores `full_name`. Admin edit API exists as template. |
| DPROF-02 | Driver can upload profile photo via Supabase Storage (driver-photos bucket) | Need new `driver-photos` bucket + RLS policies. Existing `storage.ts` utilities provide optimization patterns. |
| DPROF-03 | Profile completeness indicator on dashboard showing missing fields | Data comes from existing `/api/driver/me` endpoint. Needs UI component on DriverDashboard. |
</phase_requirements>

## Summary

Phase 71 builds a driver-facing profile management page and profile completeness indicator on the driver dashboard. The database schema already supports all required fields (`drivers.vehicle_type`, `drivers.license_plate`, `drivers.phone`, `drivers.profile_image_url`, `profiles.full_name`). No schema migrations are needed for profile data.

The photo upload feature requires a new Supabase Storage bucket (`driver-photos`) with driver-specific RLS policies (driver uploads/reads own photo, admin reads all). The existing `src/lib/supabase/storage.ts` provides a template for client-side image optimization, but needs extension for the driver-photos bucket and additional file formats (WebP, HEIC).

**Primary recommendation:** Build as 2 plans — (1) API + storage infrastructure + profile page, (2) completeness indicator + avatar integration across driver/admin/customer views.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Supabase JS | @supabase/supabase-js | Storage upload, DB queries | Already configured for storage operations |
| Zod | zod | Form validation | Existing validation schemas at `src/lib/validations/driver.ts` |
| React Hook Form / Controlled | N/A | Form state | Project uses controlled components with useState (see OnboardingForm.tsx) |
| Framer Motion | framer-motion (m) | Animations | Used in DriverDashboard for enter/stagger animations |
| Lucide React | lucide-react | Icons | Used throughout driver components |

### Supporting (New for This Phase)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| `react-easy-crop` | Circular crop tool for avatar | Lightweight crop library (~10KB gzipped). Supports touch/pinch zoom. |
| `browser-image-compression` | Client-side HEIC/WebP compression | Handles HEIC conversion + compression. Project already uses Canvas API for JPEG but HEIC needs a library. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-easy-crop | react-image-crop | react-easy-crop is simpler API, better mobile touch support, circular crop built-in |
| browser-image-compression | Manual Canvas API | Canvas can't handle HEIC; library handles all formats + orientation EXIF |
| Dedicated profile table | Existing drivers + profiles tables | No need for schema changes; data already lives in the right places |

## Architecture Patterns

### Existing Data Model (NO migration needed)
```
profiles table:
  id (UUID, FK to auth.users)
  full_name TEXT
  phone TEXT
  email TEXT
  role TEXT

drivers table:
  id (UUID, PK)
  user_id (UUID, FK to profiles)
  vehicle_type vehicle_type ENUM ('car','motorcycle','bicycle','van','truck')
  license_plate TEXT
  phone TEXT
  profile_image_url TEXT
  is_active BOOLEAN
  onboarding_completed_at TIMESTAMPTZ
  created_at TIMESTAMPTZ
```

**Note:** `full_name` lives in `profiles`, other driver fields in `drivers`. Profile update must write to both tables. The admin PATCH endpoint at `/api/admin/drivers/[id]` already handles this dual-table write pattern.

### Vehicle Type Discrepancy
The DB enum has 5 types: `car, motorcycle, bicycle, van, truck`. The CONTEXT.md decision locks to 3 UI options: Motorcycle, Car, Van. The Select component should offer only 3 options, but validation should accept the full enum for backward compatibility with existing drivers who may have `bicycle` or `truck`.

### New Storage Bucket (Migration needed)
```sql
-- driver-photos bucket: public read, driver-own write
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-photos', 'driver-photos', true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS: Driver can upload own photo (path: {driver_id}/{filename})
-- RLS: Driver can read own photo
-- RLS: Admin can read all
-- RLS: Driver can delete own photo (for replacement)
```

**Public bucket recommended:** Profile photos need to be visible in tracking view (customer-facing, possibly unauthenticated). Signed URLs add latency and complexity. Follow the menu-photos pattern (public read).

### File Organization
```
src/app/(driver)/driver/profile/
  page.tsx                    # Server component - data fetching
  ProfilePageClient.tsx       # Client component - form + photo upload

src/components/ui/driver/
  ProfileCompletenessCard.tsx  # Dashboard checklist component
  AvatarUpload.tsx             # Photo upload + crop + preview
  InitialsAvatar.tsx           # Fallback avatar with initials

src/app/api/driver/profile/
  route.ts                     # PATCH for profile update
  photo/
    route.ts                   # POST for photo upload, DELETE for removal
```

### Pattern 1: Driver Profile API (PATCH)
```typescript
// src/app/api/driver/profile/route.ts
// Uses requireDriver() auth guard (already exists)
// Updates both profiles.full_name AND drivers.vehicle_type/license_plate/phone
// Returns updated profile data
export async function PATCH(request: NextRequest) {
  const auth = await requireDriver();
  if (!auth.success) return NextResponse.json({error: auth.error}, {status: auth.status});

  // Validate with Zod schema
  // Update profiles table (full_name)
  // Update drivers table (vehicle_type, license_plate, phone)
  // Return merged result
}
```

### Pattern 2: Photo Upload Flow
```
1. User selects photo (camera or gallery via <input accept="image/*" capture>)
2. Client: compress with browser-image-compression (target: 200KB, max 1024px)
3. Client: open react-easy-crop modal for circular crop
4. Client: crop to canvas, export as JPEG blob
5. Client: upload to Supabase Storage driver-photos/{driver_id}/{timestamp}.jpg
6. Client: on success, PATCH /api/driver/profile with new profile_image_url
7. Server: delete old photo from storage if exists
8. Server: update drivers.profile_image_url
```

### Pattern 3: Completeness Calculation
```typescript
// Computed from driver/me data — no separate API needed
function getProfileCompleteness(driver: DriverData): {
  items: { key: string; label: string; complete: boolean }[];
  count: number;
  total: number;
} {
  return {
    items: [
      { key: 'name', label: 'Add your name', complete: !!driver.fullName },
      { key: 'phone', label: 'Add phone number', complete: !!driver.phone },
      { key: 'vehicleType', label: 'Set vehicle type', complete: !!driver.vehicleType },
      { key: 'licensePlate', label: 'Add license plate', complete: !!driver.licensePlate },
      { key: 'photo', label: 'Upload a photo', complete: !!driver.profileImageUrl },
    ],
    count: /* count complete */,
    total: 5,
  };
}
```

### Anti-Patterns to Avoid
- **Creating a separate profile_completeness table:** Completeness is derived from existing data, not stored separately. Computing it from existing fields prevents stale state.
- **Uploading raw photos without compression:** Myanmar mobile networks are slow. Always compress client-side first.
- **Using signed URLs for profile photos:** Adds complexity and latency. Public bucket is fine for non-sensitive avatar photos.
- **Separate `/api/driver/profile/name`, `/api/driver/profile/phone` endpoints:** One PATCH endpoint with partial updates is cleaner.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image cropping | Custom canvas crop with touch events | react-easy-crop | Touch/pinch zoom, circular crop, responsive, tested on mobile |
| HEIC support | Manual HEIC decoder | browser-image-compression | HEIC → JPEG conversion, EXIF orientation fix, size reduction |
| Unsaved changes warning | Custom beforeunload + router interception | Next.js `beforeunload` event + `useEffect` cleanup | Standard browser API; Next.js router events for SPA navigation |
| Toast notifications | Custom toast component | Existing project toast system | Already built — search codebase for toast usage pattern |

## Common Pitfalls

### Pitfall 1: HEIC File Type Detection
**What goes wrong:** HEIC files from iPhone report as `image/heic` or `image/heif` but some browsers report empty MIME type.
**Why it happens:** Browser MIME type detection is inconsistent for HEIC.
**How to avoid:** Check both MIME type AND file extension. Accept `image/heic`, `image/heif`, and `.heic`/`.heif` extensions.
**Warning signs:** Photo upload works on Android but fails on iPhone.

### Pitfall 2: Supabase Storage Path Conflicts
**What goes wrong:** Uploading with the same path doesn't overwrite by default (upsert: false).
**Why it happens:** Supabase Storage defaults to no-overwrite.
**How to avoid:** Use timestamped filenames (`{driver_id}/{timestamp}.jpg`) and delete old file explicitly.
**Warning signs:** Old photos not being replaced, storage filling up.

### Pitfall 3: Dual-Table Update Race Condition
**What goes wrong:** Profile update succeeds but driver update fails, leaving inconsistent state.
**Why it happens:** Two separate UPDATE queries without transaction.
**How to avoid:** Update driver table first (more likely to fail on enum validation), then profile. If profile update fails, it's less critical (name only). Log failures.
**Warning signs:** Name shows old value but vehicle type is updated.

### Pitfall 4: Mobile Camera Input
**What goes wrong:** `<input type="file" accept="image/*" capture="environment">` doesn't work consistently.
**Why it happens:** `capture` attribute behavior varies by browser/OS.
**How to avoid:** Use `accept="image/*"` without `capture` attribute — this gives the OS-level chooser that offers both camera and gallery on both iOS and Android.
**Warning signs:** Camera option missing on some devices.

### Pitfall 5: Canvas toBlob JPEG Quality
**What goes wrong:** Cropped image is larger than the original.
**Why it happens:** Canvas `toBlob('image/jpeg', quality)` with high quality on a large canvas produces big files.
**How to avoid:** Compress BEFORE cropping (reduce to max 1024px), then crop. Output quality at 0.85.
**Warning signs:** Uploaded photos are 2-5MB despite "compression."

### Pitfall 6: Completeness Card State After Navigation
**What goes wrong:** Driver fills out profile, returns to dashboard, checklist still shows old state.
**Why it happens:** Server component page cache (Next.js RSC caching).
**How to avoid:** Use `router.refresh()` when navigating back from profile page after save, or use `revalidatePath('/driver')` in the profile update API.
**Warning signs:** Checklist doesn't update until page is hard-refreshed.

## Code Examples

### Supabase Storage Upload (Existing Pattern)
```typescript
// From src/lib/supabase/storage.ts (existing)
const { data, error } = await supabase.storage
  .from('driver-photos')
  .upload(path, optimized, {
    contentType: 'image/jpeg',
    upsert: false,
  });

const { data: { publicUrl } } = supabase.storage
  .from('driver-photos')
  .getPublicUrl(path);
```

### Delete Old Photo Before Upload
```typescript
// Delete previous photo from storage
if (driver.profile_image_url) {
  const oldPath = extractStoragePath(driver.profile_image_url);
  if (oldPath) {
    await supabase.storage.from('driver-photos').remove([oldPath]);
  }
}
```

### Unsaved Changes Warning
```typescript
// Standard browser beforeunload
useEffect(() => {
  if (!hasUnsavedChanges) return;
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [hasUnsavedChanges]);
```

### Initials Avatar
```typescript
function getInitials(name: string | null): string {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string | null): string {
  if (!name) return 'bg-gray-400';
  const colors = ['bg-accent-teal', 'bg-secondary', 'bg-primary'];
  const hash = name.charCodeAt(0) % colors.length;
  return colors[hash];
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Server-side image processing | Client-side compression + Canvas crop | Reduces upload size, faster on slow networks |
| File type allowlist (JPEG/PNG only) | Accept HEIC/WebP + convert client-side | iPhone users can upload directly from camera |
| Separate profile API per field | Single PATCH with partial body | Fewer round trips, simpler client code |

## Open Questions

1. **HEIC browser support without library**
   - What we know: Modern Safari supports HEIC natively; Chrome/Firefox do not.
   - What's unclear: Whether `browser-image-compression` handles HEIC on all target browsers.
   - Recommendation: Test on iOS Safari (primary use case for HEIC). If library fails, fall back to asking user to convert.

2. **Storage old photo cleanup**
   - What we know: Decision says delete old photos when replaced.
   - What's unclear: Whether to do cleanup client-side or server-side.
   - Recommendation: Server-side in the profile photo API route — client can't be trusted to delete.

## Existing Codebase Assets

| Asset | Location | Reuse |
|-------|----------|-------|
| `requireDriver()` auth guard | `src/lib/auth/driver.ts` | Use for all driver API routes |
| `updateDriverSchema` validation | `src/lib/validations/driver.ts` | Extend for driver self-update |
| Storage upload utilities | `src/lib/supabase/storage.ts` | Adapt `optimizeImage()` for driver photos |
| OnboardingForm component | `src/components/ui/driver/OnboardingForm.tsx` | Reuse form field patterns, Select component usage |
| DriverDashboard component | `src/components/ui/driver/DriverDashboard/DriverDashboard.tsx` | Add completeness card to this component |
| DriverNav component | `src/components/ui/driver/DriverNav.tsx` | May need profile/avatar addition |
| Admin driver PATCH API | `src/app/api/admin/drivers/[id]/route.ts` | Template for dual-table update pattern |
| Driver `/me` API | `src/app/api/driver/me/route.ts` | Returns profile data for completeness calculation |
| TrackingDriverInfo type | `src/types/driver.ts` | Already includes vehicleType field for customer-facing |

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/app/api/driver/me/route.ts`, `src/app/api/driver/onboard/route.ts`, `src/lib/supabase/storage.ts`
- Codebase analysis: `supabase/migrations/000_initial_schema.sql` (drivers table schema), `004_storage.sql`, `007_menu_photos_storage.sql`
- Codebase analysis: `src/components/ui/driver/DriverDashboard/`, `src/components/ui/driver/DriverNav.tsx`

### Secondary (MEDIUM confidence)
- Supabase Storage API patterns from existing project usage
- react-easy-crop and browser-image-compression library capabilities

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all core tech already in project
- Architecture: HIGH — follows existing patterns with clear DB schema
- Pitfalls: HIGH — based on direct codebase analysis of existing storage/upload code

**Research date:** 2026-02-18
**Valid until:** 2026-03-18
