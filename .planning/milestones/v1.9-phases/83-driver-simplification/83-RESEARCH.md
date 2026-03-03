# Phase 83: Driver Simplification - Research

**Researched:** 2026-03-02
**Domain:** Driver app UX simplification, offline PWA, server-side preference persistence
**Confidence:** HIGH

## Summary

Phase 83 adds a "simple mode" to the driver app that strips the UI to bare essentials for non-technical family members. The existing driver codebase is well-structured with clear component boundaries: `DriverNav` (5-tab bottom nav), `DriverDashboard` (complex home with stats/badges/earnings), `StopDetailView`/`StopDetail` (full stop info), `DeliveryActions` (status transitions), and `OfflineBanner` (compact amber banner). All components use Framer Motion, design tokens, and 56px touch targets.

The implementation requires: (1) a DB migration adding `simple_mode` boolean to `drivers` table, (2) a React context provider (`SimpleModeProvider`) threaded through the driver layout, (3) conditional rendering in `DriverNav` (2 tabs vs 5), (4) a simplified home page and stop view, (5) a confirmation dialog on "Mark Delivered", (6) a full-screen offline overlay replacing the compact banner, and (7) a toggle on the profile page.

**Primary recommendation:** Use a context-based approach with `SimpleModeProvider` at the layout level. Create new simple-mode-specific components (`SimpleHome`, `SimpleStopView`, `SimpleOfflineOverlay`) rather than overloading existing components with conditional logic. The existing `useOfflineSync` hook already handles offline queueing -- extend its display layer only.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Both admin and driver can toggle simple mode (admin pre-sets for family drivers, driver can also change it themselves)
- On by default for new drivers -- reduces onboarding friction for non-technical users
- Toggle lives on the existing driver profile page (`/driver/profile`)
- Mode switch takes effect instantly -- UI morphs without page reload
- Preference stored server-side (new column on `drivers` table), not localStorage
- Bare minimum per stop: customer name, address (tap -> Maps), phone (tap -> call), and a big "Mark Delivered" button
- No order items, no delivery window, no timeline, no photo capture
- Single-stop focus: only the current (next undelivered) stop is shown -- no scrollable stop list
- After marking delivered: brief success animation ("Delivered!"), then auto-slide to next stop
- Progress counter visible: "3 of 7 done"
- Final stop: "All done!" celebration screen
- Confirmation dialog on "Mark Delivered": "Mark as delivered at [address]?" (DRV-02)
- Problem handling: single "Call for help" button that dials the operator/admin -- no exception forms or modals in simple mode
- Simple mode shows 2 bottom nav tabs: Home + Route
- Hides Earnings, Schedule, History tabs entirely
- Same bottom nav bar style (teal active indicator, same height), just fewer tabs
- Simplified Home: greeting ("Hello, [Name]!") + today's date + big "Start Today's Route" button (or "No route today" message)
- No stats, badges, streaks, earnings, profile completeness, onboarding walkthrough on simple home
- Avatar/icon in top-right header for accessing profile page (where mode toggle lives)
- Full-screen overlay when connectivity drops: "No internet -- don't worry! Your route is saved. Deliveries will sync when you're back online." Dismissible to continue working offline.
- Drivers can mark stops as delivered while offline -- queued locally, synced when back online
- Small "will sync" indicator on locally-marked deliveries
- Brief green toast on reconnect: "Back online -- syncing deliveries..." then "All synced!"
- Auto-cache route data with indicator: when driver opens route, all stop data cached in IndexedDB/service worker, brief "Route saved for offline use" message shown

### Claude's Discretion
- Exact animation for delivery celebration and auto-advance transition
- Loading skeleton design for simple mode views
- Error state handling for failed syncs
- Exact layout/sizing of the simplified stop card
- How to handle edge case: driver has no route assigned in simple mode

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DRV-01 | Simple mode toggle -- strip to essentials (name, address, phone, mark delivered) | SimpleModeProvider context + `SimpleStopView` component + `simple_mode` DB column |
| DRV-02 | Confirmation dialogs -- "Mark as delivered at [address]?" | Confirmation dialog component wrapping `DeliveryActions.updateStatus("delivered")` |
| DRV-03 | One-tap customer contact -- phone call / text button on each stop | Existing `handleCall` in `StopDetail` reused; add `tel:` link in `SimpleStopView` |
| DRV-04 | Offline instructions -- "Route saved locally. Will sync when reconnected." | `SimpleOfflineOverlay` full-screen component using existing `useOfflineSync` hook |
| DRV-05 | Hide by default -- route optimization, exception modals, earnings dashboard | `DriverNav` conditional tabs + `SimpleHome` replaces `DriverDashboard` |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- Zero New Packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | UI components | Project standard |
| Next.js 16 | 16.x | App Router, server components | Project framework |
| Framer Motion | latest | Animations (m, AnimatePresence) | Project animation library |
| Supabase | latest | DB + Auth + RLS | Project database |
| Zustand | latest | Client state (optional for simple mode) | Project state management |
| Tailwind CSS v4 | 4.x | Styling via design tokens | Project styling |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | latest | Icons (Phone, MapPin, Check, WifiOff) | All UI icons |
| @/lib/hooks/useOfflineSync | N/A | Offline queue + sync state machine | Offline delivery marking |
| @/lib/hooks/useAnimationPreference | N/A | Motion preference detection | All animated components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New SimpleModeProvider context | Zustand store | Context simpler -- mode doesn't change frequently, server-hydrated |
| Separate SimpleHome component | Conditional blocks in DriverDashboard | Separate component avoids 400-line rule violations and keeps DriverDashboard clean |

## Architecture Patterns

### Recommended Component Structure
```
src/components/ui/driver/
├── SimpleHome.tsx            # Simple mode home (greeting + start route)
├── SimpleStopView.tsx        # Single-stop focus with Mark Delivered
├── SimpleOfflineOverlay.tsx  # Full-screen offline overlay
├── SimpleModeToggle.tsx      # Toggle switch for profile page
├── SimpleModeProvider.tsx    # React context for simple_mode flag
├── DriverNav.tsx             # Modified: conditional tab rendering
├── DriverShell.tsx           # Modified: wraps SimpleModeProvider
├── OfflineBanner.tsx         # Unchanged (used in normal mode)
├── DeliveryActions.tsx       # Unchanged (reused by SimpleStopView)
├── StopDetail.tsx            # Unchanged (used in normal mode only)
└── ...existing files...
```

### Pattern 1: SimpleModeProvider Context
**What:** React context providing `isSimpleMode` boolean + `toggleSimpleMode()` to all driver components
**When to use:** Anywhere a component needs to know if simple mode is active
**Example:**
```typescript
// SimpleModeProvider.tsx
'use client';
import { createContext, useContext, useState, useCallback } from 'react';

interface SimpleModeContextType {
  isSimpleMode: boolean;
  toggleSimpleMode: () => Promise<void>;
}

const SimpleModeContext = createContext<SimpleModeContextType>({
  isSimpleMode: false,
  toggleSimpleMode: async () => {},
});

export function useSimpleMode() {
  return useContext(SimpleModeContext);
}

export function SimpleModeProvider({
  initialMode,
  driverId,
  children,
}: {
  initialMode: boolean;
  driverId: string;
  children: React.ReactNode;
}) {
  const [isSimpleMode, setIsSimpleMode] = useState(initialMode);

  const toggleSimpleMode = useCallback(async () => {
    const newMode = !isSimpleMode;
    setIsSimpleMode(newMode); // Optimistic
    await fetch('/api/driver/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simpleMode: newMode }),
    });
  }, [isSimpleMode, driverId]);

  return (
    <SimpleModeContext value={{ isSimpleMode, toggleSimpleMode }}>
      {children}
    </SimpleModeContext>
  );
}
```

### Pattern 2: Conditional Navigation
**What:** `DriverNav` filters `navItems` based on `isSimpleMode`
**When to use:** Layout-level conditional rendering
**Example:**
```typescript
const items = isSimpleMode
  ? navItems.filter(item => ['home', 'route'].includes(item.key))
  : navItems;
```

### Pattern 3: Single-Stop Focus View
**What:** Instead of showing all stops in a list, show only the current (next undelivered) stop
**When to use:** Simple mode route page
**Example:**
```typescript
const currentStop = stops.find(s => s.status === 'pending' || s.status === 'enroute');
// If no current stop, show "All done!" celebration
```

### Anti-Patterns to Avoid
- **Overloading existing components with `isSimpleMode` conditionals:** Creates maintenance burden. Prefer new focused components for simple mode.
- **localStorage for mode persistence:** Violates DRV requirement. Must be server-side column.
- **Duplicating offline logic:** Reuse `useOfflineSync` hook -- only change the UI layer (overlay vs banner).
- **Breaking existing driver UX:** Normal mode must remain 100% unchanged.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Offline queue | Custom IndexedDB wrapper | Existing `useOfflineSync` + `offline-store` | Already handles status updates, photos, locations with retry |
| Confirmation dialog | Custom modal | Project's existing dialog patterns (AnimatePresence + backdrop) | Consistent with ExceptionModal pattern |
| Navigation links (Maps) | Custom deep link logic | Existing `NavigationButton` pattern (`window.open` with Google Maps URL) | Already handles coordinates + address fallback |
| Phone calls | Custom tel: handler | Existing `handleCall` pattern from `StopDetail` (`window.location.href = 'tel:...'`) | Platform-native, works offline |

## Common Pitfalls

### Pitfall 1: Layout Hydration Mismatch
**What goes wrong:** Server renders simple mode but client hydrates with different state
**Why it happens:** `simple_mode` fetched server-side in layout but context initialized client-side
**How to avoid:** Pass `simple_mode` from server layout as prop to `SimpleModeProvider`. The layout already queries the driver record -- add `simple_mode` to the select query.
**Warning signs:** React hydration warnings in console

### Pitfall 2: Stale Mode After Toggle
**What goes wrong:** User toggles mode but UI doesn't update until page refresh
**Why it happens:** Server component data isn't re-fetched on client state change
**How to avoid:** Optimistic UI update via context state + `router.refresh()` after API call succeeds
**Warning signs:** Toggle flips but nav tabs don't change

### Pitfall 3: Missing Touch Targets on Simple Mode
**What goes wrong:** Buttons too small for non-technical users
**Why it happens:** Simple mode components don't follow existing 56px min-h convention
**How to avoid:** All interactive elements in simple mode: `min-h-[56px]` minimum, ideally larger (64-72px for primary CTA)
**Warning signs:** Users can't tap buttons reliably

### Pitfall 4: Offline Overlay Blocking Interaction
**What goes wrong:** Full-screen overlay prevents driver from marking deliveries offline
**Why it happens:** Overlay covers the entire viewport without dismiss
**How to avoid:** Make overlay dismissible (tap/button) -- context decision says "Dismissible to continue working offline"
**Warning signs:** Driver stuck on overlay screen with no way to proceed

### Pitfall 5: Admin Toggle Not Syncing
**What goes wrong:** Admin sets simple_mode for a driver but driver's session doesn't reflect it
**Why it happens:** Driver layout caches the driver record
**How to avoid:** Layout fetches `simple_mode` on every request (server component re-renders). The existing layout already does uncached queries.
**Warning signs:** Driver sees normal mode after admin set simple mode

## Code Examples

### Driver Layout Integration
```typescript
// layout.tsx - Add simple_mode to existing driver query
const { data: driver } = await supabase
  .from("drivers")
  .select("id, user_id, is_active, vehicle_type, rating_avg, deliveries_count, profile_image_url, simple_mode")
  .eq("user_id", user.id)
  .single();

// Wrap with SimpleModeProvider
<SimpleModeProvider initialMode={driver.simple_mode ?? true} driverId={driver.id}>
  <DriverShell>
    {/* ... */}
    <DriverNav avatarUrl={avatarUrl} driverName={driverName} />
  </DriverShell>
</SimpleModeProvider>
```

### Simple Stop View (Single-Stop Focus)
```typescript
// SimpleStopView.tsx - Essential info only
<div className="flex flex-col gap-4 px-4 py-6">
  {/* Progress */}
  <p className="text-center font-body text-lg font-semibold text-text-primary">
    {deliveredCount} of {totalCount} done
  </p>

  {/* Customer Name */}
  <h1 className="text-center font-display text-2xl font-bold text-text-primary">
    {customer.fullName}
  </h1>

  {/* Address - tap opens Maps */}
  <button onClick={openMaps} className="min-h-[56px] ...">
    <MapPin /> {address.line1}, {address.city}
  </button>

  {/* Phone - tap calls */}
  <a href={`tel:${customer.phone}`} className="min-h-[56px] ...">
    <Phone /> {customer.phone}
  </a>

  {/* Mark Delivered - large button */}
  <button onClick={handleMarkDelivered} className="min-h-[72px] bg-green ...">
    <Check /> Mark Delivered
  </button>

  {/* Call for Help */}
  <a href="tel:+1OPERATOR" className="min-h-[56px] border ...">
    <Phone /> Call for Help
  </a>
</div>
```

### Confirmation Dialog
```typescript
// Reusable confirm dialog pattern
<AnimatePresence>
  {showConfirm && (
    <m.div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
      <m.div className="rounded-card bg-surface-primary p-6 mx-4 shadow-lg">
        <p className="text-center font-body text-lg font-medium">
          Mark as delivered at {address.line1}?
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={cancel} className="flex-1 h-14 ...">Cancel</button>
          <button onClick={confirm} className="flex-1 h-14 bg-green ...">Yes, Delivered</button>
        </div>
      </m.div>
    </m.div>
  )}
</AnimatePresence>
```

### Migration
```sql
-- 031_driver_simple_mode.sql
ALTER TABLE drivers ADD COLUMN simple_mode boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN drivers.simple_mode IS 'Simple mode UI for non-technical drivers. Default true for new drivers.';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage preferences | Server-side DB column | This phase | Cross-device persistence |
| Compact offline banner | Full-screen overlay (simple mode) + banner (normal mode) | This phase | Non-technical users see clear instructions |
| Multi-stop list view | Single-stop focus | This phase | Eliminates decision paralysis |

## Open Questions

1. **Operator phone number for "Call for Help"**
   - What we know: Simple mode replaces exception modal with "Call for help" button
   - What's unclear: Where is the operator phone number stored? Hardcoded or in `app_settings`?
   - Recommendation: Add `operator_phone` to `app_settings` table, or hardcode as env var. For MVP, hardcode is acceptable.

2. **Route data pre-caching mechanism**
   - What we know: Context says "auto-cache route data in IndexedDB/service worker"
   - What's unclear: Whether to use Serwist runtime caching or manual IndexedDB storage
   - Recommendation: Use the existing `offline-store` service to cache route stop data when route page loads. The `useOfflineSync` hook's `queueStatusUpdate` already uses IndexedDB -- add a route data cache alongside it.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/components/ui/driver/` (all driver components)
- Codebase analysis: `src/app/(driver)/driver/layout.tsx` (driver layout with auth + driver query)
- Codebase analysis: `src/lib/hooks/useOfflineSync.ts` (offline sync hook)
- Codebase analysis: `src/types/driver.ts` (DriversRow interface)

### Secondary (MEDIUM confidence)
- Context decisions from discuss-phase session (83-CONTEXT.md)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, zero new dependencies
- Architecture: HIGH - follows established project patterns (context providers, server components, design tokens)
- Pitfalls: HIGH - identified from direct codebase analysis of existing components

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable -- internal app patterns)
