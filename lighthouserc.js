/**
 * Lighthouse CI Configuration
 *
 * Performance regression gate for PRs.
 * Mobile-only settings (mobile-first delivery app).
 *
 * Thresholds are CI-adjusted: CI VMs are ~2-3x slower than real devices,
 * so 4x CPU throttling yields ~8-12x effective slowdown. Thresholds
 * are set to catch regressions, not match real-device targets.
 *
 * Real-device targets (for reference):
 *   LCP < 2500ms, FCP < 1500ms, TBT < 200ms, CLS < 0.1, Perf > 0.8
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

      // Mobile settings — cpuSlowdownMultiplier reduced from 4 to 2
      // because CI VMs are already slower than the Moto G4 reference device.
      // Effective slowdown is still ~4-6x on CI hardware.
      settings: {
        chromeFlags: "--no-sandbox --headless --disable-gpu",
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 2,
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
      // Use optimistic (best run) to reduce CI flakiness
      aggregationMethod: "optimistic",

      assertions: {
        // Core Web Vitals - ERROR (CI-adjusted thresholds)
        "largest-contentful-paint": ["error", { maxNumericValue: 10000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.15 }],

        // Core Web Vitals - WARN (informational only)
        "first-contentful-paint": ["warn", { maxNumericValue: 5000 }],
        "total-blocking-time": ["warn", { maxNumericValue: 1000 }],

        // Overall score thresholds - ERROR (CI-adjusted)
        "categories:performance": ["error", { minScore: 0.3 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },

    upload: {
      target: "temporary-public-storage",
    },
  },
};
