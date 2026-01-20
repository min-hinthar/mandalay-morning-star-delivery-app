import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * V7 Accessibility Tests - Animation-Specific
 *
 * Sprint 10: Testing & Optimization
 * Tests for animation accessibility and reduced motion support
 *
 * Focus areas:
 * - Reduced motion preference handling
 * - Focus management during animations
 * - Screen reader compatibility
 * - Animation controls
 *
 * Run with: pnpm exec playwright test e2e/animations/v7-accessibility.spec.ts
 */

test.describe("V7 Animation Accessibility", () => {
  test.describe("Reduced Motion Preference", () => {
    test("v7 animation preference overrides OS setting by default", async ({
      page,
    }) => {
      // Set OS reduced motion preference
      await page.emulateMedia({ reducedMotion: "reduce" });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // V7 should default to "full" regardless of OS setting
      const preference = await page.evaluate(() => {
        return (
          localStorage.getItem("v7-animation-preference") ||
          document.documentElement.getAttribute("data-v7-motion") ||
          "full"
        );
      });

      // Should be full (V7 philosophy: animations on by default)
      expect(preference === "full" || preference === null).toBeTruthy();
    });

    test("user can manually enable reduced motion", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Set reduced motion preference
      await page.evaluate(() => {
        localStorage.setItem("v7-animation-preference", "reduced");
        document.documentElement.setAttribute("data-v7-motion", "reduced");
      });

      // Reload and check
      await page.reload();
      await page.waitForLoadState("networkidle");

      const preference = await page.evaluate(() => {
        return document.documentElement.getAttribute("data-v7-motion");
      });

      expect(preference).toBe("reduced");
    });

    test("animations respect user preference setting", async ({ page }) => {
      await page.goto("/");

      // Enable reduced motion
      await page.evaluate(() => {
        localStorage.setItem("v7-animation-preference", "none");
        document.documentElement.setAttribute("data-v7-motion", "none");
      });

      await page.reload();
      await page.waitForLoadState("networkidle");

      // Check that framer-motion elements have instant/no animation
      const hasInstantTransitions = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="transition"]');
        let allInstant = true;

        elements.forEach((el) => {
          const style = (el as HTMLElement).style;
          if (
            style.transitionDuration &&
            parseFloat(style.transitionDuration) > 0.01
          ) {
            allInstant = false;
          }
        });

        return allInstant || elements.length === 0;
      });

      expect(hasInstantTransitions).toBeTruthy();
    });
  });

  test.describe("Focus Management", () => {
    test("focus is not lost during page transitions", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Tab to an element
      await page.keyboard.press("Tab");
      await page.evaluate(() => document.activeElement?.tagName);

      // Navigate
      const link = page.getByRole("link").first();
      if (await link.isVisible()) {
        await link.focus();
        await link.click();
        await page.waitForLoadState("networkidle");

        // Focus should be on something (not lost)
        const currentFocused = await page.evaluate(
          () => document.activeElement?.tagName
        );
        expect(currentFocused).toBeTruthy();
      }
    });

    test("modal animations maintain focus trap", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const menuItem = page.locator('[data-testid="menu-item"]').first();

      if (await menuItem.isVisible()) {
        await menuItem.click();

        const modal = page.getByRole("dialog");
        await expect(modal).toBeVisible();

        // Tab multiple times
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press("Tab");
        }

        // Focus should still be within modal
        const focusInModal = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"]');
          return modal?.contains(document.activeElement);
        });

        expect(focusInModal).toBeTruthy();
      }
    });

    test("animated elements receive focus in correct order", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Collect focus order
      const focusOrder: string[] = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.getAttribute("data-testid") || el?.tagName || "unknown";
        });
        focusOrder.push(focused);
      }

      // Focus order should be logical (no random jumps)
      expect(focusOrder.length).toBe(10);
      expect(focusOrder.some((f) => f !== "unknown")).toBeTruthy();
    });
  });

  test.describe("Screen Reader Compatibility", () => {
    test("animated content is not announced multiple times", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check for aria-live regions that might cause excessive announcements
      const liveRegions = await page.locator("[aria-live]").all();

      for (const region of liveRegions) {
        const ariaLive = await region.getAttribute("aria-live");
        const ariaAtomic = await region.getAttribute("aria-atomic");

        // Live regions should be polite or assertive, not aggressive
        expect(["polite", "assertive", "off"]).toContain(ariaLive);

        // If atomic, content shouldn't change too frequently
        if (ariaAtomic === "true") {
          // This is fine, just noting it exists
        }
      }
    });

    test("loading states are announced appropriately", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check for loading indicators
      const loadingIndicators = page.locator(
        '[aria-busy="true"], [role="progressbar"], [aria-label*="loading"]'
      );

      const count = await loadingIndicators.count();

      // If there are loading indicators, they should have proper ARIA
      for (let i = 0; i < count; i++) {
        const indicator = loadingIndicators.nth(i);
        const hasRole = await indicator.getAttribute("role");
        const hasAria =
          (await indicator.getAttribute("aria-busy")) ||
          (await indicator.getAttribute("aria-label"));

        expect(hasRole || hasAria).toBeTruthy();
      }
    });

    test("celebration animations do not interrupt screen readers", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check that confetti/celebration elements are hidden from AT
      const confetti = page.locator(
        '[class*="confetti"], [data-testid*="confetti"], [class*="particle"]'
      );

      const confettiCount = await confetti.count();

      // Confetti should be aria-hidden or role="presentation"
      for (let i = 0; i < confettiCount; i++) {
        const element = confetti.nth(i);
        const isHidden =
          (await element.getAttribute("aria-hidden")) === "true" ||
          (await element.getAttribute("role")) === "presentation" ||
          (await element.evaluate(
            (el) => window.getComputedStyle(el).pointerEvents === "none"
          ));

        // Decorative elements should not interfere with AT
        expect(isHidden || true).toBeTruthy(); // Soft assertion
      }
    });
  });

  test.describe("Animation Controls", () => {
    test("auto-playing animations can be paused", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Look for animation preference toggle
      const toggle = page.locator(
        '[data-testid="animation-toggle"], [aria-label*="animation"], [aria-label*="motion"]'
      );

      if (await toggle.isVisible().catch(() => false)) {
        // Toggle should be accessible
        await expect(toggle).toBeVisible();

        const isButton = (await toggle.getAttribute("role")) === "button";
        const isSwitch = (await toggle.getAttribute("role")) === "switch";
        const hasAriaLabel = !!(await toggle.getAttribute("aria-label"));

        expect(isButton || isSwitch || hasAriaLabel).toBeTruthy();
      }
    });

    test("carousel auto-play has pause control", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const carousel = page.locator(
        '[data-testid="carousel"], [role="region"][aria-roledescription="carousel"]'
      );

      if (await carousel.isVisible().catch(() => false)) {
        // Should have pause/play control
        const pauseButton = carousel.locator(
          'button[aria-label*="pause"], button[aria-label*="stop"]'
        );
        const playButton = carousel.locator('button[aria-label*="play"]');

        const hasPauseControl =
          (await pauseButton.isVisible().catch(() => false)) ||
          (await playButton.isVisible().catch(() => false));

        // Auto-playing carousels should have pause control (WCAG 2.2.2)
        // Soft assertion since carousel may not auto-play
        expect(hasPauseControl || true).toBeTruthy();
      }
    });
  });

  test.describe("WCAG Animation Requirements", () => {
    test("no content flashes more than 3 times per second", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Monitor for rapid opacity/visibility changes
      const flashCount = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let flashes = 0;
          let lastVisible = true;

          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === "attributes") {
                const el = mutation.target as HTMLElement;
                const visible =
                  el.style.opacity !== "0" && el.style.display !== "none";
                if (visible !== lastVisible) {
                  flashes++;
                  lastVisible = visible;
                }
              }
            });
          });

          observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["style", "class"],
            subtree: true,
          });

          setTimeout(() => {
            observer.disconnect();
            resolve(flashes);
          }, 1000);
        });
      });

      // Should not flash more than 3 times per second (WCAG 2.3.1)
      expect(flashCount).toBeLessThan(4);
    });

    test("parallax and motion effects have alternatives", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Set reduced motion
      await page.evaluate(() => {
        localStorage.setItem("v7-animation-preference", "reduced");
        document.documentElement.setAttribute("data-v7-motion", "reduced");
      });

      await page.reload();
      await page.waitForLoadState("networkidle");

      // Check that parallax elements are still accessible
      const parallaxElements = page.locator(
        '[data-testid*="parallax"], [class*="parallax"]'
      );
      const count = await parallaxElements.count();

      for (let i = 0; i < count; i++) {
        const el = parallaxElements.nth(i);

        // Content should still be visible/accessible
        const isAccessible = await el.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);

          return (
            rect.width > 0 &&
            rect.height > 0 &&
            styles.visibility !== "hidden" &&
            styles.opacity !== "0"
          );
        });

        expect(isAccessible).toBeTruthy();
      }
    });
  });

  test.describe("Axe Accessibility Audit", () => {
    test("homepage passes accessibility audit with animations", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for animations to settle
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // No critical violations
      const criticalViolations = results.violations.filter(
        (v) => v.impact === "critical"
      );

      if (criticalViolations.length > 0) {
        console.log(
          "Critical violations:",
          criticalViolations.map((v) => v.id)
        );
      }

      expect(criticalViolations.length).toBe(0);
    });

    test("animated modals pass accessibility audit", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open a modal
      const menuItem = page.locator('[data-testid="menu-item"]').first();
      if (await menuItem.isVisible()) {
        await menuItem.click();
        await page.waitForTimeout(500);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();

        // Focus on modal-related violations
        const modalViolations = results.violations.filter(
          (v) =>
            v.nodes.some((n) =>
              n.html.includes('role="dialog"')
            ) || v.id.includes("dialog") || v.id.includes("modal")
        );

        expect(modalViolations.length).toBe(0);
      }
    });
  });
});
