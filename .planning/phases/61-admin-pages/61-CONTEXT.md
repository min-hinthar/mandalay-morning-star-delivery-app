# Phase 61: Admin Pages - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can view full order details and manage their own profile without leaving the app. This includes an order detail page at `/admin/orders/[id]` (items, totals, customer info, timestamps, email history, status changes) and an admin profile page at `/admin/profile` (view/edit personal info, role, preferences). APIs already exist — this phase builds the UI.

</domain>

<decisions>
## Implementation Decisions

### Order Detail Layout
- Sectioned card layout — separate collapsible cards for order items, customer info, totals, timeline, email history
- Fully responsive — works well on both desktop and mobile
- Clickable customer contacts — email (mailto:) and phone (tel:) links
- Visual timeline showing status transitions with timestamps (no user attribution)
- Full totals breakdown — subtotal, delivery fee, tax, discounts, grand total
- Delivery instructions and dietary notes in a highlighted callout box
- Delivery time window shown prominently at top of page
- Payment info displayed — method, status (paid/pending/refunded), Stripe payment ID
- Static Google Maps embed for delivery address
- Accessible from order list click AND via direct URL (bookmarkable)
- Non-existent order shows branded 404 page with "Go back to orders" link
- Collapsible cards for mobile scroll reduction

### Status Change Workflow
- Confirmation dialog required for every status change
- Cancellation requires a reason; other transitions optional reason
- Customer notification email on status change (reuses Phase 54 email templates)
- Confirmation dialog shows email preview that customer will receive
- "Notify customer" checkbox (checked by default) — admin can opt out per change
- Tooltip hints on status options show what email the customer would receive
- Optimistic UI — status badge updates immediately, reverts if server fails
- Status change feedback via inline badge highlight animation (not toast)
- Admin stays on order detail page after status change
- Priority toggle — admin can flag orders as rush/priority (internal only, not visible to customer)

### Email History Display
- Empty state shown when no emails sent for an order ("No emails sent for this order")
- Failed emails show error reason from Resend API
- Resend button on failed emails to retry delivery
- Manual email compose via modal dialog with rich text editor
- Manual emails auto-include order context (order #, items summary, delivery details) in footer
- Confirmation preview before sending manual emails
- Manual emails tracked in email history with "Manual" badge
- Timestamps only (no user attribution) — consistent with status timeline

### Admin Profile Page
- Card-based layout matching order detail design language
- Show role + permissions list (read-only)
- Show auth provider ("Signed in with Google")
- Show account creation date ("Member since January 2026")
- Basic activity stats — last login time, orders processed count (clickable to filtered order list)
- Notification preference toggles for order events (email)
- Dark/light/system theme toggle
- Sign out button on profile page
- Explicit "Save Changes" button with loading spinner (disabled during save)
- Success toast notification after saving
- Accessible from both sidebar link and avatar dropdown

### Claude's Discretion
- Order item row density (compact vs detailed, with/without thumbnails)
- Navigation style (back arrow vs breadcrumb)
- Desktop grid layout (two-column vs single column)
- Status badge color scheme
- Status transition restrictions (strict forward vs flexible)
- Auto-refresh vs manual refresh for order updates
- Quick action buttons at top of order detail
- Admin notes field on orders
- Order type differentiation (delivery vs pickup)
- Loading state style (skeleton vs spinner)
- Keyboard shortcuts for order navigation
- Subscription plan display
- Customer link to order history
- Email history display format (expandable list vs timeline entries)
- Email metadata detail level
- Email HTML content preview
- Email templates for manual compose
- Bulk status change from order list
- Status change reversibility (undo window)
- Cancelled order visual treatment
- Password change functionality
- Account deletion option
- Notification channel scope
- Dirty form state indicator
- Print/export functionality

</decisions>

<specifics>
## Specific Ideas

- Reuse Phase 54 email templates for status change notifications — consistent customer experience
- Google Maps Static API for delivery address map (requires API key)
- Rich text editor for manual email compose (not plain textarea)
- Priority flag is operations-internal — customer never sees it
- Status timeline is timestamps-only (no "changed by Admin X" attribution)
- Profile notification toggles are email-only for now (align with existing email infrastructure)
- Orders processed stat links to filtered order list for that admin

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 61-admin-pages*
*Context gathered: 2026-02-14*
