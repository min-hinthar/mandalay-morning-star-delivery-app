# Phase 102: Admin Mobile UX — Pre-Planning Assumptions

> Input document for `/gsd:discuss-phase 102`. Contains all assumptions, findings, and open questions from deep research.

---

## Phase Definition

**Goal:** Solo operator can run all Saturday kitchen operations from a phone without pinching, scrolling sideways, or missing touch targets
**Depends on:** Phase 101 (all features finalized before responsive overhaul)
**Requirements:** MOBL-01, MOBL-02, MOBL-03, MOBL-04

**Success Criteria:**
1. Admin sidebar replaced by drawer/bottom nav below `md:` breakpoint
2. All admin data tables render as card layouts on mobile (no horizontal scroll)
3. Every interactive element meets 44px minimum touch target
4. Ops dashboard shows route progress widget per active route (driver name, progress bar, delivered/total)

---

## MOBL-01: Sidebar to Drawer

### Current Architecture

**AdminNav** (`src/components/ui/admin/AdminNav.tsx`):
- Fixed sidebar: 256px expanded, 64px collapsed
- 12 nav items: Dashboard, Ops Center, Orders, Drivers, Routes, Menu, Categories, Photos, Sections, Analytics, Feedback, Settings
- Footer: "Exit Admin" link
- Collapse: local `useState(false)` — no persistence
- Animation: `m.aside` with Framer Motion width transition (0.2s easeOut)
- Active indicator: `layoutId="admin-nav-indicator"` spring morph (stiffness: 300, damping: 30)
- Icon hover: wobble + scale animation
- **NO responsive breakpoints** — sidebar persists at all viewport widths

**Admin Layout** (`src/app/(admin)/admin/layout.tsx`):
```tsx
<DomMaxProvider>
  <div className="flex min-h-screen bg-cream">
    <AdminNav />
    <main className="flex-1 overflow-auto">{children}</main>
  </div>
</DomMaxProvider>
```
- No mobile header bar
- No hamburger trigger
- Content area takes `flex-1` with `overflow-auto`

### Existing Drawer Component (`src/components/ui/Drawer.tsx`)

**API:**
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `isOpen` | boolean | required | Controls visibility |
| `onClose` | () => void | required | Close callback |
| `position` | "left" \| "right" \| "bottom" | - | Slide direction |
| `width` | "sm" \| "md" \| "lg" | - | 256px / 320px / 384px |
| `height` | "auto" \| "full" | - | Bottom sheet only |
| `showDragHandle` | boolean | true | Drag handle visibility |
| `title` | string | - | Accessible aria-label |

**Capabilities:**
- Spring animations (damping: 25, stiffness: 300)
- Mobile Safari GPU crash prevention (duration-based exit, not spring)
- Focus trap with Tab cycling + 50ms initial focus delay
- Body scroll lock with scrollbar compensation
- Portal rendering to `document.body`
- Route-aware auto-close (`useRouteChangeClose` hook)
- `AnimatePresence` with `onExitComplete` for clean exit
- Z-index: backdrop z-40, drawer z-50
- Mobile: no backdrop blur (`sm:backdrop-blur-xl` only)
- Safe area: `pb-safe` for bottom sheets

**Limitations:**
- Swipe-to-close: down-only (bottom sheets) — side drawers need backdrop click or X button
- No max-height constraint for side drawers (12 items fit fine)
- `contentScrollable` detection runs on open only (static nav list = not an issue)
- Spring exit animation disabled on Safari (asymmetric entrance/exit feel)

### Assumption: Left Drawer (NOT Bottom Nav)

**Reasoning:**
- 12 nav items won't fit in bottom nav (max 4-5 icons)
- Driver pages already use bottom nav — visual role distinction
- Left drawer is familiar pattern from mobile apps
- Drawer component already supports `position="left"` with `width="sm"` (256px = matches sidebar)

**Implementation plan:**
1. Add mobile header bar to admin layout (hamburger + page title + optional actions)
2. AdminNav accepts `variant: "sidebar" | "drawer"` prop
3. Layout uses `useMediaQuery` or CSS `hidden md:block` / `md:hidden` pattern
4. Desktop: current sidebar unchanged
5. Mobile: Drawer wraps AdminNav content, triggered by hamburger

### Open Questions for Discussion
- Should collapse state persist (localStorage/Zustand) or stay ephemeral?
- Should mobile header show breadcrumbs or just current page title?
- Should drawer close automatically on navigation? (likely yes — route-aware close exists)

---

## MOBL-02: Tables to Cards

### Current Table Inventory

**Already responsive (card layout on mobile) — minimal work:**
| Table | Location | Pattern |
|-------|----------|---------|
| OrdersTable | `src/components/ui/admin/OrdersTable.tsx` | `hidden sm:flex` header + mobile card |
| DriverListTable | `src/components/ui/admin/drivers/DriverListTable/` | `hidden md:flex` header + DriverCardRow |

**Need card conversion (6 tables):**
| Table | Location | Lines | Key Fields | Horizontal Scroll? |
|-------|----------|-------|------------|-------------------|
| MenuItemsTable | `src/app/(admin)/admin/menu/` | ~250 | name, price, category, photo, active/sold-out toggles | HIGH |
| CategoriesTable | `src/app/(admin)/admin/categories/` | ~266 | name, item count, sort order, active toggle, sort buttons | MEDIUM |
| RouteListTable | `src/app/(admin)/admin/routes/` | ~348 | date, driver, stop count, status, progress | HIGH |
| Email log | `src/app/(admin)/admin/emails/page.tsx` (inline) | ~332 | status, recipient, type, date, resend button | HIGH |
| Feedback table | `src/app/(admin)/admin/feedback/page.tsx` (inline) | ~288 | rating, customer, date, message excerpt | HIGH |
| Ratings table | `src/app/(admin)/admin/ratings/page.tsx` (inline) | ~223 | stars, customer, order, date | HIGH |

### Established Pattern (from Phases 100-101)

Desktop:
```tsx
<div className="hidden md:flex"> {/* Table header */}
  <div className="flex-1">Name</div>
  <div className="w-24">Status</div>
</div>
```

Mobile:
```tsx
<div className="flex md:hidden flex-col gap-2 p-3">
  <div className="flex justify-between">
    <span className="font-medium">{name}</span>
    <StatusBadge status={status} />
  </div>
  <div className="text-sm text-text-secondary">{detail}</div>
</div>
```

### Open Questions for Discussion
- Should we create a shared `AdminMobileCard` wrapper for consistent styling?
- Should card layouts show all columns or prioritize key info with "expand" for details?
- For inline tables (emails, feedback, ratings) — extract to separate components or keep inline with responsive branches?

---

## MOBL-03: 44px Touch Targets

### Button Component Sizes

| Size | Height | Touch Compliant? |
|------|--------|-----------------|
| `sm` | h-9 (36px) | NO |
| `md` (default) | h-11 (44px) | YES |
| `lg` | h-[52px] | YES |
| `xl` | h-[60px] | YES |
| `icon-sm` | h-9 w-9 (36px) | NO |
| `icon` | h-11 w-11 (44px) | YES |

### Full Interactive Element Audit

**~150-200 elements across 22 admin pages need review:**

| Element Type | Count | Current Size | Fix Approach | Pages Affected |
|---|---|---|---|---|
| Button `size="sm"` | ~25 | 36px | Mobile: override to `md` | 6+ |
| Icon-only (h-6 w-6, p-0) | ~7-15 | 24px | Wrap with 44px container | 5+ |
| Checkboxes (h-5 w-5) | ~3-5 | 20px | Add touch padding wrapper | 4+ |
| Toggle switch | 1-2 | 24px (h-6) | Increase container | Settings |
| Badge filter chips | ~49 | 28-32px | Add `min-h-[44px]` + padding | 8+ |
| Dropdown triggers | ~15-20 | Varies | Ensure 44px trigger | 8+ |
| Table header sort | ~8 | 16-20px | Padding on icon target | 3 |
| Close/dismiss (X) | ~3-5 | 16-24px | Padding wrapper | Multiple |
| Input `size="sm"` | ~5-10 | 36px (h-9) | Change to default `h-11` | 4+ |

### Worst Offenders (by page)
1. **CategoriesTable** — sort up/down buttons h-6 w-6 p-0 (24px), toggle active, delete
2. **MenuItemsTable** — toggle icons h-6 w-6, dropdown trigger size="sm"
3. **SectionCard** — Eye toggle, ChevronUp/Down, MoreVertical all ~p-2 (32px)
4. **Routes page** — date nav prev/next h-8 w-8 (32px), "Today" button size-sm
5. **Emails page** — filter inputs h-10 (40px), "View Order" links text-xs, resend button small

### Existing 44px Pattern (reusable)
From `CustomerContactCard.tsx`:
```tsx
"inline-flex items-center justify-center rounded-input h-11 w-11 min-h-[44px] min-w-[44px]"
```

### Strategy Options
1. **Mobile-only override**: Use `md:h-9 h-11` pattern — compact on desktop, 44px on mobile
2. **Global size increase**: Change all `size="sm"` to `size="md"` everywhere (simplest but changes desktop aesthetics)
3. **Touch target wrapper**: Create reusable `<TouchTarget>` component that adds transparent padding around small elements

### Open Questions for Discussion
- Approach 1 (mobile override) vs 2 (global increase) vs 3 (wrapper)?
- Should we change Button component's `sm` size globally or handle per-instance?
- Desktop aesthetics: is 44px everywhere acceptable or do we want compact desktop + expanded mobile?

---

## MOBL-04: Route Progress Widget

### Data Model

**Route statuses:** `planned | assigned | accepted | in_progress | completed`
**Stop statuses:** `pending | enroute | arrived | delivered | skipped`

**Existing computed fields (from `transformRouteForList()`):**
- `stopCount` = total stops
- `deliveredCount` = stops with status `delivered`
- `completionRate` = `(deliveredCount / stopCount) * 100`

**`stats_json` JSONB in routes table:**
```typescript
{
  total_stops: number;
  pending_stops: number;
  delivered_stops: number;
  skipped_stops: number;
  completion_rate: number;       // 0-100%
  total_distance_miles?: number;
  total_duration_minutes?: number;
}
```

### Widget Design Assumption

Per active route card:
```
┌──────────────────────────────────────┐
│ 👤 Driver Name          in_progress  │
│ ████████████░░░░░  8/12 delivered    │
│ Started 2:30 PM         Route #4     │
└──────────────────────────────────────┘
```

- Driver avatar + name
- Progress bar (delivered / total)
- "X/Y delivered" text
- Route status badge (StatusBadge component exists)
- Started time or ETA
- Compact enough for ops dashboard (multiple routes visible)

### Polling Gap

**Current ops polling:** `/api/admin/ops/orders` every 5s — does NOT include route progress

**Options:**
| Approach | Pros | Cons |
|----------|------|------|
| A: New `/api/admin/ops/routes-progress` endpoint | Clean separation, lightweight | New endpoint to maintain |
| B: Extend ops orders response with route summaries | Single polling call | Bloats existing response |
| C: Reuse `/api/admin/routes?date=today` | No new endpoint | Returns full route data (heavier), existing endpoint not optimized for polling |

### `stats_json` Freshness Question

**Critical:** Is `stats_json` updated when driver marks a stop as delivered?
- If yes: widget can use `stats_json` directly (fast, no aggregation needed)
- If no: widget must aggregate from `route_stops` JOIN (slower but accurate)
- Need to verify: check if driver stop status update API calls `update_route_stats()` or similar

### Open Questions for Discussion
- Polling approach: A (new endpoint) vs B (extend) vs C (reuse)?
- Should widget show on ops dashboard only, or also on routes list page?
- Include skipped stops in progress bar? (e.g., 8 delivered + 2 skipped = 10/12, show skipped differently?)
- Should widget be clickable (navigate to route detail)?

---

## Cross-Phase Context (Phases 99-101)

### Explicitly Deferred to Phase 102
1. **Phase 100-CONTEXT.md**: "Does NOT cover: admin mobile layout overhaul (Phase 102)"
2. **Phase 101-CONTEXT.md**: "Does NOT cover: admin mobile layout (Phase 102)"
3. **Phase 100-CONTEXT.md**: "44px touch targets proactively (ahead of Phase 102 MOBL-03 requirement)"

### Components Added in Phases 100-101 That Need Mobile Audit

| Component | Location | Mobile Status |
|-----------|----------|---------------|
| DragReorderList | `src/components/ui/DragReorderList/` | Already responsive (MoveButtons on mobile, DragHandle on desktop) |
| RouteStopCard | `src/components/ui/admin/routes/RouteStopCard/` | Subfolder with StopCardContent + StopCardActions |
| StatusBadge | `src/components/ui/admin/StatusBadge.tsx` | 5 statuses, renders fine at any size |
| AcceptDeclineBar | `src/components/ui/driver/AcceptDeclineBar.tsx` | Sticky bottom bar with safe-area (pattern reference) |
| RouteActionsMenu | `src/components/ui/admin/routes/RouteDetailClient/RouteActionsMenu.tsx` | 44px trigger (already compliant) |
| SplitRouteModal | Phase 100 | Radix Dialog — test on mobile |
| MergeRouteModal | Phase 100 | Radix Dialog — test on mobile |

### Verification Status
- Phase 99: 11/11 truths PASSED
- Phase 100: 15/15 truths PASSED
- Phase 101: 18/18 truths PASSED (human_needed for manual page audit)
- **Phase 102 can begin immediately**

---

## Applicable Learnings (15 cross-referenced)

### CRITICAL — Will Cause Bugs If Ignored

| # | Learning | File | How It Applies |
|---|---------|------|----------------|
| 1 | Nested `overflow-y-auto` without explicit height blocks wheel events | mobile-ux.md | Admin tables in `overflow-auto` main area — single scroll container per axis |
| 2 | Drawer swipe-to-close needs `height="auto"` + ResizeObserver | mobile-ux.md | Bottom sheets for mobile filters/menus need both layers |
| 3 | Responsive negative margin must match parent padding per breakpoint | mobile-ux.md | Full-bleed cards: `px-4 -mx-4 sm:px-6 sm:-mx-6` |
| 4 | Safe area inset: position not padding for fixed elements | mobile-ux.md | Mobile header bar, sticky bottom elements |
| 5 | `backdrop-blur` perf on mobile — tablet+ only | mobile-ux.md | Overlays: `sm:backdrop-blur-sm`, no blur on mobile |
| 6 | Flex `items-center` collapses children without `w-full` | react-patterns.md | Mobile card layouts need `w-full` on children |
| 7 | `loading="lazy"` + animated containers = images never load | animation.md | Dashboard images in Framer Motion: use `loading="eager"` |
| 8 | Tailwind v4 `@theme inline` is only source of truth | tailwind-v4.md | New tokens in `globals.css`, not config |

### IMPORTANT — Affects Quality

| # | Learning | File | How It Applies |
|---|---------|------|----------------|
| 9 | Ref instability across conditional renders | react-patterns.md | Stable wrapper around loading→loaded transitions |
| 10 | `willChange` only on interaction | performance.md | Table row hover: `willChange: isHovered ? "transform" : "auto"` |
| 11 | E2E: use `.count()` for DOM removal, not `.toBeVisible()` | testing.md | Drawer/modal close tests |
| 12 | Event listeners inside `useEffect`, not `useCallback` | react-patterns.md | Resize/scroll listeners |
| 13 | Framer `drag` unreliable with `fixed` — use pointer events | react-patterns.md | No draggable FABs with Framer |
| 14 | Mobile CSS variable resolution — explicit colors | tailwind-v4.md | `bg-white dark:bg-black md:bg-white/80` |
| 15 | touchAction conflicts: parent pan-x blocks child scroll | mobile-ux.md | DragReorderList in mobile contexts |

---

## Padding Inconsistencies to Fix

| Page | Current | Target |
|------|---------|--------|
| Dashboard `/admin` | `p-8` | `p-4 md:p-8` |
| Analytics Hub `/admin/analytics` | `p-8` | `p-4 md:p-8` |
| Delivery Analytics | `p-8` | `p-4 md:p-8` |
| Driver Analytics | `p-8` | `p-4 md:p-8` |
| Feedback `/admin/feedback` | (no padding) | `p-4 md:p-8` |
| Ratings `/admin/ratings` | (no padding) | `p-4 md:p-8` |

Pages already correct: Drivers, Menu, Menu Edit, Routes, Photos, Emails (`p-4 md:p-8`)

---

## Summary: Key Discussion Points for `/gsd:discuss-phase 102`

1. **Drawer vs bottom nav** — assumption is drawer; confirm
2. **Mobile header bar design** — hamburger + title + what else?
3. **Touch target strategy** — mobile-only override vs global size increase vs wrapper component
4. **Table card layout** — shared `AdminMobileCard` pattern or per-table?
5. **Route progress widget** — polling approach, placement, `stats_json` freshness
6. **Scope of "all admin pages"** — include route builder? photo upload? settings forms?
7. **Ambiguous modals** — SplitRouteModal, MergeRouteModal: mobile treatment or just test as-is?
8. **Photos sidebar** — bottom sheet on mobile or just hide?
