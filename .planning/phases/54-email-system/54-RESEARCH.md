# Phase 54: Email System - Research

**Researched:** 2026-02-09
**Domain:** Transactional email (Resend + React Email) with Stripe webhook integration
**Confidence:** HIGH

## Summary

The project already has a working email pipeline: Stripe webhook handler (`src/app/api/webhooks/stripe/route.ts`) calls a Supabase Edge Function (`supabase/functions/send-order-confirmation/index.ts`) that uses raw Resend REST API with hand-written HTML templates. A second Edge Function (`send-delivery-notification/index.ts`) handles out-for-delivery, arriving-soon, and delivered emails with the same raw HTML approach.

Phase 54 replaces this architecture with Next.js API route-based email sending using the Resend Node.js SDK + React Email components. The existing Edge Functions become dead code. The webhook handler already exists and needs modification to: (1) add an idempotency table check before processing, (2) call the new email service instead of the Edge Function, and (3) handle cancellation and refund email triggers. The `notification_logs` table already exists in the database schema with the correct structure. The `customer_settings` table with `notification_prefs` (order_updates, marketing, reminders) already exists from Phase 50/51.

**Primary recommendation:** Move all email logic into Next.js API routes using `resend` SDK with `@react-email/components` for templates and `@react-email/render` for HTML generation. Use Resend's built-in idempotency keys plus a DB-level `webhook_events` idempotency table for defense-in-depth. Keep email sending async and non-blocking to webhook response.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

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
- Order confirmation: full receipt with items, prices, quantities, modifiers, subtotal, tax, delivery fee, tip, total; full delivery block with address, estimated window, delivery instructions, driver name; items grouped by category; all modifiers shown; payment method info; clickable order number; dietary restriction callout; "Reorder" CTA; "You might also like" section; "Need help?" support section; social sharing option
- Cancellation: order summary, cancellation reason, whether refund was issued, "Place new order" CTA
- Refund: detailed breakdown (original amount, refund amount, method, timeline, items refunded); partial refunds get distinct treatment
- Delivery reminder: food excitement at top, static map image + "View on Map" link, modify/cancel links, fires morning of delivery (8am)
- Order confirmation sent immediately on payment confirmation
- Delivery reminder fires morning of delivery day
- Retry on failure: 3 attempts with exponential backoff (~30 second window), then log failure
- Stripe webhook idempotency: both DB table (processed event IDs) + Resend idempotency key
- Per-customer rate limiting to prevent spam
- Async background email sending (API response returns immediately)
- Email log: DB table logging every sent email (type, recipient, status, timestamp) + Resend dashboard for analytics
- Admin notification on email send failures
- No quiet hours
- Short retry window (3 attempts, ~30s)
- Per-type toggles: separate controls for order updates, delivery reminders, promotions
- Order confirmation and refund emails are mandatory (receipts) -- cannot be opted out
- Unsubscribe link goes to app's Settings page (Phase 51 notification toggles) -- single source of truth
- List-Unsubscribe and List-Unsubscribe-Post headers for native email client unsubscribe buttons
- All emails ON by default for new customers (opt-out model)
- Preference check happens before email rendering
- Admin can see customer opt-out status
- Admin kill switch to disable all email sending system-wide
- React Email preview server for rapid iteration + real Resend sends for final verification
- No unit tests for email template rendering
- "Send Test Email" button per email type in admin settings
- Realistic sample data fixtures using actual menu item names
- Retry storm protection: idempotency table for correctness + rate limiting for defense in depth
- Per-order email history on order detail page + global email log page
- Manual "Resend" button on failed emails
- Manual trigger: admin can send any email type for any order
- Full delivery status tracking: sent -> delivered -> opened -> clicked with timestamps
- Email stats (sent/failed/bounce rate) on email log page

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

### Deferred Ideas (OUT OF SCOPE)

- Welcome/onboarding email
- Loyalty/rewards points in emails
- Batch/marketing emails
- Feedback/rating email
  </user_constraints>

## Standard Stack

### Core

| Library                   | Version | Purpose                   | Why Standard                                                                                                                              |
| ------------------------- | ------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `resend`                  | ^6.9.1  | Email sending SDK         | Official Resend Node.js SDK; supports `react` prop, idempotency keys, tags, custom headers                                                |
| `@react-email/components` | ^1.0.7  | Email template components | Official React Email component library: Html, Head, Body, Container, Section, Row, Column, Text, Button, Img, Link, Hr, Preview, Tailwind |
| `@react-email/render`     | ^2.0.4  | Render React to HTML/text | Converts React Email components to HTML strings + plain text; server-only                                                                 |

### Supporting

| Library       | Version | Purpose            | When to Use                                                     |
| ------------- | ------- | ------------------ | --------------------------------------------------------------- |
| `react-email` | ^5.2.8  | Dev preview server | `npx email dev` for local template preview; dev dependency only |

### Alternatives Considered

| Instead of                        | Could Use                         | Tradeoff                                                                                                                                                                                                                                                             |
| --------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resend SDK `react` prop           | `render()` + `html` prop          | `render()` gives more control for pre-rendering + caching; `react` prop is simpler but couples rendering to send call. **Recommend `render()` for this project** since we need both HTML (for Resend) and plain text (for accessibility), plus HTML preview in admin |
| Next.js API routes                | Supabase Edge Functions (current) | Edge Functions have Deno runtime limitations, no React Email JSX support, raw HTML strings. **Recommend Next.js API routes** for full Node.js ecosystem                                                                                                              |
| `@react-email/tailwind` component | Inline styles                     | React Email's `<Tailwind>` component now supports Tailwind v4.1.12 and inlines styles at render time. **Use Tailwind component** for consistency with app's utility-first approach                                                                                   |

**Installation:**

```bash
pnpm add resend @react-email/components @react-email/render
pnpm add -D react-email
```

**Zero client bundle impact:** All three production packages are server-only (used in API routes). `react-email` is dev-only.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── emails/                          # Email templates (React components)
│   ├── components/                  # Shared email sub-components
│   │   ├── EmailLayout.tsx          # Base layout: header, footer, styles
│   │   ├── OrderStatusTracker.tsx   # Visual step tracker
│   │   ├── OrderItemsTable.tsx      # Items grouped by category
│   │   ├── DeliveryBlock.tsx        # Address + window + instructions
│   │   ├── BrandHeader.tsx          # Logo + gradient header per type
│   │   └── BrandFooter.tsx          # Address, social, unsubscribe
│   ├── OrderConfirmation.tsx        # MAIL-01
│   ├── OrderCancellation.tsx        # MAIL-02
│   ├── RefundNotification.tsx       # MAIL-03
│   ├── DeliveryReminder.tsx         # MAIL-04
│   └── fixtures.ts                  # Sample data for previews
├── lib/
│   └── email/
│       ├── index.ts                 # Barrel exports
│       ├── client.ts                # Resend client singleton
│       ├── send.ts                  # sendEmail() with retry, logging, preference check
│       ├── types.ts                 # Email type definitions
│       └── constants.ts             # From address, app URL, brand text
├── app/
│   └── api/
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts         # Modified: add idempotency + email triggers
│       ├── emails/
│       │   ├── send/route.ts        # Internal: triggered by webhook/admin
│       │   └── test/route.ts        # Admin: send test email
│       └── admin/
│           └── emails/
│               ├── route.ts         # GET: email log list
│               ├── [id]/route.ts    # GET: single email detail + resend
│               └── send/route.ts    # POST: manual trigger any email for any order
```

### Pattern 1: Email Service Layer

**What:** Centralized `sendEmail()` function that handles preference checks, rendering, sending, retry, and logging.
**When to use:** Every email send goes through this function.
**Example:**

```typescript
// src/lib/email/send.ts
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  type: EmailType;
  orderId: string;
  userId: string;
  idempotencyKey?: string;
  mandatory?: boolean; // true for receipts (confirmation, refund)
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const supabase = createServiceClient();

  // 1. Check admin kill switch
  const { data: killSwitch } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "email_sending_enabled")
    .single();
  if (killSwitch?.value === false) return;

  // 2. Check user preference (skip for mandatory emails)
  if (!options.mandatory) {
    const prefKey = mapTypeToPrefKey(options.type);
    const { data: settings } = await supabase
      .from("customer_settings")
      .select("notification_prefs")
      .eq("user_id", options.userId)
      .single();
    const prefs = settings?.notification_prefs as NotificationPrefs;
    if (prefs && !prefs[prefKey]) return;
  }

  // 3. Render to HTML + plain text
  const html = await render(options.react);
  const text = await render(options.react, { plainText: true });

  // 4. Send via Resend with retry
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error } = await resend.emails.send(
        {
          from: "Mandalay Morning Star <orders@mail.mandalaymorningstar.com>",
          to: options.to,
          subject: options.subject,
          html,
          text,
          tags: [
            { name: "type", value: options.type },
            { name: "order_id", value: options.orderId },
          ],
          headers: {
            "List-Unsubscribe": "<https://mandalaymorningstar.com/account/settings>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        },
        options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
      );

      if (error) throw new Error(error.message);

      // 5. Log success
      await supabase.from("notification_logs").insert({
        order_id: options.orderId,
        user_id: options.userId,
        notification_type: options.type,
        channel: "email",
        recipient: options.to,
        subject: options.subject,
        resend_id: data?.id,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 10_000)); // 10s, 20s backoff
      }
    }
  }

  // 6. Log failure after all retries
  await supabase.from("notification_logs").insert({
    order_id: options.orderId,
    user_id: options.userId,
    notification_type: options.type,
    channel: "email",
    recipient: options.to,
    subject: options.subject,
    status: "failed",
    error_message: lastError?.message,
  });
  logger.error("Email send failed after 3 attempts", {
    orderId: options.orderId,
    type: options.type,
    api: "email/send",
  });
}
```

### Pattern 2: React Email Template with Tailwind

**What:** Email templates as React components using `<Tailwind>` for styling.
**When to use:** All email templates.
**Example:**

```tsx
// src/emails/OrderConfirmation.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Img,
  Link,
  Hr,
  Preview,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface OrderConfirmationProps {
  customerName: string;
  orderId: string;
  items: OrderItemData[];
  totals: TotalsData;
  deliveryWindow: DeliveryWindowData;
  address: AddressData;
  // ...
}

export function OrderConfirmation(props: OrderConfirmationProps) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>Mingalabar! Your order #{props.orderId.slice(0, 8)} is confirmed</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                "brand-red": "#A41034",
                "brand-gold": "#EBCD00",
                "brand-green": "#3D8B22",
                "warm-bg": "#FFF9E6",
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans">
          <Container className="max-w-[600px] mx-auto">{/* Header, content, footer */}</Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default OrderConfirmation;
```

### Pattern 3: Webhook Idempotency Table

**What:** Database table tracking processed Stripe webhook event IDs.
**When to use:** Before processing any webhook event.
**Example:**

```typescript
// In stripe webhook handler, before processing:
const { data: existing } = await supabase
  .from("webhook_events")
  .select("id")
  .eq("event_id", event.id)
  .single();

if (existing) {
  // Already processed, return 200 immediately
  return NextResponse.json({ received: true, duplicate: true });
}

// Insert event ID before processing (claim it)
const { error: insertError } = await supabase.from("webhook_events").insert({
  event_id: event.id,
  event_type: event.type,
  processed_at: new Date().toISOString(),
});

if (insertError) {
  // Unique constraint violation = another instance already processing
  return NextResponse.json({ received: true, duplicate: true });
}

// Now safe to process the event...
```

### Pattern 4: Delivery Reminder Scheduling

**What:** Morning-of-delivery reminder triggered by a cron/scheduled function.
**When to use:** MAIL-04 delivery reminder emails.
**Example approach:**

```
Option A: Supabase pg_cron extension
  - Schedule: runs daily at 8:00 AM PT
  - Query: SELECT orders WHERE delivery_window_start::date = CURRENT_DATE AND status IN ('confirmed', 'preparing')
  - Calls: Next.js API route to send delivery reminder emails

Option B: Vercel Cron (if deployed to Vercel)
  - vercel.json cron config
  - GET /api/cron/delivery-reminders

Option C: External cron service (e.g., cron-job.org, Upstash QStash)
```

### Anti-Patterns to Avoid

- **Inline HTML strings in API routes:** Already exists in Edge Functions. React Email components are maintainable; raw HTML is not.
- **Blocking webhook response on email send:** Email should be fire-and-forget from webhook perspective. Use `Promise.resolve()` pattern or move to separate API call.
- **Using `react` prop on Resend SDK for templates that need admin preview:** Pre-render with `render()` so you can store the HTML for admin preview/resend.
- **Tailwind v4 `@theme inline` in email templates:** React Email's `<Tailwind>` component uses its own isolated Tailwind config object, completely separate from the app's Tailwind v4 setup. Do not try to share tokens.css.
- **Skipping plain text alternative:** Always generate via `render(component, { plainText: true })`. Required for accessibility and spam score.

## Don't Hand-Roll

| Problem                 | Don't Build                    | Use Instead                                                    | Why                                                                                               |
| ----------------------- | ------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| HTML email rendering    | String template literals       | `@react-email/render` + `@react-email/components`              | Email client compatibility (Outlook, Gmail dark mode, Yahoo), XHTML compliance, responsive tables |
| Responsive email layout | CSS media queries in `<style>` | React Email `<Container>`, `<Section>`, `<Row>`, `<Column>`    | Auto-generates compatible table-based layouts                                                     |
| Email CSS inlining      | Manual inline styles           | `<Tailwind>` component                                         | Automatically inlines Tailwind utilities into style attributes at render time                     |
| Plain text generation   | Manual text formatting         | `render(component, { plainText: true })`                       | Auto-converts HTML structure to readable plain text                                               |
| Idempotency             | Custom dedup logic only        | Resend SDK `idempotencyKey` option + DB `webhook_events` table | Resend handles API-level dedup; DB handles application-level dedup                                |
| Email retry logic       | Custom queue system            | Simple retry loop (3 attempts, exponential backoff)            | User specified ~30s window, no extended retry queue                                               |

**Key insight:** Email rendering is deceptively complex due to email client fragmentation (Outlook uses Word rendering engine, Gmail strips `<style>` tags, dark mode inversions). React Email + Tailwind component handles all of this transparently.

## Common Pitfalls

### Pitfall 1: Next.js Bundler + React Email Conflict

**What goes wrong:** `@react-email/render` depends on `prettier` for HTML formatting, which can cause "Package prettier can't be external" errors with Turbopack.
**Why it happens:** Next.js 16 Turbopack tries to bundle server dependencies differently from webpack.
**How to avoid:** Add `@react-email/render` to `serverExternalPackages` in `next.config.ts` if errors occur. Test with `pnpm build` early.
**Warning signs:** Build errors mentioning `prettier`, `html-to-text`, or `@react-email/render`.

### Pitfall 2: Email Dark Mode Color Inversion

**What goes wrong:** Email clients (Outlook, Gmail) auto-invert colors for dark mode, making brand colors unreadable.
**Why it happens:** Clients apply their own dark mode algorithms; no standard exists.
**How to avoid:** Use `<meta name="color-scheme" content="light dark" />` and `<meta name="supported-color-schemes" content="light dark" />` in `<Head>`. Use transparent PNG images. Test with Litmus/Email on Acid or manual dark mode checks.
**Warning signs:** White backgrounds becoming dark, dark text becoming invisible, images with white backgrounds looking out of place.

### Pitfall 3: Webhook Duplicate Processing Race Condition

**What goes wrong:** Two webhook requests for the same event arrive near-simultaneously, both pass the "not yet processed" check.
**Why it happens:** Stripe may retry webhooks, and the DB read + insert is not atomic.
**How to avoid:** Use a UNIQUE constraint on `webhook_events.event_id` and handle the insert conflict error as "already processing." The INSERT with conflict detection is the atomic guard, not the SELECT.
**Warning signs:** Duplicate emails, duplicate order status updates.

### Pitfall 4: Resend Rate Limits

**What goes wrong:** Hitting Resend's 10 requests/second or 600 requests/minute limit during batch operations (e.g., sending all delivery reminders at once).
**Why it happens:** Delivery reminder cron fires for all orders simultaneously.
**How to avoid:** Stagger delivery reminder sends with small delays (e.g., 100ms between sends). Monitor `429` responses and implement backoff.
**Warning signs:** `429 Too Many Requests` errors, delivery reminders not being sent.

### Pitfall 5: notification_type Enum Mismatch

**What goes wrong:** New email types (cancellation, refund, delivery_reminder) don't exist in the `notification_type` Postgres enum.
**Why it happens:** The current enum only has: `order_confirmation`, `out_for_delivery`, `arriving_soon`, `delivered`, `feedback_request`.
**How to avoid:** Migration must ALTER TYPE `notification_type` ADD VALUE for: `cancellation`, `refund`, `delivery_reminder`.
**Warning signs:** Insert failures on `notification_logs` table.

### Pitfall 6: Missing `tip_cents` in Orders Table

**What goes wrong:** User decisions require showing tip in order confirmation, but the `orders` table doesn't have a `tip_cents` column.
**Why it happens:** Tip feature may not have been added to schema yet.
**How to avoid:** Check if `tip_cents` exists; if not, either add it or omit tip from email receipt. The existing Edge Function template doesn't include tip.
**Warning signs:** Missing data in order confirmation emails.

## Code Examples

### Resend Client Initialization

```typescript
// src/lib/email/client.ts
import { Resend } from "resend";

let instance: Resend | null = null;

export function getResendClient(): Resend {
  if (!instance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    instance = new Resend(process.env.RESEND_API_KEY);
  }
  return instance;
}
```

### Rendering Email to HTML + Plain Text

```typescript
// Source: Context7 /resend/react-email
import { render } from '@react-email/render';
import { OrderConfirmation } from '@/emails/OrderConfirmation';

const html = await render(<OrderConfirmation {...props} />);
const text = await render(<OrderConfirmation {...props} />, { plainText: true });
```

### Sending with Resend SDK + Idempotency Key

```typescript
// Source: Context7 /resend/resend-node
const { data, error } = await resend.emails.send(
  {
    from: "Mandalay Morning Star <orders@mail.mandalaymorningstar.com>",
    to: customerEmail,
    subject: "Order Confirmed #ABC12345",
    html,
    text,
    tags: [
      { name: "type", value: "order_confirmation" },
      { name: "order_id", value: orderId },
    ],
    headers: {
      "List-Unsubscribe": "<https://mandalaymorningstar.com/account/settings>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  },
  {
    idempotencyKey: `order-confirmation-${orderId}`, // Resend-level dedup
  }
);
```

### Webhook Events Idempotency Table Migration

```sql
-- New migration: webhook_events idempotency table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE,  -- Stripe event ID (evt_xxx)
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- Add new notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'cancellation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'refund';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'delivery_reminder';
```

### Notification Preference Mapping

```typescript
// Map email type to customer_settings.notification_prefs key
function mapTypeToPrefKey(type: EmailType): keyof NotificationPrefs {
  switch (type) {
    case "order_confirmation":
      return "order_updates"; // mandatory, skip check
    case "cancellation":
      return "order_updates";
    case "refund":
      return "order_updates"; // mandatory, skip check
    case "delivery_reminder":
      return "reminders";
    default:
      return "order_updates";
  }
}

// Mandatory emails that cannot be opted out (receipts)
const MANDATORY_EMAIL_TYPES = ["order_confirmation", "refund"] as const;
```

## Discretion Recommendations

### Architecture: Next.js API Routes (not Edge Functions)

**Recommendation:** Move all email sending to Next.js API routes.
**Rationale:** Edge Functions use Deno runtime, can't use `@react-email/components` JSX, rely on raw `fetch()` to Resend REST API, and duplicate Supabase client setup. Next.js API routes share the existing `createServiceClient()`, `logger`, `requireAdmin()` infrastructure.
**Confidence:** HIGH

### Email Domain: Dedicated Subdomain

**Recommendation:** Use `mail.mandalaymorningstar.com` as sending subdomain.
**Rationale:** Separates transactional email reputation from main domain. If deliverability issues occur, main domain is unaffected. Standard practice for production email.
**From address:** `Mandalay Morning Star <orders@mail.mandalaymorningstar.com>`
**Reply-to:** `support@mandalaymorningstar.com`
**Confidence:** HIGH

### Typography: Web-safe Font Stack

**Recommendation:** Use web-safe fonts only in emails (no Google Fonts `@import`).
**Font stack:** `Georgia, 'Palatino Linotype', serif` for headings (closest to Playfair Display feel), `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` for body.
**Rationale:** Google Font `@import` in emails is unreliable (Gmail strips `<style>`, Outlook ignores external CSS). The existing Edge Function templates already use this pattern.
**Confidence:** HIGH

### Customer Name Personalization

**Recommendation:** Use `profiles.full_name` when available, fallback to "Valued Customer."
**Rationale:** Already implemented in existing Edge Functions. Consistent pattern.
**Confidence:** HIGH

### Plain Text Alternative

**Recommendation:** Auto-generate via `render(component, { plainText: true })` from `@react-email/render`.
**Rationale:** Built-in, no manual maintenance. Required for spam score and accessibility.
**Confidence:** HIGH

### Same-Day Delivery Reminder

**Recommendation:** If order's `delivery_window_start` is today and the cron runs at 8am, send the reminder immediately. Do not skip.
**Rationale:** Customer still benefits from a morning-of reminder even if ordered late.
**Confidence:** MEDIUM

### Cancellation + Refund Email Timing

**Recommendation:** Send immediately and independently. If a cancellation triggers an automatic refund, send cancellation email first, then refund email when Stripe's `charge.refunded` webhook fires.
**Rationale:** User expects immediate confirmation of each action. Bundling adds complexity.
**Confidence:** HIGH

### Email Log Capabilities

**Recommendation:** Admin email log page with: search by order ID, filter by type/status, date range, sortable columns. Sent email HTML preview via stored `html` field or re-rendering the template.
**Rationale:** Minimum viable admin tooling. HTML preview via re-render (template + stored props) avoids storing large HTML blobs.
**Confidence:** MEDIUM

### API Key Management

**Recommendation:** Environment variable (`RESEND_API_KEY`) only. No admin-configurable API keys.
**Rationale:** API keys are infrastructure config, not application settings. Simpler, more secure.
**Confidence:** HIGH

### Bounce/Complaint Tracking

**Recommendation:** Use Resend's dashboard for bounce/complaint analytics. Optionally register a Resend webhook endpoint to receive `email.bounced` and `email.complained` events and update `notification_logs.status`.
**Rationale:** Resend dashboard handles this out-of-box. Custom webhook is enhancement, not MVP.
**Confidence:** MEDIUM

## Existing Codebase Integration Points

### Files to Modify

| File                                              | Change                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/app/api/webhooks/stripe/route.ts`            | Add idempotency table check, replace Edge Function call with `sendEmail()`, add cancellation/refund email triggers |
| `src/app/api/admin/orders/[id]/cancel/route.ts`   | Replace TODO comment (line 109-114) with email trigger call                                                        |
| `src/app/api/admin/orders/[id]/refund/route.ts`   | Replace TODO comment (line 213-219) with email trigger call                                                        |
| `src/app/api/account/orders/[id]/cancel/route.ts` | Add cancellation email trigger                                                                                     |
| `next.config.ts`                                  | May need `serverExternalPackages: ['@react-email/render']`                                                         |
| `src/app/(admin)/admin/settings/page.tsx`         | Add email settings section (kill switch, test email buttons)                                                       |

### Existing Infrastructure to Reuse

| Resource                   | Location                     | How Used                                                                                                                                                               |
| -------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createServiceClient()`    | `src/lib/supabase/server.ts` | Service role client for bypassing RLS in email service                                                                                                                 |
| `logger`                   | `src/lib/utils/logger.ts`    | Structured logging with Sentry integration                                                                                                                             |
| `requireAdmin()`           | `src/lib/auth/admin.ts`      | Admin auth for email management API routes                                                                                                                             |
| `notification_logs` table  | Migration 000                | Already has correct schema: order_id, user_id, notification_type, channel, recipient, subject, resend_id, status, error_message, metadata, sent_at                     |
| `customer_settings` table  | Migration 019                | Has `notification_prefs` JSONB: `{order_updates, marketing, reminders}`                                                                                                |
| `app_settings` table       | Migration 000/019            | Admin settings with category-based key-value; add `email_sending_enabled` key                                                                                          |
| `notification_type` enum   | Migration 000                | Existing values: `order_confirmation`, `out_for_delivery`, `arriving_soon`, `delivered`, `feedback_request`; needs `cancellation`, `refund`, `delivery_reminder` added |
| `notification_status` enum | Migration 000                | Existing values: `pending`, `sent`, `delivered`, `failed`, `bounced`; may need `opened`, `clicked` added                                                               |
| Brand colors               | `src/styles/tokens.css`      | Primary: #A41034 (deep red), Secondary: #EBCD00 (golden yellow), Accent green: #3D8B22                                                                                 |

### Files to Deprecate (After Phase 54)

| File                                                     | Reason                                                |
| -------------------------------------------------------- | ----------------------------------------------------- |
| `supabase/functions/send-order-confirmation/index.ts`    | Replaced by Next.js API route + React Email templates |
| `supabase/functions/send-delivery-notification/index.ts` | Replaced by Next.js API route + React Email templates |

## State of the Art

| Old Approach                               | Current Approach                           | When Changed               | Impact                                                            |
| ------------------------------------------ | ------------------------------------------ | -------------------------- | ----------------------------------------------------------------- |
| `renderAsync()` from `@react-email/render` | `render()` (now async by default)          | React Email 5.0 (Nov 2025) | Use `await render()` directly                                     |
| Tailwind v3 in React Email                 | Tailwind v4.1.12 in `<Tailwind>` component | React Email 5.0 (Nov 2025) | `<Tailwind>` component works with v4 config syntax                |
| `@react-email/tailwind` separate package   | Included in `@react-email/components`      | React Email 4.0+           | No need to install `@react-email/tailwind` separately             |
| Resend REST API via `fetch()`              | Resend Node.js SDK v6.x                    | 2025                       | SDK provides typed API, idempotency keys, React component support |
| `serverComponentsExternalPackages`         | `serverExternalPackages`                   | Next.js 15+                | Config key renamed; same functionality                            |

**Deprecated/outdated:**

- `renderAsync()`: Replaced by `render()` which is now async. Import from `@react-email/render` or `@react-email/components`.
- Separate `@react-email/tailwind` package: Now included in `@react-email/components`.
- Supabase Edge Functions for email: Replaced by Next.js API routes for better DX and ecosystem access.

## Open Questions

1. **Delivery reminder cron mechanism**
   - What we know: Reminder fires "morning of delivery" (8am). Orders have `delivery_window_start` timestamp.
   - What's unclear: What scheduling mechanism to use. Options: Supabase pg_cron, Vercel Cron, QStash, manual cron.
   - Recommendation: Determine deployment platform. If Vercel, use `vercel.json` cron. If self-hosted, use Supabase pg_cron calling a Next.js API endpoint.

2. **Tip amount in order schema**
   - What we know: User wants tip shown in order confirmation receipt. Current `orders` table has no `tip_cents` column.
   - What's unclear: Whether tip was added in a later migration or is planned for another phase.
   - Recommendation: Check for `tip_cents` column; if missing, show tip line only when data exists (graceful degradation).

3. **Static map image for delivery reminder**
   - What we know: User wants a static map image of delivery address with "View on Map" link.
   - What's unclear: Which static map API to use (Google Static Maps requires API key and billing; OpenStreetMap is free).
   - Recommendation: Use Google Static Maps API (project already uses `@react-google-maps/api`). Generate URL with address lat/lng. Fallback: text-only address with Google Maps link.

4. **Animated GIF shimmer in header**
   - What we know: User wants "subtle animated GIF shimmer/sparkle in header" with graceful fallback.
   - What's unclear: Asset creation process. Need designer or AI-generated GIF.
   - Recommendation: Create a simple CSS shimmer animation as primary approach; animated GIF as enhancement. Most email clients support GIF; non-supporting ones show first frame.

5. **Resend webhook for delivery/open/click tracking**
   - What we know: User wants full delivery status tracking (sent -> delivered -> opened -> clicked). Resend provides webhook events for these.
   - What's unclear: Whether to set up a Resend webhook endpoint in this phase or defer.
   - Recommendation: Include Resend webhook setup in this phase (it's needed for the admin email log "delivered/opened/clicked" statuses). Add `POST /api/webhooks/resend/route.ts`.

## Sources

### Primary (HIGH confidence)

- Context7 `/resend/resend-node` - SDK API, idempotency keys, React email support, tags, headers
- Context7 `/resend/react-email` - Component usage, Tailwind integration, render function
- Context7 `/llmstxt/resend_llms-full_txt` - Rate limits (10/s, 600/min), idempotency API, List-Unsubscribe headers
- Codebase: `src/app/api/webhooks/stripe/route.ts` - Current webhook handler
- Codebase: `supabase/functions/send-order-confirmation/index.ts` - Current email template and data queries
- Codebase: `supabase/migrations/000_initial_schema.sql` - notification_logs, notification_type enum
- Codebase: `supabase/migrations/019_customer_settings_admin_expansion.sql` - customer_settings table
- Codebase: `src/components/ui/account/SettingsTab/settings-types.ts` - NotificationPrefs interface

### Secondary (MEDIUM confidence)

- [React Email 5.0 announcement](https://resend.com/blog/react-email-5) - Tailwind v4 support confirmed
- [Resend Idempotency Keys docs](https://resend.com/docs/dashboard/emails/idempotency-keys) - SDK option details
- [Resend webhook event types](https://resend.com/docs/dashboard/webhooks/event-types) - email.delivered, email.opened, email.clicked events
- [npm: resend@6.9.1](https://www.npmjs.com/package/resend) - Current version
- [npm: @react-email/components@1.0.7](https://www.npmjs.com/package/@react-email/components) - Current version
- [npm: @react-email/render@2.0.4](https://www.npmjs.com/package/@react-email/render) - Current version
- [React Email serverExternalPackages discussion](https://github.com/resend/react-email/discussions/1816) - Turbopack compatibility notes

### Tertiary (LOW confidence)

- Animated GIF shimmer approach - based on general email development knowledge, not verified against specific client compatibility matrix
- pg_cron for delivery reminders - not verified against project's Supabase plan/configuration

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Versions verified via npm, APIs verified via Context7
- Architecture: HIGH - Follows existing project patterns, builds on current codebase infrastructure
- Pitfalls: HIGH - Common issues verified through official docs and GitHub discussions
- Email template design: MEDIUM - Brand color mapping verified against tokens.css, but complex visual design decisions (GIF shimmer, food illustrations) need design iteration

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (stable libraries, infrequent breaking changes)
