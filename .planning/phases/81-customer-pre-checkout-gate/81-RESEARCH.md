# Phase 81: Customer Pre-Checkout Gate - Research

**Researched:** 2026-03-01
**Domain:** Customer-facing delivery schedule awareness, cutoff enforcement, countdown UI
**Confidence:** HIGH

## Summary

This phase adds delivery schedule awareness and cutoff enforcement across six customer touchpoints: homepage hero, menu banner, cart drawer, checkout gate, empty states, and order tracking. The codebase already has all required infrastructure -- `delivery-dates.ts` utilities, `getBusinessRules()` cached reader, `useCountdown` hook, `useTrackingSubscription`/`useLastUpdateDisplay` hooks, and the `Modal` component. No new npm packages are needed.

The primary work is creating new client components (countdown bar, cutoff modal) and wiring existing utilities into existing page components. The `useCountdown` hook from admin ops can be reused directly on customer pages. Server-side cutoff validation already exists in `checkout/session/route.ts`. The main challenges are: ensuring countdown components don't cause unnecessary re-renders at 1-second intervals, handling the open/closed transition gracefully mid-session, and keeping components under the 400-line limit.

**Primary recommendation:** Build a shared `useDeliveryGate` hook that computes open/closed state, delivery date, and countdown from business rules. Wire it into all six touchpoints. Reuse `useCountdown`/`computeCountdown` from admin ops directly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hero CTA: "Order Now" when open, "Pre-Order for [Saturday date]" when closed, both link to /menu
- Hero countdown: live timer near CTA when open, "Orders open [Day]" when closed
- Urgency colors: amber <2h, red <30m
- Hero stat bar: "Order by Friday 3:00 PM" updates to "Orders closed -- next Saturday [date]" when past cutoff
- Menu banner: slim persistent bar below sticky MenuHeader pattern
- Menu banner text: "Delivering Saturday, March 7 -- Order within 2h 34m" (open) / "Next delivery: Saturday, March 14" (closed)
- Cart drawer: delivery date + live countdown; checkout button disabled when closed with "Checkout opens [Day] at [Time]"
- Cart items preserved across open/closed transitions (wishlist behavior)
- Past-cutoff modal: warm tone, "We're preparing this week's deliveries!" message
- Modal actions: "Got it" (dismiss) + "Browse Menu" (navigate to /menu)
- Cart NOT cleared on cutoff
- Gate triggers: checkout page load + server-side payment submit + client-side mid-checkout timer
- Empty states: add "We deliver every Saturday -- order by [Day] [Time]." line
- Tracking: polling indicator + "last updated X ago" timestamp

### Claude's Discretion
- Tracking page: placement of "last updated" timestamp and polling indicator style
- Tracking page: whether to include manual refresh option alongside auto-polling
- Empty state: exact wording and placement per component
- Loading skeleton design for countdown components
- Exact countdown format (hh:mm vs "2 hours, 34 minutes" vs "2h 34m")

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GATE-01 | Homepage hero -- dynamic CTA based on delivery availability | Hero already receives `cutoffDay`/`cutoffHour` as server props; extend HeroContent with open/closed state computed from `getDeliveryDate()` + `getTimeUntilCutoff()` |
| GATE-02 | Menu page banner -- Saturday delivery schedule + cutoff | New `DeliveryBanner` component below MenuHeader; MenuContent already renders sticky `CategoryTabs` -- banner slots between header and tabs |
| GATE-03 | Cart drawer -- show delivery date + cutoff countdown | CartFooter already has checkout button with disabled state; add delivery info section above summary; `useDeliveryGate` hook provides all data |
| GATE-04 | Checkout gate -- past cutoff modal with next Saturday date | Checkout page.tsx already calls `getBusinessRules()`; add client-side cutoff timer in CheckoutClient; server-side validation already exists in session/route.ts |
| GATE-05 | Update empty states with Saturday schedule context | CartEmptyState, orders page empty state, and menu empty state all need one-line addition using business rules |
| GATE-06 | Order tracking -- polling indicator + "last updated" timestamp | TrackingPageClient already renders `lastUpdateDisplay` and has refresh button; needs visibility enhancement with polling indicator animation |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | UI components | Project stack |
| Next.js 16 | 16.x | App Router, server components | Project stack |
| framer-motion | installed | Animation (m, AnimatePresence) | Project animation system |
| lucide-react | installed | Icons (Clock, AlertTriangle, Calendar) | Project icon set |
| zustand | installed | Client state (cart store) | Project state management |

### Supporting (Already Available)
| Utility | Location | Purpose | Usage |
|---------|----------|---------|-------|
| `delivery-dates.ts` | `src/lib/utils/delivery-dates.ts` | `getDeliveryDate`, `getTimeUntilCutoff`, `isPastCutoff`, `getNextSaturday`, `getCutoffForSaturday` | Core logic for all gate computations |
| `business-rules.ts` | `src/lib/settings/business-rules.ts` | `getBusinessRules()` with unstable_cache | Server-side business rules reader |
| `useCountdown` | `src/components/ui/admin/ops/useCountdown.ts` | 1-second tick countdown + `computeCountdown` pure function | Reuse for customer countdown (move to shared location) |
| `useLastUpdateDisplay` | `src/lib/hooks/useTrackingSubscription.ts` | "X ago" timestamp formatting | Already used in tracking page |
| `Modal` | `src/components/ui/Modal/` | Bottom sheet (mobile) / dialog (desktop) | Cutoff modal (GATE-04) |
| `ConfirmDialog` | `src/components/ui/admin/settings/ConfirmDialog.tsx` | Pattern reference for modal with actions | Inspiration for cutoff modal structure |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useCountdown` (admin ops) | New hook from scratch | Unnecessary duplication; existing hook is well-tested |
| Custom countdown format | date-fns `formatDuration` | Zero new deps policy; simple string formatting suffices |
| Zustand store for gate state | Context or prop drilling | Gate state is derived (computed from time + rules), not stored; hook is correct pattern |

**Installation:** None needed. Zero new npm packages (v1.9 constraint).

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    hooks/
      useDeliveryGate.ts           # NEW: shared hook for open/closed + countdown
      useCountdown.ts              # MOVED from admin/ops (shared between admin + customer)
  components/
    ui/
      delivery/
        index.ts                   # Barrel exports
        DeliveryBanner.tsx          # GATE-02: menu page banner
        DeliveryCountdown.tsx       # Shared countdown display component
        CutoffModal.tsx             # GATE-04: past-cutoff modal
      homepage/
        Hero/
          HeroContent.tsx           # MODIFIED: dynamic CTA + countdown
          HeroSubComponents.tsx     # MODIFIED: stat bar update
      menu/
        MenuContent.tsx             # MODIFIED: add DeliveryBanner
      cart/
        CartDrawerParts.tsx         # MODIFIED: CartFooter delivery info
        CartEmptyState.tsx          # MODIFIED: add delivery schedule line
      orders/
        tracking/
          TrackingPageClient.tsx     # MODIFIED: enhance polling indicator
  app/
    (customer)/
      checkout/
        CheckoutClient.tsx          # MODIFIED: add cutoff timer + modal
```

### Pattern 1: useDeliveryGate Hook
**What:** Centralized hook that computes delivery gate state from business rules
**When to use:** Every customer page that needs open/closed awareness
**Example:**
```typescript
// src/lib/hooks/useDeliveryGate.ts
interface DeliveryGateState {
  isOpen: boolean;
  deliveryDate: DeliveryDate;
  cutoffDate: Date;
  timeUntilCutoff: { hours: number; minutes: number; isPastCutoff: boolean };
  urgency: 'normal' | 'warning' | 'critical'; // >2h, <2h, <30m
  ctaText: string;
  statusText: string;
}

function useDeliveryGate(cutoffDay: number, cutoffHour: number): DeliveryGateState
```
This hook calls `getDeliveryDate()` and `getTimeUntilCutoff()` on a 1-minute interval (not 1-second -- countdown display uses separate `useCountdown` for seconds). Urgency thresholds: >2h = normal, <=2h = warning (amber), <=30m = critical (red).

### Pattern 2: Countdown Component Reuse
**What:** Extract `useCountdown` from `src/components/ui/admin/ops/useCountdown.ts` to `src/lib/hooks/useCountdown.ts` for shared use
**When to use:** Any page needing a live seconds-level countdown
**Why move:** Admin ops hook is well-tested with `computeCountdown` pure function. Customer pages need the same countdown. Moving to shared hooks directory follows project convention.

### Pattern 3: Server Props + Client Hydration
**What:** Pass `cutoffDay`/`cutoffHour` from server page.tsx to client components via props
**When to use:** Homepage already does this pattern. Menu page and checkout page also use `getBusinessRules()`.
**Example:**
```typescript
// page.tsx (server)
const rules = await getBusinessRules();
return <ClientComponent cutoffDay={rules.cutoffDay} cutoffHour={rules.cutoffHour} />;
```
The homepage already passes `cutoffDay`/`cutoffHour` to Hero. Menu page currently does NOT -- it needs to be extended. Checkout page already calls `getBusinessRules()`.

### Pattern 4: Client-Side Cutoff Detection
**What:** Timer that detects cutoff passing during an active session
**When to use:** Checkout page (GATE-04) and cart drawer (GATE-03)
**Example:**
```typescript
// Inside CheckoutClient
useEffect(() => {
  const checkCutoff = () => {
    const now = new Date();
    if (isPastCutoff(deliveryDate.date, now, cutoffDay, cutoffHour)) {
      setShowCutoffModal(true);
    }
  };
  const interval = setInterval(checkCutoff, 30_000); // check every 30s
  return () => clearInterval(interval);
}, [deliveryDate, cutoffDay, cutoffHour]);
```

### Anti-Patterns to Avoid
- **1-second intervals everywhere:** Only the visible countdown digit display needs 1s ticks. Gate state checks (open/closed) can use 30s-60s intervals.
- **Prop-drilling business rules through 5 levels:** Use the `useDeliveryGate` hook at the component that needs it. Pass `cutoffDay`/`cutoffHour` as props from server to the first client boundary, then use hook.
- **Hardcoding day/time strings:** All references to "Friday 3 PM" or "Saturday" must derive from `cutoffDay`/`cutoffHour` business rules.
- **Clearing cart on cutoff:** Locked decision -- cart items persist across open/closed transitions.
- **Blocking checkout API without user-friendly modal:** Always show modal first, never just a raw error toast.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Countdown timer | Custom setInterval logic | `useCountdown` from admin ops | Already tested, handles edge cases (isPast, cleanup) |
| "Last updated X ago" | Custom relative time formatter | `useLastUpdateDisplay` hook | Already implemented with 10s refresh cycle |
| Business rules fetch | Direct Supabase query | `getBusinessRules()` cached reader | Has unstable_cache with 5min TTL and tag invalidation |
| Delivery date computation | Manual date math | `getDeliveryDate()`, `getNextSaturday()` | Handles timezone (America/Los_Angeles), DST, edge cases |
| Modal component | Custom dialog | `Modal` component | Handles bottom sheet (mobile), focus trap, escape, backdrop |
| Cutoff check | Date comparison | `isPastCutoff()` utility | Timezone-aware, parameterized, tested |

**Key insight:** The entire delivery date/cutoff infrastructure was built in Phase 78. This phase is pure UI wiring -- no new business logic needed.

## Common Pitfalls

### Pitfall 1: Timezone Mismatch
**What goes wrong:** Countdown shows wrong time because client and server interpret dates differently
**Why it happens:** `delivery-dates.ts` uses `TIMEZONE = "America/Los_Angeles"` but client browser may be in a different timezone
**How to avoid:** All date math uses the existing `getZonedParts()` / `zonedTimeToUtc()` helpers which always convert through America/Los_Angeles. Never use `new Date().getHours()` directly for cutoff comparison.
**Warning signs:** Countdown shows negative time or jumps when page loads

### Pitfall 2: Hydration Mismatch on Time-Dependent UI
**What goes wrong:** Server renders "Order Now" but client renders "Pre-Order" because server and client disagree on current time
**Why it happens:** Server renders at build/request time, client hydrates moments later. Near cutoff boundary, they may disagree.
**How to avoid:** For the CTA text and open/closed state, compute on client only (after hydration). Use `useState` with initial undefined, then set in `useEffect`. Alternatively, accept brief flash by rendering both server and client with the same initial props, then updating client-side.
**Warning signs:** React hydration warning in console about text content mismatch

### Pitfall 3: Stale Countdown After Tab Backgrounding
**What goes wrong:** User backgrounds tab, returns 30 minutes later, countdown shows 30 minutes too much time remaining
**Why it happens:** `setInterval` may pause or drift when tab is backgrounded
**How to avoid:** `useCountdown` already computes from `Date.now()` each tick, not incrementally. This is correct. Verify the customer implementation does the same.
**Warning signs:** Countdown jumps forward when user returns to tab

### Pitfall 4: Cart Checkout Button State Desync
**What goes wrong:** Checkout button shows enabled but cutoff just passed; user clicks, gets error
**Why it happens:** Cart drawer doesn't have its own cutoff timer
**How to avoid:** Cart drawer uses `useDeliveryGate` which checks cutoff state. When `isOpen` flips to false mid-session, button disables immediately. The client-side timer in checkout provides backup.
**Warning signs:** Users report "I clicked checkout and got an error"

### Pitfall 5: 400-Line Limit on Modified Files
**What goes wrong:** Adding countdown + delivery info pushes existing files over 400 lines
**Why it happens:** CartDrawerParts.tsx is already 298 lines. HeroContent.tsx is 180 lines. Adding gate logic could push them over.
**How to avoid:** Extract delivery-specific UI into separate components (DeliveryCountdown.tsx, CutoffModal.tsx). Import and compose, don't inline.
**Warning signs:** ESLint max-lines warning during build

### Pitfall 6: Menu Page Missing Business Rules Props
**What goes wrong:** Menu page can't show delivery banner because it doesn't have cutoffDay/cutoffHour
**Why it happens:** Menu page.tsx is a simple server component that just renders `<MenuContent />` with Suspense. It doesn't call `getBusinessRules()`.
**How to avoid:** Either: (a) add `getBusinessRules()` call to menu page.tsx and pass props down, or (b) create a `useBusinessRules` client hook that reads from the cart store (which already has `deliveryFeeCents`). Option (b) requires extending the store. Option (a) is simpler and follows the homepage pattern. Recommend (a).
**Warning signs:** Delivery banner renders with default values instead of DB values

## Code Examples

### useDeliveryGate Hook
```typescript
// src/lib/hooks/useDeliveryGate.ts
'use client';

import { useState, useEffect } from 'react';
import { getDeliveryDate, getTimeUntilCutoff, getCutoffForSaturday, getNextSaturday } from '@/lib/utils/delivery-dates';
import type { DeliveryDate } from '@/types/delivery';

type Urgency = 'normal' | 'warning' | 'critical';

export interface DeliveryGateState {
  isOpen: boolean;
  deliveryDate: DeliveryDate;
  cutoffDate: Date;
  timeUntilCutoff: { hours: number; minutes: number; isPastCutoff: boolean };
  urgency: Urgency;
}

function computeUrgency(hours: number, minutes: number, isPastCutoff: boolean): Urgency {
  if (isPastCutoff) return 'critical';
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes <= 30) return 'critical';
  if (totalMinutes <= 120) return 'warning';
  return 'normal';
}

export function useDeliveryGate(cutoffDay: number, cutoffHour: number): DeliveryGateState {
  const [state, setState] = useState<DeliveryGateState>(() => compute(cutoffDay, cutoffHour));

  useEffect(() => {
    setState(compute(cutoffDay, cutoffHour));
    const interval = setInterval(() => {
      setState(compute(cutoffDay, cutoffHour));
    }, 60_000); // re-check every minute
    return () => clearInterval(interval);
  }, [cutoffDay, cutoffHour]);

  return state;
}

function compute(cutoffDay: number, cutoffHour: number): DeliveryGateState {
  const now = new Date();
  const deliveryDate = getDeliveryDate(now, cutoffDay, cutoffHour);
  const timeUntilCutoff = getTimeUntilCutoff(now, cutoffDay, cutoffHour);
  const saturday = getNextSaturday(now);
  const cutoffDate = getCutoffForSaturday(saturday, cutoffDay, cutoffHour);

  return {
    isOpen: !deliveryDate.cutoffPassed,
    deliveryDate,
    cutoffDate,
    timeUntilCutoff,
    urgency: computeUrgency(timeUntilCutoff.hours, timeUntilCutoff.minutes, timeUntilCutoff.isPastCutoff),
  };
}
```

### DeliveryBanner Component (GATE-02)
```typescript
// src/components/ui/delivery/DeliveryBanner.tsx
'use client';

import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useDeliveryGate } from '@/lib/hooks/useDeliveryGate';
import { useCountdown } from '@/lib/hooks/useCountdown';

interface DeliveryBannerProps {
  cutoffDay: number;
  cutoffHour: number;
}

export function DeliveryBanner({ cutoffDay, cutoffHour }: DeliveryBannerProps) {
  const gate = useDeliveryGate(cutoffDay, cutoffHour);
  const countdown = useCountdown(gate.cutoffDate, 'cutoff');

  if (gate.isOpen) {
    return (
      <div className={cn(
        'sticky top-14 z-10 flex items-center justify-center gap-2 px-4 py-2 text-sm border-b',
        gate.urgency === 'critical' && 'bg-destructive/10 border-destructive/20 text-destructive',
        gate.urgency === 'warning' && 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-700',
        gate.urgency === 'normal' && 'bg-surface-secondary border-border text-text-secondary',
      )}>
        <Clock className="h-4 w-4" />
        <span>Delivering {gate.deliveryDate.displayDate}</span>
        <span className="font-mono font-semibold tabular-nums">
          Order within {countdown.hours}h {String(countdown.minutes).padStart(2, '0')}m
        </span>
      </div>
    );
  }

  return (
    <div className="sticky top-14 z-10 flex items-center justify-center gap-2 px-4 py-2 text-sm border-b bg-surface-secondary border-border text-text-secondary">
      <Calendar className="h-4 w-4" />
      <span>Next delivery: {gate.deliveryDate.displayDate}</span>
    </div>
  );
}
```

### CutoffModal (GATE-04)
```typescript
// src/components/ui/delivery/CutoffModal.tsx
'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';

interface CutoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextDeliveryDate: string; // e.g. "Saturday, March 14"
}

export function CutoffModal({ isOpen, onClose, nextDeliveryDate }: CutoffModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Orders Closed" size="sm">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Calendar className="h-8 w-8 text-amber-600" />
        </div>
        <p className="text-text-secondary">
          We're preparing this week's deliveries! Your next chance to order is for{' '}
          <span className="font-semibold text-text-primary">{nextDeliveryDate}</span>.
        </p>
        <p className="text-xs text-text-muted">Your cart items are saved for next time.</p>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Got it</Button>
          <Button variant="primary" asChild className="flex-1">
            <Link href="/menu">Browse Menu</Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

### Dynamic Hero CTA (GATE-01 modification pattern)
```typescript
// Inside HeroContent.tsx -- additions
const gate = useDeliveryGate(cutoffDay ?? 5, cutoffHour ?? 15);

// CTA text
const dynamicCtaText = gate.isOpen ? 'Order Now' : `Pre-Order for ${gate.deliveryDate.displayDate}`;

// Stat bar text
const deliveryScheduleText = gate.isOpen
  ? `Order by ${DAY_NAMES[cutoffDay ?? 5]} ${formatCutoffHour(cutoffHour ?? 15)}`
  : `Orders closed — next ${gate.deliveryDate.displayDate}`;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded "Friday 3 PM" strings | Dynamic from `getBusinessRules()` | Phase 78 | All UI must use parameterized values |
| No cutoff validation at checkout | `isPastCutoff()` check in session/route.ts | Phase 78 | Server already rejects past-cutoff orders |
| `useCountdown` in admin only | Will be shared to customer pages | Phase 81 (this phase) | Move from admin/ops to lib/hooks |

**Already complete:**
- Server-side cutoff validation in `checkout/session/route.ts` (lines 54-65) returns `CUTOFF_PASSED` error with `nextDeliveryDate`
- `getBusinessRules()` with unstable_cache and tag-based invalidation
- `DeliverySettingsSync` component syncs fees to cart store at layout level
- `useCountdown` hook with pure `computeCountdown` function and tests
- `useLastUpdateDisplay` hook for relative time formatting
- `useTrackingSubscription` with Realtime + polling fallback

## Open Questions

1. **Countdown format (Claude's discretion)**
   - What we know: Admin ops uses `HH:MM:SS` format. Hero/menu contexts are more casual.
   - Recommendation: Use `Xh Ym` format for customer-facing (e.g., "2h 34m"). More readable than `02:34:00`. Reserve `HH:MM:SS` for admin ops where precision matters.

2. **Tracking page enhancement scope (Claude's discretion)**
   - What we know: TrackingPageClient already shows connection status dot (green/yellow/gray), `lastUpdateDisplay`, and a manual refresh button.
   - What's unclear: GATE-06 says "polling indicator" -- the existing connection dot + lastUpdateDisplay may already satisfy this. Need to decide if we add a spinning animation on the refresh icon during polling.
   - Recommendation: Add a subtle `animate-spin` on the RefreshCw icon during active polling (when `isConnected` is true), and ensure the `lastUpdateDisplay` text is more visible (currently `text-charcoal-400`, could be slightly more prominent). Include manual refresh as it already exists.

3. **useCountdown relocation**
   - What we know: Currently at `src/components/ui/admin/ops/useCountdown.ts`. Admin ops imports it.
   - Recommendation: Move to `src/lib/hooks/useCountdown.ts`. Update admin ops import. This follows project convention (hooks in `lib/hooks/`). Re-export from old location if needed for minimal diff, but the admin ops import is only in 2 files.

4. **Menu page business rules access**
   - What we know: Menu page.tsx is a minimal server component. It doesn't fetch business rules. MenuContent is client-only (React Query + offline support).
   - Recommendation: Add `getBusinessRules()` call to menu `page.tsx` and pass `cutoffDay`/`cutoffHour` as props to a new wrapper or directly to the DeliveryBanner rendered in the menu layout. The public layout already fetches rules -- could extend to pass cutoff props.

## Sources

### Primary (HIGH confidence)
- `src/lib/utils/delivery-dates.ts` -- full delivery date utility suite, all functions verified
- `src/lib/settings/business-rules.ts` -- cached business rules reader with unstable_cache
- `src/components/ui/admin/ops/useCountdown.ts` -- countdown hook with `computeCountdown` pure function
- `src/lib/hooks/useTrackingSubscription.ts` -- tracking subscription with `useLastUpdateDisplay`
- `src/components/ui/homepage/Hero/HeroContent.tsx` -- current hero with business rules props
- `src/components/ui/cart/CartDrawerParts.tsx` -- CartFooter with checkout button
- `src/app/api/checkout/session/route.ts` -- server-side cutoff validation (lines 54-65)
- `src/app/(customer)/checkout/CheckoutClient.tsx` -- checkout client component
- `src/components/ui/orders/tracking/TrackingPageClient.tsx` -- tracking page with existing refresh/connection UI

### Secondary (MEDIUM confidence)
- `src/components/ui/Modal/Modal.tsx` -- Modal component (verified exists, pattern confirmed via ConfirmDialog usage)
- `src/types/delivery.ts` -- `TIMEZONE = "America/Los_Angeles"` confirmed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, all utilities already built
- Architecture: HIGH - clear extension points identified in existing components with line numbers
- Pitfalls: HIGH - timezone handling, hydration, and tab backgrounding are well-understood in this codebase
- Code examples: HIGH - patterns derived directly from existing codebase patterns

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable infrastructure, no external dependencies)
