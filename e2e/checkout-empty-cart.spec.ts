import { test, expect } from "@playwright/test";

/**
 * Phase 110 CFIX-02 — Empty checkout direct-link regression spec.
 *
 * Verifies that direct navigation to /checkout with an empty cart renders
 * `EmptyCheckoutError` synchronously — no spinner, no redirect, no flash.
 * The previous implementation used a `useEffect` + `router.replace` that
 * produced a spinner → toast → redirect flash cycle.
 *
 * Auth: /checkout lives under (customer)/ and requires authentication.
 * Gated on PLAYWRIGHT_AUTH env flag — set it when the e2e auth fixture is
 * wired in.
 */
test.describe("CFIX-02 empty checkout direct link", () => {
  test.skip(
    !process.env.PLAYWRIGHT_AUTH,
    "requires auth helper — set PLAYWRIGHT_AUTH=1 once e2e fixtures are wired"
  );

  test("direct link to /checkout with empty cart shows EmptyCheckoutError immediately", async ({
    page,
  }) => {
    // Ensure cart store is empty by clearing IndexedDB before navigation.
    await page.addInitScript(() => {
      // Best-effort: clear any cart persisted in IDB before app boot.
      if (typeof indexedDB !== "undefined") {
        try {
          indexedDB.deleteDatabase("keyval-store");
        } catch {
          // ignore
        }
      }
    });

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });

    // Empty state heading must be visible without any spinner → redirect loop.
    await expect(
      page.getByRole("heading", { name: /your cart is empty/i })
    ).toBeVisible({ timeout: 2000 });

    // Browse Menu CTA must be present and link to /menu.
    const cta = page.getByRole("link", { name: /browse the menu/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/menu");
  });
});
