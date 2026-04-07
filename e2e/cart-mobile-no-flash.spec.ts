import { test, expect } from "@playwright/test";

/**
 * Phase 110 CFIX-01 — Mobile cart white flash regression spec.
 *
 * Verifies that the /cart page uses CSS-only responsive layout and does not
 * produce a hydration mismatch warning on mobile viewports. The previous
 * implementation used a `useEffect` mobile redirect that created a blank
 * frame between SSR and hydration.
 *
 * Auth: /cart lives under (customer)/ and requires authentication. Gated on
 * PLAYWRIGHT_AUTH env flag — set it when an auth helper is wired in.
 */
test.describe("CFIX-01 mobile cart white flash", () => {
  test.skip(
    !process.env.PLAYWRIGHT_AUTH,
    "requires auth helper — set PLAYWRIGHT_AUTH=1 once e2e fixtures are wired"
  );

  test("mobile viewport renders cart without white flash", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        const text = msg.text();
        if (text.includes("Hydration") || text.includes("hydration")) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto("/cart", { waitUntil: "domcontentloaded" });

    // The mobile wrapper must be visible immediately after navigation — no
    // JS-driven branching, no flash. Use a stable selector: the md:hidden
    // wrapper that only renders at mobile breakpoints.
    const mobileWrapper = page.locator("div.md\\:hidden").first();
    await expect(mobileWrapper).toBeVisible({ timeout: 1000 });

    // Hydration mismatch check — SSR and CSR markup must be identical.
    expect(consoleErrors).toEqual([]);
  });

  test("desktop viewport shows full cart layout", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/cart", { waitUntil: "domcontentloaded" });

    const desktopWrapper = page.locator("div.hidden.md\\:block").first();
    await expect(desktopWrapper).toBeVisible({ timeout: 1000 });
  });
});
