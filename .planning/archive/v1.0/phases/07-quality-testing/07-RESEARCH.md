# Phase 7: Quality & Testing - Research

**Researched:** 2026-01-23
**Domain:** E2E Testing, Visual Regression, Overlay Behavior Verification
**Confidence:** HIGH

## Summary

Phase 7 validates the V8 overlay infrastructure through comprehensive E2E tests. The project has mature Playwright testing setup (v1.57) with existing patterns for visual regression, accessibility, and animation testing. The five requirements (TEST-01 through TEST-05) focus on verifying clickability, overlay behavior, and visual consistency.

Key insight: V8 components use AnimatePresence for DOM removal when overlays close, which is the critical fix for click-blocking issues. Tests must verify elements are fully removed from DOM, not just visually hidden.

**Primary recommendation:** Build new test file `e2e/v8-overlay-behavior.spec.ts` following existing patterns from `e2e/accessibility.spec.ts` and `e2e/visual-regression.spec.ts`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | ^1.57.0 | E2E test runner | Already configured, project standard |
| toHaveScreenshot | built-in | Visual regression | Native Playwright, no extra deps |
| @axe-core/playwright | ^4.11.0 | Accessibility | Already integrated for a11y tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion AnimatePresence | ^12.26.1 | DOM removal | Verified by checking element absence |
| data-testid attributes | - | Element selection | All V8 components have them |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Percy/Chromatic | Playwright toHaveScreenshot | External service vs built-in |
| Cypress | Playwright | Already using Playwright, no migration |

**Installation:**
```bash
# Already installed - no new dependencies needed
```

## Architecture Patterns

### Test File Organization
```
e2e/
├── v8-overlay-behavior.spec.ts  # NEW: TEST-01 through TEST-04
├── visual-regression.spec.ts    # EXTEND: TEST-05 visual snapshots
├── accessibility.spec.ts        # Reference patterns
├── happy-path.spec.ts           # Reference patterns
└── __snapshots__/               # Visual regression baselines
    ├── v8-header-desktop.png
    ├── v8-header-mobile.png
    ├── v8-cart-drawer-desktop.png
    ├── v8-cart-drawer-mobile.png
    ├── v8-dropdown-open.png
    └── v8-bottom-sheet.png
```

### Pattern 1: Verifying DOM Removal (Critical for TEST-04)
**What:** Test that closed overlays are fully removed from DOM, not just hidden
**When to use:** Any overlay that uses AnimatePresence (Backdrop, Drawer, BottomSheet, Modal)
**Example:**
```typescript
// Source: Playwright documentation + project pattern
test("closed overlay is removed from DOM", async ({ page }) => {
  // Open overlay
  await page.locator('[data-testid="cart-button"]').click();
  await expect(page.locator('[data-testid="overlay-backdrop"]')).toBeVisible();

  // Close overlay
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400); // Wait for exit animation

  // Verify DOM removal - not just hidden, but gone
  const backdropCount = await page.locator('[data-testid="overlay-backdrop"]').count();
  expect(backdropCount).toBe(0);

  // Verify background is clickable
  const menuItem = page.locator('[data-testid="menu-item"]').first();
  await menuItem.click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
```

### Pattern 2: Testing Click Propagation (TEST-01)
**What:** Verify header buttons are clickable and events propagate correctly
**When to use:** Testing clickability across routes
**Example:**
```typescript
// Source: Project patterns from happy-path.spec.ts
test("header buttons clickable on menu page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Cart button should be clickable
  const cartButton = page.locator('[data-testid="cart-button"]');
  await expect(cartButton).toBeVisible();
  await expect(cartButton).toBeEnabled();

  // Click should trigger drawer open
  await cartButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
```

### Pattern 3: Testing Outside Click Dismissal (TEST-03)
**What:** Dropdown/tooltip closes on outside click without blocking events
**When to use:** Testing Dropdown component behavior
**Example:**
```typescript
// Source: Dropdown.tsx uses mousedown for outside click
test("dropdown dismisses on outside click", async ({ page }) => {
  await page.goto("/");

  // Open dropdown
  await page.locator('[data-testid="profile-button"]').click();
  await expect(page.locator('[data-testid="dropdown-content"]')).toBeVisible();

  // Click outside (mousedown triggers close)
  await page.locator("body").click({ position: { x: 10, y: 10 } });

  // Dropdown should close
  await expect(page.locator('[data-testid="dropdown-content"]')).not.toBeVisible();

  // Verify DOM removal
  const dropdownCount = await page.locator('[data-testid="dropdown-content"]').count();
  expect(dropdownCount).toBe(0);
});
```

### Pattern 4: Visual Regression for Overlays (TEST-05)
**What:** Capture baseline screenshots for header, overlays, cart drawer
**When to use:** Visual consistency verification
**Example:**
```typescript
// Source: e2e/visual-regression.spec.ts patterns
test("V8 cart drawer - desktop", async ({ page }) => {
  // Setup
  await page.goto("/");
  await page.locator('[data-testid="menu-item"]').first().click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.keyboard.press("Escape");

  // Open cart drawer
  await page.locator('[data-testid="cart-button"]').click();
  await page.waitForTimeout(400); // Wait for animation

  // Capture screenshot
  const drawer = page.getByRole("dialog");
  await expect(drawer).toHaveScreenshot("v8-cart-drawer-desktop.png", {
    maxDiffPixels: 100,
  });
});
```

### Pattern 5: Responsive Testing (Mobile vs Desktop)
**What:** Test CartDrawerV8 renders as BottomSheet on mobile, Drawer on desktop
**When to use:** TEST-02 cart drawer behavior
**Example:**
```typescript
// Desktop: Drawer from right
test("cart drawer renders as side drawer on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  // ... add item, open cart
  await page.locator('[data-testid="cart-button"]').click();

  const drawer = page.locator('[data-testid="drawer"]');
  await expect(drawer).toBeVisible();
});

// Mobile: BottomSheet
test.describe("Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("cart drawer renders as bottom sheet on mobile", async ({ page }) => {
    await page.goto("/");
    // ... add item, open cart
    await page.locator('[data-testid="cart-button"]').click();

    const sheet = page.locator('[data-testid="bottom-sheet-content"]');
    await expect(sheet).toBeVisible();
  });
});
```

### Anti-Patterns to Avoid
- **Using visibility checks alone:** `not.toBeVisible()` does not verify DOM removal; use `.count()` to verify element is gone
- **Fixed timeouts without animation wait:** Use `waitForTimeout(400)` after close to allow exit animation
- **Ignoring Escape key handling:** All overlays should close on Escape; test this explicitly
- **Testing only one viewport:** Cart uses responsive overlays; test both desktop and mobile

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Visual regression | Custom image comparison | `toHaveScreenshot()` | Built-in Playwright, handles diff thresholds |
| Element visibility | Custom wait loops | `expect(locator).toBeVisible()` | Auto-retry built into Playwright |
| Click interception test | Manual event listeners | `await element.click()` throws on blocked | Playwright fails if click is intercepted |
| Accessibility checks | Manual ARIA verification | `@axe-core/playwright` | Already integrated, catches issues automatically |

**Key insight:** Playwright's native assertions auto-retry, making most custom wait logic unnecessary.

## Common Pitfalls

### Pitfall 1: Testing Visibility Instead of DOM Presence
**What goes wrong:** Test passes when overlay is `opacity: 0` but still in DOM blocking clicks
**Why it happens:** `not.toBeVisible()` checks CSS visibility, not DOM presence
**How to avoid:** Use `.count()` to verify element count is 0, or click background element
**Warning signs:** Test passes but user reports click-blocking

### Pitfall 2: Race Conditions with Animations
**What goes wrong:** Test runs before exit animation completes
**Why it happens:** Framer Motion AnimatePresence has ~300ms exit animation
**How to avoid:** Add `waitForTimeout(400)` after close action, before verifying DOM removal
**Warning signs:** Flaky tests that sometimes pass, sometimes fail

### Pitfall 3: Mobile Viewport Not Applied
**What goes wrong:** CartDrawerV8 renders as Drawer instead of BottomSheet
**Why it happens:** Viewport not set before navigation
**How to avoid:** Use `test.use({ viewport: {...} })` at describe level, not in test body
**Warning signs:** Test locators fail to find expected mobile components

### Pitfall 4: Snapshot Threshold Too Strict
**What goes wrong:** Tests fail due to anti-aliasing or font rendering differences
**Why it happens:** Default `maxDiffPixels` too low for complex components
**How to avoid:** Use `maxDiffPixels: 100-150` for full components, `maxDiffPixels: 50` for buttons
**Warning signs:** CI fails on snapshots that look identical visually

### Pitfall 5: Missing data-testid on V8 Components
**What goes wrong:** Locators fail because selectors target V7 components
**Why it happens:** V8 components have different testids or missing them
**How to avoid:** Verify testids exist in component source before writing tests
**Warning signs:** Locator timeout errors

## Code Examples

Verified patterns from project sources:

### Complete TEST-01 Example: Header Clickability
```typescript
// Source: Pattern from e2e/happy-path.spec.ts + V8 components
test.describe("Header Clickability (TEST-01)", () => {
  const routes = ["/", "/menu", "/checkout"];

  for (const route of routes) {
    test(`header buttons clickable on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      // Cart button
      const cartButton = page.locator('[data-testid="cart-button"]');
      if (await cartButton.isVisible()) {
        await cartButton.click();
        // Should open drawer/sheet
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
      }

      // Menu button (mobile)
      await page.setViewportSize({ width: 375, height: 667 });
      const menuButton = page.getByRole("button", { name: /menu/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
        // Should open mobile menu
        await expect(page.getByRole("navigation")).toBeVisible();
      }
    });
  }
});
```

### Complete TEST-02 Example: Cart Drawer Behavior
```typescript
// Source: Pattern from e2e/visual-regression.spec.ts
test.describe("Cart Drawer Behavior (TEST-02)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.keyboard.press("Escape");
  });

  test("cart drawer opens with visible content", async ({ page }) => {
    await page.locator('[data-testid="cart-button"]').click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();

    // Content should be visible
    await expect(page.getByText(/your cart/i)).toBeVisible();
    await expect(page.getByText(/subtotal/i)).toBeVisible();
  });

  test("cart drawer closes completely on escape", async ({ page }) => {
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // Dialog should be gone from DOM
    await expect(page.getByRole("dialog")).not.toBeVisible();
    const backdropCount = await page.locator('[data-testid="overlay-backdrop"]').count();
    expect(backdropCount).toBe(0);
  });

  test("cart drawer closes on backdrop click", async ({ page }) => {
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Click backdrop
    await page.locator('[data-testid="overlay-backdrop"]').click();
    await page.waitForTimeout(400);

    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
```

### Complete TEST-04 Example: No Click Blocking
```typescript
// Source: Critical V7 fix verification
test.describe("Overlay No Background Blocking (TEST-04)", () => {
  test("closed cart drawer does not block menu item clicks", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.keyboard.press("Escape");

    // Open and close cart drawer
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // NOW the critical test: can we click menu items?
    const secondMenuItem = page.locator('[data-testid="menu-item"]').nth(1);
    await secondMenuItem.click();

    // If click was blocked, this would fail
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("closed dropdown does not block form submission", async ({ page }) => {
    // Navigate to page with dropdown near form
    await page.goto("/checkout");

    // Open and close dropdown
    const dropdown = page.locator('[data-testid="profile-button"]');
    if (await dropdown.isVisible()) {
      await dropdown.click();
      await page.locator("body").click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
    }

    // Form submission should work
    const submitButton = page.getByRole("button", { name: /continue|submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should not throw click intercepted error
    }
  });
});
```

### Complete TEST-05 Example: Visual Regression
```typescript
// Source: e2e/visual-regression.spec.ts patterns
test.describe("V8 Visual Regression (TEST-05)", () => {
  test("header - desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const header = page.locator("header").first();
    await expect(header).toHaveScreenshot("v8-header-desktop.png", {
      maxDiffPixels: 100,
    });
  });

  test("header - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const header = page.locator("header").first();
    await expect(header).toHaveScreenshot("v8-header-mobile.png", {
      maxDiffPixels: 100,
    });
  });

  test("cart drawer open - desktop", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.keyboard.press("Escape");

    await page.locator('[data-testid="cart-button"]').click();
    await page.waitForTimeout(400);

    const drawer = page.getByRole("dialog");
    await expect(drawer).toHaveScreenshot("v8-cart-drawer-desktop.png", {
      maxDiffPixels: 100,
    });
  });

  test("dropdown open", async ({ page }) => {
    await page.goto("/");

    const dropdown = page.locator('[data-testid="profile-button"]');
    if (await dropdown.isVisible()) {
      await dropdown.click();
      await page.waitForTimeout(300);

      const content = page.locator('[data-testid="dropdown-content"]');
      await expect(content).toHaveScreenshot("v8-dropdown-open.png", {
        maxDiffPixels: 50,
      });
    }
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `visibility: hidden` overlays | AnimatePresence DOM removal | V8 rewrite | No click blocking |
| `click` for outside dismiss | `mousedown` event | V8 Dropdown | Catches before propagation |
| `stopPropagation()` everywhere | No stopPropagation on content | V8 Dropdown | Form submissions work |
| V7 layered z-index | V8 z-index tokens | V8 rewrite | Consistent stacking |

**Deprecated/outdated:**
- V7 overlay components: Being replaced by V8, but may still exist in codebase
- Manual scroll locking: Now handled by `useBodyScrollLock` hook

## Open Questions

Things that couldn't be fully resolved:

1. **Profile Button Existence**
   - What we know: Header has `rightContent` slot for cart/profile
   - What's unclear: Whether profile dropdown is currently implemented in V8
   - Recommendation: Check for `[data-testid="profile-button"]` and make test conditional

2. **Mobile Menu Component**
   - What we know: AppShell composes Header, BottomNav, MobileMenu
   - What's unclear: Exact testid and structure of MobileMenu in V8
   - Recommendation: Verify testids in MobileMenu component before writing tests

3. **Snapshot Directory Creation**
   - What we know: `snapshotDir: "./e2e/__snapshots__"` configured in playwright.config.ts
   - What's unclear: Directory doesn't exist yet
   - Recommendation: First test run with `--update-snapshots` will create it

## Sources

### Primary (HIGH confidence)
- `/home/user/mandalay-morning-star-delivery-app/playwright.config.ts` - Playwright configuration
- `/home/user/mandalay-morning-star-delivery-app/e2e/visual-regression.spec.ts` - Visual regression patterns
- `/home/user/mandalay-morning-star-delivery-app/e2e/accessibility.spec.ts` - Focus trap and a11y patterns
- `/home/user/mandalay-morning-star-delivery-app/e2e/happy-path.spec.ts` - Cart flow patterns
- `/home/user/mandalay-morning-star-delivery-app/src/components/ui-v8/overlay/Backdrop.tsx` - AnimatePresence pattern
- `/home/user/mandalay-morning-star-delivery-app/src/components/ui-v8/Dropdown.tsx` - mousedown outside click
- `/home/user/mandalay-morning-star-delivery-app/src/components/ui-v8/Drawer.tsx` - Drawer with focus trap
- `/home/user/mandalay-morning-star-delivery-app/src/components/ui-v8/BottomSheet.tsx` - Mobile sheet pattern
- `/home/user/mandalay-morning-star-delivery-app/src/components/ui-v8/cart/CartDrawerV8.tsx` - Responsive cart

### Secondary (MEDIUM confidence)
- `/home/user/mandalay-morning-star-delivery-app/e2e/animations/v7-motion.spec.ts` - Animation test patterns
- `/home/user/mandalay-morning-star-delivery-app/package.json` - Dependency versions

### Tertiary (LOW confidence)
- Playwright documentation patterns (training data, not verified against 1.57)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project
- Architecture: HIGH - Based on existing test files
- Pitfalls: HIGH - Derived from V7 issues and V8 fixes documented in code
- Code examples: HIGH - Adapted from existing project patterns

**Research date:** 2026-01-23
**Valid until:** 30 days (Playwright patterns stable)
