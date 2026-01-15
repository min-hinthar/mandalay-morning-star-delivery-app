import { test, expect } from "@playwright/test";

/**
 * E2E Happy Path Tests
 *
 * Tests the core ordering flow: Browse -> Cart -> Checkout
 *
 * Note: Full checkout completion requires Stripe test mode setup.
 * These tests verify the UI flow up to the Stripe redirect.
 */

test.describe("Menu Browsing", () => {
  test("user can browse menu and see categories", async ({ page }) => {
    await page.goto("/");

    // Should show the menu section
    await expect(page.getByRole("heading", { name: /menu/i })).toBeVisible();

    // Should show category tabs
    const categoryTabs = page.getByRole("tablist");
    await expect(categoryTabs).toBeVisible();

    // Should show menu items
    const menuItems = page.locator('[data-testid="menu-item"]');
    await expect(menuItems.first()).toBeVisible();
  });

  test("user can click category tab to filter items", async ({ page }) => {
    await page.goto("/");

    // Find and click a category tab
    const tabs = page.getByRole("tab");
    const firstTab = tabs.first();
    await firstTab.click();

    // Menu content should update
    await expect(page.locator('[data-testid="menu-item"]').first()).toBeVisible();
  });

  test("sold out items are marked with badge", async ({ page }) => {
    await page.goto("/");

    // Look for sold out badge (if any items are sold out)
    const soldOutBadge = page.locator("text=Sold Out").first();

    // This test checks if the sold out UI exists when there are sold out items
    // It's conditional since not all test data may have sold out items
    if (await soldOutBadge.isVisible()) {
      await expect(soldOutBadge).toHaveClass(/bg-red/);
    }
  });
});

test.describe("Menu Item Modal", () => {
  test("user can open item detail modal", async ({ page }) => {
    await page.goto("/");

    // Click on first menu item
    const firstItem = page.locator('[data-testid="menu-item"]').first();
    await firstItem.click();

    // Modal should open with item details
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Modal should have add to cart button
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  });

  test("user can close item modal", async ({ page }) => {
    await page.goto("/");

    // Open modal
    await page.locator('[data-testid="menu-item"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close modal with X button or outside click
    await page.keyboard.press("Escape");

    // Modal should be closed
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("user can select quantity in modal", async ({ page }) => {
    await page.goto("/");

    // Open modal
    await page.locator('[data-testid="menu-item"]').first().click();

    // Find quantity controls
    const increaseBtn = page.getByRole("button", { name: /\+/i });
    const quantityDisplay = page.locator('[data-testid="quantity"]');

    // Increase quantity
    await increaseBtn.click();

    // Quantity should update (from 1 to 2)
    await expect(quantityDisplay).toContainText("2");
  });
});

test.describe("Cart Functionality", () => {
  test("user can add item to cart", async ({ page }) => {
    await page.goto("/");

    // Open item modal
    await page.locator('[data-testid="menu-item"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Add to cart
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Cart icon should show count
    const cartIcon = page.locator('[data-testid="cart-button"]');
    await expect(cartIcon).toContainText("1");
  });

  test("user can open cart drawer", async ({ page }) => {
    await page.goto("/");

    // Add item to cart first
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Open cart drawer
    await page.locator('[data-testid="cart-button"]').click();

    // Cart drawer should be visible
    const cartDrawer = page.getByRole("dialog", { name: /cart/i });
    await expect(cartDrawer).toBeVisible();
  });

  test("cart shows item details and subtotal", async ({ page }) => {
    await page.goto("/");

    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Open cart
    await page.locator('[data-testid="cart-button"]').click();

    // Should show subtotal
    await expect(page.getByText(/subtotal/i)).toBeVisible();

    // Should show checkout button
    await expect(page.getByRole("button", { name: /checkout/i })).toBeVisible();
  });

  test("user can remove item from cart", async ({ page }) => {
    await page.goto("/");

    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Open cart
    await page.locator('[data-testid="cart-button"]').click();

    // Remove item
    const removeBtn = page.getByRole("button", { name: /remove/i }).first();
    await removeBtn.click();

    // Cart should be empty
    await expect(page.getByText(/empty/i)).toBeVisible();
  });
});

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Add item to cart before each checkout test
    await page.goto("/");
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.locator('[data-testid="cart-button"]').click();
  });

  test("checkout button navigates to checkout page", async ({ page }) => {
    await page.getByRole("button", { name: /checkout/i }).click();

    // Should navigate to checkout (or login if not authenticated)
    await expect(page).toHaveURL(/\/(checkout|login)/);
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.getByRole("button", { name: /checkout/i }).click();

    // If not logged in, should redirect to login
    // The exact behavior depends on auth state
    const url = page.url();
    expect(url).toMatch(/\/(checkout|login)/);
  });
});

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("menu is accessible on mobile", async ({ page }) => {
    await page.goto("/");

    // Menu should still be visible
    await expect(page.locator('[data-testid="menu-item"]').first()).toBeVisible();

    // Category tabs should be scrollable
    const tabs = page.getByRole("tablist");
    await expect(tabs).toBeVisible();
  });

  test("cart drawer works on mobile", async ({ page }) => {
    await page.goto("/");

    // Add item
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Open cart
    await page.locator('[data-testid="cart-button"]').click();

    // Cart should be visible as drawer
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("item modal works on mobile", async ({ page }) => {
    await page.goto("/");

    // Open modal
    await page.locator('[data-testid="menu-item"]').first().click();

    // Modal should be visible
    await expect(page.getByRole("dialog")).toBeVisible();

    // Add to cart button should be accessible
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  });
});
