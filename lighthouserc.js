/**
 * Lighthouse CI Configuration
 *
 * Performance regression gate for PRs.
 * Mobile-only settings (mobile-first delivery app).
 *
 * Assertions:
 *   ERROR (blocks CI check): LCP, CLS, performance score, accessibility score
 *   WARN  (informational):   FCP, TBT
 *
 * Run locally:
 *   pnpm lighthouse              # mobile (default)
 *   pnpm lighthouse:desktop      # desktop profile (local use only)
 *
 * CI: Runs automatically on pull requests via GitHub Actions (mobile profile)
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */

module.exports = {
  ci: {
    collect: {
      // Start production server for auditing (required for App Router dynamic routes)
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Starting",
      startServerReadyTimeout: 30000,

      // Public routes to audit (5 routes)
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/menu",
        "http://localhost:3000/login",
        "http://localhost:3000/privacy",
        "http://localhost:3000/terms",
      ],

      // 3 runs per URL for statistical accuracy
      numberOfRuns: 3,

      // Mobile settings for realistic mobile performance
      settings: {
        chromeFlags: "--no-sandbox --headless --disable-gpu",
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        emulatedFormFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
      },
    },

    assert: {
      assertions: {
        // Core Web Vitals - ERROR (fails CI check)
        "largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.15 }],

        // Core Web Vitals - WARN (informational only)
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],

        // Overall score thresholds - ERROR (fails CI check)
        "categories:performance": ["error", { minScore: 0.6 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },

    upload: {
      target: "temporary-public-storage",
    },
  },
};
