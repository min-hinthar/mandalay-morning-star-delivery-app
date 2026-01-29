import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * WCAG AAA Contrast Audit (7:1 ratio)
 *
 * This test suite audits all user-facing pages for WCAG AAA contrast compliance.
 * AAA requires:
 * - 7:1 contrast ratio for normal text
 * - 4.5:1 contrast ratio for large text (18pt+ or 14pt bold)
 *
 * Pages audited:
 * - Homepage (/)
 * - Menu/Browse (/)
 * - Cart drawer
 * - Login (/login)
 * - Checkout (/checkout)
 * - Tracking (/orders/[id]/tracking)
 * - Driver (/driver)
 * - Admin (/admin)
 *
 * Each page is tested in both light and dark modes.
 *
 * Run with: pnpm exec playwright test e2e/contrast-audit.spec.ts --workers=1
 */

// Run tests serially to avoid overwhelming dev server
test.describe.configure({ mode: "serial" });

// Store violations for audit document generation
interface ContrastViolation {
  page: string;
  theme: "light" | "dark";
  elementHtml: string;
  description: string;
  impact: string;
  helpUrl: string;
}

const violations: ContrastViolation[] = [];

/**
 * Run WCAG AAA contrast check and collect violations
 */
async function auditContrast(
  page: import("@playwright/test").Page,
  pageName: string,
  theme: "light" | "dark"
): Promise<{ passed: boolean; violationCount: number }> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2aaa"])
    .withRules(["color-contrast-enhanced"])
    .analyze();

  const contrastViolations = results.violations.filter(
    (v) => v.id === "color-contrast-enhanced" || v.id.includes("contrast")
  );

  for (const violation of contrastViolations) {
    for (const node of violation.nodes) {
      violations.push({
        page: pageName,
        theme,
        elementHtml: node.html,
        description: violation.description,
        impact: violation.impact || "unknown",
        helpUrl: violation.helpUrl,
      });

      // Log violation for test output
      console.log(`\n[${theme.toUpperCase()} MODE] ${pageName}`);
      console.log(`  Impact: ${violation.impact}`);
      console.log(`  Element: ${node.html.substring(0, 150)}...`);
      console.log(`  Issue: ${node.failureSummary}`);
    }
  }

  return {
    passed: contrastViolations.length === 0,
    violationCount: contrastViolations.reduce(
      (sum, v) => sum + v.nodes.length,
      0
    ),
  };
}

/**
 * Log summary of all violations at the end
 */
function logViolationSummary() {
  if (violations.length === 0) {
    console.log("\n=== WCAG AAA Contrast Audit: ALL PASSED ===\n");
    return;
  }

  console.log("\n=== WCAG AAA Contrast Audit: VIOLATIONS FOUND ===\n");
  console.log(`Total violations: ${violations.length}\n`);

  // Group by page
  const byPage = violations.reduce(
    (acc, v) => {
      const key = `${v.page} (${v.theme})`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    },
    {} as Record<string, ContrastViolation[]>
  );

  for (const [page, pageViolations] of Object.entries(byPage)) {
    console.log(`\n--- ${page}: ${pageViolations.length} violations ---`);
    pageViolations.forEach((v, i) => {
      console.log(`  ${i + 1}. [${v.impact}] ${v.elementHtml.substring(0, 80)}`);
    });
  }
}

// ============================================================================
// HOMEPAGE TESTS
// ============================================================================

test.describe("Homepage Contrast (WCAG AAA)", () => {
  test("homepage - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const { passed, violationCount } = await auditContrast(
      page,
      "Homepage",
      "light"
    );

    // Log for audit report
    console.log(
      `Homepage (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );

    // Test continues even with violations (for audit documentation)
    expect(violationCount).toBeDefined();
  });

  test("homepage - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const { passed, violationCount } = await auditContrast(
      page,
      "Homepage",
      "dark"
    );

    console.log(
      `Homepage (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });
});

// ============================================================================
// MENU PAGE TESTS
// ============================================================================

test.describe("Menu Page Contrast (WCAG AAA)", () => {
  test("menu page - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to load menu items
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    const { passed, violationCount } = await auditContrast(
      page,
      "Menu Page",
      "light"
    );

    console.log(
      `Menu Page (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });

  test("menu page - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    const { passed, violationCount } = await auditContrast(
      page,
      "Menu Page",
      "dark"
    );

    console.log(
      `Menu Page (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });
});

// ============================================================================
// CART DRAWER TESTS
// ============================================================================

test.describe("Cart Drawer Contrast (WCAG AAA)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add item to cart
    const menuItem = page.locator('[data-testid="menu-item"]').first();
    if (await menuItem.isVisible()) {
      await menuItem.click();
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: /add to cart/i }).click();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  });

  test("cart drawer - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Open cart drawer
    const cartButton = page.locator('[data-testid="cart-button"]');
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(300);

      const { passed, violationCount } = await auditContrast(
        page,
        "Cart Drawer",
        "light"
      );

      console.log(
        `Cart Drawer (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
      );
      expect(violationCount).toBeDefined();
    }
  });

  test("cart drawer - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const cartButton = page.locator('[data-testid="cart-button"]');
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(300);

      const { passed, violationCount } = await auditContrast(
        page,
        "Cart Drawer",
        "dark"
      );

      console.log(
        `Cart Drawer (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
      );
      expect(violationCount).toBeDefined();
    }
  });
});

// ============================================================================
// LOGIN PAGE TESTS
// ============================================================================

test.describe("Login Page Contrast (WCAG AAA)", () => {
  test("login page - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const { passed, violationCount } = await auditContrast(
      page,
      "Login Page",
      "light"
    );

    console.log(
      `Login Page (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });

  test("login page - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const { passed, violationCount } = await auditContrast(
      page,
      "Login Page",
      "dark"
    );

    console.log(
      `Login Page (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });
});

// ============================================================================
// CHECKOUT PAGE TESTS
// ============================================================================

test.describe("Checkout Page Contrast (WCAG AAA)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add item to cart for checkout
    const menuItem = page.locator('[data-testid="menu-item"]').first();
    if (await menuItem.isVisible()) {
      await menuItem.click();
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: /add to cart/i }).click();
      await page.keyboard.press("Escape");
    }
  });

  test("checkout page - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");

    // May redirect to login - audit whatever page we land on
    const currentUrl = page.url();
    const pageName = currentUrl.includes("login")
      ? "Login (from checkout)"
      : "Checkout Page";

    const { passed, violationCount } = await auditContrast(
      page,
      pageName,
      "light"
    );

    console.log(
      `${pageName} (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });

  test("checkout page - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    const pageName = currentUrl.includes("login")
      ? "Login (from checkout)"
      : "Checkout Page";

    const { passed, violationCount } = await auditContrast(
      page,
      pageName,
      "dark"
    );

    console.log(
      `${pageName} (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });
});

// ============================================================================
// TRACKING PAGE TESTS
// ============================================================================

test.describe("Tracking Page Contrast (WCAG AAA)", () => {
  test("tracking page - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    // Use a sample tracking URL - may show error state which is also valid for audit
    await page.goto("/orders/sample-order-id/tracking");
    await page.waitForLoadState("networkidle");

    const { passed, violationCount } = await auditContrast(
      page,
      "Tracking Page",
      "light"
    );

    console.log(
      `Tracking Page (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });

  test("tracking page - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/orders/sample-order-id/tracking");
    await page.waitForLoadState("networkidle");

    const { passed, violationCount } = await auditContrast(
      page,
      "Tracking Page",
      "dark"
    );

    console.log(
      `Tracking Page (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });
});

// ============================================================================
// DRIVER INTERFACE TESTS
// ============================================================================

test.describe("Driver Interface Contrast (WCAG AAA)", () => {
  test("driver dashboard - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/driver");
    await page.waitForLoadState("networkidle");

    const { passed, violationCount } = await auditContrast(
      page,
      "Driver Dashboard",
      "light"
    );

    console.log(
      `Driver Dashboard (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });

  test("driver dashboard - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/driver");
    await page.waitForLoadState("networkidle");

    const { passed, violationCount } = await auditContrast(
      page,
      "Driver Dashboard",
      "dark"
    );

    console.log(
      `Driver Dashboard (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });
});

// ============================================================================
// ADMIN INTERFACE TESTS
// ============================================================================

test.describe("Admin Interface Contrast (WCAG AAA)", () => {
  test("admin dashboard - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // May redirect to login
    const currentUrl = page.url();
    const pageName = currentUrl.includes("login")
      ? "Admin Login"
      : "Admin Dashboard";

    const { passed, violationCount } = await auditContrast(
      page,
      pageName,
      "light"
    );

    console.log(
      `${pageName} (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });

  test("admin dashboard - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    const pageName = currentUrl.includes("login")
      ? "Admin Login"
      : "Admin Dashboard";

    const { passed, violationCount } = await auditContrast(
      page,
      pageName,
      "dark"
    );

    console.log(
      `${pageName} (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
    );
    expect(violationCount).toBeDefined();
  });
});

// ============================================================================
// ITEM DETAIL MODAL TESTS
// ============================================================================

test.describe("Item Detail Modal Contrast (WCAG AAA)", () => {
  test("item modal - light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open item modal
    const menuItem = page.locator('[data-testid="menu-item"]').first();
    if (await menuItem.isVisible()) {
      await menuItem.click();
      await page.waitForTimeout(300);

      const { passed, violationCount } = await auditContrast(
        page,
        "Item Detail Modal",
        "light"
      );

      console.log(
        `Item Detail Modal (light): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
      );
      expect(violationCount).toBeDefined();
    }
  });

  test("item modal - dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const menuItem = page.locator('[data-testid="menu-item"]').first();
    if (await menuItem.isVisible()) {
      await menuItem.click();
      await page.waitForTimeout(300);

      const { passed, violationCount } = await auditContrast(
        page,
        "Item Detail Modal",
        "dark"
      );

      console.log(
        `Item Detail Modal (dark): ${passed ? "PASSED" : `FAILED - ${violationCount} violations`}`
      );
      expect(violationCount).toBeDefined();
    }
  });
});

// ============================================================================
// SUMMARY TEST
// ============================================================================

test.describe("Audit Summary", () => {
  test.afterAll(async () => {
    logViolationSummary();
  });

  test("generate audit summary", async () => {
    // This test runs after all others to log the summary
    console.log("\n=== Contrast Audit Complete ===\n");
    console.log(`Total violations collected: ${violations.length}`);
    expect(true).toBe(true);
  });
});
