import * as Sentry from "@sentry/nextjs";

// TEMPORARILY DISABLED IN DEVELOPMENT: Sentry client-side instrumentation
// was causing "Maximum update depth exceeded" infinite loop which blocked
// all client-side navigation (Link clicks). This appears to be a compatibility
// issue between @sentry/nextjs and Next.js 16 / React 19.
// TODO: Re-enable once Sentry releases a fix for Next.js 16 compatibility
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Adds request headers and IP for users
    sendDefaultPii: true,

    // Capture 10% of transactions in production
    tracesSampleRate: 0.1,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration(),
      Sentry.browserTracingIntegration(),
    ],

    debug: process.env.SENTRY_DEBUG === "true",
  });
}

// Instrument router navigations for tracing
// TEMPORARILY DISABLED: This was causing "Maximum update depth exceeded" infinite loop
// which blocked all client-side navigation (Link clicks)
// TODO: Investigate Sentry/Next.js compatibility issue and re-enable
// export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
