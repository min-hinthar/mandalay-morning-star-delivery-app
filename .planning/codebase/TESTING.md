# Testing Patterns

**Analysis Date:** 2026-01-21

## Test Framework

**Runner:**
- Vitest (latest)
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in expect API
- `@testing-library/react` for component testing
- `@testing-library/jest-dom` for DOM matchers

**Run Commands:**
```bash
pnpm test              # Run all tests once
pnpm test:ci           # CI mode: bail on first failure, no parallelism
pnpm test:menu         # Run specific test file
pnpm test:e2e          # Run Playwright e2e tests
pnpm test:e2e:ui       # Run e2e tests with browser UI
pnpm test:a11y         # Run accessibility and animation tests
```

## Test File Organization

**Location:**
- Co-located with source files in `__tests__` directories
- Same directory level as module being tested
- One test file per module (e.g., `src/lib/stores/cart-store.ts` → `src/lib/stores/__tests__/cart-store.test.ts`)

**Naming:**
- Pattern: `[module-name].test.ts` or `[module-name].test.tsx`
- Examples: `cart-store.test.ts`, `login-form.test.tsx`, `route.test.ts`

**Structure:**
```
src/
├── lib/
│   ├── stores/
│   │   ├── cart-store.ts
│   │   └── __tests__/
│   │       └── cart-store.test.ts
│   ├── services/
│   │   ├── route-optimization.ts
│   │   └── __tests__/
│   │       └── route-optimization.test.ts
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── __tests__/
│   │       └── login-form.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { myFunction } from "@/lib/services/my-service";

describe("Service Name", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });

  describe("featureName", () => {
    it("should do something when condition met", () => {
      // Arrange
      const input = {};

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe(expected);
    });

    it("handles error case", () => {
      // test error scenario
    });
  });
});
```

**Patterns:**
- `describe()` for grouping related tests
- `it()` for individual test case (readable assertion)
- Nested `describe()` for sub-features
- Arrange-Act-Assert (AAA) pattern (comments optional)
- `beforeEach()` for setup; `afterEach()` for cleanup
- `vi.restoreAllMocks()` after all mocks in test

## Mocking

**Framework:** Vitest `vi` mock API

**Mock Module Pattern:**
```typescript
import { signIn } from "@/lib/supabase/actions";

vi.mock("@/lib/supabase/actions", () => ({
  signIn: vi.fn(),
}));

describe("LoginForm", () => {
  it("submits the email", async () => {
    const signInMock = signIn as Mock;
    signInMock.mockResolvedValue({ success: "Magic link sent" });

    // test code
    expect(signInMock).toHaveBeenCalledTimes(1);
  });
});
```

**Mock Global Objects:**
- `vi.stubGlobal("fetch", vi.fn())` for fetch
- `vi.restoreAllMocks()` to reset all mocks after tests
- Environment variable mocking with `process.env = { ...originalEnv }`

**Example from test setup:**
```typescript
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  process.env = { ...originalEnv };
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env = originalEnv;
  vi.restoreAllMocks();
});
```

**What to Mock:**
- External API calls (fetch, Stripe, Supabase)
- Module dependencies (services, utilities)
- Global objects only when needed (fetch, localStorage)
- Zustand stores: get current state and clear storage

**What NOT to Mock:**
- Internal utilities and helpers
- Data structures and types
- Test setup utilities
- Always test actual validation logic

## Fixtures and Factories

**Test Data:**
- Use factory functions for creating test data
- Located in: `src/test/factories.ts` (check if exists, otherwise inline)
- Pattern:
```typescript
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

// Usage in test
store.addItem(baseItem);
store.addItem({ ...baseItem, quantity: 2 });
```

**Mock Categories:**
```typescript
const categories: MenuCategory[] = [
  {
    id: "cat-1",
    slug: "breakfast",
    name: "Breakfast",
    sortOrder: 1,
    items: [
      {
        id: "item-1",
        slug: "kyay-o",
        nameEn: "Kyay-O / Si-Chat",
        basePriceCents: 1800,
        // ...
      },
    ],
  },
];
```

## Coverage

**Requirements:** No enforced target (not configured)

**View Coverage:**
```bash
pnpm test -- --coverage
```

## Test Types

**Unit Tests:**
- Test individual functions/methods in isolation
- Mock external dependencies
- Examples:
  - `src/lib/utils/format.ts` - utility function behavior
  - `src/lib/stores/cart-store.test.ts` - Zustand store actions
  - `src/lib/validations/analytics.test.ts` - Zod schema validation

**Component Tests:**
- Render component with React Testing Library
- Test user interactions and output
- Mock child components if needed
- Example: `src/components/auth/login-form.test.tsx`
```typescript
it("renders the magic link login form", () => {
  render(<LoginForm />);
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
});

it("submits the email and shows success text", async () => {
  const signInMock = signIn as Mock;
  signInMock.mockResolvedValue({ success: "Magic link sent" });

  render(<LoginForm />);
  const input = screen.getByLabelText("Email");
  fireEvent.change(input, { target: { value: "test@example.com" } });
  fireEvent.submit(container.querySelector("form") as HTMLFormElement);

  expect(await screen.findByText("Magic link sent")).toBeInTheDocument();
});
```

**Integration Tests:**
- Test business logic and validation across modules
- Example: `src/app/api/checkout/session/__tests__/route.test.ts`
- Focus on validation schemas and business rules
- Full API route testing deferred to E2E tests

**E2E Tests:**
- Framework: Playwright (`@playwright/test`)
- Located in: `e2e/` directory
- Run with: `pnpm test:e2e`
- Tests real user workflows
- Examples:
  - `e2e/accessibility.spec.ts` - accessibility compliance
  - `e2e/animations/` - animation behavior

## Common Patterns

**Async Testing:**
```typescript
// Using async/await
it("submits the email and shows success text", async () => {
  const signInMock = signIn as Mock;
  signInMock.mockResolvedValue({ success: "Magic link sent" });

  render(<LoginForm />);
  const input = screen.getByLabelText("Email");
  fireEvent.change(input, { target: { value: "test@example.com" } });

  // Use await with screen.findBy* for async DOM updates
  expect(await screen.findByText("Magic link sent")).toBeInTheDocument();
});

// Using promise chain (alternative)
it("handles promise result", () => {
  const mockFn = vi.fn().mockResolvedValue({ status: "ok" });

  mockFn().then((result) => {
    expect(result.status).toBe("ok");
  });
});
```

**Error Testing:**
```typescript
it("rejects missing addressId", () => {
  const { addressId: _addressId, ...body } = validBody;
  const result = createCheckoutSessionSchema.safeParse(body);

  expect(result.success).toBe(false);
  // Error details in result.error
});

it("returns invalid when stops are missing coordinates", () => {
  const stops: RoutableStop[] = [
    {
      stopId: "stop-1",
      orderId: "order-1",
      address: { lat: null, lng: null, line1: "123 Main St", /* ... */ },
    },
  ];

  const result = validateStopsForOptimization(stops);

  expect(result.valid).toBe(false);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].code).toBe("MISSING_COORDINATES");
});
```

## Setup and Environment

**Setup File:** `src/test/setup.ts`

**What's configured:**
- `@testing-library/jest-dom` imported (provides DOM matchers like `toBeInTheDocument`)
- ResizeObserver mock (not available in jsdom)
- localStorage mock with complete Storage interface
- window.matchMedia mock for media queries
- Test environment variables:
  - `GOOGLE_MAPS_API_KEY=test-google-maps-api-key`
  - `STRIPE_SECRET_KEY=sk_test_mock`
  - `STRIPE_WEBHOOK_SECRET=whsec_test_mock`
  - `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`
  - Supabase keys set for testing

**Vitest Config:**
```typescript
// From vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,              // Use vi, describe, it without imports
    exclude: ["**/node_modules/**", "**/e2e/**"],
    teardownTimeout: 1000,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

## React Testing Library Patterns

**Query Methods (in priority order):**
1. `getByRole()` - most accessible: `screen.getByRole("button", { name: "Submit" })`
2. `getByLabelText()` - for form inputs: `screen.getByLabelText("Email")`
3. `getByPlaceholderText()` - fallback for inputs
4. `getByText()` - for content: `screen.getByText("Our Menu")`
5. `queryBy*()` - for non-existence assertions: `expect(screen.queryByText("X")).not.toBeInTheDocument()`
6. `findBy*()` - for async DOM updates: `expect(await screen.findByText("Success")).toBeInTheDocument()`

**User Interactions:**
```typescript
// Render component
render(<LoginForm />);

// Change input value
fireEvent.change(input, { target: { value: "test@example.com" } });

// Submit form
fireEvent.submit(form as HTMLFormElement);

// Click button (don't use fireEvent for click; use userEvent in modern tests)
fireEvent.click(button);
```

**Wrapper Pattern (for providers):**
```typescript
function renderMenu(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// Usage
renderMenu(<MenuContent categories={categories} />);
```

## Validation Schema Testing

**Pattern:**
```typescript
const validBody = {
  addressId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  scheduledDate: "2026-01-18",
  items: [{ menuItemId: "id", quantity: 2, modifiers: [], notes: "" }],
};

it("accepts valid checkout body", () => {
  const result = createCheckoutSessionSchema.safeParse(validBody);
  expect(result.success).toBe(true);
});

it("rejects missing addressId", () => {
  const { addressId: _addressId, ...body } = validBody;
  const result = createCheckoutSessionSchema.safeParse(body);
  expect(result.success).toBe(false);
});
```

## Store Testing (Zustand)

**Pattern:**
```typescript
describe("CartStore", () => {
  beforeEach(() => {
    // Clear store before each test
    useCartStore.getState().clearCart();
    useCartStore.persist.clearStorage?.();
  });

  it("adds item to cart", () => {
    const store = useCartStore.getState();
    store.addItem(baseItem);

    // Get updated state
    const updated = useCartStore.getState();
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].menuItemId).toBe("item-1");
  });

  it("clamps quantity to MAX_ITEM_QUANTITY", () => {
    const store = useCartStore.getState();
    store.addItem({ ...baseItem, quantity: 100 });

    expect(useCartStore.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
  });
});
```

## Excluded from Tests

**Config excludes:**
- `**/node_modules/**` - third-party code
- `**/e2e/**` - E2E tests run separately with Playwright
- `.next/**` - build output

---

*Testing analysis: 2026-01-21*
