---
phase: 111-checkout-conversion
plan: 03
subsystem: ui
tags: [checkout, polling, react-query, banner, price-change, formatPrice, vitest]

# Dependency graph
requires:
  - phase: 111-01
    provides: "CheckoutClient render-time empty-cart guard, Stripe-redirect-aware unmount, useCallback handleReschedule pattern"
  - phase: 111-02
    provides: "ClientErrorCodes.PRICE_CHANGED registry entry (scaffolded for this plan's banner case), framer-motion forwardRef + blacklist mock pattern"
  - phase: 110-checkout-foundation
    provides: "useCartValidation hook (priceChangedIds, validations Map, status state machine), CheckoutErrorBanner switch architecture"
provides:
  - "useMenu({ pollWhileNonEmpty }) — conditional 3-min refetchInterval gated on cart-non-empty selector (CFIX-09 D-10..D-14)"
  - "MENU_POLL_INTERVAL_MS = 180000 named export"
  - "menuQueryFn canonical async fetcher exported from useMenu.ts (Plan 04 prefetch consumes this same function — no divergent inline queryFn)"
  - "CheckoutErrorBanner case 'PRICE_CHANGED' with renderPriceChange helper using formatPrice (CHKP-02 D-15..D-21)"
  - "Direction-aware banner colors: warning for up, success for down; TrendingUp/TrendingDown icons; role=status aria-live=polite"
  - "Bilingual headlines (English + Burmese with lang=my marker)"
  - "CheckoutClient → useCartValidation → priceChangeError → CheckoutErrorBanner wiring with handleUpdateCart → router.push('/cart')"
  - "useCartValidation opts into polling automatically (every consumer benefits — no explicit prop drilling)"
affects: [111-04-prefetch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack React Query refetchInterval gated on Zustand store selector (cart non-empty) — useCartStore((s) => s.items.length > 0)"
    - "Conditional polling via options object (pollWhileNonEmpty?: boolean) — backward compatible with bare useMenu() call sites"
    - "Named queryFn export for shared fetch logic across hooks + prefetch (avoids inline divergence)"
    - "Banner case extension: switch over error.code with derived outer className per case + per-case render helper"
    - "Direction-aware design tokens: bg-status-warning-bg / bg-status-success-bg / bg-status-error-bg + matching border-* and text-* per code path"
    - "useMemo synthesis: join Map<id, validation> against array<cartItem> to fabricate the banner's full payload (name + oldPrice + newPrice + direction)"
    - "Vitest test-only setter (__setItems) escape hatch for vi.mock-hoisted Zustand stores"
    - "Pre-existing canonical framer-motion forwardRef + motion-only-prop blacklist mock from ContactInfoSection.test.tsx (Plan 02 lesson)"
    - "Inline component-mock pattern in CheckoutClient.test.tsx — barrel-mock CheckoutErrorBanner with a spy that captures props for assertion"

key-files:
  created:
    - ".planning/phases/111/111-03-SUMMARY.md"
    - "src/lib/hooks/__tests__/useMenu.test.ts"
    - "src/components/ui/checkout/__tests__/CheckoutErrorBanner.test.tsx"
  modified:
    - "src/lib/hooks/useMenu.ts"
    - "src/lib/hooks/useCartValidation.ts"
    - "src/components/ui/checkout/CheckoutErrorBanner.tsx"
    - "src/app/(customer)/checkout/CheckoutClient.tsx"
    - "src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx"
    - "eslint.config.mjs"
    - "vitest.config.ts"

key-decisions:
  - "validations is Map<string, CartItemValidation>, NOT Array — required Map.get() instead of plan-suggested .find() (Rule 1 deviation)"
  - "CartItemValidation type only carries cartItemId/status/newPriceCents/priceDirection — joined against useCartStore items to source name + oldPriceCents (Rule 1)"
  - "overallDirection policy: 'up' if any item went up (safer warning default per UI-SPEC State Matrix 'Multi item, mixed → Warning')"
  - "useMenu options stays as a single optional object — backward compatible with bare useMenu() call sites in MenuClient (browsing surface)"
  - "menuQueryFn is exported as a named const, not declared inline — Plan 04 imports the same function, eliminating fetch-logic drift"
  - "refetchInterval is gated on direct selector (no useMemo) so React re-renders propagate immediately when cart transitions empty ↔ non-empty"
  - "Banner outer className refactored from hardcoded error to derived per-case (warning / success / error) — option (a) per plan note"
  - "role=status + aria-live=polite ONLY for PRICE_CHANGED case (other error codes keep their existing semantics)"
  - "Burmese companion uses text-xs (declared design token) — text-2xs is NOT a project token; pre-existing usages in renderDirectionMismatch left untouched (out of scope)"
  - "Worktree mirror at .claude/worktrees/agent-a7e850f0/ excluded from both eslint and vitest scans (stale duplicates were polluting verification — Rule 3 unblock)"

patterns-established:
  - "Conditional refetchInterval: `options?.pollWhileNonEmpty && isCartNonEmpty ? MENU_POLL_INTERVAL_MS : false`"
  - "Banner case extension: switch case → render helper, derived outer className, optional role/aria props per code"
  - "Vitest cart-store mock with __setItems setter: mock factory exposes mutation hook so tests can flip selector results without re-importing"
  - "useCartValidation Map → array join: useMemo over priceChangedIds, .map → validations.get + cartItems.find → filter null"

next-steps:
  - "Plan 111-04: prefetch /api/menu on checkout step entry using imported menuQueryFn (contract already unified)"
  - "Plan 111-04 / future: revisit pre-existing text-2xs usages in CheckoutErrorBanner.tsx renderDirectionMismatch + renderWithAction (lines 263, 269, 313) and unify on text-xs project token"
  - "Manual smoke: add items → /checkout → admin price edit → wait ~3 min → confirm banner copy + colors"

metrics:
  duration_minutes: ~140
  tasks_completed: 3
  files_changed: 9
  test_files_added: 2
  tests_added: 15
  total_test_count: 947
  completed_at: "2026-04-08T01:30:00Z"
---

# Phase 111 Plan 03: CFIX-09 Menu Polling + CHKP-02 PRICE_CHANGED Banner Summary

Closes the price-transparency loop: TanStack Query polls /api/menu every 3 minutes while cart is non-empty, useCartValidation surfaces priceChangedIds, CheckoutClient synthesizes a PRICE_CHANGED error, and CheckoutErrorBanner renders direction-aware bilingual copy with formatPrice-formatted prices and an Update cart CTA that routes to /cart.

## Tasks

### Task 1: Extend useMenu with conditional polling + canonical menuQueryFn

**Files:**
- `src/lib/hooks/useMenu.ts` (rewritten — 35 lines → 60 lines)
- `src/lib/hooks/useCartValidation.ts` (1-line edit)
- `src/lib/hooks/__tests__/useMenu.test.ts` (new — 6 tests)

**Behavior:** `useMenu({ pollWhileNonEmpty: true })` enables 3-minute refetchInterval ONLY when `useCartStore((s) => s.items.length > 0)`. Bare `useMenu()` call sites stay no-poll. `menuQueryFn` is exported as a named async function so Plan 04's prefetch can `prefetchQuery({ queryFn: menuQueryFn })` and share the same fetch path. `MENU_POLL_INTERVAL_MS = 180000` exported for tests.

**Tests:**
1. MENU_POLL_INTERVAL_MS is exactly 180000
2. menuQueryFn is callable async, hits /api/menu
3. useMenu() without options fetches once (no polling)
4. useMenu({ pollWhileNonEmpty: true }) with empty cart fetches once
5. useMenu({ pollWhileNonEmpty: true }) with non-empty cart enables refetchInterval
6. useMenu uses menuQueryFn (same fetch path as Plan 04 will use)

**Test mock pattern:** `vi.mock("@/lib/stores/cart-store", () => ...)` factory exposes `__setItems` setter so tests can flip the selector return value without re-importing.

**Commit:** `1e4dac60 — feat(111-03): extend useMenu with conditional polling + canonical menuQueryFn`

### Task 2: PRICE_CHANGED case in CheckoutErrorBanner

**Files:**
- `src/components/ui/checkout/CheckoutErrorBanner.tsx` (added imports, type, switch case, render helper, derived outer className)
- `src/components/ui/checkout/__tests__/CheckoutErrorBanner.test.tsx` (new — 6 tests)

**Behavior:** New `case "PRICE_CHANGED":` reads `error.details: PriceChangedDetails`, calls `renderPriceChange()` helper. Helper picks Icon (TrendingUp / TrendingDown), color classes (warning / success), headline ("Heads up — prices changed" / "Good news — prices dropped"), and renders an `<ul>` of price rows with `<span class="line-through">{formatPrice(oldPriceCents)}</span> → <span class="font-semibold">{formatPrice(newPriceCents)}</span>`. Burmese companion below headline with `lang="my"`. Outer wrapper className is now derived per-case (warning / success / error). `role="status" aria-live="polite"` applied ONLY when `error.code === "PRICE_CHANGED"`.

**Tests:**
1. Direction up → "Heads up — prices changed" headline
2. Direction down → "Good news — prices dropped" headline
3. Multi-item mixed banner renders all price rows ($12.00, $13.50, $15.00, $13.00)
4. Update cart click invokes onUpdateCart spy
5. role=status + aria-live=polite present
6. lang=my element exists with Burmese text

**Mock pattern:** Canonical framer-motion forwardRef + motion-only-prop blacklist (Plan 02 lesson — lifted verbatim from ContactInfoSection.test.tsx). Filters out animation props (initial/animate/exit/etc) but forwards everything else (role, aria-live, className) to the DOM node.

**Commit:** `cbe3f282 — feat(111-03): add PRICE_CHANGED case to CheckoutErrorBanner with formatPrice`

### Task 3: Wire CheckoutClient to render PRICE_CHANGED banner

**Files:**
- `src/app/(customer)/checkout/CheckoutClient.tsx` (added useCartValidation + useCartStore selector + priceChangeError useMemo + handleUpdateCart + banner JSX block)
- `src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx` (added barrel-mock CheckoutErrorBanner spy + 3 CHKP-02 wiring tests)

**Wiring:**
```tsx
const cartItems = useCartStore((s) => s.items);
const cartValidation = useCartValidation();
const hasPriceChanges =
  cartValidation.status === "done" && cartValidation.priceChangedIds.length > 0;

const priceChangeError = useMemo(() => {
  if (!hasPriceChanges || cartValidation.status !== "done") return null;
  const items = cartValidation.priceChangedIds
    .map((cartItemId) => {
      const v = cartValidation.validations.get(cartItemId);  // Map.get!
      const cartItem = cartItems.find((ci) => ci.cartItemId === cartItemId);
      if (!v || !cartItem || v.newPriceCents == null || !v.priceDirection || v.status !== "price-changed") {
        return null;
      }
      return {
        name: cartItem.nameEn,
        oldPriceCents: cartItem.basePriceCents,
        newPriceCents: v.newPriceCents,
        direction: v.priceDirection,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (items.length === 0) return null;
  const overallDirection: "up" | "down" = items.some((it) => it.direction === "up")
    ? "up"
    : "down";

  return {
    code: "PRICE_CHANGED",
    message: "Prices updated since you added items to your cart",
    details: { items, overallDirection },
  };
}, [hasPriceChanges, cartValidation, cartItems]);

const handleUpdateCart = useCallback(() => {
  router.push("/cart");
}, [router]);
```

Banner JSX rendered above the step grid:
```tsx
{priceChangeError && (
  <div className="mb-6">
    <CheckoutErrorBanner error={priceChangeError} onUpdateCart={handleUpdateCart} />
  </div>
)}
```

**Tests (3 new in CHKP-02 describe block):**
1. Banner renders with PRICE_CHANGED copy when priceChangedIds is non-empty (asserts banner testid + headline + spy props match)
2. Update cart click calls router.push('/cart') (asserts mockRouterPush called with "/cart")
3. Banner does NOT render when priceChangedIds is empty (asserts banner testid absent)

All 15 tests in CheckoutClient.test.tsx pass (12 pre-existing + 3 new).

**Commit:** `15277c7d — feat(111-03): wire CheckoutClient to render PRICE_CHANGED banner`

### Task 4 (deviation): Worktree exclusion for vitest

**Files:** `vitest.config.ts` (1-line edit — added `**/.claude/worktrees/**` to exclude)

A stale worktree mirror at `.claude/worktrees/agent-a7e850f0/` was duplicating test files into the vitest scan. The worktree is on commit `a0509b3e` (older than `1e4dac60`), causing one mocked-mock-call assertion in `delivery-photos.test.ts` to fail in the worktree copy while the main copy passed. Fixed via exclude pattern mirroring the eslint.config.mjs ignore from Task 3 commit.

**Commit:** `2d9a93ea — chore(111-03): exclude .claude/worktrees from vitest scan`

## CartItemValidation Shape (verified at runtime)

```typescript
// src/types/cart.ts
export interface CartItemValidation {
  cartItemId: string;
  status: CartItemValidationStatus;
  newPriceCents?: number;
  priceDirection?: "up" | "down";
}

export interface CartValidationResult {
  status: "idle" | "validating" | "done" | "error";
  validations: Map<string, CartItemValidation>;  // Map, NOT Array
  priceChangedIds: string[];
  // ...
}
```

CartItemValidation does NOT carry `name` or `oldPriceCents`. Both must be sourced from `useCartStore((s) => s.items)` and joined by `cartItemId`.

## Sample Banner Render

For a single item going up ($12.00 → $13.50):
- Outer: `bg-status-warning-bg border-status-warning/20`
- Icon: `TrendingUp` in `text-status-warning` on `bg-status-warning/10`
- Headline: **Heads up — prices changed**
- Burmese companion (lang=my): သတိပြုပါ — စျေးနှုန်း ပြောင်းလဲသွားပါသည်
- Price row: `Tea Leaf Salad: $12.00 → $13.50` (struck-through old, bold-warning new)
- CTA: `Update cart` link-button → `router.push('/cart')`

For a single item going down ($15.00 → $13.00):
- Outer: `bg-status-success-bg border-status-success/20`
- Icon: `TrendingDown` in `text-status-success`
- Headline: **Good news — prices dropped**
- Burmese (lang=my): သတင်းကောင်း — စျေးနှုန်း လျှော့ချသွားပါသည်
- Price row: `Mohinga: $15.00 → $13.00` (struck-through old, bold-success new)

## Plan 04 Contract Confirmation

`menuQueryFn` is exported from `src/lib/hooks/useMenu.ts` as a named const (line 11):
```typescript
export const menuQueryFn = async (): Promise<MenuResponse> => {
  const res = await fetch("/api/menu");
  if (!res.ok) throw new Error("Failed to fetch menu");
  return res.json() as Promise<MenuResponse>;
};
```

Plan 04 can prefetch via:
```typescript
import { menuQueryFn } from "@/lib/hooks/useMenu";
import { queryKeys } from "@/lib/queryKeys";

await queryClient.prefetchQuery({
  queryKey: queryKeys.menu.list(),
  queryFn: menuQueryFn,
});
```

This ensures the prefetch and useMenu hit the same fetch path with the same error handling and the same response shape — no divergent inline queryFn drift.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan instructed `validations.find()` but validations is a Map**
- **Found during:** Task 3 wiring
- **Issue:** Plan instructions said `cartValidation.validations.find((x) => x.cartItemId === cartItemId)` (Array syntax). Source type at `src/types/cart.ts` declares `validations: Map<string, CartItemValidation>`.
- **Fix:** Used `cartValidation.validations.get(cartItemId)` (Map.get).
- **Files modified:** `src/app/(customer)/checkout/CheckoutClient.tsx`
- **Commit:** `15277c7d`

**2. [Rule 1 - Missing field] CartItemValidation has no `name` or `oldPriceCents`**
- **Found during:** Task 3 wiring
- **Issue:** Plan referenced `v.name` and `v.oldPriceCents`. Type only declares `cartItemId`, `status`, `newPriceCents?`, `priceDirection?`.
- **Fix:** Added `useCartStore((s) => s.items)` selector. For each priceChangedId, join the validation Map entry against the cart items array via `.find((ci) => ci.cartItemId === cartItemId)` and source `name = cartItem.nameEn`, `oldPriceCents = cartItem.basePriceCents`.
- **Files modified:** `src/app/(customer)/checkout/CheckoutClient.tsx`
- **Commit:** `15277c7d`

**3. [Rule 3 - Blocking] Stale worktree mirror polluted lint and vitest runs**
- **Found during:** Verification suite (after Task 3 commit)
- **Issue:** `.claude/worktrees/agent-a7e850f0/` contains a stranded git worktree on commit `a0509b3e`. Both eslint and vitest were scanning into it, surfacing 12 errors / 27 warnings in eslint and 1 failed test in vitest — none caused by Plan 03 changes; all pre-existing pollution.
- **Fix:** Added `.claude/worktrees/**` to `eslint.config.mjs` ignores. Added `**/.claude/worktrees/**` to `vitest.config.ts` exclude. Lint + tests now both green.
- **Files modified:** `eslint.config.mjs`, `vitest.config.ts`
- **Commits:** `15277c7d` (eslint), `2d9a93ea` (vitest)

### Unfulfilled Acceptance Criteria (Pre-existing Out-of-Scope)

**Task 2 acceptance criterion: `grep -F 'text-2xs' src/components/ui/checkout/CheckoutErrorBanner.tsx` exits 1**
- The grep returns matches at lines 263, 269, 313 — all in PRE-EXISTING `renderDirectionMismatch` and `renderWithAction` helpers (not in my new `renderPriceChange`).
- My `renderPriceChange` correctly uses `text-xs` per UI-SPEC §Typography.
- Out-of-scope to retroactively migrate other render helpers. Logged in `next-steps` for a future plan.

## Verification Suite Results

```
pnpm lint           ✓ (after worktree exclude)
pnpm lint:css       ✓
pnpm format:check   ✓ All matched files use Prettier code style
pnpm typecheck      ✓ tsc --noEmit clean
pnpm test --run     ✓ 947 passed (61 test files)
pnpm build          ✓ next build + serwist sw built (568.7KB, 12 entries)
```

Test counts:
- Task 1 added: 6 tests in `src/lib/hooks/__tests__/useMenu.test.ts`
- Task 2 added: 6 tests in `src/components/ui/checkout/__tests__/CheckoutErrorBanner.test.tsx`
- Task 3 added: 3 tests in `src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx` (15 total in file, up from 12)
- Total new tests: **15**
- Total project tests after Plan 03: **947** (up from 932 baseline at end of Plan 02)
- Zero regressions in pre-existing tests.

## Self-Check: PASSED

- Files created exist: useMenu.test.ts, CheckoutErrorBanner.test.tsx, 111-03-SUMMARY.md ✓
- Files modified exist: useMenu.ts, useCartValidation.ts, CheckoutErrorBanner.tsx, CheckoutClient.tsx, CheckoutClient.test.tsx, eslint.config.mjs, vitest.config.ts ✓
- All 4 commits in git log: 1e4dac60, cbe3f282, 15277c7d, 2d9a93ea ✓
- All 947 tests pass ✓
- Build succeeds ✓
