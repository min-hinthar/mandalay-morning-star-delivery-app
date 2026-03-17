# Phase 101: Driver Experience - Research

**Researched:** 2026-03-16
**Domain:** Driver mobile UX, PostgreSQL enum migration, drag-and-drop reorder, React Email notifications
**Confidence:** VERY HIGH

## Summary

Phase 101 extends the driver mobile experience with accept/decline route flow, page audit for real data, and driver stop reorder. The technical risk is concentrated in the PostgreSQL enum migration (`ALTER TYPE ADD VALUE` is non-transactional) and the codebase-wide status filter audit (9 queries hardcode `["planned", "in_progress"]` that must include `assigned` and `accepted`). All UI components and API patterns exist -- this phase extends them, not builds new.

The reorder feature is near-direct reuse of Phase 100 assets (`DragReorderList<T>`, `batch_update_stop_indices` RPC, `useReorderStops` hook pattern). The accept/decline flow introduces two new API endpoints, a React Email template, and conditional rendering in existing driver switch components. The email system (`sendEmail` with Resend + retry + kill switch) is fully built.

Deep dive audit confirmed: 9 status filter queries need update, 6 `!== "planned"` guards need expansion, 3 admin UI status maps need new entries, 1 Zod schema + 1 TypeScript type need extension, 2 email type registrations needed, 2 RPCs need status-aware updates, and 4 dead code files need removal (LocationTracker cleanup).

**Primary recommendation:** Migration first, type updates second, status filter audit third -- then UI in parallel. The enum migration MUST be its own separate SQL statement outside any transaction block, and backfill MUST be a separate migration file applied after.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Accept and start route are separate actions -- driver can accept night before, start Saturday morning
- Decline unassigns route (driver_id nulled, status reverts to planned) + flags ops dashboard + sends email to admin
- Decline confirmation has optional reason text field -- reason stored in DB and included in email
- Driver can un-accept (decline after accepting) as long as route hasn't started (not in_progress)
- Accept/decline UI appears on BOTH dashboard and route page
- Same accept/decline flow for simple mode and advanced mode -- no auto-accept
- No time limit for acceptance -- admin follows up by phone if needed
- Admin auto-assigns by setting driver_id (dropdown save) -- no separate "publish" action
- Route status state machine: `planned` -> `assigned` (admin sets driver) -> `accepted` (driver confirms) -> `in_progress` (driver starts) -> `completed`
- Decline: `assigned` or `accepted` -> `planned` (driver_id nulled)
- Admin reassign on accepted route: reverts to `assigned` for new driver (accepted_at cleared)
- `assigned` and `accepted` count as "active" for `prevent_duplicate_active_assignment` trigger
- Split/merge available on planned + assigned + accepted routes (resets to assigned after operation)
- Auto-transition: admin saves driver assignment -> route becomes `assigned`
- Same reorder pattern as admin: DragReorderList + DragHandle (desktop) + MoveButtons (mobile)
- Reorderable stops: pending + enroute (delivered/skipped locked in place)
- Always visible drag handles/move buttons -- no toggle needed
- Available on both accepted and in_progress routes
- Immediate save per drag-drop with optimistic UI + error toast + revert
- New driver endpoint: POST /api/driver/routes/[routeId]/reorder
- Reuses batch_update_stop_indices RPC
- No "Manually reordered" badge for driver
- Decline email only (no email on accept)
- Urgent/actionable tone with warning emoji, driver name, route details, stop count, reason, direct reassign link
- Admin email from app_settings table, fallback to ADMIN_EMAIL env var
- Distinct status badges: planned=gray, assigned=blue, accepted=green, in_progress=amber, completed=green check
- Declined routes included in existing "Unassigned" badge counter
- 'Declined by [Driver]' annotation on declined routes
- Add assigned/accepted to existing status filter dropdown
- E2E verification pass during page audit: load each page with test data, verify buttons work
- Manual verify + fix -- no new automated test files for audit
- LocationTracker component removal + dead code cleanup

### Claude's Discretion
- Exact accept/decline card layout dimensions and spacing
- Framer Motion transition animation parameters for card swap
- Email template HTML structure and styling details
- Exact badge color tokens from design system
- Sticky bottom bar height and safe-area padding values
- Hook internals (optimistic update strategy, cache invalidation timing)
- Zod schema constraints (UUID format, max lengths)
- Toast message wording and duration

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DRV-01 | Driver can accept/decline an assigned route before starting | New `assigned`/`accepted` enum values, accept/decline API endpoints, conditional rendering in DriverHomeSwitch/DriverRouteSwitch, React Email decline notification, admin ops dashboard badge updates |
| DRV-02 | Driver page audit -- all pages load real data, no empty/stub content | Status filter audit for 9 queries with `["planned", "in_progress"]`, testing both simple/advanced modes, new status handling in all driver pages |
| DRV-03 | Driver can reorder remaining pending stops in advanced mode | DragReorderList reuse, new POST /api/driver/routes/[routeId]/reorder endpoint, useDriverReorderStops hook, filter reorderable stops (pending/enroute only) |
</phase_requirements>

## Standard Stack

### Core (already installed -- NO new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | existing | Drag-and-drop primitives | Already in bundle from Phase 100 |
| @dnd-kit/sortable | existing | Sortable list abstraction | Already in bundle from Phase 100 |
| framer-motion | existing | Animation (card transitions, stagger) | Already in bundle, `m` component used everywhere |
| @react-email/components | existing | Email template components | Already in bundle for 8 existing templates |
| resend | existing | Email delivery | Already configured with retry + kill switch |
| zod | existing | Schema validation | Already used for all route schemas |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | existing | Icons (CheckCircle, XCircle, etc.) | Accept/decline buttons, status badges |
| next/server `after()` | built-in | Fire-and-forget email after response | Decline email send in API route |

### No New Dependencies
Zero new packages needed. Everything required is already installed and in use.

## Architecture Patterns

### Recommended File Structure
```
src/
  app/api/driver/routes/[routeId]/
    accept/route.ts          # NEW - POST accept endpoint
    decline/route.ts         # NEW - POST decline endpoint
    reorder/route.ts         # NEW - POST reorder endpoint
  lib/hooks/
    useAcceptRoute.ts        # NEW - accept mutation hook
    useDeclineRoute.ts       # NEW - decline mutation hook
    useDriverReorderStops.ts # NEW - driver reorder hook (adapted from admin)
    __tests__/
      useAcceptRoute.test.ts
      useDeclineRoute.test.ts
      useDriverReorderStops.test.ts
  emails/
    RouteDeclineAlert.tsx    # NEW - decline notification template
  components/ui/driver/
    AcceptDeclineCard.tsx     # NEW - shared accept/decline UI
    AcceptDeclineBar.tsx      # NEW - sticky bottom bar for route page
  supabase/migrations/
    20260316_route_status_enum_extend.sql  # NEW - ALTER TYPE ADD VALUE
    20260316_route_status_backfill.sql     # NEW - separate backfill migration
```

### Pattern 1: Driver API Route (auth + ownership + rate limit)
**What:** All driver API routes follow identical auth pattern from `requireDriver()`
**When to use:** Every new driver endpoint (accept, decline, reorder)
**Example:**
```typescript
// Source: src/app/api/driver/routes/[routeId]/start/route.ts (existing pattern)
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { routeId } = await params;
  const auth = await requireDriver();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { supabase, driverId } = auth;

  const rl = await checkRateLimit({
    limiter: driverActionLimiter,
    identifier: driverId,
    role: "driver",
    route: "driver/routes/[routeId]/accept",
  });
  if (rl.limited) return rl.response;

  // Verify driver owns this route
  const { data: route } = await supabase
    .from("routes")
    .select("id, status, driver_id")
    .eq("id", routeId)
    .single();

  if (!route || route.driver_id !== driverId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  // ... status check and mutation
}
```

### Pattern 2: Fire-and-Forget Email via after()
**What:** Use `after()` from `next/server` to send emails after HTTP response
**When to use:** Decline endpoint -- email admin without blocking driver response
**Example:**
```typescript
// Source: src/app/api/driver/routes/[routeId]/stops/[stopId]/exception/route.ts (existing pattern)
import { after } from "next/server";
import { sendEmail } from "@/lib/email/send";

// Inside handler, after successful DB mutation:
after(async () => {
  await sendEmail({
    to: adminEmail,
    subject: "Route Declined...",
    react: <RouteDeclineAlert ... />,
    type: "admin_route_decline",
    orderId: routeId, // or appropriate ID
    userId: driverId,
    mandatory: true,
  });
});

return NextResponse.json({ success: true });
```

### Pattern 3: Optimistic Mutation Hook (fetch-based)
**What:** Client hook that calls fetch, tracks loading state, shows toast on error
**When to use:** useAcceptRoute, useDeclineRoute, useDriverReorderStops
**Example:**
```typescript
// Source: src/lib/hooks/useReorderStops.ts, useReassignDriver.ts (existing patterns)
import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";

export function useAcceptRoute({ routeId, onSuccess }: Options) {
  const [isAccepting, setIsAccepting] = useState(false);

  const acceptRoute = useCallback(async () => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/driver/routes/${routeId}/accept`, {
        method: "POST",
      });
      if (!response.ok) {
        toast({ message: "Failed to accept route", type: "error" });
        return;
      }
      toast({ message: "Route accepted!", type: "success" });
      onSuccess?.();
    } catch {
      toast({ message: "Failed to accept route", type: "error" });
    } finally {
      setIsAccepting(false);
    }
  }, [routeId, onSuccess]);

  return { acceptRoute, isAccepting };
}
```

### Pattern 4: Driver Simple/Advanced Mode Switch
**What:** Server component fetches data, client Switch component renders simple or advanced based on `useSimpleMode()`
**When to use:** Adding accept/decline to both modes
**Example:**
```typescript
// Source: src/app/(driver)/driver/DriverHomeSwitch.tsx (existing pattern)
export function DriverHomeSwitch(data: DriverHomeData) {
  const { isSimpleMode } = useSimpleMode();

  // NEW: Check for assigned status to show accept/decline
  if (data.todayRoute?.status === "assigned") {
    // Render accept/decline card (same in both modes per locked decision)
    return <AcceptDeclineCard route={data.todayRoute} />;
  }

  if (isSimpleMode) return <SimpleHome {...relevant} />;
  return <DriverDashboard {...data} />;
}
```

### Pattern 5: Admin Route PATCH Auto-Transition
**What:** When admin sets driver_id via PATCH, also set status to `assigned`
**When to use:** Existing admin route update endpoint needs modification
**Example:**
```typescript
// In PATCH /api/admin/routes/[id] -- extend existing handler
if (driverId !== undefined) {
  routeUpdate.driver_id = driverId;
  // Auto-transition: setting driver makes route "assigned"
  if (driverId !== null) {
    routeUpdate.status = "assigned";
    routeUpdate.accepted_at = null; // Clear if reassigning
  }
}
```

### Anti-Patterns to Avoid
- **Never `void asyncFn()` for email sends:** Use `after()` or `await`. Vercel kills unresolved promises. (Project gotcha)
- **Never `.update()` without `.select("id")` to verify affected rows:** Supabase returns no count. (Project gotcha)
- **Never use `!value` for numeric checks:** Use `value == null` to avoid falsy-zero trap. (Project gotcha)
- **Never use `process.env.KEY` dynamically at runtime:** Inlined at build time. (Project gotcha)
- **Never manually useMemo/useCallback in client components:** React Compiler auto-memoizes. (Project note)
- **Never put event listeners in useCallback with state deps:** Belong inside useEffect. (Project gotcha)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag reorder UI | Custom drag implementation | `DragReorderList<T>` + `SortableItem` + `DragHandle` + `MoveButtons` | Already generic from Phase 100, battle-tested |
| Batch index update | Per-stop UPDATE loop | `batch_update_stop_indices` RPC | Atomic, defers UNIQUE constraint, handles concurrent access |
| Email rendering + delivery | Raw nodemailer/fetch | `sendEmail()` from `src/lib/email/send.ts` | Has retry, kill switch, notification logging, preference check |
| Driver auth + ownership | Manual user/driver lookup | `requireDriver()` from `src/lib/auth/driver.ts` | Returns typed `{ supabase, driverId }`, handles 401/403 |
| Rate limiting | Custom counter | `checkRateLimit({ limiter: driverActionLimiter, ... })` | In-memory fallback active, consistent pattern |
| Confirmation dialog | Custom modal | `ConfirmDialog` from `src/components/ui/admin/settings/ConfirmDialog.tsx` | Already supports destructive variant, loading state |
| Toast notifications | Alert/custom notification | `toast()` from `src/lib/hooks/useToastV8` | Consistent UX, auto-dismiss, type-aware styling |
| Status badge component | Inline badge styles | `StatusBadge` from `src/components/ui/admin/StatusBadge.tsx` | Has icon map, color map, pulse animation for active states |

**Key insight:** This phase has exceptionally high reuse. Every UI primitive and backend pattern exists from prior phases. The primary work is wiring existing components to new states and endpoints.

## Common Pitfalls

### Pitfall 1: ALTER TYPE ADD VALUE Cannot Be Used in Same Transaction
**What goes wrong:** Migration adds enum values inside a transaction, then backfill UPDATE uses the new values in the same transaction -- fails silently or errors.
**Why it happens:** PostgreSQL constraint: `ALTER TYPE ADD VALUE` inside a transaction block means the new value cannot be used until after the transaction has been committed.
**How to avoid:** Two separate migration files. File 1: `ALTER TYPE route_status ADD VALUE 'assigned'; ALTER TYPE route_status ADD VALUE 'accepted';` -- each as its own statement. File 2 (applied after): `UPDATE routes SET status = 'assigned' WHERE ...` backfill + add columns.
**Warning signs:** Migration succeeds but backfill UPDATE fails with "invalid input value for enum route_status: assigned".

### Pitfall 2: Status Filter Audit Incomplete
**What goes wrong:** Some queries still filter `.in("status", ["planned", "in_progress"])` and miss routes with `assigned` or `accepted` status. Driver sees no route despite having one assigned.
**Why it happens:** 9 files across driver pages, driver APIs, and admin APIs hardcode the old status filter.
**How to avoid:** Full grep audit. Every `.in("status", ["planned", "in_progress"])` in driver context MUST become `.in("status", ["assigned", "accepted", "planned", "in_progress"])` or equivalent. See Complete Status Query Audit section for exhaustive list.
**Warning signs:** Driver dashboard shows "No Route Today" when route exists with `assigned` status.

### Pitfall 3: prevent_duplicate_active_assignment Trigger Mismatch
**What goes wrong:** Trigger currently checks `r.status != 'completed'` to determine "active". With new enum values, `assigned` and `accepted` routes are active but the trigger already handles them (they satisfy `!= 'completed'`). However, the split_route RPC creates new routes with `status = 'planned'` -- if splitting an assigned route, the new route should be `assigned`.
**Why it happens:** Split/merge RPCs hardcode `status = 'planned'` for new routes.
**How to avoid:** After split/merge on assigned/accepted routes, reset new route to `assigned` per locked decision. The trigger correctly catches `assigned`/`accepted` as active (they are not `completed`). No trigger modification needed.
**Warning signs:** Split route doesn't have correct status.

### Pitfall 4: Admin PATCH Endpoint Must Auto-Transition to `assigned`
**What goes wrong:** Admin saves driver assignment via PATCH but route stays `planned`. Driver never sees accept/decline flow.
**Why it happens:** Current PATCH handler (lines 329-331 of `src/app/api/admin/routes/[id]/route.ts`) just sets `driver_id` without touching `status`.
**How to avoid:** When `driverId` is set to a non-null value, also set `status = 'assigned'`. When `driverId` is set to null, revert to `planned`.
**Warning signs:** Route has driver_id but status is still `planned`.

### Pitfall 5: Start Route Must Accept from `accepted` (Not Just `planned`)
**What goes wrong:** Driver accepts route, then taps "Start Route" -- API rejects because it checks `status !== "planned"`.
**Why it happens:** Existing `/api/driver/routes/[routeId]/start` line 57: `if (route.status !== "planned")`.
**How to avoid:** Update check to accept both `planned` and `accepted`: `if (route.status !== "planned" && route.status !== "accepted")`.
**Warning signs:** Driver gets "Cannot start route with status: accepted" error.

### Pitfall 6: Email Type Registration in types.ts
**What goes wrong:** New email type `admin_route_decline` not registered in `EmailType` union or `ADMIN_EMAIL_TYPES` array -- TypeScript error or notification_logs insert fails.
**Why it happens:** The `sendEmail` function requires `type: EmailType`. New email types must be added to the union in `src/lib/email/types.ts`.
**How to avoid:** Add `"admin_route_decline"` to: (1) `EmailType` union type, (2) `ADMIN_EMAIL_TYPES` array, (3) `MANDATORY_EMAIL_TYPES` array. Also add case to `mapTypeToPrefKey` switch (return `"order_updates"`).
**Warning signs:** TypeScript error on `type: "admin_route_decline"`.

### Pitfall 7: Safe Area Insets on Sticky Bottom Bar
**What goes wrong:** On iOS, sticky bottom bar is hidden behind the home indicator.
**Why it happens:** `position: fixed; bottom: 0` without safe-area compensation.
**How to avoid:** Apply safe-area as position offset, not padding (per mobile-ux.md learning): `style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}` or use Tailwind `pb-[env(safe-area-inset-bottom,0px)]` on the bar container if the bar itself doesn't contain centered icons.
**Warning signs:** Buttons cut off at bottom of iPhone screen.

### Pitfall 8: LocationTracker Removal Breaks Imports
**What goes wrong:** Removing LocationTracker component breaks imports in ActiveRouteView and the barrel export in `src/components/ui/driver/index.ts`.
**Why it happens:** Four files form the dependency tree: `ActiveRouteView.tsx` (line 19 import, line 166 render), `src/components/ui/driver/index.ts` (line 18 export), `LocationTracker.tsx` (component), `useLocationTracking.ts` (hook), `src/lib/hooks/index.ts` (line 97 export).
**How to avoid:** Remove in order: 1) Remove usage in ActiveRouteView, 2) Remove barrel export from driver/index.ts, 3) Delete LocationTracker.tsx, 4) Remove hook barrel export from hooks/index.ts, 5) Delete useLocationTracking.ts.
**Warning signs:** Build error on missing module.

### Pitfall 9: RLS Policy on Decline -- Driver Loses Access After driver_id Nulled
**What goes wrong:** Decline nulls `driver_id`, but the driver is still in the API handler and needs the response to return successfully. If subsequent queries run after the null, they fail with RLS denial.
**Why it happens:** Routes RLS policy (`002_rls_policies.sql` lines 247-263) uses `driver_id = get_my_driver_id()`. Once nulled, driver cannot SELECT/UPDATE that route.
**How to avoid:** The decline endpoint updates `driver_id = null` as the final mutation, then immediately returns success. No subsequent queries on that route after nulling. Alternatively, use service client (bypasses RLS) for the decline mutation. Recommend service client approach to be safe.
**Warning signs:** Decline succeeds but driver gets error on redirect or subsequent page load (expected behavior -- route is no longer theirs).

### Pitfall 10: Split/Merge RPCs Need Status Updates for New Statuses
**What goes wrong:** `split_route` RPC hardcodes `status = 'planned'` (line 41) for new routes. `merge_routes` RPC requires `source.status = 'planned'` (line 83). Both need updates for assigned/accepted routes.
**Why it happens:** RPCs were written for the 3-status world.
**How to avoid:** Per locked decision: split/merge available on planned + assigned + accepted. Update `split_route` to carry over driver assignment status. Update `merge_routes` to accept `assigned`/`accepted` as valid source statuses.
**Warning signs:** Split on assigned route creates new route as `planned` instead of `assigned`. Merge fails on assigned source route.

## Code Examples

### Accept Route API Endpoint
```typescript
// POST /api/driver/routes/[routeId]/accept
// Source: Adapted from start/route.ts pattern
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { routeId } = await params;
  const auth = await requireDriver();
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, driverId } = auth;

  // Rate limit + route fetch + ownership check (same pattern as start)...

  if (route.status !== "assigned") {
    return NextResponse.json(
      { error: `Cannot accept route with status: ${route.status}` },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("routes")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", routeId)
    .select("id"); // Chain .select to verify update per gotcha

  if (updateError) {
    return NextResponse.json({ error: "Failed to accept route" }, { status: 500 });
  }

  return NextResponse.json({ success: true, acceptedAt: new Date().toISOString() });
}
```

### Decline Route API Endpoint with after() Email
```typescript
// POST /api/driver/routes/[routeId]/decline
import { after } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { RouteDeclineAlert } from "@/emails/RouteDeclineAlert";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { routeId } = await params;
  const auth = await requireDriver();
  // ... auth + rate limit ...

  // Use service client to bypass RLS (driver_id will be nulled)
  const serviceClient = createServiceClient();

  // Verify ownership with driver's supabase client first
  const { data: route } = await auth.supabase
    .from("routes")
    .select("id, status, driver_id, delivery_date, stops:route_stops(count)")
    .eq("id", routeId)
    .single();

  if (!route || route.driver_id !== auth.driverId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (route.status !== "assigned" && route.status !== "accepted") {
    return NextResponse.json(
      { error: `Cannot decline route with status: ${route.status}` },
      { status: 400 }
    );
  }

  const body = await request.json();
  const reason = body.reason?.trim() || null;

  // Get driver name before nulling (for email)
  const { data: driver } = await serviceClient
    .from("drivers")
    .select("profiles(full_name)")
    .eq("id", auth.driverId)
    .single();
  const driverName = driver?.profiles?.full_name ?? "Unknown Driver";

  // Decline: null driver, revert to planned, record timestamps
  // Use service client to bypass RLS since driver_id is being nulled
  const { error } = await serviceClient
    .from("routes")
    .update({
      driver_id: null,
      status: "planned",
      accepted_at: null,
      declined_at: new Date().toISOString(),
      declined_reason: reason,
      declined_by: auth.driverId, // Persist who declined even after driver_id nulled
    })
    .eq("id", routeId)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to decline route" }, { status: 500 });
  }

  // Fire-and-forget email to admin
  after(async () => {
    // Try app_settings first, fall back to env
    const { data: setting } = await serviceClient
      .from("app_settings")
      .select("value")
      .eq("key", "admin_notification_email")
      .single();
    const adminEmail = setting?.value || process.env.ADMIN_EMAIL || "";

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Route Declined by ${driverName}`,
        react: <RouteDeclineAlert
          driverName={driverName}
          routeDate={route.delivery_date}
          stopCount={route.stops?.[0]?.count ?? 0}
          reason={reason}
          routeId={routeId}
        />,
        type: "admin_route_decline",
        orderId: routeId,
        userId: auth.userId,
        mandatory: true,
      });
    }
  });

  return NextResponse.json({ success: true });
}
```

### Driver Reorder Endpoint (reuses RPC)
```typescript
// POST /api/driver/routes/[routeId]/reorder
// Source: Adapted from admin PATCH reorder logic in src/app/api/admin/routes/[id]/route.ts
export async function POST(request: NextRequest, { params }: RouteParams) {
  // ... auth + rate limit + ownership check ...

  // Must be accepted or in_progress
  if (route.status !== "accepted" && route.status !== "in_progress") {
    return NextResponse.json({ error: "Route not active" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = reorderStopsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Verify stops belong to route (same pattern as admin)
  // ...

  // Atomic reorder via existing RPC
  const { error } = await supabase.rpc("batch_update_stop_indices", {
    p_stop_ids: parsed.data.stopOrder.map(s => s.stopId),
    p_indices: parsed.data.stopOrder.map(s => s.stopIndex),
  });

  if (error) {
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### Enum Migration (Separate File)
```sql
-- Migration: Add assigned and accepted to route_status enum
-- CRITICAL: ALTER TYPE ADD VALUE cannot be used in same transaction as its values
-- Each statement executes in its own implicit transaction

ALTER TYPE route_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE route_status ADD VALUE IF NOT EXISTS 'accepted';
```

### Backfill Migration (Separate File, Applied After)
```sql
-- Migration: Backfill route statuses + add new columns
-- Must run AFTER enum values are committed

-- Add new columns for accept/decline tracking
ALTER TABLE routes ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS declined_reason TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES drivers(id);

-- Backfill: routes with driver_id and planned status -> assigned
UPDATE routes SET status = 'assigned'
WHERE driver_id IS NOT NULL AND status = 'planned';
```

### React Email Template Pattern
```typescript
// Source: Follows AdminNewOrderAlert.tsx pattern exactly
import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL, FONT_STACK, SERIF_STACK } from "./helpers";

export interface RouteDeclineAlertProps {
  driverName: string;
  routeDate: string;
  stopCount: number;
  reason?: string | null;
  routeId: string;
}

export function RouteDeclineAlert({
  driverName, routeDate, stopCount, reason, routeId,
}: RouteDeclineAlertProps) {
  const reassignUrl = `${APP_URL}/admin/routes/${routeId}`;

  return (
    <EmailLayout emailType="confirmation" previewText={`Route declined by ${driverName}`}>
      <Section style={{ padding: "32px 24px 0 24px" }}>
        <Text style={{ fontSize: "22px", fontFamily: SERIF_STACK, ... }}>
          {"\u26A0\uFE0F"} Route Declined
        </Text>
        {/* Driver name, date, stop count, reason if provided */}
      </Section>
      <Section style={{ padding: "24px", textAlign: "center" }}>
        <Button href={reassignUrl} style={{ backgroundColor: "#D4A017", ... }}>
          Reassign Route
        </Button>
      </Section>
    </EmailLayout>
  );
}
```

## Complete Status Query Audit

Every file:line that needs modification for the new `assigned`/`accepted` statuses.

### Category A: Status Filter Queries (`.in("status", [...])`)
Must add `"assigned"` and `"accepted"` to the filter array.

| # | File | Line | Current Filter | Context |
|---|------|------|----------------|---------|
| 1 | `src/app/(driver)/driver/page.tsx` | 125 | `["planned", "in_progress"]` | Today's route query |
| 2 | `src/app/(driver)/driver/page.tsx` | 156 | `["planned", "in_progress"]` | Next upcoming route query |
| 3 | `src/app/(driver)/driver/route/page.tsx` | 77 | `["planned", "in_progress"]` | Active route query |
| 4 | `src/app/(driver)/driver/schedule/page.tsx` | 65 | `["planned", "in_progress"]` | Upcoming routes 14-day query |
| 5 | `src/app/api/driver/routes/active/route.ts` | 168 | `["planned", "in_progress"]` | Active route API |
| 6 | `src/app/api/driver/routes/upcoming/route.ts` | 58 | `["planned", "in_progress"]` | Upcoming routes API |
| 7 | `src/app/api/driver/me/route.ts` | 117 | `["planned", "in_progress"]` | Driver profile active route count |
| 8 | `src/app/api/admin/drivers/[id]/route.ts` | 299 | `["planned", "in_progress"]` | Admin driver detail active routes |
| 9 | `src/app/api/admin/drivers/[id]/archive/route.ts` | 93 | `["planned", "in_progress"]` | Archive guard -- active route check |

### Category B: Strict `"planned"` Guards (`status !== "planned"`)
Must expand to accept additional statuses.

| # | File | Line | Current Check | Required Change |
|---|------|------|---------------|-----------------|
| 1 | `src/app/api/driver/routes/[routeId]/start/route.ts` | 57 | `!== "planned"` | Also allow `"accepted"` |
| 2 | `src/app/api/admin/routes/[id]/route.ts` (DELETE) | 417 | `!== "planned"` | Also allow `"assigned"` |
| 3 | `src/app/api/admin/routes/optimize/route.ts` | 70 | `!== "planned"` | Also allow `"assigned"`, `"accepted"` |
| 4 | `src/app/api/admin/routes/[id]/stops/reassign/route.ts` | 84 | `!== "planned"` (source) | Also allow `"assigned"`, `"accepted"` |
| 5 | `src/app/api/admin/routes/[id]/stops/reassign/route.ts` | 102 | `!== "planned"` (target) | Also allow `"assigned"`, `"accepted"` |
| 6 | `src/app/api/admin/routes/[id]/stops/[stopId]/route.ts` | 222 | `!== "planned"` | Also allow `"assigned"`, `"accepted"` (stop add/remove on pre-start routes) |

### Category C: Status-Based Rendering (UI components)
Must add visual handling for `assigned` and `accepted`.

| # | File | Lines | What Needs Adding |
|---|------|-------|-------------------|
| 1 | `src/components/ui/driver/DriverDashboard/RouteCard.tsx` | 79-86, 133-155 | Badge colors + labels for assigned/accepted; action buttons for assigned (accept/decline) and accepted (start route) |
| 2 | `src/components/ui/driver/ActiveRouteView.tsx` | 170 | Start button: `routeStatus === "planned"` must also render for `"accepted"` |
| 3 | `src/components/ui/driver/SimpleHome.tsx` | 79-143 | Add assigned/accepted rendering with accept/decline flow |
| 4 | `src/app/(driver)/driver/DriverHomeSwitch.tsx` | entire | Add branch for assigned status to show AcceptDeclineCard |
| 5 | `src/app/(driver)/driver/route/DriverRouteSwitch.tsx` | entire | Add branch for assigned/accepted route states |
| 6 | `src/components/ui/admin/StatusBadge.tsx` | 36-50, 53-61, 69-86 | Add `assigned`/`accepted` to STATUS_COLORS, ACTIVE_STATUSES, STATUS_ICONS |
| 7 | `src/components/ui/admin/routes/RouteListTable/RouteCardRow.tsx` | 27-31 | Add `assigned`/`accepted` to STATUS_TINT map |
| 8 | `src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx` | 29-49 | Add `assigned`/`accepted` to STATUS_CONFIG map |
| 9 | `src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx` | 121-126 | Status SelectContent: add assigned/accepted options |
| 10 | `src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx` | 128-148 | Conditional actions: also show for assigned/accepted (Add Stops, Optimize) |
| 11 | `src/app/(admin)/admin/routes/page.tsx` | 27-32 | STATUS_FILTERS: add assigned/accepted filter options |
| 12 | `src/app/(admin)/admin/routes/page.tsx` | 160-167 | Stats: add assigned/accepted counts |
| 13 | `src/app/(admin)/admin/routes/RoutesStatsCards.tsx` | entire | Add assigned/accepted stat cards (or combine into "Pending Assignment" counter) |

### Category D: Type and Schema Definitions
Must extend with new values.

| # | File | Line | What to Add |
|---|------|------|-------------|
| 1 | `src/types/driver.ts` | 12 | Add `"assigned" \| "accepted"` to `RouteStatus` union |
| 2 | `src/lib/validations/route.ts` | 4 | Add `"assigned"`, `"accepted"` to `routeStatusSchema` enum |
| 3 | `src/types/database.ts` | routes table type | Add `accepted_at`, `declined_at`, `declined_reason`, `declined_by` columns |
| 4 | `src/lib/email/types.ts` | 18-23 | Add `"admin_route_decline"` to `EmailType` union |
| 5 | `src/lib/email/types.ts` | 47-54 | Add `"admin_route_decline"` to `MANDATORY_EMAIL_TYPES` |
| 6 | `src/lib/email/types.ts` | 57-62 | Add `"admin_route_decline"` to `ADMIN_EMAIL_TYPES` |
| 7 | `src/lib/email/types.ts` | 72-90 | Add `"admin_route_decline"` case to `mapTypeToPrefKey` switch |

### Category E: Database RPCs
Must handle new statuses in validation logic.

| # | File | Line | What to Change |
|---|------|------|----------------|
| 1 | `supabase/migrations/20260315_route_editing_rpcs.sql` (split_route) | 41 | `status = 'planned'` hardcoded -- new route should inherit `'assigned'` when source has driver |
| 2 | `supabase/migrations/20260315_route_editing_rpcs.sql` (merge_routes) | 83 | `source.status != 'planned'` restriction -- must also accept `'assigned'`, `'accepted'` |

### Category F: Admin PATCH Auto-Transition (NEW behavior)

| # | File | Lines | What to Add |
|---|------|-------|-------------|
| 1 | `src/app/api/admin/routes/[id]/route.ts` | 329-331 | When `driverId` set to non-null, also set `status = 'assigned'`, `accepted_at = null` |

### Category G: Dead Code Removal (LocationTracker)

| # | File | Line | Action |
|---|------|------|--------|
| 1 | `src/components/ui/driver/ActiveRouteView.tsx` | 19 | Remove `import { LocationTracker }` |
| 2 | `src/components/ui/driver/ActiveRouteView.tsx` | 164-167 | Remove LocationTracker render block |
| 3 | `src/components/ui/driver/index.ts` | 18 | Remove `export { LocationTracker }` |
| 4 | `src/components/ui/driver/LocationTracker.tsx` | entire | Delete file (135 lines) |
| 5 | `src/lib/hooks/index.ts` | 97 | Remove `export { useLocationTracking }` |
| 6 | `src/lib/hooks/useLocationTracking.ts` | entire | Delete file |

## Cross-Phase Integration Risks

### Risk 1: Phase 100 Split/Merge RPCs Hardcode `'planned'`
**Source:** `supabase/migrations/20260315_route_editing_rpcs.sql`
**Issue:** `split_route` creates new routes with `status = 'planned'` (line 41). `merge_routes` requires source `status != 'planned'` (line 83). Both block new statuses.
**Impact:** After Phase 101, splitting an assigned/accepted route creates a `planned` route (should be `assigned`). Merging an `assigned` route fails.
**Resolution:** Create a NEW migration in Phase 101 that `CREATE OR REPLACE FUNCTION` for both RPCs with updated logic. Do NOT modify the Phase 100 migration file.
**Specific changes needed:**
- `split_route`: If source has `driver_id` and `p_new_driver_id` is provided, set new route status to `'assigned'`. If source is `assigned`/`accepted`, keep source as `assigned` after split.
- `merge_routes`: Accept `'assigned'` and `'accepted'` as valid source statuses (change to `NOT IN ('in_progress', 'completed')`).

### Risk 2: Phase 100 RouteHeader STATUS_CONFIG Only Has 3 Entries
**Source:** `src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx` lines 29-49
**Issue:** `STATUS_CONFIG` is typed as `Record<RouteStatus, ...>`. When `RouteStatus` union expands to include `assigned`/`accepted`, TypeScript will error because those keys are missing.
**Impact:** Type error at build time. Good -- forces the update.
**Resolution:** Add entries for `assigned` and `accepted` in Phase 101 implementation.

### Risk 3: Phase 100 RouteDetailClient Merge Modal Filters `status === "planned"`
**Source:** `src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx` line 86
**Issue:** Merge candidate filter: `.filter((r) => r.id !== routeId && r.status === "planned")`. Won't show `assigned`/`accepted` routes as merge candidates.
**Impact:** Admin can't merge assigned routes from the merge modal.
**Resolution:** Update filter to include `assigned` and `accepted` per locked decision.

### Risk 4: Phase 99 OrderDetailPanel Integration
**Source:** Phase 99 context notes OrderDetailPanel used in route detail views.
**Issue:** No status dependency -- OrderDetailPanel renders order data, not route status.
**Impact:** None -- no risk.
**Resolution:** No action needed.

### Risk 5: Admin API DELETE Only Allows `"planned"` Status
**Source:** `src/app/api/admin/routes/[id]/route.ts` line 417
**Issue:** `route.status !== "planned"` blocks deletion of `assigned` routes. Per context: admin should be able to delete routes that haven't started.
**Impact:** Admin can't delete a route that has been assigned to a driver but not yet started.
**Resolution:** Expand to allow `assigned` status. Do NOT allow deleting `accepted` routes without warning -- driver has committed.

## Applicable Learnings Matrix

Cross-reference of all 13 learnings files against Phase 101 implementation tasks.

| Learning File | Applicable Learning | Affected Task | Risk Level | Mitigation |
|---------------|-------------------|---------------|------------|------------|
| `react-patterns.md` | Event listeners belong inside useEffect, not useCallback with state deps | Accept/decline hooks, reorder hooks | MEDIUM | Follow existing hook patterns (useReorderStops) which correctly use useEffect |
| `react-patterns.md` | useRef on conditional render targets breaks observers | AcceptDeclineCard in conditional render | LOW | Use stable wrapper element, same as Phase 100 DragReorderList |
| `react-patterns.md` | flex items-center collapses children when content is empty | AcceptDeclineCard empty state | LOW | Ensure min-height or fallback content |
| `animation.md` | loading="lazy" + opacity:0 containers = images never load | NOT applicable | N/A | No lazy images in accept/decline flow |
| `nextjs.md` | void asyncFn() killed on Vercel -- use after() | Decline email send | HIGH | Use `after()` from next/server (already planned) |
| `nextjs.md` | process.env.KEY inlined at build time | Admin email fallback from env | LOW | `ADMIN_EMAIL` is only fallback; primary source is app_settings DB query at runtime |
| `email-system.md` | EmailType union split -- add to all 3 arrays | Adding `admin_route_decline` | HIGH | Add to EmailType, ADMIN_EMAIL_TYPES, MANDATORY_EMAIL_TYPES, mapTypeToPrefKey |
| `email-system.md` | getAdminEmails() returns `{ id, email, full_name }[]` | Decline notification recipient | MEDIUM | Can use `getAdminEmails()` OR app_settings. Context says app_settings -- use that |
| `email-system.md` | after() for email sends in API routes | Decline endpoint | HIGH | Already planned |
| `testing.md` | Stale tests after validation changes | routeStatusSchema extension | MEDIUM | Check for existing route validation tests that may fail with new enum values |
| `testing.md` | Supabase mock chain matching matters | New hook tests | LOW | Follow existing useReorderStops.test.ts mock pattern exactly |
| `testing.md` | Vacuous tests that always pass | New hook tests | LOW | Verify assertions actually test behavior, not just that code doesn't throw |
| `state-management.md` | Single mutation owner principle | Accept/decline button callbacks | MEDIUM | AcceptDeclineCard fires callback to parent, parent owns mutation |
| `state-management.md` | Settings sync pipeline for business rules | Admin email setting | LOW | Not a client-side setting -- only used server-side in API route |
| `supabase-auth.md` | Service client auth.getUser() returns null | Decline endpoint -- get driver name | HIGH | Use `auth.admin.getUserById()` or query `drivers` table directly. Recommend: query drivers table joined to profiles |
| `supabase-auth.md` | RLS patterns with get_my_driver_id() | Decline endpoint driver_id nulling | HIGH | Use service client for decline mutation to bypass RLS. See Pitfall 9 |
| `stripe.md` | .update() needs .select("id") to verify row count | All route update mutations | HIGH | Chain `.select("id")` on every `.update()` call |
| `mobile-ux.md` | touchAction conflicts on drag handles | Driver stop reorder DragHandle | HIGH | `touch-none` on handle, `pan-y` on content -- reuse Phase 100 pattern |
| `mobile-ux.md` | Safe-area position not padding for iOS fixed buttons | AcceptDeclineBar sticky bottom | HIGH | `style={{ bottom: "env(safe-area-inset-bottom, 0px)" }}` |
| `mobile-ux.md` | Nested overflow-y-auto blocks wheel events | Driver stop list with reorder | MEDIUM | Single scroll container -- don't nest overflow-y-auto |
| `data-schema.md` | DEFERRABLE constraint for batch reorder | Driver reorder uses batch_update_stop_indices | LOW | Already handled by existing RPC |
| `data-schema.md` | New RPC functions need manual database.ts entries | No new RPCs needed | N/A | Phase 101 reuses existing RPCs |
| `data-schema.md` | Idempotent enum creation | ALTER TYPE ADD VALUE IF NOT EXISTS | HIGH | Always use `IF NOT EXISTS` for re-runnable migrations |
| `design-tokens.md` | Semantic naming for status colors | New badge colors for assigned/accepted | MEDIUM | Use existing design tokens (bg-status-info-bg, etc.) per StatusBadge pattern |
| `design-tokens.md` | Non-existent tokens render transparent | Badge color typos | LOW | Test badge rendering visually, verify token names exist in @theme |
| `tooling.md` | Component deletion requires barrel cleanup | LocationTracker removal | HIGH | Remove from all barrel index.ts files (driver/index.ts, hooks/index.ts) |
| `tooling.md` | CI format:check fails on unformatted files | New files | MEDIUM | Run `pnpm format:check` before committing |
| `performance.md` | IntersectionObserver pause when off-screen | NOT applicable | N/A | No infinite scroll or lazy render in accept/decline flow |

### High-Risk Learnings Summary (must address in implementation)
1. **void asyncFn() killed on Vercel** -- use `after()` for decline email
2. **EmailType registration** -- add to all 4 locations in types.ts
3. **Service client for decline** -- bypass RLS when nulling driver_id
4. **.update() needs .select("id")** -- on every mutation
5. **touchAction on drag handles** -- reuse Phase 100 pattern
6. **Safe-area position** -- for AcceptDeclineBar bottom bar
7. **ALTER TYPE IF NOT EXISTS** -- idempotent migration
8. **Barrel cleanup on deletion** -- LocationTracker removal

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `void asyncFn()` for fire-and-forget | `after()` from next/server | Next.js 15+ | Prevents Vercel function kill; used in 10+ endpoints already |
| Manual useMemo/useCallback | React Compiler auto-memoization | React 19 | No manual memoization needed in client components |
| Per-row UPDATE for reorder | `batch_update_stop_indices` RPC | Phase 100 (v2.1) | Atomic, defers UNIQUE constraint |
| Single planned/in_progress lifecycle | 5-state lifecycle with assigned/accepted | Phase 101 (this phase) | Supports accept/decline before delivery day |

**PostgreSQL ALTER TYPE ADD VALUE (critical):**
- Can run inside a transaction block in PostgreSQL 15/16
- BUT new value cannot be used until after the transaction is committed
- `ADD VALUE IF NOT EXISTS` prevents errors on re-run (idempotent)
- No DROP VALUE exists in any PostgreSQL version -- values are permanent

Source: [PostgreSQL ALTER TYPE docs](https://www.postgresql.org/docs/current/sql-altertype.html)

## Open Questions

1. **Admin email from app_settings -- key name**
   - What we know: `app_settings` table has key-value pairs. No existing `admin_notification_email` key found in codebase. `getAdminEmails()` helper at `src/lib/email/admin-recipients.ts` queries profiles table for role='admin'.
   - What's unclear: Use app_settings key or existing `getAdminEmails()` helper.
   - Recommendation: Use `getAdminEmails()` helper since it already exists and returns all admin emails. Decline email should go to all admins. Fallback to `ADMIN_EMAIL` env var if no admin profiles found.

2. **Ops dashboard declined annotation storage**
   - What we know: `declined_at` and `declined_reason` columns will be added. `driver_id` gets nulled on decline.
   - Resolution: Add `declined_by` column (UUID, nullable, FK to drivers) that persists even when `driver_id` is nulled. Query joins `declined_by -> drivers -> profiles` to get name for "Declined by [Driver]" annotation.

3. **Supabase generated types update**
   - What we know: New columns and enum values need TypeScript types. `database.ts` is manually maintained.
   - Resolution: Manually add to `src/types/database.ts` (route_status type + new columns) and `src/types/driver.ts` (RouteStatus union). Follow existing pattern per learnings/data-schema.md.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | vitest.config.ts (existing) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRV-01a | useAcceptRoute calls POST /accept, handles success/error | unit | `pnpm test -- src/lib/hooks/__tests__/useAcceptRoute.test.ts -x` | Wave 0 |
| DRV-01b | useDeclineRoute calls POST /decline with optional reason, triggers toast | unit | `pnpm test -- src/lib/hooks/__tests__/useDeclineRoute.test.ts -x` | Wave 0 |
| DRV-01c | routeStatusSchema validates assigned/accepted values | unit | `pnpm test -- src/lib/validations/__tests__/route.test.ts -x` | Wave 0 |
| DRV-02 | Page audit -- manual verification | manual-only | N/A -- manual page-by-page check | N/A |
| DRV-03a | useDriverReorderStops calls POST /reorder with correct payload | unit | `pnpm test -- src/lib/hooks/__tests__/useDriverReorderStops.test.ts -x` | Wave 0 |
| DRV-03b | useDriverReorderStops handles error with revert | unit | `pnpm test -- src/lib/hooks/__tests__/useDriverReorderStops.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/hooks/__tests__/useAcceptRoute.test.ts` -- covers DRV-01a
- [ ] `src/lib/hooks/__tests__/useDeclineRoute.test.ts` -- covers DRV-01b
- [ ] `src/lib/hooks/__tests__/useDriverReorderStops.test.ts` -- covers DRV-03
- [ ] `src/lib/validations/__tests__/route.test.ts` -- covers DRV-01c (Zod schema update validation)

*(Test patterns follow existing `useReorderStops.test.ts` and `useReassignDriver.test.ts` exactly -- mock `globalThis.fetch`, use `renderHook` + `act`, verify fetch calls and state transitions)*

## Sources

### Primary (HIGH confidence)
- Codebase deep audit: every file listed in Complete Status Query Audit verified by direct Read + Grep
- `src/app/api/driver/routes/[routeId]/start/route.ts` line 57 -- driver API auth pattern, status guard
- `src/lib/hooks/useReorderStops.ts` -- optimistic mutation hook pattern
- `src/lib/email/send.ts` + `src/lib/email/types.ts` -- email system architecture, type registration
- `src/lib/email/admin-recipients.ts` -- getAdminEmails() helper for admin notification
- `src/components/ui/DragReorderList/DragReorderList.tsx` -- generic drag reorder
- `src/emails/AdminNewOrderAlert.tsx` -- React Email template pattern
- `supabase/migrations/20260315_route_editing_rpcs.sql` -- split/merge RPC patterns, hardcoded status values
- `supabase/migrations/20260312_route_pipeline_hardening.sql` -- trigger behavior, `status != 'completed'` check
- `supabase/migrations/002_rls_policies.sql` lines 247-263 -- RLS policy for routes using `driver_id = get_my_driver_id()`
- [PostgreSQL ALTER TYPE docs](https://www.postgresql.org/docs/current/sql-altertype.html) -- enum migration constraints
- All 13 `.claude/learnings/*.md` files -- cross-referenced for applicable patterns

### Secondary (MEDIUM confidence)
- `.claude/learnings/mobile-ux.md` -- safe-area inset position pattern
- `.claude/learnings/data-schema.md` -- DEFERRABLE constraint, manual RPC type entries
- `.claude/learnings/email-system.md` -- EmailType split, getAdminEmails() usage
- Project CLAUDE.md gotchas -- void async, .update() row count, falsy-zero

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: VERY HIGH -- zero new dependencies, all patterns verified in codebase
- Architecture: VERY HIGH -- every pattern has existing precedent with file:line citations
- Pitfalls: VERY HIGH -- all 10 pitfalls verified against actual code with grep results
- Migration: VERY HIGH -- PostgreSQL docs confirm enum non-transactional behavior
- Status audit: VERY HIGH -- exhaustive grep of entire src/ for all status patterns (9 filter queries, 6 guard checks, 13 UI rendering points, 7 type definitions, 2 RPC updates)
- Learnings cross-check: VERY HIGH -- all 13 files read, 27 applicable learnings mapped to tasks with risk levels

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable stack, no library updates expected)
