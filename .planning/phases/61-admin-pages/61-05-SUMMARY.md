---
phase: 61-admin-pages
plan: 05
subsystem: ui
tags: [tiptap, rich-text-editor, react, next-js, admin, email-compose, resend, api]

# Dependency graph
requires:
  - phase: 61-03
    provides: "Order detail page with EmailHistoryCard, CollapsibleCard, OrderDetailClient"
provides:
  - "ManualEmailDialog with two-step compose/preview flow"
  - "TiptapEditor rich text editor component"
  - "POST /api/admin/emails/compose endpoint for admin-authored emails"
  - "Manual emails tracked in notification_logs with 'manual' type"
affects: [admin-email-management]

# Tech tracking
tech-stack:
  added:
    - "@tiptap/react 3.19.0"
    - "@tiptap/starter-kit 3.19.0"
    - "@tiptap/extension-placeholder 3.19.0"
    - "@tiptap/extension-link 3.19.0"
    - "@tiptap/pm 3.19.0"
  patterns:
    - "Tiptap editor: useEditor hook with StarterKit + Placeholder + Link extensions"
    - "Two-step compose flow: edit with rich text -> preview with rendered HTML -> send"
    - "Direct Resend client for admin-authored HTML (bypasses React email templates)"

key-files:
  created:
    - "src/components/ui/admin/orders/OrderDetailPage/TiptapEditor.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/ManualEmailDialog.tsx"
    - "src/app/api/admin/emails/compose/route.ts"
  modified:
    - "src/components/ui/admin/orders/OrderDetailPage/EmailHistoryCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/CollapsibleCard.tsx"
    - "src/components/ui/admin/orders/OrderDetailPage/OrderDetailClient.tsx"
    - "src/app/(admin)/admin/orders/[id]/EmailHistory.tsx"

key-decisions:
  - "Used Resend client directly for manual emails (not sendEmail/React email templates) since admin-authored HTML doesn't need React rendering pipeline"
  - "Tiptap v3.19.0 fully compatible with React 19 (no peer dependency issues)"
  - "Auto-footer built server-side from order data (items + delivery address) for consistency"

patterns-established:
  - "TiptapEditor: reusable rich text editor with configurable toolbar and placeholder"
  - "Two-step email compose: compose -> preview -> send pattern with loading state"
  - "CollapsibleCard action prop: header-level action slot (button) alongside collapse toggle"

# Metrics
duration: 8min
completed: 2026-02-14
---

# Phase 61 Plan 05: Manual Email Compose Summary

**Tiptap rich text editor with two-step compose/preview modal and direct Resend API endpoint for admin-authored customer emails**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-14T15:48:27Z
- **Completed:** 2026-02-14T15:56:46Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- TiptapEditor renders with bold/italic/bullet list/ordered list/link toolbar and focus ring styling
- ManualEmailDialog provides two-step compose -> preview -> send flow with loading states
- Order context auto-included in email footer (order number, items list, delivery address)
- POST /api/admin/emails/compose sends via Resend with notification_logs tracking
- EmailHistoryCard gains Compose button in header; EmailHistory shows "Manual" badge for manual emails
- CollapsibleCard extended with action prop for header-level buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Tiptap and build TiptapEditor + ManualEmailDialog components** - `a545daa` (feat)
2. **Task 2: Create manual email compose API endpoint** - `22055b6` (feat)

## Files Created/Modified

- `src/components/ui/admin/orders/OrderDetailPage/TiptapEditor.tsx` - Tiptap rich text editor with formatting toolbar
- `src/components/ui/admin/orders/OrderDetailPage/ManualEmailDialog.tsx` - Two-step compose/preview modal dialog
- `src/app/api/admin/emails/compose/route.ts` - Manual email compose API with Zod validation, Resend send, notification logging
- `src/components/ui/admin/orders/OrderDetailPage/EmailHistoryCard.tsx` - Added Compose button and ManualEmailDialog integration
- `src/components/ui/admin/orders/OrderDetailPage/CollapsibleCard.tsx` - Added action prop for header-level actions
- `src/components/ui/admin/orders/OrderDetailPage/OrderDetailClient.tsx` - Passes orderNumber/email/summary to EmailHistoryCard
- `src/app/(admin)/admin/orders/[id]/EmailHistory.tsx` - Added "Manual" to TYPE_LABELS

## Decisions Made

- Used Resend client directly for manual compose (bypasses React email rendering since admin HTML doesn't need template processing)
- Tiptap v3.19.0 works with React 19 without compatibility workarounds
- Auto-footer built server-side from order data for email consistency
- CollapsibleCard action prop uses `onClick stopPropagation` to prevent toggle on action click

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CollapsibleCard missing action prop**

- **Found during:** Task 1 (EmailHistoryCard update)
- **Issue:** CollapsibleCard had no `action` prop for header-level buttons; EmailHistoryCard needed a Compose button in the card header
- **Fix:** Added optional `action` prop to CollapsibleCard with stopPropagation wrapper, restructured header as flex container with button + action slot
- **Files modified:** `src/components/ui/admin/orders/OrderDetailPage/CollapsibleCard.tsx`
- **Verification:** TypeScript compiles, Compose button renders in header
- **Committed in:** `a545daa` (Task 1 commit)

**2. [Rule 2 - Missing Critical] EmailHistory TYPE_LABELS missing "manual" type**

- **Found during:** Task 2 (compose API endpoint)
- **Issue:** EmailHistory component had no label for "manual" notification_type; manual emails would show raw type string
- **Fix:** Added `manual: "Manual"` to TYPE_LABELS record
- **Files modified:** `src/app/(admin)/admin/orders/[id]/EmailHistory.tsx`
- **Verification:** TypeScript compiles, "Manual" label available
- **Committed in:** `22055b6` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both fixes necessary for correct rendering. No scope creep.

## Issues Encountered

None

## User Setup Required

None - Resend API key and email configuration already in place from prior phases.

## Next Phase Readiness

- Manual email compose fully functional from order detail page
- Phase 61 (Admin Pages) is now complete with all 5 plans delivered
- Ready for Phase 62+ work

---

_Phase: 61-admin-pages_
_Completed: 2026-02-14_
