# Phase 61: Admin Pages - Research

**Researched:** 2026-02-14
**Domain:** Admin UI — Order Detail Page + Admin Profile Page (Next.js 16 / React 19 / Supabase / Tailwind v4)
**Confidence:** HIGH

## Summary

Phase 61 builds two new pages inside the existing `(admin)/admin/` route group: an order detail page at `/admin/orders/[id]` and an admin profile page at `/admin/profile`. Both are pure frontend work — all required APIs already exist. The codebase has a well-established admin UI pattern: `'use client'` page.tsx renders a `*Client` component from `src/components/ui/admin/`, which fetches data from `/api/admin/*` routes and renders using existing UI primitives (AdminPageHeader, StatusBadge, Badge, Button, Modal, ConfirmDialog, toast).

The order detail page is the larger surface area. It must compose existing components (OrderDetailExpanded, EmailHistory) into a full-page layout with additional sections for status timeline, delivery map, payment info, and collapsible cards. The admin profile page is simpler — fetch profile via existing `/api/account/profile`, display read-only role/auth info, editable name/phone, theme toggle (reuse ThemeSelector), and notification preferences.

**Primary recommendation:** Build both pages following the established DriverDetailClient pattern — `useParams()` to get ID, client-side fetch, sectioned card layout, existing UI primitives. No new API routes needed for core functionality. New API routes needed only for: admin profile notification preferences, admin profile activity stats, and enhanced status change with email notification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Order Detail Layout
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

#### Status Change Workflow
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

#### Email History Display
- Empty state shown when no emails sent for an order ("No emails sent for this order")
- Failed emails show error reason from Resend API
- Resend button on failed emails to retry delivery
- Manual email compose via modal dialog with rich text editor
- Manual emails auto-include order context (order #, items summary, delivery details) in footer
- Confirmation preview before sending manual emails
- Manual emails tracked in email history with "Manual" badge
- Timestamps only (no user attribution) — consistent with status timeline

#### Admin Profile Page
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.2 | App Router, route groups, dynamic routes | Framework |
| React | 19.2.3 | UI rendering | Framework |
| @supabase/ssr | 0.8.0 | Server-side Supabase client | Auth + DB |
| @tanstack/react-query | 5.90.1 | Data fetching (not used in admin yet — admin uses raw fetch) | Available but not adopted in admin |
| framer-motion | 12.26.1 | Animations, layoutId, AnimatePresence | Used throughout admin |
| lucide-react | 0.562.0 | Icons | Consistent iconography |
| date-fns | 4.1.0 | Date formatting | Used in OrdersTable, OrderDetailExpanded |
| zod | 4.3.5 | Schema validation | Used for all form/API validation |
| next-themes | 0.4.6 | Theme toggle (dark/light/system) | Already integrated, ThemeSelector exists |
| react-hook-form | 7.71.1 | Form management | Available, used elsewhere in codebase |
| @react-google-maps/api | 2.20.8 | Google Maps (interactive) | Already used in RouteMap, DeliveryMap |
| resend | 6.9.1 | Email sending | Phase 54 email infrastructure |
| @react-email/components | 1.0.7 | Email templates | Phase 54 email templates |
| recharts | 3.6.0 | Charts (if needed for profile stats) | Already in admin analytics |

### New Dependencies Needed
| Library | Purpose | When to Use |
|---------|---------|-------------|
| @tiptap/react + @tiptap/starter-kit | Rich text editor for manual email compose | CONTEXT requires "rich text editor" — not plain textarea |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tiptap/react | Lexical, Quill | Tiptap is most popular with React; headless = full styling control with Tailwind |
| Google Maps Static API | @react-google-maps/api (interactive) | Static is simpler/cheaper for address display; but interactive already loaded — use `GoogleMap` component for consistency |
| Raw fetch | @tanstack/react-query | Admin pages all use raw fetch + useState — maintain consistency |

**Installation:**
```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
```

## Architecture Patterns

### Existing Admin Page Structure
```
src/app/(admin)/admin/orders/[id]/
  page.tsx              # 'use client', renders <OrderDetailClient />
  loading.tsx           # <RouteLoading message="Loading order..." />
  not-found.tsx         # Branded 404 with "Go back to orders" link

src/components/ui/admin/orders/OrderDetailPage/
  index.tsx             # Barrel: export { OrderDetailClient }
  OrderDetailClient.tsx # Main client component (useParams, fetch, render)
  OrderHeaderCard.tsx   # Status badge, order ID, delivery window, priority toggle
  CustomerInfoCard.tsx  # Name, email, phone (clickable), address, map
  OrderItemsCard.tsx    # Reuse/adapt OrderItemsSection
  TotalsCard.tsx        # Full breakdown: subtotal, delivery, tax, discounts, total
  StatusTimelineCard.tsx # Visual timeline from audit log
  EmailHistoryCard.tsx  # Wrapper around existing EmailHistory component
  PaymentInfoCard.tsx   # Stripe payment ID, method, status
  StatusChangeDialog.tsx # Confirmation modal with email preview + notify checkbox
  ManualEmailDialog.tsx # Rich text editor modal for manual email compose
  CollapsibleCard.tsx   # Shared collapsible card wrapper
  types.ts              # Local types
  config.ts             # Status colors, transitions, etc. (reuse existing)

src/app/(admin)/admin/profile/
  page.tsx              # 'use client', renders <AdminProfileClient />
  loading.tsx           # <RouteLoading message="Loading profile..." />

src/components/ui/admin/profile/
  index.tsx             # Barrel
  AdminProfileClient.tsx # Main client component
  ProfileInfoCard.tsx   # Name, email, phone, role, auth provider, member since
  ActivityStatsCard.tsx # Last login, orders processed
  NotificationPrefsCard.tsx # Toggle switches for email notifications
  ThemeCard.tsx         # Reuse ThemeSelector component
  types.ts
```

### Pattern 1: Client Detail Page (Established Pattern)
**What:** Page.tsx delegates to a `*Client` component that uses `useParams()` for the ID, fetches data client-side, and renders sectioned cards.
**When to use:** All admin detail pages.
**Example:**
```typescript
// src/app/(admin)/admin/orders/[id]/page.tsx
"use client";
import { OrderDetailClient } from "@/components/ui/admin/orders/OrderDetailPage";
export default function AdminOrderDetailPage() {
  return <OrderDetailClient />;
}

// src/components/ui/admin/orders/OrderDetailPage/OrderDetailClient.tsx
"use client";
import { useParams } from "next/navigation";
export function OrderDetailClient() {
  const params = useParams();
  const orderId = params.id as string;
  // fetch from /api/admin/orders/{id}/details
  // render sectioned cards
}
```

### Pattern 2: Collapsible Card Section
**What:** Each data section is wrapped in a collapsible card. Desktop: all expanded by default. Mobile: only first card expanded.
**When to use:** Order detail page sections.
**Example:**
```typescript
// CollapsibleCard.tsx
"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleCard({ title, icon, defaultOpen = true, children }: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-surface-primary overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-text-muted">
          {icon}
          <span className="text-xs font-body font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
```

### Pattern 3: Optimistic Status Update with Revert
**What:** Status badge updates immediately, API call fires in background, reverts on failure.
**When to use:** Status changes on order detail page.
**Example:**
```typescript
const handleStatusChange = async (newStatus: OrderStatus) => {
  const previousStatus = order.status;
  // Optimistic update
  setOrder(prev => prev ? { ...prev, status: newStatus } : null);
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error("Failed");
    // Refetch for full data consistency
    await fetchOrderDetails();
  } catch {
    // Revert optimistic update
    setOrder(prev => prev ? { ...prev, status: previousStatus } : null);
  }
};
```

### Pattern 4: Status Change Confirmation with Email Preview
**What:** Every status change goes through a confirmation dialog showing what email the customer will receive, with a "Notify customer" checkbox.
**When to use:** All status transitions.
**Example flow:**
1. Admin clicks "Confirm Order" button
2. StatusChangeDialog opens showing:
   - Current status -> New status
   - Email preview (subject + body snippet from template)
   - "Notify customer" checkbox (checked by default)
   - Reason text field (required for cancel, optional for others)
   - Cancel / Confirm buttons
3. On confirm: optimistic update + API call + email trigger

### Anti-Patterns to Avoid
- **Don't create a new API route for order detail** — `/api/admin/orders/[id]/details` already returns everything needed (customer info, items, address, audit log, driver). Only extend if fields are missing.
- **Don't use server components for these pages** — Admin pages use `'use client'` with client-side fetch pattern consistently. Don't break the pattern.
- **Don't build a custom rich text editor** — Use Tiptap with starter-kit. The manual email compose needs bold/italic/links/lists, not a full WYSIWYG.
- **Don't duplicate status transition logic** — Reuse `NEXT_STATUSES` and `VALID_TRANSITIONS` from existing config.ts and status route.
- **Don't hardcode colors** — Use design token CSS vars (`--color-*`) and existing StatusBadge/Badge components.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editing | Custom contenteditable | @tiptap/react + starter-kit | XSS, cursor, undo/redo, selection — deeply complex |
| Collapsible sections | Custom accordion | Simple useState toggle (see Pattern 2) | No need for Radix Accordion — too simple |
| Status badge colors | New color map | Existing `STATUS_COLORS` in config.ts + StatusBadge component | Already defined and used |
| Confirmation dialogs | Custom modal | Existing ConfirmDialog + Modal components | Already built with loading states |
| Theme toggle | Custom implementation | Existing ThemeSelector from account settings | Already handles hydration, next-themes integration |
| Email sending | Custom fetch to Resend | Existing sendEmail() + buildEmailElement() pipeline | Handles logging, idempotency, notification_logs |
| Sign out | Custom auth flow | Existing signOut() server action from supabase/actions.ts | Handles revalidation and redirect |
| Date formatting | Custom formatters | date-fns format/parseISO (used throughout) | Consistent formatting |
| Price formatting | Custom cents-to-dollar | Existing formatPrice() from lib/utils/currency | Already used in OrderItemsSection |

**Key insight:** The codebase has extensive admin UI infrastructure. Phase 61 is primarily composition of existing components into new page layouts, not building new primitives.

## Common Pitfalls

### Pitfall 1: Missing `delivery_window_start`/`delivery_window_end` from Order Details API
**What goes wrong:** The order details API returns `placedAt`, `confirmedAt`, `deliveredAt` but NOT delivery window times.
**Why it happens:** The `/api/admin/orders/[id]/details` route selects specific fields — `delivery_window_start` and `delivery_window_end` are NOT in the current select.
**How to avoid:** Must extend the details API to include `delivery_window_start`, `delivery_window_end`, and `stripe_payment_intent_id` in the select query and response mapping.
**Warning signs:** Delivery window and payment info sections render as empty/null.

### Pitfall 2: Stripe Payment Info Not Available via API
**What goes wrong:** CONTEXT requires displaying payment method, status, and Stripe payment ID. The details API returns NO Stripe data.
**Why it happens:** `stripe_payment_intent_id` exists in the orders table but isn't selected in the details route. Payment method/status requires a Stripe API call.
**How to avoid:** Add `stripe_payment_intent_id` to the details API response. For payment status/method, either: (a) add a server-side Stripe API call in the details route, or (b) display just the payment intent ID as a link to Stripe dashboard.
**Warning signs:** Payment card shows "Unknown" or empty.

### Pitfall 3: Status Change Email Integration Missing
**What goes wrong:** The current `/api/admin/orders/[id]/status` PATCH route updates status but does NOT send email notifications. Only the cancel route sends emails.
**Why it happens:** The status route was built as a simple PATCH. The cancel route has the full email pipeline.
**How to avoid:** Extend the status route (or create a new composite endpoint) to: accept `notifyCustomer` boolean + optional `reason`, trigger appropriate email template on transition, log to audit with reason.
**Warning signs:** Customer never receives status update emails from the order detail page.

### Pitfall 4: Google Maps Static API vs Interactive API
**What goes wrong:** CONTEXT says "Static Google Maps embed" but the codebase uses `@react-google-maps/api` (interactive).
**Why it happens:** Two different APIs — Static Maps is an `<img>` tag with URL parameters, Interactive is a JS component.
**How to avoid:** For order detail, Static Maps API is actually better (lighter, no JS bundle, just an image). Use `<img src="https://maps.googleapis.com/maps/api/staticmap?...&key=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}">`. The key already exists and is public-facing.
**Warning signs:** Map doesn't load if using wrong API key or missing referrer restrictions.

### Pitfall 5: Admin Profile — No Existing Admin-Specific API
**What goes wrong:** The `/api/account/profile` route returns only `id, email, full_name, phone, created_at`. It doesn't return `role`, auth provider, or notification preferences.
**Why it happens:** That route was built for customers, not admin-specific profile data.
**How to avoid:** Either extend the existing route or create `/api/admin/profile` that returns role, auth provider (from Supabase user.identities), created_at, and notification preferences.
**Warning signs:** Role and auth provider show as "Unknown".

### Pitfall 6: Notification Preferences Storage for Admin
**What goes wrong:** CONTEXT requires admin notification preference toggles but there's no admin_settings table or column.
**Why it happens:** `customer_settings` table exists but is customer-scoped with `user_id` FK. It has `notification_prefs` JSON column.
**How to avoid:** Reuse `customer_settings` table (it's per-user, not per-role) — admin users can have their own row. Or create an `admin_preferences` JSONB column on profiles. The simplest approach: use `customer_settings.notification_prefs` for admin too, since it's keyed by `user_id`.
**Warning signs:** Save button errors with foreign key violation or missing row.

### Pitfall 7: Rich Text Editor Output for Emails
**What goes wrong:** Tiptap outputs HTML by default. Sending raw Tiptap HTML as email content may break email client rendering.
**Why it happens:** Email HTML has strict limitations (no modern CSS, inline styles only). Tiptap outputs standard HTML.
**How to avoid:** For manual email compose, use Tiptap for input but render the final email through react-email components (wrap in EmailLayout). Convert Tiptap HTML to a simple `dangerouslySetInnerHTML` within the email layout, or use a text-only fallback.
**Warning signs:** Emails render broken in Outlook/Gmail.

### Pitfall 8: Hydration Mismatch with Theme Toggle
**What goes wrong:** ThemeSelector needs to be mounted before rendering selected state.
**Why it happens:** `useTheme()` from next-themes returns different values on server vs client.
**How to avoid:** The existing ThemeSelector already handles this with `useState(false)` for mounted + skeleton fallback. Just reuse it.
**Warning signs:** Flash of wrong theme state on page load.

## Code Examples

### Existing Order Detail API Response Shape
```typescript
// Source: src/app/api/admin/orders/[id]/details/route.ts
// Response from GET /api/admin/orders/{id}/details
interface OrderDetailResponse {
  id: string;
  status: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  address: {
    street: string;
    apt: string | null;
    city: string;
    state: string;
    zip: string;
  } | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    basePrice: number;
    lineTotal: number;
    refundedQuantity: number;
    specialInstructions: string | null;
  }>;
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  specialInstructions: string | null;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  auditLog: Array<{
    id: string;
    action: string;
    actorRole: string;
    reason: string | null;
    createdAt: string;
  }>;
  // MISSING - need to add:
  // deliveryWindowStart: string | null;
  // deliveryWindowEnd: string | null;
  // stripePaymentIntentId: string | null;
}
```

### Existing Email History Component Integration
```typescript
// Source: src/app/(admin)/admin/orders/[id]/EmailHistory.tsx
// Already built! Just import and render:
import { EmailHistory } from "@/app/(admin)/admin/orders/[id]/EmailHistory";
// Usage:
<EmailHistory orderId={orderId} />
// Features already included:
// - Fetch emails by orderId
// - Expandable email details
// - Resend button for failed emails
// - Manual send by email type
// - Status badges
```

### Existing Status Transition Rules
```typescript
// Source: src/components/ui/admin/orders/OrderDetailExpanded/config.ts
const NEXT_STATUSES: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  pending: [{ status: "confirmed", label: "Confirm Order" }, { status: "cancelled", label: "Cancel" }],
  confirmed: [{ status: "preparing", label: "Start Preparing" }, { status: "cancelled", label: "Cancel" }],
  preparing: [{ status: "out_for_delivery", label: "Send Out" }, { status: "cancelled", label: "Cancel" }],
  out_for_delivery: [{ status: "delivered", label: "Mark Delivered" }],
  delivered: [],
  cancelled: [],
};
```

### Google Maps Static API Embed
```typescript
// For order detail address map
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function StaticMapEmbed({ address }: { address: { street: string; city: string; state: string; zip: string } }) {
  const addressStr = encodeURIComponent(`${address.street}, ${address.city}, ${address.state} ${address.zip}`);
  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${addressStr}&zoom=15&size=400x200&scale=2&markers=color:red|${addressStr}&key=${MAPS_KEY}`;
  return (
    <img
      src={src}
      alt={`Map showing ${address.street}`}
      className="w-full h-[200px] object-cover rounded-lg"
      loading="lazy"
    />
  );
}
```

### Sign Out Action
```typescript
// Source: src/lib/supabase/actions.ts
import { signOut } from "@/lib/supabase/actions";
// Usage in profile page:
<form action={signOut}>
  <Button type="submit" variant="outline" className="text-status-error">
    <LogOut className="h-4 w-4 mr-2" />
    Sign Out
  </Button>
</form>
```

### Existing ConfirmDialog Usage
```typescript
// Source: src/components/ui/admin/settings/ConfirmDialog.tsx
import { ConfirmDialog } from "@/components/ui/admin/settings/ConfirmDialog";
<ConfirmDialog
  open={showConfirm}
  title="Change Order Status"
  description={`Change from ${currentStatus} to ${newStatus}?`}
  confirmLabel="Confirm"
  confirmVariant="primary"
  onConfirm={handleConfirm}
  onCancel={() => setShowConfirm(false)}
  isLoading={isUpdating}
/>
```

## Discretion Recommendations

| Area | Recommendation | Reasoning |
|------|---------------|-----------|
| Item row density | **Compact** — name, qty, price inline. No thumbnails. | Consistent with existing OrderItemsSection. Menu items don't have reliable thumbnails. |
| Navigation | **Breadcrumb** — Dashboard > Orders > #XXXX | Existing AdminPageHeader supports breadcrumbs. Used on all admin pages. |
| Desktop layout | **Two-column** — left: items + totals + email history; right: customer + status + timeline + payment | Matches OrderDetailExpanded grid pattern. Information density for 1080p. |
| Status badge colors | **Reuse existing** STATUS_COLORS from config.ts | Already defined, tested, used throughout. |
| Status transitions | **Strict forward** — use existing VALID_TRANSITIONS from status route | Backend already enforces this. Match frontend to backend. |
| Auto-refresh | **Manual refresh button** — no polling | Admin explicitly refreshes. Avoids unnecessary API calls. Matches orders list page. |
| Quick actions | **Yes** — status change buttons at top, below header | Quick access without scrolling. Matches OrderDetailExpanded pattern. |
| Admin notes | **Defer** — not in requirements, not in locked decisions | Can add later. Keep scope focused. |
| Order type | **Show delivery window info only** — all orders are delivery currently | No pickup infrastructure exists. |
| Loading state | **Skeleton** — SkeletonCrossfade wrapping content | Consistent with all admin pages (orders, drivers, settings). |
| Keyboard shortcuts | **Defer** — nice-to-have, not in requirements | Add in a polish phase. |
| Email history format | **Expandable list** — reuse existing EmailHistory component as-is | Already built with expand/collapse, badges, resend. |
| Email metadata | **Show recipient, status, resend_id, error message** | Already in EmailHistory component. |
| Email HTML preview | **Defer** — complex, requires rendering email templates client-side | Would need @react-email/render on client. Not in requirements. |
| Email templates for manual compose | **No templates** — free-form rich text with order context auto-appended | CONTEXT says "auto-include order context in footer". |
| Cancelled order treatment | **Muted/greyed out cards** — reduced opacity, strikethrough on cancelled items | Visual distinction without hiding info. |
| Dirty form state | **Yes** — FloatingUnsavedBar exists in admin settings, reuse it | Prevents accidental navigation. |
| Print/export | **Defer** — not in requirements | Can add `window.print()` later. |

## API Gaps Requiring New Routes or Extensions

| Gap | Solution | Priority |
|-----|----------|----------|
| Order details missing delivery window + Stripe ID | Extend `/api/admin/orders/[id]/details` to include `delivery_window_start`, `delivery_window_end`, `stripe_payment_intent_id` | HIGH |
| Status change doesn't send email | Extend `/api/admin/orders/[id]/status` to accept `notifyCustomer`, `reason`, trigger email | HIGH |
| Admin profile with role + auth provider | Create `/api/admin/profile` GET route (or extend existing) returning role, identities, created_at | HIGH |
| Admin notification preferences | Upsert to `customer_settings` table for admin user_id, or create admin-specific storage | MEDIUM |
| Admin activity stats (orders processed, last login) | Create `/api/admin/profile/stats` route querying order_audit_log count + auth.users last_sign_in_at | MEDIUM |
| Priority flag on orders | Add `is_priority` boolean column to orders table + migration + PATCH endpoint | MEDIUM |
| Manual email compose endpoint | Create `/api/admin/emails/compose` POST route accepting HTML body + order context | MEDIUM |

## Database Considerations

### Existing Tables Used
- `orders` — all order fields, status, timestamps, stripe_payment_intent_id
- `order_items` — line items with snapshots
- `order_audit_log` — status timeline source (action, actor_role, reason, created_at)
- `profiles` — admin profile (full_name, email, phone, role, created_at)
- `notification_logs` — email history for orders
- `customer_settings` — notification_prefs JSON, theme (reusable for admin)
- `addresses` — delivery address via order.address_id FK

### New Column Needed
- `orders.is_priority` (boolean, default false) — for priority toggle feature

### Supabase Auth Data
- `supabase.auth.getUser()` returns `user.identities` array with provider info
- `user.last_sign_in_at` for last login display
- `user.created_at` for "Member since" display
- `user.app_metadata.role` for role display

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server Components for admin | Client Components with client-side fetch | Project convention | All admin pages are 'use client'. Don't break pattern. |
| Radix Accordion for collapsible | Simple useState toggle | Project convention | Radix Accordion is overkill for 5-6 cards |
| @tanstack/react-query | Raw fetch + useState | Project convention | Admin pages don't use React Query. Keep consistent. |
| layoutId animations | CSS transitions | Phase 60 migration | But admin nav still uses layoutId. New page content should use CSS where possible. |

## Open Questions

1. **Stripe Payment Details Depth**
   - What we know: `stripe_payment_intent_id` exists in orders table. Can look up payment in Stripe.
   - What's unclear: Should we call Stripe API server-side to get payment method/status, or just display the payment intent ID as a link to Stripe dashboard?
   - Recommendation: Display payment intent ID as a clickable link to Stripe dashboard. Avoids Stripe API latency on every page load. Mark as "Paid" / "Pending" / "Refunded" based on order status, not Stripe status.

2. **Rich Text Editor Scope for Manual Email**
   - What we know: CONTEXT says "rich text editor" for manual email compose.
   - What's unclear: Exact formatting needs — just bold/italic/links, or full formatting?
   - Recommendation: Tiptap with starter-kit (bold, italic, bullet list, ordered list, link). No images, no tables. Keep it simple. Output as HTML wrapped in EmailLayout for sending.

3. **Priority Flag Persistence**
   - What we know: CONTEXT says "admin can flag orders as rush/priority (internal only)".
   - What's unclear: No `is_priority` column exists in orders table.
   - Recommendation: Add a Supabase migration for `ALTER TABLE orders ADD COLUMN is_priority BOOLEAN DEFAULT FALSE`. Simple PATCH endpoint.

4. **Admin Notification Preferences Schema**
   - What we know: `customer_settings` has `notification_prefs` JSON. Admin users could reuse this.
   - What's unclear: Whether admin notification prefs should be separate from customer prefs.
   - Recommendation: Reuse `customer_settings` table. The `user_id` FK points to profiles, which includes admins. Insert a row for admin user_id if not exists (upsert).

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/app/(admin)/admin/` — all existing admin pages, layouts, patterns
- Codebase analysis: `src/app/api/admin/` — all existing admin API routes
- Codebase analysis: `src/components/ui/admin/` — all existing admin UI components
- Codebase analysis: `src/types/database.ts` — complete database schema types
- Codebase analysis: `src/lib/email/` — email sending infrastructure
- Codebase analysis: `src/lib/auth/admin.ts` — admin auth pattern

### Secondary (MEDIUM confidence)
- Codebase analysis: `src/lib/supabase/actions.ts` — signOut server action
- Codebase analysis: `src/components/ui/account/SettingsTab/ThemeSelector.tsx` — theme toggle pattern
- Codebase analysis: `src/app/api/account/profile/route.ts` — profile API pattern

### Tertiary (LOW confidence)
- Tiptap rich text editor recommendation — based on ecosystem knowledge, not verified via Context7. Need to verify latest API for React 19 compatibility.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and used in codebase
- Architecture: HIGH — follows 100% established codebase patterns
- Pitfalls: HIGH — identified from direct code analysis of existing API routes and components
- Rich text editor: MEDIUM — Tiptap is standard but not yet verified for React 19 + Next.js 16

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable — internal UI, no external API changes expected)
