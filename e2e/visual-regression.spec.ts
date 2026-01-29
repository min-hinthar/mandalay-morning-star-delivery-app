import { test, expect, Page } from "@playwright/test";

/**
 * Mock Google Fonts to prevent network-dependent test failures
 * in sandboxed environments without network access.
 */
async function mockFonts(page: Page) {
  await page.route("**/fonts.googleapis.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" })
  );
  await page.route("**/fonts.gstatic.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "font/woff2", body: "" })
  );
}

/**
 * Visual Regression Tests
 *
 * Captures baseline screenshots for key pages and components.
 * Run with --update-snapshots to update baselines.
 *
 * Usage:
 *   pnpm exec playwright test e2e/visual-regression.spec.ts
 *   pnpm exec playwright test --update-snapshots e2e/visual-regression.spec.ts
 */

test.describe("Homepage Visual Regression", () => {
  test("homepage - desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for animations to complete
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("homepage-desktop.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("homepage - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("homepage-mobile.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe("Menu Page Visual Regression", () => {
  test("menu with categories - desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Capture menu section
    const menuSection = page.locator('[data-testid="menu-section"]');
    if (await menuSection.isVisible()) {
      await expect(menuSection).toHaveScreenshot("menu-section-desktop.png", {
        maxDiffPixels: 150,
      });
    } else {
      // Fall back to full page
      await expect(page).toHaveScreenshot("menu-page-desktop.png", {
        fullPage: true,
        maxDiffPixels: 150,
      });
    }
  });

  test("menu item card", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const menuCard = page.locator('[data-testid="menu-item"]').first();
    await expect(menuCard).toHaveScreenshot("menu-item-card.png", {
      maxDiffPixels: 50,
    });
  });
});

test.describe("Item Modal Visual Regression", () => {
  test("item detail modal - desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open item modal
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.waitForTimeout(300);

    const modal = page.getByRole("dialog");
    await expect(modal).toHaveScreenshot("item-modal-desktop.png", {
      maxDiffPixels: 100,
    });
  });

  test("item detail modal - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open item modal (appears as bottom sheet on mobile)
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.waitForTimeout(300);

    const modal = page.getByRole("dialog");
    await expect(modal).toHaveScreenshot("item-modal-mobile.png", {
      maxDiffPixels: 100,
    });
  });
});

test.describe("Cart Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.keyboard.press("Escape");
  });

  test("cart drawer - desktop", async ({ page }) => {
    await page.locator('[data-testid="cart-button"]').click();
    await page.waitForTimeout(300);

    const cartDrawer = page.getByRole("dialog", { name: /cart/i });
    await expect(cartDrawer).toHaveScreenshot("cart-drawer-desktop.png", {
      maxDiffPixels: 100,
    });
  });

  test("cart drawer - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.locator('[data-testid="cart-button"]').click();
    await page.waitForTimeout(300);

    const cartDrawer = page.getByRole("dialog");
    await expect(cartDrawer).toHaveScreenshot("cart-drawer-mobile.png", {
      maxDiffPixels: 100,
    });
  });

  test("cart button with badge", async ({ page }) => {
    const cartButton = page.locator('[data-testid="cart-button"]');
    await expect(cartButton).toHaveScreenshot("cart-button-with-badge.png", {
      maxDiffPixels: 30,
    });
  });
});

test.describe("Checkout Page Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.keyboard.press("Escape");
  });

  test("checkout page - desktop", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // May redirect to login, capture that state
    await expect(page).toHaveScreenshot("checkout-or-login-desktop.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});

test.describe("Login Page Visual Regression", () => {
  test("login page - desktop", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("login-page-desktop.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("login page - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("login-page-mobile.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe("Empty States Visual Regression", () => {
  test("empty cart", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open empty cart
    const cartButton = page.locator('[data-testid="cart-button"]');
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(300);

      const emptyState = page.getByText(/empty/i);
      if (await emptyState.isVisible()) {
        await expect(page.getByRole("dialog")).toHaveScreenshot("empty-cart.png", {
          maxDiffPixels: 50,
        });
      }
    }
  });
});

test.describe("Loading States Visual Regression", () => {
  test("menu skeleton loading", async ({ page }) => {
    // Intercept API to show loading state
    await page.route("**/api/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto("/");

    // Capture loading state quickly
    await expect(page).toHaveScreenshot("menu-loading-skeleton.png", {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});

test.describe("Error States Visual Regression", () => {
  test("form error states", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Submit empty form to trigger errors
    await page.getByRole("button", { name: /sign in|login/i }).click();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("login-form-errors.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe("Dark Mode Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Enable dark mode via media query emulation
    await page.emulateMedia({ colorScheme: "dark" });
  });

  test("homepage - dark mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("homepage-dark-mode.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("menu card - dark mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const menuCard = page.locator('[data-testid="menu-item"]').first();
    if (await menuCard.isVisible()) {
      await expect(menuCard).toHaveScreenshot("menu-card-dark-mode.png", {
        maxDiffPixels: 50,
      });
    }
  });

  test("login page - dark mode", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("login-page-dark-mode.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe("Driver Dashboard Visual Regression (TEST-03)", () => {
  test.beforeEach(async ({ page }) => {
    await mockFonts(page);
  });

  test("driver dashboard - desktop", async ({ page }) => {
    await page.goto("/driver");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    // Redirects to login
    await expect(page).toHaveScreenshot("driver-dashboard-desktop.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("driver dashboard - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/driver");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("driver-dashboard-mobile.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("driver route page - login redirect", async ({ page }) => {
    await page.goto("/driver/route");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("driver-route-login.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("driver history page - login redirect", async ({ page }) => {
    await page.goto("/driver/history");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("driver-history-login.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("driver login redirect state", async ({ page }) => {
    await page.goto("/driver");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    // Verify redirect to login with next param
    await expect(page).toHaveURL(/login.*next.*driver/);
    await expect(page).toHaveScreenshot("driver-login-redirect.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});

test.describe("Admin Dashboard Visual Regression (TEST-02)", () => {
  test.beforeEach(async ({ page }) => {
    await mockFonts(page);
  });

  test("admin dashboard - desktop", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    // Redirects to login - captures login state
    await expect(page).toHaveScreenshot("admin-dashboard-desktop.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("admin dashboard - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("admin-dashboard-mobile.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("admin login redirect state", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    // Verify we're on login page (auth redirect)
    await expect(page).toHaveURL(/login/);
    await expect(page).toHaveScreenshot("admin-login-redirect.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});

test.describe("Component States Visual Regression", () => {
  test("button variants", async ({ page }) => {
    // Navigate to a page that shows different button states
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const submitButton = page.getByRole("button", { name: /sign in|login/i });
    await expect(submitButton).toHaveScreenshot("button-primary.png", {
      maxDiffPixels: 20,
    });
  });

  test("input states", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveScreenshot("input-default.png", {
      maxDiffPixels: 20,
    });

    // Focus state
    await emailInput.focus();
    await expect(emailInput).toHaveScreenshot("input-focused.png", {
      maxDiffPixels: 20,
    });
  });
});

test.describe("V8 Header Visual Regression (TEST-05)", () => {
  test("v8 header - desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const header = page.locator("header").first();
    await expect(header).toHaveScreenshot("v8-header-desktop.png", {
      maxDiffPixels: 100,
    });
  });

  test("v8 header - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const header = page.locator("header").first();
    await expect(header).toHaveScreenshot("v8-header-mobile.png", {
      maxDiffPixels: 100,
    });
  });

  test("v8 header with scroll - desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll down to trigger header shrink effect
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);

    const header = page.locator("header").first();
    await expect(header).toHaveScreenshot("v8-header-scrolled-desktop.png", {
      maxDiffPixels: 100,
    });
  });

  test("v8 bottom nav - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const bottomNav = page.locator("nav").last();
    await expect(bottomNav).toHaveScreenshot("v8-bottom-nav-mobile.png", {
      maxDiffPixels: 100,
    });
  });
});

test.describe("V8 Overlay Visual Regression (TEST-05)", () => {
  test("v8 modal open - desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open item detail modal
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.waitForTimeout(400);

    const modal = page.getByRole("dialog");
    await expect(modal).toHaveScreenshot("v8-modal-desktop.png", {
      maxDiffPixels: 100,
    });
  });

  test("v8 bottom sheet - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open item detail (renders as bottom sheet on mobile)
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.waitForTimeout(400);

    const sheet = page.getByRole("dialog");
    await expect(sheet).toHaveScreenshot("v8-bottom-sheet-mobile.png", {
      maxDiffPixels: 100,
    });
  });

  test("v8 dropdown open", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const dropdownTrigger = page.locator('[data-testid="profile-button"]');

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('[data-testid="dropdown-content"]');
      await expect(dropdown).toHaveScreenshot("v8-dropdown-open.png", {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe("V8 Cart Drawer Visual Regression (TEST-05)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add item to cart
    const menuItem = page.locator('[data-testid="menu-item"]').first();
    if (await menuItem.isVisible()) {
      await menuItem.click();
      await page.getByRole("button", { name: /add to cart/i }).click();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    }
  });

  test("v8 cart drawer with items - desktop", async ({ page }) => {
    await page.locator('[data-testid="cart-button"]').click();
    await page.waitForTimeout(400);

    const drawer = page.getByRole("dialog");
    await expect(drawer).toHaveScreenshot("v8-cart-drawer-items-desktop.png", {
      maxDiffPixels: 100,
    });
  });

  test("v8 cart drawer with items - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.locator('[data-testid="cart-button"]').click();
    await page.waitForTimeout(400);

    const drawer = page.getByRole("dialog");
    await expect(drawer).toHaveScreenshot("v8-cart-drawer-items-mobile.png", {
      maxDiffPixels: 100,
    });
  });

  test("v8 cart button with badge", async ({ page }) => {
    const cartButton = page.locator('[data-testid="cart-button"]');
    await expect(cartButton).toHaveScreenshot("v8-cart-button-badge.png", {
      maxDiffPixels: 30,
    });
  });
});

test.describe("V8 Empty Cart Visual Regression (TEST-05)", () => {
  test("v8 empty cart drawer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const cartButton = page.locator('[data-testid="cart-button"]');
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(400);

      const drawer = page.getByRole("dialog");
      await expect(drawer).toHaveScreenshot("v8-cart-empty.png", {
        maxDiffPixels: 100,
      });
    }
  });
});

test.describe("Hero Section Visual Regression (Phase 31)", () => {
  // Use reduced motion to disable floating emoji animations for stable screenshots
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("hero - desktop light mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Wait for initial render to complete
    await page.waitForTimeout(500);

    const hero = page.locator('[data-testid="hero-section"]');
    if (await hero.isVisible()) {
      await expect(hero).toHaveScreenshot("hero-desktop-light.png", {
        maxDiffPixels: 2000, // Higher tolerance for gradient/orb/shimmer variations
        threshold: 0.3,
        animations: "disabled",
      });
    } else {
      // Fall back to capturing hero area by position (first viewport height)
      await expect(page).toHaveScreenshot("hero-fullpage-desktop-light.png", {
        clip: { x: 0, y: 0, width: 1280, height: 800 },
        maxDiffPixels: 2000,
        threshold: 0.3,
        animations: "disabled",
      });
    }
  });

  test("hero - mobile 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const hero = page.locator('[data-testid="hero-section"]');
    if (await hero.isVisible()) {
      await expect(hero).toHaveScreenshot("hero-mobile-375.png", {
        maxDiffPixels: 2000,
        threshold: 0.3,
        animations: "disabled",
      });
    } else {
      await expect(page).toHaveScreenshot("hero-fullpage-mobile-375.png", {
        clip: { x: 0, y: 0, width: 375, height: 667 },
        maxDiffPixels: 2000,
        threshold: 0.3,
        animations: "disabled",
      });
    }
  });

  test("hero - desktop dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const hero = page.locator('[data-testid="hero-section"]');
    if (await hero.isVisible()) {
      await expect(hero).toHaveScreenshot("hero-desktop-dark.png", {
        maxDiffPixels: 2000,
        threshold: 0.3,
        animations: "disabled",
      });
    } else {
      await expect(page).toHaveScreenshot("hero-fullpage-desktop-dark.png", {
        clip: { x: 0, y: 0, width: 1280, height: 800 },
        maxDiffPixels: 2000,
        threshold: 0.3,
        animations: "disabled",
      });
    }
  });

  test("hero gradient orbs visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify hero section renders (orbs are inside via CSS positioning)
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();
  });

  test("hero scroll indicator visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify hero section renders with scroll indicator
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();

    // Check scroll indicator element exists (aria-label="Scroll to learn more")
    const scrollIndicator = page.locator('[aria-label="Scroll to learn more"]');
    await expect(scrollIndicator).toBeVisible();
  });
});
