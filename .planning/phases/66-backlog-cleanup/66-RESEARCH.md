# Phase 66: Backlog Cleanup - Research

**Researched:** 2026-02-15
**Domain:** Cart editing, order tracking, component refactoring, dead code audit
**Confidence:** HIGH

## Summary

Phase 66 addresses five independent workstreams: (1) cart modifier editing via ItemDetailSheet, (2) driver tracking bug fix + full tracking page enhancement, (3) UnifiedMenuItemCard refactor under 400 lines, (4) dead Edge Function removal, and (5) comprehensive dead code audit.

The cart editing workstream is the most architecturally contained -- ItemDetailSheet already exists with modifier selection, quantity, and notes. The gap is an "edit mode" that pre-populates existing cart item state and calls an `updateItem` method instead of `addItem`. The cart store (`cart-store.ts`) currently has no `updateItem` method; one must be added.

The tracking page workstream is the largest scope expansion. The existing tracking infrastructure (API route, Supabase Realtime hook, DeliveryMap, StatusTimeline) is already functional but has a known `route_id` extraction bug and lacks several CONTEXT.md features: horizontal stepper, star rating, celebration animation, push notifications, share button, delivery notes editing, and stale/offline driver states. Many of these are new components, but the architecture (split view with map top / info bottom, Supabase Realtime subscriptions, Google Maps with `@react-google-maps/api`) is established.

The UnifiedMenuItemCard is currently 540 lines -- 140 over the 400-line limit. It's already been partially split (CardContent, CardImage, GlassOverlay, AddButton, DietaryBadges exist as sub-modules). The main file contains event handlers, tilt logic, and orchestration that need further extraction.

The Edge Function removal and dead code audit are straightforward. The `send-order-confirmation` Edge Function is fully superseded by the in-app email system (`src/lib/email/` + `@react-email/components` + Resend). Knip is already installed and configured.

**Primary recommendation:** Execute as 5 independent plans (one per workstream), parallelizable with no cross-dependencies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Cart Modifier Editing
- Open ItemDetailSheet for editing existing cart items (same sheet as adding)
- Pre-populated with current modifier selections and quantity
- Full edit: modifiers AND quantity changeable in the same sheet
- CTA button says "Update Cart" (distinct from "Add to Cart")
- Edit trigger: always-visible pencil icon on each cart item row
- Only items with modifier options show the edit icon; quantity-only items use cart page controls
- Each cart entry is independent -- editing one doesn't affect duplicates of the same menu item
- "Cart updated" toast confirmation after saving
- Confirm discard if user changed something and tries to close without saving
- If menu item is unavailable (sold out), sheet opens in "unavailable" state -- user can only remove, not update

#### Driver Tracking -- Bug Fix + Full Enhancement
- Fix route_id extraction from routeStop data (original bug)
- Google Maps integration with custom pin icons (restaurant, vehicle, destination)
- Route line between driver and destination, dynamic update as driver progresses (completed portion changes color)
- Driver marker smooth-slides from old to new position
- Auto-fit zoom showing both driver and destination pins
- Free pan/zoom + re-center button for user exploration
- Split view layout: map top 50%, status/info bottom 50%
- Driver name + profile photo shown once assigned/en route
- Call driver button (tap to call)
- Full item list visible in info section (not collapsed)

#### Tracking -- Status Display
- Horizontal stepper at top: Confirmed -> Preparing -> Out for Delivery -> Delivered (active step highlighted)
- Vertical timeline below stepper with timestamps and detailed history
- Status stepper dots fill with animation, timeline entries slide in
- aria-live region for screen reader announcements on status changes
- Browser tab title updates with live status: "Preparing... | Morning Star" -> "Out for Delivery | Morning Star"

#### Tracking -- ETA & Location
- ETA display (format at Claude's discretion based on available data)
- Off-route handling: subtle ETA recalculation only (no explicit "off-route" alert to customer)
- Stale location (>2 min no update): faded driver pin + "Last updated X min ago" timestamp
- Offline: show last cached driver position with "Last updated" label

#### Tracking -- Pre-Delivery & Post-Delivery States
- Pre-delivery (preparing): map shows restaurant pin, switches to driver tracking once en route
- Delivered: auto-transition to "Delivered!" confirmation screen with celebration animation (confetti/animated checkmark)
- Star rating (1-5) on delivered screen -- optional, quick tap
- Rating stored in orders table, visible to both driver and admin
- Post-delivery: tracking page accessible from order history as read-only view (delivered status, map with final route, rating if given)

#### Tracking -- Cancellation
- Order cancelled during transit: cancelled overlay on map (stays visible) with reason and next steps

#### Tracking -- Notifications
- Push notification + in-app banner when driver is nearby (~2 min away)
- Push notification tone: warm and friendly ("Your delicious meal is on its way!")
- Sound + haptic feedback for status transitions

#### Tracking -- Sharing & Access
- Share button on tracking page (native share sheet or copy link)
- Shared link viewable by any authenticated user (doesn't have to be order owner)
- One tracking page per order (multiple active orders each have their own page)

#### Tracking -- Delivery Notes
- Delivery instructions visible and editable on tracking page
- Editable at any time before order is marked delivered

#### Tracking -- Loading & Errors
- Map placeholder (grey rectangle) + skeleton lines for status info as loading state
- Map load failure: error banner with "Retry" button, status info still visible below

#### Tracking -- Testing
- Supabase test seeds for manual QA with real real-time subscriptions

#### UnifiedMenuItemCard Refactor
- Split into sub-modules to get under 400 lines
- Barrel export pattern (consuming files' imports don't change)

#### Dead Code & Dependency Audit
- Remove dead `send-order-confirmation` Edge Function
- Full audit: unused exports/functions, deprecated patterns, unused npm deps, unused CSS classes
- Scan for legacy API routes with zero frontend references
- Console.log cleanup (Claude distinguishes debug from intentional)
- CSS dead code scan (Claude determines safe removals)
- Unused TypeScript types removal (Claude's judgment)
- Unused npm dependencies: Claude decides production vs dev (judgment-based)
- Environment variables: flag unused ones for user review (don't delete)

### Claude's Discretion

#### Cart
- Zero-quantity behavior (remove item or minimum 1)
- Live price update vs price on save
- Animation style for sheet open/close
- Sub-component test coverage strategy

#### Tracking
- ETA format (countdown vs time window)
- Update frequency (WebSocket vs polling)
- URL structure (/orders/[id]/tracking vs /tracking/[id])
- Tablet/landscape responsive layout
- Google Maps dark mode variant
- Google Maps JS lazy loading strategy
- Performance budget handling for Maps bundle

#### Card Refactor
- Split strategy (by visual sections vs by responsibility)
- Sub-component naming convention
- Reusability of extracted components
- Whether to simplify public props API
- Whether to apply minor visual polish during refactor
- Test coverage for extracted sub-components
- Import path approach (barrel vs deep imports)

#### Dead Code
- Confidence threshold for removal vs flagging
- Which console statements are intentional vs debug
- Which CSS tokens are safe to remove
- Which TypeScript types serve as documentation vs are truly dead
- Legacy API route removal criteria

### Deferred Ideas (OUT OF SCOPE)
- Language preference selector (SETT-04) -- removed from Phase 66 scope entirely, for a future milestone
- Apple Sign-in integration -- previously deferred from Phase 62
</user_constraints>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@react-google-maps/api` | ^2.20.8 | Google Maps React wrapper | In use for DeliveryMap |
| `zustand` | ^5.0.10 | Cart store (IndexedDB persistence) | In use |
| `framer-motion` | ^12.26.1 | Animations, transitions, gestures | In use |
| `@supabase/supabase-js` | ^2.90.1 | Realtime subscriptions, DB queries | In use |
| `knip` | ^5.82.1 | Dead code detection (already installed) | Configured in `knip.json` |
| `lucide-react` | ^0.562.0 | Icons (Edit3, Star, etc.) | In use |
| `vaul` | ^1.1.2 | Drawer component | In use |
| `@radix-ui/react-dialog` | ^1.1.15 | Modal component | In use |
| `@radix-ui/react-toast` | ^1.2.6 | Toast notifications | In use |

### Supporting (May Need Adding)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `web-push` | - | Push notifications | If implementing Service Worker push -- **investigate if Serwist supports this** |
| None new needed | - | - | All tracking features achievable with existing stack |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@react-google-maps/api` | `@vis.gl/react-google-maps` (visgl) | Newer, maintained by vis.gl team, better AdvancedMarker support. BUT: project already uses the older lib with working DeliveryMap. Migration risk > benefit for this phase. |
| Custom dead code scanning | `knip` | Knip already installed + configured. Use it. |
| Manual push notifications | Firebase Cloud Messaging | Serwist (service worker) already in project. Can receive push via standard Web Push API without Firebase dependency. |

## Architecture Patterns

### Recommended Project Structure Additions
```
src/
  components/ui/
    cart/
      CartPage/
        CartPageContent.tsx     # Wire edit handler -> ItemDetailSheet
    menu/
      ItemDetailSheet.tsx       # Add edit mode (pre-populated state, "Update Cart" CTA)
      UnifiedMenuItemCard/
        UnifiedMenuItemCard.tsx  # Extract event handlers + tilt logic
        EventHandlers.ts        # NEW: extracted event handler hooks
        TiltEffect.ts           # NEW: extracted 3D tilt logic
    orders/
      tracking/
        TrackingPageClient.tsx   # Major enhancement
        StatusStepper.tsx        # NEW: horizontal stepper
        DeliveredScreen.tsx      # NEW: celebration + rating
        StarRating.tsx           # NEW: 1-5 tap rating
        ShareButton.tsx          # NEW: native share / copy link
        DeliveryNotesEditor.tsx  # NEW: editable notes
        NearbyBanner.tsx         # NEW: in-app proximity alert
        DeliveryMap/
          DeliveryMap.tsx        # Enhance: custom pins, route line, smooth animation
          RoutePolyline.tsx      # NEW: colored route line with progress
          CustomMarkers.tsx      # NEW: branded pin components
  lib/
    stores/
      cart-store.ts             # Add updateItem method
    hooks/
      useTrackingSubscription.ts  # Fix route_id extraction
      useDriverRating.ts        # NEW: submit rating to driver_ratings table
    utils/
      eta.ts                    # Existing, may need stale-detection util
  types/
    cart.ts                     # Add updateItem to CartStore interface
    tracking.ts                 # Extend for rating, share, notes
```

### Pattern 1: Cart Edit Mode via ItemDetailSheet
**What:** Reuse ItemDetailSheet with an `editingCartItem` prop to pre-populate state
**When to use:** When editing an existing cart item's modifiers/quantity/notes

The current ItemDetailSheet accepts a `MenuItem` and calls `onAddToCart`. For edit mode:
1. Accept optional `editingCartItem?: CartItem` prop
2. When `editingCartItem` is provided, pre-populate `selectedModifiers`, `quantity`, `notes` from it
3. Change CTA from "Add to Cart - $X.XX" to "Update Cart - $X.XX"
4. On save: call new `cart.updateItem(cartItemId, { modifiers, quantity, notes })` instead of `addItem`
5. Track `isDirty` state (any change from initial values) for discard confirmation

**Key code locations:**
- `src/components/ui/menu/ItemDetailSheet.tsx` (line 107: useEffect reset -- must check for editingCartItem)
- `src/lib/stores/cart-store.ts` (needs new `updateItem` method)
- `src/types/cart.ts` (needs `updateItem` in CartStore interface)
- `src/components/ui/cart/CartItem/CartItem.tsx` (line 169-173: edit button already exists with `onEdit` prop)
- `src/components/ui/cart/CartPage/CartPageContent.tsx` (line 129-132: `handleEditItem` is a TODO stub)

**CartStore.updateItem signature:**
```typescript
updateItem: (cartItemId: string, updates: {
  modifiers: SelectedModifier[];
  quantity: number;
  notes: string;
  basePriceCents: number; // recalculated from base + modifier deltas
}) => void;
```

### Pattern 2: Route ID Extraction Fix
**What:** The tracking subscription currently passes `routeId: undefined` because route_id isn't extracted from the routeStop data
**When to use:** Immediate bug fix

Current code in `TrackingPageClient.tsx` (line 52-53):
```typescript
const subscription = useTrackingSubscription({
  orderId,
  routeId: undefined, // We need to track route_id separately
```

The routeStop data is fetched by the tracking API and contains `routes.id` in the response. The fix:
1. The API already returns `routeStop` which is derived from `routeStopData.routes.id`
2. But `TrackingData` type doesn't expose `routeId` at the top level
3. Add `routeId: string | null` to `TrackingData` type
4. Set it from `routeStopData?.routes?.id ?? null` in the API route
5. Pass `initialData.routeId` to `useTrackingSubscription`
6. The subscription will then set up the location channel correctly

### Pattern 3: Smooth Driver Marker Animation
**What:** Animate driver marker from old to new position instead of jumping
**When to use:** On each location update from Realtime

The current DeliveryMap recreates the marker on every `driverLocation` change (line 114-132 in DeliveryMap.tsx). For smooth sliding:
1. Store previous position in ref
2. On new position, use `requestAnimationFrame` loop to interpolate lat/lng
3. Update marker position incrementally over ~1 second
4. The `@react-google-maps/api` AdvancedMarkerElement supports `position` updates without recreation

### Pattern 4: UnifiedMenuItemCard Extraction Strategy
**What:** Extract event handlers and tilt logic into separate files
**When to use:** The main file is 540 lines; needs to drop to <400

Current breakdown:
- `UnifiedMenuItemCard.tsx`: 540 lines (OVER LIMIT)
- `CardContent.tsx`: 89 lines
- `CardImage.tsx`: 138 lines
- `GlassOverlay.tsx`: 82 lines
- `AddButton.tsx`: 292 lines
- `DietaryBadges.tsx`: 181 lines
- `use-card-sound.ts`: 184 lines
- `index.ts`: 15 lines

The main file contains:
- Types + variant config (lines 1-110): ~110 lines
- Tilt configuration + constants (lines 91-109): ~20 lines
- Component body with hooks/state (lines 126-175): ~50 lines
- Event handlers (lines 210-406): ~196 lines
- Render JSX (lines 408-538): ~130 lines

**Recommended extraction (by responsibility):**
1. **`useTiltEffect.ts`** (~80 lines): Extract mouseX/mouseY motion values, rotateX/rotateY springs, TILT_MAX_ANGLE constant, tiltStyle computation, and mouse/touch handlers for tilt
2. **`useCardInteractions.ts`** (~80 lines): Extract handleCardClick, handleAdd, handleIncrement, handleDecrement, handleFavoriteToggle, long-press logic
3. Keep types + variant config + render JSX in main file (~300 lines remaining)

Both extracted files need `'use client'` since they use hooks. Barrel `index.ts` must re-export all.

### Pattern 5: Dead Code Audit with Knip
**What:** Run knip to detect unused exports, dependencies, and files
**When to use:** Comprehensive audit step

Existing `knip.json`:
```json
{
  "entry": ["src/app/**/*.{ts,tsx}", "src/components/**/index.ts", "src/lib/**/index.ts"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/*.stories.{ts,tsx}"],
  "ignoreDependencies": ["@types/*"]
}
```

Run workflow:
1. `pnpm knip` -- get initial report
2. Review each category: unused files, unused exports, unused dependencies
3. Cross-reference with CSS dead code (knip doesn't scan CSS)
4. Manual `console.log` scan: distinguish `console.debug("[cart]"` (intentional debug) from bare `console.log` (accidental)
5. For environment variables: grep `.env*` files, cross-reference with `process.env.` usage in code

### Anti-Patterns to Avoid
- **Cart edit creating new items instead of updating:** The edit flow must call `updateItem`, not `removeItem + addItem` (which changes the cartItemId and loses position in list)
- **Recreating Google Maps markers on every render:** Store marker refs and update position instead of destroy/recreate (performance + flickering)
- **Breaking barrel exports during refactor:** Every moved export must remain accessible from `index.ts`
- **Removing `console.debug` statements meant for cart deduplication debugging:** The `console.debug("[cart]"` pattern is intentional
- **Force-deleting env vars during dead code audit:** Flag them for user review only

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead code detection | Manual file scanning | `knip` (already installed) | Handles dependency graph analysis, transitive usage |
| Map marker animation | Custom requestAnimationFrame loop | Google Maps `position` property updates + CSS transitions on marker content | Browser-native performance |
| Push notifications | Custom WebSocket push | Web Push API via Serwist service worker | Standards-based, works when app is closed |
| Star rating input | Custom star component from scratch | Simple array of 5 star icons with touch/click handlers + framer-motion scale | Not worth a library for 5 icons |
| Discard confirmation | Custom modal | Existing `AlertDialog` (Radix) | Already in codebase |
| Toast notifications | Custom toast system | Existing `toast()` from `useToastV8` | Already integrated |

**Key insight:** The project already has all the UI primitives needed (Modal, Drawer, AlertDialog, Toast, Confetti/SuccessAnimation). No new UI libraries required.

## Common Pitfalls

### Pitfall 1: Cart State Hydration Race in Edit Flow
**What goes wrong:** ItemDetailSheet opens with stale/empty cart item data because IndexedDB hydration hasn't completed
**Why it happens:** Cart uses IndexedDB persistence via `idb-keyval`. The `_hasHydrated` flag exists for this reason.
**How to avoid:** Gate edit functionality on `_hasHydrated === true`. The CartPageContent already checks hydration (line 224).
**Warning signs:** Empty modifier selections when opening edit sheet

### Pitfall 2: Route ID Null After Order Confirmed But Before Route Assigned
**What goes wrong:** Tracking page tries to subscribe to location updates but route doesn't exist yet
**Why it happens:** Orders are confirmed before being assigned to a route. The `routeStop` will be null.
**How to avoid:** Already handled: `useTrackingSubscription` accepts `routeId?: string | null` and only sets up location channel when routeId is truthy (line 244-266 in hook).
**Warning signs:** "routeId is undefined" in console when order status is `confirmed`

### Pitfall 3: Google Maps API Key Bundle Exposure
**What goes wrong:** Maps API key leaked in client bundle, abused by bots
**Why it happens:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is inherently public
**How to avoid:** Already mitigated via Google Cloud Console key restrictions (HTTP referrer restrictions). Not a Phase 66 concern -- just don't change the existing pattern.
**Warning signs:** Unexpected Maps API billing spikes

### Pitfall 4: UnifiedMenuItemCard Refactor Breaking Consumers
**What goes wrong:** Moving code to new files changes import paths, breaks consuming components
**Why it happens:** Consumers import directly from the file instead of barrel
**How to avoid:** Verify all consumers import from the barrel (`index.ts`). Current consumers:
- `src/components/ui/menu/MenuContentClient.tsx`
- `src/components/ui/homepage/HomepageMenuSection.tsx`
- Any Storybook stories
**Warning signs:** Build failures after refactor

### Pitfall 5: Knip False Positives from Dynamic Imports
**What goes wrong:** Knip reports files/exports as unused that are actually loaded via `dynamic()` or `import()`
**Why it happens:** Knip's static analysis can miss dynamic import patterns
**How to avoid:** Review each knip finding manually before deletion. Check for: `dynamic(() => import(...))`, `importWithRetry()`, `React.lazy()`. The project uses `importWithRetry` pattern extensively in `LazyMaps.tsx`.
**Warning signs:** Runtime errors after removing "unused" exports

### Pitfall 6: Mobile Crash from New setTimeout/setInterval in Tracking
**What goes wrong:** New tracking features add timers (ETA countdown, stale detection) without cleanup
**Why it happens:** This codebase has a documented history of mobile crashes from uncleared timers (see ERROR_HISTORY.md)
**How to avoid:** Use `useSafeTimeout` and `useSafeInterval` from `src/lib/hooks/useSafeEffects.ts`. These hooks auto-cleanup on unmount.
**Warning signs:** App crash on navigating away from tracking page

### Pitfall 7: Driver Rating Table Missing from Database Types
**What goes wrong:** TypeScript errors when inserting into `driver_ratings`
**Why it happens:** The `driver_ratings` table exists in `000_initial_schema.sql` but is NOT in `src/types/database.ts`
**How to avoid:** Add `DriverRatingsRow`, `DriverRatingsInsert` types to `database.ts` and add to `Database` type
**Warning signs:** Type errors on `supabase.from("driver_ratings")`

### Pitfall 8: Push Notification Permission Denied Silently
**What goes wrong:** Notification.requestPermission() returns "denied" but app doesn't inform user
**Why it happens:** Users dismiss permission prompt; subsequent calls return "denied" without showing prompt again
**How to avoid:** Check `Notification.permission` before requesting. If "denied", show in-app message explaining how to enable in browser settings. Gracefully degrade: in-app banner always works even without push permission.
**Warning signs:** Users report not receiving notifications

## Code Examples

### Cart Store `updateItem` Method
```typescript
// Source: Derived from existing addItem pattern in cart-store.ts
updateItem: (cartItemId, updates) => {
  set((state) => ({
    items: state.items.map((item) =>
      item.cartItemId === cartItemId
        ? {
            ...item,
            modifiers: updates.modifiers,
            quantity: Math.min(Math.max(1, updates.quantity), MAX_ITEM_QUANTITY),
            notes: updates.notes.trim(),
            basePriceCents: updates.basePriceCents,
          }
        : item
    ),
  }));
},
```

### ItemDetailSheet Edit Mode Detection
```typescript
// Source: Pattern derived from existing ItemDetailSheet.tsx
interface ItemDetailSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: MenuItem, modifiers: SelectedModifier[], quantity: number, notes: string) => void;
  // NEW: Edit mode
  editingCartItem?: CartItem;
  onUpdateCart?: (cartItemId: string, modifiers: SelectedModifier[], quantity: number, notes: string) => void;
  className?: string;
}

// In useEffect reset (line 107):
useEffect(() => {
  if (!item || !isOpen) return;
  if (editingCartItem) {
    // Pre-populate from existing cart item
    setSelectedModifiers(editingCartItem.modifiers);
    setQuantity(editingCartItem.quantity);
    setNotes(editingCartItem.notes);
  } else {
    // Reset for new item
    setSelectedModifiers([]);
    setQuantity(1);
    setNotes("");
  }
}, [item, isOpen, editingCartItem]);
```

### Route ID Fix in TrackingPageClient
```typescript
// Source: TrackingPageClient.tsx line 52-53 fix
const subscription = useTrackingSubscription({
  orderId,
  routeId: initialData.routeId ?? undefined, // NEW: pass routeId from API response
  enabled: true,
  // ... existing callbacks
});
```

### Star Rating Component Pattern
```typescript
// Source: Standard pattern using existing project primitives
function StarRating({ value, onChange, disabled }: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Delivery rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <m.button
          key={star}
          type="button"
          role="radio"
          aria-checked={star <= value}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.2 }}
          className={cn(
            "w-10 h-10 flex items-center justify-center transition-colors",
            star <= value ? "text-saffron-500" : "text-charcoal-300"
          )}
        >
          <Star className="w-6 h-6" fill={star <= value ? "currentColor" : "none"} />
        </m.button>
      ))}
    </div>
  );
}
```

### Horizontal Status Stepper Pattern
```typescript
// Source: Derived from existing StatusTimeline pattern
// STATUS_ORDER: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"]
function StatusStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between px-4" role="progressbar"
         aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={5}>
      {STATUS_ORDER.filter(s => s !== "pending").map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <React.Fragment key={status}>
            {index > 0 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2",
                isCompleted ? "bg-jade" : "bg-charcoal-200"
              )} />
            )}
            <m.div
              animate={isCurrent ? { scale: [1, 1.2, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 2 }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isCompleted && "bg-jade text-white",
                isCurrent && "bg-primary text-white ring-4 ring-primary/20",
                !isCompleted && !isCurrent && "bg-charcoal-100 text-charcoal-400"
              )}
            >
              <StatusIcon status={status} />
            </m.div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase Edge Functions for email | In-app email via Resend + React Email | Phase 54 (email system) | Edge Function is dead code |
| `@react-google-maps/api` (JustFly) | `@vis.gl/react-google-maps` (vis.gl) | 2024 | Newer lib has better AdvancedMarker. BUT: project already invested in older lib. Not worth migrating this phase. |
| Manual timer cleanup | `useSafeTimeout`/`useSafeInterval` hooks | Phase 35 | Use these for all new timers |
| `localStorage` cart | IndexedDB via `idb-keyval` | Previous phase | Cart already migrated |

**Deprecated/outdated:**
- `supabase/functions/send-order-confirmation/`: Superseded by `src/lib/email/` + Resend API. Safe to delete entirely.
- `supabase/functions/send-delivery-notification/`: May also be dead -- verify before this phase or flag for review.

## Discretion Recommendations

### Cart Discretion
| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Zero-quantity behavior | Remove item when quantity reaches 0 | Consistent with existing `handleDecrement` in CartItem.tsx (line 90-96) which removes at qty=1 |
| Live price update vs on save | Live price update in sheet | ItemDetailSheet already computes `priceCalc` on every modifier/quantity change (line 118-121) |
| Animation style | Reuse existing Drawer/Modal animation | ItemDetailSheet already handles mobile=Drawer, desktop=Modal |
| Test coverage | Unit test `updateItem` store method + integration test for edit flow | Store method is pure logic; edit flow needs component test |

### Tracking Discretion
| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| ETA format | Countdown ("~12 min") when <30 min, time window ("4:15-4:30 PM") when >30 min | Countdown creates urgency for imminent delivery; time window for distant ETAs |
| Update frequency | Keep Supabase Realtime (WebSocket) as primary, 30s polling as fallback | Already implemented in `useTrackingSubscription.ts` |
| URL structure | Keep `/orders/[id]/tracking` | Already exists at `src/app/(customer)/orders/[id]/tracking/page.tsx` |
| Tablet/landscape | Map takes full width, info scrolls below on landscape | Simple CSS media query, no structural change |
| Google Maps dark mode | Use existing warm map styles, no dark variant | Brand aesthetic is warm/light; dark maps conflict |
| Maps lazy loading | Keep existing `dynamic()` + `importWithRetry` pattern | Already in `LazyMaps.tsx` with 15s timeout |
| Performance budget | Google Maps JS is ~200KB gzipped; already lazy-loaded; no additional budget concern | Dynamic import isolates from main bundle |

### Card Refactor Discretion
| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Split strategy | By responsibility (hooks vs render) | Event handlers = `useCardInteractions` hook, tilt = `useTiltEffect` hook. Keeps main file as orchestrator. |
| Sub-component naming | `useTiltEffect.ts`, `useCardInteractions.ts` (camelCase hooks) | Follows project convention (`use-card-sound.ts` exists) |
| Reusability | Not a goal -- these are internal to UnifiedMenuItemCard | Extracting for line count, not reuse |
| Props API simplification | No change this phase | Avoid scope creep |
| Visual polish during refactor | No change | Pure refactor, no visual changes |
| Test coverage | No new tests for extracted hooks (existing card tests still pass) | Refactor should be behavior-preserving |
| Import approach | Barrel exports in `index.ts` | Already established pattern |

### Dead Code Discretion
| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Confidence threshold | HIGH confidence = delete; MEDIUM = flag in PR comment; LOW = skip | Conservative approach prevents breaking runtime |
| Console statements | Keep `console.debug("[cart]"`, `console.warn("[cart]"` (prefixed = intentional). Remove bare `console.log` without prefix. | Existing code uses prefix convention |
| CSS tokens | Only remove tokens with zero grep hits in `src/` | CSS tokens may be used dynamically via template strings |
| TypeScript types | Remove if zero imports AND not re-exported | Types-only files are exempt from 400-line rule |
| API route criteria | Remove if zero `fetch`/`Link`/`router.push` references | Check both `src/` and any external clients |
| Env vars | Generate report of unused vars, present to user | Never auto-delete env vars |

## Open Questions

1. **Push Notification Infrastructure**
   - What we know: Serwist service worker is already in the project. Web Push API is the standard. `push notification` references exist in admin settings code.
   - What's unclear: Is the service worker already configured for push? Is there a VAPID key set up? Is there a backend endpoint for sending push notifications?
   - Recommendation: Check Serwist config and SW registration. If push isn't set up, the notification feature needs: (1) VAPID key generation, (2) push subscription endpoint, (3) SW push event handler. This could be a separate sub-plan.

2. **`send-delivery-notification` Edge Function**
   - What we know: It exists at `supabase/functions/send-delivery-notification/index.ts`. The `send-order-confirmation` is confirmed dead.
   - What's unclear: Is `send-delivery-notification` also dead, or is it called from Supabase database triggers?
   - Recommendation: Check for database triggers or external references. If dead, include in cleanup. If active, leave alone.

3. **Driver Rating Database vs Orders Table**
   - What we know: CONTEXT.md says "Rating stored in orders table." The database has a separate `driver_ratings` table (not an `orders` column).
   - What's unclear: Should we add a `rating` column to `orders` table, or use the existing `driver_ratings` table?
   - Recommendation: Use the existing `driver_ratings` table (it has proper constraints, driver FK, and uniqueness on order_id). The CONTEXT.md statement about "orders table" is interpreted as "associated with the order" rather than literally in the orders table.

4. **Shared Tracking Link Access Control**
   - What we know: CONTEXT.md says "Shared link viewable by any authenticated user (doesn't have to be order owner)."
   - What's unclear: The current API route checks `order.user_id !== user.id` and returns 403. This check must be conditionally bypassed for shared links.
   - Recommendation: Add a `shared` query parameter or a shareable token. When present, skip the ownership check but still require authentication. Simplest: add `?shared=true` param and relax the ownership check. More secure: generate a share token stored in DB.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/components/ui/cart/CartItem/CartItem.tsx`, `CartPage/CartPageContent.tsx`, `menu/ItemDetailSheet.tsx`, `cart-store.ts` -- direct code inspection
- Codebase analysis: `src/components/ui/orders/tracking/TrackingPageClient.tsx`, `useTrackingSubscription.ts`, `DeliveryMap/DeliveryMap.tsx` -- direct code inspection
- Codebase analysis: `src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` -- 540 lines confirmed via wc -l
- Codebase analysis: `supabase/functions/send-order-confirmation/index.ts` -- full Edge Function, confirmed no frontend references
- Codebase analysis: `supabase/migrations/000_initial_schema.sql` -- `driver_ratings` table with 1-5 constraint, unique per order
- Context7 `/webpro-nl/knip` -- dead code detection configuration and usage
- Context7 `/visgl/react-google-maps` -- AdvancedMarker, Polyline, Directions API patterns

### Secondary (MEDIUM confidence)
- `@react-google-maps/api` documentation -- project uses this older library, patterns from Context7's newer `@vis.gl/react-google-maps` may not apply 1:1 but concepts transfer
- Project learnings: `.claude/ERROR_HISTORY.md` -- mobile crash patterns from setTimeout, scroll lock
- Project learnings: `.claude/learnings/INDEX.md` -- state management, Tailwind v4, React patterns

### Tertiary (LOW confidence)
- Push notification feasibility -- Serwist/web-push integration specifics need validation against actual Serwist config

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new dependencies needed
- Architecture (Cart): HIGH -- all components exist, gap is wiring + one new store method
- Architecture (Tracking): HIGH for bug fix, MEDIUM for full enhancement (many new components)
- Architecture (Card refactor): HIGH -- straightforward extraction, line counts verified
- Architecture (Dead code): HIGH -- knip installed, Edge Function confirmed dead
- Pitfalls: HIGH -- documented from project's ERROR_HISTORY.md and prior phases

**Research date:** 2026-02-15
**Valid until:** 2026-03-17 (30 days -- stable domain, no fast-moving libraries)
