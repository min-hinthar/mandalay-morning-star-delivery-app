# Phase 102: Admin Mobile UX - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Solo operator can run all Saturday kitchen operations from a phone without pinching, scrolling sideways, or missing touch targets. Covers: sidebar-to-drawer conversion, tables-to-cards for 6 admin data tables, 44px touch target sweep across all 22 admin pages, route progress widget on ops dashboard, responsive padding fixes. Does NOT cover: new features, route builder map redesign, admin page logic changes, push notifications, or new admin capabilities.

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
- Active indicator animation (`layoutId="admin-nav-indicator"`) works in both modes
- Collapse state stays ephemeral (`useState`) — no localStorage/Zustand persistence
- "Exit Admin" link included in drawer footer (same as sidebar)

### Mobile Header Bar (MOBL-01)
- New sticky header bar at top of admin layout on mobile (hidden above `md:`)
- Layout: hamburger button (left) | page title (center) | optional action slot (right)
- Height: h-14 (56px) with safe-area-inset-top padding
- Background: `bg-surface-secondary border-b border-border` (matches sidebar)
- Page title derived from route segment (e.g., `/admin/orders` → "Orders")
- Optional right-side action button slot for page-specific primary actions (e.g., "Add" on menu page)
- No breadcrumbs — flat nav structure doesn't warrant breadcrumb depth
- Hamburger button: 44px touch target, `Menu` icon from Lucide

### Admin Layout Changes (MOBL-01)
- Layout switches at `md:` breakpoint:
  - `md:` and above: `flex` layout with sidebar + main content (current behavior)
  - Below `md:`: stacked layout with mobile header + main content (no sidebar)
- Main content area: `pt-14 md:pt-0` to account for fixed mobile header
- Use CSS `hidden md:block` / `md:hidden` pattern (not `useMediaQuery`) — SSR-safe, no hydration mismatch
- DomMaxProvider wraps both variants (no change)

### Tables to Cards (MOBL-02)
- Per-table inline responsive branches — no shared `AdminMobileCard` wrapper component
- Each table has different fields and priorities; abstraction adds no value
- Use established pattern: `hidden md:flex` table header + mobile card below `md:` breakpoint
- Show all key fields on mobile cards (no "expand" drawer — admin needs info at a glance during Saturday ops)
- 6 tables need card conversion:

#### MenuItemsTable (~250 lines)
- Mobile card: photo thumbnail (48px square) | name + category | price | active/sold-out toggle
- Toggle switches need 44px touch targets on mobile
- Sort/filter controls above table: stack vertically on mobile

#### CategoriesTable (~266 lines)
- Mobile card: category name | item count badge | active toggle | sort up/down buttons
- Sort buttons: side-by-side, 44px each, on right edge of card
- No horizontal scroll needed — all fields fit in card layout

#### RouteListTable (~348 lines)
- Mobile card: date + route name | driver name | status badge | progress (delivered/total)
- Progress shown as text "4/7" with small inline progress bar
- Clickable entire card (navigates to route detail)

#### Email Log (inline in emails/page.tsx, ~332 lines)
- Mobile card: status icon + recipient | email type badge | date | resend button
- Resend button: 44px touch target, right-aligned
- Filter controls: stack vertically above cards on mobile

#### Feedback Table (inline in feedback/page.tsx, ~288 lines)
- Mobile card: star rating display | customer name | date | message excerpt (2 lines truncated)
- Clickable to expand full message (inline expand, not navigation)

#### Ratings Table (inline in ratings/page.tsx, ~223 lines)
- Mobile card: star rating | customer name | order reference | date
- Simplest conversion — few fields, straightforward layout

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
  - **Table header sort icons (~8 instances):** Extend click target with padding
  - **Close/dismiss X buttons (~5 instances):** Transparent padding wrapper
  - **Input `size="sm"` (~10 instances):** Change to default `h-11` on mobile
- Priority pages (worst offenders): CategoriesTable, MenuItemsTable, SectionCard, Routes date nav, Emails page
- Systematic page-by-page sweep across all 22 admin pages
- Pattern from CustomerContactCard: `"inline-flex items-center justify-center rounded-input h-11 w-11 min-h-[44px] min-w-[44px]"`

### Route Progress Widget (MOBL-04)
- New widget component on ops dashboard showing per-route delivery progress
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
- Widget is clickable → navigates to route detail page
- Data source: `stats_json` from routes table (update_route_stats trigger fires on stop status changes — confirmed fresh)
- New API endpoint: `GET /api/admin/ops/routes-progress` — lightweight, returns only active routes with stats_json + driver name
- 5-second polling interval (matches existing ops dashboard cadence)
- Widget grid: 1 column on mobile, 2 columns on tablet, 3 on desktop
- Placed in ops dashboard below existing status summary section
- assigned + accepted routes shown as "Waiting" state (no progress bar, just "Assigned to [Driver]" or "Accepted by [Driver]")

### Page Scope
- All 22 admin pages get mobile pass (maximalist approach)
- Modals (SplitRouteModal, MergeRouteModal, AddStopsModal, OptimizationModal): test as-is, Radix Dialog handles mobile viewport — fix only if broken
- Photos page sidebar: convert to bottom sheet on mobile via Drawer `position="bottom"` — admin needs photo management during menu updates
- Route builder map: responsive padding only, Leaflet handles mobile touch/zoom natively
- Settings forms: already stacked, responsive padding sweep only
- Padding inconsistency fixes:
  - Dashboard, Analytics Hub, Delivery Analytics, Driver Analytics: `p-8` → `p-4 md:p-8`
  - Feedback, Ratings pages: add `p-4 md:p-8` (currently no padding)
  - Already correct: Drivers, Menu, Menu Edit, Routes, Photos, Emails

### Components Added in Phases 100-101 (mobile status)
- DragReorderList: already responsive (MoveButtons on mobile, DragHandle on desktop) — no changes
- RouteStopCard subfolder: test on mobile, may need padding adjustments
- StatusBadge: renders fine at any size — no changes
- RouteActionsMenu: 44px trigger already compliant — no changes
- AcceptDeclineBar: driver-side, not admin — no changes

### Claude's Discretion
- Exact mobile card layout dimensions and spacing per table
- Mobile header animation (enter/exit) parameters
- Progress bar styling (colors, border-radius, height)
- Widget grid gap and card padding
- Drawer open/close animation parameters (reuse existing Drawer defaults)
- Order of page-by-page touch target sweep
- Whether to extract inline tables (emails, feedback, ratings) into separate files during card conversion (only if approaching 400-line limit)
- Progress bar hatched/striped pattern implementation (CSS background or SVG)
- Exact responsive breakpoint for widget grid columns (sm: vs md:)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navigation and layout
- `src/components/ui/admin/AdminNav.tsx` — Current sidebar implementation (12 nav items, collapse, Framer Motion animations)
- `src/app/(admin)/admin/layout.tsx` — Admin layout structure (flex sidebar + main, auth guard)
- `src/components/ui/Drawer.tsx` — Existing Drawer component (left/right/bottom, spring animations, focus trap, route-aware close)

### Tables needing card conversion
- `src/app/(admin)/admin/menu/` — MenuItemsTable (co-located)
- `src/app/(admin)/admin/categories/` — CategoriesTable (co-located)
- `src/app/(admin)/admin/routes/` — RouteListTable (co-located)
- `src/app/(admin)/admin/emails/page.tsx` — Email log table (inline)
- `src/app/(admin)/admin/feedback/page.tsx` — Feedback table (inline)
- `src/app/(admin)/admin/ratings/page.tsx` — Ratings table (inline)

### Already-responsive table patterns (reference)
- `src/components/ui/admin/OrdersTable.tsx` — `hidden sm:flex` header + mobile card pattern
- `src/components/ui/admin/drivers/DriverListTable/` — `hidden md:flex` header + DriverCardRow pattern

### Touch target references
- `src/components/ui/button.tsx` — Button variants with size definitions (sm=36px, md=44px)
- `src/components/ui/admin/routes/RouteStopCard/` — Phase 100 subfolder pattern

### Ops dashboard and route progress
- `src/app/(admin)/admin/ops/page.tsx` — Ops dashboard server component
- `src/app/api/admin/ops/` — Existing ops API endpoints (orders polling)
- `src/components/ui/admin/StatusBadge.tsx` — 5-status badge component
- `src/components/ui/progress.tsx` — Existing Progress bar component (shadcn/ui)

### Learnings (CRITICAL — will cause bugs if ignored)
- `.claude/learnings/mobile-ux.md` — Nested overflow-y-auto blocks wheel events, safe-area insets, responsive negative margins, backdrop-blur perf, touchAction conflicts
- `.claude/learnings/react-patterns.md` — Ref instability, loading="lazy" in animated containers, event listeners in useEffect
- `.claude/learnings/animation.md` — loading="lazy" + animated containers = images never load
- `.claude/learnings/tailwind-v4.md` — @theme inline is source of truth, mobile CSS variable resolution

### Prior phase context
- `.planning/phases/100-admin-route-editing/100-CONTEXT.md` — DragReorderList architecture, RouteStopCard subfolder, 44px proactive targets
- `.planning/phases/101-driver-experience/101-CONTEXT.md` — AcceptDeclineBar pattern, StatusBadge color tokens
- `.planning/phases/102-admin-mobile-ux/102-ASSUMPTIONS.md` — Deep research: full table inventory, interactive element audit, padding inconsistencies, 15 applicable learnings

### Requirements
- `.planning/REQUIREMENTS.md` — MOBL-01 through MOBL-04 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Drawer.tsx`: Full-featured drawer with left/right/bottom positions, spring animations, focus trap, route-aware close — direct reuse for admin nav drawer
- `Button` component: Already has `size="md"` at 44px — responsive override from sm to md on mobile
- `StatusBadge`: 5-status badge with color tokens — reuse in route progress widget
- `Progress` (shadcn/ui): Basic progress bar — extend or style for route progress widget
- `OrdersTable` responsive pattern: Reference implementation for table-to-card conversion
- `DriverListTable/DriverCardRow`: Another reference for mobile card layout
- `CustomerContactCard` touch target pattern: `h-11 w-11 min-h-[44px] min-w-[44px]` — reuse across admin pages
- `useRouteChangeClose` hook: Auto-closes drawer on navigation — wire into admin drawer
- `DragReorderList` + `MoveButtons`: Already responsive — no changes needed

### Established Patterns
- `hidden md:flex` / `md:hidden`: CSS-only responsive visibility (SSR-safe, no hydration mismatch)
- `p-4 md:p-8`: Responsive padding pattern used on 6+ admin pages already
- `m.aside` with Framer Motion: AdminNav animation — extend with drawer variant
- Admin auth guard in layout.tsx: No changes needed (responsive is CSS-only)
- 5s polling on ops dashboard: Match for route progress widget polling cadence
- `stats_json` JSONB in routes table: Pre-computed route stats, kept fresh by update_route_stats trigger

### Integration Points
- Admin layout (`layout.tsx`): Needs mobile header + drawer + responsive flex structure
- AdminNav: Needs `variant` prop for sidebar vs drawer rendering
- Ops dashboard: Needs route progress widget section with new API endpoint
- 6 data tables: Need inline responsive card branches
- 22 admin pages: Need touch target audit sweep
- New API route: `GET /api/admin/ops/routes-progress`
- No database migrations needed — this is CSS/layout only + 1 new read-only API endpoint

### Critical Risks (from learnings cross-check)
1. Nested `overflow-y-auto` without explicit height blocks wheel events — admin tables in `overflow-auto` main area need single scroll container
2. Safe area inset: use `env(safe-area-inset-top)` on fixed mobile header, not padding
3. `backdrop-blur` kills perf on mobile — Drawer already handles this (`sm:backdrop-blur-xl` only)
4. `loading="lazy"` + animated containers = images never load — dashboard images in Framer Motion need `loading="eager"`
5. Responsive negative margin must match parent padding per breakpoint — full-bleed cards: `px-4 -mx-4 sm:px-6 sm:-mx-6`
6. Flex `items-center` collapses children without `w-full` — mobile card layouts need explicit width
7. touchAction conflicts: DragReorderList in mobile contexts needs `touch-none` on handle, `pan-y` on content

</code_context>

<specifics>
## Specific Ideas

- Saturday ops context: admin is multitasking in kitchen with floury hands — large touch targets, one-tap actions, no precision tapping
- Left drawer matches mental model of "hamburger → slide out menu" that every mobile user knows
- Route progress widget gives at-a-glance delivery status without navigating away from ops dashboard — critical during Saturday rush
- Per-table card layouts avoid "lowest common denominator" design — each table shows its most important fields prominently
- Padding inconsistency fix is low-effort but high-impact — currently some pages have no padding on mobile, content touches edges
- Photos sidebar → bottom sheet maintains access to photo management while cooking (menu photo updates happen during prep)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 102-admin-mobile-ux*
*Context gathered: 2026-03-16*
