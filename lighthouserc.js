/**
 * Lighthouse CI Configuration
 *
 * Performance regression gate for PRs.
 * Audits customer-facing routes with mobile throttling.
 * Warn-only assertions (does not block PRs).
 *
 * Run locally: pnpm lighthouse
 * CI: Runs automatically on pull requests via GitHub Actions
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */

module.exports = {
  ci: {
    collect: {
      // Start production server for auditing (required for App Router dynamic routes)
      startServerCommand: "pnpm start",
      startServerReadyPattern: "started server",
      startServerReadyTimeout: 30000,

      // Customer-facing routes to audit
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/menu",
        "http://localhost:3000/cart",
        "http://localhost:3000/checkout",
      ],

      // 3 runs per URL for statistical accuracy
      numberOfRuns: 3,

      settings: {
        chromeFlags: "--no-sandbox --headless --disable-gpu",
        // Mobile throttling for realistic performance
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
        // Core Web Vitals - WARN only (per decision: do not block PRs)
        "first-contentful-paint": ["warn", { maxNumericValue: 1500 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],

        // Overall score thresholds - WARN only
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.95 }],
      },
    },

    upload: {
      target: "temporary-public-storage",
    },
  },
};
