# Phase 57: Admin & Driver Polish - Research

**Researched:** 2026-02-11
**Domain:** UI polish, animation, skeleton loading, admin/driver dashboard premium styling
**Confidence:** HIGH

## Summary

Phase 57 is a pure visual/interaction polish phase targeting the admin and driver dashboards. The codebase already has a mature foundation: Framer Motion v11 with a comprehensive motion-token system (`spring`, `stagger`, `variants`, `hover`), a `Skeleton` component with shimmer/pulse/wave/grain variants, an `EmptyState` component with variant-based configurations, and `AnimatedValue` for counting animations. The admin pages currently use `<Table>` components with `ExpandableTableRow` patterns (drivers, routes) while the orders table uses a raw `<Table>` without the expandable system. All three list pages (orders, drivers, routes) have `animate-pulse` loading states that need replacement with shimmer skeletons.

The key technical challenges are: (1) replacing 36 files' `animate-pulse` patterns with shimmer Skeleton components without layout shift, (2) building card-based table rows per CONTEXT.md decisions while preserving existing functionality (sorting, filtering, status changes, expand/collapse), (3) computing real on-time percentage from `route_stops` delivery window data instead of the hardcoded `98` on line 57 of the driver history page, and (4) applying the floating label pattern from `MagicLinkForm.tsx` to all admin form inputs.

**Primary recommendation:** Work page-by-page in isolation. Each admin/driver page gets its own plan unit: skeleton replacement, card row styling, empty state, and micro-interactions. The existing `motion-tokens` system covers all animation needs -- no new libraries required.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Table & Card Styling:**
- Card rows (not traditional tables) for orders, drivers, routes
- Scale + shadow hover effect (tiny scale-up 1.01 + shadow increase)
- Active status badges (In Transit, Preparing) soft-pulse; completed/cancelled static
- Comfortable density (more padding, larger text, 5-6 rows visible)
- Background tint for priority/status differentiation (faint color wash per status)
- Slide-in overlay drawer for row detail view (dark backdrop + panel slides over)
- Animated column sorting (rows reorder with smooth shuffle animation)
- Always-visible action buttons on each card row (no hover-reveal)
- "Load more" button pagination pattern
- Animated count badge next to page title (number animates up on load)
- Sticky table headers with shadow on scroll
- Staggered fade-in entry animation (40ms stagger per card)
- Soft 12px border radius on card rows
- Selected row state: elevated + primary background tint + border ring (triple distinction)
- Sticky date section headers ("Today", "Yesterday", "Feb 8") grouping rows
- Mobile: stacked full-width cards showing status + name + items/amount + time, tap to expand

**Skeleton & Loading Feel:**
- Skeleton-to-content: fade crossfade transition (skeleton fades out, content fades in simultaneously)
- Dashboard stat cards: counting animation (numbers count up from 0 to final value)
- Inline error card when data fails to load (replaces skeleton area with error + retry button)
- Thin top progress bar for long operations (YouTube/GitHub style, non-blocking)
- Button loading: progress fill + spinner + text swap + pulse (full premium treatment)
- Driver pages get same skeleton treatment as admin (consistent across both dashboards)

**Empty State Personality:**
- Food emoji compositions as illustrations (matching existing brand pattern)
- Playful + food-themed messaging tone (e.g., "The kitchen is quiet... for now")
- Every empty state includes a CTA/action button
- Gentle floating animation on emoji compositions
- Same personality across admin and driver apps (unified brand voice)
- Per-page themed emojis (orders = bowls/plates, routes = trucks, drivers = people/vehicles)
- Celebration entrance when first item arrives after empty state (empty fades out, first card bounces in with sparkle)

**Driver Data Presentation:**
- Driver history: summary cards (date, stop count, on-time %, total time) -- collapsed by default, expandable for per-stop detail
- Driver stop detail: full premium animation (status transitions, map marker pulse, timeline step sequence)
- Admin driver detail: performance dashboard section with 4 stat cards (deliveries, avg time, on-time %, exceptions) with animated counters
- Route detail: vertical timeline with connected dots, status icons, time between stops on connecting lines
- Route detail: estimated vs actual time comparison with visual diff (green if on time, red if late, delta bar)
- Route detail: interactive Google Maps embed with route line + stop markers
- Exception display: alert card at page top for unresolved exceptions + inline badges on affected rows
- Exception actions: "Mark Resolved" quick action on alert card + link to navigate to full detail

**Admin Dashboard Stats:**
- All key metrics displayed: orders, revenue, active drivers, on-time rate, pending, exceptions
- Each stat card links/navigates to its relevant detail page
- Animated counter numbers on load
- Stat cards with subtle teal gradients

**Color & Theme:**
- Admin uses teal/cyan accent color (distinct from customer's warm gold)
- Driver app also uses teal accent (operational apps share palette, distinct from customer)
- Token-ready for dark mode (semantic tokens throughout, dark mode itself deferred)
- Extended status color palette: green (complete), blue (in transit), amber (pending), red (failed), gray (cancelled)
- Subtle teal gradients on stat cards and feature cards

**Navigation:**
- Admin sidebar: animated active indicator (slides to active item) + icon hover animations (wobble/scale)
- Animated breadcrumbs with smooth transitions, chevron separators, clickable parents
- Unified admin page header component: page title + animated count badge + action buttons area
- Driver app: bottom tab bar with animated active indicator + badge counts for pending items

**Notification Styling:**
- Floating card toasts (rounded card with shadow, slides in from top-right, icon + message + optional action)
- Critical-only sounds (subtle chime for new orders and exceptions, silent for success/info)
- Toast stacking: first visible, rest collapsed as "+3 more" badge, expandable
- Swipe to dismiss + auto-dismiss with fade after timeout

**Form Polish:**
- Floating labels (animate from inside input to above on focus, matching auth experience)
- Validation: shake + inline error (invalid field shakes briefly + red text below + red border)
- Save success: checkmark morph animation on button + success toast (double confirmation)
- FloatingUnsavedBar on every admin form (consistent, prevents data loss)

### Claude's Discretion

- Shimmer direction, skeleton fidelity (high vs generic), shimmer color, min display time, initial vs refresh loading distinction
- Filtered-to-empty vs truly-empty messaging distinction
- On-time percentage visualization style
- Bulk action checkboxes (assess whether admin volume justifies it)
- Existing filter/search UI polish (improve what's there, don't build new search)
- Select/dropdown and date/time picker styling
- Animation timing and easing curves throughout

### Deferred Ideas (OUT OF SCOPE)

- **Global admin Cmd+K search** -- Repurpose CommandPalette for cross-entity admin search (orders, drivers, routes). New capability, own phase.
- **Dashboard trend comparisons** -- Daily/weekly toggle for stat card deltas ("+12 vs yesterday"). New data computation, own phase.
- **Admin dark mode** -- Full dark theme for admin. Token-ready in Phase 57, actual dark variants deferred.
- **Notification bell + inbox** -- Persistent notification center with read/unread state. New feature, own phase.
- **Multi-step wizard/stepper** -- Animated stepper UI for complex admin operations (create route, bulk assign). New component infrastructure, own phase.
</user_constraints>

## Standard Stack

### Core (Already in Codebase)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Framer Motion | v11 | All animations: springs, variants, AnimatePresence, layout | Already installed |
| Tailwind CSS v4 | v4 | Utility-first styling, `@theme inline` token system | Already installed |
| lucide-react | latest | Icon library for all UI icons | Already installed |
| Radix UI | various | Dialog, Select, Progress, Alert Dialog primitives | Already installed |
| react-hook-form + zod | v5/v3 | Form validation (for floating label + shake pattern) | Already installed |

### Supporting (Already in Codebase)

| Library | Purpose | Location |
|---------|---------|----------|
| `motion-tokens` | Spring presets, stagger, hover, variants, tap | `src/lib/motion-tokens/` |
| `Skeleton` component | Shimmer/pulse/wave/grain loading states | `src/components/ui/skeleton/` |
| `EmptyState` component | Variant-based empty states with icons | `src/components/ui/EmptyState.tsx` |
| `AnimatedValue` | Spring-based counting animation for numbers | `src/components/ui/admin/AdminDashboard/AnimatedValue.tsx` |
| `SaveButton` | Morphing save button (idle/saving/success) | `src/components/ui/admin/settings/SaveButton.tsx` |
| `FloatingUnsavedBar` | Fixed bottom bar for unsaved changes | `src/components/ui/admin/settings/FloatingUnsavedBar.tsx` |
| `ExpandableTableRow` | Expandable row with preview panels | `src/components/ui/admin/ExpandableTableRow/` |
| `useAnimationPreference` | Respects prefers-reduced-motion | `src/lib/hooks/useAnimationPreference` |

### New Libraries: NONE

No new dependencies needed. The entire phase uses existing codebase infrastructure.

## Architecture Patterns

### Existing File Structure (Admin)

```
src/
├── app/(admin)/admin/
│   ├── layout.tsx              # Server: auth check, AdminNav, bg-cream
│   ├── page.tsx                # Dashboard (SSR, KPI cards, charts)
│   ├── orders/page.tsx         # Client: fetch, filter, OrdersTable
│   ├── drivers/page.tsx        # Client: fetch, filter, DriverListTable
│   ├── drivers/[id]/page.tsx   # Client: DriverDetailClient
│   ├── routes/page.tsx         # Client: fetch, filter, RouteListTable
│   ├── routes/[id]/page.tsx    # Client: RouteDetailClient
│   └── settings/page.tsx       # Client: SettingsClient
├── app/(driver)/driver/
│   ├── layout.tsx              # Server: auth, DriverShell, DriverNav
│   ├── page.tsx                # SSR: DriverDashboard
│   ├── route/page.tsx          # SSR: ActiveRouteView
│   ├── route/[stopId]/page.tsx # SSR: StopDetailView
│   └── history/page.tsx        # SSR: route history list
└── components/ui/
    ├── admin/                  # Admin-specific components
    ├── driver/                 # Driver-specific components
    └── skeleton/               # Reusable skeleton primitives
```

### Pattern 1: Skeleton-to-Content Crossfade

**What:** Replace `animate-pulse` loading with Skeleton shimmer, then crossfade to real content.
**When:** Every page that shows loading state.
**Existing pattern in codebase:** `AdminDashboard` and `RouteDetailClient` already use `<Skeleton>` component.

```typescript
// Source: codebase pattern from AdminDashboard + Skeleton component
import { m, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

function PageContent({ isLoading, children }) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <m.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PageSkeleton />
        </m.div>
      ) : (
        <m.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
```

### Pattern 2: Card Row with Staggered Entry

**What:** Card-based table rows with 40ms stagger, scale+shadow hover, 12px radius.
**Existing pattern:** `staggerContainer` + `staggerItem` from `motion-tokens/stagger.ts`.

```typescript
// Card row with CONTEXT.md specs: 1.01 scale, shadow lift, 12px radius
import { m } from "framer-motion";
import { staggerContainer, staggerItem, STAGGER_GAP } from "@/lib/motion-tokens";

// Container: 40ms stagger (context says 40ms, codebase default is 80ms -- override)
const cardContainer = staggerContainer(0.04, 0.06);

// Item: card row with hover
<m.div
  variants={staggerItem}
  whileHover={{ scale: 1.01, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
  className="rounded-xl p-4 bg-surface-primary border border-border"
/>
```

### Pattern 3: Floating Label Input (Auth Pattern Reuse)

**What:** Labels animate from inside input to above on focus.
**Existing pattern:** `MagicLinkForm.tsx` lines 92-125 use `peer` + `peer-focus` + `peer-[:not(:placeholder-shown)]`.

```tsx
// Source: src/components/ui/auth/MagicLinkForm.tsx
<div className="relative group">
  <input
    placeholder=" "
    className="peer w-full rounded-2xl border bg-surface-secondary/50 pl-11 pr-4 pt-6 pb-2"
  />
  <label className={cn(
    "absolute left-11 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
    "transition-all duration-200 pointer-events-none",
    "peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary peer-focus:font-medium",
    "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
  )}>
    Label text
  </label>
</div>
```

### Pattern 4: Animated Count Badge

**What:** Page title badge with number counting up on load.
**Existing pattern:** `AnimatedValue` component uses `useSpring` + `useTransform`.

```typescript
// Source: src/components/ui/admin/AdminDashboard/AnimatedValue.tsx
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";

// In page header:
<h1>Orders <AnimatedValue value={orders.length} format="number" className="..." /></h1>
```

### Pattern 5: Slide-in Drawer Overlay

**What:** Row detail as a side panel (replaces in-table expansion for premium feel).
**Existing pattern:** `overlay.drawer` variant in `motion-tokens/variants.ts`.

```typescript
// Source: src/lib/motion-tokens/variants.ts
import { overlay } from "@/lib/motion-tokens";

<m.div
  variants={overlay.drawer}
  initial="initial"
  animate="animate"
  exit="exit"
  className="fixed right-0 top-0 bottom-0 w-[480px] bg-surface-primary shadow-2xl z-50"
/>
```

### Anti-Patterns to Avoid

- **`animate-pulse` for loading states:** Phase explicitly bans this (POLH-01). Use `<Skeleton variant="shimmer">` instead.
- **Infinite CSS animations on mobile:** Past crashes documented in ERROR_HISTORY.md. Bound all repeat animations (`repeat: 10` max, never `Infinity`).
- **`backdrop-blur` on mobile:** Causes Safari crashes per learnings. Use solid backgrounds on mobile, blur only on `sm:` breakpoint.
- **setTimeout without cleanup:** Must use `useSafeTimeout` or ref-tracked pattern per Phase 35 cleanup audit.
- **Event handlers in useCallback with changing deps:** Define handlers inside `useEffect`, not with `useCallback` + state deps.
- **New tokens without `@theme inline`:** Any new Tailwind utility classes MUST be registered in `@theme inline` block in `globals.css`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring/bounce animations | Custom keyframes | `spring.*` from `motion-tokens/core.ts` | 10+ tested presets already exist |
| Stagger animations | Manual delay calculations | `staggerContainer()` + `staggerItem` | Handles cap at 500ms, exit stagger |
| Skeleton loading | Custom `animate-pulse` divs | `<Skeleton>` from `skeleton/base.tsx` | Shimmer, reduced motion, grain support |
| Empty states | Inline "no data" text | `<EmptyState variant="...">` | Consistent icons, animations, CTAs |
| Counting numbers | `setInterval` counter | `<AnimatedValue>` | Spring physics, format support |
| Save button morph | Custom state machine | `<SaveButton>` | Tested idle/saving/success flow |
| Unsaved changes bar | Custom bottom bar | `<FloatingUnsavedBar>` | AnimatePresence, spring entry |
| Floating labels | Custom label positioning | CSS `peer` pattern from MagicLinkForm | Pure CSS, no JS, accessible |
| Hover effects | Custom whileHover configs | `hover.*` from `motion-tokens/variants.ts` | Consistent lift/scale/glow |
| Toast notifications | Custom toast system | Existing `Toast` + `useToast` | Stacking, dismiss, portal |

**Key insight:** This phase is 100% visual polish using existing infrastructure. The codebase has mature animation, skeleton, and empty state systems. The work is applying these consistently, not building new systems.

## Common Pitfalls

### Pitfall 1: Mobile Crash from Animation Cleanup

**What goes wrong:** Infinite animations or untracked timeouts cause mobile browsers to crash on component unmount.
**Why it happens:** Phase 35 documented 8+ files with this pattern. Animation-heavy phases are highest risk.
**How to avoid:**
1. All `repeat` values must be finite (max 10, never `Infinity`)
2. All `setTimeout` must use ref tracking + cleanup effect
3. No `backdrop-blur` on mobile (use `sm:backdrop-blur-*` only)
4. Test overlay close on actual iOS devices
**Warning signs:** White screen on modal close, page refresh on drawer close.

### Pitfall 2: Layout Shift During Skeleton-to-Content Transition

**What goes wrong:** Content pops in at different height than skeleton, causing page jump.
**Why it happens:** Skeleton doesn't match the exact DOM structure of loaded content.
**How to avoid:** Match skeleton to exact heights, padding, grid structure of real content. Use `AnimatePresence mode="wait"` for clean crossfade.
**Warning signs:** Page scrollbar jumping, content below loading area shifting.

### Pitfall 3: Tailwind Token Not Generating Utility

**What goes wrong:** New color/spacing tokens resolve to transparent/0px.
**Why it happens:** Token added to `tokens.css` but not registered in `@theme inline` block in `globals.css`.
**How to avoid:** Every new token gets BOTH: `tokens.css` definition AND `@theme inline` self-reference.
**Warning signs:** Element invisible, computed style shows `transparent`, `0px`, or fallback value.

### Pitfall 4: Admin Color Scheme Inconsistency

**What goes wrong:** Some admin pages use `brand-red` / `saffron` / `curry` (customer/old colors) while Phase 57 mandates teal/cyan.
**Why it happens:** Admin pages were built at different times with different color conventions.
**How to avoid:** Audit all admin pages for color references. Replace `brand-red`, `saffron`, `curry` with teal accent palette in admin context. Use `--color-accent-teal` (already in tokens.css: `#00979D` light, `#2DD4DB` dark).
**Warning signs:** Mixed red/teal accents on same page.

### Pitfall 5: Hardcoded On-Time Percentage

**What goes wrong:** Driver history shows "98%" regardless of actual performance.
**Why it happens:** Line 57 of `driver/history/page.tsx`: `const onTimePercentage = 98;`
**How to avoid:** Compute from `route_stops` by comparing `delivered_at` (or stop completion) against `delivery_window_end`. Need to check if these timestamps exist in the database.
**Warning signs:** All drivers showing identical on-time rates.

### Pitfall 6: Card Row vs Table Migration Scope

**What goes wrong:** Switching from `<Table>` to card layout breaks existing functionality (sorting, expandable rows, dropdowns).
**Why it happens:** `<Table>` components provide semantic structure that card divs don't.
**How to avoid:** Keep card rows as styled divs but preserve all interactive features. The `ExpandableTableRow` component (already used in drivers/routes) provides a good model. OrdersTable needs the most work -- it uses raw `<Table>` without expandable pattern.
**Warning signs:** Sort clicking does nothing, expanded content not animating.

## Code Examples

### Skeleton Replacement Pattern (Orders Page)

```typescript
// BEFORE: animate-pulse (POLH-01 violation)
if (loading) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-muted rounded" />
    </div>
  );
}

// AFTER: Shimmer skeleton with crossfade
import { Skeleton } from "@/components/ui/skeleton";
import { m, AnimatePresence } from "framer-motion";

// Skeleton component matching real layout
function OrdersPageSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} height={36} radius="lg" />
          <Skeleton width={280} height={20} radius="md" />
        </div>
        <Skeleton width={120} height={40} radius="lg" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={100} height={28} radius="full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={72} radius="xl" />
        ))}
      </div>
    </div>
  );
}
```

### Card Row with Status Tint

```typescript
// Status-based background tint per CONTEXT.md
const STATUS_TINTS: Record<OrderStatus, string> = {
  pending: "bg-secondary/[0.03]",        // amber wash
  confirmed: "bg-accent-teal/[0.03]",    // teal wash
  preparing: "bg-accent-magenta/[0.03]", // purple wash
  out_for_delivery: "bg-primary/[0.03]", // red wash
  delivered: "bg-green/[0.03]",          // green wash
  cancelled: "bg-surface-tertiary/50",   // gray wash
};
```

### Animated Status Badge (Soft Pulse for Active States)

```typescript
// Active states pulse, terminal states static
const isActiveStatus = ["pending", "confirmed", "preparing", "out_for_delivery"].includes(status);

<m.div
  animate={isActiveStatus ? {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
  } : undefined}
  transition={isActiveStatus ? { duration: 2, repeat: 5 } : undefined}
>
  <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
</m.div>
```

### On-Time Percentage Computation

```typescript
// Source: driver history page needs to replace hardcoded 98
// Compute from route_stops: count stops delivered within delivery_window_end
const onTimeStops = stops.filter(stop => {
  if (stop.status !== "delivered" || !stop.delivered_at || !stop.order?.delivery_window_end) return false;
  return new Date(stop.delivered_at) <= new Date(stop.order.delivery_window_end);
});
const onTimePercentage = totalDelivered > 0
  ? Math.round((onTimeStops.length / totalDelivered) * 100)
  : 0;
```

## Codebase-Specific Findings

### Files Requiring animate-pulse Removal (Admin/Driver Scope)

| File | Location | Current Pattern |
|------|----------|-----------------|
| `(admin)/admin/orders/page.tsx` | Lines 128-136 | 3 pulse divs |
| `(admin)/admin/drivers/page.tsx` | Lines 174-189 | 4 stat skeletons + table |
| `(admin)/admin/routes/page.tsx` | Lines 175-190 | 4 stat skeletons + table |
| `(admin)/admin/drivers/[id]/page.tsx` via `DriverDetailClient.tsx` | Lines 175-198 | Full page pulse |
| `(driver)/driver/page.tsx` | Lines 133-165 | Greeting + route + stats |
| `(driver)/driver/history/page.tsx` | Lines 69-98 | Stats + routes |
| `(driver)/driver/route/page.tsx` | Lines 152-180 | Progress + stops |
| `(driver)/driver/route/[stopId]/page.tsx` | Lines 148-182 | Header + sections |
| `admin/AdminDashboard/KPISkeleton.tsx` | Already uses Skeleton | OK -- keep |
| `admin/settings/SettingsClient/SettingsSkeleton.tsx` | Already uses Skeleton | OK -- keep |

### Existing Empty State Variants

| Variant | Exists | Page |
|---------|--------|------|
| `admin-orders` | YES | EmptyState.tsx |
| `driver-route` | YES | EmptyState.tsx |
| `exceptions` | YES | EmptyState.tsx |
| Admin drivers empty | Inline in DriverListTable | Needs migration |
| Admin routes empty | Inline in RouteListTable | Needs migration |
| Driver history empty | Inline in history page | Needs migration |

### Pages Needing Teal Color Migration

| Page | Current Accent | Target |
|------|---------------|--------|
| `admin/orders/page.tsx` | `brand-red` | `accent-teal` / `primary` (admin context) |
| `admin/routes/page.tsx` | `saffron` / `curry` | `accent-teal` |
| Admin dashboard quick actions | `brand-red` | `accent-teal` |
| Admin sidebar active state | `primary` (red) | Decision: keep or teal? |

**Recommendation (Claude's Discretion):** The admin sidebar and KPI cards currently use `primary` (red) as accent. CONTEXT.md says "admin uses teal/cyan accent." This means replacing `primary` color references in admin pages with `accent-teal`. However, the sidebar `AdminNav.tsx` uses generic `primary` token -- consider whether to:
1. Override `--color-primary` for admin route group (complex, CSS cascade)
2. Replace `primary` with explicit `accent-teal` references in admin components (simpler, more files)

**Recommendation:** Option 2 -- explicit `accent-teal` replacement. Simpler, no cascade issues, and `primary` (red) stays available for critical/destructive actions.

### Existing AnimatedValue Reuse Map

The `AnimatedValue` component already supports: `number`, `currency`, `percentage`, `duration` formats. This covers all stat card needs:
- Orders count: `format="number"`
- Revenue: `format="currency"`
- On-time rate: `format="percentage"`
- Active drivers: `format="number"`
- Avg delivery time: `format="duration"`

### Toast System Assessment

Current toast (`src/components/ui/Toast.tsx`) uses V8 system with:
- Portal rendering
- Right-side slide-in animation
- Type-based colors (success/error/warning/info)
- AnimatePresence for enter/exit

CONTEXT.md wants: top-right floating cards, stacking with "+N more" badge, swipe dismiss, sounds for critical.
**Gap:** Current system is basic. Needs: stacking collapse logic, swipe gesture, Web Audio API for chime.

### Form Components Needing Floating Labels

| Form | File | Current Input Style |
|------|------|-------------------|
| Settings forms | `OperationsSettingsForm.tsx`, `DeliverySettingsForm.tsx`, `NotificationSettingsForm.tsx`, `EmailSettingsForm.tsx` | Standard `<Input>` |
| Edit Driver Modal | `EditProfileModal.tsx` | Standard `<Input>` |
| Create Route Modal | `CreateRouteModal.tsx` | Standard `<Input>` + `<Select>` |
| Add Driver Modal | `AddDriverModal.tsx` | Standard `<Input>` |
| Invite Driver Modal | `InviteDriverModal.tsx` | Standard `<Input>` |

**Approach:** Create a `FloatingLabelInput` wrapper component that reuses the `peer` CSS pattern from `MagicLinkForm.tsx`, then replace `<Input>` instances in admin forms.

## Discretion Recommendations

### Shimmer Direction & Color
- **Direction:** Left-to-right (matches existing `bg-gradient-shimmer` in codebase)
- **Color:** Use existing `surface-tertiary` base with shimmer gradient (already configured)
- **Min display time:** 300ms minimum before crossfade to prevent flash
- **Initial vs refresh:** Initial = full skeleton, refresh = subtle inline spinner or thin top bar

### On-Time Visualization
- **Recommendation:** Circular progress ring (donut chart style) with percentage in center
- Rationale: Compact, works at card-small size, strong visual impact
- Implementation: SVG `<circle>` with `stroke-dasharray` animated via Framer Motion

### Bulk Action Checkboxes
- **Recommendation:** Skip for now. Admin volume is a small restaurant delivery app (5-20 orders/day, 3-10 drivers). Bulk actions add complexity without proportional value.
- Add if: order volume exceeds 50/day consistently

### Filtered-to-Empty vs Truly-Empty
- **Recommendation:** Distinguish with different messaging:
  - Truly empty: "The kitchen is quiet... for now" + CTA to create
  - Filtered empty: "No matches for this filter" + CTA to clear filter
  - Both use same `<EmptyState>` component with different props

### Animation Timing
- **Stagger gap:** 40ms per CONTEXT.md (override codebase default 80ms)
- **Crossfade:** 200ms (matches `transition.fast`)
- **Spring preset:** `spring.gentle` for card hover, `spring.snappy` for buttons, `spring.default` for entries
- **Status badge pulse:** 2s cycle, 5 repeats (not infinite)

## Open Questions

1. **Admin accent color scope**
   - What we know: CONTEXT.md says "admin uses teal/cyan accent"
   - What's unclear: Does this include the sidebar active indicator (currently red `primary`)?
   - Recommendation: Replace admin page accents with teal, but keep sidebar `primary` for brand consistency. Mark as discretion.

2. **On-time data availability**
   - What we know: `route_stops` table has `status` and `eta` columns. Orders have `delivery_window_start/end`.
   - What's unclear: Is there a `delivered_at` timestamp on `route_stops`? The `status` field tracks `pending | in_transit | arrived | delivered | skipped | failed`.
   - Recommendation: Check database schema. If no `delivered_at`, use `updated_at` as proxy, or add migration.

3. **Google Maps embed in route detail**
   - What we know: `RouteDetailClient` already has `LazyRouteMap` with stops and polyline
   - What's unclear: Is CONTEXT.md's "interactive Google Maps embed" referring to the existing map or a new one?
   - Recommendation: Polish existing `LazyRouteMap` component with premium styling (rounded corners, shadow, loading animation). It already uses Google Maps.

4. **Sound system for toasts**
   - What we know: CONTEXT.md wants "subtle chime for new orders and exceptions"
   - What's unclear: Web Audio API availability, iOS autoplay restrictions
   - Recommendation: Use `AudioContext` with short WAV buffers. Must be triggered by user gesture first (iOS requirement). Existing codebase has AudioContext patterns in `use-card-sound.ts`.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: 50+ files read across admin, driver, components, motion-tokens, skeleton system
- `src/lib/motion-tokens/` -- full token system (core, stagger, variants, effects, cards, scroll)
- `src/components/ui/skeleton/` -- base, table, card, text skeleton primitives
- `src/components/ui/EmptyState.tsx` -- variant-based empty state system
- `src/components/ui/admin/AdminDashboard/` -- KPICard, AnimatedValue, KPISkeleton
- `.claude/ERROR_HISTORY.md` -- mobile crash patterns from animation phases
- `.claude/learnings/animation.md` -- skeleton structure, cleanup patterns
- `.claude/learnings/tailwind-v4.md` -- `@theme inline` requirement, token registration

### Secondary (MEDIUM confidence)
- Phase 57 CONTEXT.md decisions -- user-locked specifications
- Existing patterns: MagicLinkForm floating labels, SaveButton morph, FloatingUnsavedBar

### Tertiary (LOW confidence)
- Web Audio API for toast sounds -- needs iOS testing validation
- On-time percentage computation -- needs database schema verification for `delivered_at` column

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- 100% existing codebase libraries, zero new dependencies
- Architecture: HIGH -- all patterns already exist in codebase, just need consistent application
- Pitfalls: HIGH -- documented from past phases (ERROR_HISTORY.md, learnings/)
- On-time computation: MEDIUM -- need DB schema verification
- Toast sounds: LOW -- iOS autoplay restrictions need testing

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable -- no external dependencies)
