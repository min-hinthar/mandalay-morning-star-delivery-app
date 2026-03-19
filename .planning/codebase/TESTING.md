# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

**Unit/Integration Runner:**
- Vitest 4.0.17
- Config: `vitest.config.ts`
- Environment: jsdom
- Globals: enabled (no explicit `import { describe, it, expect }` needed — though files frequently import them explicitly for IDE autocomplete)

**Component Testing:**
- `@testing-library/react` 16.3.1 — `render`, `screen`, `renderHook`, `act`
- `@testing-library/jest-dom` 6.9.1 — DOM matchers (`toBeInTheDocument`, `toBeVisible`, etc.)
- `fake-indexeddb` 6.2.5 — auto-loaded in setup for IDB storage in cart store tests

**E2E Runner:**
- `@playwright/test` 1.57.0
- Config: `playwright.config.ts`
- Browsers: Chromium (Desktop Chrome), Mobile Chrome (Pixel 5)

**Visual Regression:**
- Playwright `toHaveScreenshot` — pixel-diff with `maxDiffPixels: 100`, `threshold: 0.2`
- Chromatic + Storybook — `chromatic.config.js`, via `pnpm chromatic`

**Accessibility:**
- `@axe-core/playwright` 4.11.0 — WCAG 2.1 AA, critical/serious violations only

**Run Commands:**
```bash
pnpm test              # Run all unit tests (vitest run)
pnpm test:ci           # CI with bail on first failure (--bail 1 --no-file-parallelism)
pnpm test:e2e          # Playwright E2E tests
pnpm test:e2e:ui       # Playwright with interactive UI
pnpm test:a11y         # Accessibility spec files only
pnpm test:animations   # Animation E2E specs only
```

## Test File Organization

**Location:**
- Unit/integration tests: co-located in `__tests__/` subdirectory next to source
- E2E tests: `e2e/` directory at project root

**Naming:**
- Unit: `[SourceFile].test.ts` or `[SourceFile].test.tsx`
- E2E: `[feature-area].spec.ts`

**Structure example:**
```
src/app/api/checkout/session/
  route.ts
  helpers.ts
  __tests__/
    route.test.ts
    helpers.test.ts

src/lib/hooks/
  useAcceptRoute.ts
  __tests__/
    useAcceptRoute.test.ts

e2e/
  happy-path.spec.ts
  authentication.spec.ts
  accessibility.spec.ts
  admin-operations.spec.ts
  visual-regression.spec.ts
```

## Test Setup

**File:** `src/test/setup.ts` — loaded via `vitest.config.ts` `setupFiles`

**Global mocks configured in setup:**
```typescript
import "fake-indexeddb/auto";         // IDB for cart store
import "@testing-library/jest-dom";   // DOM matchers

// ResizeObserver (not in jsdom)
global.ResizeObserver = class ResizeObserver { observe() {} unobserve() {} disconnect() {} };

// localStorage stub
Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

// matchMedia stub
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({ matches: false, media: query, addListener: () => {}, ... }),
});

// Environment variables
process.env.GOOGLE_MAPS_API_KEY = "test-google-maps-api-key";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
```

## Unit Test Structure

**Standard pattern:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ComponentOrModule", () => {
  describe("specific behavior or method", () => {
    it("does X when Y", () => {
      // arrange
      const result = functionUnderTest(input);
      // assert
      expect(result).toBe(expected);
    });
  });
});
```

**Hook testing with renderHook:**
```typescript
import { renderHook, act } from "@testing-library/react";

it("tracks isAccepting state during fetch", async () => {
  const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1" }));
  expect(result.current.isAccepting).toBe(false);

  await act(async () => {
    await result.current.acceptRoute();
  });

  expect(result.current.isAccepting).toBe(false);
});
```

**Component rendering:**
```typescript
import { render, screen } from "@testing-library/react";

it("renders timestamp when arrivedAt is set", () => {
  render(<RouteStopCard stop={createMockStop({ arrivedAt: "2026-03-15T10:30:00Z" })} {...defaultProps} />);
  expect(screen.getByTestId("tracking-timestamps")).toBeInTheDocument();
});
```

**Store tests — direct state manipulation:**
```typescript
describe("CartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.persist.clearStorage?.();
    __clearDebounceState();
    useCartStore.getState().setDeliverySettings(DELIVERY_FEE, FREE_DELIVERY_THRESHOLD);
  });

  it("adds item to cart", () => {
    useCartStore.getState().addItem(baseItem);
    const updated = useCartStore.getState();
    expect(updated.items).toHaveLength(1);
  });
});
```

## Mocking Patterns

**Module mocks with `vi.mock()`:**
```typescript
// Place vi.mock() calls before imports — Vitest hoists them
vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));
```

**Partial mock with async original:**
```typescript
vi.mock("next/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/server")>();
  return {
    ...mod,
    after: (cb: () => Promise<void>) => { void cb(); },
  };
});
```

**Global fetch mocking:**
```typescript
const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// Usage:
(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});
```

**Supabase client chain mocking (builder pattern):**
```typescript
const fromMock = vi.fn();

fromMock.mockImplementation((table: string) => {
  if (table === "orders") {
    return {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ data: [{ id: "order-1" }], error: null }),
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({ data: mockOrder, error: null }),
        }),
      }),
    };
  }
  return {};
});

mockCreateServiceClient.mockReturnValue({ from: fromMock });
```

**Framer Motion mock (component tests):**
```typescript
vi.mock("framer-motion", () => {
  function createMotionComponent(tag: string) {
    return ({ children, initial: _i, animate: _a, transition: _t, ...props }: Record<string, unknown>) => {
      const Tag = tag as unknown as React.ElementType;
      return <Tag {...props}>{children as React.ReactNode}</Tag>;
    };
  }
  const handler = { get: (_: unknown, prop: string) => createMotionComponent(prop) };
  return {
    m: new Proxy({}, handler),
    motion: new Proxy({}, handler),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});
```

**Next.js mocks:**
```typescript
// next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

// next/cache — pass-through for server functions
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));
```

**Timer mocking:**
```typescript
beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

// Advance and flush:
await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
```

## Fixtures and Factories

**Location:** `src/test/factories/index.ts`

**Pattern — factory functions with optional overrides:**
```typescript
export function createMockMenuItem(overrides?: Partial<MenuItemsRow>): MenuItemsRow {
  return {
    id: "menu-item-uuid",
    name_en: "Test Menu Item",
    base_price_cents: 1500,
    is_active: true,
    // ... all required fields with sensible defaults
    ...overrides,
  };
}
```

**Available factories:**
- `createMockMenuItem(overrides?)` → `MenuItemsRow`
- `createMockModifierOption(overrides?)` → `ModifierOptionsRow`
- `createMockAddress(overrides?)` → `AddressesRow`
- `createMockOrder(overrides?)` → `OrdersRow`
- `createValidatedCartItem(menuItem?, modifiers?, quantity?)` → cart item with computed totals
- `createCheckoutItemInput(menuItemId, quantity?, modifiers?)` → checkout API input

**Location:** `src/test/mocks/stripe.ts`

**Pattern — typed Stripe event builders:**
```typescript
export function createCheckoutCompletedEvent(
  orderId: string,
  userId: string,
  paymentIntentId = "pi_test_123456"
): Stripe.Event { ... }

export function createCheckoutExpiredEvent(orderId: string, userId: string): Stripe.Event { ... }
export function createChargeRefundedEvent(paymentIntentId: string, amountCents: number, fullRefund?: boolean): Stripe.Event { ... }
export function createPaymentFailedEvent(orderId?: string): Stripe.Event { ... }
```

**Inline fixtures for component tests:**
```typescript
function createMockStop(overrides: Partial<StopDetail> = {}): StopDetail {
  return {
    id: "stop-1",
    status: "pending" as RouteStopStatus,
    arrivedAt: null,
    deliveredAt: null,
    order: { ... },
    ...overrides,
  };
}
```

## Mocking Strategy

**What to mock:**
- External services (Supabase, Stripe, Google Maps, Resend)
- `next/headers`, `next/cache`, `next/server`
- Framer Motion (component tests only — avoid jsdom animation issues)
- `globalThis.fetch` for hook tests that call API endpoints
- Logger (`@/lib/utils/logger`) — always no-op in tests
- Toast (`@/lib/hooks/useToastV8`) — spy to assert toast calls
- Rate limiter (`@/lib/rate-limit`) — always allow in route tests

**What NOT to mock:**
- Zod schemas (test the actual validation logic)
- Pure utility functions (test directly without mocking)
- Zustand stores (test the real store state)
- `src/test/factories` utilities (they are test helpers, not subjects)

## E2E Test Patterns

**File:** `e2e/[feature].spec.ts`

**Basic page test:**
```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Area", () => {
  test("user can do X", async ({ page }) => {
    await page.goto("/path");
    await expect(page.getByRole("heading", { name: /title/i })).toBeVisible();

    const items = page.locator('[data-testid="item"]');
    await expect(items.first()).toBeVisible();
  });
});
```

**Skipped tests (require auth):**
```typescript
test.skip("admin can view orders", async ({ page }) => {
  // Requires admin authentication — runs manually or with auth state fixture
});
```

**Visual regression:**
```typescript
test("homepage - desktop", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500); // animations settle

  await expect(page).toHaveScreenshot("homepage-desktop.png", {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

**Network mocking (font routes):**
```typescript
async function mockFonts(page: Page) {
  await page.route("**/fonts.googleapis.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" })
  );
}
```

**Accessibility check:**
```typescript
import AxeBuilder from "@axe-core/playwright";

const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  .analyze();

const criticalViolations = results.violations.filter(
  (v) => v.impact === "critical" || v.impact === "serious"
);
// assert criticalViolations.length === 0
```

**Playwright config:**
- `testDir: "./e2e"`
- `timeout: 30000`
- `retries: 2` in CI, `0` locally
- `workers: 1` in CI, auto locally
- `webServer`: `pnpm dev`, reuse existing server locally
- Snapshots: `e2e/__snapshots__/`

## Coverage

**Requirements:** None enforced (no coverage thresholds configured in `vitest.config.ts`).

**View coverage:**
```bash
pnpm test -- --coverage  # add coverage flag to vitest run
```

## Test Types

**Unit Tests** — `src/**/__tests__/*.test.ts(x)`:
- Pure functions: utility functions, Zod schemas, formatters, business logic helpers
- Hooks: behavior via `renderHook`/`act`, state transitions, error paths
- Stores: Zustand state mutations and computed selectors directly
- API helpers: pure functions extracted from route handlers

**Integration Tests** — co-located with API routes:
- Route handlers: mock Supabase chains, assert status codes and response shape
- Webhook handlers: mock event constructors, assert DB update calls
- Auth flows: mock `requireAdmin`, assert 401/403 responses

**E2E Tests** — `e2e/*.spec.ts`:
- User flows: menu browsing, cart, checkout redirect
- Auth redirects: unauthenticated access → login redirect
- Accessibility: axe-core WCAG 2.1 AA audit
- Visual regression: screenshot comparison (Playwright + Chromatic)
- Animation behavior: `e2e/animations/`

**Storybook** — `src/stories/` and `src/**/*.stories.tsx`:
- Design system documentation only (no production stories found)
- Chromatic runs visual regression on stories
- `@storybook/addon-vitest` for story-level unit tests
- `@storybook/addon-a11y` for in-browser accessibility checks

## Storybook Setup

**Config:** `.storybook/main.ts`, `.storybook/preview.ts`

**Story discovery:** `src/**/*.stories.@(js|jsx|mjs|ts|tsx)` and `src/**/*.mdx`

**Framework:** `@storybook/nextjs-vite` (Vite-based, fast HMR)

**Preview configuration:**
```typescript
// Viewports: mobile (375px), tablet (768px), desktop (1280px)
// Backgrounds: light (#F8F5F0), dark (#1A1A1A)
// Theme toggle: sets data-theme on documentElement
// Imports: src/app/globals.css (includes Tailwind v4 tokens)
```

**Chromatic integration:**
- `chromatic.config.js` — project token from `CHROMATIC_PROJECT_TOKEN` env var
- `onlyChanged: true` — only snapshot changed stories
- `turboSnap.bailIfNotBuilt: true`
- Viewports tested: 375, 640, 768, 1024, 1280
- Delay: 300ms before capture (animations settle)
- `diffThreshold: 0.063`
- Ignore: `[data-chromatic-ignore]`, `.chromatic-ignore`, `[data-testid="timestamp"]`

## Common Async Patterns

**Async hook testing:**
```typescript
it("shows error toast on network error", async () => {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));
  const { result } = renderHook(() => useAcceptRoute({ routeId: "route-1" }));

  await act(async () => {
    await result.current.acceptRoute();
  });

  expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
});
```

**Polling hook testing with fake timers:**
```typescript
it("polls every N milliseconds", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  renderHook(() => useRouteProgressPolling(3000));

  await vi.advanceTimersByTimeAsync(0);
  expect(global.fetch).toHaveBeenCalledTimes(1);

  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
```

**Dynamic import for route handler (avoid mock hoisting issues):**
```typescript
beforeEach(async () => {
  vi.clearAllMocks();
  const routeModule = await import("../route");
  POST = routeModule.POST;
});
```

**Zod schema validation testing:**
```typescript
it("accepts valid status updates", () => {
  const result = updateStopStatusSchema.safeParse({ status: "delivered" });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.status).toBe("delivered");
  }
});

it("rejects invalid values", () => {
  const result = schema.safeParse({ status: "invalid" });
  expect(result.success).toBe(false);
});
```

## CI Integration

**Linting/type-checking (run before tests):**
```bash
pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck
```

**Full verification suite:**
```bash
pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

**CI-specific behavior:**
- `vitest run --bail 1 --no-file-parallelism` for `pnpm test:ci`
- Playwright: `forbidOnly: true`, `retries: 2`, `workers: 1`
- Chromatic: `autoAcceptChanges: "main"` (feature branches require manual review)
- Husky pre-commit: `lint-staged` runs ESLint + Stylelint on staged files

---

*Testing analysis: 2026-03-18*
