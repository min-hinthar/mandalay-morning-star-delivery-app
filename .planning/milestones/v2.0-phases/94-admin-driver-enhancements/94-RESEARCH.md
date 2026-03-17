# Phase 94: Admin & Driver Enhancements - Research

**Researched:** 2026-03-03
**Domain:** Admin ops dashboard grouping, driver contact/navigation/photo enforcement
**Confidence:** HIGH

## Summary

Phase 94 enhances four existing features. All core infrastructure already exists: `groupByTimeWindow()` + `OpsOrderList` for ADMIN-01, `tel:` links + `NavigationButton` for DRV-01/02, and `PhotoCapture` + `useOfflineSync` + photo upload API for DRV-03. The work is primarily UI/UX enhancement and enforcement logic, not greenfield development.

The highest-risk item is DRV-03 (photo enforcement) because it changes the `DeliveryActions` flow to gate the "Mark Delivered" button behind a photo requirement, and must handle the offline case correctly (queued photo = captured). SimpleStopView also needs photo enforcement, which is the most significant new code. ADMIN-01 is largely cosmetic -- the grouping already works; enhancements are collapsible sections and per-window select-all. DRV-01 and DRV-02 are minimal changes to existing components.

**Primary recommendation:** Implement in 4 focused waves: ADMIN-01 enhancements (low risk), DRV-01+DRV-02 contact/nav (low risk), DRV-03 photo enforcement (medium risk), and cross-cutting tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- all decisions delegated to Claude's discretion.

### Claude's Discretion
All implementation decisions delegated to Claude. User trusts Claude to pick the best approach for each area based on existing code patterns, driver simplicity (non-technical family members), and the 50-150 orders/Saturday scale.

- ADMIN-01: groupByTimeWindow already exists; Claude decides on collapsible groups, per-window select-all, count badges, range-based merging
- DRV-01: tel: already exists; Claude decides on SMS button pattern, pre-fill template, button placement, no-phone fallback
- DRV-02: NavigationButton already opens Google Maps; Claude decides on maps app preference, button visibility, no-coordinates fallback
- DRV-03: PhotoCapture + offline queue exist; Claude decides on enforcement level, offline handling, post-capture display, admin photo viewing

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-01 | Orders grouped by delivery time window on ops dashboard | `groupByTimeWindow()` already wired in OpsCenter; OpsOrderList renders section headers with count badges. Enhance with collapsible groups and per-window select-all. |
| DRV-01 | Driver can contact customer with one tap (phone or text) | StopDetail has `handleCall()` with `tel:` link. Add SMS button via `sms:` URI. SimpleStopView already has phone tap. |
| DRV-02 | Driver can open turn-by-turn navigation to stop address | NavigationButton opens Google Maps. Enhance with address-only fallback when no coordinates. SimpleStopView already opens Maps on address tap. |
| DRV-03 | Driver must capture photo proof on delivery completion | PhotoCapture + upload API + `delivery_photo_url` column all exist. Change from optional to enforced: gate "Mark Delivered" behind hasPhoto state. Handle offline (queued = captured). |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React 19 | 19.x | UI framework | Installed |
| Next.js 16 | 16.x | App Router | Installed |
| Framer Motion | latest | m.div animations, AnimatePresence | Installed, used in all driver components |
| lucide-react | latest | Icons (Phone, MessageSquare, Navigation, Camera, etc.) | Installed |
| Supabase Storage | - | delivery-photos bucket with RLS | Configured in migration 004 |

### Supporting (no new deps needed)
| Library | Purpose | Already Used In |
|---------|---------|-----------------|
| `date-fns` | Time window label formatting | OpsOrderList `formatWindowLabel()` |
| `@radix-ui/react-collapsible` | Collapsible groups for ADMIN-01 | Available via shadcn/ui |
| Zod | Validation schemas | driver-api.ts |

**No new packages required.** All features build on existing dependencies.

## Architecture Patterns

### Existing File Structure (modify in place)
```
src/components/ui/admin/ops/
  helpers.ts              # groupByTimeWindow() -- enhance if needed
  OpsOrderList.tsx        # grouped rendering -- add collapsible, per-window select-all
  OpsOrderRow.tsx         # add photo indicator icon

src/components/ui/driver/
  StopDetail.tsx          # add SMS button alongside call button
  StopDetailView.tsx      # change photo from optional to enforced gate
  SimpleStopView.tsx      # add SMS button, photo enforcement before delivery
  NavigationButton.tsx    # add address-only fallback
  DeliveryActions.tsx     # accept hasPhoto prop, disable "Mark Delivered" when !hasPhoto
  PhotoCapture.tsx        # no changes needed (already complete)

src/app/api/driver/routes/[routeId]/stops/[stopId]/
  route.ts               # optionally validate photo exists before allowing delivered status
  photo/route.ts          # already complete
```

### Pattern 1: Photo Enforcement Gate
**What:** Disable "Mark Delivered" button until photo is captured. Photo state (`hasPhoto`) lives in StopDetailView and is passed to DeliveryActions.
**When to use:** DRV-03 enforcement in both normal and simple mode.
**Implementation:**

```typescript
// StopDetailView.tsx -- change the canTakePhoto guard and make photo required
const photoRequired = currentStatus === "arrived";
const canMarkDelivered = hasPhoto || currentStatus !== "arrived";

// DeliveryActions.tsx -- accept new prop
interface DeliveryActionsProps {
  // ... existing props
  photoRequired?: boolean; // When true, "Mark Delivered" shows disabled state with hint
}

// In the "arrived" case of renderPrimaryAction:
case "arrived":
  return (
    <m.button
      onClick={() => updateStatus("delivered")}
      disabled={disabled || isLoading || (photoRequired && !hasPhoto)}
      // ...
    >
      {photoRequired && !hasPhoto ? "Take Photo First" : "Mark Delivered"}
    </m.button>
  );
```

**Offline handling:** A photo queued to IndexedDB via `queuePhoto()` sets `hasPhoto = true`. The driver is not blocked by connectivity -- the photo blob exists locally, upload happens when online.

### Pattern 2: SMS Contact via URI Scheme
**What:** `sms:` URI opens native SMS app with pre-filled message.
**When to use:** DRV-01 alongside existing `tel:` call button.

```typescript
// Pre-fill template for non-technical drivers
const smsBody = encodeURIComponent(
  `Hi, this is your Morning Star delivery driver. I'm on my way to your address.`
);
const smsHref = `sms:${customer.phone}?body=${smsBody}`;
```

**Cross-platform note:** `sms:` URI is universally supported on iOS and Android. The `?body=` parameter works on both platforms (iOS uses `&body=` historically but modern iOS accepts `?body=` too).

### Pattern 3: Collapsible Time Window Groups
**What:** Each time window section in OpsOrderList becomes collapsible with Radix Collapsible or simple state toggle.
**When to use:** ADMIN-01 enhancement for 50-150 order volume.

```typescript
// Simple state approach (no new dependency):
const [collapsedWindows, setCollapsedWindows] = useState<Set<string>>(new Set());

const toggleWindow = (key: string) => {
  setCollapsedWindows(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
};
```

**Recommendation:** Use simple state toggle, not Radix Collapsible. The existing component already has the grouped rendering; adding collapse is a 15-line change. Radix would add unnecessary complexity for a simple show/hide.

### Pattern 4: Per-Window Select-All
**What:** Checkbox in each time window section header that selects/deselects all orders in that window.
**When to use:** ADMIN-01 for batch processing per delivery window.

```typescript
// In OpsOrderList, for each window group:
const windowOrderIds = orders.map(o => o.id);
const allWindowSelected = windowOrderIds.every(id => selectedIds.has(id));
const someWindowSelected = windowOrderIds.some(id => selectedIds.has(id)) && !allWindowSelected;

function handleWindowSelectAll(windowKey: string, orderIds: string[]) {
  onSelectionChange(prev => {
    const next = new Set(prev);
    if (allWindowSelected) {
      orderIds.forEach(id => next.delete(id));
    } else {
      orderIds.forEach(id => next.add(id));
    }
    return next;
  });
}
```

### Anti-Patterns to Avoid
- **Server-side photo enforcement only:** Do NOT only validate photo on the API. The driver would get an error after tapping "Mark Delivered" with no photo. Enforce in UI first, server as backup.
- **Blocking on upload completion:** Do NOT wait for photo upload to succeed before allowing delivery marking. The photo blob exists locally; upload can happen asynchronously.
- **Complex maps app detection:** Do NOT build platform detection for Apple Maps vs Google Maps vs Waze. Google Maps URL scheme works universally -- on iOS it opens in Google Maps app if installed, or in browser otherwise. Keep it simple for 3-6 family drivers.
- **Custom SMS sending service:** Do NOT build backend SMS. Use native `sms:` URI. The driver's phone handles it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo upload + storage | Custom upload endpoint | Existing `photo/route.ts` + Supabase Storage | Already built, has RLS, 5MB limit, type validation |
| Offline photo queue | Custom IndexedDB wrapper | Existing `useOfflineSync().queuePhoto()` | Handles offline detection, queue drain, retry |
| Maps navigation | In-app map rendering | `sms:` / Google Maps URL | Native apps are better for turn-by-turn |
| SMS sending | Twilio/backend SMS service | `sms:` URI scheme | Opens native SMS app, free, works offline |
| Collapsible UI | Radix Collapsible component | Simple `useState<Set<string>>` | 15 lines vs new import for show/hide toggle |

## Common Pitfalls

### Pitfall 1: SimpleStopView Photo Enforcement Missed
**What goes wrong:** DRV-03 enforcement is added to StopDetailView (normal mode) but not SimpleStopView (simple mode). Simple mode drivers skip photo entirely.
**Why it happens:** Two separate components render the delivery flow.
**How to avoid:** Both StopDetailView AND SimpleStopView must enforce photo before delivery. SimpleStopView needs PhotoCapture integration added.
**Warning signs:** Simple mode toggle test shows delivery works without photo.

### Pitfall 2: SMS URI Body Encoding
**What goes wrong:** Special characters in SMS body break the URI on some devices.
**Why it happens:** Missing `encodeURIComponent()` or using wrong separator.
**How to avoid:** Always `encodeURIComponent()` the body. Use `?body=` (works on both iOS and Android modern versions).
**Warning signs:** SMS opens with empty body or malformed text.

### Pitfall 3: Photo State Lost on Status Change
**What goes wrong:** `hasPhoto` state resets when `currentStatus` changes from `arrived` to something else via router.refresh().
**Why it happens:** StopDetailView re-renders with fresh props, losing local `hasPhoto` state.
**How to avoid:** Either (a) check `delivery_photo_url` from server data on mount, or (b) persist hasPhoto in a ref that survives re-renders.
**Warning signs:** Driver takes photo, page refreshes, photo button shows "Add Photo" again.

### Pitfall 4: NavigationButton Hidden When No Coordinates
**What goes wrong:** No navigation button shown when address has null lat/lng, even though Google Maps can navigate to a text address.
**Why it happens:** Current guard: `{address.latitude && address.longitude && <NavigationButton ... />}`.
**How to avoid:** Show NavigationButton with address-only mode when coordinates are null. Google Maps URL `?api=1&destination=<encoded address>` works without coordinates.
**Warning signs:** Stops without geocoded addresses have no navigation option.

### Pitfall 5: OpsOrderList File Size After Enhancements
**What goes wrong:** Adding collapsible groups, per-window select-all, and photo indicators pushes OpsOrderList past 400-line ESLint limit.
**Why it happens:** Current file is 232 lines; enhancements could add 80-120 lines.
**How to avoid:** If approaching 400 lines, extract `OpsWindowGroup` as a sub-component in its own file.
**Warning signs:** ESLint max-lines warning during build.

### Pitfall 6: DeliveryActions Offline Queue + Photo Enforcement Conflict
**What goes wrong:** Driver is offline, takes photo (queued), taps "Mark Delivered" -- status update also queues. But the queued status update might sync before the queued photo upload, causing server-side photo check to fail.
**Why it happens:** IndexedDB queue processes items in order, but status and photo are separate queues.
**How to avoid:** Do NOT add server-side photo enforcement on the status PATCH endpoint. Rely on client-side enforcement only. The photo will upload eventually; the `delivery_photo_url` column will be populated when it syncs.
**Warning signs:** Offline deliveries fail to sync status because photo hasn't uploaded yet.

## Code Examples

### DRV-01: SMS Button in StopDetail
```typescript
// In StopDetail.tsx, alongside the existing call button:
import { Phone, MessageSquare } from "lucide-react";

const smsBody = encodeURIComponent(
  "Hi, this is your Morning Star delivery driver. I'm on my way!"
);

// Replace single call button with call + SMS pair:
{customer.phone && (
  <m.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="flex gap-3"
  >
    <a
      href={`tel:${customer.phone}`}
      className={cn(
        "flex flex-1 min-h-[56px] items-center gap-3 rounded-card-sm bg-surface-primary p-4",
        "shadow-sm border border-border transition-all duration-fast",
        "hover:shadow-md active:scale-[0.99]"
      )}
      data-testid="call-button"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/10">
        <Phone className="h-5 w-5 text-green" />
      </div>
      <div className="text-left">
        <p className="font-body text-sm text-text-muted">Call</p>
        <p className="font-body font-medium text-text-primary">{customer.phone}</p>
      </div>
    </a>
    <a
      href={`sms:${customer.phone}?body=${smsBody}`}
      className={cn(
        "flex min-h-[56px] items-center justify-center rounded-card-sm bg-surface-primary px-5",
        "shadow-sm border border-border transition-all duration-fast",
        "hover:shadow-md active:scale-[0.99]"
      )}
      data-testid="sms-button"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <MessageSquare className="h-5 w-5 text-primary" />
      </div>
    </a>
  </m.div>
)}
```

### DRV-02: NavigationButton Address-Only Fallback
```typescript
// In NavigationButton.tsx, handle missing coordinates:
const handleNavigate = () => {
  if (testMode) {
    window.alert("Navigation not active in test mode");
    return;
  }
  // Prefer coordinates, fall back to text address
  const destination = (latitude && longitude)
    ? `${latitude},${longitude}`
    : address
      ? encodeURIComponent(address)
      : null;

  if (!destination) return;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  window.open(mapsUrl, "_blank", "noopener,noreferrer");
};
```

```typescript
// In StopDetail.tsx, remove coordinate guard -- always show nav button:
<NavigationButton
  latitude={address.latitude ?? 0}
  longitude={address.longitude ?? 0}
  address={fullAddress}
  className="w-full"
/>
// NavigationButton internally handles null coords with address fallback
```

### DRV-03: Photo Enforcement in DeliveryActions
```typescript
// DeliveryActions.tsx -- add photoRequired prop
interface DeliveryActionsProps {
  routeId: string;
  stopId: string;
  currentStatus: RouteStopStatus;
  onStatusChange?: (newStatus: RouteStopStatus) => void;
  onException?: () => void;
  disabled?: boolean;
  testMode?: boolean;
  photoRequired?: boolean;  // NEW: when true, disables Mark Delivered
  onPhotoPrompt?: () => void; // NEW: opens photo capture
}

// In arrived case:
case "arrived":
  return (
    <m.button
      onClick={() => {
        if (photoRequired) {
          onPhotoPrompt?.();
          return;
        }
        updateStatus("delivered");
      }}
      disabled={disabled || isLoading}
      className={cn(/* ... existing classes */)}
    >
      {renderButtonContent(
        <Check className="h-6 w-6" />,
        photoRequired ? "Take Photo to Deliver" : "Mark Delivered"
      )}
    </m.button>
  );
```

### ADMIN-01: Collapsible Window Groups in OpsOrderList
```typescript
// In OpsOrderList.tsx:
const [collapsedWindows, setCollapsedWindows] = useState<Set<string>>(new Set());

const toggleWindow = (key: string) => {
  setCollapsedWindows(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
};

// In the grouped order list section:
{[...groupedOrders.entries()].map(([windowKey, orders]) => {
  const isCollapsed = collapsedWindows.has(windowKey);
  const windowIds = orders.map(o => o.id);
  const allWindowSelected = windowIds.every(id => selectedIds.has(id));
  const someWindowSelected = windowIds.some(id => selectedIds.has(id)) && !allWindowSelected;

  return (
    <div key={windowKey} className="space-y-2">
      <button
        onClick={() => toggleWindow(windowKey)}
        className="flex w-full items-center gap-2 px-1 py-1 text-left"
      >
        <ChevronRight className={cn(
          "h-4 w-4 text-text-muted transition-transform",
          !isCollapsed && "rotate-90"
        )} />
        <Checkbox
          checked={allWindowSelected ? true : someWindowSelected ? "indeterminate" : false}
          onCheckedChange={() => handleWindowSelectAll(windowKey, windowIds)}
          onClick={(e) => e.stopPropagation()}
        />
        <h3 className="text-sm font-semibold text-text-secondary">
          {formatWindowLabel(windowKey)}
        </h3>
        <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-muted">
          {orders.length}
        </span>
      </button>
      {!isCollapsed && (
        <m.div variants={cardContainer} initial="hidden" animate="visible" className="space-y-2">
          {orders.map(order => (
            <OpsOrderRow key={order.id} order={order} isSelected={selectedIds.has(order.id)} onToggle={handleToggle} />
          ))}
        </m.div>
      )}
    </div>
  );
})}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Photo optional (button text: "Add Photo (Optional)") | Photo enforced (gate delivery behind photo capture) | Phase 94 | Drivers cannot skip proof-of-delivery |
| Call-only contact | Call + SMS dual contact | Phase 94 | Faster customer communication for non-technical drivers |
| Flat order list with headers | Collapsible grouped list with per-window select-all | Phase 94 | Better batch processing at 50-150 order scale |

## Open Questions

1. **Server-side photo validation on status update?**
   - What we know: Client-side enforcement is sufficient for MVP. Server-side would prevent API-level bypass.
   - What's unclear: Whether offline queue ordering could cause sync failures if server enforces.
   - Recommendation: Client-side only for Phase 94. Do NOT add server-side enforcement to PATCH endpoint to avoid offline sync conflicts. The `delivery_photo_url` column being populated is the source of truth for admin/dispute workflows.

2. **SimpleStopView photo capture UX**
   - What we know: SimpleStopView currently has no PhotoCapture integration. It needs one for DRV-03.
   - What's unclear: How to keep the simple mode genuinely simple while adding a required step.
   - Recommendation: Show a large "Take Photo" button that replaces the "Mark Delivered" button when arrived and no photo. After photo, "Mark Delivered" button appears. Single-step flow, no modal.

3. **Admin delivery photo viewing**
   - What we know: OrderDetailDrawer currently has no photo section. Photos stored at `delivery-photos/{routeId}/{orderId}.jpg`.
   - What's unclear: Whether to add photo viewing in this phase or defer.
   - Recommendation: Add a small photo thumbnail in OrderDetailDrawer when `delivery_photo_url` is available. Minimal effort, high value for dispute resolution. Requires fetching `delivery_photo_url` in the admin order query.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- all findings verified by reading source files directly
  - `src/components/ui/admin/ops/helpers.ts` -- groupByTimeWindow implementation
  - `src/components/ui/admin/ops/OpsOrderList.tsx` -- current grouped rendering (232 lines)
  - `src/components/ui/admin/ops/OpsCenter.tsx` -- wiring of groupByTimeWindow
  - `src/components/ui/driver/StopDetail.tsx` -- tel: link, NavigationButton usage
  - `src/components/ui/driver/StopDetailView.tsx` -- PhotoCapture integration, hasPhoto state
  - `src/components/ui/driver/SimpleStopView.tsx` -- simple mode delivery flow
  - `src/components/ui/driver/NavigationButton.tsx` -- Google Maps URL scheme
  - `src/components/ui/driver/PhotoCapture.tsx` -- camera capture, compression
  - `src/components/ui/driver/DeliveryActions.tsx` -- status transition buttons
  - `src/lib/hooks/useOfflineSync.ts` -- queuePhoto, queueStatusUpdate
  - `src/app/api/driver/routes/[routeId]/stops/[stopId]/photo/route.ts` -- upload API
  - `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` -- status PATCH API
  - `supabase/migrations/000_initial_schema.sql` -- route_stops.delivery_photo_url column
  - `supabase/migrations/004_storage.sql` -- delivery-photos bucket + RLS policies

### Secondary (MEDIUM confidence)
- `sms:` URI scheme -- widely documented, works on iOS 8+ and Android 4+, pre-fill body via `?body=`
- Google Maps URL scheme -- `https://www.google.com/maps/dir/?api=1&destination=` works universally, opens native app on mobile

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all features use existing installed dependencies
- Architecture: HIGH -- all patterns verified against existing source code
- Pitfalls: HIGH -- derived from actual code analysis (state management, offline sync, file size limits)

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable -- no external dependencies or API changes)
