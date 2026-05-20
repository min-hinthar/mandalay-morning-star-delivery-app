import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      xhr: true,
    }),
    Sentry.browserTracingIntegration(),
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  debug: process.env.SENTRY_DEBUG === "true",
  ignoreErrors: [
    /window\.webkit\.messageHandlers/,
    /getRootNode/,
    /connect\.facebook\.net/,
    /Could not load "onion"/i,
    /maps-api-v3/i,
    /Error creating WebGL context/i,
  ],
  denyUrls: [/maps\.googleapis\.com/i, /maps\.gstatic\.com/i],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
