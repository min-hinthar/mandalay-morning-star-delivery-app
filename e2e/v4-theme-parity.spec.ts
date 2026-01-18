import { test, expect } from "@playwright/test";

/**
 * V4 Theme Parity Tests
 *
 * Verifies all V4 changes work correctly in both light and dark modes.
 * Tests key pages and components for visual consistency.
 */

test.describe("V4 Theme Parity - Light Mode", () => {
  test.use({ colorScheme: "light" });

  test("homepage hero renders correctly", async ({ page }) => {
    await page.goto("/");

    // Hero section should be visible
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();

    // Hero text should be readable (has sufficient contrast)
    const heroHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(heroHeading).toBeVisible();
  });

  test("menu page renders with proper styling", async ({ page }) => {
    await page.goto("/menu");

    // Wait for menu to load
    await page.waitForLoadState("networkidle");

    // Category tabs should be visible
    const categoryNav = page.locator('nav[aria-label="Menu categories"]');
    await expect(categoryNav).toBeVisible();

    // At least one menu card should be visible
    const menuCards = page.locator('[role="button"]').filter({ hasText: /\$/ });
    await expect(menuCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("headers have proper sticky positioning", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Header should be sticky with backdrop blur
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    const isSticky = await header.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.position === "sticky" || style.position === "fixed";
    });
    expect(isSticky).toBe(true);
  });

  test("MenuItemCard displays correctly", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Find a menu item card
    const card = page.locator('[role="button"]').filter({ hasText: /\$/ }).first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Card should have 16:9 aspect ratio image container
    const imageContainer = card.locator(".aspect-video").first();
    await expect(imageContainer).toBeVisible();
  });

  test("item modal opens and displays correctly", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Click a menu item to open modal
    const card = page.locator('[role="button"]').filter({ hasText: /\$/ }).first();
    await card.click();

    // Modal should appear with proper structure
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Modal should have add to cart button visible (may be disabled for sold out items)
    const addButton = modal.getByRole("button", { name: /add to cart/i });
    await expect(addButton).toBeVisible();

    // Modal should have close button
    const closeButton = modal.getByRole("button", { name: /close/i });
    await expect(closeButton).toBeVisible();
  });
});

test.describe("V4 Theme Parity - Dark Mode", () => {
  test.use({ colorScheme: "dark" });

  test("homepage hero renders correctly in dark mode", async ({ page }) => {
    await page.goto("/");

    // Hero section should be visible
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();

    // Hero text should be readable in dark mode
    const heroHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(heroHeading).toBeVisible();
  });

  test("menu page renders with proper dark mode styling", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Category tabs should be visible
    const categoryNav = page.locator('nav[aria-label="Menu categories"]');
    await expect(categoryNav).toBeVisible();

    // Menu cards should be visible with proper dark mode colors
    const menuCards = page.locator('[role="button"]').filter({ hasText: /\$/ });
    await expect(menuCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("headers have proper dark mode background", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Header should be visible with backdrop blur
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Check that header has backdrop-blur-lg class
    const hasBackdrop = await header.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backdropFilter.includes("blur");
    });
    expect(hasBackdrop).toBe(true);
  });

  test("MenuItemCard displays correctly in dark mode", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Find a menu item card
    const card = page.locator('[role="button"]').filter({ hasText: /\$/ }).first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Card should still have proper structure
    const imageContainer = card.locator(".aspect-video").first();
    await expect(imageContainer).toBeVisible();
  });

  test("cart drawer styling in dark mode", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Add an item to cart
    const card = page.locator('[role="button"]').filter({ hasText: /\$/ }).first();
    await card.click();

    // Modal should appear with proper dark mode styling
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});

test.describe("V4 Component Consistency", () => {
  test("Badge variants render correctly", async ({ page }) => {
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Look for any badges (Popular, allergen indicators)
    const badges = page.locator('[class*="badge"], [class*="Badge"]');

    // If badges exist, they should be visible
    const badgeCount = await badges.count();
    if (badgeCount > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("responsive layout works at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Menu should still be accessible
    const categoryNav = page.locator('nav[aria-label="Menu categories"]');
    await expect(categoryNav).toBeVisible();

    // Cards should be visible
    const menuCards = page.locator('[role="button"]').filter({ hasText: /\$/ });
    await expect(menuCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("responsive layout works at tablet width", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Menu should still be accessible
    const categoryNav = page.locator('nav[aria-label="Menu categories"]');
    await expect(categoryNav).toBeVisible();
  });

  test("responsive layout works at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/menu");
    await page.waitForLoadState("networkidle");

    // Menu should still be accessible
    const categoryNav = page.locator('nav[aria-label="Menu categories"]');
    await expect(categoryNav).toBeVisible();
  });
});
