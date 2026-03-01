# Phase 78: Configurable Business Rules - Research

**Researched:** 2026-03-01
**Domain:** Admin settings management, Next.js cache invalidation, constant-to-DB migration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Inline with context display -- show fee naturally where relevant (e.g., "Delivery: $15.00" in cart, "$15 delivery fee" in checkout summary, "Free delivery over $100" in menu banner)
- Cutoff display: static text on menu/hero ("Order by Friday 3:00 PM for Saturday delivery"), countdown timer in cart/checkout where urgency matters
- Pages that display configured values: homepage hero, menu banner, cart drawer, checkout summary, AND order confirmation page
- Time slot picker on checkout generates slots dynamically from configured `delivery_start_hour` / `delivery_end_hour` -- no more hardcoded `TIME_WINDOWS` array
- Cutoff input: day-of-week dropdown + time picker (e.g., "Friday at 3:00 PM")
- All delivery settings stay on the Delivery tab, organized into visual subsections: "Pricing", "Schedule", "Coverage"
- No live preview of customer-facing impact -- admin checks customer pages after saving
- Seed on deploy -- migration script inserts default rows into `app_settings` with current hardcoded values
- App always reads from DB, never falls back to constants after migration
- Validation + soft warnings for unusual-but-valid values (e.g., $0 delivery fee shows yellow warning but allows save)
- Confirmation dialog before saving -- lists each changed field with old -> new value diff
- Simple change history -- "Last changed by X on Y" line shown per field or at form top, using existing `updated_at`/`updated_by` columns
- Changed fields get a subtle visual indicator (dot, border color, or "modified" badge) to help admin track unsaved changes
- Immediate revalidation on save via `revalidateTag` -- customer pages reflect changes on next load
- Toast + "Last updated: just now" timestamp at top of form after successful save
- Time slots should be auto-generated from start/end hours in 1-hour increments (matching current TIME_WINDOWS pattern)
- Subsections within Delivery tab: "Pricing" (fee, threshold, min order), "Schedule" (cutoff day/hour, delivery hours), "Coverage" (radius, duration)

### Claude's Discretion
- `max_delivery_duration_minutes` field approach (standalone vs derived)
- Loading skeleton design for settings form
- Exact change indicator styling (dot vs border vs badge)
- How the confirmation diff dialog is structured visually

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RULES-01 | `cutoff_hour` + `cutoff_day` configurable via admin settings | New DB keys `cutoff_day`/`cutoff_hour` in `app_settings`; admin form with day dropdown + time picker; `getBusinessRules()` server function; migrate `delivery-dates.ts` |
| RULES-02 | `delivery_fee_cents` configurable via admin settings | Already exists as `base_delivery_fee_cents` in DB schema. Need to replace constant imports in `order.ts`, `cart-store.ts`, `useCart.ts`, `CheckoutSummaryV8`, `FreeDeliveryProgress`, `CartBar` |
| RULES-03 | `free_delivery_threshold_cents` configurable via admin settings | Already exists as `free_delivery_threshold_cents` in DB schema. Same consumers as RULES-02 -- these share import sites |
| RULES-04 | `delivery_start_hour` / `delivery_end_hour` configurable | New DB keys. Replace hardcoded `TIME_WINDOWS` array with dynamic generation from these hours. Affects `TimeSlotPicker`, `useTimeSlot`, `checkout.ts` validation |
| RULES-05 | `max_delivery_radius_miles` / `max_delivery_duration_minutes` configurable | `delivery_radius_miles` already in DB. Need `max_delivery_duration_minutes` key. Admin form "Coverage" subsection |
| RULES-06 | Admin Settings form to edit all values | Extend existing `DeliverySettingsForm` with "Schedule" subsection (cutoff day/hour, delivery hours). Add confirmation diff dialog. Reorganize into 3 subsections |
| RULES-07 | Server reads from `app_settings` instead of constants with 5min cache | `getBusinessRules()` function using `unstable_cache` with `revalidateTag('business-rules')`. All server paths (checkout, order calculation) use this |
| RULES-08 | Customer pages display configured values dynamically | Server component data fetching passes settings as props. Client components receive via props, not constants. Pages: hero, menu, cart, checkout, order confirmation |
| RULES-09 | Admin ops dashboard uses configured cutoff/delivery times for countdown timers | Ops dashboard (future Phase 79) will consume same `getBusinessRules()`. For now, ensure the API/hook is ready |
| RULES-10 | Changes take effect immediately on next page load (cache bust via `revalidateTag`) | PATCH handler calls `revalidateTag('business-rules')` after successful upsert |
</phase_requirements>

## Summary

This phase replaces 5 hardcoded business constants with admin-editable values stored in the existing `app_settings` table. The infrastructure is largely already built -- the `app_settings` table, CRUD API, admin settings page with tabs/forms/save flows, Zod validation schemas, and RLS policies (including public read access via migration 022) are all in place. The main work is:

1. **DB migration**: Add missing keys (`cutoff_day`, `cutoff_hour`, `delivery_start_hour`, `delivery_end_hour`, `max_delivery_duration_minutes`) with correct default values matching current hardcoded constants
2. **Server-side settings reader**: Create `getBusinessRules()` using `unstable_cache` + `revalidateTag('business-rules')`, called by checkout route, order calculation, and delivery-dates utilities
3. **Admin form enhancement**: Reorganize DeliverySettingsForm into 3 subsections (Pricing/Schedule/Coverage), add cutoff day dropdown + hour picker, delivery hours pickers, and confirmation diff dialog
4. **Consumer migration**: Replace every import of `CUTOFF_DAY`, `CUTOFF_HOUR`, `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS`, `TIME_WINDOWS` with dynamic values from the settings reader or props
5. **Cache invalidation**: Add `revalidateTag('business-rules')` to settings PATCH handler

**Primary recommendation:** Build the `getBusinessRules()` server function first, then the migration, then update consumers top-down (server routes -> server components -> client components via props). Keep constants as reference for default seed values only.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16 (App Router) | `unstable_cache` + `revalidateTag` for server-side caching | Built-in cache invalidation, no additional deps |
| Supabase | existing | `app_settings` table storage | Already in use, RLS configured for public read |
| Zod | existing | Settings validation schemas | Already in use for `deliverySettingsSchema` |
| Zustand | existing | Client-side cart store needs settings injection | Already in use for cart state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | existing | Confirmation dialog animations, form transitions | Already imported in SettingsClient |
| lucide-react | existing | Icons for subsection headers, warnings | Already imported |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `unstable_cache` | In-memory module-level cache (as in research/STACK.md) | `unstable_cache` integrates with `revalidateTag` natively; module-level cache requires manual invalidation and doesn't work across serverless instances |
| New public API route | Service client direct read | Service client bypasses RLS, but RLS already allows public read (migration 022), so regular client works fine |
| React Context for settings | Props drilling from server components | Props are simpler, no provider wrapper needed, works with RSC/SSR pattern |

**Installation:**
```bash
# No new packages needed -- zero new npm packages (v1.9 constraint)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── settings/
│       ├── index.ts              # Barrel: getBusinessRules, BusinessRules type
│       ├── business-rules.ts     # Server-only: getBusinessRules() with unstable_cache
│       └── generate-time-windows.ts  # Pure fn: start/end hour -> TimeWindow[]
├── app/
│   └── api/admin/settings/
│       └── route.ts              # PATCH adds revalidateTag('business-rules')
├── components/ui/admin/settings/
│   └── DeliverySettingsForm.tsx   # Reorganized with subsections
└── types/
    └── delivery.ts               # Remove exported constants, keep types
```

### Pattern 1: Server-Side Settings Reader with Tag-Based Cache
**What:** `getBusinessRules()` fetches all delivery-category settings from `app_settings` using `unstable_cache` tagged with `'business-rules'`. When admin saves, PATCH handler calls `revalidateTag('business-rules')` to bust cache.
**When to use:** Every server path needing business rules (checkout route, delivery-dates.ts, server components for hero/menu).
**Example:**
```typescript
// src/lib/settings/business-rules.ts
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

export interface BusinessRules {
  cutoffDay: number;        // 0-6, 0=Sunday
  cutoffHour: number;       // 0-23
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  deliveryStartHour: number;
  deliveryEndHour: number;
  deliveryRadiusMiles: number;
  maxDeliveryDurationMinutes: number;
  minimumOrderCents: number;
}

export const getBusinessRules = unstable_cache(
  async (): Promise<BusinessRules> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .eq("category", "delivery");

    const settings = Object.fromEntries(
      (data || []).map((r) => [r.key, r.value])
    );

    return {
      cutoffDay: (settings.cutoff_day as number) ?? 5,
      cutoffHour: (settings.cutoff_hour as number) ?? 15,
      deliveryFeeCents: (settings.base_delivery_fee_cents as number) ?? 1500,
      freeDeliveryThresholdCents: (settings.free_delivery_threshold_cents as number) ?? 10000,
      deliveryStartHour: (settings.delivery_start_hour as number) ?? 11,
      deliveryEndHour: (settings.delivery_end_hour as number) ?? 19,
      deliveryRadiusMiles: (settings.delivery_radius_miles as number) ?? 40,
      maxDeliveryDurationMinutes: (settings.max_delivery_duration_minutes as number) ?? 60,
      minimumOrderCents: (settings.minimum_order_cents as number) ?? 2500,
    };
  },
  ["business-rules"],
  { tags: ["business-rules"], revalidate: 300 } // 5 min TTL + tag-based bust
);
```

### Pattern 2: Dynamic Time Window Generation
**What:** Replace hardcoded `TIME_WINDOWS` array with a pure function that generates 1-hour slots from `delivery_start_hour` to `delivery_end_hour`.
**When to use:** TimeSlotPicker, useTimeSlot hook, checkout validation.
**Example:**
```typescript
// src/lib/settings/generate-time-windows.ts
import type { TimeWindow } from "@/types/delivery";

export function generateTimeWindows(startHour: number, endHour: number): TimeWindow[] {
  const windows: TimeWindow[] = [];
  for (let h = startHour; h < endHour; h++) {
    const start = `${String(h).padStart(2, "0")}:00`;
    const end = `${String(h + 1).padStart(2, "0")}:00`;
    const startLabel = h > 12 ? `${h - 12}:00 PM` : h === 12 ? "12:00 PM" : `${h}:00 AM`;
    const endLabel = (h + 1) > 12 ? `${(h + 1) - 12}:00 PM` : (h + 1) === 12 ? "12:00 PM" : `${h + 1}:00 AM`;
    windows.push({ start, end, label: `${startLabel} - ${endLabel}` });
  }
  return windows;
}
```

### Pattern 3: Server Component Props Passing for Customer Pages
**What:** Server components fetch business rules and pass as props to client components. Client components never import constants directly.
**When to use:** Homepage, menu page, checkout page.
**Example:**
```typescript
// Server component (page.tsx)
import { getBusinessRules } from "@/lib/settings";
export default async function HomePage() {
  const rules = await getBusinessRules();
  return <Hero deliveryFeeCents={rules.deliveryFeeCents} cutoffDay={rules.cutoffDay} cutoffHour={rules.cutoffHour} />;
}

// Client component receives via props, NOT from import
function Hero({ deliveryFeeCents, cutoffDay, cutoffHour }: HeroProps) { ... }
```

### Pattern 4: Cache Invalidation on Save
**What:** Settings PATCH handler calls `revalidateTag('business-rules')` after successful upsert.
**When to use:** Admin settings save flow.
**Example:**
```typescript
// In PATCH handler, after successful upsert loop:
import { revalidateTag } from "next/cache";

if (category === "delivery") {
  revalidateTag("business-rules");
}
```

### Pattern 5: Confirmation Diff Dialog
**What:** Before saving, show a dialog listing each changed field with old -> new values.
**When to use:** SettingsClient save flow.
**Example:**
```typescript
// Compute changed fields
const changes = Object.entries(settings.delivery).filter(
  ([key, value]) => JSON.stringify(value) !== JSON.stringify(originalSettings.delivery[key as keyof DeliverySettings])
);
// Render: { label: "Delivery Fee", old: "$5.99", new: "$15.00" }
```

### Anti-Patterns to Avoid
- **Importing constants in client components:** After migration, NO component should import `CUTOFF_DAY`, `CUTOFF_HOUR`, `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS`, or `TIME_WINDOWS` from `@/types/*`. These become dead exports.
- **Client-side Supabase reads for settings:** Client components should receive settings via props from server components, not fetch from Supabase directly. Keeps the data flow unidirectional and cacheable.
- **Fallback to constants after migration:** The decision is "app always reads from DB, never falls back to constants." Constants should only exist as default seed values in the migration script and restore route.
- **Separate API route for public settings:** Not needed -- server components can call `getBusinessRules()` directly (it's a cached server function). Only admin needs the existing PATCH API.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server-side cache with tag invalidation | Module-level cache with manual timer | `unstable_cache` + `revalidateTag` | Built into Next.js, works across serverless instances, integrates with ISR |
| Time window generation | Another hardcoded array | `generateTimeWindows(startHour, endHour)` pure function | Single source of truth, matches admin-configured hours |
| Change diff computation | Custom deep-diff library | Simple `JSON.stringify` comparison per field (already used by `isDeliveryFieldChanged`) | Settings object is shallow, no deep nesting except arrays |
| Day-of-week dropdown | Custom select | Radix Select or native HTML select with day names | 7 static options, no dynamic behavior needed |

**Key insight:** The existing settings infrastructure (table, API, form components, validation, RLS) handles 90% of the work. This phase is primarily a wiring exercise -- connecting existing admin controls to the right consumers and removing hardcoded constants.

## Common Pitfalls

### Pitfall 1: Incomplete Constant Migration Leaves Split Brain
**What goes wrong:** Some code paths read from DB, others still import hardcoded constants. Customer sees "$15 delivery fee" on menu but "$5.99" at checkout.
**Why it happens:** Grep misses some import sites, or test files keep importing old constants.
**How to avoid:** After migration, run `grep -r "CUTOFF_DAY\|CUTOFF_HOUR\|DELIVERY_FEE_CENTS\|FREE_DELIVERY_THRESHOLD_CENTS\|TIME_WINDOWS" src/ --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v node_modules` and confirm 0 results from non-test files. Test files may still reference constants for fixture values.
**Warning signs:** Different fee amounts shown on different pages. Countdown timer disagrees with server validation.

### Pitfall 2: Cart Store Cannot Access Server-Side Settings
**What goes wrong:** `cart-store.ts` (Zustand, client-side) currently imports `DELIVERY_FEE_CENTS` and `FREE_DELIVERY_THRESHOLD_CENTS` directly. It cannot call `getBusinessRules()` because that's a server function.
**Why it happens:** Cart store runs client-side in browser; `unstable_cache` and Supabase server client are server-only.
**How to avoid:** The cart store's `getEstimatedDeliveryFee()` becomes an approximation. Pass the actual fee/threshold from the server component into the checkout page as props, and use those for the authoritative display. The cart store either: (a) stores the current fee/threshold received from server on page load, or (b) the `useCart` hook is updated to accept settings as a parameter. For the cart drawer/bar on the menu page, the server component fetches rules and passes them down.
**Warning signs:** Cart shows "$15.00 delivery" while server calculates "$5.99" from DB.

### Pitfall 3: Checkout Validation Still Uses Hardcoded TIME_WINDOWS
**What goes wrong:** `createCheckoutSessionSchema` in `checkout.ts` has a `.refine()` that validates against the hardcoded `TIME_WINDOWS` array. After removing that array, validation breaks or accepts any time.
**Why it happens:** The Zod schema is defined at module level, but time windows are now dynamic.
**How to avoid:** Move validation to the checkout API route handler where `getBusinessRules()` is available. Generate valid windows from `delivery_start_hour`/`delivery_end_hour` and validate the submitted window against those. The schema becomes structural validation only (format check), with business logic validation happening server-side.
**Warning signs:** Checkout accepts time windows outside configured delivery hours, or rejects all time windows.

### Pitfall 4: Default Seeds Don't Match Current Hardcoded Values
**What goes wrong:** Migration inserts `base_delivery_fee_cents = 599` (current DB seed) but code hardcodes `DELIVERY_FEE_CENTS = 1500`. After migration, prices change unexpectedly.
**Why it happens:** The existing migration 010 seeded defaults that differ from the actual app constants. `base_delivery_fee_cents = 599` vs `DELIVERY_FEE_CENTS = 1500`. `free_delivery_threshold_cents = 5000` vs `FREE_DELIVERY_THRESHOLD_CENTS = 10000`.
**How to avoid:** The new migration must UPDATE existing rows to match the actual app behavior: `delivery_fee_cents = 1500`, `free_delivery_threshold_cents = 10000`. Use `UPDATE ... SET value = ...` not `INSERT ON CONFLICT DO NOTHING` (which would keep the old seed values).
**Warning signs:** Fee changes immediately after deploying migration without admin action.

### Pitfall 5: revalidateTag Doesn't Work with Client Router Cache
**What goes wrong:** Admin saves settings, server cache is invalidated via `revalidateTag`, but customer on the same Next.js app still sees old values because the Next.js client-side router cache serves the stale page.
**Why it happens:** Next.js client-side router cache (30s for dynamic, 5min for static) is separate from the server data cache.
**How to avoid:** Customer pages should use `dynamic = 'force-dynamic'` or time-based revalidation. The existing pages don't set caching headers, so they default to dynamic rendering. Verify after implementation that a page refresh shows updated values. The CONTEXT.md says "Changes take effect on the next page load" which means a full navigation/refresh, not SPA transition -- this is acceptable.
**Warning signs:** Customer refreshes page but still sees old fee.

## Code Examples

### Server-Side Settings Reader
```typescript
// src/lib/settings/business-rules.ts
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

export interface BusinessRules {
  cutoffDay: number;
  cutoffHour: number;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  deliveryStartHour: number;
  deliveryEndHour: number;
  deliveryRadiusMiles: number;
  maxDeliveryDurationMinutes: number;
  minimumOrderCents: number;
}

// Defaults match the ACTUAL hardcoded values in the app (not the DB seed values)
const DEFAULTS: BusinessRules = {
  cutoffDay: 5,
  cutoffHour: 15,
  deliveryFeeCents: 1500,
  freeDeliveryThresholdCents: 10000,
  deliveryStartHour: 11,
  deliveryEndHour: 19,
  deliveryRadiusMiles: 40,
  maxDeliveryDurationMinutes: 60,
  minimumOrderCents: 2500,
};

export const getBusinessRules = unstable_cache(
  async (): Promise<BusinessRules> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .eq("category", "delivery");

    if (error || !data) return DEFAULTS;

    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));

    return {
      cutoffDay: (map.cutoff_day as number) ?? DEFAULTS.cutoffDay,
      cutoffHour: (map.cutoff_hour as number) ?? DEFAULTS.cutoffHour,
      deliveryFeeCents: (map.base_delivery_fee_cents as number) ?? DEFAULTS.deliveryFeeCents,
      freeDeliveryThresholdCents: (map.free_delivery_threshold_cents as number) ?? DEFAULTS.freeDeliveryThresholdCents,
      deliveryStartHour: (map.delivery_start_hour as number) ?? DEFAULTS.deliveryStartHour,
      deliveryEndHour: (map.delivery_end_hour as number) ?? DEFAULTS.deliveryEndHour,
      deliveryRadiusMiles: (map.delivery_radius_miles as number) ?? DEFAULTS.deliveryRadiusMiles,
      maxDeliveryDurationMinutes: (map.max_delivery_duration_minutes as number) ?? DEFAULTS.maxDeliveryDurationMinutes,
      minimumOrderCents: (map.minimum_order_cents as number) ?? DEFAULTS.minimumOrderCents,
    };
  },
  ["business-rules"],
  { tags: ["business-rules"], revalidate: 300 }
);
```

### Migration Script for New Settings Keys
```sql
-- 029_business_rules_settings.sql

-- Add new delivery settings keys matching current hardcoded constants
INSERT INTO app_settings (key, value, category) VALUES
  ('cutoff_day', '5'::jsonb, 'delivery'),
  ('cutoff_hour', '15'::jsonb, 'delivery'),
  ('delivery_start_hour', '11'::jsonb, 'delivery'),
  ('delivery_end_hour', '19'::jsonb, 'delivery'),
  ('max_delivery_duration_minutes', '60'::jsonb, 'delivery')
ON CONFLICT (key) DO NOTHING;

-- FIX: Update existing seed values to match actual app constants
-- Migration 010 seeded base_delivery_fee_cents=599, but app uses 1500
-- Migration 010 seeded free_delivery_threshold_cents=5000, but app uses 10000
UPDATE app_settings SET value = '1500'::jsonb WHERE key = 'base_delivery_fee_cents' AND value = '599'::jsonb;
UPDATE app_settings SET value = '10000'::jsonb WHERE key = 'free_delivery_threshold_cents' AND value = '5000'::jsonb;
```

### Refactored delivery-dates.ts (Accepts Settings as Parameters)
```typescript
// getCutoffForSaturday now accepts cutoffDay and cutoffHour as parameters
export function getCutoffForSaturday(
  saturday: Date,
  cutoffDay: number,
  cutoffHour: number
): Date {
  const { year, month, day } = getZonedParts(saturday);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const daysBeforeSaturday = 6 - cutoffDay;
  utcDate.setUTCDate(utcDate.getUTCDate() - daysBeforeSaturday);

  return zonedTimeToUtc({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: cutoffHour,
    minute: 0,
    second: 0,
  });
}
```

### Cache Invalidation in Settings PATCH Handler
```typescript
// In src/app/api/admin/settings/route.ts PATCH handler
import { revalidateTag } from "next/cache";

// After successful upsert loop:
if (category === "delivery") {
  revalidateTag("business-rules");
}

return NextResponse.json({
  message: "Settings updated successfully",
  category,
  updatedKeys: updates.map((u) => u.key),
});
```

### Confirmation Diff Dialog Data Structure
```typescript
interface SettingsChange {
  field: string;     // Human-readable label
  oldValue: string;  // Formatted for display
  newValue: string;  // Formatted for display
}

function computeDeliveryChanges(
  current: DeliverySettings,
  original: DeliverySettings
): SettingsChange[] {
  const changes: SettingsChange[] = [];
  if (current.baseDeliveryFeeCents !== original.baseDeliveryFeeCents) {
    changes.push({
      field: "Delivery Fee",
      oldValue: `$${(original.baseDeliveryFeeCents / 100).toFixed(2)}`,
      newValue: `$${(current.baseDeliveryFeeCents / 100).toFixed(2)}`,
    });
  }
  // ... similar for each field
  return changes;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `DELIVERY_FEE_CENTS = 1500` in `src/types/cart.ts` | DB read via `getBusinessRules()` | Phase 78 | Every consumer must migrate |
| Hardcoded `CUTOFF_DAY = 5, CUTOFF_HOUR = 15` in `src/types/delivery.ts` | DB read via `getBusinessRules()` | Phase 78 | `delivery-dates.ts` functions accept parameters |
| Hardcoded `TIME_WINDOWS[]` array | `generateTimeWindows(startHour, endHour)` | Phase 78 | TimeSlotPicker, checkout validation, useTimeSlot all change |
| Duplicate constants in `src/lib/utils/order.ts` | Single source via `getBusinessRules()` | Phase 78 | Server-side order calculation reads from DB |
| No cache invalidation pattern | `revalidateTag('business-rules')` | Phase 78 | Settings PATCH handler triggers cache bust |

**Deprecated/outdated:**
- `CUTOFF_DAY`, `CUTOFF_HOUR` exports from `src/types/delivery.ts` -- dead after migration
- `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS` exports from `src/types/cart.ts` -- dead after migration
- `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS` in `src/lib/utils/order.ts` -- dead after migration
- `TIME_WINDOWS` export from `src/types/delivery.ts` -- replaced by `generateTimeWindows()`

## Open Questions

1. **Default values mismatch between DB seed and app constants**
   - What we know: Migration 010 seeded `base_delivery_fee_cents = 599` and `free_delivery_threshold_cents = 5000`. App constants use `1500` and `10000`. The restore defaults route also uses the 599/5000 values.
   - What's unclear: Which values does the operator actually want? The DB seed values were generic placeholders; the code constants reflect actual business prices.
   - Recommendation: Use `UPDATE` in new migration to align DB to current app constants (1500/10000). Also update restore defaults route to use same values. Ask operator to confirm preferred defaults if uncertain.

2. **`max_delivery_duration_minutes` -- standalone field vs derived**
   - What we know: CONTEXT.md says Claude's discretion. Currently used in coverage checks.
   - Recommendation: Standalone field. It's conceptually independent of radius (a 30-mile delivery could take 45 or 90 minutes depending on traffic). Simple number input in the Coverage subsection.

3. **Cart store client-side fee display**
   - What we know: Cart store (`Zustand`) is client-side only. Cannot call server functions. Currently imports `DELIVERY_FEE_CENTS` directly.
   - Recommendation: Keep `getEstimatedDeliveryFee()` in cart store but have it use settings values passed to the page. The menu page (server component) fetches rules and passes `deliveryFeeCents` + `freeDeliveryThresholdCents` as props to the cart-containing layout. Client components store/use these values.

## Existing Infrastructure Audit

### What Already Exists (Reuse)
| Asset | Location | Status |
|-------|----------|--------|
| `app_settings` table | `supabase/migrations/010_app_settings.sql` | Ready -- has `key`, `value` (JSONB), `category`, `updated_at`, `updated_by` |
| Public read RLS | `supabase/migrations/022_rls_audit_hardening.sql` | Ready -- anon + authenticated can SELECT |
| Settings GET/PATCH API | `src/app/api/admin/settings/route.ts` | Ready -- upsert pattern, rate limiting, auth |
| Restore defaults API | `src/app/api/admin/settings/restore/route.ts` | Needs update -- default values must match app constants |
| `SettingsClient` | `src/components/ui/admin/settings/SettingsClient/` | Ready -- tabs, save/discard/restore, FloatingUnsavedBar, ConfirmDialog |
| `DeliverySettingsForm` | `src/components/ui/admin/settings/DeliverySettingsForm.tsx` | Needs extension -- add Schedule subsection, cutoff inputs |
| `deliverySettingsSchema` (Zod) | `src/lib/validations/settings.ts` | Needs extension -- add `cutoff_day`, `cutoff_hour`, `delivery_start_hour`, `delivery_end_hour` |
| `delivery-helpers.ts` | `src/components/ui/admin/settings/delivery-helpers.ts` | Needs extension -- add validation for new fields |
| `settings-types.ts` | `src/components/ui/admin/settings/settings-types.ts` | Needs extension -- add new fields to `DeliverySettings` interface |
| `settings-defaults.ts` | `src/components/ui/admin/settings/SettingsClient/settings-defaults.ts` | Needs update -- add new fields, fix default values |
| `ConfirmDialog` | `src/components/ui/admin/settings/ConfirmDialog.tsx` | Ready -- reusable for save confirmation (may need to accept diff content) |
| Changed field indicator | `delivery-helpers.ts` `CHANGED_BORDER` | Ready -- `"border-l-2 border-l-primary pl-3"` |

### What Must Be Created
| Asset | Purpose |
|-------|---------|
| `src/lib/settings/business-rules.ts` | `getBusinessRules()` with `unstable_cache` |
| `src/lib/settings/generate-time-windows.ts` | Pure function replacing `TIME_WINDOWS` |
| `src/lib/settings/index.ts` | Barrel exports |
| `supabase/migrations/029_business_rules_settings.sql` | New keys + fix existing seed values |
| Save confirmation diff dialog content | Changed-fields list in ConfirmDialog |

### Consumer Files to Update (Complete Audit)
| File | What Changes | Constants Removed |
|------|-------------|-------------------|
| `src/types/delivery.ts` | Remove `CUTOFF_DAY`, `CUTOFF_HOUR`, `TIME_WINDOWS` exports; keep types | `CUTOFF_DAY`, `CUTOFF_HOUR`, `TIME_WINDOWS` |
| `src/types/cart.ts` | Remove `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS` exports | `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS` |
| `src/lib/utils/delivery-dates.ts` | Functions accept `cutoffDay`/`cutoffHour` params instead of importing constants | N/A (params now) |
| `src/lib/utils/order.ts` | Remove local `DELIVERY_FEE_CENTS`/`FREE_DELIVERY_THRESHOLD_CENTS`; `calculateDeliveryFee` accepts them as params | Both |
| `src/lib/stores/cart-store.ts` | Remove constant imports; `getEstimatedDeliveryFee` needs settings from outside | Both |
| `src/lib/hooks/useCart.ts` | Remove `FREE_DELIVERY_THRESHOLD_CENTS` import; receive via parameter or context | `FREE_DELIVERY_THRESHOLD_CENTS` |
| `src/lib/hooks/useTimeSlot.ts` | Remove `TIME_WINDOWS` import; accept windows as parameter | `TIME_WINDOWS` |
| `src/lib/validations/checkout.ts` | Remove `TIME_WINDOWS` import; structural validation only, business validation in route handler | `TIME_WINDOWS` |
| `src/components/ui/checkout/TimeSlotPicker/TimeSlotPicker.tsx` | Remove `TIME_WINDOWS` import; receive windows via props | `TIME_WINDOWS` |
| `src/components/ui/checkout/TimeSlotDisplay.tsx` | Remove `TIME_WINDOWS` import; receive via props or generate from settings | `TIME_WINDOWS` |
| `src/components/ui/checkout/CheckoutSummaryV8.tsx` | Remove `FREE_DELIVERY_THRESHOLD_CENTS` import; receive via props | `FREE_DELIVERY_THRESHOLD_CENTS` |
| `src/components/ui/cart/FreeDeliveryProgress.tsx` | Remove `FREE_DELIVERY_THRESHOLD_CENTS` import; receive via props | `FREE_DELIVERY_THRESHOLD_CENTS` |
| `src/components/ui/cart/CartBar.tsx` | Remove `FREE_DELIVERY_THRESHOLD_CENTS` import; receive via props | `FREE_DELIVERY_THRESHOLD_CENTS` |
| `src/components/ui/homepage/Hero/HeroContent.tsx` | Display configured delivery fee and cutoff text from props | N/A (add props) |
| `src/app/api/checkout/session/route.ts` | Use `getBusinessRules()` for fee calculation and cutoff validation | N/A (indirect via `order.ts` and `delivery-dates.ts`) |
| `src/app/api/admin/settings/route.ts` | Add `revalidateTag('business-rules')` after delivery category update | N/A |
| `src/app/api/admin/settings/restore/route.ts` | Update default values to match app constants | N/A |

### Test Files to Update
| File | What Changes |
|------|-------------|
| `src/lib/utils/__tests__/order.test.ts` | Uses `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS` for assertions -- update to use literal values or test fixtures |
| `src/lib/stores/__tests__/cart-store.test.ts` | Uses `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS` -- same |
| `src/lib/utils/__tests__/delivery-dates.test.ts` | Currently doesn't import constants directly (uses computed dates) -- may need updates for parameterized functions |
| `src/app/api/checkout/session/__tests__/route.test.ts` | May need mock for `getBusinessRules()` |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.17 |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test` (vitest run) |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RULES-01 | cutoff_day/hour configurable | unit | `pnpm test -- src/lib/settings/__tests__/business-rules.test.ts -t "cutoff"` | Wave 0 |
| RULES-02 | delivery_fee_cents configurable | unit | `pnpm test -- src/lib/utils/__tests__/order.test.ts -t "delivery fee"` | Exists (needs update) |
| RULES-03 | free_delivery_threshold configurable | unit | `pnpm test -- src/lib/utils/__tests__/order.test.ts -t "free delivery"` | Exists (needs update) |
| RULES-04 | delivery_start/end_hour configurable | unit | `pnpm test -- src/lib/settings/__tests__/generate-time-windows.test.ts` | Wave 0 |
| RULES-05 | radius/duration configurable | unit | `pnpm test -- src/lib/settings/__tests__/business-rules.test.ts -t "radius"` | Wave 0 |
| RULES-06 | Admin form edits all values | manual-only | Manual: navigate to admin settings, edit each field, save | N/A - UI test |
| RULES-07 | Server reads from DB with cache | unit | `pnpm test -- src/lib/settings/__tests__/business-rules.test.ts` | Wave 0 |
| RULES-08 | Customer pages display dynamic values | manual-only | Manual: change fee in admin, refresh customer page, verify display | N/A - E2E |
| RULES-09 | Ops dashboard uses configured times | manual-only | Manual: change cutoff, verify ops countdown updates | N/A - future phase |
| RULES-10 | revalidateTag busts cache on save | unit | `pnpm test -- src/app/api/admin/settings/__tests__/route.test.ts -t "revalidate"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/settings/__tests__/business-rules.test.ts` -- covers RULES-01, RULES-05, RULES-07
- [ ] `src/lib/settings/__tests__/generate-time-windows.test.ts` -- covers RULES-04
- [ ] Update `src/lib/utils/__tests__/order.test.ts` -- parameterized `calculateDeliveryFee` tests for RULES-02, RULES-03
- [ ] Update `src/lib/utils/__tests__/delivery-dates.test.ts` -- parameterized cutoff functions
- [ ] Update `src/lib/stores/__tests__/cart-store.test.ts` -- mock or inject settings values

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/types/delivery.ts`, `src/types/cart.ts` -- hardcoded constants
- Codebase analysis: `src/lib/utils/delivery-dates.ts` -- cutoff logic consuming constants
- Codebase analysis: `src/lib/utils/order.ts` -- delivery fee calculation with duplicated constants
- Codebase analysis: `src/app/api/admin/settings/route.ts` -- existing settings CRUD
- Codebase analysis: `src/components/ui/admin/settings/` -- complete settings UI infrastructure
- Codebase analysis: `supabase/migrations/010_app_settings.sql` -- table schema
- Codebase analysis: `supabase/migrations/022_rls_audit_hardening.sql` -- public read RLS
- Codebase analysis: Full `grep` audit of all constant import sites (28 files)

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` -- Pitfall 4 documents the stale cutoff enforcement risk
- `.planning/research/STACK.md` -- Section 3 documents the settings migration pattern and caching approach
- `.planning/research/FEATURES.md` -- Configurable business rules feature analysis

### Tertiary (LOW confidence)
- `unstable_cache` API stability -- name suggests instability, but it has been stable since Next.js 14 and is the recommended approach for tag-based cache invalidation. Will become `cache` in a future Next.js release.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- entirely existing stack, no new dependencies
- Architecture: HIGH -- patterns verified against existing codebase infrastructure
- Pitfalls: HIGH -- complete audit of all 28+ files importing constants, DB seed mismatch identified
- Validation: HIGH -- Vitest infrastructure exists, test files identified for updates

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable -- no external library changes expected)
