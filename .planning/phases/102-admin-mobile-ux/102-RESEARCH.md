# Phase 102: Admin Mobile UX - Research

**Researched:** 2026-03-16
**Domain:** Responsive CSS, mobile-first layout, touch UX, component extraction
**Confidence:** HIGH

## Summary

Phase 102 is a CSS/layout-only phase with one new API endpoint. No database migrations, no new feature logic, no new dependencies. The work decomposes into: (1) prerequisite file extractions to stay under the 400-line ESLint limit, (2) sidebar-to-drawer navigation conversion, (3) six table-to-card responsive conversions, (4) touch target sweep across 22 admin pages, and (5) a new route progress widget with polling.

The codebase already contains every pattern needed. `OrdersTable.tsx` demonstrates `hidden sm:flex` header + card layout. `Drawer.tsx` supports `position="left"` with `width="sm"`. `useOpsPolling.ts` shows the exact 5s polling hook pattern. `RouteStatsBar.tsx` has stats_json calculation with fallback. `useAnimationPreference()` gates Framer Motion animations for reduced-motion compliance. No external research needed -- this phase is purely internal pattern replication.

**Primary recommendation:** Execute prerequisite extractions first (Drawer cleanup, photos page split), then proceed with layout work in order: navigation, tables, touch targets, widget. Each wave is self-contained and independently verifiable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Navigation**: Left drawer (NOT bottom nav) triggered by hamburger in new mobile header bar
- **Mobile header**: Sticky h-14, fixed position with safe-area-inset, hamburger (left) | page title (center) | optional action slot (right)
- **Admin layout**: Server Component stays unchanged; `AdminMobileHeader.tsx` is a client island; CSS `hidden md:block` / `md:hidden` pattern (NO `useMediaQuery`)
- **Tables to cards**: Per-table inline responsive branches (NO shared `AdminMobileCard` wrapper); all key fields shown on mobile (NO "expand" drawer)
- **Touch targets**: Mobile-only override strategy (`h-11 md:h-9`); preserves desktop information density
- **Route progress widget**: New component in `src/components/ui/admin/ops/`; 5s polling via new `GET /api/admin/ops/routes-progress` endpoint; `stats_json` confirmed fresh
- **Prerequisite extractions**: Photos page MUST extract into subfolder; Drawer.tsx MUST remove deprecated BottomSheet alias
- **Scope**: All 22 admin pages get mobile pass; modals test as-is; route builder map gets padding only
- **Scroll architecture**: Single scroll container (admin `<main>` element); NO nested `overflow-y-auto` on card wrappers
- **Framer Motion**: Disable `layoutId` in drawer variant; add `useAnimationPreference()` to 17 files / 31 animation instances

### Claude's Discretion
- Exact mobile card layout dimensions and spacing per table
- Mobile header animation parameters
- Progress bar styling (colors, border-radius, height)
- Widget grid gap and card padding
- Drawer open/close animation parameters (reuse existing defaults)
- Order of page-by-page touch target sweep
- Whether to extract inline tables into separate files during card conversion (only if approaching 400-line limit)
- Progress bar hatched/striped pattern implementation (CSS background or SVG)
- Exact responsive breakpoint for widget grid columns
- Whether AdminNav drawer variant strips Framer Motion layoutId
- Whether SectionEditor needs extraction before or during responsive work
- Exact safe-area-inset application method

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOBL-01 | Admin sidebar converts to drawer/bottom nav on mobile | AdminNav variant prop + Drawer component reuse + AdminMobileHeader client island; all patterns verified in codebase |
| MOBL-02 | Admin tables convert to card layouts on mobile | 6 tables identified; OrdersTable provides reference pattern; two conversion strategies (flex-based vs HTML table); line budgets confirmed |
| MOBL-03 | All admin touch targets meet 44px minimum | Interactive element audit complete (7 element types, ~130 instances); mobile-only override pattern (`h-11 md:h-9`) verified via Button component sizes |
| MOBL-04 | Route progress widget on ops dashboard | RouteStatsBar + useOpsPolling provide exact patterns; stats_json freshness confirmed across 4 code paths; insertion point identified in OpsCenter.tsx L136-139 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS v4 | v4 | Responsive classes, spacing, breakpoints | Project standard; `@theme inline` is source of truth |
| Framer Motion | existing | Drawer animations, stagger, reduced-motion | Already used across all admin components |
| Radix UI | existing | Progress primitive, Dialog (modals) | shadcn/ui foundation |
| Lucide React | existing | Menu icon, nav icons, widget icons | Project icon library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useAnimationPreference` | custom hook | Reduced-motion gate | Every Framer Motion animation in admin pages |
| `useRouteChangeClose` | custom hook | Auto-close drawer on navigation | Drawer component uses internally |
| `useBodyScrollLock` | custom hook | Lock body scroll when drawer open | Drawer component uses internally |

### Alternatives Considered
None. This phase uses exclusively existing project infrastructure. No new dependencies.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/ui/admin/
  AdminNav.tsx                    # Modified: variant prop
  AdminMobileHeader.tsx           # NEW: client island
  ops/
    RouteProgressWidget.tsx       # NEW: widget component
    useRouteProgressPolling.ts    # NEW: polling hook
    OpsCenter.tsx                 # Modified: widget insertion
src/app/api/admin/ops/
  routes-progress/
    route.ts                      # NEW: lightweight API endpoint
src/app/(admin)/admin/
  layout.tsx                      # Modified: responsive flex + header import
  photos/
    PhotosPage/                   # NEW: extracted subfolder
      index.tsx
      PhotoGrid.tsx
      PhotoMetadata.tsx
```

### Pattern 1: CSS-Only Responsive Visibility
**What:** Use Tailwind `hidden md:block` / `md:hidden` to switch between mobile and desktop layouts
**When to use:** Every responsive switch in this phase
**Example:**
```typescript
// Source: OrdersTable.tsx L204 (established pattern)
// Desktop header
<div className="hidden sm:flex items-center gap-4 sticky top-0">...</div>
// Mobile cards render in the same component, always in DOM
// CSS handles visibility -- SSR-safe, no hydration mismatch
```

### Pattern 2: Mobile-Only Touch Target Override
**What:** Responsive height classes that expand on mobile, compact on desktop
**When to use:** Every interactive element below 44px
**Example:**
```typescript
// Source: Button component sizes (button.tsx L106-114)
// Button size="sm" is h-9 (36px) -- below 44px minimum
// Override on mobile: className="h-11 md:h-9"
// Icon-only: className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
```

### Pattern 3: Client Island in Server Component Layout
**What:** Keep layout.tsx as Server Component, import client components as islands
**When to use:** AdminMobileHeader (needs useState for drawer) inside admin layout
**Example:**
```typescript
// Source: layout.tsx (Server Component, 48 lines)
// Layout stays server component -- auth guard runs server-side
// AdminMobileHeader is a client component island
import { AdminMobileHeader } from "@/components/ui/admin/AdminMobileHeader";
// In JSX:
<AdminMobileHeader /> {/* client island with 'use client' */}
<main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
```

### Pattern 4: Polling Hook Architecture
**What:** setInterval-based polling with ref-based closures to avoid stale state
**When to use:** Route progress widget polling
**Example:**
```typescript
// Source: useOpsPolling.ts (98 lines, exact pattern to mirror)
// Uses useRef for mutable values accessed in interval callback
// useCallback for fetch function
// useEffect for interval setup/cleanup
// Returns typed state object
```

### Pattern 5: File Extraction for 400-Line Limit
**What:** Extract logical sections into co-located sibling files with barrel index
**When to use:** When file approaches 400 lines and responsive branches will add 30-80 lines
**Example:**
```
# Before: admin/photos/page.tsx (396 lines)
# After:
admin/photos/PhotosPage/
  index.tsx          # Barrel re-exports + page-level logic
  PhotoGrid.tsx      # Extracted grid rendering
  PhotoMetadata.tsx  # Extracted metadata panel
```

### Anti-Patterns to Avoid
- **Nested `overflow-y-auto`**: Admin `<main>` is the sole scroll container. Never add `overflow-y-auto` to card wrappers inside pages. This blocks wheel events on desktop (verified learning).
- **`useMediaQuery` for responsive layout**: Causes hydration mismatch. Use CSS classes only.
- **Safe-area as padding**: Use `position: fixed` + `top: calc(env(safe-area-inset-top, 0px))`, not padding (pushes content off-center).
- **`layoutId` across mount points**: AdminNav renders in both sidebar (desktop) and drawer (mobile). Same `layoutId="admin-nav-indicator"` across different mount points causes glitchy cross-mount animation. Disable in drawer variant.
- **Permanent `willChange`**: Creates excess compositor layers. Only set during hover interaction.
- **`backdrop-blur` on mobile**: Performance issue. Drawer already limits to `sm:backdrop-blur-xl`. Mobile header uses solid `bg-neutral-50`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drawer slide animation | Custom CSS transitions or JS | Existing `Drawer.tsx` with `position="left"` | Has spring physics, focus trap, scroll lock, route-aware close, Safari GPU crash prevention |
| Body scroll lock | `overflow: hidden` on body | `useBodyScrollLock` hook | Handles scrollbar compensation, deferred restore for animation safety |
| Animation preference | `prefers-reduced-motion` media query | `useAnimationPreference()` hook | Project uses custom preference system (full/reduced/none), not OS setting |
| Route stats calculation | Client-side stop counting | `stats_json` from database | Pre-computed by `update_route_stats` RPC, confirmed fresh across 4 code paths |
| Polling with stale closure prevention | naive setInterval | `useRef`-based pattern from `useOpsPolling.ts` | Prevents stale state in interval callbacks |
| Touch target wrapper | Custom `<TouchTarget>` component | Responsive Tailwind classes (`min-h-[44px]`) | Per-element responsive classes are simpler and more explicit than a wrapper component |
| Card animation stagger | Custom stagger timing | `cardContainer` / `cardItem` variants from `CardRow.tsx` | Established 40ms stagger with proper physics |

**Key insight:** Every pattern needed already exists in the codebase. This phase is about replicating existing patterns to new contexts, not inventing new solutions.

## Common Pitfalls

### Pitfall 1: Nested Scroll Containers
**What goes wrong:** Adding `overflow-y-auto` to a card wrapper inside admin pages creates a nested scroll container. Wheel events get captured by the inner container but can't scroll it (no resolved height constraint), blocking scroll on the outer `<main>` element.
**Why it happens:** When converting tables to cards, it's tempting to wrap the card list in a scrollable container.
**How to avoid:** Let `<main className="flex-1 overflow-auto">` be the sole scroll container. Card wrappers should have no overflow properties.
**Warning signs:** Desktop: scrollbar visible on inner element; wheel scroll over content area does nothing.

### Pitfall 2: Sections Page Existing Violation
**What goes wrong:** `sections/page.tsx` L311 already has `overflow-auto` on the left panel, nested inside `<main className="flex-1 overflow-auto">` from layout.tsx.
**Why it happens:** Pre-existing code; not caught until this audit.
**How to avoid:** Remove `overflow-auto` from sections page left panel during the responsive pass.
**Warning signs:** Desktop wheel scroll blocked in sections page content area.

### Pitfall 3: CSS Variable Resolution on Mobile
**What goes wrong:** `bg-surface-secondary` may resolve to transparent on mobile if CSS variable tokens haven't loaded yet (race condition with Tailwind v4 `@theme inline`).
**Why it happens:** Mobile Safari lazy-loads CSS custom properties; fixed-position elements render before variables resolve.
**How to avoid:** Use explicit Tailwind colors for mobile-critical fixed elements: `bg-neutral-50 md:bg-surface-secondary`. Documented in UI spec.
**Warning signs:** Mobile header appears transparent/invisible on first paint.

### Pitfall 4: 400-Line Limit Exceeded During Responsive Additions
**What goes wrong:** Adding responsive branches (30-80 lines per table) pushes files over 400 lines, failing ESLint.
**Why it happens:** Six files are already between 265-396 lines. Card conversion adds significant template code.
**How to avoid:** Extract before adding responsive code. Photos (396 lines) MUST extract first. Routes (347), emails (331), sections (363) need monitoring -- extract if approaching 370+.
**Warning signs:** ESLint `max-lines` warning during development.

### Pitfall 5: AdminNav layoutId Cross-Mount Animation
**What goes wrong:** The `layoutId="admin-nav-indicator"` spring animation glitches when AdminNav renders in both sidebar (desktop, always mounted) and drawer (mobile, mount/unmount on open/close).
**Why it happens:** Framer Motion tries to animate between two instances of the same `layoutId` at different mount points.
**How to avoid:** Drawer variant uses simple `bg-accent-teal/10` highlight without `layoutId`. Only sidebar variant keeps `layoutId` animation.
**Warning signs:** Active indicator "flies" across the screen between sidebar and drawer positions.

### Pitfall 6: HTML Table Responsive Conversion
**What goes wrong:** Using `hidden md:flex` on `<thead>` doesn't work because `<thead>` display type is `table-header-group`, not `flex`.
**Why it happens:** HTML table elements have specific display types that override `flex`.
**How to avoid:** For HTML tables (emails, feedback, ratings): wrap entire `<table>` in `hidden md:block`, add separate `md:hidden` card `<div>` rendering the same data.
**Warning signs:** Table headers visible on mobile despite `hidden md:` class.

### Pitfall 7: Emails Page Fragment Key Bug
**What goes wrong:** Line 212 of `emails/page.tsx` wraps `<tr>` in bare `<>` Fragment with `key` on inner `<tr>`, not the Fragment.
**Why it happens:** Pre-existing code pattern.
**How to avoid:** Fix during card conversion by using `<Fragment key={email.id}>` or restructuring map to avoid Fragment wrapper.
**Warning signs:** React warning about missing keys in console.

## Code Examples

### Mobile Header Component Structure
```typescript
// Source: Verified from CONTEXT.md decisions + AcceptDeclineBar.tsx safe-area pattern
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { AdminNav } from "@/components/ui/admin/AdminNav";

export function AdminMobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = deriveTitle(pathname); // lookup table

  return (
    <>
      <header
        className="fixed inset-x-0 z-30 flex h-14 items-center border-b border-border bg-neutral-50 md:bg-surface-secondary px-4 md:hidden"
        style={{ top: "calc(env(safe-area-inset-top, 0px))" }}
      >
        <Button size="icon" variant="ghost" onClick={() => setIsOpen(true)} aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-center font-display text-lg font-bold truncate">{pageTitle}</h1>
        {/* Right action slot -- optional per page */}
        <div className="w-11" /> {/* Spacer to center title */}
      </header>
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} position="left" width="sm" title="Admin navigation">
        <AdminNav variant="drawer" />
      </Drawer>
    </>
  );
}
```

### Admin Layout Responsive Structure
```typescript
// Source: layout.tsx (48 lines, Server Component)
// Modified structure:
<DomMaxProvider>
  <div className="flex min-h-screen bg-cream">
    {/* Desktop sidebar -- hidden on mobile */}
    <div className="hidden md:block">
      <AdminNav />
    </div>
    {/* Mobile header -- hidden on desktop */}
    <AdminMobileHeader />
    {/* Main content with mobile header offset */}
    <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
  </div>
</DomMaxProvider>
```

### Table-to-Card Conversion (Flex-Based)
```typescript
// Source: OrdersTable.tsx L204 established pattern
// Desktop header: hidden on mobile
<div className="hidden md:flex items-center gap-4 px-4 py-2">
  <span className="flex-1 text-xs font-semibold uppercase">Name</span>
  <span className="w-24 text-xs font-semibold uppercase">Status</span>
</div>
// Each row renders both layouts:
{items.map((item) => (
  <div key={item.id} className="rounded-lg border border-border p-3">
    {/* Mobile card */}
    <div className="flex flex-col gap-2 md:hidden">
      <div className="flex items-center justify-between">
        <span className="font-medium w-full">{item.name}</span>
        <StatusBadge status={item.status} />
      </div>
      <span className="text-sm text-text-secondary">{item.detail}</span>
    </div>
    {/* Desktop row */}
    <div className="hidden md:flex items-center gap-4">
      <span className="flex-1">{item.name}</span>
      <span className="w-24"><StatusBadge status={item.status} /></span>
    </div>
  </div>
))}
```

### Table-to-Card Conversion (HTML Table)
```typescript
// Source: UI-SPEC Strategy B for emails/feedback/ratings pages
// Desktop: real HTML table (hidden on mobile)
<div className="hidden md:block overflow-x-auto">
  <table>...</table>
</div>
// Mobile: card layout (hidden on desktop)
<div className="md:hidden space-y-3">
  {items.map((item) => (
    <div key={item.id} className="rounded-lg border border-border p-4">
      {/* Card content */}
    </div>
  ))}
</div>
```

### Route Progress Polling Hook
```typescript
// Source: useOpsPolling.ts (98 lines, mirror this pattern exactly)
export function useRouteProgressPolling(intervalMs = 5000) {
  const [routes, setRoutes] = useState<RouteProgress[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRoutes = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/ops/routes-progress");
      if (!res.ok) return;
      const data = await res.json();
      setRoutes(data);
    } catch { /* silent -- next poll retries */ }
    finally { setIsRefreshing(false); }
  }, []);

  useEffect(() => {
    void fetchRoutes();
    const interval = setInterval(() => void fetchRoutes(), intervalMs);
    return () => clearInterval(interval);
  }, [fetchRoutes, intervalMs]);

  return { routes, isRefreshing, refetch: fetchRoutes };
}
```

### New API Endpoint
```typescript
// Source: Mirrors /api/admin/ops/orders/route.ts structure
// GET /api/admin/ops/routes-progress
// Returns: today's non-completed routes with minimal fields
// Fields: id, status, driver_name, stats_json, started_at, delivery_date
// Query: routes WHERE delivery_date = today AND status != 'completed'
// JOIN: drivers -> profiles (full_name)
// No route_stops JOIN needed -- stats_json has all counts
```

### Touch Target Override Pattern
```typescript
// Source: CustomerContactCard.tsx touch target pattern + Button component sizes
// For Button size="sm" (h-9 = 36px):
<Button size="sm" className="h-11 md:h-9" />

// For icon-only elements (h-6 w-6 = 24px):
<button className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
  <ChevronUp className="h-4 w-4" />
</button>

// For checkboxes (h-5 = 20px) -- transparent padding wrapper:
<label className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
  <Checkbox />
</label>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useMediaQuery` JS breakpoints | CSS `hidden md:block` pattern | Tailwind v3+ | SSR-safe, no hydration mismatch |
| `prefers-reduced-motion` OS query | Custom `useAnimationPreference()` hook | V7 design system | User-controlled preference (full/reduced/none) |
| Single monolithic component files | 400-line max with subfolder extraction | Project convention | Forces decomposition; barrel re-exports maintain imports |
| `window.matchMedia` for responsive | Tailwind responsive utilities | Always | Zero JS overhead for layout switching |

**Deprecated/outdated:**
- `BottomSheet` alias in Drawer.tsx: Deprecated, scheduled for removal in this phase (saves ~13 lines)
- `willChange: "transform"` as permanent style: Replaced by interaction-only pattern (`isHovered ? "transform" : "auto"`)

## Open Questions

1. **AdminNav line count after drawer variant**
   - What we know: Currently 219 lines. Drawer variant adds estimated 40-80 lines.
   - What's unclear: Exact line count depends on how much drawer-specific logic diverges from sidebar.
   - Recommendation: Implement, then extract `NavItemList.tsx` if exceeding 350 lines. Decision point documented in UI spec.

2. **Sections page SectionEditor extraction timing**
   - What we know: 363 lines with 37-line buffer. Responsive additions may add 20-40 lines.
   - What's unclear: Whether responsive work alone will push past 400.
   - Recommendation: Monitor during implementation. Extract only if approaching 370+ lines before responsive additions.

3. **Striped progress bar for skipped stops**
   - What we know: Need visual distinction between delivered (solid) and skipped (striped) segments.
   - What's unclear: CSS repeating-linear-gradient vs SVG pattern for striped segment.
   - Recommendation: CSS `repeating-linear-gradient(45deg, ...)` is simpler, performant, and matches Tailwind utility approach. Use `bg-status-warning/30` as base with stripe pattern overlay.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x (unit) + Playwright (E2E) |
| Config file | `vitest.config.ts` (unit), `playwright.config.ts` (E2E) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOBL-01 | Drawer opens/closes, nav items work, auto-close on route change | E2E | `pnpm test:e2e -- --grep "admin drawer"` | No -- Wave 0 |
| MOBL-01 | Page title derived from pathname correctly | unit | `pnpm test -- AdminMobileHeader` | No -- Wave 0 |
| MOBL-02 | Tables show card layout below 768px, table layout above | E2E | `pnpm test:e2e -- --grep "admin tables responsive"` | No -- Wave 0 |
| MOBL-03 | All interactive elements >= 44px on mobile viewport | E2E | `pnpm test:e2e -- --grep "touch targets"` | No -- Wave 0 |
| MOBL-04 | Route progress widget renders, polls, shows correct data | unit | `pnpm test -- useRouteProgressPolling` | No -- Wave 0 |
| MOBL-04 | Widget API returns today's active routes | unit | `pnpm test -- routes-progress` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm lint && pnpm typecheck && pnpm test`
- **Per wave merge:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/admin-mobile.spec.ts` -- covers MOBL-01, MOBL-02, MOBL-03 (viewport resize, drawer, card layouts, touch targets)
- [ ] `src/components/ui/admin/__tests__/AdminMobileHeader.test.ts` -- covers MOBL-01 page title derivation
- [ ] `src/components/ui/admin/ops/__tests__/useRouteProgressPolling.test.ts` -- covers MOBL-04 polling hook
- [ ] `src/app/api/admin/ops/routes-progress/__tests__/route.test.ts` -- covers MOBL-04 API endpoint

**Note:** CSS `hidden md:` patterns are NOT unit-testable (JSDOM has no layout engine). Responsive visibility assertions require Playwright E2E with viewport manipulation. Touch target size assertions require Playwright `boundingBox()`. The E2E test file is the primary validation artifact for MOBL-01 through MOBL-03.

## Sources

### Primary (HIGH confidence)
- `src/components/ui/admin/AdminNav.tsx` -- 219 lines, current sidebar implementation verified
- `src/app/(admin)/admin/layout.tsx` -- 48 lines, Server Component layout verified
- `src/components/ui/Drawer.tsx` -- 402 lines, full API verified (position, width, hooks, animations)
- `src/components/ui/admin/OrdersTable.tsx` -- 296 lines, reference responsive pattern verified
- `src/components/ui/admin/ops/useOpsPolling.ts` -- 98 lines, polling hook pattern verified
- `src/components/ui/admin/routes/RouteStatsBar.tsx` -- 113 lines, stats_json rendering verified
- `src/components/ui/admin/ops/OpsKPIGrid.tsx` -- 140 lines, animation preference pattern verified
- `src/components/ui/button.tsx` -- size variants verified (sm=h-9, md=h-11, icon=h-11 w-11)
- `src/components/ui/progress.tsx` -- Progress bar component verified (spring animation, scaleX)
- `src/components/ui/admin/StatusBadge.tsx` -- 5 route statuses verified
- `src/components/ui/admin/CardRow.tsx` -- cardContainer/cardItem stagger variants verified
- `src/types/driver.ts` -- RouteStats interface verified (7 fields)
- `src/lib/utils/route-transformers.ts` -- transformRouteForList output shape verified
- `src/app/api/admin/ops/orders/route.ts` -- API pattern for new endpoint verified
- `src/app/api/admin/routes/route.ts` -- Routes data model and query pattern verified
- `.claude/learnings/mobile-ux.md` -- 8 mobile UX learnings verified
- `.planning/phases/102-admin-mobile-ux/102-CONTEXT.md` -- All decisions and canonical refs
- `.planning/phases/102-admin-mobile-ux/102-UI-SPEC.md` -- Approved UI design contract

### Secondary (MEDIUM confidence)
- File line counts verified via `wc -l` across 10 files

### Tertiary (LOW confidence)
- None. All findings from direct codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new dependencies
- Architecture: HIGH -- all patterns exist in codebase with working reference implementations
- Pitfalls: HIGH -- every pitfall sourced from project learnings files or codebase audit
- Validation: MEDIUM -- E2E tests for responsive behavior need Playwright viewport manipulation; pattern exists in codebase but specific admin mobile tests need creation

**Research date:** 2026-03-16
**Valid until:** Indefinite (purely internal codebase patterns, no external dependency concerns)
