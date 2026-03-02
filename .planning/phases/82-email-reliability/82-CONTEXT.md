# Phase 82: Email Reliability - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Operator can self-diagnose and recover from email delivery failures without developer help. This phase hardens the existing email infrastructure: proper webhook verification, failure flagging with manual contact workflow, dashboard enhancements for self-diagnosis, and order-level email status indicators. No new email types or templates.

</domain>

<decisions>
## Implementation Decisions

### Manual Contact Flagging
- After 3 failed email attempts for an order, flag the order for manual customer contact
- Dual visibility: red "Email Failed" badge on order row in ops dashboard + dedicated "Needs Contact" section at top of ops dashboard
- Resolution: "Mark Contacted" button clears the flag, logs who resolved it and when
- Passive visibility only — no push notifications for flagged orders (dashboard is checked regularly)

### Webhook Signature Verification
- Upgrade to proper Svix HMAC signature verification using the `svix` package (Resend uses Svix under the hood)
- Log rejected webhooks (bad signature) with IP, timestamp, and payload hash for security monitoring
- Webhook processing must be idempotent — track webhook event IDs and skip duplicate deliveries from Resend

### Dashboard Improvements
- Add summary stats bar at top: sent/delivered/failed/bounced rates for today, this week, all time
- Add expandable error details panel: click a failed email row to see full error message, retry history, webhook event timeline
- Parse error codes and show operator-friendly guidance: "bounce = bad address", "timeout = try again", "rate limit = wait"
- Keep one-at-a-time resend (no bulk retry) — operator reviews each failure individually
- Manual refresh (current behavior) — no auto-polling needed

### Order Detail Email Indicator
- Add email status badge near order status header: "Email: Delivered" (green) / "Email: Failed" (red) / "Email: Pending" (yellow) — visible without scrolling
- Keep existing EmailHistoryCard collapsible for full event timeline (sent -> delivered -> opened)
- Inline resend button on order detail page (already partially built) + link to full email dashboard for deeper investigation
- Small icon indicator on orders list table rows: green check (delivered), red X (failed), nothing (pending) — minimal noise

### Claude's Discretion
- Failure threshold (3 attempts) hardcoded vs configurable — pick based on how other thresholds are handled in the codebase
- Webhook payload storage approach — full raw payload in audit table vs extracted fields in notification_logs metadata
- Exact stats bar time ranges and aggregation queries
- Error code categorization mapping for operator-friendly suggestions
- Badge/icon component design and positioning details

</decisions>

<specifics>
## Specific Ideas

- Existing `notification_logs` table already tracks sends with resend_id, status, error_message — build on this, don't create a new table
- Current `send.ts` already retries 3x with exponential backoff — the "3 failures" flagging hooks into the existing failure path
- Resend webhook handler at `src/app/api/webhooks/resend/route.ts` already processes delivered/opened/bounced events — needs svix upgrade, not rewrite
- Current email dashboard at `src/app/(admin)/admin/emails/page.tsx` has the foundation — enhance with stats bar and error details expansion

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/email/send.ts`: Full email pipeline with retry, kill switch, preference checks — failure flagging hooks into the exhausted-retries path (line 199)
- `src/lib/email/constants.ts`: MAX_RETRY_ATTEMPTS=3, RETRY_BASE_DELAY_MS=10000 — threshold already defined
- `src/app/api/webhooks/resend/route.ts`: Webhook handler with event type mapping, notification_logs updates — needs svix verification layer
- `src/app/(admin)/admin/emails/page.tsx`: Email dashboard with filters, pagination, resend button — base for enhancements
- `src/app/api/admin/emails/route.ts`: Paginated email log API with filtering — needs stats endpoint or query additions
- `src/app/api/admin/emails/[id]/resend/route.ts`: Full resend pipeline with order data reconstruction — already production-ready
- `src/components/ui/admin/orders/OrderDetailPage/EmailHistoryCard.tsx`: Collapsible email history with compose — add status badge
- `src/app/(admin)/admin/orders/[id]/EmailHistory.tsx`: Email history component for order detail
- `notification_logs` table: id, order_id, user_id, notification_type, channel, recipient, subject, resend_id, status, error_message, sent_at, created_at, metadata

### Established Patterns
- Admin auth: `requireAdmin()` from `src/lib/auth` — all admin API routes use this
- Rate limiting: `checkRateLimit({ limiter: adminLimiter, ... })` — all admin endpoints rate-limited
- Logging: `logger.info/warn/error/exception` from `src/lib/utils/logger` — structured logging with flowId
- Service client: `createServiceClient()` from `src/lib/supabase/server` — server-side DB access
- Badge component: `<Badge variant="..." size="sm">` from `src/components/ui/badge` — used throughout admin
- CollapsibleCard: Used in OrderDetailPage for sectioned content
- Toast notifications: `toast({ message, type })` from `src/lib/hooks/useToastV8`

### Integration Points
- Ops dashboard (`src/components/ui/admin/ops/`): Add "Needs Contact" section
- Orders table (`src/components/ui/admin/orders/`): Add email status icon to order rows
- Order detail page (`src/components/ui/admin/orders/OrderDetailPage/`): Add status badge to header
- Stripe webhook handler (`src/app/api/webhooks/stripe/handlers.ts`): Triggers email sends — failure flagging connects here
- Admin settings (`src/app/(admin)/admin/settings/`): Potential location for email threshold config if made configurable
- Admin nav (`src/components/ui/layout/AdminLayout.tsx`): Email log page already linked

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 82-email-reliability*
*Context gathered: 2026-03-01*
