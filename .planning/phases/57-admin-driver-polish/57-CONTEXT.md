# Phase 57: Admin & Driver Polish - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin and driver dashboards receive premium visual finish matching the customer experience quality. This phase polishes existing UI — card-based tables, skeleton shimmer, empty states, navigation, forms, toasts, and driver data presentation. No new features (search, notification inbox, trend analytics, stepper wizards) — just visual and interaction premium.

</domain>

<decisions>
## Implementation Decisions

### Table & Card Styling
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

### Skeleton & Loading Feel
- Skeleton-to-content: fade crossfade transition (skeleton fades out, content fades in simultaneously)
- Dashboard stat cards: counting animation (numbers count up from 0 to final value)
- Inline error card when data fails to load (replaces skeleton area with error + retry button)
- Thin top progress bar for long operations (YouTube/GitHub style, non-blocking)
- Button loading: progress fill + spinner + text swap + pulse (full premium treatment)
- Driver pages get same skeleton treatment as admin (consistent across both dashboards)
- Claude's Discretion: shimmer direction, skeleton fidelity (high vs generic), shimmer color, min display time, initial vs refresh loading distinction

### Empty State Personality
- Food emoji compositions as illustrations (matching existing brand pattern)
- Playful + food-themed messaging tone (e.g., "The kitchen is quiet... for now")
- Every empty state includes a CTA/action button
- Gentle floating animation on emoji compositions
- Same personality across admin and driver apps (unified brand voice)
- Per-page themed emojis (orders = bowls/plates, routes = trucks, drivers = people/vehicles)
- Celebration entrance when first item arrives after empty state (empty fades out, first card bounces in with sparkle)
- Claude's Discretion: filtered-to-empty vs truly-empty messaging distinction

### Driver Data Presentation
- On-time percentage: Claude's Discretion on visualization style
- Driver history: summary cards (date, stop count, on-time %, total time) — collapsed by default, expandable for per-stop detail
- Driver stop detail: full premium animation (status transitions, map marker pulse, timeline step sequence)
- Admin driver detail: performance dashboard section with 4 stat cards (deliveries, avg time, on-time %, exceptions) with animated counters
- Route detail: vertical timeline with connected dots, status icons, time between stops on connecting lines
- Route detail: estimated vs actual time comparison with visual diff (green if on time, red if late, delta bar)
- Route detail: interactive Google Maps embed with route line + stop markers
- Exception display: alert card at page top for unresolved exceptions + inline badges on affected rows
- Exception actions: "Mark Resolved" quick action on alert card + link to navigate to full detail

### Admin Dashboard Stats
- All key metrics displayed: orders, revenue, active drivers, on-time rate, pending, exceptions
- Each stat card links/navigates to its relevant detail page
- Animated counter numbers on load
- Stat cards with subtle teal gradients

### Color & Theme
- Admin uses teal/cyan accent color (distinct from customer's warm gold)
- Driver app also uses teal accent (operational apps share palette, distinct from customer)
- Token-ready for dark mode (semantic tokens throughout, dark mode itself deferred)
- Extended status color palette: green (complete), blue (in transit), amber (pending), red (failed), gray (cancelled)
- Subtle teal gradients on stat cards and feature cards

### Navigation
- Admin sidebar: animated active indicator (slides to active item) + icon hover animations (wobble/scale)
- Animated breadcrumbs with smooth transitions, chevron separators, clickable parents
- Unified admin page header component: page title + animated count badge + action buttons area
- Driver app: bottom tab bar with animated active indicator + badge counts for pending items

### Notification Styling
- Floating card toasts (rounded card with shadow, slides in from top-right, icon + message + optional action)
- Critical-only sounds (subtle chime for new orders and exceptions, silent for success/info)
- Toast stacking: first visible, rest collapsed as "+3 more" badge, expandable
- Swipe to dismiss + auto-dismiss with fade after timeout

### Form Polish
- Floating labels (animate from inside input to above on focus, matching auth experience)
- Validation: shake + inline error (invalid field shakes briefly + red text below + red border)
- Save success: checkmark morph animation on button + success toast (double confirmation)
- FloatingUnsavedBar on every admin form (consistent, prevents data loss)

### Claude's Discretion
- Bulk action checkboxes (assess whether admin volume justifies it)
- Existing filter/search UI polish (improve what's there, don't build new search)
- Select/dropdown and date/time picker styling
- Animation timing and easing curves throughout

</decisions>

<specifics>
## Specific Ideas

- Card rows should feel like Linear's issue cards — clean, not cluttered
- Matches existing app personality: playful, alive with motion, food-themed
- Search result stagger cap pattern (55-02) reused for table row entry animation
- SaveButton morph pattern from Phase 50 extended to all admin action buttons
- FloatingUnsavedBar from Phase 50 applied universally across admin forms
- Auth floating label pattern from Phase 53 reused in admin forms
- Customer-facing polish quality (v1.2-v1.5) as the benchmark for admin/driver

</specifics>

<deferred>
## Deferred Ideas

- **Global admin Cmd+K search** — Repurpose CommandPalette for cross-entity admin search (orders, drivers, routes). New capability, own phase.
- **Dashboard trend comparisons** — Daily/weekly toggle for stat card deltas ("+12 vs yesterday"). New data computation, own phase.
- **Admin dark mode** — Full dark theme for admin. Token-ready in Phase 57, actual dark variants deferred.
- **Notification bell + inbox** — Persistent notification center with read/unread state. New feature, own phase.
- **Multi-step wizard/stepper** — Animated stepper UI for complex admin operations (create route, bulk assign). New component infrastructure, own phase.

</deferred>

---

*Phase: 57-admin-driver-polish*
*Context gathered: 2026-02-11*
