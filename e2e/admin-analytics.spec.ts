import { test, expect } from "@playwright/test";

/**
 * E2E Admin Analytics Dashboard Tests
 *
 * Tests the admin analytics pages including:
 * - Analytics landing page
 * - Driver analytics dashboard
 * - Delivery metrics dashboard
 *
 * Note: Full tests require admin authentication.
 * These tests verify authentication flows and page structure.
 */

test.describe("Analytics Page Authentication", () => {
  test("redirects to login if not authenticated", async ({ page }) => {
    await page.goto("/admin/analytics");

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test("driver analytics requires authentication", async ({ page }) => {
    await page.goto("/admin/analytics/drivers");

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test("delivery metrics requires authentication", async ({ page }) => {
    await page.goto("/admin/analytics/delivery");

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

/**
 * Authenticated Admin Analytics Tests
 *
 * These tests would use a test fixture that authenticates as an admin.
 */
test.describe.skip("Authenticated Analytics Flow", () => {
  test("analytics landing page shows quick stats", async ({ page }) => {
    await page.goto("/admin/analytics");

    // Should show page title
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();

    // Should show quick stat cards
    await expect(page.getByText("Active Drivers")).toBeVisible();
    await expect(page.getByText("Completed Routes")).toBeVisible();
    await expect(page.getByText("Avg Rating")).toBeVisible();

    // Should show dashboard links
    await expect(page.getByText("Driver Analytics")).toBeVisible();
    await expect(page.getByText("Delivery Metrics")).toBeVisible();
  });

  test("driver analytics dashboard loads with data", async ({ page }) => {
    await page.goto("/admin/analytics/drivers");

    // Should show page title
    await expect(
      page.getByRole("heading", { name: "Driver Analytics" })
    ).toBeVisible();

    // Should show period selector
    await expect(page.getByRole("button", { name: "7 Days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "30 Days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "90 Days" })).toBeVisible();

    // Should show metric cards
    await expect(page.getByText("Active Drivers")).toBeVisible();
    await expect(page.getByText("Team Rating")).toBeVisible();
    await expect(page.getByText("On-Time Rate")).toBeVisible();

    // Should show leaderboard section
    await expect(page.getByText("Top Drivers")).toBeVisible();
  });

  test("delivery metrics dashboard loads with data", async ({ page }) => {
    await page.goto("/admin/analytics/delivery");

    // Should show page title
    await expect(
      page.getByRole("heading", { name: "Delivery Metrics" })
    ).toBeVisible();

    // Should show period selector
    await expect(page.getByRole("button", { name: "7 Days" })).toBeVisible();

    // Should show metric cards
    await expect(page.getByText("Total Orders")).toBeVisible();
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Success Rate")).toBeVisible();

    // Should show charts sections
    await expect(page.getByText("Delivery Volume by Hour")).toBeVisible();
    await expect(page.getByText("ETA Accuracy")).toBeVisible();
  });

  test("can switch between time periods", async ({ page }) => {
    await page.goto("/admin/analytics/drivers");

    // Click 90 Days button
    await page.getByRole("button", { name: "90 Days" }).click();

    // Should update the data (verify button is now selected)
    await expect(page.getByRole("button", { name: "90 Days" })).toHaveClass(
      /bg-saffron/
    );
  });

  test("can navigate from analytics landing to dashboards", async ({ page }) => {
    await page.goto("/admin/analytics");

    // Click on Driver Analytics card
    await page.getByText("Driver Analytics").click();

    // Should navigate to driver analytics
    await expect(page).toHaveURL("/admin/analytics/drivers");
    await expect(
      page.getByRole("heading", { name: "Driver Analytics" })
    ).toBeVisible();
  });

  test("leaderboard shows driver rankings", async ({ page }) => {
    await page.goto("/admin/analytics/drivers");

    // Should show leaderboard with medals
    const leaderboard = page.locator("text=Top Drivers").locator("..");
    await expect(leaderboard).toBeVisible();

    // Check for driver entries (if data exists)
    // Medals for top 3
    await expect(page.locator("svg").first()).toBeVisible();
  });
});
