# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework

**Unit/Integration Runner:**
- Vitest 4.0.17
- Config: `vitest.config.ts`
- Environment: `jsdom`
- Setup: `src/test/setup.ts`
- Globals: `true` (no need to import `describe`, `it`, `expect`)

**E2E Runner:**
- Playwright 1.57.0
- Config: `playwright.config.ts`
- Browsers: Chromium (Desktop Chrome), Mobile Chrome (Pixel 5)
- Base URL: `http://localhost:3000`

**Assertion Library:**
- Vitest built-in assertions + `@testing-library/jest-dom` (extended matchers)
- `@testing-library/react` for hook and component tests

**Run Commands:**
```bash
pnpm test              # Run all unit tests (vitest run)
pnpm test:ci           # CI mode: bail on first failure, no parallelism
pnpm test:e2e          # Run all Playwright tests
pnpm test:e2e:ui       # Playwright interactive UI
pnpm test:a11y         # Accessibility specs only
pnpm test:animations   # Animation specs only
pnpm rls:test          # Supabase RLS isolation test (node script)
```

## Test File Organization

**Location:** Co-located `__tests__/` subdirectory adjacent to source file

**Naming:** `<SourceFileName>.test.ts` or `<SourceFileName>.test.tsx`

**Structure:**
```
src/lib/utils/
  delivery-dates.ts
  __tests__/
    delivery-dates.test.ts
    delivery-dates-multiday.test.ts

src/lib/hooks/
  useAcceptRoute.ts
  __tests__/
    useAcceptRoute.test.ts

src/app/api/checkout/session/
  route.ts
  helpers.ts
  validation.ts
  __tests__/
    route.test.ts        # Schema + business logic tests
    helpers.test.ts      # Address distance + direction mismatch tests

src/components/ui/admin/routes/
  __tests__/
    RouteStopCard.test.tsx
    route-selection.test.ts
```

**E2E tests:**
```
e2e/
  checkout-flow.spec.ts
  driver-flow.spec.ts
  admin-operations.spec.ts
  happy-path.spec.ts
  animations/
    v7-motion.spec.ts

supabase/tests/
  00_rls_policies.test.sql    # pgTAP RLS policy tests
  01_function_security.test.sql
  02_materialized_views.test.sql
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("top-level domain (e.g., useAcceptRoute)", () => {
  // Setup/teardown
  beforeEach(() => { ... });
  afterEach(() => { ... });

  it("describes a specific behavior", async () => {
    // arrange
    // act
    // assert
  });

  describe("sub-group for related cases", () => {
    it("specific edge case", () => { ... });
  });
});
```

**Delivery logic suites consistently use tagged sub-describes:**
```typescript
describe("BUG-07: cutoff safety buffer", () => { ... });
describe("DST boundary tests (TST-04)", () => { ... });
describe("parameterization", () => { ... });
```

**Patterns:**
- `beforeEach` resets mocks (`vi.clearAllMocks()`) and store state
- `afterEach` restores originals (`globalThis.fetch = originalFetch`)
- One assertion group per `it` — no multi-concern tests
- Named constants for fixed timestamps instead of inline `new Date()`

## Mocking

**Framework:** Vitest `vi.mock()`, `vi.fn()`, `vi.stubEnv()`, `vi.stubGlobal()`

**Supabase mocking pattern (service layer tests):**
```typescript
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => ({ from: mockFrom }),
}));

// Per-test: wire up chain
mockFrom.mockImplementation((table: string) => {
  if (table === "app_settings") {
    return { select: () => ({ eq: () => ({ returns: mockSettingsReturns }) }) };
  }
  // ...
});
mockSettingsReturns.mockResolvedValue({ data: [...], error: null });
```

**Fetch mocking pattern (hook tests):**
```typescript
const originalFetch = globalThis.fetch;
beforeEach(() => { globalThis.fetch = vi.fn(); vi.clearAllMocks(); });
afterEach(() => { globalThis.fetch = originalFetch; });

// Success mock
(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ newRouteId: "new-route-1" }),
});

// Error mock
(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
  ok: false,
  status: 400,
  json: () => Promise.resolve({ error: "Bad request" }),
});

// Network error
(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));
```

**Loading-state pattern (pending promise trick):**
```typescript
let resolvePromise: (value: unknown) => void;
const promise = new Promise((resolve) => { resolvePromise = resolve; });
(globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

let actionPromise: Promise<void>;
act(() => { actionPromise = result.current.acceptRoute(); });

expect(result.current.isAccepting).toBe(true); // In-flight

await act(async () => {
  resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
  await actionPromise!;
});

expect(result.current.isAccepting).toBe(false); // Completed
```

**Toast mocking:**
```typescript
const mockToast = vi.fn();
vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));
// Assert
expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
```

**Framer Motion mocking (component tests):**
```typescript
vi.mock("framer-motion", () => {
  function createMotionComponent(tag: string) {
    return ({ children, ...props }: Record<string, unknown>) => {
      // Strip animation props; pass only DOM-safe props
      const Tag = tag as unknown as React.ElementType;
      return <Tag {...domProps}>{children as React.ReactNode}</Tag>;
    };
  }
  const handler = { get: (_: unknown, prop: string) => createMotionComponent(prop) };
  return { m: new Proxy({}, handler), motion: new Proxy({}, handler), AnimatePresence: ... };
});
```

**Next.js mocking:**
```typescript
vi.mock("next/cache", () => ({ unstable_cache: (fn: (...args: any[]) => any) => fn }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue({ get: vi.fn() }) }));
vi.mock("next/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/server")>();
  return { ...mod, after: (cb: () => Promise<void>) => { void cb(); } };
});
```

**Environment variable mocking:**
```typescript
vi.stubEnv("DELIVERY_TIMEZONE", "Asia/Yangon");
vi.resetModules(); // Force re-import to pick up new env
const mod = await import("@/types/delivery");
vi.unstubAllEnvs();
```

**What to Mock:**
- Supabase clients (`@/lib/supabase/server`, `@/lib/supabase/client`)
- `globalThis.fetch` for hook tests
- Toast notifications (`@/lib/hooks/useToastV8`)
- Stripe (`@/lib/stripe/server`)
- Framer Motion (animation props break jsdom)
- `next/cache`, `next/headers`, `next/server`
- Logger (`@/lib/utils/logger`) — no-op in tests
- Email sender (`@/lib/email`) — no-op in tests
- Rate limiter (`@/lib/rate-limit`) — mock as always-allowed

**What NOT to Mock:**
- Pure utility functions (`delivery-dates.ts`, `delivery-zones.ts`, `order.ts`, `price.ts`)
- Zod validation schemas
- Zustand stores (test against real store state)
- `delivery-dates` module when testing DST boundaries (test real behavior)

## Fixtures and Factories

**Factory functions (`src/test/factories/index.ts`):**
```typescript
createMockMenuItem(overrides?: Partial<MenuItemsRow>): MenuItemsRow
createMockModifierOption(overrides?: Partial<ModifierOptionsRow>): ModifierOptionsRow
createMockAddress(overrides?: Partial<AddressesRow>): AddressesRow
createMockOrder(overrides?: Partial<OrdersRow>): OrdersRow
createValidatedCartItem(menuItem?, modifiers?, quantity?): ValidatedCartItem
createCheckoutItemInput(menuItemId, quantity?, modifiers?): CheckoutItemInput
```

**Usage pattern:**
```typescript
const menuItems = new Map<string, MenuItemsRow>([
  ["item-1", createMockMenuItem({ id: "item-1", base_price_cents: 1500 })],
]);
```

**Delivery day fixtures (inline in test files):**
```typescript
const MOCK_DELIVERY_DAYS: DeliveryDayConfig[] = [
  { id: "mon", dayOfWeek: 1, isActive: true, cutoffDay: 0, cutoffHour: 15, deliveryFeeCents: 500, displayOrder: 0 },
  { id: "wed", dayOfWeek: 3, isActive: true, cutoffDay: 2, cutoffHour: 15, deliveryFeeCents: 500, displayOrder: 1 },
  // ...
];
```

**Timestamp fixtures — named UTC constants for readability:**
```typescript
// Named timestamps as UTC Date objects
const WEDNESDAY_10AM = new Date("2026-03-04T18:00:00.000Z"); // 10 AM PT (UTC-8)
const FRIDAY_1PM = new Date("2026-03-06T21:00:00.000Z");     // 1 PM PT
const FRIDAY_4PM = new Date("2026-03-07T00:00:00.000Z");     // 4 PM PT

// PT-offset helper for non-DST dates
const makePtDate = (value: string) => new Date(`${value}-08:00`);
```

**Stripe mock factories (`src/test/mocks/stripe.ts`):**
- `createCheckoutCompletedEvent(orderId, userId, paymentIntentId?)`
- `createCheckoutExpiredEvent(...)`
- `createChargeRefundedEvent(...)`
- `createPaymentFailedEvent(...)`

**Location:** `src/test/factories/index.ts`, `src/test/mocks/stripe.ts`, `src/test/mocks/google-routes.ts`

## Coverage

**Requirements:** No enforced coverage threshold (no `coverage` config in `vitest.config.ts`)

**View Coverage:**
```bash
# Not in scripts — run manually:
pnpm vitest run --coverage
```

## Test Types

### Unit Tests (Vitest)

**Scope:** Pure functions, hooks, store state, Zod schemas, business logic utilities

**Delivery business logic (critical — high coverage):**
- `src/lib/utils/__tests__/delivery-dates.test.ts` — cutoff calculations, DST boundaries, 10s safety buffer
- `src/lib/utils/__tests__/delivery-dates-multiday.test.ts` — multi-day scheduling, direction filtering, week wrap
- `src/lib/utils/__tests__/delivery-zones.test.ts` — bearing calculation, zone direction lookup, `filterDaysByDirection`
- `src/lib/settings/__tests__/business-rules.test.ts` — DB → camelCase mapping, fallback defaults, partial data
- `src/lib/settings/__tests__/generate-time-windows.test.ts` — time window generation, AM/PM formatting
- `src/lib/utils/__tests__/delivery-schedule.test.ts` — schedule display formatting
- `src/lib/hooks/__tests__/useDeliveryGate.test.ts` — gate open/closed, urgency thresholds, delivery date display

**Checkout flow (high coverage):**
- `src/app/api/checkout/session/__tests__/route.test.ts` — Zod schema, cart validation, order totals, Stripe line items, fee threshold, server-authoritative pricing, tip/discount logic
- `src/app/api/checkout/session/__tests__/helpers.test.ts` — direction mismatch validation for address vs delivery day

**Route management (admin operations):**
- `src/lib/hooks/__tests__/useSplitRoute.test.ts` — split endpoint, empty stopIds rejection, loading state
- `src/lib/hooks/__tests__/useMergeRoutes.test.ts` — merge endpoint, loading state, success toast
- `src/lib/hooks/__tests__/useReassignDriver.test.ts` — planned vs in_progress confirmation flow
- `src/lib/hooks/__tests__/useReorderStops.test.ts` — PATCH payload, `forceOverride` for in_progress routes, error rollback
- `src/lib/validations/__tests__/route.test.ts` — `reassignStopSchema`, `createRouteSchema`, `splitRouteSchema`, `mergeRouteSchema`
- `src/components/ui/admin/routes/__tests__/route-selection.test.ts` — stop selection toggle/select-all, split validation

**Driver state transitions:**
- `src/lib/hooks/__tests__/useAcceptRoute.test.ts` — accept flow, success/error toasts, loading state, network error
- `src/lib/hooks/__tests__/useDeclineRoute.test.ts` — decline with reason, same patterns as accept
- `src/lib/hooks/__tests__/useDriverReorderStops.test.ts` — driver-side reorder
- `src/lib/stores/__tests__/driver-store.test.ts` — Zustand store: route, stop index, location, online status, reset

**Price calculations:**
- `src/lib/utils/__tests__/price.test.ts` — `calculateItemPrice`, `validateModifierSelection`
- `src/lib/utils/__tests__/order.test.ts` — `calculateLineTotal`, `calculateDeliveryFee`, `calculateTax`, `calculateOrderTotals`, Stripe line items
- `src/lib/utils/__tests__/refund-calc.test.ts` — refund calculations

**Other:**
- `src/lib/utils/__tests__/eta.test.ts` — Haversine distance, ETA calculation, arrival formatting
- `src/lib/utils/__tests__/clustering.test.ts` — stop clustering for route optimization
- `src/lib/services/__tests__/route-optimization.test.ts` — `validateStopsForOptimization`, Google Routes API integration
- `src/lib/services/__tests__/coverage.test.ts` — delivery coverage check
- `src/lib/stores/__tests__/cart-store.test.ts` — add/update/remove items, subtotal, delivery fee threshold, long-distance fee
- `src/lib/auth/__tests__/role-redirect.test.ts` — role-based redirect logic
- `src/lib/__tests__/rls-edge-cases.test.ts` — simulated RLS policy isolation
- `src/lib/supabase/__tests__/delivery-photos.test.ts` — photo upload patterns
- `src/app/api/webhooks/stripe/__tests__/route.test.ts` — Stripe event processing, order status updates
- `src/app/api/tracking/__tests__/route.test.ts` — tracking endpoint

### Integration Tests (Vitest)

API route tests (in `__tests__/` under API directories) perform integration-style testing: they mock Supabase/Stripe/external services but test the full validation + business logic layer together.

### E2E Tests (Playwright)

**Active (run against live dev server):**
- `e2e/happy-path.spec.ts` — full customer flow
- `e2e/checkout-flow.spec.ts` — checkout page structure, address management, order summary, payment section
- `e2e/cart-flow.spec.ts` — add to cart, quantity management
- `e2e/authentication.spec.ts` — login/logout
- `e2e/accessibility.spec.ts` — ARIA, keyboard nav
- `e2e/visual-regression.spec.ts` — screenshot diffing
- `e2e/admin-mobile.spec.ts` — admin mobile UI
- `e2e/error-states.spec.ts` — 404, empty states

**Skipped (require authenticated fixtures — not yet implemented):**
- `test.describe.skip("Authenticated Driver Flow", ...)` in `e2e/driver-flow.spec.ts`
- `test.describe.skip("Authenticated Analytics Flow", ...)` in `e2e/admin-analytics.spec.ts`
- `test.describe.skip("Authenticated Feedback Flow", ...)` in `e2e/customer-feedback.spec.ts`
- `test.describe.skip("Authenticated Tracking Flow", ...)` in `e2e/customer-tracking.spec.ts`
- ~20 individual `test.skip(...)` tests in `e2e/admin-operations.spec.ts` (order/menu/analytics management)

**Gap:** All authenticated admin/driver/tracking E2E flows are skipped — these rely on `storageState` fixtures that have not been created. The comment in `e2e/driver-flow.spec.ts` documents the intended pattern using `browser.newContext({ storageState: 'driver-auth-state.json' })`.

### Database Tests (pgTAP SQL)

- `supabase/tests/00_rls_policies.test.sql` — Row-level security policy tests
- `supabase/tests/01_function_security.test.sql` — DB function security
- `supabase/tests/02_materialized_views.test.sql` — Materialized view correctness

Run via `pnpm rls:test` (node script wrapper).

## Common Patterns

**Async Hook Testing:**
```typescript
const { result } = renderHook(() => useSplitRoute({ onSuccess }));

await act(async () => {
  await result.current.splitRoute("route-1", ["stop-a", "stop-b"], "driver-1");
});

expect(globalThis.fetch).toHaveBeenCalledWith(...)
expect(onSuccess).toHaveBeenCalledWith("new-route-1");
```

**Error Path Testing:**
```typescript
it("shows error toast and does not call onSuccess on API error", async () => {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error: "Split failed" }),
  });

  await act(async () => { await result.current.splitRoute("route-1", ["stop-a"]); });

  expect(onSuccess).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
});
```

**Validation/Schema Testing:**
```typescript
it("rejects invalid date format (MM-DD-YYYY)", () => {
  const body = { ...validBody, scheduledDate: "01-18-2026" };
  const result = createCheckoutSessionSchema.safeParse(body);
  expect(result.success).toBe(false);
});
```

**Zustand Store Testing:**
```typescript
beforeEach(() => { useDriverStore.getState().resetDriverState(); });

it("should set current route", () => {
  useDriverStore.getState().setCurrentRoute("test-route-123");
  expect(useDriverStore.getState().currentRouteId).toBe("test-route-123");
});
```

**DST Boundary Testing:**
```typescript
// Use known UTC timestamps that correspond to precise PT times
const springForwardSaturday = new Date("2026-03-07T08:00:00.000Z"); // March 7 midnight PST
const beforeCutoff = new Date("2026-03-06T22:59:00.000Z");           // 2:59 PM PST
const afterCutoff  = new Date("2026-03-06T23:00:01.000Z");           // 3:00:01 PM PST
```

**10-Second Safety Buffer Testing:**
```typescript
const cutoff = getCutoffForSaturday(saturday, CUTOFF_DAY, CUTOFF_HOUR);
const tenSecBefore = new Date(cutoff.getTime() - 10_000 + 1);
expect(isPastCutoff(saturday, tenSecBefore, CUTOFF_DAY, CUTOFF_HOUR)).toBe(true);
const elevenSecBefore = new Date(cutoff.getTime() - 11_000);
expect(isPastCutoff(saturday, elevenSecBefore, CUTOFF_DAY, CUTOFF_HOUR)).toBe(false);
```

## Test Coverage Gaps

**Checkout route full integration test is missing** — `src/app/api/checkout/session/__tests__/route.test.ts` has a comment: "Full API route testing with mocked Supabase/Stripe is complex. These tests focus on validation and business logic... Full flow testing is covered by E2E tests." The E2E checkout flow tests are unauthenticated and skip when redirected to login, meaning the complete order creation path has no automated coverage.

**COD order creation flow untested** — `src/lib/services/cod-order.ts` and the COD branch in the checkout route (`createCODOrder`) have no dedicated unit tests. COD approval webhook flow also not covered.

**Driver stop status transitions** — stop-level transitions (`pending` → `arrived` → `delivered`) and exception handling have no unit tests beyond the Zustand store state. The `src/app/api/driver/routes/[routeId]/stops/[stopId]/notes/__tests__/route.test.ts` only covers the notes endpoint.

**Route optimization service with real API** — `src/lib/services/__tests__/route-optimization.test.ts` mocks `fetch` but does not test the fallback path when Google Routes API fails (network error → fallback ordering).

**Long-distance fee tier** — `calculateDeliveryFee` with the `>25mi` flat $20 path tested in cart-store but not in the checkout session totals tests (`src/app/api/checkout/session/__tests__/route.test.ts`).

**Admin order management E2E** — All authenticated admin E2E tests in `e2e/admin-operations.spec.ts` are `test.skip()`. Order status changes, driver assignment, and analytics are untested at E2E level.

---

*Testing analysis: 2026-03-19*
