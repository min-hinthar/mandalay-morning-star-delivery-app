import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Server Configuration
 *
 * Sprint 11: Feature Flags & Rollout
 * Enhanced monitoring for V7 rollout
 */

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Debug mode
  debug: process.env.NODE_ENV === "development" || process.env.SENTRY_DEBUG === "true",

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set in CI)
  release: process.env.SENTRY_RELEASE,

  // V7 Rollout Monitoring
  beforeSend(event) {
    // Tag V7-related errors
    if (event.tags?.v7_component) {
      event.tags.v7_rollout = "true";
    }

    // Add feature flag context if available
    if (event.extra?.feature_flags) {
      const flags = event.extra.feature_flags as Record<string, boolean>;
      event.tags = {
        ...event.tags,
        v7_ui_enabled: String(flags?.v7_ui ?? false),
      };
    }

    return event;
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    // Network errors
    "Network request failed",
    "Failed to fetch",
    "NetworkError",
    // Browser navigation
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Cancel errors
    "AbortError",
    "The operation was aborted",
  ],

  // Attach additional context
  integrations: [
    Sentry.extraErrorDataIntegration({ depth: 5 }),
  ],
});
