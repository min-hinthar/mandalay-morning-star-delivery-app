import { test, expect } from "@playwright/test";

/**
 * Phase 110 CFIX-05 — Cart validation timeout E2E.
 *
 * Asserts that when /api/menu hangs for 30+ seconds, the
 * CartValidationTimeoutBanner appears with a "Proceed Anyway" button.
 *
 * Gate: requires PLAYWRIGHT_AUTH and a cart-seeding fixture. Matches the
 * gating pattern used by Plan 110-02 E2E specs.
 */
test.describe("CFIX-05 cart validation timeout", () => {
  test("cart page shows Proceed Anyway banner after 30s hang", async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_AUTH,
      "requires authenticated customer fixture + cart seeding helper"
    );

    // Intercept /api/menu to hang indefinitely — simulates a true timeout
    await page.route("**/api/menu**", async () => {
      await new Promise(() => {}); // Never resolves
    });

    // Navigate to the cart page with a pre-seeded cart (fixture TODO)
    await page.goto("/cart", { waitUntil: "domcontentloaded" });

    // Wait up to 35s for the timeout banner to appear (30s timeout + buffer)
    const banner = page.getByRole("alert").filter({
      hasText: /validation taking longer than usual/i,
    });
    await expect(banner).toBeVisible({ timeout: 35000 });

    // Verify the description copy is present
    await expect(
      page.getByText(/we can't confirm item availability right now/i)
    ).toBeVisible();

    // Proceed Anyway button must be actionable and >= 44px height for a11y
    const proceedButton = page.getByRole("button", { name: /proceed anyway/i });
    await expect(proceedButton).toBeVisible();
    const box = await proceedButton.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    // Click Proceed Anyway — banner should disappear (timedOut resets to false)
    await proceedButton.click();
    await expect(banner).not.toBeVisible({ timeout: 2000 });
  });

  test("cart drawer shows timeout banner when opened over hanging /api/menu", async ({
    page,
  }) => {
    test.skip(
      !process.env.PLAYWRIGHT_AUTH,
      "requires authenticated customer fixture + cart seeding helper"
    );

    await page.route("**/api/menu**", async () => {
      await new Promise(() => {});
    });

    // Navigate somewhere that can open the drawer (e.g. menu page)
    await page.goto("/menu", { waitUntil: "domcontentloaded" });

    // Open the cart drawer (selector depends on header; TODO to solidify)
    await page.getByRole("button", { name: /cart/i }).click();

    // Banner appears inside the drawer after 30s
    await expect(
      page.getByRole("alert").filter({ hasText: /validation taking longer than usual/i })
    ).toBeVisible({ timeout: 35000 });

    await expect(page.getByRole("button", { name: /proceed anyway/i })).toBeVisible();
  });
});
