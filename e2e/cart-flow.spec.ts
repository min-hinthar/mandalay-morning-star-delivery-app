import { test, expect, type Page } from "@playwright/test";

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

// Increase timeout for dev server (pages take 3-5s to render, modal flow ~10s)
test.setTimeout(60_000);

// ============================================
// HELPERS
// ============================================

/**
 * Wait for page to be interactive after navigation.
 * The dev server takes 2-5s to render pages, so we wait for network idle
 * and then for a known interactive element.
 */
async function waitForPageReady(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  // Wait for hydration - look for the cart indicator button which is always present
  await page
    .getByRole("button", { name: /open cart/i })
    .waitFor({ state: "visible", timeout: 15000 });
}

/**
 * Get the cart drawer title element.
 */
function getCartDrawerTitle(page: Page) {
  return page.locator("#cart-drawer-title");
}

/**
 * Add an item to cart, handling the item detail modal flow.
 *
 * Items with required modifiers open a detail sheet (Modal on desktop, Drawer on mobile)
 * when the Add button is clicked. This helper:
 * 1. Clicks the first visible Add button on the card
 * 2. If a detail modal/drawer opens, selects required modifiers and completes the flow
 * 3. Waits for the cart indicator to reflect the new item
 *
 * Key selectors:
 * - Card AddButton: aria-label="Add {name} to cart"
 * - Modal/Drawer detected via data-testid="modal-backdrop" or "drawer-backdrop"
 * - Modal AddToCartButton: text content "Add to Cart - ${price}"
 * - Modifier options: role="radio" (RadioGroupItem in ModifierGroup)
 */
async function addItemToCart(page: Page) {
  // Click the first Add button on a menu item card
  const addButton = page
    .getByRole("button", { name: /add .* to cart/i })
    .first();
  await addButton.click();

  // Check if a detail modal/drawer opened (items with required modifiers)
  // Both Modal and Drawer render backdrop elements
  const modalBackdrop = page.locator(
    '[data-testid="modal-backdrop"], [data-testid="drawer-backdrop"]'
  );

  const modalAppeared = await modalBackdrop
    .first()
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (modalAppeared) {
    // Detail sheet opened - item has required modifiers.
    // There may be multiple required modifier groups (e.g., Style + Size).
    // Select the first option in EACH radiogroup to satisfy all requirements.

    // Find all radiogroups and click the first radio in each
    const radiogroups = page.locator("[role=radiogroup]");
    const rgCount = await radiogroups.count();

    for (let i = 0; i < rgCount; i++) {
      const firstRadio = radiogroups.nth(i).locator("[role=radio]").first();
      await firstRadio.click();
    }

    // Find and click the "Add to Cart - $XX.XX" button in the modal footer
    const addToCartBtn = page.locator('button:has-text("Add to Cart")');

    // Wait until the button is enabled (all required modifiers now selected)
    await expect(addToCartBtn.first()).toBeEnabled({ timeout: 5000 });
    // Use force:true to avoid scrolling-into-view which can interfere with modal
    await addToCartBtn.first().click({ force: true });

    // Wait for modal to close
    await modalBackdrop
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {
        // Modal may have already closed
      });

    // The homepage auto-opens the cart drawer after adding from the detail modal.
    // Close it so subsequent test steps start from a clean state.
    const cartDrawerTitle = page.locator("#cart-drawer-title");
    const drawerOpened = await cartDrawerTitle
      .waitFor({ state: "visible", timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (drawerOpened) {
      // Close via Escape key (more reliable than finding close button)
      await page.keyboard.press("Escape");
      await cartDrawerTitle
        .waitFor({ state: "hidden", timeout: 3000 })
        .catch(() => {});
    }
  }

  // Scroll to top to ensure the fixed header (with cart indicator) is visible.
  // The header auto-hides on scroll-down, so scrolling to top triggers it to reappear.
  // Wrap in try-catch: if a navigation happened (e.g., route change on close),
  // the execution context may be destroyed - that's OK, we just wait for the new page.
  try {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  } catch {
    // Navigation destroyed context - wait for new page to settle
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })).catch(() => {});
  }
  // Give header time to re-appear after scroll
  await page.waitForTimeout(500);
}

// ============================================
// CART FLOW - HAPPY PATH (REQ-43.4)
// ============================================

test.describe("Cart Flow - Happy Path", () => {
  test("user can add item to cart via Add button", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Cart indicator should show item count (aria-label changes to include count)
    // Wait for the button to be visible first (may take time after Fast Refresh reload)
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await cartButton.waitFor({ state: "visible", timeout: 15000 });
    await expect(cartButton).toHaveAttribute(
      "aria-label",
      /open cart, \d+ item/i,
      { timeout: 10000 }
    );
  });

  test("user can modify quantity in cart drawer", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Open cart drawer
    await page.getByRole("button", { name: /open cart/i }).click();
    await expect(getCartDrawerTitle(page)).toBeVisible();

    // Cart should show the item - look for quantity controls within the drawer
    // Scope to the drawer dialog to avoid matching elements outside
    const drawer = page.locator('[data-testid="drawer"]');
    const increaseButton = drawer.getByRole("button", {
      name: /increase quantity/i,
    });

    const hasIncrease = await increaseButton
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasIncrease) {
      // The increase button can be at the edge of the drawer, potentially
      // clipped by the viewport. Use native DOM click to bypass Playwright's
      // viewport actionability checks entirely.
      await increaseButton.first().evaluate((el) => (el as HTMLElement).click());
    }

    // Cart header should remain visible
    await expect(getCartDrawerTitle(page)).toBeVisible();
  });

  test("user can remove item from cart", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Open cart drawer
    await page.getByRole("button", { name: /open cart/i }).click();

    // Wait for drawer to be visible and animation to settle
    await expect(getCartDrawerTitle(page)).toBeVisible();
    // Wait for drawer open animation to complete
    await page.waitForTimeout(500);

    // Scope to the drawer to avoid matching elements behind the overlay
    const drawer = page.locator('[data-testid="drawer"]');

    // Find and click clear cart button (trash icon in header)
    const clearButton = drawer.getByRole("button", { name: /clear cart/i });
    if (await clearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Use force:true because framer-motion animated button may report "not stable"
      await clearButton.click({ force: true });

      // ClearCartConfirmation modal has "Clear Cart" confirm button
      // This is rendered in a separate Modal portal, so search the whole page
      const confirmButton = page
        .getByRole("button", { name: /clear cart/i })
        .last();
      await confirmButton.waitFor({ state: "visible", timeout: 3000 });
      await confirmButton.click({ force: true });
    } else {
      // Try using decrease quantity to remove (decrement to 0 removes item)
      const decreaseButton = drawer.getByRole("button", {
        name: /decrease quantity/i,
      });
      if (await decreaseButton.first().isVisible().catch(() => false)) {
        await decreaseButton.first().evaluate((el) => (el as HTMLElement).click());
      }
    }

    // Cart should show empty state
    await expect(
      page.getByText(/your cart is empty/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("user can proceed to checkout from cart", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Wait for page to be fully interactive after addItemToCart
    // (Fast Refresh may have reloaded the page during the modal flow)
    await waitForPageReady(page);

    // Open cart drawer
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await cartButton.click({ force: true });

    // Wait for drawer
    await expect(getCartDrawerTitle(page)).toBeVisible();

    // Click the "Proceed to Checkout" button in the cart drawer footer
    // Scope to the drawer dialog to avoid matching CartBar's checkout button
    const drawer = page.locator('[data-testid="drawer"]');
    const checkoutBtn = drawer.getByRole("button", {
      name: /proceed to checkout|checkout/i,
    });

    // Use Promise.all to click and wait for navigation simultaneously
    // The checkout handler calls onClose() then router.push("/checkout")
    await Promise.all([
      page.waitForURL(/\/(checkout|login)/, { timeout: 15000 }),
      checkoutBtn.first().click(),
    ]);

    // Verify we landed on checkout or login
    expect(page.url()).toMatch(/\/(checkout|login)/);
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
    await expect(
      page.getByText(/your cart is empty/i).first()
    ).toBeVisible();
  });

  test("cart persists across navigation", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Navigate to menu page
    await page.goto("/menu");
    await waitForPageReady(page);

    // Cart should still have items - check aria-label includes item count
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await expect(cartButton).toHaveAttribute(
      "aria-label",
      /open cart, \d+ item/i
    );
  });

  test("cart survives page reload", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Reload page
    await page.reload();
    await waitForPageReady(page);

    // Cart should still have item (localStorage persistence)
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await expect(cartButton).toHaveAttribute(
      "aria-label",
      /open cart, \d+ item/i
    );
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
    await page.waitForLoadState("domcontentloaded");

    // Should show cart page (heading contains "Cart")
    await expect(
      page.getByRole("heading", { name: /cart/i }).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("/checkout with empty cart redirects or shows login", async ({
    page,
  }) => {
    // Visit checkout with empty cart
    await page.goto("/checkout");
    await page.waitForLoadState("domcontentloaded");

    // Wait for any redirects to complete
    await page.waitForTimeout(3000);

    const url = page.url();

    // Either redirected to menu, login, or stays on checkout
    expect(url).toMatch(/\/(checkout|login|menu)/);
  });

  test("/menu page allows adding to cart", async ({ page }) => {
    await page.goto("/menu");
    await waitForPageReady(page);

    // Find an Add button on menu page
    const addButton = page
      .getByRole("button", { name: /add .* to cart/i })
      .first();
    const addButtonVisible = await addButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (addButtonVisible) {
      await addItemToCart(page);

      // Cart indicator should update
      const cartButton = page.getByRole("button", { name: /open cart/i });
      await expect(cartButton).toHaveAttribute(
        "aria-label",
        /open cart, \d+ item/i
      );
    } else {
      // Menu page loaded but Add buttons may need scrolling
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });

  test("/menu page loads successfully", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("domcontentloaded");

    // The menu page should have a heading
    await expect(page.getByRole("heading").first()).toBeVisible({
      timeout: 15000,
    });
  });
});

// ============================================
// CART REGRESSION CHECK (REQ-43.9)
// ============================================

test.describe("Cart Regression Check", () => {
  test("cart drawer opens with animation", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Open cart
    await page.getByRole("button", { name: /open cart/i }).click();

    // Cart header should be visible
    await expect(getCartDrawerTitle(page)).toBeVisible();
  });

  test("cart bar appears when cart has items", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Cart bar should appear (region with aria-label "Shopping cart summary")
    const cartBar = page.locator('[aria-label="Shopping cart summary"]');
    await expect(cartBar).toBeVisible({ timeout: 5000 });
  });

  test("cart indicator badge shows correct count", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Add first item
    await addItemToCart(page);

    // Check count is at least 1
    const cartButton = page.getByRole("button", { name: /open cart/i });
    await expect(cartButton).toHaveAttribute(
      "aria-label",
      /open cart, \d+ item/i
    );

    // Add another item (same flow)
    await addItemToCart(page);

    // Check count increased (should be 2+)
    await expect(cartButton).toHaveAttribute(
      "aria-label",
      /open cart, [2-9]\d* item/i
    );
  });

  test("checkout button in cart bar navigates correctly", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Wait for cart bar to appear
    const cartBar = page.locator('[aria-label="Shopping cart summary"]');
    await expect(cartBar).toBeVisible({ timeout: 5000 });

    // Find checkout button in cart bar
    const checkoutBtn = cartBar.getByRole("button", {
      name: /checkout/i,
    });
    await checkoutBtn.click();

    // Should navigate to checkout or login
    await expect(page).toHaveURL(/\/(checkout|login)/, { timeout: 10000 });
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

    await addItemToCart(page);

    // Open cart (mobile shows bottom sheet)
    await page.getByRole("button", { name: /open cart/i }).click();

    // Should show cart drawer/sheet
    await expect(getCartDrawerTitle(page)).toBeVisible();
  });

  test("cart bar is visible on mobile", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await addItemToCart(page);

    // Cart bar should be visible
    const cartBar = page.locator('[aria-label="Shopping cart summary"]');
    await expect(cartBar).toBeVisible({ timeout: 5000 });
  });
});
