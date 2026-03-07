# Testing Patterns

**Analysis Date:** 2026-03-06

## Test Framework

**Runner:**
- Vitest 4.0.17 (unit tests)
- Playwright 1.57.0 (E2E tests)
- Config: `vitest.config.ts`, `playwright.config.ts`

**Assertion Library:**
- Vitest built-in `expect` (compatible with Jest API)
- `@testing-library/jest-dom` for DOM matchers (`toBeVisible`, `toHaveClass`, etc.)
- Playwright `expect` for E2E assertions

**Run Commands:**
```bash
pnpm test               # Run all unit tests (vitest run)
pnpm test:ci            # CI mode (bail on first failure, no file parallelism)
pnpm test:e2e           # E2E tests (playwright test)
pnpm test:e2e:ui        # E2E with Playwright UI
pnpm test:menu          # Run specific test file
pnpm test:a11y          # Accessibility E2E tests
pnpm test:animations    # Animation E2E tests
pnpm rls:test           # RLS policy isolation test (Node script)
```

## Test File Organization

**Location:**
- Unit tests: `__tests__/` subdirectory co-located with source
- E2E tests: `e2e/` top-level directory
- Test support: `src/test/` directory

**Naming:**
- Unit: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`

**Structure:**
```
src/
  lib/
    utils/
      __tests__/
        price.test.ts
        format.test.ts
        eta.test.ts
    hooks/
      __tests__/
        useDeliveryGate.test.ts
    stores/
      __tests__/
        cart-store.test.ts
    validations/
      __tests__/
        route.test.ts
        checkout.test.ts
  app/
    api/
      webhooks/stripe/
        __tests__/
          route.test.ts
      checkout/session/
        __tests__/
          route.test.ts
  test/
    setup.ts              # Global test setup
    factories/
      index.ts            # Test data factories
    mocks/
      stripe.ts           # Stripe mock utilities
      google-routes.ts    # Google Routes API mocks
e2e/
  happy-path.spec.ts
  cart-flow.spec.ts
  checkout-flow.spec.ts
  driver-flow.spec.ts
  accessibility.spec.ts
  ...
```

## Vitest Configuration

**Environment:** jsdom

**Setup File:** `src/test/setup.ts`
- Imports `fake-indexeddb/auto` (for Zustand persist with IDB)
- Imports `@testing-library/jest-dom`
- Mocks `ResizeObserver`, `localStorage`, `matchMedia`
- Sets mock environment variables for Supabase, Stripe, Google Maps

**Settings:**
- `globals: true` (describe/it/expect available without import)
- `testTimeout: 10000` (10s per test)
- `hookTimeout: 10000` (10s per hook)
- `teardownTimeout: 1000` (1s)
- Excludes `node_modules` and `e2e/`
- Path alias: `@/` -> `./src/`

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

describe("ComponentOrModule", () => {
  beforeEach(() => {
    // Reset state between tests
  });

  describe("methodOrBehavior", () => {
    it("describes expected behavior", () => {
      // Arrange
      const input = { ... };

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Patterns:**
- Group related tests with nested `describe` blocks
- Use descriptive `it` strings that read as sentences
- Reference bug/task IDs in describe blocks: `"BUG-06: debounce race condition"`, `"concurrent cart operations (TST-01)"`, `"webhook failure scenarios (TST-02)"`
- Separate "existing tests" from "new tests" with section comment dividers

**Test Data:**
- Define `baseItem` or `validBody` constants at top of file for reuse
- Spread override pattern: `{ ...baseItem, quantity: 100 }`
- Use constants for magic numbers: `const DELIVERY_FEE = 1500`

## Mocking

**Framework:** Vitest `vi.mock()` and `vi.fn()`

**Module Mocking Pattern:**
```typescript
// Mock at module level before imports
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  webhookLimiter: {},
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    exception: vi.fn(),
  },
}));
```

**Supabase Mocking Pattern (chained API):**
```typescript
const fromMock = vi.fn();
fromMock.mockImplementation((table: string) => {
  if (table === "orders") {
    return {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            data: [{ id: "order-123" }],
            error: null,
          }),
        }),
      }),
    };
  }
  return {};
});
mockCreateServiceClient.mockReturnValue({ from: fromMock });
```

**Dynamic Import for Route Testing:**
```typescript
let POST: (request: Request) => Promise<Response>;

beforeEach(async () => {
  vi.clearAllMocks();
  const routeModule = await import("../route");
  POST = routeModule.POST;
});
```

**Request Construction:**
```typescript
function makeRequest(body: string, sig = "stripe-sig-valid"): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: { "stripe-signature": sig, "content-type": "application/json" },
  });
}
```

**What to Mock:**
- External services: Supabase client, Stripe SDK, Resend email
- Rate limiting: always mock to `{ limited: false }`
- Logger: mock to no-op `vi.fn()`
- `next/headers`: mock `headers()` function
- Browser APIs in jsdom: `ResizeObserver`, `localStorage`, `matchMedia`

**What NOT to Mock:**
- Pure utility functions (test directly)
- Zod schemas (test with `.safeParse()`)
- Zustand stores (test via `getState()` / store actions)
- Business logic helpers (e.g., `computeDeliveryGate`, `calculateItemPrice`)

## Fixtures and Factories

**Test Data Factories:** `src/test/factories/index.ts`
```typescript
export function createMockMenuItem(overrides?: Partial<MenuItemsRow>): MenuItemsRow {
  return {
    id: "menu-item-uuid",
    slug: "test-item",
    name_en: "Test Menu Item",
    base_price_cents: 1500,
    // ... defaults
    ...overrides,
  };
}

export function createMockAddress(overrides?: Partial<AddressesRow>): AddressesRow { ... }
export function createMockOrder(overrides?: Partial<OrdersRow>): OrdersRow { ... }
export function createMockModifierOption(overrides?: Partial<ModifierOptionsRow>): ModifierOptionsRow { ... }
export function createValidatedCartItem(menuItem?, modifiers?, quantity?) { ... }
export function createCheckoutItemInput(menuItemId, quantity?, modifiers?) { ... }
```

**Mock Utilities:** `src/test/mocks/stripe.ts`
```typescript
export function createCheckoutCompletedEvent(orderId, userId, paymentIntentId?): Stripe.Event { ... }
export function createCheckoutExpiredEvent(orderId, userId): Stripe.Event { ... }
export function createChargeRefundedEvent(paymentIntentId, amountCents, fullRefund?): Stripe.Event { ... }
export function createPaymentFailedEvent(orderId?): Stripe.Event { ... }
export function createMockStripeClient() { ... }
```

**Mock Utilities:** `src/test/mocks/google-routes.ts`
- Google Routes API response mocks

**Location:**
- Factories: `src/test/factories/index.ts`
- Mocks: `src/test/mocks/`

## Coverage

**Requirements:** Not formally enforced (no coverage thresholds configured)

**View Coverage:**
```bash
pnpm test -- --coverage    # Run with coverage report
```

## Test Types

**Unit Tests (26 test files):**
- Pure utility functions: `src/lib/utils/__tests__/price.test.ts`, `format.test.ts`, `eta.test.ts`, `delivery-dates.test.ts`, `refund-calc.test.ts`, `clustering.test.ts`
- Zustand stores: `src/lib/stores/__tests__/cart-store.test.ts`, `driver-store.test.ts`
- Hooks (pure logic): `src/lib/hooks/__tests__/useDeliveryGate.test.ts`, `useTrackingSubscription.test.ts`
- Validation schemas: `src/lib/validations/__tests__/route.test.ts`, `analytics.test.ts`, `driver-api.test.ts`
- API route handlers: `src/app/api/webhooks/stripe/__tests__/route.test.ts`, `src/app/api/checkout/session/__tests__/route.test.ts`, `src/app/api/tracking/__tests__/route.test.ts`
- Services: `src/lib/services/__tests__/coverage.test.ts`, `route-optimization.test.ts`
- Business rules: `src/lib/settings/__tests__/business-rules.test.ts`, `generate-time-windows.test.ts`
- RLS edge cases: `src/lib/__tests__/rls-edge-cases.test.ts`

**E2E Tests (20 spec files):**
- Happy path: `e2e/happy-path.spec.ts`
- Feature flows: `e2e/cart-flow.spec.ts`, `e2e/checkout-flow.spec.ts`, `e2e/driver-flow.spec.ts`
- Auth: `e2e/authentication.spec.ts`
- Admin: `e2e/admin-analytics.spec.ts`, `e2e/admin-operations.spec.ts`
- Accessibility: `e2e/accessibility.spec.ts`, `e2e/animations/v7-accessibility.spec.ts`
- Visual regression: `e2e/visual-regression.spec.ts`, `e2e/v4-theme-parity.spec.ts`
- Error handling: `e2e/error-states.spec.ts`
- Animations: `e2e/animations/v7-motion.spec.ts`

**Playwright Configuration:**
- Test directory: `e2e/`
- Projects: Desktop Chrome, Mobile Chrome (Pixel 5)
- Retries: 2 in CI, 0 locally
- Trace: on first retry
- Screenshots: only on failure
- Visual regression: max 100 diff pixels, 0.2 threshold
- Web server: `pnpm dev --webpack` with 180s startup timeout

## Common Patterns

**Pure Function Testing (preferred):**
```typescript
// Export pure function from hook file for testing
export function computeDeliveryGate(cutoffDay: number, cutoffHour: number, now: Date): DeliveryGateState { ... }

// Test the pure function directly -- no React rendering needed
describe("computeDeliveryGate", () => {
  it("returns isOpen: true when well before cutoff", () => {
    const result = computeDeliveryGate(5, 15, new Date("2026-03-04T18:00:00.000Z"));
    expect(result.isOpen).toBe(true);
  });
});
```

**Zustand Store Testing:**
```typescript
describe("CartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.persist.clearStorage?.();
    __clearDebounceState();
  });

  it("adds item to cart", () => {
    const store = useCartStore.getState();
    store.addItem(baseItem);
    const updated = useCartStore.getState();
    expect(updated.items).toHaveLength(1);
  });
});
```

**Zod Schema Testing:**
```typescript
it("rejects invalid addressId format", () => {
  const body = { ...validBody, addressId: "not-a-uuid" };
  const result = createCheckoutSessionSchema.safeParse(body);
  expect(result.success).toBe(false);
});
```

**API Route Testing:**
```typescript
describe("webhook failure scenarios", () => {
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const routeModule = await import("../route");
    POST = routeModule.POST;
  });

  it("returns 400 for non-JSON body", async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error("Invalid payload"); });
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
  });
});
```

**Async Testing:**
```typescript
it("allows adds after debounce window expires", async () => {
  store.addItem(baseItem);
  await new Promise((resolve) => setTimeout(resolve, 350));
  __clearDebounceState();
  store.addItem(baseItem);
  expect(useCartStore.getState().items[0].quantity).toBe(2);
});
```

**E2E Testing Pattern:**
```typescript
import { test, expect } from "@playwright/test";

test.describe("Menu Browsing", () => {
  test("user can browse menu and see categories", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /menu/i })).toBeVisible();
    const menuItems = page.locator('[data-testid="menu-item"]');
    await expect(menuItems.first()).toBeVisible();
  });
});
```

## Where to Add New Tests

**New utility function:**
- Create `src/lib/utils/__tests__/your-util.test.ts`

**New hook:**
- Extract pure logic into a testable function
- Create `src/lib/hooks/__tests__/useYourHook.test.ts`

**New API route:**
- Create `src/app/api/your-route/__tests__/route.test.ts`
- Mock Supabase, rate limiter, logger
- Dynamic import the route handler in `beforeEach`

**New validation schema:**
- Create `src/lib/validations/__tests__/your-schema.test.ts`
- Test with `.safeParse()` for valid and invalid inputs

**New Zustand store:**
- Create `src/lib/stores/__tests__/your-store.test.ts`
- Reset store state in `beforeEach`

**New E2E flow:**
- Create `e2e/your-flow.spec.ts`
- Use `data-testid` attributes for element selection
- Use `getByRole` for semantic queries

---

*Testing analysis: 2026-03-06*
