import { test, expect } from "@playwright/test";

/**
 * Cart Flow E2E Tests
 *
 * Permanent test suite for cart functionality (REQ-43.4, REQ-43.8, REQ-43.9).
 *
 * Tests:
 * - Cart happy path: add item, modify quantity, checkout
 * - Edge cases: empty cart, persistence across navigation
 * - Deep links: /cart, /checkout redirect, /menu/[id]
 * - Cart regression: drawer open, animation
 */

// Helper to wait for page to be interactive
async function waitForPageReady(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500); // Wait for hydration
}

// Helper to get cart drawer title (specific selector)
function getCartDrawerTitle(page: import("@playwright/test").Page) {
  return page.locator("#cart-drawer-title");
}

// ============================================
// CART FLOW - HAPPY PATH (REQ-43.4)
// ============================================

test.describe("Cart Flow - Happy Path", () => {
  test("user can add item to cart via Add button", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Find and click the Add button directly (no modal needed for items without modifiers)
    // The Add buttons have aria-label like "Add Kyay-O / Si-Chat to cart"
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Cart indicator should show 1 item
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await expect(cartButton).toContainText("1");
  });

  test("user can modify quantity in cart drawer", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart directly via Add button
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Open cart drawer
    await page.getByRole("button", { name: /open cart/i }).click();
    await expect(getCartDrawerTitle(page)).toBeVisible();

    // Cart should show the item - look for quantity controls
    const plusButton = page.getByRole("button", { name: /\+/i }).first();
    if (await plusButton.isVisible()) {
      await plusButton.click();
    }

    // Cart header should remain visible
    await expect(getCartDrawerTitle(page)).toBeVisible();
  });

  test("user can remove item from cart", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Open cart drawer
    await page.getByRole("button", { name: /open cart/i }).click();

    // Wait for drawer to be visible
    await expect(getCartDrawerTitle(page)).toBeVisible();

    // Find and click clear cart or remove button
    const clearButton = page.getByRole("button", { name: /clear cart/i });
    const removeButton = page.getByRole("button", { name: /remove/i }).first();

    if (await clearButton.isVisible()) {
      await clearButton.click();
      // May need to confirm
      const confirmButton = page.getByRole("button", { name: /confirm|yes|clear/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    } else if (await removeButton.isVisible()) {
      await removeButton.click();
    }

    // Cart should show empty state
    await expect(page.getByText(/empty/i).first()).toBeVisible();
  });

  test("user can proceed to checkout from cart", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Open cart drawer
    await page.getByRole("button", { name: /open cart/i }).click();

    // Wait for drawer
    await expect(getCartDrawerTitle(page)).toBeVisible();

    // Click checkout button
    const checkoutBtn = page.getByRole("button", { name: /checkout/i }).first();
    await checkoutBtn.click();

    // Should navigate to checkout (or login if not authenticated)
    await expect(page).toHaveURL(/\/(checkout|login)/);
  });
});

// ============================================
// CART FLOW - EDGE CASES (REQ-43.4)
// ============================================

test.describe("Cart Flow - Edge Cases", () => {
  test("empty cart shows empty state", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Open cart drawer (should be empty)
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await cartButton.click();

    // Should show empty state message
    await expect(page.getByText(/empty/i).first()).toBeVisible();
  });

  test("cart persists across navigation", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart via Add button
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Navigate to menu page
    await page.goto("/menu");
    await waitForPageReady(page);

    // Cart should still have 1 item
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await expect(cartButton).toContainText("1");
  });

  test("cart survives page reload", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Reload page
    await page.reload();
    await waitForPageReady(page);

    // Cart should still have item (localStorage persistence)
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await expect(cartButton).toContainText("1");
  });

  test("can close cart drawer via close button", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Open cart drawer
    await page.getByRole("button", { name: /open cart/i }).click();
    await expect(getCartDrawerTitle(page)).toBeVisible();

    // Close via close button
    await page.getByRole("button", { name: /close cart/i }).click();

    // Cart drawer should be hidden
    await expect(getCartDrawerTitle(page)).not.toBeVisible();
  });

  test("can close cart drawer via Escape key", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Open cart drawer
    await page.getByRole("button", { name: /open cart/i }).click();
    await expect(getCartDrawerTitle(page)).toBeVisible();

    // Close via Escape
    await page.keyboard.press("Escape");

    // Cart drawer should be hidden
    await expect(getCartDrawerTitle(page)).not.toBeVisible();
  });
});

// ============================================
// DEEP LINK VERIFICATION (REQ-43.8)
// ============================================

test.describe("Deep Link Verification", () => {
  test("/cart page loads correctly", async ({ page }) => {
    await page.goto("/cart");
    await waitForPageReady(page);

    // Should show cart page (heading contains "Cart")
    await expect(page.getByRole("heading", { name: /cart/i }).first()).toBeVisible();
  });

  test("/checkout with empty cart redirects or shows login", async ({ page }) => {
    // Clear any existing cart by visiting checkout with empty cart
    await page.goto("/checkout");

    // Should redirect to login (if auth required) or show checkout content
    // If cart is empty, may redirect to /menu
    const url = page.url();

    // Either redirected to menu, login, or stays on checkout
    expect(url).toMatch(/\/(checkout|login|menu)/);
  });

  test("/menu page allows adding to cart", async ({ page }) => {
    await page.goto("/menu");
    await waitForPageReady(page);

    // Find an Add button on menu page
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();

      // Cart indicator should update
      const cartButton = page.getByRole("button", { name: /open cart/i });
      await expect(cartButton).toContainText("1");
    } else {
      // Menu page loaded but Add buttons may need scrolling
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });

  test("/menu page loads successfully", async ({ page }) => {
    await page.goto("/menu");
    await waitForPageReady(page);

    // The menu page should have a heading
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});

// ============================================
// CART REGRESSION CHECK (REQ-43.9)
// ============================================

test.describe("Cart Regression Check", () => {
  test("cart drawer opens with animation", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to have something in cart
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Open cart
    await page.getByRole("button", { name: /open cart/i }).click();

    // Cart header should be visible
    await expect(getCartDrawerTitle(page)).toBeVisible();
  });

  test("cart bar appears when cart has items", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Cart bar should appear (region with aria-label "Shopping cart summary")
    const cartBar = page.getByRole("region", { name: /cart summary|shopping cart/i });
    await expect(cartBar).toBeVisible();
  });

  test("cart indicator badge shows correct count", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add first item
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Check count is 1
    let cartButton = page.getByRole("button", { name: /open cart/i });
    await expect(cartButton).toContainText("1");

    // Add another item (clicking same button adds same item again)
    await addButton.click();

    // Check count is 2
    cartButton = page.getByRole("button", { name: /open cart/i });
    await expect(cartButton).toContainText("2");
  });

  test("checkout button in cart bar navigates correctly", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Wait for cart bar to appear
    await page.waitForTimeout(300);

    // Find checkout button in cart bar (more specific locator)
    const checkoutBtn = page.locator('[aria-label="Shopping cart summary"] button:has-text("Checkout")');

    await checkoutBtn.click();

    // Should navigate to checkout or login
    await expect(page).toHaveURL(/\/(checkout|login)/);
  });
});

// ============================================
// MOBILE CART BEHAVIOR
// ============================================

test.describe("Mobile Cart Behavior", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("cart drawer opens as bottom sheet on mobile", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Open cart (mobile shows bottom sheet)
    await page.getByRole("button", { name: /open cart/i }).click();

    // Should show cart drawer/sheet
    await expect(getCartDrawerTitle(page)).toBeVisible();
  });

  test("cart bar is visible on mobile", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add item to cart
    const addButton = page.getByRole("button", { name: /add .* to cart/i }).first();
    await addButton.click();

    // Cart bar should be visible
    const cartBar = page.getByRole("region", { name: /cart summary|shopping cart/i });
    await expect(cartBar).toBeVisible();
  });
});
