# Test Resilience

Build UIs that are easy to test and tests that don't break on refactors.

## Data Attributes over Classes

### Why Data Attributes
- Classes change with styling
- Test IDs are explicit and stable
- Data attributes can encode state

### Pattern
```tsx
<button
  data-testid="submit-button"
  data-state={isLoading ? "loading" : "idle"}
  data-variant="primary"
>
  Submit
</button>

<div
  data-testid="menu-item"
  data-sold-out={isSoldOut}
  data-featured={isFeatured}
>
  {item.name}
</div>
```

### Testing
```ts
// Find element
const button = screen.getByTestId("submit-button");

// Assert state
expect(button).toHaveAttribute("data-state", "loading");

// Query by state
const soldOutItems = screen.getAllByTestId("menu-item")
  .filter(el => el.getAttribute("data-sold-out") === "true");
```

## Behavior over Implementation

### Bad: Implementation Details
```ts
// Breaks when class changes
expect(button.classList.contains("bg-blue-500")).toBe(true);

// Breaks when structure changes
expect(container.querySelector(".card > .title")).toHaveText("Hello");

// Breaks when animation library changes
expect(element.style.transform).toBe("translateX(100px)");
```

### Good: Behavior & Accessibility
```ts
// Tests actual behavior
expect(button).toBeDisabled();
expect(button).toHaveAttribute("aria-pressed", "true");

// Tests what users see
expect(screen.getByRole("heading")).toHaveTextContent("Hello");

// Tests user interaction result
fireEvent.click(button);
expect(screen.getByRole("dialog")).toBeVisible();
```

## Playwright Best Practices

### Locators: Prefer Accessible Queries
```ts
// Best: Role-based (matches accessibility tree)
await page.getByRole("button", { name: "Submit" });
await page.getByRole("heading", { level: 1 });
await page.getByRole("link", { name: "Home" });

// Good: Label-based
await page.getByLabel("Email");
await page.getByPlaceholder("Search...");

// Acceptable: Test ID (when no accessible name)
await page.getByTestId("complex-widget");

// Avoid: CSS selectors (brittle)
await page.locator(".btn-primary"); // Don't
```

### Exact Matching
```ts
// Bad: Matches "All", "All-Day Breakfast", "Small"
await page.getByText("All");

// Good: Exact match
await page.getByRole("tab", { name: "All", exact: true });
await page.getByText("All", { exact: true });
```

### Waiting
```ts
// Bad: Arbitrary timeout
await page.waitForTimeout(1000);

// Good: Wait for specific condition
await expect(page.getByRole("dialog")).toBeVisible();
await page.waitForResponse(/api\/users/);
await page.getByRole("button").waitFor({ state: "enabled" });
```

### Assertions
```ts
// Bad: Exact pixel values (fragile)
const height = await element.evaluate(el => el.offsetHeight);
expect(height).toBe(56); // Fails with 1px border change

// Good: Behavior-based
await expect(element).toHaveCSS("position", "sticky");
await expect(element).toBeInViewport();

// Good: Approximate when needed
const height = await element.evaluate(el => el.offsetHeight);
expect(height).toBeGreaterThanOrEqual(56);
expect(height).toBeLessThanOrEqual(60);
```

## Unit Test Patterns

### Mock Browser APIs
```ts
// setup.ts
beforeAll(() => {
  // ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // matchMedia
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });

  // IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
```

### Testing Hooks
```ts
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

test("increments counter", () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Testing Async Components
```ts
import { render, screen, waitFor } from "@testing-library/react";

test("loads and displays data", async () => {
  render(<UserProfile userId="123" />);

  // Loading state
  expect(screen.getByText("Loading...")).toBeInTheDocument();

  // Wait for data
  await waitFor(() => {
    expect(screen.getByRole("heading")).toHaveTextContent("John Doe");
  });
});
```

## Component Testing Strategy

### What to Test
| Level | What | How |
|-------|------|-----|
| Unit | Hooks, utilities | Vitest/Jest |
| Component | Isolated components | Testing Library |
| Integration | Component interactions | Testing Library |
| E2E | Full user flows | Playwright |

### Test Structure
```ts
describe("Button", () => {
  describe("rendering", () => {
    it("renders children", () => {});
    it("applies variant classes", () => {});
  });

  describe("interaction", () => {
    it("calls onClick when clicked", () => {});
    it("does not call onClick when disabled", () => {});
  });

  describe("accessibility", () => {
    it("has correct role", () => {});
    it("is focusable", () => {});
  });

  describe("states", () => {
    it("shows loading spinner when loading", () => {});
    it("is disabled when loading", () => {});
  });
});
```

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Test CSS classes | Test behavior/state |
| Hardcode pixel values | Use ranges or behavior |
| Use arbitrary waits | Wait for conditions |
| Test implementation details | Test user-visible results |
| Rely on DOM structure | Use accessible queries |
| Test every style | Test critical visual states |
| Mock everything | Mock only externals |

## Snapshot Testing

### When to Use
- Complex rendered output that's hard to assert
- Regression detection for UI components
- NOT for frequently changing components

### Pattern
```ts
import { render } from "@testing-library/react";

test("renders correctly", () => {
  const { container } = render(<Icon name="star" />);
  expect(container.firstChild).toMatchSnapshot();
});
```

### When to Avoid
- Components with dynamic content
- Components that change frequently
- Large component trees

## Checklist

- [ ] Use data-testid for complex elements
- [ ] Prefer role/label queries over CSS selectors
- [ ] Test behavior, not implementation
- [ ] Mock only browser APIs and external services
- [ ] Use exact matching for text
- [ ] Wait for conditions, not arbitrary timeouts
- [ ] Test all interactive states
- [ ] Include accessibility assertions
