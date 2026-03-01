# Architecture Patterns

**Domain:** Meal delivery operations dashboard (v1.9 features integrating into existing Next.js + Supabase app)
**Researched:** 2026-03-01
**Confidence:** HIGH -- based on direct codebase analysis of existing patterns, tables, and API routes

---

## Existing Architecture Snapshot

### Route Groups & Layout Hierarchy

```
src/app/
  (admin)/admin/     -- AdminLayout (server auth check + AdminNav sidebar)
  (driver)/driver/   -- DriverLayout (server auth check)
  (customer)/        -- CustomerLayout
  (public)/          -- Public pages
  api/               -- API routes (admin/, driver/, webhooks/, etc.)
```

### Existing Tables (24 confirmed + 2 untyped)

**Typed in `database.ts`:** profiles, addresses, menu_categories, menu_items, modifier_groups, modifier_options, item_modifier_groups, orders, order_audit_log, order_items, order_item_modifiers, featured_sections, featured_section_items, driver_invites, driver_ratings, customer_settings, webhook_events

**Typed in `driver.ts`:** drivers, routes, route_stops, location_updates, delivery_exceptions, driver_badges

**Referenced but NOT in Database type:** `app_settings`, `notification_logs` (both used via untyped Supabase calls with manual casts)

### Auth Patterns

- **Server Components:** `createClient()` + `supabase.auth.getUser()` + profile role check (admin layout, driver layout)
- **API Routes:** `requireAdmin()` / `requireDriver()` helper returning `{ success, supabase, userId }` or error
- **Rate Limiting:** `checkRateLimit({ limiter, identifier, role, route })` on all API routes

### State Management

- **Server state:** Direct Supabase queries in server components, `fetch('/api/...')` in client components with `useState`/`useEffect`
- **Client state:** Zustand stores (cart-store, checkout-store, driver-store) with localStorage/IndexedDB persistence
- **No React Query usage in admin/driver pages** -- admin pages use raw `fetch()` + `useState`

### Real-time

- **Single usage:** `useTrackingSubscription` for customer order tracking (Supabase Realtime `postgres_changes`)
- **Pattern:** Subscribe to table changes with row-level filters, fallback to 30s polling on disconnect
- **Separate channels** for high-frequency data (location) vs. status changes

---

## Recommended Architecture for v1.9 Features

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Ops Dashboard** (`/admin` page replacement) | Saturday operations triage: status counts, bulk actions, countdown timers | `GET /api/admin/ops/summary` (new), `POST /api/admin/orders/bulk-status` (new) |
| **Route Assignment Panel** (admin page) | Visual driver-to-order assignment, route creation | `GET /api/admin/routes` (existing), `POST /api/admin/routes` (new), `PATCH /api/admin/orders/:id/driver` (existing) |
| **Admin Settings** (existing `/admin/settings`) | Configurable business rules CRUD | `GET/PATCH /api/admin/settings` (existing, extend schema) |
| **Email Dashboard** (existing `/admin/emails`) | Delivery status, retry, webhook events | `GET /api/admin/emails` (existing), Resend webhook (existing) |
| **Driver Simple Mode** (driver pages) | Stripped-down delivery interface | `drivers` table (new column), driver-store (extended), existing driver API routes |

### Data Flow

```
                    Saturday Morning Flow
                    ====================

Admin loads /admin (Ops Dashboard)
  |
  +--> GET /api/admin/ops/summary
  |    (aggregates orders by status, counts unassigned, driver availability)
  |
  +--> Supabase Realtime channel: "ops:saturday-{date}"
  |    (subscribes to orders table UPDATE events for current delivery_date)
  |
  +--> Bulk action: POST /api/admin/orders/bulk-status
  |    { orderIds: [...], status: "confirmed" }
  |    |
  |    +--> Updates orders table (batch)
  |    +--> Inserts order_audit_log entries (batch)
  |    +--> Fire-and-forget: queues emails for each order
  |
  +--> Route assignment: POST /api/admin/routes/assign
       { driverId, orderIds: [...] }
       |
       +--> Creates route row (delivery_date, driver_id)
       +--> Creates route_stops rows (one per order, with stop_index)
       +--> Updates orders.assigned_driver_id for each order
       +--> Inserts audit log entries
```

```
                    Settings Read Flow
                    ===================

Any API route needing business rules:
  |
  +--> getAppSettings(supabase)  // new utility
  |    reads from app_settings table
  |    returns typed { cutoffHour, cutoffDay, deliveryFeeCents, ... }
  |
  +--> No in-memory cache (serverless = no persistent memory)
  |    Request-scoped: one read per request, amortized by
  |    Supabase connection pooling
  |
  +--> Fallback: hardcoded defaults if table read fails (fail-open)
```

---

## Integration Design: Feature by Feature

### 1. Ops Dashboard

**Where it lives:** Replace or augment the existing `/admin` dashboard page.

The current admin dashboard at `/admin` (the default `page.tsx` inside `(admin)/admin/`) should become the Ops Dashboard on Saturdays. This avoids a new nav item -- the operator's first screen IS the ops center.

**New API route:** `GET /api/admin/ops/summary`
- Returns order counts by status for current Saturday
- Returns unassigned order count (orders with `assigned_driver_id IS NULL` and status in [confirmed, preparing])
- Returns available driver list (drivers with `saturday` in `availability_json.available_days` and current date not in `blocked_dates`)
- Returns countdown data (cutoff time from `app_settings`, delivery start time)

**New API route:** `POST /api/admin/orders/bulk-status`
- Accepts `{ orderIds: string[], status: OrderStatus, reason?: string }`
- Validates all orders exist and are in valid transition state
- Updates in single transaction (Supabase service client)
- Creates batch audit log entries
- Queues emails fire-and-forget (does NOT await all emails)

**Real-time updates:** Use Supabase Realtime, same pattern as `useTrackingSubscription`.
- Subscribe to `orders` table changes filtered by delivery date
- On incoming update, refresh status counts (client-side recount from cached order list)
- This gives the operator live status without manual refresh
- Polling fallback at 15s (shorter than tracking's 30s because ops is time-sensitive)

**New components:**
```
src/app/(admin)/admin/
  page.tsx                    -- Modified: conditionally show OpsCenter vs. existing dashboard
  OpsCenter/
    index.tsx                 -- Barrel
    OpsDashboard.tsx          -- Main ops layout
    StatusCountCards.tsx       -- Pending/Confirmed/Preparing/Out counts with bulk action buttons
    CountdownTimer.tsx         -- Cutoff and delivery-start countdown
    UnassignedBadge.tsx        -- Red indicator for orders needing routes
    DriverAvailabilityWidget.tsx -- Who's available today
    TimeWindowGrouping.tsx     -- Orders grouped by delivery slot
```

**Why NOT a separate page:** The solo operator opens `/admin` and needs to immediately see Saturday state. A separate `/admin/ops` adds a click. The existing dashboard can detect "is today Saturday?" and show the ops view contextually.

### 2. Route & Driver Assignment

**Where it lives:** New page at `/admin/routes/assign` or enhanced `/admin/routes` page.

The AdminNav already has a "Routes" item pointing to `/admin/routes`. Currently no route management page exists (only API routes for driver-side route operations). Build the assignment UI here.

**Existing infrastructure to use:**
- `routes` table: has `delivery_date`, `driver_id`, `status`, `stats_json`
- `route_stops` table: has `route_id`, `order_id`, `stop_index`, `status`
- `orders.assigned_driver_id`: already exists, updated by existing `PATCH /api/admin/orders/:id/driver`
- `drivers` table: has `availability_json`, `is_active`
- Driver assignment API: `PATCH /api/admin/orders/[id]/driver` already validates driver active status

**New API route:** `POST /api/admin/routes`
- Creates a route for a given delivery_date with a driver_id
- Accepts `orderIds` array, creates route_stops with sequential stop_index
- Updates each order's `assigned_driver_id`
- Creates audit log entries

**New API route:** `PATCH /api/admin/routes/[routeId]/orders`
- Add/remove orders from existing route
- Reindexes stop_index values
- Updates order driver assignments accordingly

**Modified API route:** `GET /api/admin/orders` -- add query param `?unassigned=true&deliveryDate=YYYY-MM-DD` to filter orders without routes.

**New components:**
```
src/app/(admin)/admin/routes/
  page.tsx                    -- Route management page
  assign/
    page.tsx                  -- Assignment interface
  components/
    UnassignedOrdersPanel.tsx -- Left panel: confirmed orders not on a route
    AvailableDriversPanel.tsx -- Right panel: drivers with capacity
    RouteBuilder.tsx          -- Drag-select orders + assign to driver
    RouteSummaryCard.tsx      -- Stop count, estimated duration
```

**No new tables needed.** The existing `routes`, `route_stops`, and `orders.assigned_driver_id` schema fully supports this. The assignment is a matter of building the admin UI and the batch-creation API route.

### 3. Configurable Business Rules (app_settings)

**What exists already:**
- `app_settings` table with `key`, `value` (JSONB), `category`, `updated_by`
- `GET/PATCH /api/admin/settings` with category-based grouping
- Settings validation schema in `src/lib/validations/settings.ts` with delivery, operations, notifications categories
- Admin Settings page at `/admin/settings` with `SettingsClient` component
- Email `send.ts` already reads `email_sending_enabled` from `app_settings`

**What needs to change:**

The hardcoded constants in `src/types/delivery.ts` must be replaced:
```typescript
// BEFORE (hardcoded)
export const CUTOFF_DAY = 5;      // Friday
export const CUTOFF_HOUR = 15;    // 3 PM
export const TIMEZONE = "America/Los_Angeles";

// AFTER (read from settings, with hardcoded fallback)
```

**New utility:** `src/lib/services/app-settings.ts`
```typescript
interface AppSettings {
  cutoffDay: number;
  cutoffHour: number;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  deliveryStartHour: number;
  deliveryEndHour: number;
  maxDeliveryRadiusMiles: number;
  emailSendingEnabled: boolean;
}

async function getAppSettings(supabase): Promise<AppSettings> {
  // Read from app_settings table
  // Return typed object with HARDCODED DEFAULTS as fallback
  // One query per request (no cross-request cache on serverless)
}
```

**Cache strategy:** No in-memory cache. Vercel serverless functions have no shared memory between invocations. Each API request reads `app_settings` once. At 20-50 orders/Saturday, this is ~100-200 reads total -- negligible for Supabase. The existing `deliverySettingsSchema` already has `delivery_cutoff_time`, `base_delivery_fee_cents`, `free_delivery_threshold_cents`, so the settings schema is mostly ready.

**Settings that need to be seeded:**
- `cutoff_day` (default: 5 / Friday)
- `cutoff_hour` (default: 15 / 3PM)
- `delivery_fee_cents` (default: 1500)
- `free_delivery_threshold_cents` (default: 10000)
- `delivery_start_hour` (default: 11)
- `delivery_end_hour` (default: 19)

**Migration path:** Seed `app_settings` rows with current hardcoded values. Update the settings form to expose these. Update API routes to use `getAppSettings()` instead of importing constants.

### 4. Email Reliability

**What exists already:**
- `notification_logs` table (untyped but used): `id, order_id, user_id, notification_type, channel, recipient, subject, resend_id, status, error_message, metadata, sent_at, created_at`
- `sendEmail()` in `src/lib/email/send.ts`: 3-retry with exponential backoff, logs success/failure to `notification_logs`
- Resend webhook handler at `/api/webhooks/resend`: updates `notification_logs.status` + appends events to `metadata.resend_events[]`
- Admin email log page at `/admin/emails`: paginated list with filters, resend button for failed emails
- Admin email resend at `POST /api/admin/emails/:id/resend`

**What needs to change:**

The core email infrastructure is already built. The v1.9 work is incremental:

1. **Order detail email indicator** -- The order detail page (`/admin/orders/[id]`) should show email status for that order. This is a `GET /api/admin/emails?orderId=X` call (already supported).

2. **3-failures flag** -- After 3 send attempts all fail, flag the order for manual contact. Add a computed field or trigger: if `notification_logs` has 3+ `status='failed'` rows for same `order_id`, surface a "Contact manually" badge on the ops dashboard.

3. **Webhook audit logging** -- The existing Resend webhook handler lacks body hash verification. Add `svix` package for proper signature verification (currently just checks header presence). Add a `webhook_audit_log` or extend `webhook_events` table with `body_hash` and `signature_valid` fields.

**No new tables needed for core email reliability.** The `notification_logs` table already captures everything. The admin email page already has filtering, pagination, and retry. The work is wiring existing data into the order detail and ops dashboard views.

**New component:**
```
src/app/(admin)/admin/orders/[id]/
  EmailStatusBadge.tsx        -- Shows email delivery status for this order
```

### 5. Driver Simple Mode

**Where the preference lives:** Server-side on the `drivers` table.

Add `simple_mode` boolean column to `drivers` table (default `true` for new family drivers). This is a server-side preference because:
- Admin can set it during driver invite/setup (family members default to simple)
- Persists across devices (driver might use different phone)
- Admin can toggle it from driver management page

**Client-side behavior:**

The driver Zustand store (`useDriverStore`) already tracks UI state. Add `isSimpleMode` to the store, hydrated from the server on page load.

```typescript
// driver-store.ts addition
interface DriverState {
  // ... existing
  isSimpleMode: boolean;
  setSimpleMode: (enabled: boolean) => void;
}
```

**What simple mode hides:**
- Route optimization comparison
- Exception modals (replace with simple "Problem? Call admin" button)
- Earnings dashboard link
- Detailed delivery timestamps
- Map overview

**What simple mode shows:**
- Customer name (large text)
- Address (large text, tap to open Maps)
- Phone (tap to call)
- "Mark Delivered" button (large, green, with confirmation dialog)
- "Next Stop" / "Done" indicator

**New components:**
```
src/app/(driver)/driver/route/
  SimpleStopCard.tsx          -- Simplified stop view for simple mode
  SimpleRouteView.tsx         -- List of stops in simple mode
  DeliveryConfirmDialog.tsx   -- "Mark delivered at 123 Main St?" confirmation
```

**Driver API change:** `GET /api/driver/profile` should return `simple_mode` field. Driver page server component reads it and passes to client.

**Admin API change:** `PATCH /api/admin/drivers/:id` should accept `simpleMode` toggle.

---

## Patterns to Follow

### Pattern 1: Batch API Operations

**What:** Single API endpoint that operates on multiple records atomically.
**When:** Bulk status changes, batch route assignment.
**Why:** The ops dashboard needs to confirm 20 orders in one click. Individual PATCH calls would be slow and error-prone.

```typescript
// POST /api/admin/orders/bulk-status
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { orderIds, status, reason } = await request.json();
  // Validate all order IDs exist and are in valid transition state
  // Update all in single query: .in('id', orderIds)
  // Batch insert audit logs
  // Fire-and-forget email notifications
}
```

### Pattern 2: Settings Utility with Hardcoded Fallbacks

**What:** Centralized settings reader that falls back to constants if DB read fails.
**When:** Any API route needs business rules (cutoff, fees, delivery windows).
**Why:** Fail-open pattern already established in email send. Settings must never block order flow.

```typescript
// src/lib/services/app-settings.ts
const DEFAULTS: AppSettings = {
  cutoffDay: 5,
  cutoffHour: 15,
  deliveryFeeCents: 1500,
  // ...
};

export async function getAppSettings(supabase: SupabaseClient): Promise<AppSettings> {
  try {
    const { data } = await supabase.from('app_settings').select('key, value');
    return mergeWithDefaults(data, DEFAULTS);
  } catch {
    return DEFAULTS; // fail-open
  }
}
```

### Pattern 3: Supabase Realtime for Admin Dashboard

**What:** Subscribe to `orders` table changes filtered by delivery date.
**When:** Ops dashboard needs live status counts.
**Why:** Existing pattern in `useTrackingSubscription` proves it works. Admin needs faster updates than 30s polling.

```typescript
// useOpsDashboardSubscription.ts
const channel = supabase
  .channel(`ops:${deliveryDate}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    // No row-level filter -- want ALL order updates for this Saturday
  }, handleOrderUpdate)
  .subscribe();
```

**Key difference from tracking:** No row-level filter (want all orders, not one). Recalculate counts client-side when any order updates.

### Pattern 4: Server-Side Preference with Client Hydration

**What:** Driver preferences stored in DB, hydrated to client state on page load.
**When:** Simple mode toggle, any driver preference that must persist across devices.
**Why:** Family drivers share a phone or switch devices. Server-side ensures consistency.

```typescript
// Server component reads preference
const { data: driver } = await supabase
  .from('drivers').select('simple_mode').eq('user_id', user.id);

// Pass to client component as prop
<DriverRouteView isSimpleMode={driver.simple_mode ?? true} />

// Client component stores in Zustand for UI toggling
// But saves back to server on change
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: In-Memory Caching for Settings

**What:** Caching `app_settings` in a module-level variable.
**Why bad:** Vercel serverless functions are stateless. Module-level variables reset between invocations. Cache would either be stale or empty. At worst, two concurrent requests see different settings.
**Instead:** Read once per request. At 20-50 orders/Saturday, this is negligible DB load.

### Anti-Pattern 2: Individual API Calls for Bulk Operations

**What:** Calling `PATCH /api/admin/orders/:id/status` in a loop from the client.
**Why bad:** 20 orders = 20 API calls = 20 cold starts on serverless = 5-10 seconds total. Race conditions possible. Partial failure leaves inconsistent state.
**Instead:** Single `POST /api/admin/orders/bulk-status` endpoint.

### Anti-Pattern 3: Client-Side Business Rule Constants

**What:** Importing `CUTOFF_DAY`, `CUTOFF_HOUR` directly in client components.
**Why bad:** When admin changes cutoff via settings, client still shows old hardcoded values. Requires deploy to update.
**Instead:** API routes read from `app_settings`. Client displays what API returns (e.g., "Order by Friday 5PM" comes from server-rendered content or API response, not a client constant).

### Anti-Pattern 4: Full Page Reload for Real-Time Updates

**What:** Using `router.refresh()` or full re-fetch on every order update.
**Why bad:** The ops dashboard shows 40+ orders. Full refresh causes layout shift, loses scroll position, and is slow.
**Instead:** Supabase Realtime subscription updates individual order status in client state. Optimistic UI for admin-initiated changes.

### Anti-Pattern 5: Adding New Admin Nav Items for Every Feature

**What:** Adding "Ops Center", "Assignment", "Settings" as separate nav items.
**Why bad:** The admin nav already has 10 items. More items = harder to find things. Solo operator doesn't need complex navigation.
**Instead:** Ops Dashboard replaces `/admin` default view on Saturdays. Route assignment lives under existing "Routes" nav item. Settings already has its nav item.

---

## New vs. Modified: Explicit Inventory

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/admin/ops/summary/route.ts` | Ops dashboard aggregation endpoint |
| `src/app/api/admin/orders/bulk-status/route.ts` | Batch status change |
| `src/app/api/admin/routes/route.ts` (POST) | Route creation with order assignment |
| `src/app/api/admin/routes/[routeId]/orders/route.ts` | Add/remove orders from route |
| `src/lib/services/app-settings.ts` | Centralized settings reader with defaults |
| `src/app/(admin)/admin/OpsCenter/*.tsx` | Ops dashboard components (5-6 files) |
| `src/app/(admin)/admin/routes/page.tsx` | Route management page |
| `src/app/(admin)/admin/routes/components/*.tsx` | Route assignment UI (4 files) |
| `src/app/(driver)/driver/route/SimpleStopCard.tsx` | Simple mode stop card |
| `src/app/(driver)/driver/route/SimpleRouteView.tsx` | Simple mode route list |
| `src/app/(driver)/driver/route/DeliveryConfirmDialog.tsx` | Delivery confirmation dialog |
| `src/lib/hooks/useOpsDashboardSubscription.ts` | Supabase Realtime for ops |
| `src/types/ops.ts` | Ops dashboard types |

### Modified Files

| File | Change |
|------|--------|
| `src/app/(admin)/admin/page.tsx` | Conditionally show Ops Dashboard vs. existing dashboard |
| `src/app/api/admin/orders/route.ts` | Add `?unassigned=true&deliveryDate=` filters |
| `src/lib/stores/driver-store.ts` | Add `isSimpleMode` state |
| `src/lib/validations/settings.ts` | Add `cutoff_day`, `cutoff_hour` to delivery settings |
| `src/types/delivery.ts` | Keep constants as defaults, add settings-aware versions |
| `src/lib/email/send.ts` | Use `getAppSettings()` instead of direct `app_settings` query |
| `src/app/(admin)/admin/orders/[id]/page.tsx` | Add email status indicator |
| `src/app/(driver)/driver/route/page.tsx` | Conditional simple/full mode rendering |
| `src/app/(driver)/driver/route/[stopId]/page.tsx` | Simple mode variant |
| `src/components/ui/admin/AdminNav.tsx` | No change needed (Routes already in nav) |

### Database Changes

| Change | Type | Details |
|--------|------|---------|
| `drivers.simple_mode` | New column | `BOOLEAN DEFAULT true` -- family drivers default to simple |
| `app_settings` seed data | New rows | `cutoff_day`, `cutoff_hour`, `delivery_fee_cents`, etc. |
| Add `notification_logs` to Database type | Type fix | Currently untyped, used with manual casts |
| Add `app_settings` to Database type | Type fix | Currently untyped, used with manual casts |
| Index: `orders(delivery_window_start, status)` | New index | Ops dashboard queries filter by date + status |
| Index: `orders(assigned_driver_id) WHERE assigned_driver_id IS NULL` | New partial index | Fast unassigned order lookup |
| Index: `notification_logs(order_id, status)` | New index | Email status lookup per order |

### No New Tables Required

All five features integrate with existing tables:
- **Ops Dashboard:** reads `orders`, `drivers`, `routes`, `app_settings`
- **Route Assignment:** writes to `routes`, `route_stops`, updates `orders.assigned_driver_id`
- **Business Rules:** reads/writes `app_settings` (already exists)
- **Email Reliability:** reads/writes `notification_logs` (already exists)
- **Driver Simple Mode:** adds column to `drivers` (already exists)

---

## Suggested Build Order (Dependency-Based)

```
Phase 0: Critical Bug Fixes
  (no architecture changes, just logic fixes)
  |
  v
Phase 4: Configurable Business Rules
  (app_settings utility must exist BEFORE ops dashboard reads cutoff times)
  |
  v
Phase 1: Saturday Ops Dashboard
  (depends on settings utility for cutoff/delivery-start countdown)
  (depends on bulk-status API for confirm-all buttons)
  |
  v
Phase 2: Route & Driver Assignment
  (depends on ops dashboard for "unassigned orders" count)
  (builds on driver availability already shown in ops dashboard)
  |
  v
Phase 5: Email Reliability
  (enhancement to existing infrastructure, no blockers)
  |
  v
Phase 6: Driver Simplification
  (independent of other features, can be built in parallel with Phase 5)
  |
  v
Phase 7: Production Hardening
  (runs last: indexes, rate limits, N+1 fixes benefit from seeing final query patterns)
```

**Rationale for reordering Phase 4 before Phase 1:** The ops dashboard shows cutoff countdown timers. These timers read from `app_settings` via `getAppSettings()`. Building the settings utility first means the ops dashboard can use dynamic settings from day one, rather than hardcoding and retrofitting later. The settings admin form already exists -- just need to seed the new keys and build the reader utility.

---

## Scalability Considerations

| Concern | At 20-50 orders | At 200 orders | At 1000 orders |
|---------|-----------------|---------------|----------------|
| Ops dashboard load | Single query, instant | Still fine, add pagination | Need server-side aggregation view |
| Realtime subscriptions | 1 admin connected | Works fine | Supabase Realtime has per-project limits, may need throttling |
| Bulk status change | 20 orders in 1 query | 200 in 1 query, fine | Batch in chunks of 100 |
| Settings reads | ~100 reads/Saturday | ~1000 reads, fine | Consider Supabase edge cache or read replica |
| Email sending | 50-100 emails, sequential | Queue needed | Definitely need background job queue |

**At current scale (20-50 orders), none of these are concerns.** The architecture is designed for simplicity at this scale. If orders grow 10x, the main bottleneck will be email sending (needs a proper queue) and the ops dashboard (needs server-side aggregation instead of client-side counting).

---

## Sources

- Direct codebase analysis of existing files (HIGH confidence)
- Supabase Realtime pattern from existing `useTrackingSubscription.ts` (HIGH confidence)
- `app_settings` and `notification_logs` usage from `send.ts`, `webhooks/resend/route.ts`, admin emails page (HIGH confidence)
- Settings validation schema from `src/lib/validations/settings.ts` (HIGH confidence)
- Serverless caching constraints from Vercel architecture (HIGH confidence -- well-documented platform limitation)
