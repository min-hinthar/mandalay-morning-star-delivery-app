import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adds request headers and IP for users
  sendDefaultPii: true,

  // Capture 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],

  // Enable debug in development or when SENTRY_DEBUG is set
  debug: process.env.NODE_ENV === "development" || process.env.SENTRY_DEBUG === "true",
});

// Instrument router navigations for tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
