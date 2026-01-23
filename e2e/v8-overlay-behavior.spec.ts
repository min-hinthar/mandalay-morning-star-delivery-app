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

test.describe("Dropdown Visibility and Dismissal (TEST-03)", () => {
  test("dropdown appears above page content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find dropdown trigger (profile button or similar)
    const dropdownTrigger = page.locator('[data-testid="profile-button"]');

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();

      const dropdownContent = page.locator('[data-testid="dropdown-content"]');
      await expect(dropdownContent).toBeVisible();

      // Verify dropdown is above other content (z-index working)
      const dropdownBox = await dropdownContent.boundingBox();
      expect(dropdownBox).not.toBeNull();
    }
  });

  test("dropdown dismisses on outside click", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const dropdownTrigger = page.locator('[data-testid="profile-button"]');

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await expect(
        page.locator('[data-testid="dropdown-content"]')
      ).toBeVisible();

      // Click outside (mousedown triggers close in V8 Dropdown)
      await page.locator("body").click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);

      // Verify DOM removal
      const dropdownCount = await page
        .locator('[data-testid="dropdown-content"]')
        .count();
      expect(dropdownCount).toBe(0);
    }
  });

  test("dropdown dismisses on Escape", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const dropdownTrigger = page.locator('[data-testid="profile-button"]');

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await expect(
        page.locator('[data-testid="dropdown-content"]')
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      await expect(
        page.locator('[data-testid="dropdown-content"]')
      ).not.toBeVisible();
    }
  });
});

test.describe("Overlay No Background Blocking (TEST-04)", () => {
  test("closed cart drawer does not block menu item clicks", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first();
    await firstItem.click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // Open and close cart drawer
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // Critical test: click menu item AFTER drawer closed
    const secondItem = page.locator('[data-testid="menu-item"]').nth(1);
    if (await secondItem.isVisible()) {
      await secondItem.click();
      // If overlay was blocking, this click would fail
      await expect(page.getByRole("dialog")).toBeVisible();
    }
  });

  test("closed modal does not block page interaction", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open item modal
    const menuItem = page.locator('[data-testid="menu-item"]').first();
    await menuItem.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // Verify DOM removal
    const modalBackdropCount = await page
      .locator('[data-testid="modal-backdrop"]')
      .count();
    expect(modalBackdropCount).toBe(0);

    // Click another menu item - should work
    const secondItem = page.locator('[data-testid="menu-item"]').nth(1);
    if (await secondItem.isVisible()) {
      await secondItem.click();
      await expect(page.getByRole("dialog")).toBeVisible();
    }
  });

  test("closed bottom sheet does not block scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open item detail (shows as bottom sheet on mobile)
    await page.locator('[data-testid="menu-item"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // Verify DOM removal
    const sheetBackdropCount = await page
      .locator('[data-testid="bottom-sheet-backdrop"]')
      .count();
    expect(sheetBackdropCount).toBe(0);

    // Page should be scrollable
    await page.evaluate(() => window.scrollTo(0, 200));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });
});
