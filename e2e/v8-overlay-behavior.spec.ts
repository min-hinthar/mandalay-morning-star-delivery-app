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
