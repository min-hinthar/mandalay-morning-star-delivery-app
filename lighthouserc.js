/**
 * Lighthouse CI Configuration
 *
 * Sprint 10: Testing & Optimization
 * Performance profiling with Lighthouse
 *
 * Setup:
 * 1. Install: pnpm add -D @lhci/cli
 * 2. Add to CI: pnpm lhci autorun
 *
 * Performance Targets (V7):
 * - FPS: 120fps (60fps minimum)
 * - FCP: < 1.5s
 * - LCP: < 2.5s
 * - CLS: < 0.1
 * - TBT: < 200ms
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */

module.exports = {
  ci: {
    collect: {
      // Use the built production app
      staticDistDir: ".next",

      // Or start the dev server (comment above, uncomment below)
      // startServerCommand: "pnpm start",
      // startServerReadyPattern: "started server",
      // startServerReadyTimeout: 30000,

      // URLs to audit
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/menu",
        "http://localhost:3000/cart",
        "http://localhost:3000/login",
        "http://localhost:3000/driver",
      ],

      // Number of runs per URL (3 for statistical accuracy)
      numberOfRuns: 3,

      // Chrome flags for consistent results
      settings: {
        chromeFlags: "--no-sandbox --headless --disable-gpu",
        // Throttling for realistic mobile performance
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        // Emulate mobile device
        emulatedFormFactor: "mobile",
        // Screen emulation
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
      },
    },

    assert: {
      // Assertion presets
      preset: "lighthouse:recommended",

      // Custom assertions for V7 targets
      assertions: {
        // Core Web Vitals - STRICT
        "first-contentful-paint": ["error", { maxNumericValue: 1500 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],

        // Speed Index
        "speed-index": ["warn", { maxNumericValue: 3000 }],

        // Interactivity
        interactive: ["warn", { maxNumericValue: 3500 }],

        // Performance score thresholds
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],

        // Resource hints
        "uses-rel-preconnect": "warn",
        "uses-rel-preload": "warn",

        // Image optimization
        "uses-webp-images": "warn",
        "uses-responsive-images": "warn",
        "unsized-images": "error",

        // JavaScript
        "unused-javascript": "warn",
        "legacy-javascript": "warn",
        "duplicated-javascript": "warn",

        // CSS
        "unused-css-rules": "warn",

        // Fonts
        "font-display": "warn",

        // Third-party
        "third-party-summary": "warn",

        // Accessibility audits
        "color-contrast": "error",
        "tap-targets": "warn",
      },
    },

    upload: {
      // Upload to Lighthouse CI server (if configured)
      target: "temporary-public-storage",

      // Or upload to your own server:
      // target: "lhci",
      // serverBaseUrl: "https://your-lhci-server.example.com",
      // token: process.env.LHCI_TOKEN,
    },

    // Server configuration (for self-hosted LHCI)
    // server: {
    //   port: 9001,
    //   storage: {
    //     storageMethod: "sql",
    //     sqlDialect: "sqlite",
    //     sqlDatabasePath: "./lhci.db",
    //   },
    // },
  },
};
