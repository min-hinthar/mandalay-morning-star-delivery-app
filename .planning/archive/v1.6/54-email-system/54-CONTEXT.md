# Phase 54: Email System - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Customers receive branded transactional emails for every order lifecycle event: confirmation, cancellation, refund notification, and delivery reminder. Emails are sent via Resend + React Email, respect customer notification preferences (Phase 51), and use Stripe webhook idempotency to prevent duplicates. Admin has visibility into email sending via log and management tools.

</domain>

<decisions>
## Implementation Decisions

### Email Design & Branding

- Warm & food-forward visual style matching the app's golden/warm palette
- Full branded banner header: logo + tagline + warm gradient background strip
- Playful & Burmese-themed tone: "Mingalabar! Your feast is on the way" style
- Full footer: business address, social media links, support email, unsubscribe link, app download link
- Decorative food illustrations in template borders + actual menu item thumbnails in order details
- App brand colors (golden/warm palette) consistently across all email types
- Prominent CTA button linking back to app ("View Your Order", "Track Delivery")
- Match app's visual identity exactly: same gradients, web-safe font equivalents, warm feel
- Food emoji in subject lines (e.g., "Your Mohinga & Shan Noodles are coming tomorrow!")
- Dark-mode aware: transparent PNGs, dark-mode-friendly colors, meta tags
- Burmese greeting ("Mingalabar!") at top + English body text
- Subtle "Morning Star Delivery" brand mark with star icon in footer
- Unique header illustration per email type (celebratory for confirmation, different mood for cancellation)
- Subtle animated GIF shimmer/sparkle in header (graceful fallback in non-supporting clients)
- Visual order status tracker: Confirmed -> Preparing -> Out for Delivery -> Delivered progress steps
- Warm & apologetic tone for cancellation/refund emails ("We're sorry to see this order go")
- Mobile-first responsive design (single column on mobile, wider on desktop)
- "View in browser" fallback link at top of every email

### Email Content — Order Confirmation

- Full receipt: all items with prices, quantities, modifiers, subtotal, tax, delivery fee, tip, total
- Full delivery block: address (full structured with apt/unit bold), estimated window, delivery instructions, driver name when assigned
- Items grouped by category (Soups, Rice Dishes, Drinks, etc.) mirroring menu structure
- All item modifiers shown (e.g., "extra spicy", "no onions")
- Payment method info: "Paid with Visa ending in 1234"
- Clickable order number linking to /orders/[id] in the app
- Delivery instructions always shown (even if not set)
- Dietary restriction callout if customer has preferences set
- "Reorder" CTA button for repeat business
- Subtle "You might also like" section with 2-3 popular menu items
- "Need help?" support section with reply/contact info
- Social sharing option

### Email Content — Cancellation

- Order summary showing what was cancelled
- Cancellation reason (if available)
- Whether a refund was issued
- "Place new order" CTA button to encourage reorder

### Email Content — Refund

- Detailed breakdown: original amount, refund amount, refund method, expected timeline, items refunded
- Refund reason always shown
- Partial refunds get distinct treatment: original total, items refunded, partial refund amount, remaining charge

### Email Content — Delivery Reminder

- Food excitement at top ("Your Mohinga & Shan Noodles are coming tomorrow!") + logistics details below
- Static map image of delivery address + "View on Map" link to Google Maps
- Modify/cancel links directing to order details page
- Fires morning of delivery (e.g., 8am)

### Delivery & Timing Behavior

- Order confirmation sent immediately on payment confirmation
- Delivery reminder fires morning of delivery day
- Retry on failure: 3 attempts with exponential backoff (~30 second window), then log failure
- Stripe webhook idempotency: both DB table (processed event IDs) + Resend idempotency key
- Per-customer rate limiting to prevent spam if processing goes wrong
- Duplicate event protection: idempotency table + rate limiting on webhook endpoint (defense in depth)
- Async background email sending (API response returns immediately)
- Email log: DB table logging every sent email (type, recipient, status, timestamp) + Resend dashboard for analytics
- Admin notification on email send failures
- No quiet hours (morning-of-delivery timing is already appropriate)
- Short retry window (3 attempts, ~30s) — no extended retry queue

### Preference & Opt-out Handling

- Per-type toggles: separate controls for order updates, delivery reminders, promotions
- Order confirmation and refund emails are mandatory (receipts) — cannot be opted out
- Unsubscribe link goes to app's Settings page (Phase 51 notification toggles) — single source of truth
- List-Unsubscribe and List-Unsubscribe-Post headers for native email client unsubscribe buttons
- All emails ON by default for new customers (opt-out model)
- Preference check happens before email rendering (don't build email if opted out)
- Admin can see customer opt-out status in admin dashboard
- Admin kill switch to disable all email sending system-wide (in admin settings)

### Email Testing

- React Email preview server for rapid iteration + real Resend sends for final verification
- No unit tests for email template rendering (visual preview is sufficient)
- "Send Test Email" button per email type in admin settings
- Realistic sample data fixtures using actual menu item names (Mohinga, Shan Noodles, etc.)

### Error Handling

- Retry storm protection: idempotency table for correctness + rate limiting for defense in depth
- All error scenarios delegated to Claude's discretion (no email address, incomplete data, render failures, Resend outage, bounces, webhook verification)

### Admin Email Management

- Per-order email history on order detail page + global email log page
- Manual "Resend" button on failed emails
- Manual trigger: admin can send any email type for any order (support tool)
- Full delivery status tracking: sent -> delivered -> opened -> clicked with timestamps
- Email stats (sent/failed/bounce rate) on email log page (not main dashboard)

### Claude's Discretion

- Mascot usage in emails (based on rendering constraints)
- Food motifs for decorative illustrations
- Typography approach (web-safe vs Google Font)
- Customer name personalization (use if available, graceful fallback)
- Architecture choice: Next.js API routes vs Supabase Edge Functions
- Email domain: main domain vs subdomain
- From address and reply-to address selection
- Sender domain setup (dedicated subdomain vs main domain)
- Peak-time throttling approach
- Plain-text alternative generation
- Resend sandbox/test mode in non-production environments
- Email client compatibility testing approach
- No-email-address handling
- Incomplete order data handling
- Template render failure fallback
- Resend outage mitigation
- Bounce tracking approach
- Webhook signature verification error handling
- Dead letter queue vs failed status in main log
- Incorrect data correction approach
- Email log filtering/search capabilities
- Sent email HTML preview approach
- Template versioning approach
- API key management (env var vs admin-configurable)
- Template text customization (code-only vs admin-editable)
- Recovery alert notification
- Same-day delivery reminder handling
- Email open tracking (Resend built-in vs custom)
- Cancellation-refund email timing (immediate vs bundled)
- i18n-ready template structure
- GDPR/privacy notice in footer

</decisions>

<specifics>
## Specific Ideas

- "I want it to match the app exactly" — same golden gradients, warm feel, food-forward aesthetic
- Burmese greeting "Mingalabar!" at the top of emails
- Food emoji in subject lines for happy emails
- Each email type has unique header art (celebratory for confirmation, different mood for cancellation)
- Visual order status tracker showing step progression
- Static map image + "View on Map" link for delivery address
- "You might also like" section with popular items in confirmation emails
- "Reorder" and social sharing CTAs in confirmation
- Warm & apologetic tone for cancellations ("We're sorry to see this order go")
- Items grouped by category in confirmation receipt
- Full structured address with apt/unit prominently displayed
- Admin "Send Test Email" button for each email type
- Admin manual trigger for any email on any order (support tool)
- Dietary restriction callout in order confirmation

</specifics>

<deferred>
## Deferred Ideas

- **Welcome/onboarding email** — First-time signup branded welcome email introducing the app. New capability; email infrastructure from this phase makes it easy to add later.
- **Loyalty/rewards points in emails** — Show points earned per order. Requires loyalty system (doesn't exist yet).
- **Batch/marketing emails** — Menu update announcements, promotional campaigns. Separate feature from transactional emails.
- **Feedback/rating email** — Post-delivery "Rate your experience" email. Requires rating system.

</deferred>

---

_Phase: 54-email-system_
_Context gathered: 2026-02-09_
