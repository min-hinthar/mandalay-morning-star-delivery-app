---
phase: 61-admin-pages
plan: 03
subsystem: ui
tags:
  [react, next-js, admin, order-detail, collapsible-card, status-dialog, audit-log, email-history]

# Dependency graph
requires:
  - phase: 61-01
    provides: "Extended order details API, status update with email/audit, priority toggle endpoint"
  - phase: 41-admin-orders
    provides: "Base OrderDetailExpanded, config (STATUS_COLORS, STATUS_LABELS, NEXT_STATUSES, AUDIT_ACTION_LABELS)"
provides:
  - "Full admin order detail page at /admin/orders/[id] with 8 card sections"
  - "StatusChangeDialog with email preview, notify checkbox, optimistic updates"
  - "Reusable CollapsibleCard wrapper component"
  - "StatusTimelineCard with visual vertical timeline from audit log"
  - "EmailHistoryCard wrapping existing EmailHistory component"
affects: [61-04, 61-05, admin-order-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CollapsibleCard pattern: shared wrapper with toggle open/close, icon + title header, chevron rotation"
    - "Optimistic status update: update UI immediately, revert on API failure via onStatusFailed callback"
    - "Two-column responsive grid: items+totals+email left, customer+timeline+payment right"

key-files:
  created:
    - "src/app/(admin)/admin/orders/[id]/page.tsx"
    - "src/app/(admin)/admin/orders/[id]/loading.tsx"
    - "src/app/(admin)/admin/orders/[id]/not-found.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/index.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/types.ts"
    - "src/components/ui/admin/orders/OrderDetailPage/CollapsibleCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/OrderHeaderCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/CustomerInfoCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/OrderItemsCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/TotalsCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/PaymentInfoCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/OrderDetailClient.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/StatusChangeDialog.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/StatusTimelineCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/EmailHistoryCard.tsx"
  modified: []

key-decisions:
  - "Used existing Modal component for StatusChangeDialog instead of ConfirmDialog (ConfirmDialog only supports description string, not custom content)"
  - "Payment status derived from order status (delivered=Paid, cancelled=Refunded, else Pending) per research recommendation"
  - "Google Maps static image uses <img> tag (not next/image) since dynamic external API URLs are not optimizable"
  - "Order list navigation kept as drawer pattern (click row -> drawer -> View Full Order Page link) rather than replacing with direct page navigation"
  - "Email subjects for status transitions hardcoded in StatusChangeDialog rather than fetched from API"

patterns-established:
  - "CollapsibleCard: reusable admin card with toggle, used across 7 card sections"
  - "Optimistic status update with revert: handleStatusChanged for immediate UI, handleStatusFailed to revert"
  - "OrderDetail types separate from OrderDetailExpanded types (extended with delivery window, Stripe, priority, discounts)"

# Metrics
duration: 9min
completed: 2026-02-14
---

# Phase 61 Plan 03: Order Detail Page Summary

**Full admin order detail page with 8 collapsible card sections, status change confirmation dialog with email preview, and optimistic status updates**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-14T15:35:53Z
- **Completed:** 2026-02-14T15:44:30Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Order detail page renders at /admin/orders/[id] with breadcrumb navigation and back button
- OrderHeaderCard shows status badge, priority toggle, delivery window, placed timestamp, driver, and status action buttons
- CustomerInfoCard with clickable mailto/tel links, formatted address, static Google Maps embed, special instructions callout
- OrderItemsCard with compact rows, quantity badges, refund strikethrough, per-item special instructions
- TotalsCard with subtotal/delivery/tax/discount/total breakdown using formatPrice
- PaymentInfoCard with derived payment status, Stripe dashboard link, method display
- StatusChangeDialog: Modal with status transition label, email subject preview, notify checkbox, required reason for cancellation, optimistic update with revert on failure
- StatusTimelineCard: vertical timeline with colored dots per action type from audit log
- EmailHistoryCard wraps existing EmailHistory component in CollapsibleCard
- Branded 404 page for non-existent orders with "Go back to orders" link

## Task Commits

Each task was committed atomically:

1. **Task 1: Order detail page route files and layout card components** - `82ab063` (feat, from previous session)
2. **Task 2: StatusChangeDialog, StatusTimelineCard, EmailHistoryCard, and wiring** - `cc0c006` (feat)

## Files Created/Modified

- `src/app/(admin)/admin/orders/[id]/page.tsx` - Order detail page route, renders OrderDetailClient
- `src/app/(admin)/admin/orders/[id]/loading.tsx` - RouteLoading with "Loading order details..." message
- `src/app/(admin)/admin/orders/[id]/not-found.tsx` - Branded 404 with Package icon and back link
- `src/components/ui/admin/orders/OrderDetailPage/index.tsx` - Barrel export for OrderDetailClient
- `src/components/ui/admin/orders/OrderDetailPage/types.ts` - OrderDetail, OrderDetailItem, OrderDetailAddress, AuditLogEntry types
- `src/components/ui/admin/orders/OrderDetailPage/CollapsibleCard.tsx` - Shared card wrapper with open/close toggle
- `src/components/ui/admin/orders/OrderDetailPage/OrderHeaderCard.tsx` - Status badge, priority toggle, delivery window, action buttons
- `src/components/ui/admin/orders/OrderDetailPage/CustomerInfoCard.tsx` - Customer contact links, address, static map, notes
- `src/components/ui/admin/orders/OrderDetailPage/OrderItemsCard.tsx` - Compact item rows with refund display
- `src/components/ui/admin/orders/OrderDetailPage/TotalsCard.tsx` - Financial breakdown with formatPrice
- `src/components/ui/admin/orders/OrderDetailPage/PaymentInfoCard.tsx` - Payment status and Stripe link
- `src/components/ui/admin/orders/OrderDetailPage/OrderDetailClient.tsx` - Main client component with fetch, layout, dialog wiring
- `src/components/ui/admin/orders/OrderDetailPage/StatusChangeDialog.tsx` - Status change confirmation modal with email preview
- `src/components/ui/admin/orders/OrderDetailPage/StatusTimelineCard.tsx` - Vertical timeline from audit log
- `src/components/ui/admin/orders/OrderDetailPage/EmailHistoryCard.tsx` - CollapsibleCard wrapper for EmailHistory

## Decisions Made

- Used Modal component for StatusChangeDialog (ConfirmDialog only supports simple description string, not custom content with email preview, checkbox, and textarea)
- Payment status derived from order status (no Stripe API call): delivered=Paid, cancelled=Refunded, else Pending
- Google Maps static image uses `<img>` not `next/image` since dynamic external URLs cannot be optimized
- Kept existing drawer-based navigation pattern from order list (drawer has "View Full Order Page" link to detail page)
- Email subject previews hardcoded per transition mapping rather than fetched from server

## Deviations from Plan

None - plan executed exactly as written.

Note: Task 1 files were found already committed from a previous session (commit `82ab063`). The content matched the plan requirements, so Task 1 was treated as pre-completed. Task 2 was freshly implemented and committed.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Order detail page fully functional with all 8 card sections
- Status change workflow operational with optimistic updates
- Email history integrated via existing EmailHistory component
- Ready for remaining admin pages (61-04, 61-05)
- Google Maps static image requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable (optional, gracefully hidden if missing)

---

_Phase: 61-admin-pages_
_Completed: 2026-02-14_
