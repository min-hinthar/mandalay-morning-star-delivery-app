# Phase 74: Guided Walkthrough & Driver UI Polish - Research

**Researched:** 2026-02-19
**Domain:** Driver onboarding UX, mobile touch targets, Framer Motion animation patterns
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **OnboardingWalkthroughCard** is a separate component from `ProfileCompletenessCard` (do NOT extend it)
- Appears only when `deliveriesCount === 0`; 3 milestones; uses established driver glass shell styling
- Not dismissible until all 3 complete; 3-second celebration + auto-hide via localStorage `"walkthrough-dismissed"`
- Position: below `ProfileCompletenessCard`, above `EarningsSummaryCard`
- **Test delivery** at `/driver/test-delivery`, fully client-side, zero DB writes
- Mock data uses static constants matching `StopData[]` interface
- All 5 delivery steps included; reuse existing components with `testMode` prop
- Navigation button shows toast in test mode; location tracking disabled
- Completion shows "Practice Complete!" screen with stats + "Run Again" + "Back to Home"
- Re-runnable via `useState` reset; view swapping via local state + `AnimatePresence`
- **Touch targets:** 44px minimum all interactive, 56px primary CTAs; tokens already exist
- Specific fix table provided for 7 components (StopCard, DriverHeader, StopDetail, period toggles, MonthGroup)
- Scan hierarchy for stop detail defined (urgency order: action > identity > time > supporting)
- **Animation:** Framer Motion only (no GSAP on driver side); `initial/animate` pattern (no `whileInView`)
- Driver glass: `bg-surface-primary/80 sm:backdrop-blur-sm rounded-2xl border-2 shadow-card` (NOT customer glass)
- Patterns: `staggerContainer` + `staggerItem`, `spring.ultraBouncy` for celebrations, `AnimatedValue` for numbers, `hover: { y: -4, scale: 1.03 }` card lift
- `animate-shine-sweep` only on single high-emphasis CTA
- Token alignment: `shadow-card` (not `shadow-colorful`), `shadow-glow-primary` for active states only

### Claude's Discretion
- Loading skeleton designs for walkthrough card
- Exact mock data content (item names, addresses)
- 3D tilt: do NOT port
- Exact stagger timing values
- Completion celebration animation details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DPROF-04 | Onboarding checklist on dashboard for new drivers (profile complete, first route viewed, first delivery done) | Codebase has `ProfileCompletenessCard` as reference pattern; same glass shell, progress bar, localStorage, celebration pattern |
| DPROF-05 | Test delivery page (/driver/test-delivery) with mock route data for practicing delivery flow | All 6 components exist (`ActiveRouteView`, `StopDetailView`, `StopDetail`, `DeliveryActions`, `PhotoCapture`, `ExceptionModal`); need `testMode` prop bypass |
| DUI-02 | Mobile-first driver layouts with larger touch targets and better scan hierarchy | Touch target tokens exist in `tokens.css`; specific component audit provided in CONTEXT.md; 7 fixes identified |
| DUI-03 | Visual parity with customer side — animation polish, glassmorphism cards, consistent design tokens | Motion token system fully built (`spring`, `stagger`, `duration`); driver glass variant established in Phase 72 |
</phase_requirements>

## Summary

Phase 74 is a polish and onboarding phase with zero new backend work. All driver components exist; the work is adding an onboarding walkthrough card, a test delivery page that reuses existing components with a `testMode` bypass, fixing touch target sizes on 7 specific components, and applying consistent animation patterns across driver pages.

The codebase is well-prepared. `ProfileCompletenessCard` provides the exact reference pattern for the walkthrough card (localStorage persistence, celebration animation, progress bar). All delivery flow components exist with clean prop interfaces. Motion tokens are comprehensive. Touch target CSS custom properties are already defined.

**Primary recommendation:** Follow the CONTEXT.md component audit table exactly for touch target fixes, mirror `ProfileCompletenessCard` patterns for the walkthrough card, and add `testMode` prop to API-calling components with simulated delays.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^11.x | All driver animations | Already used across all driver components via `m`, `AnimatePresence` |
| lucide-react | ^0.x | Icons | Already used in every driver component |
| next/navigation | 16.x | Router, pathname | Already used for page transitions |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/lib/motion-tokens | internal | `spring`, `staggerContainer`, `staggerItem`, `AnimatedValue` | All animation definitions |
| @/lib/hooks/useAnimationPreference | internal | `shouldAnimate`, `isFullMotion`, `getSpring` | Reduced motion support |
| @/lib/utils/cn | internal | Conditional className merging | All components |

### No New Libraries Needed
Phase 74 adds zero dependencies. Everything is built from existing primitives.

## Architecture Patterns

### Recommended Component Structure
```
src/components/ui/driver/
├── DriverDashboard/
│   ├── OnboardingWalkthroughCard.tsx   # NEW — separate from ProfileCompletenessCard
│   ├── DriverDashboard.tsx            # MODIFY — add walkthrough card between Profile and Earnings
│   └── ...existing files
├── StopCard.tsx                       # MODIFY — touch target fixes
├── DriverHeader.tsx                   # MODIFY — touch target fixes
├── StopDetail.tsx                     # MODIFY — touch target fixes
├── ActiveRouteView.tsx                # MODIFY — add testMode support
├── StopDetailView.tsx                 # MODIFY — add testMode support
├── DeliveryActions.tsx                # MODIFY — add testMode prop
├── PhotoCapture.tsx                   # NO CHANGE — already handles blob-only flow
├── ExceptionModal.tsx                 # MODIFY — add testMode prop
├── NavigationButton.tsx               # MODIFY — add testMode toast
└── LocationTracker.tsx                # MODIFY — disable when testMode

src/app/(driver)/driver/
├── test-delivery/
│   └── page.tsx                       # NEW — fully client-side test delivery page
└── page.tsx                           # MODIFY — pass deliveriesCount for walkthrough visibility
```

### Pattern 1: testMode Prop Bypass
**What:** Components that make API calls receive an optional `testMode?: boolean` prop. When true, they intercept API calls with simulated delays and local state updates.
**When to use:** Any component used in the test delivery flow that normally calls `fetch()`.
**Example:**
```typescript
// In DeliveryActions.tsx
interface DeliveryActionsProps {
  // ...existing props
  testMode?: boolean;
  onTestStatusChange?: (newStatus: RouteStopStatus) => void;
}

const updateStatus = async (newStatus: RouteStopStatus) => {
  if (testMode) {
    // Simulate network delay
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    onTestStatusChange?.(newStatus);
    return;
  }
  // ...existing fetch logic
};
```

### Pattern 2: OnboardingWalkthroughCard (Mirror ProfileCompletenessCard)
**What:** New card following exact same patterns as `ProfileCompletenessCard`:
- localStorage key `"walkthrough-dismissed"` for persistence
- `getCompletionState()` function for milestone tracking
- `AnimatePresence` for celebration → auto-hide transition
- Particle celebration effect on all-complete
**When to use:** Dashboard only, when `deliveriesCount === 0`.

### Pattern 3: View Swapping for Test Delivery
**What:** Single page component with `useState<TestStep>()` driving which view renders. `AnimatePresence` handles transitions between views.
**Example steps:** `"overview"` → `"route"` → `"stop-detail"` → `"complete"`

### Anti-Patterns to Avoid
- **DO NOT use `whileInView`** — Driver pages are shallow-scroll, not long marketing pages. Use `initial/animate` mount pattern.
- **DO NOT add GSAP** — Customer side uses GSAP; driver side uses Framer Motion only.
- **DO NOT port `glass-menu-card`** (30px blur) — Driver glass is `sm:backdrop-blur-sm` (4px) deliberately for mobile performance.
- **DO NOT use `shadow-colorful`** — Use `shadow-card` for cards.
- **DO NOT apply `animate-shine-sweep` to multiple elements** — Single high-emphasis CTA only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation preferences | Custom reduced motion check | `useAnimationPreference` hook | Already handles `prefers-reduced-motion`, high-contrast, all branches |
| Spring physics | Custom timing/easing | `spring.default`, `spring.ultraBouncy` from motion-tokens | Consistent feel across app |
| Staggered lists | Manual delay calculations | `staggerContainer()` + `staggerItem` variants | Handles hidden/visible/exit states with proper caps |
| Animated numbers | Custom counting animation | `AnimatedValue` component | Already supports number/currency/percentage formats |
| Body scroll lock | Custom scroll prevention | `useBodyScrollLock` hook | Already handles deferred restore for animation safety |
| Class merging | Template literals | `cn()` utility | Handles Tailwind conflicts properly |

## Common Pitfalls

### Pitfall 1: Mobile Safari Backdrop Blur Crash
**What goes wrong:** `backdrop-blur` causes Safari crashes on mobile iOS
**Why it happens:** GPU memory pressure from blur on fixed/sticky elements
**How to avoid:** Use `sm:backdrop-blur-sm` (only applies on non-mobile viewports). DriverHeader and DriverNav already have comments about this.
**Warning signs:** App freezes on iPhone Safari

### Pitfall 2: testMode Leaking to Production
**What goes wrong:** Test delivery components accidentally write to the database
**Why it happens:** Missing testMode guard in a component's fetch call
**How to avoid:** Every `fetch()` call in test-delivery-used components MUST have `if (testMode)` early return. The test delivery page itself should never pass real route/stop IDs.
**Warning signs:** Unexpected DB writes from test-delivery page

### Pitfall 3: localStorage SSR Crash
**What goes wrong:** `localStorage.getItem()` called during SSR throws ReferenceError
**Why it happens:** Server components don't have window/localStorage
**How to avoid:** All localStorage reads must be in `useEffect` (client-side only). `ProfileCompletenessCard` does this correctly — mirror it.
**Warning signs:** Hydration errors mentioning `localStorage`

### Pitfall 4: Missing Animation Preference Guards
**What goes wrong:** Animations run even when user has `prefers-reduced-motion: reduce`
**Why it happens:** Using `initial/animate` directly without `shouldAnimate` conditional
**How to avoid:** Always destructure `{ shouldAnimate, getSpring }` from `useAnimationPreference()`. Conditionally apply: `initial={shouldAnimate ? { ... } : undefined}`
**Warning signs:** Animations ignore system-level reduced motion setting

### Pitfall 5: Touch Target Regression
**What goes wrong:** Fix one touch target, break another's layout
**Why it happens:** Adding `min-h-[44px]` to an element inside a flex container can change alignment
**How to avoid:** Always add both `min-h` AND `min-w` for square targets; use `flex items-center justify-center` on the wrapper
**Warning signs:** Visual misalignment after touch target changes

### Pitfall 6: Inconsistent Glass Shell
**What goes wrong:** New cards use different glassmorphism styles
**Why it happens:** Copying from customer-side components instead of driver-side
**How to avoid:** Always use driver glass: `bg-surface-primary/80 sm:backdrop-blur-sm rounded-2xl border-2 shadow-card`. Never `glass-menu-card`.
**Warning signs:** Overly blurred cards on driver pages

## Code Examples

### OnboardingWalkthroughCard Structure
```typescript
// Mirror ProfileCompletenessCard patterns
const WALKTHROUGH_STORAGE_KEY = "walkthrough-dismissed";

const milestones = [
  { key: "profile", label: "Complete your profile", checkFn: (d) => isProfileComplete(d) },
  { key: "route-viewed", label: "View today's route", checkFn: () => hasViewedRoute() },
  { key: "first-delivery", label: "Complete your first delivery", checkFn: (d) => d.deliveriesCount > 0 },
];

// Only render when deliveriesCount === 0 AND not dismissed
if (driver.deliveriesCount > 0 || isDismissed) return null;
```

### testMode Intercept Pattern
```typescript
// DeliveryActions with testMode
if (testMode) {
  setIsLoading(true);
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  setIsLoading(false);
  onStatusChange?.(newStatus);
  return;
}
```

### Touch Target Fix Pattern
```typescript
// Before (StopCard badge):
<span className="flex h-6 w-6 items-center justify-center rounded-full">

// After:
<span className="flex h-8 w-8 items-center justify-center rounded-full">

// Before (DriverHeader dropdown items):
<Link className="flex items-center gap-2.5 px-4 py-2.5 text-sm">

// After:
<Link className="flex items-center gap-2.5 px-4 py-2.5 text-sm min-h-[44px]">
```

### Card Hover Lift Pattern
```typescript
<m.div
  whileHover={isFullMotion ? { y: -4, scale: 1.03 } : undefined}
  whileTap={isFullMotion ? { scale: 0.98 } : undefined}
  transition={getSpring(spring.default)}
  className="rounded-2xl border-2 shadow-card bg-surface-primary/80 sm:backdrop-blur-sm p-4"
>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `whileInView` for scroll reveals | `initial/animate` mount-triggered | Phase 72 driver standardization | Simpler, no intersection observer overhead on shallow pages |
| Per-component animation config | Motion tokens (`spring.*`, `stagger*`) | Phase 22 (v1.2) | Consistent animation feel, one source of truth |
| Raw `backdrop-blur` | `sm:backdrop-blur-sm` with mobile exclusion | Phase 64 Safari crash fix | Prevents mobile Safari GPU crashes |

## Open Questions

1. **Walkthrough milestone 2 ("View today's route") tracking**
   - What we know: Need to track if driver has navigated to `/driver/route`
   - What's unclear: Best storage mechanism — localStorage key set on route page visit? Or track via the test delivery page visit?
   - Recommendation: Use localStorage key `"walkthrough-route-viewed"`, set it in the route page's `useEffect`. Simple, no DB needed, resets with browser storage clear which is acceptable for onboarding.

2. **Test delivery page route in Next.js App Router**
   - What we know: Page at `/driver/test-delivery`, needs `"use client"` directive
   - What's unclear: Whether it needs its own layout or inherits driver layout
   - Recommendation: Inherits `(driver)/driver/layout.tsx` via file path `src/app/(driver)/driver/test-delivery/page.tsx`. Uses `DriverHeader` with `showBack` but hides `DriverNav` or shows it as normal.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `ProfileCompletenessCard.tsx` — complete reference implementation for onboarding patterns
- Codebase analysis: `DriverDashboard.tsx` — current dashboard component order and props
- Codebase analysis: All 6 delivery flow components — verified prop interfaces and API call patterns
- Codebase analysis: `tokens.css` — touch target CSS custom properties confirmed
- Codebase analysis: `motion-tokens/core.ts`, `stagger.ts` — all spring/stagger presets catalogued

### Secondary (MEDIUM confidence)
- CONTEXT.md — user decisions from discuss-phase (locked implementation choices)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all patterns verified in codebase
- Architecture: HIGH — every component exists, prop interfaces documented
- Pitfalls: HIGH — all sourced from actual bugs encountered in prior phases (Safari blur, SSR localStorage)

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable — no external dependency changes expected)
