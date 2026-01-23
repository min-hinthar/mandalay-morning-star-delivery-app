import { test, expect } from "@playwright/test";

/**
 * V8 Overlay Behavior Tests
 * Validates clickability and DOM removal for V8 overlays.
 * Critical verification that AnimatePresence removes elements from DOM.
 */

test.describe("Header Clickability (TEST-01)", () => {
  const routes = ["/", "/menu", "/checkout"];

  for (const route of routes) {
    test(`header buttons clickable on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      // Cart button should be clickable
      const cartButton = page.locator('[data-testid="cart-button"]');
      if (await cartButton.isVisible()) {
        await expect(cartButton).toBeEnabled();
        await cartButton.click();
        // Should open drawer/sheet dialog
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400); // Wait for exit animation
      }
    });
  }

  test.describe("Mobile", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("mobile menu button clickable", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Look for hamburger/menu button
      const menuButton = page.getByRole("button", { name: /menu/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
        // Should open mobile menu
        await expect(page.getByRole("navigation")).toBeVisible();
      }
    });
  });
});

test.describe("Cart Drawer Behavior (TEST-02)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add item to cart to enable drawer content
    const menuItem = page.locator('[data-testid="menu-item"]').first();
    if (await menuItem.isVisible()) {
      await menuItem.click();
      await page.getByRole("button", { name: /add to cart/i }).click();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    }
  });

  test("cart drawer opens with visible content", async ({ page }) => {
    const cartButton = page.locator('[data-testid="cart-button"]');
    await cartButton.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();

    // Content should be visible
    await expect(page.getByText(/your cart|cart/i)).toBeVisible();
    await expect(page.getByText(/subtotal/i)).toBeVisible();
  });

  test("cart drawer closes completely on Escape", async ({ page }) => {
    const cartButton = page.locator('[data-testid="cart-button"]');
    await cartButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400); // Exit animation

    // Verify DOM removal, not just visibility
    await expect(page.getByRole("dialog")).not.toBeVisible();
    const backdropCount = await page
      .locator('[data-testid="overlay-backdrop"]')
      .count();
    expect(backdropCount).toBe(0);
  });

  test("cart drawer closes on backdrop click", async ({ page }) => {
    const cartButton = page.locator('[data-testid="cart-button"]');
    await cartButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Click backdrop
    await page.locator('[data-testid="overlay-backdrop"]').click();
    await page.waitForTimeout(400);

    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test.describe("Mobile", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("cart renders as bottom sheet on mobile", async ({ page }) => {
      const cartButton = page.locator('[data-testid="cart-button"]');
      await cartButton.click();

      // On mobile, CartDrawerV8 uses BottomSheet
      const sheet = page.locator('[data-testid="bottom-sheet-content"]');
      await expect(sheet).toBeVisible();
    });
  });
});
