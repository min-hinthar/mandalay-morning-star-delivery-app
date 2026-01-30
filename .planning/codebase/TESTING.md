# Testing Patterns

**Analysis Date:** 2026-01-30

## Test Framework

**Runner:**
- Vitest 4.0.17
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest globals (`describe`, `it`, `expect`, `vi`)
- @testing-library/jest-dom for DOM matchers

**Run Commands:**
```bash
pnpm test              # Run all tests
pnpm test:ci           # CI mode (bail on first failure, no parallelism)
pnpm test:menu         # Run specific test file
pnpm test:e2e          # E2E tests with Playwright
pnpm test:e2e:ui       # Playwright UI mode
pnpm test:a11y         # Accessibility tests
pnpm test:animations   # Animation tests
```

## Test File Organization

**Location:**
- Co-located in `__tests__/` directories next to source files
- Unit tests: `src/lib/**/__tests__/*.test.ts`
- Component tests: `src/components/**/__tests__/*.test.tsx`
- API tests: `src/app/api/**/__tests__/*.test.ts`
- E2E tests: `e2e/*.spec.ts` (separate directory)

**Naming:**
- Unit/integration: `{filename}.test.ts` or `{filename}.test.tsx`
- E2E: `{feature}.spec.ts`

**Structure:**
```
src/
├── lib/
│   ├── utils/
│   │   ├── format.ts
│   │   └── __tests__/
│   │       └── format.test.ts
│   ├── stores/
│   │   ├── cart-store.ts
│   │   └── __tests__/
│   │       └── cart-store.test.ts
├── components/
│   └── ui/
│       └── auth/
│           ├── LoginForm.tsx
│           └── __tests__/
│               └── login-form.test.tsx
e2e/
├── happy-path.spec.ts
├── checkout-flow.spec.ts
└── accessibility.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from "vitest";
import { formatPrice } from "../format";

describe("formatPrice", () => {
  it("formats cents to dollars", () => {
    expect(formatPrice(1500)).toBe("$15.00");
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(99)).toBe("$0.99");
  });
});
```

**Patterns:**
- Top-level `describe` block per function/component
- Nested `describe` blocks for method groups (e.g., `describe("addItem")` within `describe("CartStore")`)
- `beforeEach` for test setup/cleanup
- `it` blocks focus on single assertion or behavior

**Example with setup:**
```typescript
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
      expect(updated.items[0].menuItemId).toBe("item-1");
    });
  });
});
```

## Mocking

**Framework:** Vitest (`vi.mock`, `vi.fn`)

**Patterns:**
```typescript
// Mock module
vi.mock("@/lib/supabase/actions", () => ({
  signIn: vi.fn(),
}));

// Setup mock return value
const signInMock = signIn as Mock;
signInMock.mockResolvedValue({ success: "Magic link sent" });

// Assert mock calls
expect(signInMock).toHaveBeenCalledTimes(1);
const formData = signInMock.mock.calls[0][0] as FormData;
expect(formData.get("email")).toBe("test@example.com");
```

**What to Mock:**
- External API calls (Supabase, Stripe)
- Server actions (`@/lib/supabase/actions`)
- Browser APIs (ResizeObserver, matchMedia, localStorage - mocked in `src/test/setup.ts`)
- Environment variables (mocked in setup for tests)

**What NOT to Mock:**
- Internal utilities (test the real implementation)
- React Testing Library utilities
- Simple helper functions
- Pure functions without side effects

## Fixtures and Factories

**Test Data:**
```typescript
// From cart-store.test.ts
const baseItem = {
  menuItemId: "item-1",
  menuItemSlug: "mohinga",
  nameEn: "Mohinga",
  nameMy: null,
  imageUrl: null,
  basePriceCents: 1200,
  quantity: 1,
  modifiers: [],
  notes: "",
};
```

**Factory Pattern:**
```typescript
// From test/factories/index.ts
import { createMockMenuItem, createMockModifierOption } from "@/test/factories";

// Used in tests
const menuItem = createMockMenuItem();
const modifier = createMockModifierOption();
```

**Location:**
- Factories: `src/test/factories/`
- Inline fixtures: Defined at top of test file for simple cases

## Coverage

**Requirements:** No strict target enforced

**View Coverage:**
```bash
pnpm test -- --coverage
```

**Config:**
- Provider: @vitest/coverage-v8
- Excludes: `node_modules`, `e2e` directory

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, hooks
- Location: `src/lib/**/__tests__/`
- Examples: `format.test.ts`, `delivery-dates.test.ts`, `price.test.ts`
- Approach: Import function, call with inputs, assert outputs

**Integration Tests:**
- Scope: Stores, API validation, multi-function workflows
- Location: `src/lib/stores/__tests__/`, `src/app/api/**/__tests__/`
- Examples: `cart-store.test.ts`, `route.test.ts`
- Approach: Test interactions between multiple units (store + persistence, validation + business logic)

**Component Tests:**
- Scope: React components
- Location: `src/components/**/__tests__/`
- Examples: `login-form.test.tsx`, `signup-form.test.tsx`
- Approach: Render component, interact via Testing Library, assert DOM/behavior

**E2E Tests:**
- Framework: Playwright 1.57.0
- Config: `playwright.config.ts`
- Location: `e2e/*.spec.ts`
- Browsers: Desktop Chrome, Mobile Chrome (Pixel 5)
- Approach: Full user flows in real browser

## Common Patterns

**Async Testing:**
```typescript
it("submits the email and shows success text", async () => {
  const signInMock = signIn as Mock;
  signInMock.mockResolvedValue({ success: "Magic link sent" });

  const { container } = render(<LoginForm />);
  const input = screen.getByLabelText("Email");
  fireEvent.change(input, { target: { value: "test@example.com" } });

  const form = container.querySelector("form");
  fireEvent.submit(form as HTMLFormElement);

  expect(await screen.findByText("Magic link sent")).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
it("rejects invalid addressId format (not UUID)", () => {
  const body = { ...validBody, addressId: "not-a-uuid" };
  const result = createCheckoutSessionSchema.safeParse(body);
  expect(result.success).toBe(false);
});
```

**Store Testing:**
```typescript
it("calculates subtotal with modifiers", () => {
  const store = useCartStore.getState();
  store.addItem({
    ...baseItem,
    quantity: 2,
    modifiers: [
      {
        groupId: "g1",
        groupName: "Spice",
        optionId: "o1",
        optionName: "Extra",
        priceDeltaCents: 100,
      },
    ],
  });

  expect(store.getItemsSubtotal()).toBe(2600);
});
```

**E2E Testing:**
```typescript
test("user can browse menu and see categories", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /menu/i })).toBeVisible();

  const categoryTabs = page.getByRole("tablist");
  await expect(categoryTabs).toBeVisible();

  const menuItems = page.locator('[data-testid="menu-item"]');
  await expect(menuItems.first()).toBeVisible();
});
```

## Test Setup

**Global Setup:**
- File: `src/test/setup.ts`
- Referenced in: `vitest.config.ts` (`setupFiles`)

**Mocks in setup:**
```typescript
// ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};

// matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});
```

**Environment Variables:**
```typescript
process.env.GOOGLE_MAPS_API_KEY = "test-google-maps-api-key";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
```

## E2E Configuration

**Playwright Settings:**
- Test directory: `./e2e`
- Timeout: 30000ms
- Base URL: `http://localhost:3000`
- Retries: 2 in CI, 0 in local
- Workers: 1 in CI, unlimited in local
- Reporter: HTML report

**Visual Regression:**
- Snapshot directory: `e2e/__snapshots__/`
- Max diff pixels: 100
- Threshold: 0.2 (20%)

**Devices:**
- Desktop: Chrome
- Mobile: Pixel 5

**Web Server:**
```javascript
webServer: {
  command: "pnpm dev --webpack",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 180000,
}
```

## Pre-commit Hooks

**Tool:** Husky + lint-staged

**Runs on commit:**
```json
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "eslint --max-warnings=0 --no-warn-ignored"
  ],
  "src/**/*.css": [
    "stylelint"
  ]
}
```

## Verification Pipeline

**Before merge:**
```bash
pnpm lint && pnpm lint:css && pnpm typecheck && pnpm test && pnpm build
```

---

*Testing analysis: 2026-01-30*
