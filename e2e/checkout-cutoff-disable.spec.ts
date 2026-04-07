import { test, expect } from "@playwright/test";

/**
 * Phase 110 CFIX-03 — Cutoff submit gate regression spec.
 *
 * Verifies the defense-in-depth cutoff submit gate:
 * 1. Place Order button is visually disabled when CutoffModal is open
 * 2. Clicking the disabled button does NOT fire a request to
 *    /api/checkout/session (handler early-return guard)
 *
 * This exercises both layers of protection: HTML `disabled` attribute AND
 * the `if (cutoffModalOpen) return` guard in handleCheckout. Server-side
 * CUTOFF_PASSED rejection in /api/checkout/session is the third layer,
 * already in place and not modified by this plan.
 *
 * Environment: Requires an authenticated session plus a past-cutoff time
 * fixture. Gated on PLAYWRIGHT_AUTH + PLAYWRIGHT_PAST_CUTOFF env flags.
 * A future infra task can wire up the time fixture (e.g., via MSW or a
 * /api/dev/set-clock shim).
 */
test.describe("CFIX-03 cutoff submit gate", () => {
  test("Place Order button is disabled when CutoffModal is open and does not trigger fetch", async ({
    page,
  }) => {
    test.skip(
      !process.env.PLAYWRIGHT_AUTH || !process.env.PLAYWRIGHT_PAST_CUTOFF,
      "requires auth + past-cutoff time fixture"
    );

    const checkoutRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/checkout/session")) {
        checkoutRequests.push(req.url());
      }
    });

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });

    // Wait for CutoffModal to appear automatically (gate.isOpen === false).
    await expect(
      page.getByText(/cutoff/i).or(page.getByText(/closed for orders/i))
    ).toBeVisible({ timeout: 5000 });

    // Place Order button must be disabled.
    const submit = page.getByRole("button", { name: /place order/i });
    await expect(submit).toBeDisabled();

    // Try to click anyway — must not fire the request. Force-click bypasses
    // Playwright's disabled-click guard so we can confirm the handler guard
    // catches programmatic submission too.
    await submit.click({ force: true }).catch(() => {
      // disabled buttons throw on force-click; that is expected
    });

    // Wait briefly to ensure no in-flight request fires.
    await page.waitForTimeout(500);

    expect(checkoutRequests).toEqual([]);
  });
});
