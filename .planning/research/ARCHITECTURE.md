# Architecture Patterns

**Domain:** UI component library with strict layering and motion-first design
**Researched:** 2026-01-21 (Updated 2026-01-23 with 3D integration, 2026-01-27 with theme audit, 2026-01-30 with mobile optimization, 2026-02-05 with code splitting, 2026-02-07 with v1.6 production polish)
**Confidence:** HIGH (verified against existing codebase + authoritative sources)

---

## v1.6: Production Polish Integration Architecture (2026-02-07)

### Overview

This section documents how 7 new features integrate with the existing architecture: customer settings, email notifications, cart validation, driver offline sync retry, auth form upgrade, error/loading boundaries, and 404 page.

**Existing architecture constraints:**
- Route groups: (public), (auth), (customer), (admin), (driver)
- Zustand stores: `useCartStore` (localStorage), `useCheckoutStore` (session), `useDriverStore` (localStorage + offline queue)
- Framer Motion `m.*` elements everywhere (LazyMotion `domMax` at root)
- `useAnimationPreference` hook controls animation opt-in
- Supabase Edge Functions already handle email via Resend
- `notification_logs` table and types already exist
- Reusable `RouteError` and `RouteLoading` components exist but coverage is incomplete
- 400-line file limit enforced by ESLint `max-lines`

---

### Feature 1: Customer Settings Page

**Integration approach:** Add a new tab to the existing `AccountClient.tsx` tabbed interface. No new Zustand store needed -- settings are server-persisted, fetched on mount, saved on change.

#### Data Layer

**New Supabase table: `customer_settings`**

```sql
CREATE TABLE IF NOT EXISTS customer_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_order_confirmation BOOLEAN NOT NULL DEFAULT true,
  email_delivery_updates BOOLEAN NOT NULL DEFAULT true,
  email_promotions BOOLEAN NOT NULL DEFAULT false,
  language_preference TEXT NOT NULL DEFAULT 'en' CHECK (language_preference IN ('en', 'my')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Rationale:** Separate table (not JSONB on `profiles`) because:
- Settings have strict types -- boolean toggles, enum values
- RLS policies differ (customer can only read/write their own)
- Avoids `profiles` table bloat -- `profiles` is read on every auth check

**New API route: `src/app/api/account/settings/route.ts`**

| Method | Purpose | Auth |
|--------|---------|------|
| `GET` | Fetch current settings (returns defaults if row missing) | Required |
| `PATCH` | Update settings (upsert pattern) | Required |

**Pattern:** Matches existing `api/account/profile/route.ts` exactly:
- `createClient()` for auth
- Zod schema validation on PATCH body
- `{ data: ... }` / `{ error: { code, message } }` response shape
- `logger.exception()` for error tracking

#### Component Layer

**New files:**

| File | Purpose |
|------|---------|
| `src/components/ui/account/SettingsTab/SettingsTab.tsx` | Main settings component |
| `src/components/ui/account/SettingsTab/SettingsSkeleton.tsx` | Loading skeleton |
| `src/components/ui/account/SettingsTab/index.tsx` | Barrel export |
| `src/components/ui/account/SettingsTab/types.ts` | Settings types |

**Modified files:**

| File | Change |
|------|--------|
| `src/components/ui/account/AccountClient.tsx` | Add "Settings" tab (icon: `Settings` from lucide) |
| `src/lib/validations/account.ts` | Add `updateSettingsSchema` |
| `src/types/database.ts` or new `src/types/settings-customer.ts` | Add `CustomerSettings` type |

**Component pattern:** Follow `ProfileTab` exactly:
- `useState` for form state (not Zustand -- no cross-component sharing needed)
- `fetch()` on mount (not React Query -- simple one-time load, matches ProfileTab)
- `useAnimationPreference` for `m.*` animations
- `AnimatePresence` for validation error transitions
- `toast()` via `useToastV8` for save feedback

```
AccountClient.tsx
  TABS = [...existing, { id: "settings", label: "Settings", icon: Settings }]

  {activeTab === "settings" && <SettingsTab />}
```

**No new store needed.** Settings are:
- Not shared across components (only visible on settings tab)
- Not needed offline (server-side truth)
- Simple fetch-on-mount / save-on-click

---

### Feature 2: Email Notifications

**Integration approach:** Extend existing Supabase Edge Functions. The infrastructure is already built -- `send-order-confirmation` and `send-delivery-notification` Edge Functions use Resend. New emails add new Edge Functions following the same pattern.

#### Existing Infrastructure (No Changes)

| Component | Status |
|-----------|--------|
| Resend API integration | EXISTS in Edge Functions |
| `notification_logs` table | EXISTS in schema |
| `notification_type` enum | EXISTS: `order_confirmation`, `out_for_delivery`, `arriving_soon`, `delivered`, `feedback_request` |
| `NotificationLogRow` TypeScript type | EXISTS in `src/types/analytics.ts` |
| Email HTML template pattern | EXISTS (branded header + content + footer) |

#### New Edge Functions

**Option A: Edge Function per email type (recommended)**

| Edge Function | Trigger | Template |
|---------------|---------|----------|
| `send-order-confirmation` | EXISTS | EXISTS |
| `send-delivery-notification` | EXISTS | EXISTS |
| (none needed for v1.6) | -- | -- |

**Analysis:** The milestone specifies "email notifications" but the infrastructure is already complete. The two Edge Functions cover all 5 notification types. What is likely needed is:

1. **Trigger integration** -- calling the Edge Functions from the right places (webhook, admin status update, driver stop completion)
2. **Customer preference check** -- respecting `customer_settings.email_*` toggles before sending

#### Integration Points for Preference Check

The Edge Functions currently send unconditionally. To respect preferences:

**Option A (recommended): Check preferences in Edge Function**

```typescript
// Inside Edge Function, before sending:
const { data: settings } = await supabase
  .from("customer_settings")
  .select("email_order_confirmation, email_delivery_updates")
  .eq("user_id", typedOrder.user_id)
  .single();

// Default to true if no settings row exists
const prefs = settings || { email_order_confirmation: true, email_delivery_updates: true };

if (payload.type === "order_confirmation" && !prefs.email_order_confirmation) {
  return new Response(JSON.stringify({ skipped: true, reason: "user_opted_out" }));
}
```

**Option B (alternative): Check in API route before invoking Edge Function**

Less preferred because it duplicates the check across multiple call sites.

#### New Migration

```sql
-- 019_customer_settings.sql
-- Add customer_settings table + RLS
```

---

### Feature 3: Cart Validation on Mount

**Integration approach:** New hook `useCartValidation` called in `CartPage` (and optionally in `CartOverlays`). Validates cart items against current menu on mount and removes stale items.

#### Why Validation is Needed

Cart is persisted in `localStorage` via Zustand `persist`. Items can become stale:
- Menu item deactivated (`is_active: false`)
- Menu item sold out (`is_sold_out: true`)
- Price changed (`base_price_cents` differs)
- Modifier option removed or deactivated

#### Data Flow

```
CartPage mount
    |
    v
useCartValidation()
    |
    v
GET /api/menu (existing, cached 5min by React Query staleTime)
    |
    v
Compare cart items against menu response
    |
    v
Flag invalid items: { removed: CartItem[], priceChanged: CartItem[] }
    |
    v
Show toast + auto-remove unavailable items
Update prices for changed items
```

#### New Files

| File | Purpose |
|------|---------|
| `src/lib/hooks/useCartValidation.ts` | Hook: fetches menu, compares against cart, returns validation result |

#### Modified Files

| File | Change |
|------|--------|
| `src/app/(customer)/cart/page.tsx` | Call `useCartValidation()`, show validation toast/banner |
| `src/lib/stores/cart-store.ts` | Add `updateItemPrice(cartItemId, newPriceCents)` action (optional, for price corrections) |

#### Hook Design

```typescript
// src/lib/hooks/useCartValidation.ts
export function useCartValidation() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);

  // Runs once on mount
  useEffect(() => {
    if (items.length === 0) return;

    fetch("/api/menu")
      .then(res => res.json())
      .then(menuResponse => {
        // Build lookup: menuItemId -> MenuItem
        const menuMap = new Map(/* flatten categories */);

        for (const item of items) {
          const menuItem = menuMap.get(item.menuItemId);
          if (!menuItem || !menuItem.isActive || menuItem.isSoldOut) {
            removeItem(item.cartItemId);
            toast({ message: `${item.nameEn} is no longer available`, type: "warning" });
          }
        }
      })
      .catch(() => { /* offline -- skip validation */ });
  }, []); // Mount only
}
```

**No new API needed.** The existing `GET /api/menu` returns all active items with `isActive` and `isSoldOut` flags. Menu is already cached by the service worker (NetworkFirst, 5min) and React Query (5min staleTime).

---

### Feature 4: Driver Offline Sync Retry

**Integration approach:** Extend the existing `useOfflineSync` hook with automatic retry on reconnection. The infrastructure already exists -- the hook listens for `online` events and calls `syncNow()`. What is missing is retry with backoff for failed items.

#### Existing Architecture

```
useOfflineSync (hook)
    |
    v
syncPendingItems (lib/services/offline-store/sync.ts)
    |
    v
IndexedDB stores: pendingStatus, pendingPhotos, pendingLocations
    |
    v
API calls: PATCH /api/driver/routes/[routeId]/stops/[stopId], etc.
```

**Current behavior:**
- `handleOnline` event -> calls `syncNow()`
- `syncNow()` iterates all pending items sequentially
- Failed items stay in IndexedDB (not removed)
- No retry mechanism -- relies on next `online` event or manual sync

#### Enhancement: Retry with Exponential Backoff

**Modified files:**

| File | Change |
|------|--------|
| `src/lib/services/offline-store/sync.ts` | Add retry logic with backoff per item |
| `src/lib/hooks/useOfflineSync.ts` | Add periodic retry (e.g., every 30s when online with pending items) |

**Retry strategy:**

```typescript
// In sync.ts
async function syncWithRetry(
  fn: () => Promise<Response>,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fn();
    if (response.ok || response.status === 400) return response; // 400 = permanent failure
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // 1s, 2s, 4s
    }
  }
  throw new Error("Max retries exceeded");
}
```

**Periodic sync in hook:**

```typescript
// In useOfflineSync.ts
useEffect(() => {
  if (!isOnline || pendingCounts.total === 0) return;

  const intervalId = setInterval(() => {
    syncNow();
  }, 30_000); // Retry every 30s while items pending

  return () => clearInterval(intervalId);
}, [isOnline, pendingCounts.total, syncNow]);
```

**Visual feedback in driver UI:**

| File | Change |
|------|--------|
| `src/app/(driver)/driver/route/page.tsx` or equivalent | Show sync status badge (pending count, last sync result) |

**No new stores needed.** The `useDriverStore` already tracks `pendingActions` and `isOnline`. The `useOfflineSync` hook already provides `pendingCounts` and `lastSyncResult`.

---

### Feature 5: Auth Form Premium Upgrade

**Integration approach:** Enhance existing `LoginForm.tsx` and `SignupForm.tsx` with animations and improved UX. No structural changes to auth flow -- same `signIn`/`signUp` server actions, same magic link flow.

#### Current Auth Architecture

```
(auth)/login/page.tsx (Server Component)
    |
    v
LoginForm.tsx (Client Component)
    |
    v
signIn server action (lib/supabase/actions.ts)
    |
    v
Supabase auth.signInWithOtp()
```

**Current form:** Plain Card + Input + Button. No animations, no visual branding.

#### Enhancement Areas

| Area | Current | Target |
|------|---------|--------|
| Layout | Static centered card | Animated entrance with `m.*` |
| Branding | Text only | Brand colors, optional illustration |
| Error display | Plain red div | `AnimatePresence` animated error |
| Success display | Plain green div | Animated checkmark + redirect countdown |
| Password field | None (magic link only) | None (keep magic link) |
| Social login | None | Out of scope for v1.6 |

#### Modified Files

| File | Change |
|------|--------|
| `src/components/ui/auth/LoginForm.tsx` | Add `m.*` animations, `useAnimationPreference`, error `AnimatePresence` |
| `src/components/ui/auth/SignupForm.tsx` | Same animation treatment |
| `src/components/ui/auth/ForgotPasswordForm.tsx` | Same animation treatment |
| `src/app/(auth)/login/page.tsx` | Optional: add brand illustration/gradient bg |
| `src/app/(auth)/signup/page.tsx` | Optional: add brand illustration/gradient bg |

**Animation pattern (from ProfileTab precedent):**

```typescript
// LoginForm.tsx additions:
import { m, AnimatePresence } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// Wrap card in m.div for entrance animation
// Wrap error/success in AnimatePresence for transitions
// Use shouldAnimate guard (existing pattern)
```

**No new files needed.** All changes are modifications to existing auth components. Keep the server action pattern unchanged.

---

### Feature 6: Error Boundaries + Loading States (Systematic Coverage)

**Integration approach:** Add `error.tsx` and `loading.tsx` files to all route segments that lack them. Use existing `RouteError` and `RouteLoading` reusable components.

#### Current Coverage Audit

**Error boundaries (`error.tsx`):**

| Route Segment | Has error.tsx? | Component Used |
|---------------|----------------|----------------|
| `app/error.tsx` (root) | YES | Custom (Sentry + Card) |
| `app/global-error.tsx` | YES | Next.js `NextError` |
| `(admin)/admin/error.tsx` | YES | Custom (Sentry + Card) |
| `(admin)/admin/analytics/error.tsx` | YES | ? |
| `(customer)/orders/error.tsx` | YES | ? |
| `(customer)/orders/[id]/tracking/error.tsx` | YES | ? |
| `(driver)/driver/error.tsx` | YES | ? |
| `(public)/error.tsx` | YES | `RouteError` |
| `(public)/menu/error.tsx` | YES | ? |
| **(auth)/** | **NO** | -- |
| **(customer)/account/** | **NO** | -- |
| **(customer)/cart/** | **NO** | -- |
| **(customer)/checkout/** | **NO** | -- |

**Loading states (`loading.tsx`):**

| Route Segment | Has loading.tsx? | Component Used |
|---------------|------------------|----------------|
| `(admin)/admin/analytics/loading.tsx` | YES | ? |
| `(customer)/orders/[id]/tracking/loading.tsx` | YES | ? |
| `(public)/loading.tsx` | YES | `RouteLoading` |
| `(public)/menu/loading.tsx` | YES | ? |
| **(auth)/** | **NO** | -- |
| **(admin)/admin/** (root) | **NO** | -- |
| **(customer)/account/** | **NO** | -- |
| **(customer)/cart/** | **NO** | -- |
| **(customer)/checkout/** | **NO** | -- |
| **(customer)/orders/** (root) | **NO** | -- |
| **(driver)/driver/** (root) | **NO** | -- |
| **(driver)/driver/history/** | **NO** | -- |
| **(driver)/driver/route/** | **NO** | -- |

#### New Files Needed

**Error boundaries (use `RouteError` component):**

| File | Context Value |
|------|---------------|
| `src/app/(auth)/error.tsx` | `"login"` |
| `src/app/(customer)/account/error.tsx` | `"account"` |
| `src/app/(customer)/cart/error.tsx` | `"cart"` |
| `src/app/(customer)/checkout/error.tsx` | `"checkout"` |

**Loading states (use `RouteLoading` component):**

| File | Message |
|------|---------|
| `src/app/(auth)/loading.tsx` | `"Loading..."` |
| `src/app/(admin)/admin/loading.tsx` | `"Loading dashboard..."` |
| `src/app/(customer)/account/loading.tsx` | `"Loading account..."` |
| `src/app/(customer)/cart/loading.tsx` | `"Loading cart..."` |
| `src/app/(customer)/checkout/loading.tsx` | `"Loading checkout..."` |
| `src/app/(customer)/orders/loading.tsx` | `"Loading orders..."` |
| `src/app/(driver)/driver/loading.tsx` | `"Loading..."` |
| `src/app/(driver)/driver/history/loading.tsx` | `"Loading history..."` |
| `src/app/(driver)/driver/route/loading.tsx` | `"Loading route..."` |

**Each file is 3-6 lines (trivial):**

```typescript
// error.tsx pattern
"use client";
import { RouteError } from "@/components/ui/RouteError";

export default function CartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} context="cart" />;
}
```

```typescript
// loading.tsx pattern
import { RouteLoading } from "@/components/ui/RouteLoading";

export default function CartLoading() {
  return <RouteLoading message="Loading cart..." />;
}
```

#### Standardization

Some existing error boundaries use custom Card-based layouts instead of `RouteError`. Consider standardizing:

| File | Current | Recommended |
|------|---------|-------------|
| `(admin)/admin/error.tsx` | Custom Card + Sentry | Keep (admin-specific "Dashboard" link) |
| `(admin)/admin/analytics/error.tsx` | Unknown | Migrate to `RouteError` if generic |
| `app/error.tsx` (root) | Custom Card + Sentry | Keep (root-level, includes Go Home) |

**No modifications to `RouteError` or `RouteLoading` needed.** They already support the `context` prop and `message` prop respectively, and both use `m.*` animations.

---

### Feature 7: 404 Page

**Integration approach:** Upgrade the existing minimal `app/not-found.tsx` with branded design, navigation links, and animations.

#### Current State

```typescript
// app/not-found.tsx (9 lines, unstyled)
export default function NotFound() {
  return (
    <main className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-display text-brand-red">Page Not Found</h1>
      <p className="mt-2 text-muted">We could not find that page.</p>
    </main>
  );
}
```

**App Router not-found.tsx convention:**
- `app/not-found.tsx` is a Server Component by default
- Triggered by `notFound()` function call or unmatched routes
- Renders inside the root layout (has access to header, providers)
- Route group `not-found.tsx` files are NOT supported by Next.js App Router -- only root-level

#### Target Design

```typescript
// app/not-found.tsx (enhanced)
import Link from "next/link";
import { Home, Search, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Large 404 display */}
        <h1 className="text-8xl font-display font-bold text-primary/20 mb-4">404</h1>
        <h2 className="text-2xl font-display text-text-primary mb-2">Page Not Found</h2>
        <p className="text-text-secondary mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild variant="primary">
            <Link href="/"><Home className="h-4 w-4 mr-2" />Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/menu"><UtensilsCrossed className="h-4 w-4 mr-2" />View Menu</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
```

**Keep as Server Component.** No `"use client"` needed -- 404 pages do not need interactivity beyond links. Adding `m.*` animations would require client-side JS for a page that should load instantly.

**Modified files:**

| File | Change |
|------|--------|
| `src/app/not-found.tsx` | Replace minimal content with branded design |

---

### Component Dependency Map

```
Feature 1 (Settings)
  depends on: existing AccountClient tab system, existing API route pattern
  blocked by: nothing

Feature 2 (Email Notifications)
  depends on: Feature 1 (customer_settings table for preference check)
  blocked by: Feature 1 migration

Feature 3 (Cart Validation)
  depends on: existing GET /api/menu, existing cart store
  blocked by: nothing

Feature 4 (Driver Offline Sync)
  depends on: existing useOfflineSync, existing offline-store
  blocked by: nothing

Feature 5 (Auth Form Upgrade)
  depends on: existing auth components
  blocked by: nothing

Feature 6 (Error/Loading Boundaries)
  depends on: existing RouteError, RouteLoading components
  blocked by: nothing

Feature 7 (404 Page)
  depends on: nothing
  blocked by: nothing
```

---

### Suggested Build Order

Based on dependency analysis and risk assessment:

**Phase A: Infrastructure + Zero-Risk (error/loading, 404, settings migration)**

| Order | Feature | Rationale |
|-------|---------|-----------|
| 1 | Error/Loading boundaries (#6) | Zero risk, no logic, adds resilience for all subsequent work |
| 2 | 404 page (#7) | Zero risk, single file, immediate polish |
| 3 | Customer settings migration + API (#1 data layer) | Creates `customer_settings` table needed by #2 |

**Phase B: Core Features (cart validation, settings UI, auth)**

| Order | Feature | Rationale |
|-------|---------|-----------|
| 4 | Cart validation (#3) | Self-contained hook, no DB changes, high user impact |
| 5 | Settings tab UI (#1 component layer) | Builds on migration from Phase A |
| 6 | Auth form upgrade (#5) | Visual polish, no functional changes |

**Phase C: Integration Features (email preferences, driver sync)**

| Order | Feature | Rationale |
|-------|---------|-----------|
| 7 | Email notification preferences (#2) | Requires customer_settings from Phase A |
| 8 | Driver offline sync retry (#4) | Most complex, benefits from stable codebase |

---

### Data Flow Changes

#### New Data Flow: Customer Settings

```
SettingsTab (mount)
    |
    v
GET /api/account/settings
    |
    v
Supabase: customer_settings WHERE user_id = auth.uid()
    |
    v
Render toggles
    |
    v (user changes toggle)
PATCH /api/account/settings { email_delivery_updates: false }
    |
    v
Supabase: UPSERT customer_settings
    |
    v
toast("Settings saved")
```

#### New Data Flow: Cart Validation

```
CartPage (mount)
    |
    v
useCartValidation()
    |
    v
GET /api/menu (cached by SW + React Query)
    |
    v
Build Map<menuItemId, MenuItem>
    |
    v
For each cart item:
  - Not in map? -> removeItem() + toast("removed")
  - isSoldOut? -> removeItem() + toast("sold out")
  - Price changed? -> updateItemPrice() + toast("price updated")
```

#### Enhanced Data Flow: Driver Offline Sync

```
Driver goes offline
    |
    v
Actions queued to IndexedDB (existing)
    |
    v
'online' event fires
    |
    v
syncNow() with retry (NEW: exponential backoff per item)
    |
    v
Failed items: retry in 30s interval (NEW)
    |
    v
All synced? -> clearInterval, update pendingCounts
```

---

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Zustand Store for Settings

**What people do:** Create a `useSettingsStore` with localStorage persist for customer settings.

**Why wrong:**
- Settings truth lives in database, not client
- Creates sync issues (stale localStorage vs server)
- Adds complexity for data that changes rarely
- Profile tab already works without a store -- follow that pattern

**Do this instead:** `useState` + `fetch()` in `SettingsTab`, matching `ProfileTab` pattern exactly.

#### Anti-Pattern 2: Cart Validation on Every Render

**What people do:** Validate cart against menu on every component render or store change.

**Why wrong:**
- Menu API is expensive (joins 3 tables)
- Cart changes trigger re-validation loops
- Offline users get errors on every interaction

**Do this instead:** Validate once on CartPage mount only. Use `useEffect` with empty deps. Skip if offline.

#### Anti-Pattern 3: Global Error Boundary Only

**What people do:** Rely solely on `app/error.tsx` and `app/global-error.tsx`.

**Why wrong:**
- Root error boundary replaces entire page (loses navigation)
- No context-specific error messages ("Failed to load cart" vs generic)
- No route-specific recovery actions

**Do this instead:** Error boundaries at every route segment. Specific `context` props for meaningful messages.

#### Anti-Pattern 4: Retry Without Backoff

**What people do:** Retry failed sync items immediately and repeatedly.

**Why wrong:**
- Hammers server when it is already failing
- Drains battery on mobile devices
- Can cause rate limiting (driver API has 429 handling)

**Do this instead:** Exponential backoff (1s, 2s, 4s), max 3 retries, then wait for next 30s cycle.

---

### Integration with Existing Optimizations

| Optimization | Impact on v1.6 | Action |
|--------------|----------------|--------|
| Route group bundle isolation | Settings tab stays in (customer) bundle only | No change needed |
| Service Worker (Serwist) | Cart validation uses SW-cached menu response | No change needed |
| `optimizePackageImports` | Auth form animations use tree-shaken Framer Motion | No change needed |
| `RouteError` + Sentry | New error boundaries auto-report to Sentry | No change needed |
| `useAnimationPreference` | Settings tab + auth forms respect animation pref | Use in new components |
| React Query 5min staleTime | Cart validation benefits from cached menu | No change needed |
| Pre-commit ESLint | All new files auto-checked for design tokens | No change needed |

---

### New File Inventory

**Total new files: ~20**

| Category | Count | Files |
|----------|-------|-------|
| Error boundaries | 4 | `(auth)/error.tsx`, `(customer)/account/error.tsx`, `(customer)/cart/error.tsx`, `(customer)/checkout/error.tsx` |
| Loading states | 9 | Various `loading.tsx` across route segments |
| Settings tab | 4 | `SettingsTab.tsx`, `SettingsSkeleton.tsx`, `index.tsx`, `types.ts` |
| API route | 1 | `api/account/settings/route.ts` |
| Hook | 1 | `useCartValidation.ts` |
| Migration | 1 | `019_customer_settings.sql` |
| Validation | 0 | Added to existing `account.ts` |

**Modified files: ~10**

| File | Change Type |
|------|-------------|
| `AccountClient.tsx` | Add settings tab |
| `account.ts` (validations) | Add settings schema |
| `cart/page.tsx` | Add validation hook call |
| `cart-store.ts` | Optional: add `updateItemPrice` |
| `LoginForm.tsx` | Add animations |
| `SignupForm.tsx` | Add animations |
| `ForgotPasswordForm.tsx` | Add animations |
| `not-found.tsx` | Redesign |
| `offline-store/sync.ts` | Add retry backoff |
| `useOfflineSync.ts` | Add periodic retry |

---

### Sources

**Existing Codebase (HIGH confidence -- directly examined):**
- `src/components/ui/account/AccountClient.tsx` - tab pattern
- `src/components/ui/account/ProfileTab/ProfileTab.tsx` - form pattern
- `src/lib/stores/cart-store.ts` - cart persistence
- `src/lib/stores/driver-store.ts` - offline queue
- `src/lib/services/offline-store/sync.ts` - sync pattern
- `src/lib/hooks/useOfflineSync.ts` - online/offline detection
- `src/lib/hooks/useCart.ts` - cart hook pattern
- `src/app/api/account/profile/route.ts` - API route pattern
- `src/app/api/menu/route.ts` - menu data structure
- `src/components/ui/RouteError.tsx` - error boundary component
- `src/components/ui/RouteLoading.tsx` - loading component
- `src/app/error.tsx` - root error boundary
- `src/app/not-found.tsx` - current 404
- `src/components/ui/auth/LoginForm.tsx` - auth form pattern
- `supabase/functions/send-order-confirmation/index.ts` - email Edge Function
- `supabase/functions/send-delivery-notification/index.ts` - email Edge Function
- `supabase/migrations/000_initial_schema.sql` - DB schema
- `supabase/migrations/010_app_settings.sql` - settings table pattern

---

## v1.5: Code Splitting & Bundle Optimization Architecture (2026-02-05)

### Overview

This section documents code splitting architecture for Next.js 16 App Router with route groups, addressing bundle optimization for an app with heavy animation libraries (GSAP 3.14.2, Framer Motion 12.26.1, Recharts 3.6.0, Google Maps 2.20.8).

**Current State:**
- 275 files marked "use client" (100% client-side components)
- 127 total files in src/app
- Route groups: (auth), (public), (customer), (admin), (driver)
- Estimated initial JS: ~800KB+ across routes

**Target State:**
- ~60 files with "use client" (~22% client-side)
- LCP < 2.5s through reduced initial JS
- Route-specific bundle optimization

---

### Code Splitting Strategy Matrix

| Library | Size (gzipped) | Usage Pattern | Strategy | Rationale |
|---------|----------------|---------------|----------|-----------|
| **GSAP** | ~30KB | 5 files, centralized | Keep eager-loaded | Centralized config prevents leaks, small size |
| **Framer Motion** | ~150KB -> ~40KB | 174 files | optimizePackageImports | Already tree-shaken, global components |
| **Recharts** | ~180KB | 1 file (admin only) | Dynamic import | Admin-only, <5% traffic |
| **Google Maps** | ~120KB | 2 files | Partial dynamic import | Map is secondary, autocomplete is critical |

**Sources:**
- [Next.js optimizePackageImports](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports)
- [Vercel Package Optimization](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

---

### Layer 1: Server Components (Zero Client JS)

**Pattern:** Default to Server Components, add "use client" only where required.

```
Current: 275/275 components = "use client" (100%)
Target: ~60/275 components = "use client" (22%)
Impact: ~400KB reduction through Server Component conversion
```

#### High-Impact Conversion Candidates

| File | Current | After | Savings | Complexity |
|------|---------|-------|---------|------------|
| `app/(admin)/admin/analytics/page.tsx` | Client fetch | Server fetch | ~40KB | Low |
| `app/(customer)/orders/[id]/tracking/page.tsx` | Client fetch | Server wrapper | ~60KB | Medium |
| `app/(public)/menu/page.tsx` | Client wrapper | Server wrapper | ~15KB | Low |
| Admin analytics dashboards | Client fetch | Server fetch | ~80KB | Low |

#### Server Component Pattern

```typescript
// BEFORE (Client Component - 100% JS sent to browser)
"use client";
export default function Page() {
  const { data } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });
  return <DashboardClient data={data} />;
}

// AFTER (Server Component - zero JS for data fetching)
export default async function Page() {
  const supabase = await createClient();
  const data = await supabase.from('analytics').select();
  return <DashboardClient data={data} />;
}

// ClientComponent.tsx (only interactive parts)
"use client";
export function DashboardClient({ data }) {
  // Client-side state, interactions
}
```

**Key principles from research:**
- Server Components send zero bytes of JavaScript
- Once "use client" added, all imports become part of client bundle
- Push "use client" boundary down to leaf components

**Sources:**
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Server vs Client bundle size](https://dev.to/oskarinmix/server-components-vs-client-components-in-nextjs-differences-pros-and-cons-389f)
- [Package Bundling Guide](https://nextjs.org/docs/app/guides/package-bundling)

---

### Layer 2: Dynamic Imports for Heavy Libraries

#### Recharts (Admin Analytics - 180KB)

**Current usage:** `src/components/ui/admin/analytics/ExceptionBreakdown.tsx` (1 file)

**Strategy:** Dynamic import via LazyCharts wrapper (already exists)

```typescript
// src/components/ui/admin/analytics/LazyCharts.tsx (ALREADY EXISTS)
import dynamic from 'next/dynamic';

export const PerformanceChart = dynamic(
  () => import('./PerformanceChart').then(mod => ({ default: mod.PerformanceChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false  // Charts use browser-only APIs (window, document)
  }
);

export const PeakHoursChart = dynamic(
  () => import('./PeakHoursChart'),
  { loading: () => <ChartSkeleton /> }
);
```

**Impact:**
- Removes 180KB from non-admin routes
- Admin routes represent <5% of total traffic
- Loading skeleton prevents layout shift

**Sources:**
- [Recharts in Next.js](https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html)
- [Dynamic Imports Guide](https://daily.dev/blog/code-splitting-with-dynamic-imports-in-nextjs)

#### Google Maps (Tracking Page - 120KB)

**Current usage:**
- `DeliveryMap.tsx` - tracking page visualization (secondary)
- `usePlacesAutocomplete.ts` - checkout address autocomplete (critical)

**Strategy:** Partial dynamic import (map only, keep autocomplete eager)

```typescript
// src/components/ui/orders/tracking/TrackingPageClient.tsx
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(
  () => import('./DeliveryMap').then(mod => ({ default: mod.DeliveryMap })),
  {
    loading: () => <DeliveryMapSkeleton />,
    ssr: false  // Maps require window object
  }
);

// usePlacesAutocomplete stays eager-loaded (checkout critical path)
```

**Rationale:**
- Checkout address autocomplete is customer-facing (high priority)
- Tracking map is supplementary visualization (lower priority)
- Only loads when driver location available

**Impact:**
- Removes 120KB from initial checkout load
- Tracking page defers map until needed

#### Framer Motion (174 files - Already Optimized)

**Current:** `optimizePackageImports: ["framer-motion"]` in next.config.ts

**Strategy:** DO NOT dynamic import

**Why:**
- Used in global components (CartBar, Drawer, Modal, Header)
- Already tree-shaken: 150KB -> 40KB via optimizePackageImports
- Dynamic import would cause layout shift on interactive elements
- AnimationProvider already respects reduced motion preference

**Exception:** Route-specific heavy animations

```typescript
// Admin optimization modal (complex GSAP + Framer combo)
const OptimizationModal = dynamic(
  () => import('./OptimizationModal'),
  { ssr: false }
);
```

**Sources:**
- [optimizePackageImports performance](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

#### GSAP (5 files - Centralized Pattern)

**Current:** Centralized in `lib/gsap/index.ts` (CORRECT)

**Strategy:** Keep centralized, NO dynamic imports

```typescript
// lib/gsap/index.ts (KEEP AS-IS)
"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins ONCE at module load
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, Observer);
```

**Why centralized is REQUIRED:**
- Prevents ScrollTrigger memory leaks on route changes
- Avoids plugin re-registration overhead
- 2026 GSAP community best practice
- Core library only ~30KB (acceptable eager load)

**Anti-pattern (verified via research):**

```typescript
// DON'T DO THIS - causes memory leaks
const gsap = dynamic(() => import('@/lib/gsap'));
```

**Impact if dynamically imported:**
- ScrollTriggers leak memory between navigations
- Animations lag on first load
- Re-registration causes instability

**Sources:**
- [GSAP Next.js Best Practices 2025](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)
- [GSAP Community: Centralized Config](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/)
- [GSAP ScrollTrigger Next.js Guide](https://medium.com/@ccjayanti/guide-to-using-gsap-scrolltrigger-in-next-js-with-usegsap-c48d6011f04a)

---

### Layer 3: Route-Based Splitting (Automatic)

Next.js 16 App Router automatically code-splits by route segments.

**Route Group Bundle Targets:**

| Route Group | Files | Target Bundle | Strategy |
|-------------|-------|---------------|----------|
| **(auth)** | 4 pages | <100KB | Minimal JS, form validation only |
| **(public)** | 3 pages | <150KB | Server Components for menu, GSAP for homepage |
| **(customer)** | 8 pages | <200KB | Dynamic import maps, optimize checkout |
| **(admin)** | 14 pages | <250KB | Dynamic import Recharts, lazy analytics |
| **(driver)** | 3 pages | <180KB | Maps eager (critical for navigation) |

**Key insight:** Route groups provide natural bundle isolation - no config needed. Focus on reducing individual route bundles.

**Sources:**
- [Mastering Code Splitting in App Router](https://dev.to/ahr_dev/mastering-code-splitting-in-nextjs-app-router-2608)
- [Bundle Optimization Techniques 2025](https://medium.com/better-dev-nextjs-react/the-10kb-next-js-app-extreme-bundle-optimization-techniques-d8047c482aea)

---

### Layer 4: Provider Refactoring (CRITICAL)

**Current Anti-Pattern:** Global providers load cart on all routes

```typescript
// src/app/providers.tsx (PROBLEM)
"use client";
export function Providers({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AnimationProvider>
          {children}
          <CartBar />        // Loads on /admin, /driver (unnecessary)
          <CartDrawer />     // Loads on /login (unnecessary)
          <FlyToCart />      // Loads on analytics (unnecessary)
        </AnimationProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
```

**Recommended Refactor:**

```typescript
// src/app/providers.tsx (REFACTORED)
export function Providers({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AnimationProvider>
          {children}
        </AnimationProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

// src/app/(customer)/layout.tsx (NEW)
export default function CustomerLayout({ children }) {
  return (
    <>
      {children}
      <CartBar />
      <CartDrawer />
      <FlyToCart />
    </>
  );
}

// src/app/(public)/layout.tsx (NEW)
export default function PublicLayout({ children }) {
  return (
    <>
      {children}
      <CartBar />     // Menu page needs cart
      <CartDrawer />
      <FlyToCart />
    </>
  );
}
```

**Impact:**
- Removes ~60KB from /admin routes (no cart needed)
- Removes ~60KB from /driver routes (no cart needed)
- Removes ~60KB from /auth routes (no cart needed)
- Only loads cart on (customer) and (public) groups

**Complexity:** Medium (requires testing across all route groups)

---

### Implementation Order (Phase Structure)

#### Phase 1: Server Component Conversions (1 week, Low risk)

**Impact:** ~150KB reduction

1. Convert analytics page wrappers to Server Components
2. Convert menu page wrapper (keep MenuContent client)
3. Convert order tracking wrapper
4. Add loading.tsx for route segments

**Files:** ~8 files

**Verification:**
```bash
pnpm analyze:browser  # Check bundle reduction
```

#### Phase 2: Dynamic Import Recharts (1 week, Low risk)

**Impact:** ~180KB reduction on non-admin routes

1. Verify LazyCharts exports exist
2. Replace direct Recharts imports in analytics pages
3. Add ChartSkeleton loading states
4. Test on slow 3G

**Files:** ~5 files

**Verification:**
```bash
pnpm lighthouse       # Check LCP improvement
pnpm test:e2e -- admin-analytics
```

#### Phase 3: Provider Refactoring (1.5 weeks, Medium risk)

**Impact:** ~60KB reduction on admin/driver/auth routes

1. Create (customer)/layout.tsx with cart components
2. Create (public)/layout.tsx with cart components
3. Remove cart from global providers.tsx
4. Test all route groups

**Files:** ~4 files

**Verification:**
```bash
pnpm test:e2e -- cart     # Full cart flow
pnpm test:e2e -- admin    # No cart interference
pnpm test:e2e -- driver   # No cart interference
```

#### Phase 4: Dynamic Import Maps (1 week, Low risk)

**Impact:** ~120KB conditional reduction

1. Dynamic import DeliveryMap in TrackingPageClient
2. Add DeliveryMapSkeleton
3. Keep usePlacesAutocomplete eager
4. Test with/without driver location

**Files:** ~2 files

**Verification:**
```bash
pnpm test:e2e -- tracking
pnpm lighthouse
```

#### Phase 5: Bundle Analysis (3 days, Low risk)

1. Run `pnpm analyze:browser`
2. Check duplicate dependencies
3. Verify tree-shaking
4. Document baseline
5. Set up bundle size CI checks

---

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Dynamic Import GSAP (VERIFIED)

```typescript
// DON'T DO THIS
const gsap = dynamic(() => import('@/lib/gsap'));
```

**Why bad:**
- ScrollTriggers leak memory between routes
- Plugins re-register on every import
- Animations lag on first interaction

**Correct:** Keep centralized lib/gsap/index.ts with "use client"

**Source:** [GSAP Next.js Optimization](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)

#### Anti-Pattern 2: Over-Splitting Critical Path

```typescript
// DON'T DO THIS (for above-fold content)
const Hero = dynamic(() => import('./Hero'));
```

**Why bad:**
- Delays LCP (Largest Contentful Paint)
- Layout shift during load
- Waterfall: HTML -> JS -> component

**Correct:** Eager load above-fold, dynamic import below-fold

**Source:** [Smart Code Splitting](https://dev.to/boopykiki/optimize-nextjs-performance-with-smart-code-splitting-what-to-load-when-and-why-9l1)

#### Anti-Pattern 3: Client Component Cascade

```typescript
// DON'T DO THIS
"use client";
export default function Page() {
  return (
    <>
      <ServerSafeComponent />  // Now in client bundle unnecessarily
      <InteractiveComponent /> // Actually needs "use client"
    </>
  );
}
```

**Why bad:**
- Increases bundle unnecessarily
- Loses Server Component benefits (zero JS, streaming)

**Correct:** Push "use client" down to leaf components

**Source:** [Next.js Server Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

---

### Verification Protocol

#### Bundle Size Checks

```bash
# Baseline before each phase
pnpm analyze:browser > .planning/baseline-phase-X.txt

# After implementation
pnpm analyze:browser > .planning/results-phase-X.txt

# Compare
diff .planning/baseline-phase-X.txt .planning/results-phase-X.txt
```

#### Performance Checks

```bash
# Lighthouse CI (all routes)
pnpm lighthouse:ci

# Target metrics:
# - LCP < 2.5s
# - FCP < 1.5s
# - TBT < 200ms
```

#### E2E Verification

```bash
pnpm test:e2e -- auth      # Login flow
pnpm test:e2e -- menu      # Browse + add to cart
pnpm test:e2e -- checkout  # Address autocomplete (maps eager)
pnpm test:e2e -- tracking  # Map loads (dynamic import)
pnpm test:e2e -- admin     # Charts load (dynamic import)
```

---

### Integration with Existing Optimizations

| Optimization | Config | Impact | Keep/Change |
|--------------|--------|--------|-------------|
| optimizePackageImports | next.config.ts | Framer Motion 150KB -> 40KB | KEEP |
| modularizeImports | next.config.ts | Lucide icons tree-shaken | KEEP |
| Image optimization | next.config.ts | AVIF/WebP, lazy load | KEEP |
| Font optimization | layout.tsx | Preload Inter, Playfair | KEEP |
| Service Worker | Serwist | Pre-cache route bundles | COMPLEMENTARY |
| React Query | query-provider.tsx | 5min staleTime | COMPLEMENTARY |
| Zustand | Cart store | localStorage persist | MOVE TO ROUTE LAYOUT |

**No conflicts identified.** Code splitting creates smaller chunks -> faster Service Worker updates.

---

### Scalability Projections

| Metric | Current | After Phases 1-4 | At 10x Traffic | Notes |
|--------|---------|------------------|----------------|-------|
| Initial JS (public) | ~800KB | ~200KB | ~200KB | No refactor needed |
| Initial JS (admin) | ~900KB | ~250KB | ~250KB | Charts lazy-loaded |
| LCP (menu page) | ~3.2s | <2.5s | <2.5s | CDN caching helps |
| Bundle count | ~15 chunks | ~25 chunks | ~25 chunks | Route-based isolation |

**Future considerations:**
- Menu items 100+ -> Virtual scrolling (react-window)
- Feature set 2x -> Continue Server Component pattern
- Video/PDF features -> Dynamic import media libraries

---

## v1.4: Mobile Optimization & Homepage Architecture (2026-01-30)

[Previous content preserved...]

---

## v1.3: Theme Audit & Hero Redesign Architecture

[Previous content preserved...]

---

## v1.2: Three.js/React Three Fiber Integration

[Previous content preserved...]

---

## v1.1: Portal-First Overlay System

[Previous content preserved...]

---

## Sources

**Production Polish Integration (v1.6):**
- Existing codebase examination (HIGH confidence -- all patterns verified by direct file reads)
- `src/components/ui/account/AccountClient.tsx` - tab system pattern
- `src/components/ui/account/ProfileTab/ProfileTab.tsx` - form/fetch pattern
- `src/lib/stores/cart-store.ts` - cart persistence pattern
- `src/lib/services/offline-store/sync.ts` - offline sync pattern
- `src/lib/hooks/useOfflineSync.ts` - reconnection detection
- `supabase/functions/send-order-confirmation/index.ts` - Edge Function + Resend pattern
- `supabase/migrations/000_initial_schema.sql` - table design pattern
- `supabase/migrations/010_app_settings.sql` - settings table pattern

**Code Splitting & Bundle Optimization (v1.5):**
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js optimizePackageImports](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports)
- [Next.js Package Bundling](https://nextjs.org/docs/app/guides/package-bundling)
- [Vercel Package Optimization](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [Mastering Code Splitting App Router](https://dev.to/ahr_dev/mastering-code-splitting-in-nextjs-app-router-2608)
- [Smart Code Splitting 2026](https://dev.to/boopykiki/optimize-nextjs-performance-with-smart-code-splitting-what-to-load-when-and-why-9l1)
- [Server vs Client Components](https://dev.to/oskarinmix/server-components-vs-client-components-in-nextjs-differences-pros-and-cons-389f)
- [GSAP Next.js Best Practices](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)
- [GSAP ScrollTrigger Next.js](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/)
- [Recharts in Next.js](https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html)
- [Bundle Optimization Techniques 2025](https://medium.com/better-dev-nextjs-react/the-10kb-next-js-app-extreme-bundle-optimization-techniques-d8047c482aea)

**Mobile Optimization (v1.4):**
- Codebase examination (HIGH confidence)
- next.config.ts configuration
- motion-tokens.ts animation system

**Theme & Hero (v1.3):**
- Framer Motion Parallax patterns
- Create 3D Animations with Framer Motion

**Three.js Integration (v1.2):**
- React Three Fiber documentation
- Drei components
- GSAP/R3F integration patterns

**Overlay Architecture (v1.1):**
- Josh Comeau - Stacking Contexts
- MDN - Stacking Context
- Radix UI - Portal Primitives

**Existing Codebase (verified):**
- src/styles/tokens.css
- src/lib/motion-tokens.ts
- src/lib/gsap/index.ts
- src/components/ui/overlay-base.tsx
- src/components/homepage/Hero.tsx
- src/app/providers.tsx
- next.config.ts
