/**
 * Chromatic Configuration for Visual Regression Testing
 *
 * Sprint 10: Testing & Optimization
 * Visual regression testing integrated with Storybook
 *
 * Setup:
 * 1. Install: pnpm add -D chromatic
 * 2. Get project token from chromatic.com
 * 3. Add CHROMATIC_PROJECT_TOKEN to environment
 *
 * Usage:
 * - Local: pnpm chromatic
 * - CI: Runs automatically on push
 *
 * @see https://www.chromatic.com/docs/cli
 */

module.exports = {
  // Project token from Chromatic (set via environment variable)
  projectToken: process.env.CHROMATIC_PROJECT_TOKEN,

  // Build Storybook before running
  buildScriptName: "build-storybook",

  // Storage key for caching
  storybookBuildDir: "storybook-static",

  // Only run on changes to relevant files
  onlyChanged: true,

  // External domains to allow in snapshots
  externals: ["fonts.googleapis.com", "fonts.gstatic.com"],

  // Viewport configurations for responsive testing
  // Match our design breakpoints
  viewports: [
    // Mobile portrait
    375,
    // Mobile landscape / small tablet
    640,
    // Tablet
    768,
    // Desktop
    1024,
    // Large desktop
    1280,
  ],

  // Skip stories that are still in development
  skip: "*.stories.@(dev|wip).*",

  // Enable TurboSnap for faster builds (only snapshots changed stories)
  turboSnap: {
    // Bail on large changesets that would snapshot everything
    bailIfNotBuilt: true,
  },

  // Configuration for CI environments
  ci: {
    // Auto-accept changes on feature branches
    autoAcceptChanges: "main",

    // Exit with error code on UI changes (for PR blocking)
    exitOnceUploaded: false,

    // Wait for build to complete
    exitZeroOnChanges: false,
  },

  // Delay before capturing (allows animations to settle)
  delay: 300,

  // Diff threshold - how much pixel difference is allowed
  diffThreshold: 0.063,

  // Browser configurations
  browsers: ["chrome"],

  // Ignore elements that change frequently (dates, random content)
  // Use data-chromatic-ignore attribute in Storybook
  ignoreSelectors: [
    '[data-chromatic-ignore]',
    '.chromatic-ignore',
    '[data-testid="timestamp"]',
    '[data-testid="random-content"]',
  ],

  // Story-level configuration
  // Stories can override with:
  // parameters: { chromatic: { delay: 500, diffThreshold: 0.1 } }
};
