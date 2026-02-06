import { test, expect } from "@playwright/test";

/**
 * Server Component Hydration Tests
 *
 * Parameterized tests to detect hydration mismatches after Server Component conversions.
 * Add routes to CONVERTED_ROUTES as they are converted.
 */

const CONVERTED_ROUTES = [
  { path: "/", name: "Home Page" },
  { path: "/menu", name: "Menu Page" },
  { path: "/admin/analytics", name: "Analytics Page" },
];

const HYDRATION_ERROR_PATTERNS = [
  /hydrat/i,
  /text content does not match/i,
  /server.*client.*mismatch/i,
  /did not match/i,
  /expected server/i,
];

test.describe("Server Component Hydration", () => {
  for (const route of CONVERTED_ROUTES) {
    test(`${route.name} (${route.path}) hydrates without errors`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (HYDRATION_ERROR_PATTERNS.some((p) => p.test(text))) {
            consoleErrors.push(text);
          }
        }
      });

      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      expect(
        consoleErrors,
        `Hydration errors on ${route.path}`
      ).toHaveLength(0);

      const body = page.locator("body");
      await expect(body).toBeVisible();
    });
  }
});

test.describe("Authenticated Route Hydration", () => {
  test.skip("Order Tracking hydrates without errors", async ({
    page: _page,
  }) => {
    // Placeholder for tracking page conversion
    // Will be implemented when /tracking/:id route is converted
  });
});
