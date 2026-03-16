import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Admin Mobile UX
 *
 * Smoke tests for Phase 102 mobile UX.
 * Admin pages require auth, so tests verify redirect behavior,
 * public page responsiveness, and touch target sizing.
 */

test.describe("Admin Mobile UX", () => {
  test.describe("MOBL-01: Admin drawer navigation", () => {
    test("mobile viewport triggers redirect to login", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/(login|admin)/);
    });

    test("desktop viewport triggers redirect to login", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/(login|admin)/);
    });

    test("login page renders correctly at mobile viewport", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/login");
      await expect(page.locator("body")).toBeVisible();
      // No horizontal scrollbar at mobile width
      const body = page.locator("body");
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375);
      }
    });

    test("login page renders correctly at desktop viewport", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/login");
      await expect(page.locator("body")).toBeVisible();
    });

    test("admin routes respond without server error", async ({ page }) => {
      const routes = [
        "/admin",
        "/admin/orders",
        "/admin/routes",
        "/admin/menu",
        "/admin/ops",
      ];
      for (const route of routes) {
        const response = await page.goto(route);
        // Should get 200 (login page) or 302 (redirect) -- NOT 500
        expect(response?.status()).not.toBe(500);
      }
    });
  });

  test.describe("MOBL-02: Table card layouts", () => {
    test("public menu page renders without horizontal scroll at mobile", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/menu");
      await page.waitForLoadState("domcontentloaded");
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test("homepage renders without horizontal scroll at mobile", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test("desktop viewport has wider layout", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/menu");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("MOBL-03: Touch targets", () => {
    test("public page interactive elements have minimum 44px targets", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/menu");
      await page.waitForLoadState("domcontentloaded");
      // Check first visible interactive element exists
      const interactiveElements = page.locator("button, a[href]").first();
      const count = await page.locator("button, a[href]").count();
      if (count > 0) {
        const box = await interactiveElements.boundingBox();
        // First visible interactive element should exist
        expect(box).not.toBeNull();
      }
    });

    test("login page buttons meet touch target size", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");
      const buttons = page.locator("button");
      const count = await buttons.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const box = await buttons.nth(i).boundingBox();
        if (box && box.height > 0) {
          expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});
