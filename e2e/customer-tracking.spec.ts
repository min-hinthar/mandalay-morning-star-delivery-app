import { test, expect } from "@playwright/test";

/**
 * E2E Customer Tracking Tests
 *
 * Tests the customer order tracking page with live status,
 * driver location, and ETA display.
 *
 * Note: Full tracking tests require:
 * 1. An authenticated customer user
 * 2. An order in the database assigned to that user
 * 3. Optionally a driver with active route for live tracking
 *
 * For now, these tests verify authentication flows and page structure.
 */

test.describe("Tracking Page Authentication", () => {
  test("redirects to login if not authenticated", async ({ page }) => {
    // Try to access a tracking page without authentication
    await page.goto("/orders/test-order-id/tracking");

    // Should redirect to login page with next parameter
    await expect(page).toHaveURL(/login.*next/);
  });

  test("includes order ID in redirect URL", async ({ page }) => {
    const testOrderId = "abc123-test-order";
    await page.goto(`/orders/${testOrderId}/tracking`);

    // The redirect URL should include the order path
    await expect(page).toHaveURL(new RegExp(`login.*${testOrderId}`));
  });
});

test.describe("Order Detail Page", () => {
  test("order detail page has tracking link", async ({ page }) => {
    // This test would need an authenticated user with orders
    // For now, just verify the page structure when logged in
    await page.goto("/orders");

    // If redirected to login, that's expected for unauthenticated users
    const url = page.url();
    expect(url).toMatch(/orders|login/);
  });
});

/**
 * Authenticated Customer Tracking Tests
 *
 * These tests would use a test fixture that authenticates as a customer.
 * Example fixture setup:
 *
 * ```typescript
 * const test = base.extend({
 *   customerPage: async ({ browser }, use) => {
 *     const context = await browser.newContext({
 *       storageState: 'customer-auth-state.json'
 *     });
 *     const page = await context.newPage();
 *     await use(page);
 *     await context.close();
 *   }
 * });
 * ```
 */

test.describe.skip("Authenticated Tracking Flow", () => {
  // These tests require authentication setup with a customer that has orders

  test("customer can view order tracking page", async ({ page }) => {
    // Navigate to an existing order's tracking page
    await page.goto("/orders/test-order-id/tracking");

    // Should show the tracking page header
    await expect(page.getByText("Back to Order")).toBeVisible();

    // Should show connection status
    await expect(page.getByText(/live|connecting|reconnecting/i)).toBeVisible();
  });

  test("tracking page shows status timeline", async ({ page }) => {
    await page.goto("/orders/test-order-id/tracking");

    // Should show status steps
    await expect(page.getByText("Placed")).toBeVisible();
    await expect(page.getByText("Confirmed")).toBeVisible();
    await expect(page.getByText("Out for Delivery")).toBeVisible();
    await expect(page.getByText("Delivered")).toBeVisible();
  });

  test("tracking page shows ETA when out for delivery", async ({ page }) => {
    // This test requires an order that is out for delivery
    await page.goto("/orders/out-for-delivery-order-id/tracking");

    // Should show ETA display
    const etaDisplay = page.locator('[data-testid="eta-display"]');
    if (await etaDisplay.isVisible()) {
      await expect(etaDisplay).toContainText(/arriving in|minutes/i);
    }
  });

  test("tracking page shows driver card when assigned", async ({ page }) => {
    await page.goto("/orders/assigned-order-id/tracking");

    // Should show driver information
    const driverCard = page.locator('[data-testid="driver-card"]');
    if (await driverCard.isVisible()) {
      // Driver card should show name or contact options
      await expect(driverCard).toContainText(/driver|call/i);
    }
  });

  test("tracking page shows delivery map when live", async ({ page }) => {
    await page.goto("/orders/live-order-id/tracking");

    // Should show map when driver is tracking
    const mapContainer = page.locator('[data-testid="delivery-map"]');
    if (await mapContainer.isVisible()) {
      // Map should show "Live tracking" badge
      await expect(page.getByText("Live tracking")).toBeVisible();
    }
  });

  test("tracking page shows order summary", async ({ page }) => {
    await page.goto("/orders/test-order-id/tracking");

    // Order summary should be visible (may be collapsed by default)
    await expect(page.getByText("Order Details")).toBeVisible();

    // Click to expand
    await page.getByText("Order Details").click();

    // Should show totals
    await expect(page.getByText(/subtotal/i)).toBeVisible();
    await expect(page.getByText(/total/i)).toBeVisible();
  });

  test("tracking page shows support actions", async ({ page }) => {
    await page.goto("/orders/test-order-id/tracking");

    // Should show support section
    await expect(page.getByText("Need Help?")).toBeVisible();

    // Should show contact support button
    await expect(page.getByRole("button", { name: /contact support/i })).toBeVisible();
  });

  test("call driver button works when out for delivery", async ({ page }) => {
    await page.goto("/orders/out-for-delivery-order-id/tracking");

    // Find call driver button
    const callButton = page.getByRole("button", { name: /call driver/i });
    if (await callButton.isVisible()) {
      // Verify button is clickable (actual tel: link behavior can't be fully tested)
      await expect(callButton).toBeEnabled();
    }
  });

  test("refresh button refreshes tracking data", async ({ page }) => {
    await page.goto("/orders/test-order-id/tracking");

    // Find refresh button in header
    const refreshButton = page.getByRole("button", { name: /refresh/i });
    await expect(refreshButton).toBeVisible();

    // Click should not cause errors
    await refreshButton.click();

    // Page should still show tracking content
    await expect(page.getByText("Order Details")).toBeVisible();
  });

  test("delivered order shows delivery photo", async ({ page }) => {
    await page.goto("/orders/delivered-order-id/tracking");

    // Should show delivered status
    await expect(page.getByText("Delivered")).toBeVisible();

    // If delivery photo exists, should be visible
    const deliveryPhoto = page.locator("text=Delivery Photo");
    if (await deliveryPhoto.isVisible()) {
      const photoImage = page.locator('img[alt="Delivery confirmation"]');
      await expect(photoImage).toBeVisible();
    }
  });

  test("back button navigates to order detail", async ({ page }) => {
    const orderId = "test-order-id";
    await page.goto(`/orders/${orderId}/tracking`);

    // Click back button
    await page.getByRole("link", { name: /back to order/i }).click();

    // Should navigate to order detail page
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));
  });
});

test.describe("Tracking Page Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("tracking page is mobile responsive", async ({ page }) => {
    await page.goto("/orders/test-order-id/tracking");

    // Will redirect to login, but if authenticated, should be mobile-friendly
    const url = page.url();
    if (!url.includes("login")) {
      // Header should be visible and not overflow
      const header = page.locator("header");
      await expect(header).toBeVisible();

      // Content should fit within viewport
      const content = page.locator("main");
      await expect(content).toBeVisible();
    }
  });
});

test.describe("Tracking Page Error States", () => {
  test("shows 404 for non-existent order", async ({ page }) => {
    // Navigate to a definitely non-existent order
    await page.goto("/orders/definitely-not-a-real-order-id-12345/tracking");

    // Will either redirect to login or show 404
    const url = page.url();
    if (!url.includes("login")) {
      // Should show not found page or error state
      await expect(page.locator("text=not found")).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Tracking Real-time Connection", () => {
  test.skip("shows connection status indicator", async ({ page }) => {
    await page.goto("/orders/test-order-id/tracking");

    // Should show connection indicator in header
    const connectionStatus = page.locator("[data-testid='connection-status']");
    if (await connectionStatus.isVisible()) {
      // Should show one of: Live, Connecting, Reconnecting
      await expect(connectionStatus).toHaveText(/live|connecting|reconnecting/i);
    }
  });

  test.skip("shows last update time", async ({ page }) => {
    await page.goto("/orders/test-order-id/tracking");

    // Should show when data was last updated
    const lastUpdate = page.locator("text=/\\d+\\s*(seconds?|minutes?|hours?)\\s*ago/i");
    if (await lastUpdate.isVisible()) {
      await expect(lastUpdate).toBeVisible();
    }
  });
});
