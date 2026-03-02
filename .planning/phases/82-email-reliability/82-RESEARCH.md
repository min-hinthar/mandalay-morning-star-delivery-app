# Phase 82: Email Reliability - Research

**Researched:** 2026-03-01
**Domain:** Email delivery tracking, webhook verification, admin self-service
**Confidence:** HIGH

## Summary

Phase 82 enhances existing email infrastructure for operator self-diagnosis and recovery. The codebase already has a solid foundation: `notification_logs` table, `send.ts` with 3x retry, Resend webhook handler, admin email dashboard with filters/pagination/resend, and `EmailHistoryCard` on order detail. The work is additive — upgrade webhook verification to HMAC via svix, add `needs_contact` flagging after exhausted retries, enhance the dashboard with stats and error details, and add email status badges to order views.

**Primary recommendation:** Build on existing `notification_logs` table and patterns. No new tables needed — add columns (`retry_count`, `needs_contact`, `contacted_at`, `contacted_by`) and a `webhook_audit_logs` table for security logging. Install `svix` package for proper HMAC verification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- After 3 failed email attempts for an order, flag the order for manual customer contact
- Dual visibility: red "Email Failed" badge on order row in ops dashboard + dedicated "Needs Contact" section at top of ops dashboard
- Resolution: "Mark Contacted" button clears the flag, logs who resolved it and when
- Passive visibility only — no push notifications for flagged orders (dashboard is checked regularly)
- Upgrade to proper Svix HMAC signature verification using the `svix` package (Resend uses Svix under the hood)
- Log rejected webhooks (bad signature) with IP, timestamp, and payload hash for security monitoring
- Webhook processing must be idempotent — track webhook event IDs and skip duplicate deliveries from Resend
- Add summary stats bar at top: sent/delivered/failed/bounced rates for today, this week, all time
- Add expandable error details panel: click a failed email row to see full error message, retry history, webhook event timeline
- Parse error codes and show operator-friendly guidance: "bounce = bad address", "timeout = try again", "rate limit = wait"
- Keep one-at-a-time resend (no bulk retry) — operator reviews each failure individually
- Manual refresh (current behavior) — no auto-polling needed
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EMAIL-01 | Email failure tracking table — log attempts, failures, retries | Existing `notification_logs` table + add `retry_count`, `needs_contact` columns; `send.ts` already logs on failure path |
| EMAIL-02 | Admin email dashboard — failed emails with one-click retry | Existing dashboard at `admin/emails/page.tsx` with resend button; enhance with stats bar + expandable error details |
| EMAIL-03 | Order detail indicator — email sent/pending/failed status | Add Badge to `OrderHeaderCard.tsx`; query latest notification_log status for order |
| EMAIL-04 | Surface Resend webhook data in admin (delivered, opened, bounced) | Webhook handler already updates metadata.resend_events; dashboard needs to display this timeline |
| EMAIL-05 | Fallback — 3 failures flag order for manual contact | Hook into `send.ts` exhausted-retries path (line 199); add `needs_contact` column + ops dashboard section |
| EMAIL-06 | Webhook audit logging — body hash + signature verification | Install svix, replace naive secret check in webhook handler; new `webhook_audit_logs` table for rejected payloads |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svix | ^1.84 | Webhook HMAC verification | Resend uses Svix internally; official recommendation for webhook verification |
| resend | ^6.9.1 | Email sending | Already installed, production-proven in this project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto (Node.js built-in) | N/A | SHA-256 payload hashing for audit | Hash webhook bodies before storing |
| lucide-react | (installed) | Icons for email status indicators | CheckCircle2, XCircle, Clock, AlertTriangle |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| svix package | Manual HMAC verification | svix handles timestamp tolerance, signature rotation; manual is error-prone |
| New email_attempts table | Columns on notification_logs | notification_logs already tracks per-send; adding retry_count avoids join overhead |

**Installation:**
```bash
pnpm add svix
```

## Architecture Patterns

### Recommended Changes Structure
```
src/
├── app/api/webhooks/resend/route.ts     # Upgrade: svix verification + audit logging
├── app/api/admin/emails/route.ts        # Upgrade: add stats endpoint
├── app/api/admin/emails/stats/route.ts  # NEW: aggregated email stats API
├── app/api/admin/orders/[id]/contact/route.ts  # NEW: mark-contacted endpoint
├── lib/email/send.ts                    # Upgrade: needs_contact flagging after 3 failures
├── lib/email/constants.ts               # Add: error code categorization map
├── components/ui/admin/orders/OrderDetailPage/
│   └── OrderHeaderCard.tsx              # Upgrade: email status badge
├── components/ui/admin/ops/
│   └── OpsOrderRow.tsx                  # Upgrade: email status icon + needs_contact indicator
├── app/(admin)/admin/emails/page.tsx    # Upgrade: stats bar + expandable rows
└── app/(admin)/admin/emails/email-log-types.ts  # Upgrade: error guidance map
supabase/
└── migrations/030_email_reliability.sql  # NEW: schema changes
```

### Pattern 1: Svix Webhook Verification
**What:** Replace naive secret comparison with HMAC signature verification
**When to use:** Every incoming Resend webhook
**Example:**
```typescript
// Source: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
import { Webhook } from "svix";

const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);
const payload = await request.text(); // Raw body as string
const headers = {
  "svix-id": request.headers.get("svix-id") ?? "",
  "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
  "svix-signature": request.headers.get("svix-signature") ?? "",
};
const verified = wh.verify(payload, headers); // throws on failure
```

### Pattern 2: Idempotent Webhook Processing
**What:** Track webhook event IDs to skip duplicate deliveries
**When to use:** Resend may retry webhook delivery; same event should not update twice
**Example:**
```typescript
// Check svix-id header for deduplication
const svixId = request.headers.get("svix-id");
const { data: existing } = await supabase
  .from("webhook_audit_logs")
  .select("id")
  .eq("svix_id", svixId)
  .single();
if (existing) {
  return NextResponse.json({ received: true }); // Already processed
}
```

### Pattern 3: Needs-Contact Flagging
**What:** After all retries exhausted in send.ts, set needs_contact flag on order
**When to use:** Only when MAX_RETRY_ATTEMPTS exceeded
**Example:**
```typescript
// In send.ts, after the "All retries exhausted" section (line ~199)
await supabase
  .from("orders")
  .update({ needs_contact: true })
  .eq("id", options.orderId);
```

### Anti-Patterns to Avoid
- **Storing full webhook payload in notification_logs:** Keep audit data separate; notification_logs is for email tracking, webhook_audit_logs for security
- **Bulk retry:** User explicitly decided one-at-a-time resend; don't add "Retry All" button
- **Auto-polling on dashboard:** User decided manual refresh only
- **Creating new email tracking table:** Build on existing notification_logs

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HMAC signature verification | Custom crypto.createHmac + timing-safe compare | `svix` package Webhook.verify() | Handles timestamp tolerance, signature rotation, timing-safe comparison |
| Webhook payload hashing | Custom hash function | `crypto.createHash('sha256')` | Node.js built-in, well-tested |
| Badge variants | Custom styled spans | Existing `<Badge>` component with variant prop | Already has success/destructive/warning/outline variants |
| Error guidance mapping | Inline conditionals | Constant map object in email-log-types.ts | Maintainable, testable, extensible |

## Common Pitfalls

### Pitfall 1: Raw Body Consumption
**What goes wrong:** Svix verification requires the raw request body as a string, but Next.js may parse it as JSON first
**Why it happens:** `request.json()` consumes the body stream; can't re-read for verification
**How to avoid:** Use `request.text()` first, then `JSON.parse()` the string
**Warning signs:** Verification always fails even with correct secret

### Pitfall 2: Webhook Secret Format
**What goes wrong:** Resend webhook signing secret starts with `whsec_` prefix
**Why it happens:** Using the wrong secret (API key vs webhook signing secret)
**How to avoid:** Ensure RESEND_WEBHOOK_SECRET env var is the webhook signing secret from Resend dashboard, not the API key
**Warning signs:** All webhook verifications fail with "invalid signature"

### Pitfall 3: Needs-Contact Race Condition
**What goes wrong:** Multiple concurrent email sends for same order both flag needs_contact
**Why it happens:** Order confirmation + delivery reminder both fail simultaneously
**How to avoid:** `needs_contact` is a boolean — setting to true is idempotent. No race condition risk.
**Warning signs:** N/A — this is inherently safe

### Pitfall 4: Stats Query Performance
**What goes wrong:** Aggregation queries on notification_logs slow down with volume
**Why it happens:** COUNT + GROUP BY without proper indexes
**How to avoid:** Add composite index on (status, created_at) for the stats queries
**Warning signs:** Dashboard stats bar takes >500ms to load

### Pitfall 5: Webhook Event Order
**What goes wrong:** Events arrive out of order (delivered before sent)
**Why it happens:** Webhook delivery is async; Resend may process events in any order
**How to avoid:** Use event timestamp (`created_at` in payload) for ordering in the timeline, not insert order. Don't downgrade status (e.g., don't overwrite "delivered" with "sent").
**Warning signs:** Email shows as "sent" after being "delivered"

## Code Examples

### Migration: Schema Changes
```sql
-- Add columns to orders table for needs_contact flagging
ALTER TABLE orders ADD COLUMN IF NOT EXISTS needs_contact BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contacted_by UUID REFERENCES profiles(id);

-- Add retry_count to notification_logs
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add index for needs_contact queries (ops dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_needs_contact ON orders(needs_contact) WHERE needs_contact = TRUE;

-- Add composite index for stats queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_status_created ON notification_logs(status, created_at DESC);

-- Add index for resend_id lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_notification_logs_resend_id ON notification_logs(resend_id) WHERE resend_id IS NOT NULL;

-- Webhook audit log table
CREATE TABLE IF NOT EXISTS webhook_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  svix_id TEXT,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  source_ip TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_audit_svix_id ON webhook_audit_logs(svix_id);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_created ON webhook_audit_logs(created_at DESC);
```

### Error Code Categorization
```typescript
export const ERROR_GUIDANCE: Record<string, { label: string; guidance: string }> = {
  bounced: { label: "Bounced", guidance: "Bad email address — contact customer for correct email" },
  complained: { label: "Spam Report", guidance: "Customer marked as spam — do not resend, contact directly" },
  timeout: { label: "Timeout", guidance: "Temporary issue — safe to retry" },
  rate_limit: { label: "Rate Limited", guidance: "Too many emails — wait 1 hour then retry" },
  invalid_address: { label: "Invalid Address", guidance: "Email format invalid — verify with customer" },
  unknown: { label: "Unknown Error", guidance: "Check error details — may need developer review" },
};
```

### Stats API Response Shape
```typescript
interface EmailStats {
  today: { sent: number; delivered: number; failed: number; bounced: number };
  week: { sent: number; delivered: number; failed: number; bounced: number };
  allTime: { sent: number; delivered: number; failed: number; bounced: number };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Naive webhook-secret header check | Svix HMAC signature verification | Resend switched to Svix-based signing | Prevents forged webhooks |
| No deduplication | svix-id based idempotency | Standard practice | Prevents double-processing |

## Open Questions

1. **Threshold hardcoded vs configurable**
   - What we know: `MAX_RETRY_ATTEMPTS=3` in constants.ts is hardcoded; `app_settings` table exists for configurable values
   - Recommendation: Hardcode at 3 — matches existing pattern in constants.ts, and the value is unlikely to change. Adding to app_settings would require cache invalidation plumbing for a value that's static.

2. **Webhook payload storage**
   - What we know: Current webhook handler stores events in metadata.resend_events array on notification_logs
   - Recommendation: Store payload hash (not full payload) in webhook_audit_logs for security; keep event timeline in notification_logs metadata as-is. Full raw payloads are unnecessary and create storage bloat.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/lib/email/send.ts`, `src/app/api/webhooks/resend/route.ts`, `src/app/(admin)/admin/emails/page.tsx`
- Resend docs: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
- Svix docs: https://docs.svix.com/receiving/verifying-payloads/how
- npm: https://www.npmjs.com/package/svix (v1.84.1)

### Secondary (MEDIUM confidence)
- Supabase migration patterns from project's 30 existing migrations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - svix is official Resend recommendation, already proven
- Architecture: HIGH - building on existing codebase patterns, no novel architecture
- Pitfalls: HIGH - well-documented webhook verification gotchas

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain, unlikely to change)
