# Stack Research: v1.9 Launch-Ready MVP

**Domain:** Ops dashboard, route assignment, configurable business rules, email reliability, driver simplification
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

v1.9 requires **zero new npm packages**. Every feature builds on existing installed dependencies. The ops dashboard uses Supabase Realtime (already used in `useTrackingSubscription`). Email reliability uses the existing Resend SDK v6.9.x which already includes `webhooks.verify()` for proper svix signature verification. Configurable business rules extend the existing `app_settings` table + admin settings API + validation schemas. Driver simplification is pure UI work using existing Zustand, Radix UI, and Framer Motion. Route assignment extends existing admin routes API with visual components built from Radix primitives already installed.

The codebase already has:
- Supabase Realtime subscriptions (`useTrackingSubscription.ts`) -- extend pattern to ops dashboard
- Email send with retry + notification_logs + Resend webhook handler -- add svix verification, enhance failure tracking
- `app_settings` table with CRUD API + Zod validation schemas -- add new setting keys
- Admin routes/orders/drivers pages -- add ops dashboard page + route assignment UI
- Driver pages with profile/earnings/schedule -- add simple mode toggle

---

## No New Dependencies Required

### Already Installed -- Use As-Is

| Technology | Installed Version | v1.9 Usage | Confidence |
|---|---|---|---|
| `@supabase/supabase-js` | ^2.90.1 | Realtime subscriptions for ops dashboard live order status | HIGH |
| `resend` | ^6.9.1 | `resend.webhooks.verify()` for proper svix webhook signature verification | HIGH |
| `@tanstack/react-query` | ^5.90.1 | Data fetching + optimistic updates for bulk operations | HIGH |
| `zod` | ^4.3.5 | Validation schemas for new settings keys, bulk operation payloads | HIGH |
| `react-hook-form` + `@hookform/resolvers` | ^7.71.1 / ^5.2.2 | Admin settings forms for configurable business rules | HIGH |
| `zustand` | ^5.0.10 | Driver simple mode preference (persisted to localStorage) | HIGH |
| `date-fns` | ^4.1.0 | Countdown timers, cutoff calculations, delivery window formatting | HIGH |
| `recharts` | ^3.6.0 | Ops dashboard status count charts (PieChart for order distribution) | HIGH |
| `lucide-react` | ^0.562.0 | Dashboard icons (Truck, Clock, Users, AlertTriangle, Phone, MapPin) | HIGH |
| `framer-motion` | ^12.26.1 | AnimatePresence for bulk operation toasts, dashboard transitions | HIGH |
| `@radix-ui/react-checkbox` | ^1.3.2 | Bulk selection checkboxes in ops dashboard order list | HIGH |
| `@radix-ui/react-select` | ^2.2.6 | Driver assignment dropdown, status filter, time window filter | HIGH |
| `@radix-ui/react-dialog` | ^1.1.15 | Confirmation dialogs for driver simple mode, route creation | HIGH |
| `@radix-ui/react-alert-dialog` | ^1.1.15 | Destructive confirmations (bulk status change, delivery mark) | HIGH |
| `@radix-ui/react-progress` | ^1.1.8 | Route completion progress bars | HIGH |
| `@react-google-maps/api` | ^2.20.8 | Route map preview in assignment UI (already used in tracking) | HIGH |
| `class-variance-authority` | ^0.7.1 | Variant-based status badges (pending/confirmed/preparing/delivered) | HIGH |
| `clsx` + `tailwind-merge` | ^2.1.1 / ^3.4.0 | Conditional class composition across all new UI | HIGH |
| `@upstash/redis` + `@upstash/ratelimit` | ^1.36.2 / ^2.0.8 | Rate limiting on new bulk operation endpoints | HIGH |
| `idb-keyval` | ^6.2.2 | Offline route data persistence for driver simple mode | HIGH |
| `@sentry/nextjs` | ^10.38.0 | Error tracking for new API routes and dashboard components | HIGH |

---

## Feature-by-Feature Stack Mapping

### 1. Saturday Ops Dashboard (Phase 1)

**What's needed:** Real-time order status counts, bulk operations, countdown timers.

| Capability | Technology | Pattern | Reference |
|---|---|---|---|
| Live order status updates | Supabase Realtime | Same channel pattern as `useTrackingSubscription.ts` | `src/lib/hooks/useTrackingSubscription.ts` |
| Status count cards | Recharts PieChart | Same patterns as admin analytics | `src/app/(admin)/admin/analytics/` |
| Bulk checkbox select | Radix Checkbox + local state | useState array of selected IDs | `@radix-ui/react-checkbox` |
| Bulk status change API | Next.js API route + Zod | Validate array of order IDs + target status | `src/app/api/admin/orders/[id]/status/route.ts` |
| Countdown to cutoff | date-fns `differenceInSeconds` + `useEffect` interval | Client-side countdown, reads cutoff from `app_settings` | `src/types/delivery.ts` (currently hardcoded) |
| Optimistic UI on status change | React Query `useMutation` + `onMutate` | Optimistic cache update, rollback on error | `@tanstack/react-query` |
| Toast confirmations | Existing toast system | `useToastV8` hook | `src/lib/hooks/useToastV8.ts` |

**Supabase Realtime pattern for ops dashboard:**

```typescript
// Subscribe to ALL order changes (admin dashboard, not filtered by order ID)
const channel = supabase
  .channel('ops-orders')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'orders' },
    (payload) => {
      // Update order status counts in real-time
      queryClient.invalidateQueries({ queryKey: ['ops-orders'] });
    }
  )
  .subscribe();
```

**Key difference from tracking:** Ops dashboard subscribes to ALL order updates (no filter), while customer tracking subscribes to a single order ID. RLS on the `orders` table must allow admin SELECT of all orders (already works via existing admin API routes using service client).

**Important:** The Realtime subscription uses the browser Supabase client, which respects RLS. Admin must have a SELECT policy on `orders`. The existing pattern uses API routes with `createServiceClient()` (bypasses RLS). For real-time, either:
1. Add admin SELECT RLS policy to `orders` table (recommended -- cleaner)
2. Or use API polling instead of Realtime (simpler, acceptable at 20-50 orders)

**Recommendation:** Use React Query polling at 5-second intervals for v1.9 MVP. Supabase Realtime adds complexity for marginal benefit at 20-50 orders/Saturday. Switch to Realtime when order volume exceeds 100/week.

```typescript
// Polling approach (simpler, sufficient for MVP scale)
const { data: orders } = useQuery({
  queryKey: ['ops-orders', statusFilter],
  queryFn: () => fetch('/api/admin/orders?status=' + statusFilter).then(r => r.json()),
  refetchInterval: 5_000, // 5 seconds
});
```

### 2. Route & Driver Assignment (Phase 2)

**What's needed:** Visual unassigned orders panel, driver selection, route creation.

| Capability | Technology | Pattern |
|---|---|---|
| Unassigned orders list | React Query fetch + filter | Filter orders where `route_stop` is null |
| Available drivers list | React Query fetch | `/api/admin/drivers` with availability filter |
| Driver assignment dropdown | Radix Select | `@radix-ui/react-select` |
| Route creation form | React Hook Form + Zod | `react-hook-form` + `@hookform/resolvers` |
| Route map preview | Google Maps API | `@react-google-maps/api` (already used) |
| Drag-and-drop reorder | **Not needed** | At 2-4 drivers / 5-10 stops, manual reorder via up/down buttons is simpler |
| Order reassignment | API PATCH + optimistic update | Move order between routes via stop reassignment |

**No drag-and-drop library needed.** At the current scale (2-4 drivers, 5-10 stops per route), click-to-assign and up/down reorder buttons are faster and less error-prone than drag-and-drop. Avoid `@dnd-kit` or `react-beautiful-dnd` -- they add bundle size and touch-device complexity for negligible UX benefit at this scale.

### 3. Configurable Business Rules (Phase 4)

**What's needed:** Extend `app_settings` table with new keys, admin UI form, server reads from table.

| Capability | Technology | Pattern | Reference |
|---|---|---|---|
| Settings CRUD API | Existing API route | Extend `GET/PATCH /api/admin/settings` | `src/app/api/admin/settings/route.ts` |
| Validation | Zod schemas | Add keys to `deliverySettingsSchema` | `src/lib/validations/settings.ts` |
| Admin settings form | React Hook Form + Radix | Extend existing settings page | `src/app/(admin)/admin/settings/page.tsx` |
| Server-side config read | Supabase query + cache | Read `app_settings` with 5-min TTL | `src/lib/email/send.ts` (kill switch pattern) |
| Replace hardcoded constants | Remove constants, read from settings | Replace `DELIVERY_FEE_CENTS`, `CUTOFF_HOUR` | `src/types/cart.ts`, `src/types/delivery.ts` |

**New setting keys to add to `app_settings` table:**

| Key | Type | Default | Currently Hardcoded In |
|---|---|---|---|
| `cutoff_day` | number (0-6, 0=Sunday) | 5 (Friday) | `src/types/delivery.ts` |
| `cutoff_hour` | number (0-23) | 15 (3 PM) | `src/types/delivery.ts` |
| `delivery_fee_cents` | number | 1500 | `src/types/cart.ts` |
| `free_delivery_threshold_cents` | number | 10000 | `src/types/cart.ts` |
| `delivery_start_hour` | number | 11 | Hardcoded in UI |
| `delivery_end_hour` | number | 19 | Hardcoded in UI |
| `max_delivery_radius_miles` | number | 15 | Coverage check |
| `max_delivery_duration_minutes` | number | 45 | Coverage check |

**Caching pattern for server-side reads:**

```typescript
// src/lib/settings/cache.ts
let cachedSettings: Record<string, unknown> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getAppSettings(): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (cachedSettings && now - cacheTimestamp < CACHE_TTL) {
    return cachedSettings;
  }
  const supabase = createServiceClient();
  const { data } = await supabase.from('app_settings').select('key, value');
  cachedSettings = Object.fromEntries((data || []).map(r => [r.key, r.value]));
  cacheTimestamp = now;
  return cachedSettings;
}
```

**Note:** This in-memory cache works per-request on serverless (cache lives within the invocation), but is acceptable because `app_settings` rarely changes and a single Supabase query per cold start is fast enough. For true cross-request caching, use `unstable_cache` from Next.js or Upstash Redis, but that is unnecessary at this scale.

**Correction:** On Vercel serverless, in-memory cache actually persists across warm invocations within the same function instance. So this pattern does provide caching benefit during sustained traffic (Saturday operations). Cache invalidation happens naturally on cold starts.

### 4. Email Reliability (Phase 5)

**What's needed:** Proper webhook verification, failure tracking dashboard, retry from admin.

| Capability | Technology | Pattern | Reference |
|---|---|---|---|
| Webhook signature verification | `resend.webhooks.verify()` | Built into Resend SDK v6.9+ | `src/app/api/webhooks/resend/route.ts` |
| Failure tracking | Existing `notification_logs` table | Already logs sent/failed status | `src/lib/email/send.ts` |
| Admin email dashboard | Existing admin emails page | Already has list + resend | `src/app/(admin)/admin/emails/page.tsx` |
| One-click retry | Existing resend endpoint | Already implemented | `src/app/api/admin/emails/[id]/resend/route.ts` |
| Webhook audit logging | `webhook_events` table | Already exists with RLS | `src/app/api/webhooks/resend/route.ts` |
| Bounce/complaint handling | Resend webhook events | Already mapped in webhook handler | `EVENT_STATUS_MAP` in webhook route |

**What needs to change (code changes, not new packages):**

1. **Replace simple secret check with `resend.webhooks.verify()`:**
   ```typescript
   // BEFORE (current - insecure, just compares strings)
   if (webhookSecret !== RESEND_WEBHOOK_SECRET) { ... }

   // AFTER (proper svix signature verification)
   const resend = getResendClient();
   const payload = await request.text(); // Must be raw text, not parsed JSON
   const verified = resend.webhooks.verify({
     payload,
     headers: {
       id: request.headers.get('svix-id') ?? '',
       timestamp: request.headers.get('svix-timestamp') ?? '',
       signature: request.headers.get('svix-signature') ?? '',
     },
     webhookSecret: RESEND_WEBHOOK_SECRET,
   });
   ```

2. **Add `retry_count` column to `notification_logs`** -- track how many times an email has been retried. Flag for manual contact after 3 failures.

3. **Add email status indicator on order detail page** -- query `notification_logs` for the order and show sent/failed/delivered badge.

4. **Log webhook events to `webhook_events` table** -- for audit trail (body hash + timestamp, not full payload).

**No new packages needed.** The Resend SDK `^6.9.1` already includes `webhooks.verify()`. The svix package is bundled internally within the Resend SDK.

### 5. Driver Simplification (Phase 6)

**What's needed:** Simple mode toggle, confirmation dialogs, one-tap contact.

| Capability | Technology | Pattern | Reference |
|---|---|---|---|
| Simple mode preference | Zustand store + localStorage | Same pattern as theme/sound prefs | `src/lib/hooks/useSoundPreference.ts` |
| Confirmation dialogs | Radix AlertDialog | Already used for destructive actions | `@radix-ui/react-alert-dialog` |
| One-tap phone/text | Native `tel:` / `sms:` links | HTML anchor with `href="tel:+1..."` | Standard mobile web |
| Offline route data | idb-keyval | Already used for cart persistence | `src/stores/cart-store.ts` |
| Conditional UI rendering | React conditional rendering | `{!simpleMode && <ComplexComponent />}` | Standard pattern |

**Simple mode store:**

```typescript
// src/stores/driver-prefs-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DriverPrefs {
  simpleMode: boolean;
  toggleSimpleMode: () => void;
}

export const useDriverPrefsStore = create<DriverPrefs>()(
  persist(
    (set) => ({
      simpleMode: false,
      toggleSimpleMode: () => set((state) => ({ simpleMode: !state.simpleMode })),
    }),
    {
      name: 'driver-prefs',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**No new packages needed.** Zustand with localStorage persistence handles the toggle. idb-keyval handles offline route caching (same as cart).

### 6. Critical Bug Fixes (Phase 0)

**What's needed:** TOCTOU fix, cutoff logic, cart race condition.

| Bug | Technology | Pattern |
|---|---|---|
| Checkout TOCTOU cleanup | Supabase `.in()` operator | Replace `.eq()` with `.in()` for batch cleanup |
| `isPastCutoff()` fix | date-fns `isBefore`/`isAfter` | Full datetime comparison, not just hour |
| Cart debounce race | Zustand + timestamp dedup | Add `lastModified` timestamp to cart items |
| Time window validation | Zod `.refine()` | Validate against `TIME_WINDOWS` list |

**No new packages needed.** All fixes use existing Supabase client, date-fns, Zustand, and Zod.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|---|---|---|
| React Query polling (5s) for ops dashboard | Supabase Realtime subscriptions | Realtime adds admin RLS complexity. At 20-50 orders, 5s polling is indistinguishable from real-time. Revisit at 100+ orders/week. |
| Click-to-assign route UI | Drag-and-drop (`@dnd-kit`) | At 2-4 drivers and 5-10 stops, click-to-assign is faster. DnD adds ~15KB bundle + touch device complexity. |
| In-memory settings cache | Upstash Redis cache / `unstable_cache` | Warm serverless instances cache in-memory. Settings change <1x/week. Redis adds network hop for negligible benefit. |
| Resend SDK `webhooks.verify()` | Separate `svix` package (v1.84.1) | Resend SDK bundles svix internally. Adding svix separately is redundant. |
| Zustand localStorage for simple mode | Supabase `drivers` table column | Simple mode is device-specific preference (this phone is simple, laptop is normal). localStorage is correct scope. |
| `tel:` / `sms:` HTML links for driver contact | Twilio / SendGrid for SMS | At 20-50 orders with family drivers, native phone/text links are sufficient. Twilio is for automated notifications at scale. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| `@dnd-kit` or `react-beautiful-dnd` | Overkill for 5-10 stops. Adds 15-30KB. Touch device bugs. | Click-to-assign + up/down reorder buttons |
| `svix` npm package | Resend SDK v6.9+ includes `webhooks.verify()` internally | `resend.webhooks.verify()` |
| `socket.io` or custom WebSocket | Supabase Realtime already handles WebSocket. Custom adds ops burden. | Supabase Realtime or React Query polling |
| `node-cron` or `cron` package | Vercel has native cron via `vercel.json`. Already using `/api/cron/delivery-reminders`. | Vercel Cron Jobs |
| Any state management beyond Zustand | Redux, Jotai, Recoil -- already committed to Zustand. Adding another creates split. | Zustand for all client state |
| `react-table` or `@tanstack/react-table` | Admin tables are simple enough with native `<table>`. Adding a table library for 20-50 rows is overhead. | Native HTML tables with Tailwind styling |
| Server Actions for mutations | Project uses API routes consistently. Mixing patterns creates confusion. | Next.js API routes (`src/app/api/`) |
| `pusher` or `ably` for real-time | Already using Supabase Realtime (included free). Third-party adds cost + dependency. | Supabase Realtime (when needed) or polling |

---

## Version Compatibility

| Package | Current Version | Compatible With | Notes |
|---|---|---|---|
| resend@^6.9.1 | 6.9.3 (latest) | `webhooks.verify()` available | Bump to ^6.9.3 for latest fixes, but ^6.9.1 range already covers it |
| @supabase/supabase-js@^2.90.1 | Installed | Realtime postgres_changes | Already using in `useTrackingSubscription` |
| zod@^4.3.5 | Installed | Zod 4 API (`.error` param, not `.message`) | Already migrated from v3 |
| @tanstack/react-query@^5.90.1 | 5.90.21 (latest) | `refetchInterval` for polling | ^5.90.1 range covers latest |
| zustand@^5.0.10 | Installed | `persist` middleware with localStorage | Already using for cart |
| date-fns@^4.1.0 | Installed | `differenceInSeconds`, `isBefore`, `isAfter` | Already pervasive in codebase |

**No version bumps required.** All existing `^` ranges cover the latest patch versions.

---

## Database Changes (No npm packages, SQL only)

These are schema changes needed in Supabase, not npm packages:

| Change | Table | Purpose |
|---|---|---|
| Add `retry_count` column | `notification_logs` | Track email retry attempts |
| Add new setting rows | `app_settings` | `cutoff_day`, `cutoff_hour`, `delivery_fee_cents`, etc. |
| Add admin SELECT policy | `orders` | If using Supabase Realtime for ops dashboard (optional) |
| Add indexes | `orders(status)`, `orders(delivery_date)`, `notification_logs(order_id)` | Performance at scale |
| Add `simple_mode` column | `drivers` | Optional: server-side toggle sync (or use localStorage only) |

---

## Integration Points

### How New Features Connect to Existing Code

```
Ops Dashboard
  reads from: /api/admin/orders (existing)
  extends: add ?status= filter, add bulk PATCH endpoint
  uses: React Query polling, Radix Checkbox, Recharts PieChart

Route Assignment
  reads from: /api/admin/routes (existing), /api/admin/drivers (existing)
  extends: add POST /api/admin/routes with order assignment
  uses: Radix Select, Google Maps, React Hook Form

Configurable Settings
  reads from: /api/admin/settings (existing)
  extends: add new keys to validation schema + settings form
  replaces: hardcoded constants in src/types/cart.ts, src/types/delivery.ts
  uses: React Hook Form, Zod, existing settings page

Email Reliability
  reads from: /api/admin/emails (existing), /api/webhooks/resend (existing)
  extends: add svix verification, add retry_count tracking
  uses: Resend SDK webhooks.verify(), existing notification_logs table

Driver Simple Mode
  reads from: Zustand localStorage store (new)
  extends: existing driver pages conditionally render based on simpleMode
  uses: Zustand persist, Radix AlertDialog, idb-keyval
```

---

## Installation

```bash
# No new packages to install.
# All v1.9 features use existing dependencies.

# Verify current installation is up to date:
pnpm install
```

---

## Sources

- [Resend Webhook Verification](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests) -- confirms `resend.webhooks.verify()` available in SDK (HIGH confidence)
- [Resend npm](https://www.npmjs.com/package/resend) -- v6.9.3 latest, ^6.9.1 range compatible (HIGH confidence)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) -- channel subscription patterns (HIGH confidence)
- [Svix npm](https://www.npmjs.com/package/svix) -- v1.84.1 latest, but NOT needed separately (HIGH confidence)
- [Zod v4 Release Notes](https://zod.dev/v4) -- confirms v4 API compatibility (HIGH confidence)
- [TanStack React Query](https://tanstack.com/query/latest) -- v5.90.x `refetchInterval` for polling (HIGH confidence)
- Codebase analysis of existing patterns: `useTrackingSubscription.ts`, `send.ts`, `settings/route.ts`, `resend/route.ts` (HIGH confidence)

---

*Stack research for: v1.9 Launch-Ready MVP*
*Researched: 2026-03-01*
