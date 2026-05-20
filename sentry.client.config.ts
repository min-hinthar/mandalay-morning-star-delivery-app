import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  debug: process.env.SENTRY_DEBUG === "true",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out noise from browser extensions and third-party scripts
  ignoreErrors: [
    // iOS WebView bridge — not our code
    /window\.webkit\.messageHandlers/,
    // Older browser DOM API — triggered by Radix UI in legacy WebViews
    /getRootNode/,
    // Facebook Pixel / third-party script injection
    /connect\.facebook\.net/,
    // Google Maps tile loader internal errors (iOS Mobile Safari)
    /Could not load "onion"/i,
    /maps-api-v3/i,
    // WebGL context creation failures (browser/driver, not app code)
    /Error creating WebGL context/i,
  ],
  denyUrls: [/maps\.googleapis\.com/i, /maps\.gstatic\.com/i],
});
