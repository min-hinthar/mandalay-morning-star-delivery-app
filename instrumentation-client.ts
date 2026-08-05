import * as Sentry from "@sentry/nextjs";

/**
 * Secret-bearing query params that must never reach Sentry (audit D10):
 * share tracking links (?token=), driver onboarding invites, and promo codes
 * all travel in URLs, and fetch/history breadcrumbs capture URLs verbatim.
 */
const SENSITIVE_QUERY_PARAMS = ["token", "share_token", "code"];

function scrubUrl(rawUrl: string): string {
  try {
    // Relative URLs resolve against a throwaway origin; strip it back off.
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(rawUrl);
    const url = new URL(rawUrl, "https://relative.invalid");
    let changed = false;
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, "[redacted]");
        changed = true;
      }
    }
    if (!changed) return rawUrl;
    return isAbsolute ? url.toString() : url.pathname + url.search + url.hash;
  } catch {
    return rawUrl;
  }
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // D10: default-PII attaches IP address (and would attach cookies/auth
  // headers on request events) to every report. Nothing in triage has needed
  // it — errors correlate via release + URL + user-agent — so it stays off.
  sendDefaultPii: false,
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
  // fetch/xhr/history breadcrumbs record URLs — scrub token-bearing params
  // (share links, onboarding invites, promo codes) before they leave the
  // device. Telemetry keeps the path; only the secret values are masked.
  beforeBreadcrumb(breadcrumb) {
    const data = breadcrumb.data;
    if (data?.url && typeof data.url === "string") {
      data.url = scrubUrl(data.url);
    }
    if (data?.to && typeof data.to === "string") {
      data.to = scrubUrl(data.to);
    }
    if (data?.from && typeof data.from === "string") {
      data.from = scrubUrl(data.from);
    }
    return breadcrumb;
  },
  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = scrubUrl(event.request.url);
    }
    return event;
  },
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
