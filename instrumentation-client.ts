import * as Sentry from "@sentry/nextjs";
import { scrubConsoleMessage, scrubSpanDescription, scrubUrl } from "@/lib/sentry/scrub-url";

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
      // Replay records URLs through its own pipeline (performance spans for
      // navigation/fetch/xhr, slow-click frames), bypassing beforeBreadcrumb —
      // scrub the same token-bearing URLs before frames enter the recording.
      beforeAddRecordingEvent(event) {
        const data = event.data;
        if (data.tag === "performanceSpan") {
          const payload = data.payload;
          if (typeof payload.description === "string") {
            payload.description = scrubUrl(payload.description);
          }
          const spanData = payload.data as Record<string, unknown> | undefined;
          if (spanData && typeof spanData.previous === "string") {
            spanData.previous = scrubUrl(spanData.previous);
          }
        } else if (data.tag === "breadcrumb") {
          // Typed frames only carry `url` (slow/multi-click) — navigation
          // rides as performanceSpan frames above — but the frame data is an
          // open record, so mirror beforeBreadcrumb's url/to/from coverage.
          const frameData = data.payload.data as Record<string, unknown> | undefined;
          if (frameData) {
            for (const key of ["url", "to", "from"]) {
              if (typeof frameData[key] === "string") {
                frameData[key] = scrubUrl(frameData[key]);
              }
            }
          }
        }
        return event;
      },
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
    // Console breadcrumbs carry content in message + data.arguments, not
    // data.url — and removeConsole keeps error/warn in prod, exactly the
    // calls that log failed-fetch URLs.
    if (breadcrumb.category === "console") {
      if (typeof breadcrumb.message === "string") {
        breadcrumb.message = scrubConsoleMessage(breadcrumb.message);
      }
      if (Array.isArray(data?.arguments)) {
        data.arguments = data.arguments.map((arg: unknown) =>
          typeof arg === "string" ? scrubConsoleMessage(arg) : arg
        );
      }
    }
    return breadcrumb;
  },
  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = scrubUrl(event.request.url);
    }
    // Error events carry the active transaction's name too — same leak
    // vector beforeSendTransaction scrubs below.
    if (event.transaction) {
      event.transaction = scrubUrl(event.transaction);
    }
    return event;
  },
  // beforeSend fires for ERROR events only — pageload/navigation/http.client
  // transactions (browserTracingIntegration, 20% sampled) go through this hook
  // instead, carrying the same token URLs in request.url, the transaction
  // name, and fetch/xhr span descriptions + http.url attributes.
  beforeSendTransaction(event) {
    if (event.request?.url) {
      event.request.url = scrubUrl(event.request.url);
    }
    if (event.transaction) {
      event.transaction = scrubUrl(event.transaction);
    }
    for (const span of event.spans ?? []) {
      if (typeof span.description === "string") {
        span.description = scrubSpanDescription(span.description);
      }
      const httpUrl = span.data?.["http.url"];
      if (typeof httpUrl === "string") {
        span.data["http.url"] = scrubUrl(httpUrl);
      }
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
