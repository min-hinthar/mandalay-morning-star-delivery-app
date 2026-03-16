# Phase 102: Admin Mobile UX - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Solo operator can run all Saturday kitchen operations from a phone without pinching, scrolling sideways, or missing touch targets. Covers: sidebar-to-drawer conversion, tables-to-cards for 6 admin data tables, 44px touch target sweep across all 22 admin pages, route progress widget on ops dashboard, responsive padding fixes, and prerequisite file extractions to stay under 400-line limit. Does NOT cover: new features, route builder map redesign, admin page logic changes, push notifications, or new admin capabilities.

</domain>

<decisions>
## Implementation Decisions

### Navigation: Left Drawer (MOBL-01)
- Left-side drawer on mobile (NOT bottom nav) — 12 nav items won't fit bottom nav, and driver pages already use bottom nav for role distinction
- Reuse existing Drawer component with `position="left"`, `width="sm"` (256px = matches sidebar width)
- Desktop: current sidebar unchanged (hidden below `md:` breakpoint)
- Mobile: drawer triggered by hamburger in new mobile header bar
- Drawer auto-closes on navigation via existing `useRouteChangeClose` hook
- AdminNav accepts `variant: "sidebar" | "drawer"` prop — same nav items, different container
- Active indicator animation (`layoutId="admin-nav-indicator"`) works in both modes — BUT verify AnimatePresence doesn't run layout animation when switching between sidebar/drawer instances (different mount points). If it breaks, use `layoutId` only in sidebar mode, simple highlight in drawer mode.
- Collapse state stays ephemeral (`useState`) — no localStorage/Zustand persistence
- "Exit Admin" link included in drawer footer (same as sidebar)
- Drawer swipe-to-close: left drawer has no built-in swipe (only bottom sheets do per learnings) — rely on backdrop tap + X button for close

### Mobile Header Bar (MOBL-01)
- New sticky header bar at top of admin layout on mobile (hidden above `md:`)
- Layout: hamburger button (left) | page title (center) | optional action slot (right)
- Height: h-14 (56px) — use `position: fixed` with `top: env(safe-area-inset-top, 0px)` NOT padding (per learnings/mobile-ux.md "Safe Area Inset: Position Not Padding")
- Background: `bg-surface-secondary border-b border-border` (matches sidebar)
- Page title derived from route segment via `usePathname()` (e.g., `/admin/orders` → "Orders")
- Optional right-side action button slot for page-specific primary actions (e.g., "Add" on menu page)
- No breadcrumbs — flat nav structure doesn't warrant breadcrumb depth
- Hamburger button: 44px touch target, `Menu` icon from Lucide
- `'use client'` directive required since it uses `usePathname()` and `useState` for drawer

### Admin Layout Changes (MOBL-01)
- Layout switches at `md:` breakpoint:
  - `md:` and above: `flex` layout with sidebar + main content (current behavior)
  - Below `md:`: stacked layout with mobile header + main content (no sidebar)
- Main content area: `pt-14 md:pt-0` to account for fixed mobile header
- Use CSS `hidden md:block` / `md:hidden` pattern (not `useMediaQuery`) — SSR-safe, no hydration mismatch
- DomMaxProvider wraps both variants (no change)
- **IMPORTANT**: Admin layout is currently a Server Component. Adding mobile header (which needs `useState` for drawer open state) requires extracting a `AdminLayoutClient.tsx` wrapper or using the existing AdminNav as the client boundary. Recommendation: create `AdminMobileHeader.tsx` as a separate client component imported into layout — layout stays server component, mobile header is client island.

### Prerequisite File Extractions (400-line limit)
**MUST complete before adding responsive branches. These are blocking.**

| File | Current Lines | Buffer | Action Required |
|------|--------------|--------|-----------------|
| `admin/photos/page.tsx` | 396 | 4 lines | **CRITICAL**: Extract into subfolder (`PhotosPage/index.tsx` + `PhotoGrid.tsx` + `PhotoMetadata.tsx`) |
| `Drawer.tsx` | 402 | -2 (over!) | Remove deprecated `BottomSheet` alias at bottom (saves ~13 lines), or extract into `Drawer/index.tsx` subfolder |
| `admin/sections/page.tsx` | 363 | 37 lines | Extract `SectionEditor` modal into separate file if responsive additions approach limit |
| `admin/routes/page.tsx` | 347 | 53 lines | Extract stats/header section into `RoutePageHeader.tsx` if responsive branches approach limit |
| `admin/page.tsx` (Dashboard) | 342 | 58 lines | May need extraction if KPI grid responsive logic is significant |
| `admin/emails/page.tsx` | 331 | 69 lines | Adding card conversion adds ~40-60 lines; tight but may fit |

### Tables to Cards (MOBL-02)
- Per-table inline responsive branches — no shared `AdminMobileCard` wrapper component
- Each table has different fields and priorities; abstraction adds no value
- Use established pattern: `hidden md:flex` table header + mobile card below `md:` breakpoint
- Show all key fields on mobile cards (no "expand" drawer — admin needs info at a glance during Saturday ops)
- 6 tables need card conversion:

#### MenuItemsTable (co-located in admin/menu/, ~250 lines)
- Mobile card: photo thumbnail (48px square) | name + category | price | active/sold-out toggle
- Toggle switches need 44px touch targets on mobile
- Sort/filter controls above table: stack vertically on mobile
- **Gotcha**: Menu page uses `m.div` stagger animations with `initial={{ opacity: 0 }}` — NO lazy-loaded images inside these (photos use Next/Image with explicit src), so `loading="lazy"` bug does NOT apply here

#### CategoriesTable (co-located in admin/categories/, ~265 lines)
- Mobile card: category name | item count badge | active toggle | sort up/down buttons
- Sort buttons: side-by-side, 44px each, on right edge of card
- **Worst touch offender**: sort up/down buttons are `h-6 w-6 p-0` (24px) — need 44px wrapper
- No horizontal scroll needed — all fields fit in card layout

#### RouteListTable (co-located in admin/routes/, ~348 lines — TIGHT)
- Mobile card: date + route name | driver name | status badge | progress (delivered/total)
- Progress shown as text "4/7" with small inline progress bar
- Clickable entire card (navigates to route detail)
- **Existing responsive classes**: Already has `md:p-8`, `md:flex-row`, `sm:inline`, `md:grid-cols-2`
- **Line budget concern**: 53-line buffer. Card conversion adds ~30-50 lines. May need to extract `RoutePageHeader` or `RouteFilters` into sibling component.

#### Email Log (inline in emails/page.tsx, 331 lines)
- Mobile card: status icon + recipient | email type badge | date | resend button
- Resend button: 44px touch target, right-aligned
- Filter controls: stack vertically above cards on mobile
- **Already has responsive classes**: `hidden md:` column headers (L200, L204)
- Uses HTML `<table>` — needs conversion to flex/grid cards on mobile while keeping table on desktop

#### Feedback Table (inline in feedback/page.tsx, 287 lines)
- Mobile card: star rating display | customer name | date | message excerpt (2 lines truncated)
- Clickable to expand full message (inline expand, not navigation)
- **Currently has hardcoded `p-6` padding** — fix to `p-4 md:p-6`
- Uses `overflow-x-auto` table wrapper — source of horizontal scroll on mobile

#### Ratings Table (inline in ratings/page.tsx, 222 lines)
- Mobile card: star rating | customer name | order reference | date
- Simplest conversion — few fields, straightforward layout, 178-line buffer
- Uses `overflow-x-auto` table wrapper — same horizontal scroll issue

### Touch Target Sweep (MOBL-03)
- Mobile-only override strategy: `h-11 md:h-9` pattern — 44px on mobile, compact 36px on desktop
- Preserves desktop information density while meeting 44px minimum on mobile
- Approach per element type:
  - **Button `size="sm"` (~25 instances):** Mobile override to 44px via responsive class `h-11 md:h-9`
  - **Icon-only buttons (h-6 w-6, ~15 instances):** Wrap with 44px touch target container `min-h-[44px] min-w-[44px]` via transparent padding
  - **Checkboxes (h-5, ~5 instances):** Transparent padding wrapper extending hit area without visual change
  - **Toggle switches (~2 instances):** Increase container to 44px on mobile
  - **Badge filter chips (~49 instances):** Add `min-h-[44px]` + horizontal padding on mobile
  - **Dropdown triggers (~20 instances):** Ensure 44px trigger area
  - **Table header sort icons (~8 instances):** Hidden on mobile (tables become cards — sort controls move to filter bar)
  - **Close/dismiss X buttons (~5 instances):** Transparent padding wrapper
  - **Input `size="sm"` (~10 instances):** Change to default `h-11` on mobile

**Specific worst-offender fixes (from deep codebase audit):**
- `OpsOrderRow.tsx`: Icon elements are `h-3.5 w-3.5` (14px!) — wrap with 44px touch target padding
- `CategoriesTable`: Sort up/down buttons `h-6 w-6 p-0` (24px) — add `min-h-[44px] min-w-[44px]` wrapper
- `MenuItemsTable`: Toggle icons `h-6 w-6`, dropdown trigger `size="sm"` — responsive size override
- `SectionCard`: Eye toggle, ChevronUp/Down, MoreVertical all ~`p-2` (32px) — add touch padding
- Routes page: Date nav prev/next `h-8 w-8` (32px), "Today" button `size="sm"` — override to 44px mobile
- Emails page: Filter inputs `h-10` (40px — close!), "View Order" links text-xs, resend button small
- Pattern from CustomerContactCard: `"inline-flex items-center justify-center rounded-input h-11 w-11 min-h-[44px] min-w-[44px]"`

### Route Progress Widget (MOBL-04)
- New `RouteProgressWidget.tsx` component in `src/components/ui/admin/ops/` directory (alongside existing OpsKPIGrid, OpsOrderList etc.)
- Widget per active route (in_progress status): driver name + status badge + progress bar + delivered/total count + start time
- Layout:
  ```
  ┌──────────────────────────────────────┐
  │ 👤 Driver Name          in_progress  │
  │ ████████████░░░░░  8/12 delivered    │
  │ Started 2:30 PM         Route #4     │
  └──────────────────────────────────────┘
  ```
- Progress bar: delivered stops = solid fill, skipped stops = striped/hatched segment (visually distinct)
- Widget is clickable → navigates to route detail page (wrap in `<Link href={/admin/routes/${routeId}}>`)
- **Data source: `stats_json` CONFIRMED FRESH** — `updateRouteStats()` is called in:
  - Driver stop status change (`src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` L163)
  - Driver exception report (`src/app/api/driver/routes/[routeId]/stops/[stopId]/exception/route.ts` L195)
  - Admin stop operations (`src/app/api/admin/routes/[id]/stops/helpers.ts` L10)
  - Split/merge RPCs (`supabase/migrations/20260315_route_editing_rpcs.sql`)
  → Widget can safely use `stats_json` without client-side aggregation

- **Existing `RouteStatsBar.tsx`**: Already renders stats_json with progress bar (113 lines, in `src/components/ui/admin/routes/`). Widget can reuse its stat calculation pattern (fallback from stats_json to stops array). However, RouteStatsBar is a detail-view component — widget needs a compact card variant.

- New polling hook: `useRouteProgressPolling.ts` in `src/components/ui/admin/ops/` — parallel to existing `useOpsPolling.ts` (which polls `/api/admin/ops/orders` every 5s)
- New API endpoint: `GET /api/admin/ops/routes-progress` — returns only today's non-completed routes with: id, name, status, driver_name, stats_json, started_at
- 5-second polling interval (matches existing ops polling cadence)
- Widget grid: 1 column on mobile, 2 columns on `sm:`, 3 on `lg:`
- Placed in ops dashboard below existing KPI grid, above order list
- assigned + accepted routes shown as "Waiting" state (no progress bar, just "Assigned to [Driver]" or "Accepted by [Driver]")
- Empty state: "No active routes" when zero routes are in_progress/assigned/accepted for today
- **Animation**: `initial={{ opacity: 0, y: 10 }}` on widget cards (matches Routes page pattern) — use `useAnimationPreference()` to skip on reduced-motion (matches OpsKPIGrid pattern)

### Page Scope
- All 22 admin pages get mobile pass (maximalist approach)
- **Modals** (SplitRouteModal, MergeRouteModal, AddStopsModal, OptimizationModal): test as-is, Radix Dialog handles mobile viewport — fix only if broken
- **Photos page**: sidebar panel (`PhotoMetadata`) converts to bottom sheet on mobile via Drawer `position="bottom"`. BUT photos page is 396 lines — MUST extract into subfolder first (blocking prerequisite).
- **Sections page**: Right-side `HomepagePreview` panel is `hidden xl:block` — already hidden on mobile. Add a "Preview" button on mobile that opens preview in a modal/bottom sheet. BUT 363 lines — monitor during implementation.
- **Route builder map**: responsive padding only, Leaflet handles mobile touch/zoom natively
- **Settings forms**: already stacked, responsive padding sweep only
- **Padding inconsistency fixes (verified from deep audit):**
  - `admin/page.tsx` (Dashboard): `p-8` → `p-4 md:p-8`
  - `admin/orders/page.tsx`: `p-8` → `p-4 md:p-8` (NOT previously noted — caught in deep scan)
  - Analytics Hub, Delivery Analytics, Driver Analytics: `p-8` → `p-4 md:p-8`
  - `admin/feedback/page.tsx`: `p-6` → `p-4 md:p-6`
  - `admin/ratings/page.tsx`: add `p-4 md:p-6`
  - Already correct: Drivers, Menu, Categories, Routes, Photos, Emails, Sections

### Scroll Container Architecture (from learnings cross-check)
- **CRITICAL**: Admin layout has `overflow-auto` on `<main>` element. Individual pages should NOT add their own `overflow-y-auto` scroll containers — this creates nested scroll that blocks wheel events on desktop (learning: "Nested Scroll Containers Block Desktop Wheel Events")
- On mobile, the single scroll container is the `<main>` element. Mobile card layouts scroll within this.
- Tables with `overflow-x-auto` wrappers (emails, feedback, ratings) — on mobile these become card stacks, so the `overflow-x-auto` wrapper should be conditionally applied: `overflow-x-auto md:overflow-x-auto` (hidden on mobile since cards don't need horizontal scroll)
- DragReorderList on mobile: `touch-none` on handle only (per learning: "touchAction Conflicts"). Content area uses default `pan-y` for native scroll.

### Framer Motion Mobile Safety (from learnings cross-check)
- **Routes page**: 3 `m.div` stagger animations with `initial={{ opacity: 0, y: 10 }}` — NO images inside animated containers, so `loading="lazy"` bug does NOT apply. But 3 sequential animations may feel slow on budget phones → add `useAnimationPreference()` check (currently missing).
- **Menu, Categories, Photos pages**: `m.div` animations with `initial={{ opacity: 0 }}` — same: no lazy images inside, but should add reduced-motion awareness
- **Admin Dashboard (`AdminDashboard.tsx`)**: Already uses `useAnimationPreference()` ✅
- **OpsKPIGrid.tsx**: Already uses `useAnimationPreference()` via `cardContainer`/`cardItem` ✅
- **Drawer.tsx**: Safari GPU crash prevention with duration-based exit (not spring) ✅
- **`willChange` performance**: KPICard and animated list items should use `willChange: isHovered ? "transform" : "auto"` pattern — NOT permanent `willChange` (creates excess compositor layers, per learning: "willChange Only on Interaction")

### Components Added in Phases 100-101 (mobile status — verified)
- `DragReorderList` + `DragHandle` + `MoveButtons`: Already responsive (MoveButtons `flex md:hidden`, DragHandle `hidden md:flex`) — 44px touch targets confirmed ✅
- `RouteStopCard` subfolder: Test on mobile, may need padding adjustments
- `StatusBadge` (5 statuses): Renders fine at any size — no changes ✅
- `RouteActionsMenu`: 44px trigger already compliant ✅
- `AcceptDeclineBar` (driver-side): Fixed bottom bar with `safe-area-inset-bottom` ✅ — not admin, but pattern reference for mobile header safe-area approach
- `SplitRouteModal` / `MergeRouteModal`: Radix Dialog — test on mobile, should auto-adapt
- `RouteDetailClient` (373 lines): Under limit, responsive adjustments should fit

### Claude's Discretion
- Exact mobile card layout dimensions and spacing per table
- Mobile header animation (enter/exit) parameters
- Progress bar styling (colors, border-radius, height)
- Widget grid gap and card padding
- Drawer open/close animation parameters (reuse existing Drawer defaults)
- Order of page-by-page touch target sweep
- Whether to extract inline tables (emails, feedback, ratings) into separate files during card conversion (only if approaching 400-line limit)
- Progress bar hatched/striped pattern implementation (CSS background or SVG)
- Exact responsive breakpoint for widget grid columns (sm: vs lg:)
- Whether AdminNav drawer variant strips Framer Motion `layoutId` to avoid cross-mount animation issues
- Whether `SectionEditor` needs extraction before or during responsive work
- Exact `env(safe-area-inset-top)` application method (CSS calc vs Tailwind arbitrary)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navigation and layout
- `src/components/ui/admin/AdminNav.tsx` — Current sidebar (12 nav items, collapse, Framer Motion layoutId indicator, 219 lines)
- `src/app/(admin)/admin/layout.tsx` — Admin layout (Server Component, flex sidebar + main with overflow-auto, auth guard, 48 lines)
- `src/components/ui/Drawer.tsx` — Existing drawer (left/right/bottom, spring animations, focus trap, route-aware close, Safari GPU crash prevention, **402 lines — over limit, needs cleanup**)

### Tables needing card conversion
- `src/app/(admin)/admin/menu/page.tsx` — Menu items table (co-located, 268 lines, has responsive classes)
- `src/app/(admin)/admin/categories/page.tsx` — Categories table (co-located, 265 lines, has responsive classes, worst touch target offender)
- `src/app/(admin)/admin/routes/page.tsx` — Route list (co-located, **347 lines — tight**, has responsive classes)
- `src/app/(admin)/admin/emails/page.tsx` — Email log (inline HTML table, 331 lines, has partial `hidden md:` headers)
- `src/app/(admin)/admin/feedback/page.tsx` — Feedback table (inline, 287 lines, `overflow-x-auto`, hardcoded `p-6`)
- `src/app/(admin)/admin/ratings/page.tsx` — Ratings table (inline, 222 lines, `overflow-x-auto`, no padding)

### Already-responsive table patterns (reference implementations)
- `src/components/ui/admin/OrdersTable.tsx` — `hidden sm:flex` header + mobile card variant (296 lines, best reference)
- `src/components/ui/admin/drivers/DriverListTable/` — `hidden md:flex` header + DriverCardRow pattern

### Files requiring prerequisite extraction (400-line limit)
- `src/app/(admin)/admin/photos/page.tsx` — **396 lines, 4-line buffer** — MUST extract before adding responsive branches
- `src/components/ui/Drawer.tsx` — **402 lines, over limit** — remove BottomSheet alias or extract subfolder
- `src/app/(admin)/admin/sections/page.tsx` — 363 lines, 37-line buffer — monitor
- `src/app/(admin)/admin/routes/page.tsx` — 347 lines, 53-line buffer — monitor

### Ops dashboard and route progress
- `src/app/(admin)/admin/ops/page.tsx` — Ops dashboard page (11 lines, wrapper only)
- `src/components/ui/admin/ops/` — 8 component files (OpsKPIGrid, OpsOrderList, OpsOrderRow, OpsBulkToolbar, OpsCountdownBar, OpsDriverPanel, useOpsPolling, helpers)
- `src/components/ui/admin/ops/useOpsPolling.ts` — Existing 5s polling hook for orders (98 lines, reference for route progress polling)
- `src/components/ui/admin/ops/OpsKPIGrid.tsx` — KPI grid with `useAnimationPreference()` (140 lines, animation pattern reference)
- `src/components/ui/admin/ops/OpsOrderRow.tsx` — **h-3.5 w-3.5 icons (14px!) — worst touch target offender** (105 lines)
- `src/components/ui/admin/routes/RouteStatsBar.tsx` — Existing stats_json renderer with Progress bar (113 lines, reuse stat calculation pattern)
- `src/components/ui/admin/StatusBadge.tsx` — 5-status badge with color tokens
- `src/components/ui/progress.tsx` — Shadcn/ui Progress bar component

### stats_json freshness (CONFIRMED by code audit)
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` L163 — calls `updateRouteStats()` on every stop status change
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/exception/route.ts` L195 — calls on exception
- `src/app/api/admin/routes/[id]/stops/helpers.ts` L10 — shared helper wrapping `update_route_stats` RPC
- `supabase/migrations/20260315_route_editing_rpcs.sql` — split/merge RPCs both call `update_route_stats`

### Touch target reference implementations
- `src/components/ui/button.tsx` — Button variants (sm=h-9/36px, md=h-11/44px, icon-sm=h-9 w-9, icon=h-11 w-11)
- `src/components/ui/admin/routes/RouteStopCard/` — Phase 100 subfolder, 44px-compliant actions
- `src/components/ui/admin/routes/RouteDetailClient/RouteActionsMenu.tsx` — 44px trigger target (reference)
- `src/components/ui/driver/AcceptDeclineBar.tsx` — Fixed bottom bar with safe-area (pattern reference)

### Learnings (CRITICAL — will cause bugs if ignored)
- `.claude/learnings/mobile-ux.md` — Nested overflow-y-auto blocks wheel events, **safe-area: position not padding**, responsive negative margins, backdrop-blur mobile perf, touchAction conflicts, bottom sheet two-layer fix, scroll lock defer
- `.claude/learnings/react-patterns.md` — Ref instability across conditional renders, flex items-center collapses children without w-full, event listeners in useEffect, Fragment can't receive className (Radix Slot)
- `.claude/learnings/animation.md` — `loading="lazy"` + animated containers = images never load, skeleton loading must match DOM structure
- `.claude/learnings/tailwind-v4.md` — `@theme inline` is only source of truth, mobile CSS variable resolution (explicit colors for mobile-critical backgrounds)
- `.claude/learnings/performance.md` — `willChange` only on interaction (not permanent), IntersectionObserver for animation pause, lazy load below-fold heavy components
- `.claude/learnings/design-tokens.md` — Non-existent token names resolve to transparent (no build error), WCAG AA contrast ratios
- `.claude/learnings/state-management.md` — Zustand + IDB persist: `getState()` in useMemo doesn't re-render after hydration
- `.claude/learnings/nextjs.md` — Hydration platform detection (useEffect + mounted state), revalidatePath defaults to "page"
- `.claude/learnings/testing.md` — E2E DOM removal for AnimatePresence (use .count() not .toBeVisible())

### Prior phase context
- `.planning/phases/100-admin-route-editing/100-CONTEXT.md` — DragReorderList architecture, RouteStopCard subfolder, 44px proactive targets, split/merge modal designs
- `.planning/phases/101-driver-experience/101-CONTEXT.md` — AcceptDeclineBar/Card patterns, StatusBadge 5-status colors, safe-area-inset-bottom pattern, route status state machine
- `.planning/phases/100-admin-route-editing/100-VERIFICATION.md` — MoveButtons 44px touch targets confirmed, DragHandle responsive md: breakpoint confirmed
- `.planning/phases/101-driver-experience/101-VERIFICATION.md` — AcceptDeclineBar safe-area confirmed, mobile interactions flagged as human-needed verification
- `.planning/phases/102-admin-mobile-ux/102-ASSUMPTIONS.md` — Deep research: full table inventory, interactive element audit, padding inconsistencies, 15 applicable learnings

### Requirements
- `.planning/REQUIREMENTS.md` — MOBL-01 through MOBL-04 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Drawer.tsx`: Full-featured drawer with left/right/bottom, spring animations, focus trap, route-aware close — direct reuse for admin nav drawer (needs 402→<400 line cleanup first)
- `Button` component: `size="md"` = h-11 (44px), `size="sm"` = h-9 (36px) — responsive override from sm to md on mobile
- `StatusBadge`: 5-status badge (planned=gray, assigned=blue, accepted=green, in_progress=amber, completed=green-check) — reuse in route progress widget
- `Progress` (shadcn/ui): Basic progress bar — style for route progress widget
- `RouteStatsBar.tsx`: Existing stats_json renderer (113 lines) — reuse stat calculation logic (fallback from stats_json to stops array)
- `OrdersTable` responsive pattern: Best reference for table-to-card conversion (`hidden sm:flex` header + mobile card)
- `DriverListTable/DriverCardRow`: Second reference for mobile card layout
- `CustomerContactCard` touch target pattern: `h-11 w-11 min-h-[44px] min-w-[44px]`
- `useRouteChangeClose` hook: Auto-closes drawer on navigation — wire into admin drawer
- `DragReorderList` + `MoveButtons`: Already responsive (`flex md:hidden` / `hidden md:flex`) — no changes
- `useOpsPolling.ts`: Reference for route progress polling hook architecture (interval, error handling, ref-based closures)
- `OpsKPIGrid.tsx`: Reference for stagger animation with `useAnimationPreference()` check
- `cardContainer`/`cardItem` from `CardRow`: Framer Motion stagger variants — reuse in widget grid

### Established Patterns
- `hidden md:flex` / `md:hidden`: CSS-only responsive visibility (SSR-safe, no hydration mismatch)
- `p-4 md:p-8`: Responsive padding pattern (8/22 admin pages already correct)
- `m.aside` with Framer Motion: AdminNav width animation — disabled in drawer mode
- Admin auth guard in layout.tsx: Server Component — stays unchanged (responsive is client-side CSS)
- 5s polling on ops dashboard via `useOpsPolling`: Match for route progress polling cadence
- `stats_json` JSONB in routes table: Pre-computed route stats, kept fresh by `update_route_stats` RPC (confirmed in 4 code paths)
- `useAnimationPreference()` hook for reduced-motion support — used in AdminDashboard, OpsKPIGrid
- `after()` for fire-and-forget side effects in API routes (Vercel serverless constraint)

### Integration Points
- Admin layout (`layout.tsx`): Needs mobile header (client component) + responsive flex structure
- AdminNav (`AdminNav.tsx`): Needs `variant` prop for sidebar vs drawer rendering
- Ops dashboard: Needs route progress widget section with new polling hook + API endpoint
- Ops dashboard page composition: Widget renders between KPI grid and order list
- 6 data tables: Need inline responsive card branches
- 22 admin pages: Need touch target audit sweep + padding fixes
- New components: `AdminMobileHeader.tsx`, `RouteProgressWidget.tsx`, `useRouteProgressPolling.ts`
- New API route: `GET /api/admin/ops/routes-progress`
- No database migrations needed — this is CSS/layout + 1 new read-only API endpoint

### Critical Risks (from learnings cross-check — 15 items)

**WILL CAUSE BUGS if ignored:**
1. **Nested overflow-y-auto**: Admin `<main>` has `overflow-auto`. Do NOT add `overflow-y-auto` to card wrappers inside — creates nested scroll that blocks wheel events on desktop
2. **Safe area inset: position not padding**: Mobile header `position: fixed` + `top: calc(env(safe-area-inset-top, 0px))`, NOT padding (icon gets pushed off-center)
3. **backdrop-blur perf**: Drawer already handles this (`sm:backdrop-blur-xl` only) — no action needed ✅
4. **loading="lazy" + opacity:0**: Routes/Menu/Categories pages have `m.div` with `initial={{ opacity: 0 }}` — but NO lazy-loaded images inside, so safe ✅. Dashboard images should verify.
5. **Responsive negative margin**: Mobile card full-bleed: match parent padding at every breakpoint (`px-4 -mx-4 md:px-0 md:mx-0`)
6. **Flex items-center collapses children**: Mobile card layouts inside `flex-col items-center` need explicit `w-full`
7. **touchAction conflicts**: DragReorderList handles already have `touch-none` ✅. New drag areas must not add `pan-x` that blocks child scroll.
8. **Drawer swipe-to-close**: Left drawer has NO built-in swipe (only bottom sheets). Close via backdrop tap + X button. Don't attempt to add swipe — Framer Motion `drag` + `fixed` = unreliable (per learnings).

**AFFECTS QUALITY if ignored:**
9. **Ref instability across conditional renders**: Admin pages with loading→loaded transitions (Suspense boundaries) — wrap IntersectionObserver targets in stable container div
10. **willChange only on interaction**: KPI cards and animated list items — `willChange: isHovered ? "transform" : "auto"`, not permanent
11. **E2E DOM removal**: Drawer/modal close tests should use `.count()` === 0, not `.toBeVisible()` (AnimatePresence exit animation)
12. **Framer Motion layoutId cross-mount**: If AdminNav renders both as sidebar and drawer (two mount points), `layoutId="admin-nav-indicator"` may cause glitchy cross-mount animation. Disable layoutId in drawer variant.
13. **Mobile CSS variable resolution**: Use explicit Tailwind colors for mobile-critical backgrounds (`bg-surface-secondary` may resolve to transparent on mobile if tokens not loaded — use fallback)
14. **Scroll lock during AnimatePresence exit**: Don't call `window.scrollTo()` during drawer exit — iOS crash. Drawer already handles this via `onExitComplete` ✅
15. **Admin layout is Server Component**: Can't add `useState` directly — use client component island (`AdminMobileHeader.tsx`) for drawer state

</code_context>

<specifics>
## Specific Ideas

- Saturday ops context: admin is multitasking in kitchen with floury hands — large touch targets, one-tap actions, no precision tapping
- Left drawer matches mental model of "hamburger → slide out menu" that every mobile user knows
- Route progress widget gives at-a-glance delivery status without navigating away from ops dashboard — critical during Saturday rush
- Per-table card layouts avoid "lowest common denominator" design — each table shows its most important fields prominently
- Padding inconsistency fix is low-effort but high-impact — currently some pages have no padding on mobile, content touches edges
- Photos sidebar → bottom sheet maintains access to photo management while cooking (menu photo updates happen during prep)
- Sections page preview: currently hidden on mobile (`hidden xl:block`) — acceptable since admin rarely previews on phone, but a "Preview" button opening a bottom sheet would be nice-to-have
- OpsOrderRow icons at 14px are the single worst touch target in the entire admin — fixing these alone would significantly improve Saturday ops on phone
- Route progress widget should show "last updated" relative time to give admin confidence the data is fresh during polling

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 102-admin-mobile-ux*
*Context gathered: 2026-03-16*
