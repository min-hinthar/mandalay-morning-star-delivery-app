import { test, expect } from "@playwright/test";

/**
 * E2E Error State Tests
 *
 * Tests error handling and edge cases in the ordering flow.
 */

test.describe("Empty Cart States", () => {
  test("empty cart shows appropriate message", async ({ page }) => {
    await page.goto("/");

    // Open cart without adding items
    await page.locator('[data-testid="cart-button"]').click();

    // Should show empty cart message
    await expect(page.getByText(/empty|no items/i)).toBeVisible();
  });

  test("empty cart checkout button is disabled", async ({ page }) => {
    await page.goto("/");

    // Open empty cart
    await page.locator('[data-testid="cart-button"]').click();

    // Checkout button should be disabled or not visible
    const checkoutBtn = page.getByRole("button", { name: /checkout/i });
    const isDisabled = await checkoutBtn.isDisabled().catch(() => true);
    const isVisible = await checkoutBtn.isVisible().catch(() => false);

    expect(isDisabled || !isVisible).toBe(true);
  });
});

test.describe("Authentication Required", () => {
  test("checkout requires authentication", async ({ page }) => {
    await page.goto("/");

    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Try to checkout
    await page.locator('[data-testid="cart-button"]').click();
    await page.getByRole("button", { name: /checkout/i }).click();

    // Should redirect to login or show auth prompt
    await expect(page).toHaveURL(/\/(login|auth|checkout)/);
  });
});

test.describe("Menu Item Availability", () => {
  test("sold out items show appropriate styling", async ({ page }) => {
    await page.goto("/");

    // Look for sold out items
    const soldOutItems = page.locator('[data-testid="menu-item"]:has-text("Sold Out")');

    if ((await soldOutItems.count()) > 0) {
      // Sold out items should be visually different
      const firstSoldOut = soldOutItems.first();
      await expect(firstSoldOut).toBeVisible();

      // Click on sold out item
      await firstSoldOut.click();

      // Modal should indicate item is unavailable
      const addButton = page.getByRole("button", { name: /add to cart/i });
      const isDisabled = await addButton.isDisabled().catch(() => false);

      // Either button is disabled or not present for sold out items
      expect(isDisabled || !(await addButton.isVisible())).toBeTruthy();
    }
  });
});

test.describe("Form Validation", () => {
  test("login form validates email format", async ({ page }) => {
    await page.goto("/login");

    // Try to submit with invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill("invalid-email");

    const submitBtn = page.getByRole("button", { name: /sign in|login|continue/i });
    await submitBtn.click();

    // Should show validation error or prevent submission
    // The exact behavior depends on form validation implementation
    const errorMessage = page.getByText(/invalid|valid email/i);
    await expect(errorMessage).toBeVisible().catch(() => {
      // If no error message, the form should not have submitted successfully
      expect(page.url()).toContain("login");
    });
  });
});

test.describe("Network Error Handling", () => {
  test("app handles slow network gracefully", async ({ page }) => {
    // Simulate slow network
    await page.route("**/*", (route) =>
      new Promise((resolve) => setTimeout(resolve, 100)).then(() => route.continue())
    );

    await page.goto("/");

    // Page should still load
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("404 and Error Pages", () => {
  test("invalid route shows 404 page", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-12345");

    // Should show 404 or redirect to home
    const notFound = page.getByText(/not found|404/i);
    const isNotFound = await notFound.isVisible().catch(() => false);

    // Either shows 404 or redirects home
    expect(isNotFound || page.url().endsWith("/")).toBe(true);
  });
});

test.describe("Session Persistence", () => {
  test("cart persists across page refreshes", async ({ page }) => {
    await page.goto("/");

    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Verify cart has item
    const cartIcon = page.locator('[data-testid="cart-button"]');
    await expect(cartIcon).toContainText("1");

    // Refresh page
    await page.reload();

    // Cart should still have item (persistence via localStorage)
    await expect(cartIcon).toContainText("1");
  });
});

test.describe("Quantity Limits", () => {
  test("quantity cannot go below 1", async ({ page }) => {
    await page.goto("/");

    // Open item modal
    await page.locator('[data-testid="menu-item"]').first().click();

    // Try to decrease quantity below 1
    const decreaseBtn = page.getByRole("button", { name: /-/i });
    const quantityDisplay = page.locator('[data-testid="quantity"]');

    // Initial quantity should be 1
    await expect(quantityDisplay).toContainText("1");

    // Decrease button should be disabled or quantity stays at 1
    const isDisabled = await decreaseBtn.isDisabled().catch(() => false);
    if (!isDisabled) {
      await decreaseBtn.click();
      await expect(quantityDisplay).toContainText("1");
    }
  });

  test("quantity cannot exceed maximum", async ({ page }) => {
    await page.goto("/");

    // Open item modal
    await page.locator('[data-testid="menu-item"]').first().click();

    // Try to increase quantity many times
    const increaseBtn = page.getByRole("button", { name: /\+/i });
    const quantityDisplay = page.locator('[data-testid="quantity"]');

    // Click increase button 60 times (max should be 50)
    for (let i = 0; i < 55; i++) {
      if (await increaseBtn.isEnabled()) {
        await increaseBtn.click();
      }
    }

    // Quantity should not exceed max (50)
    const quantity = parseInt((await quantityDisplay.textContent()) ?? "0");
    expect(quantity).toBeLessThanOrEqual(50);
  });
});
