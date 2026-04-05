# Testing Patterns

**Analysis Date:** 2026-04-04

## Test Framework

**Runner:**
- Vitest `4.0.17`
- Config: `vitest.config.ts`
- Environment: `jsdom`
- Globals enabled (`globals: true`) — no need to import `describe`/`it`/`expect` in test files (but explicit imports are also used)

**Assertion Library:**
- Vitest built-in (`expect`) + `@testing-library/jest-dom` `^6.9.1` (extended matchers like `toBeVisible`, `toHaveClass`)

**React Testing:**
- `@testing-library/react` `^16.3.1` — `render`, `screen`, `renderHook`, `act`

**Run Commands:**
```bash
pnpm test              # Run all unit tests (vitest run)
pnpm test:ci           # CI mode — bail on first failure, no file parallelism
pnpm test:e2e          # E2E tests (Playwright)
pnpm test:e2e:ui       # Playwright with interactive UI
pnpm test:a11y         # Accessibility E2E subset
pnpm test:animations   # Animation E2E subset
```

## Test File Organization

**Location:**
- All unit tests live in `__tests__/` subdirectory co-located alongside source files
- Never co-located as `foo.test.ts` next to `foo.ts` — always inside `__tests__/` folder

**Naming:**
- Mirrors source file name: `useAcceptRoute.ts` → `__tests__/useAcceptRoute.test.ts`
- Component tests: `RouteStopCard.tsx` → `__tests__/RouteStopCard.test.tsx` (`.tsx` for JSX)
- Concept tests not tied to one file: descriptive name (`lifecycle.test.ts`, `helpers.test.ts`)

**Structure:**
```
src/lib/hooks/
  useAcceptRoute.ts
  useReorderStops.ts
  __tests__/
    useAcceptRoute.test.ts
    useReorderStops.test.ts

src/app/api/checkout/session/
  route.ts
  helpers.ts
  validation.ts
  __tests__/
    route.test.ts
    helpers.test.ts

src/components/ui/admin/orders/OrderDetailPanel/
  OrderDetailPanel.tsx
  __tests__/
    OrderDetailPanel.test.ts
```

**E2E tests:**
- All in `e2e/` directory at repo root
- Named by user flow: `happy-path.spec.ts`, `checkout-flow.spec.ts`, `driver-flow.spec.ts`
- Subdirectory for focused suites: `e2e/animations/`

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("TopLevelFeature", () => {
  beforeEach(() => {
    // reset state / clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // restore globals if patched
    globalThis.fetch = originalFetch;
  });

  describe("specificBehavior", () => {
    it("returns true when condition is met", () => {
      expect(result).toBe(true);
    });
  });

  describe("BUG-07: descriptive regression label", () => {
    it("returns false 11 seconds before cutoff (outside buffer)", () => { ... });
  });
});
```

**Patterns:**
- Nested `describe` groups by method/behavior, not by file section
- `it(...)` descriptions are plain English, present-tense, action-outcome: "returns this Saturday when called on Monday"
- `should` prefix is NOT used — descriptions read as facts
- Regression tests grouped in named `describe("BUG-XX: ...")` or `describe("DST boundary tests (TST-04)", ...)` suites
- DST, edge case, and parameterization tests each get dedicated `describe` blocks

## Mocking

**Framework:** Vitest `vi.*` API

**Module mocking (top of file, before imports):**
```typescript
vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));
```

**Chained mock module with partial override:**
```typescript
vi.mock("next/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/server")>();
  return {
    ...mod,
    after: (cb: () => Promise<void>) => { void cb(); },  // execute immediately in tests
  };
});
```

**Fetch mocking pattern (globalThis):**
```typescript
const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn();
  vi.clearAllMocks();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

// In test:
(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});
```

**Supabase client mock (chained builder):**
```typescript
const mockFrom = vi.fn();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null });
mockFrom.mockReturnValue({ select: mockSelect, eq: mockEq, single: mockSingle });
vi.mocked(createServiceClient).mockReturnValue({ from: mockFrom } as never);
```

**Environment variable mocking:**
```typescript
vi.stubEnv("DELIVERY_TIMEZONE", "Asia/Yangon");
vi.resetModules();  // required when module caches env at import time
const mod = await import("@/types/delivery");
vi.unstubAllEnvs();
```

**Framer Motion mock (for component tests):**
```typescript
vi.mock("framer-motion", () => {
  function createMotionComponent(tag: string) {
    return ({ children, ...props }) => {
      // Strip animation props (initial, animate, transition, whileHover, whileTap, layout)
      // Pass only DOM-safe props
      const Tag = tag as React.ElementType;
      return <Tag {...domProps}>{children}</Tag>;
    };
  }
  const handler = { get: (_, prop: string) => createMotionComponent(prop) };
  return {
    m: new Proxy({}, handler),
    motion: new Proxy({}, handler),
    AnimatePresence: ({ children }) => children,
  };
});
```

**What to Mock:**
- All external service clients (Supabase, Stripe, logger)
- `next/headers`, `next/server` side effects (`after`, `cookies`)
- `fetch` when testing hooks that call API endpoints directly
- Framer Motion in component render tests
- Rate limiters (`checkRateLimit` → always `{ limited: false }`)
- Toast notifications (capture calls, verify type/message)

**What NOT to Mock:**
- Pure utility functions under test (delivery date math, analytics helpers)
- Zod schemas (test them directly with `.safeParse()`)
- `date-fns` / `Intl` — test real timezone behavior

## Fixtures and Factories

**Test Data Factories (`src/test/factories/index.ts`):**
```typescript
// Override pattern — spread defaults then apply partial overrides
export function createMockMenuItem(overrides?: Partial<MenuItemsRow>): MenuItemsRow {
  return {
    id: "menu-item-uuid",
    name_en: "Test Menu Item",
    base_price_cents: 1500,
    is_active: true,
    // ... all required fields
    ...overrides,
  };
}
```

**Available factories:**
- `createMockMenuItem(overrides?)` → `MenuItemsRow`
- `createMockModifierOption(overrides?)` → `ModifierOptionsRow`
- `createMockAddress(overrides?)` → `AddressesRow`
- `createMockOrder(overrides?)` → `OrdersRow`
- `createMockRoute(overrides?)` → `RoutesRow`
- `createMockStop(overrides?)` → `RouteStopsRow`
- `createMockRouteWithStops(count, routeOverrides?, stopOverrides?)` → `{ route, stops }`
- `createValidatedCartItem(menuItem?, modifiers[], quantity?)` → validated cart item
- `createCheckoutItemInput(menuItemId, quantity?, modifiers?)` → checkout input

**Stripe mocks (`src/test/mocks/stripe.ts`):**
- `createMockStripeClient()` — full mock with `checkout.sessions.create`, `customers.*`, `webhooks.constructEvent`
- `createCheckoutCompletedEvent(orderId, userId, paymentIntentId?)` → `Stripe.Event`
- `createCheckoutExpiredEvent(...)`, `createChargeRefundedEvent(...)`, `createPaymentFailedEvent(...)` — webhook event builders

**Google Routes mocks (`src/test/mocks/google-routes.ts`):**
- Fixture data for route optimization tests

**Inline fixtures for simple cases:**
```typescript
const baseItem = {
  menuItemId: "item-1",
  basePriceCents: 1200,
  quantity: 1,
  modifiers: [],
};

// In tests, spread and override:
store.addItem({ ...baseItem, quantity: 100 });
```

**Location:** `src/test/` — shared across all test files via `@/test/factories` imports

## Test Setup (`src/test/setup.ts`)

Global setup applied via `vitest.config.ts` `setupFiles`:
- `fake-indexeddb/auto` — IndexedDB polyfill for Zustand persist
- `@testing-library/jest-dom` — extended DOM matchers
- `ResizeObserver` stub
- `localStorage` mock (returns null for all gets)
- `matchMedia` mock (returns `matches: false`)
- Test env vars: `GOOGLE_MAPS_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, etc.

## Coverage

**Requirements:** Not enforced — no coverage thresholds configured in `vitest.config.ts`

**View Coverage:**
```bash
pnpm vitest run --coverage
```

## Test Types

**Unit Tests (Vitest, 49 test files):**
- Pure utility functions: delivery date math, analytics helpers, clustering, zone checking
- Zod schemas: validation rules via `.safeParse()` with valid and invalid inputs
- Zustand stores: direct state manipulation, computed values, side effects
- Custom hooks: `renderHook` + `act`, fetch/toast mocking
- API route handlers: full request/response with mocked Supabase + Stripe
- Component rendering: `render` + `screen` queries for conditional UI

**Integration Tests (Vitest):**
- Checkout session validation end-to-end logic (`helpers.test.ts`, `route.test.ts`)
- Stripe webhook event handling with full DB mock chain
- RLS edge cases: `src/lib/__tests__/rls-edge-cases.test.ts`
- Route lifecycle: `src/app/api/driver/routes/__tests__/lifecycle.test.ts`

**E2E Tests (Playwright, 20 spec files):**
- Browser: Chromium (Desktop Chrome) + Mobile Chrome (Pixel 5)
- Flows: `happy-path`, `cart-flow`, `checkout-flow`, `authentication`, `driver-flow`, `admin-operations`, `admin-mobile`, `customer-tracking`
- Accessibility: `accessibility.spec.ts`, `animations/v7-accessibility.spec.ts`
- Visual regression: `v4-theme-parity.spec.ts`, `contrast-audit.spec.ts` (screenshot diff, `maxDiffPixels: 100`)
- Hydration smoke: `hydration-smoke.spec.ts`
- Retries on CI: 2 retries, 1 worker; local: parallel, 0 retries
- Uses `data-testid` attributes as primary selectors (`[data-testid="menu-item"]`)
- Role-based selectors as secondary (`getByRole("heading")`, `getByRole("tab")`)

## Common Patterns

**Async Testing (hooks):**
```typescript
const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1" }));

await act(async () => {
  await result.current.acceptRoute();
});

expect(mockToast).toHaveBeenCalledWith(
  expect.objectContaining({ message: "Route accepted!", type: "success" })
);
```

**Async Testing (loading state):**
```typescript
let resolvePromise: (value: unknown) => void;
const promise = new Promise((resolve) => { resolvePromise = resolve; });
(globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1" }));
expect(result.current.isAccepting).toBe(false);

act(() => { acceptPromise = result.current.acceptRoute(); });
expect(result.current.isAccepting).toBe(true);  // check mid-flight

await act(async () => {
  resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
  await acceptPromise!;
});
expect(result.current.isAccepting).toBe(false);
```

**Error Testing:**
```typescript
it("shows error toast on non-200 response", async () => {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: () => Promise.resolve({ error: "Bad request" }),
  });

  await act(async () => { await result.current.acceptRoute(); });

  expect(onSuccess).not.toHaveBeenCalled();
  expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
});
```

**Zod Validation Testing:**
```typescript
it("rejects missing addressId", () => {
  const { addressId: _addressId, ...body } = validBody;  // destructure to omit
  const result = createCheckoutSessionSchema.safeParse(body);
  expect(result.success).toBe(false);
});
```

**Zustand Store Testing:**
```typescript
beforeEach(() => {
  useCartStore.getState().clearCart();
  useCartStore.persist.clearStorage?.();
  __clearDebounceState();  // exported helper to reset internal debounce state
  useCartStore.getState().setDeliverySettings(DELIVERY_FEE, FREE_DELIVERY_THRESHOLD);
});
```

**DST / Timezone Testing:**
```typescript
// Use makePtDate helper to create timezone-correct Date objects
function makePtDate(value: string): Date {
  // Dynamically computes PST/PDT offset for the target date
}
const wednesday = makePtDate("2026-01-14T10:00:00");
expect(getDeliveryDate(wednesday, CUTOFF_DAY, CUTOFF_HOUR).dateString).toBe("2026-01-17");
```

---

*Testing analysis: 2026-04-04*
