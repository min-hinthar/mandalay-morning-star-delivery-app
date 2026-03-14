# Testing Patterns

**Analysis Date:** 2026-03-14

## Test Framework

**Runner:**
- Vitest 4.0.17 (unit/integration)
- Playwright 1.57.0 (E2E)
- Config: `vitest.config.ts`, `playwright.config.ts`

**Assertion Library:**
- Vitest built-in `expect` (jest-compatible API)
- `@testing-library/jest-dom` for DOM matchers (`toBeVisible`, `toHaveClass`, etc.)
- Playwright `expect` for E2E assertions

**Run Commands:**
```bash
pnpm test              # Run all unit tests (vitest run)
pnpm test:ci           # CI mode (bail on first failure, no parallelism)
pnpm test:e2e          # E2E tests (playwright test)
pnpm test:e2e:ui       # E2E with interactive UI
pnpm test:menu         # Single test file (vitest run src/components/menu/__tests__/menu-content.test.tsx)
pnpm test:a11y         # Accessibility E2E tests only
pnpm test:animations   # Animation E2E tests only
```

## Vitest Configuration

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,              // describe, it, expect, vi available globally
    exclude: ["**/node_modules/**", "**/e2e/**"],
    teardownTimeout: 1000,      // Force exit to avoid hanging on Windows
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Key points:
- `globals: true` -- no need to import `describe`, `it`, `expect`, `vi` (but some files import explicitly for clarity)
- `jsdom` environment for DOM testing
- Path alias `@/` mirrors `tsconfig.json`
- E2E tests explicitly excluded from Vitest

## Test File Organization

**Location:**
- Unit tests: `__tests__/` subdirectory co-located with source
- E2E tests: `e2e/` top-level directory
- Test setup: `src/test/setup.ts`
- Factories: `src/test/factories/index.ts`
- Mocks: `src/test/mocks/` directory

**Naming:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

**Structure:**
```
src/
  lib/
    utils/
      delivery-dates.ts
      __tests__/
        delivery-dates.test.ts
        delivery-dates-multiday.test.ts
    stores/
      cart-store.ts
      __tests__/
        cart-store.test.ts
    hooks/
      useDeliveryGate.ts
      __tests__/
        useDeliveryGate.test.ts
    validations/
      checkout.ts
      __tests__/
        analytics.test.ts
        driver-api.test.ts
    services/
      coverage.ts
      __tests__/
        coverage.test.ts
  app/
    api/
      webhooks/stripe/
        route.ts
        __tests__/
          route.test.ts
      checkout/session/
        __tests__/
          route.test.ts
          helpers.test.ts
      addresses/
        __tests__/
          transform.test.ts
      tracking/
        __tests__/
          route.test.ts
  test/
    setup.ts             # Global test setup
    factories/
      index.ts           # Mock data factories
    mocks/
      stripe.ts          # Stripe mock events/clients
      google-routes.ts   # Google Routes API mocks
e2e/
  happy-path.spec.ts
  accessibility.spec.ts
  cart-flow.spec.ts
  checkout-flow.spec.ts
  authentication.spec.ts
  customer-tracking.spec.ts
  driver-flow.spec.ts
  admin-operations.spec.ts
  admin-analytics.spec.ts
  visual-regression.spec.ts
  hydration-smoke.spec.ts
  error-states.spec.ts
  animations/
    v7-motion.spec.ts
    v7-accessibility.spec.ts
```

## Test Setup

**File:** `src/test/setup.ts`

```typescript
/// <reference types="vitest/globals" />
import "fake-indexeddb/auto";        // IndexedDB polyfill for cart persistence
import "@testing-library/jest-dom";  // DOM matchers

// Mock ResizeObserver (not in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock localStorage
const localStorageMock = { getItem: () => null, setItem: () => {}, ... };
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock matchMedia (not in jsdom)
Object.defineProperty(window, "matchMedia", {
  value: (query: string) => ({ matches: false, media: query, ... }),
});

// Mock environment variables
process.env.GOOGLE_MAPS_API_KEY = "test-google-maps-api-key";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
```

Key setup features:
- `fake-indexeddb` for testing Zustand stores with IDB persistence
- Browser API mocks for `ResizeObserver`, `localStorage`, `matchMedia`
- Environment variables set for Stripe, Supabase, Google Maps

## Test Structure

**Suite Organization:**
```typescript
// Standard unit test pattern
describe("CartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.persist.clearStorage?.();
    __clearDebounceState();
  });

  describe("addItem", () => {
    it("adds item to cart", () => {
      const store = useCartStore.getState();
      store.addItem(baseItem);
      const updated = useCartStore.getState();
      expect(updated.items).toHaveLength(1);
    });
  });
});
```

**Patterns:**
- Nested `describe` blocks for logical grouping
- `beforeEach` for state reset (stores, mocks)
- Use `getState()` pattern for Zustand store testing (no React rendering needed)
- Descriptive test names: `it("returns isOpen: true when well before cutoff (Wednesday 10AM)")"`
- Bug-tagged tests: `describe("BUG-06: debounce race condition")`
- Feature-tagged tests: `describe("concurrent cart operations (TST-01)")`

**Pure function testing:**
Hooks export pure computation functions alongside React hooks for testability:
```typescript
// In src/lib/hooks/useDeliveryGate.ts
export function computeDeliveryGate(cutoffDay, cutoffHour, now) { ... }  // Pure, testable
export function useDeliveryGate(cutoffDay, cutoffHour) { ... }           // React hook
```

Tests import the pure function directly:
```typescript
import { computeDeliveryGate } from "../useDeliveryGate";
```

## Mocking

**Framework:** Vitest `vi` (built-in)

**Module Mocking Pattern:**
```typescript
// Mock entire module
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  webhookLimiter: {},
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

// Mock with original preserved
vi.mock("next/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/server")>();
  return {
    ...mod,
    after: (cb: () => Promise<void>) => { void cb(); },
  };
});

// Track mock for assertions
const mockConstructEvent = vi.fn();
vi.mock("@/lib/stripe/server", () => ({
  stripe: { webhooks: { constructEvent: (...args) => mockConstructEvent(...args) } },
}));
```

**Global Fetch Mocking:**
```typescript
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

// Usage
vi.mocked(global.fetch).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve(withinCoverageResponse),
} as Response);
```

**Environment Variable Mocking:**
```typescript
vi.stubEnv("DELIVERY_TIMEZONE", "Asia/Yangon");
vi.resetModules();  // Required after env changes
const mod = await import("@/types/delivery");
vi.unstubAllEnvs();
```

**What to Mock:**
- External APIs (Stripe, Google Maps, Supabase)
- `next/headers`, `next/server` (server-only Next.js APIs)
- Rate limiting (`@/lib/rate-limit`)
- Logger (`@/lib/utils/logger`)
- Email sending (`@/lib/email`)
- `fetch` for HTTP calls

**What NOT to Mock:**
- Pure utility functions (test directly)
- Zod schemas (test `.safeParse()` directly)
- Zustand stores (test via `getState()` / `setState()`)
- Business logic functions

## Fixtures and Factories

**Test Data Factories:**
Location: `src/test/factories/index.ts`

```typescript
import type { MenuItemsRow } from "@/types/database";

export function createMockMenuItem(overrides?: Partial<MenuItemsRow>): MenuItemsRow {
  return {
    id: "menu-item-uuid",
    category_id: "category-uuid",
    slug: "test-item",
    name_en: "Test Menu Item",
    base_price_cents: 1500,
    is_active: true,
    is_sold_out: false,
    // ... all required fields with sensible defaults
    ...overrides,
  };
}
```

Available factories:
- `createMockMenuItem(overrides?)` - Menu items
- `createMockModifierOption(overrides?)` - Modifier options
- `createMockAddress(overrides?)` - User addresses
- `createMockOrder(overrides?)` - Orders
- `createValidatedCartItem(menuItem?, modifiers?, quantity?)` - Cart items with computed totals
- `createCheckoutItemInput(menuItemId, quantity?, modifiers?)` - Checkout input (no prices per CHKT-01)

**Stripe Mock Events:**
Location: `src/test/mocks/stripe.ts`

```typescript
export function createMockStripeClient() { ... }
export function createCheckoutCompletedEvent(orderId, userId, paymentIntentId?) { ... }
export function createCheckoutExpiredEvent(orderId, userId) { ... }
export function createChargeRefundedEvent(paymentIntentId, amountCents, fullRefund?) { ... }
export function createPaymentFailedEvent(orderId?) { ... }
```

**Google Routes API Mocks:**
Location: `src/test/mocks/google-routes.ts`

```typescript
export const withinCoverageResponse: MockRoutesResponse = { ... };
export const exceedsDistanceResponse: MockRoutesResponse = { ... };
export const atThresholdResponse: MockRoutesResponse = { ... };
export function createRoutesResponse(distanceMiles, durationMinutes) { ... }
export function createGoogleRoutesFetchMock(response) { ... }
```

**Inline Test Data:**
For simple tests, define data inline rather than using factories:
```typescript
const baseItem = {
  menuItemId: "item-1",
  menuItemSlug: "mohinga",
  nameEn: "Mohinga",
  basePriceCents: 1200,
  quantity: 1,
  modifiers: [],
  notes: "",
};
```

**Date Fixtures:**
Use explicit UTC dates with PT offset comments:
```typescript
// Wednesday, March 4 2026 10:00 AM PT
const WEDNESDAY_10AM = new Date("2026-03-04T18:00:00.000Z");
// Friday, March 6 2026 2:45 PM PT -- 15m before cutoff, critical
const FRIDAY_2_45PM = new Date("2026-03-06T22:45:00.000Z");
```

## Coverage

**Requirements:** None enforced via config. No coverage threshold configured.

**View Coverage:**
```bash
pnpm test -- --coverage    # Vitest coverage
```

## Test Types

**Unit Tests (31 test files):**
- Pure functions: utils (`delivery-dates`, `price`, `format`, `order`, `eta`, `clustering`, `delivery-zones`, `delivery-schedule`, `refund-calc`, `analytics-helpers`)
- Zod validation schemas (`analytics`, `driver-api`, `route`, `checkout`)
- Zustand stores (`cart-store`, `driver-store`)
- Hooks (pure computation functions: `useDeliveryGate`, `useCountdown`)
- API route handlers (webhook processing, checkout session creation, tracking)
- Service functions (`coverage`, `route-optimization`, `delivery-photos`)
- Component helpers (`ops/helpers`)

**E2E Tests (20 spec files in `e2e/`):**
- Happy path: `happy-path.spec.ts` (menu browse -> cart -> checkout)
- Feature flows: `cart-flow.spec.ts`, `checkout-flow.spec.ts`, `authentication.spec.ts`
- Role flows: `driver-flow.spec.ts`, `admin-operations.spec.ts`, `admin-analytics.spec.ts`
- Tracking: `customer-tracking.spec.ts`, `customer-feedback.spec.ts`
- Accessibility: `accessibility.spec.ts`, `animations/v7-accessibility.spec.ts`
- Visual: `visual-regression.spec.ts`, `v4-theme-parity.spec.ts`
- Stability: `hydration-smoke.spec.ts`, `error-states.spec.ts`, `sprint-1-bugfixes.spec.ts`

## E2E Test Patterns

**Playwright Configuration:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "pnpm dev --webpack",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
```

**Visual regression:**
- `maxDiffPixels: 100`, `threshold: 0.2`
- Snapshots in `e2e/__snapshots__/`

**E2E Test Structure:**
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

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });
  // Mobile-specific tests...
});
```

**Test selectors (priority):**
1. Roles: `page.getByRole("button", { name: /add to cart/i })`
2. Test IDs: `page.locator('[data-testid="menu-item"]')`
3. Text: `page.getByText(/subtotal/i)`
4. Locators: `page.locator("text=Sold Out")`

**Accessibility Testing:**
Uses `@axe-core/playwright` for WCAG 2.1 AA compliance:
```typescript
import AxeBuilder from "@axe-core/playwright";

async function checkA11y(page, options?) {
  const builder = new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  const results = await builder.analyze();
  const criticalViolations = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  if (criticalViolations.length > 0) throw new Error(...);
}
```

## Common Unit Test Patterns

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

**Zod Schema Validation Testing:**
```typescript
describe("updateStopStatusSchema", () => {
  it("should accept valid status updates", () => {
    for (const status of ["enroute", "arrived", "delivered", "skipped"]) {
      const result = updateStopStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("should reject delivery notes exceeding 500 characters", () => {
    const result = updateStopStatusSchema.safeParse({
      status: "delivered",
      deliveryNotes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
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

  function makeRequest(body: string, sig = "stripe-sig-valid"): Request {
    return new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body,
      headers: { "stripe-signature": sig, "content-type": "application/json" },
    });
  }

  it("returns 400 for non-JSON body", async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error("Invalid payload"); });
    const res = await POST(makeRequest("not-json-at-all!!!"));
    expect(res.status).toBe(400);
  });
});
```

Key pattern for API tests:
- Dynamic import of route module (`await import("../route")`) after mocks are set
- Helper function for creating Request objects
- Mock Supabase chains: `.from().upsert().select()` pattern
- Assert both status code and response body

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

**Boundary Testing:**
```typescript
it("returns valid at exact threshold (50 miles, 90 minutes)", async () => {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(atThresholdResponse),
  } as Response);
  const result = await checkCoverage(34.1, -118.1);
  expect(result.isValid).toBe(true);
  expect(result.distanceMiles).toBeCloseTo(50, 0);
});
```

## Supabase Mock Chain Pattern

Mock Supabase client calls by building chainable return values:

```typescript
const fromMock = vi.fn();
fromMock.mockImplementation((table: string) => {
  if (table === "webhook_events") {
    return {
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: [{ id: "claimed-1" }],
          error: null,
        }),
      }),
    };
  }
  if (table === "orders") {
    return {
      update: updateMock.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              data: [{ id: "order-123" }],
              error: null,
            }),
          }),
        }),
      }),
    };
  }
});
mockCreateServiceClient.mockReturnValue({ from: fromMock });
```

---

*Testing analysis: 2026-03-14*
