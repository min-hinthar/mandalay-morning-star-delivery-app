# Phase 87: Fix Code Gaps (GATE-03 + DRV-05) - Research

**Researched:** 2026-03-02
**Domain:** Next.js App Router server-side guard patterns + cart data flow
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Page guard scope
- Guard ALL hidden pages: /driver/earnings, /driver/schedule, /driver/history, /driver/test-delivery
- /driver/profile stays accessible (mode toggle lives there — blocking it would lock drivers out)
- Extract shared `checkSimpleMode(supabase, userId)` helper — all guarded pages call it (DRY)
- Existing /driver/route/[stopId] guard refactored to use shared helper for consistency

#### Guard redirect behavior
- Silent redirect to /driver (no toast, no message) — matches existing stop detail page pattern
- Server-side only (Next.js `redirect()` in page component before render)
- No real-time redirect on admin mode toggle — guard fires on next server navigation
- Shared helper checks driver exists + is_active + simple_mode in one query (defensive, no assumptions about layout middleware)

### Claude's Discretion
- Cart cutoff data flow approach: how DB cutoff values reach CartDrawer (extend DeliverySettingsSync to store vs prop threading through layout — either works)
- Exact refactoring of existing stop detail guard to use shared helper
- Whether shared helper returns the driver record or just redirects (API design)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GATE-03 | Cart drawer — show delivery date + cutoff countdown sourced from DB (not hardcoded Friday 3PM) | CustomerLayout already calls `getBusinessRules()` and passes to CustomerShell; DeliverySettingsSync pattern already established for fee values; extend same pattern to cutoff values |
| DRV-05 | Hide by default — route optimization, exception modals, earnings dashboard; block direct URL access for hidden pages in simple mode | Stop detail guard pattern confirmed at `/driver/route/[stopId]/page.tsx`; four pages confirmed unguarded: earnings, schedule, history, test-delivery; shared helper location: `src/lib/driver/simple-mode-guard.ts` |
</phase_requirements>

## Summary

Phase 87 closes two integration gaps from the v1.9 audit. Both are surgical, minimal-code changes with no new packages and clear established patterns to follow.

**GATE-03 (CartFooter cutoff wiring):** The `CustomerLayout` at `src/app/(customer)/layout.tsx` already calls `getBusinessRules()` and passes `deliveryFeeCents` + `freeDeliveryThresholdCents` to `CustomerShell`. The same layout also needs to pass `cutoffDay` + `cutoffHour` down to `CustomerShell` → `DeliverySettingsSync` (extended) → cart store. The `CartFooter` already accepts optional `cutoffDay`/`cutoffHour` props with fallback defaults (5/15), so the only gap is plumbing DB values to it instead of relying on those defaults. The `PublicShell` follows the same pattern and must also be updated since it renders `CartOverlays` (which includes `CartDrawer`).

**DRV-05 (simple mode page guard):** Four driver pages — `/driver/earnings`, `/driver/schedule`, `/driver/history`, `/driver/test-delivery` — are completely unguarded. The existing guard in `/driver/route/[stopId]/page.tsx` is the confirmed template: query `drivers` table for `id, simple_mode` on the authenticated user, redirect to `/driver` if `simple_mode === true`. A shared helper at `src/lib/driver/simple-mode-guard.ts` eliminates the duplicated auth+driver query pattern and keeps the stop detail guard consistent.

**Primary recommendation:** Extend `DeliverySettingsSync` (or create a parallel `CutoffSync`) to push `cutoffDay`/`cutoffHour` into cart store, and extract a `checkSimpleMode()` helper that all five guarded pages call.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16 | Server page components, `redirect()` | Project standard — all pages use this |
| Supabase JS | v2 | Driver DB query for `simple_mode` | Project standard for all DB access |
| `getBusinessRules()` | internal | Reads `cutoffDay`/`cutoffHour` from DB with 5min cache | Already used by checkout, menu, hero; single source of truth |
| Zustand | current | Cart store state (`setDeliverySettings` pattern) | Project standard for client-side state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `unstable_cache` | Next.js 16 built-in | Caches `getBusinessRules()` with `business-rules` tag | Already applied — no changes needed |
| `createClient` | internal | Server-side Supabase client for auth + DB | Used by all guarded driver pages already |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extend `DeliverySettingsSync` component | Create parallel `CutoffSync` component | Either works per CONTEXT; extending is fewer files; parallel keeps fee vs cutoff concerns separate |
| Shared `checkSimpleMode()` helper | Inline guard in each page | Inline = code duplication; shared helper = DRY, consistent behavior |
| Store cutoff in Zustand | Prop-thread from layout to CartContent | Store avoids drilling through CartOverlays → CartDrawer → CartContent → CartFooter; store is cleaner |

**Installation:** No new packages. Zero new dependencies.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/driver/
│   └── simple-mode-guard.ts     # NEW: shared checkSimpleMode() helper
├── lib/stores/
│   └── cart-store.ts            # MODIFY: add cutoffDay/cutoffHour fields + setCutoffSettings
├── components/ui/cart/
│   └── DeliverySettingsSync.tsx # MODIFY: extend to accept + sync cutoff values
├── app/(customer)/
│   ├── layout.tsx               # MODIFY: pass cutoffDay/cutoffHour to CustomerShell
│   └── CustomerShell.tsx        # MODIFY: accept + forward cutoff props to DeliverySettingsSync
├── app/(public)/
│   ├── layout.tsx               # MODIFY: pass cutoffDay/cutoffHour to PublicShell
│   └── PublicShell.tsx          # MODIFY: accept + forward cutoff props to DeliverySettingsSync
├── app/(driver)/driver/
│   ├── earnings/page.tsx        # MODIFY: add simple mode guard
│   ├── schedule/page.tsx        # MODIFY: add simple mode guard
│   ├── history/page.tsx         # MODIFY: add simple mode guard
│   ├── test-delivery/page.tsx   # SPECIAL: client component, needs conversion to server wrapper
│   └── route/[stopId]/page.tsx  # MODIFY: refactor existing guard to use shared helper
```

### Pattern 1: Shared Simple Mode Guard Helper

**What:** A server-side async function that queries `drivers` for `id + simple_mode`, redirects to `/driver` if simple mode is active, and returns the driver record if not. All guarded pages call this instead of duplicating the query.

**When to use:** Every driver page that should be hidden in simple mode.

**Example (modeled on stop detail page guard):**
```typescript
// src/lib/driver/simple-mode-guard.ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface DriverSimpleModeResult {
  id: string;
  simple_mode: boolean;
}

/**
 * Guard for simple-mode-hidden driver pages.
 * Redirects to /driver if simple mode is active.
 * Returns driver record if allowed through.
 * Call at the start of any server page data-fetching function.
 */
export async function checkSimpleMode(): Promise<{ id: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver");
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, simple_mode")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverSimpleModeResult[]>()
    .single();

  if (!driver) {
    redirect("/driver");
  }

  if (driver.simple_mode === true) {
    redirect("/driver");
  }

  return { id: driver.id };
}
```

### Pattern 2: Applying Guard to Server Page Components

**What:** Call `checkSimpleMode()` at the top of the page's data-fetching function. The existing driver query in each page can then be simplified (no need to re-fetch driver auth — `checkSimpleMode()` already confirmed they exist and are active).

**Example for earnings page:**
```typescript
// src/app/(driver)/driver/earnings/page.tsx
async function getEarningsData() {
  const { id: driverId } = await checkSimpleMode(); // redirects if simple mode

  // ... existing earnings queries using driverId directly
  // (no need to duplicate auth + driver lookup since checkSimpleMode() did it)
}
```

**Note on test-delivery/page.tsx:** This is currently a `"use client"` component with no server wrapper. It needs a thin server wrapper (`page.tsx` becomes a server component that calls `checkSimpleMode()`, then renders the existing client component renamed to `TestDeliveryClient.tsx`).

### Pattern 3: Cutoff Values in Cart Store (Zustand)

**What:** Extend the existing `setDeliverySettings` pattern. Add `cutoffDay`/`cutoffHour` fields to the Zustand cart store with the same defaults as `CartFooter` (5, 15). Add a `setCutoffSettings` action. `DeliverySettingsSync` reads these from the server and syncs them to the store on mount.

**When to use:** Any client component that needs DB-sourced cutoff values without prop drilling.

**Example — cart store extension:**
```typescript
// src/lib/stores/cart-store.ts (additions only)

// In CartStore interface:
cutoffDay: number;        // 0=Sun..6=Sat, default 5 (Friday)
cutoffHour: number;       // 0-23, default 15 (3 PM)
setCutoffSettings: (day: number, hour: number) => void;

// In create():
cutoffDay: 5,
cutoffHour: 15,
setCutoffSettings: (day: number, hour: number) =>
  set({ cutoffDay: day, cutoffHour: hour }),
```

**Example — DeliverySettingsSync extension:**
```typescript
// src/components/ui/cart/DeliverySettingsSync.tsx
interface DeliverySettingsSyncProps {
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  cutoffDay: number;
  cutoffHour: number;
}

export function DeliverySettingsSync({
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  cutoffDay,
  cutoffHour,
}: DeliverySettingsSyncProps) {
  useEffect(() => {
    useCartStore.getState().setDeliverySettings(deliveryFeeCents, freeDeliveryThresholdCents);
    useCartStore.getState().setCutoffSettings(cutoffDay, cutoffHour);
  }, [deliveryFeeCents, freeDeliveryThresholdCents, cutoffDay, cutoffHour]);

  return null;
}
```

**Example — CartFooter consuming from store:**
```typescript
// src/components/ui/cart/CartDrawer.tsx or CartDrawerParts.tsx
// CartFooter reads cutoff from store instead of relying on prop defaults
const cutoffDay = useCartStore((state) => state.cutoffDay);
const cutoffHour = useCartStore((state) => state.cutoffHour);

// Pass to CartFooter:
<CartFooter
  onClose={onClose}
  onCheckout={handleCheckout}
  hasBlockingIssues={validation.hasBlockingIssues}
  showFullCartLink={showFullCartLink}
  cutoffDay={cutoffDay}
  cutoffHour={cutoffHour}
/>
```

### Anti-Patterns to Avoid

- **Prop threading cutoff through CartOverlays → CartDrawer → CartContent → CartFooter with server props:** CartOverlays is rendered in `CustomerShell`/`PublicShell` (client components), not from a server page — so server props can't reach it directly without Zustand or Context.
- **Reading simple_mode from layout middleware or cookies:** CONTEXT.md explicitly says "no assumptions about layout middleware" — always query DB directly in page components.
- **Client-side simple_mode redirect:** Simple mode guard must be server-side to prevent page flash on direct URL access.
- **Converting test-delivery page's full logic to server component:** The page has significant client-only state (animation, multi-step flow). Only the guard (a thin server wrapper) needs to be server-side.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth check in guard helper | Custom session parsing | `supabase.auth.getUser()` via `createClient()` | Established pattern across all driver pages |
| Cache invalidation for cutoff | Custom invalidation | `getBusinessRules()` with `unstable_cache` already handles this | Already implemented; tag-based revalidation works |
| Per-page driver query after guard | Re-run auth in data function | Return `{ id: driverId }` from `checkSimpleMode()` | Prevents double-query; guard result already confirms active driver |

**Key insight:** This phase is 100% plumbing of existing infrastructure. `getBusinessRules()`, `createClient()`, `redirect()`, and Zustand `set()` are the only tools needed.

## Common Pitfalls

### Pitfall 1: test-delivery/page.tsx is a "use client" component
**What goes wrong:** Can't call `redirect()` or `await` Supabase in a client component directly. Applying guard requires refactoring.
**Why it happens:** `test-delivery/page.tsx` was implemented as a pure client component (all state is local, no DB reads). There's no server wrapper.
**How to avoid:** Create a server `page.tsx` that calls `checkSimpleMode()`, then renders `<TestDeliveryClient />` (the existing client logic, renamed). The client file needs `"use client"` at the top.
**Warning signs:** TypeScript error "redirect() was called outside a Server Component" if guard is added without wrapper.

### Pitfall 2: CartStore partialize excludes cutoff from persistence
**What goes wrong:** `cutoffDay`/`cutoffHour` get persisted to IndexedDB across sessions, so old values persist after admin changes the cutoff.
**Why it happens:** `partialize: (state) => ({ items: state.items })` currently only persists items. If cutoff fields are added and partialize is not carefully maintained, they could accidentally get persisted OR not synced on the next page load.
**How to avoid:** Do NOT include `cutoffDay`/`cutoffHour` in the `partialize` function — they should always come from `DeliverySettingsSync` on each page load (server-fresh values). Same pattern as `deliveryFeeCents`/`freeDeliveryThresholdCents` which are also not persisted.
**Warning signs:** Cutoff shows wrong value after admin changes — stale IDB value overriding fresh sync.

### Pitfall 3: Double driver query when guard result is ignored
**What goes wrong:** `checkSimpleMode()` fetches `id + simple_mode`. Then the page's data function also fetches `id + other_fields`. This is two queries to `drivers` when one could suffice.
**Why it happens:** If `checkSimpleMode()` only redirects and returns nothing, each page's existing query re-authenticates from scratch.
**How to avoid:** Return `{ id: driver.id }` from `checkSimpleMode()`. Pages that already re-fetch the driver for additional fields (e.g., earnings needs `deliveries_count, rating_avg`) can still make their own query but using the confirmed `driverId` directly (via `.eq("id", driverId)`).
**Warning signs:** Multiple Supabase queries per page load visible in Supabase dashboard logs.

### Pitfall 4: PublicShell also renders CartDrawer — forgetting to wire it
**What goes wrong:** Cart drawer in the public (unauthenticated / pre-login) context still uses hardcoded defaults because only `CustomerShell` was updated.
**Why it happens:** Both `CustomerShell` and `PublicShell` render `<CartOverlays />` which contains `<CartDrawer />`. Both shells use `DeliverySettingsSync`. Both must receive and pass through `cutoffDay`/`cutoffHour`.
**Warning signs:** Cutoff shows correct values on `/menu` page (customer) but wrong values on homepage (public). Both `src/app/(customer)/layout.tsx` and `src/app/(public)/layout.tsx` call `getBusinessRules()` — confirm both pass cutoff props.

### Pitfall 5: Existing stop detail guard uses type cast instead of shared helper
**What goes wrong:** The existing guard at `/driver/route/[stopId]/page.tsx` uses `(driver as unknown as Record<string, unknown>).simple_mode === true` — a type cast workaround. When refactoring to shared helper, the helper's interface must explicitly include `simple_mode: boolean` in the query return type.
**Why it happens:** The `drivers` table type may not include `simple_mode` in the generated TypeScript types if the migration was added after types were generated.
**How to avoid:** In the shared helper, define a local `interface DriverSimpleModeResult { id: string; simple_mode: boolean; }` and use `.returns<DriverSimpleModeResult[]>()` — same pattern as `DriverWithModeResult` already in the stop detail page.

## Code Examples

Verified patterns from official sources (project codebase):

### Existing simple mode guard (stop detail page)
```typescript
// Source: src/app/(driver)/driver/route/[stopId]/page.tsx lines 56-90
interface DriverWithModeResult {
  id: string;
  simple_mode: boolean;
}

// Get driver (include simple_mode for redirect check)
const { data: driver } = await supabase
  .from("drivers")
  .select("id, simple_mode")
  .eq("user_id", user.id)
  .eq("is_active", true)
  .returns<DriverWithModeResult[]>()
  .single();

if (!driver) {
  redirect("/driver");
}

// Simple mode uses single-stop focus on the route page — redirect away from individual stop pages
if ((driver as unknown as Record<string, unknown>).simple_mode === true) {
  redirect("/driver/route");
}
```

### Existing DeliverySettingsSync pattern (delivery fee sync)
```typescript
// Source: src/components/ui/cart/DeliverySettingsSync.tsx
export function DeliverySettingsSync({
  deliveryFeeCents,
  freeDeliveryThresholdCents,
}: DeliverySettingsSyncProps) {
  useEffect(() => {
    useCartStore.getState().setDeliverySettings(deliveryFeeCents, freeDeliveryThresholdCents);
  }, [deliveryFeeCents, freeDeliveryThresholdCents]);
  return null;
}
```

### Existing setDeliverySettings pattern in cart store
```typescript
// Source: src/lib/stores/cart-store.ts lines 88-91
// Configurable delivery settings (defaults match DB seed values)
deliveryFeeCents: 1500,
freeDeliveryThresholdCents: 10000,
setDeliverySettings: (fee: number, threshold: number) =>
  set({ deliveryFeeCents: fee, freeDeliveryThresholdCents: threshold }),
```

### Existing CustomerLayout calling getBusinessRules()
```typescript
// Source: src/app/(customer)/layout.tsx
const rules = await getBusinessRules();
return (
  <CustomerShell
    deliveryFeeCents={rules.deliveryFeeCents}
    freeDeliveryThresholdCents={rules.freeDeliveryThresholdCents}
    // MISSING: cutoffDay={rules.cutoffDay} cutoffHour={rules.cutoffHour}
  >
    {children}
  </CustomerShell>
);
```

### CartFooter already accepts optional cutoff props
```typescript
// Source: src/components/ui/cart/CartDrawerParts.tsx lines 234-254
interface CartFooterProps {
  onClose: () => void;
  onCheckout: () => void;
  hasBlockingIssues?: boolean;
  showFullCartLink?: boolean;
  /** Cutoff day of week (0=Sun..6=Sat). Defaults to Friday (5). */
  cutoffDay?: number;
  /** Cutoff hour (0-23). Defaults to 15 (3 PM). */
  cutoffHour?: number;
}

export function CartFooter({
  onClose,
  onCheckout,
  hasBlockingIssues = false,
  showFullCartLink,
  cutoffDay = 5,   // <-- USES HARDCODED DEFAULT — needs to come from DB
  cutoffHour = 15, // <-- USES HARDCODED DEFAULT — needs to come from DB
}: CartFooterProps) {
  const gate = useDeliveryGate(cutoffDay, cutoffHour);
  // ...
}
```

### CartContent calls CartFooter without passing cutoff (the gap)
```typescript
// Source: src/components/ui/cart/CartDrawer.tsx lines 117-122
<CartFooter
  onClose={onClose}
  onCheckout={handleCheckout}
  hasBlockingIssues={validation.hasBlockingIssues}
  showFullCartLink={showFullCartLink}
  // MISSING: cutoffDay and cutoffHour — relying on CartFooter's hardcoded defaults
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded constants for cutoff (Friday 3PM) | `getBusinessRules()` with DB-backed cache | Phase 78 | Cart drawer is last holdout — others already wired |
| Inline guard per page | Shared `checkSimpleMode()` helper | This phase | DRY, consistent redirect behavior |

**Deprecated/outdated:**
- CartFooter `cutoffDay = 5, cutoffHour = 15` defaults: These were correct placeholders during Phase 81 when cart store wiring was deferred. Phase 87 closes that deferral.

## Open Questions

1. **Should `checkSimpleMode()` return just `{ id }` or the full driver record?**
   - What we know: Each guarded page currently fetches additional driver fields after auth (earnings needs `deliveries_count, rating_avg`; schedule needs `id, availability_json`; history needs `id, deliveries_count, rating_avg`)
   - What's unclear: Whether combining the guard query with the page-specific query saves enough round-trips to matter
   - Recommendation: Return `{ id: string }` from guard. Pages that need additional fields make a second query using the returned `id`. Simpler interface, cleaner separation of concerns.

2. **Does `useCartStore` `partialize` need updating?**
   - What we know: `partialize: (state) => ({ items: state.items })` only persists items. `deliveryFeeCents` and `freeDeliveryThresholdCents` are NOT in partialize (confirmed from source).
   - What's unclear: Whether TypeScript will complain about new fields on CartStore interface if they're not in CartStore type definition
   - Recommendation: Add `cutoffDay`/`cutoffHour` to the `CartStore` interface in `src/types/cart.ts` (or wherever the type is defined). Do NOT add to partialize.

## Sources

### Primary (HIGH confidence)
- Project codebase direct inspection — all findings verified against actual source files
  - `src/lib/settings/business-rules.ts` — `getBusinessRules()` implementation + `cutoffDay`/`cutoffHour` confirmed
  - `src/components/ui/cart/CartDrawerParts.tsx` — `CartFooter` props interface + hardcoded defaults confirmed
  - `src/components/ui/cart/CartDrawer.tsx` — `CartContent` confirmed not passing cutoff to `CartFooter`
  - `src/components/ui/cart/DeliverySettingsSync.tsx` — sync pattern confirmed
  - `src/lib/stores/cart-store.ts` — `setDeliverySettings` pattern + `partialize` confirmed
  - `src/app/(customer)/layout.tsx` — `getBusinessRules()` call + `CustomerShell` props confirmed
  - `src/app/(public)/layout.tsx` + `PublicShell.tsx` — both render `CartOverlays` via `DeliverySettingsSync`
  - `src/app/(driver)/driver/route/[stopId]/page.tsx` — existing guard template confirmed
  - `src/app/(driver)/driver/earnings/page.tsx` — NO simple mode guard confirmed
  - `src/app/(driver)/driver/schedule/page.tsx` — NO simple mode guard confirmed
  - `src/app/(driver)/driver/history/page.tsx` — NO simple mode guard confirmed
  - `src/app/(driver)/driver/test-delivery/page.tsx` — client component, NO server wrapper, NO guard confirmed
  - `src/lib/auth/driver.ts` — `requireDriver()` pattern (API routes only, not for page guards)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all confirmed from project source, no new packages
- Architecture: HIGH — exact files, line numbers, and gaps identified from codebase
- Pitfalls: HIGH — sourced from direct code inspection (partialize, type cast, double-query, client component)

**Research date:** 2026-03-02
**Valid until:** 60 days (stable internal architecture — no external dependencies)
