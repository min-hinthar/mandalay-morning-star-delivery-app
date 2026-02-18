# Phase 59: Monitoring & Error Tracking - Research

**Researched:** 2026-02-13
**Domain:** Sentry error tracking, Vercel Speed Insights, Vercel Web Analytics, Next.js 16 instrumentation
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Capture ALL client-side errors (no filtering of extension/third-party noise)
- React error boundaries auto-report to Sentry with component tree context
- Server-side API route errors go to both Sentry AND Vercel logs
- 100% error sample rate — every error captured
- Unhandled promise rejections captured alongside thrown errors
- Auto-breadcrumbs enabled: clicks, navigations, console logs, XHR/fetch
- Vercel Speed Insights enabled (standard Core Web Vitals: LCP, CLS, FID/INP)
- Vercel Web Analytics enabled (page views, referrers, top pages)
- Sentry performance tracing enabled on all routes
- Sentry GitHub integration enabled — source context in errors, suspect commits
- Sentry session replay enabled — error-only capture (buffer records, saves on error)

### Claude's Discretion

- Sentry tunnel route vs. direct ingest (ad blocker bypass decision)
- SDK loading strategy (eager vs. lazy)
- Vercel Speed Insights sample rate (balance free tier vs. coverage)
- Sentry performance tracing sample rate (separate from error rate)
- Environment tagging strategy (production-only vs. all environments)
- Sentry release tracking tied to Vercel deploys
- Alert channels (email, Slack, etc.)
- Alert trigger thresholds (every new issue vs. frequency-based)
- Error severity levels and custom tagging by domain
- Issue assignment strategy (shared pool given solo dev)
- Auto-resolve timing for stale issues
- Auto-create GitHub issues for critical errors vs. manual triage
- Weekly digest emails vs. real-time only
- User context in error events (user ID only vs. ID + email)
- Session replay sample rate and masking strategy
- PII/data scrubbing rules (defaults + custom for auth tokens, payment data)
- IP address handling (store vs. scrub)
- Cookie consent / privacy notice for monitoring (legitimate interest assessment)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

## Summary

This phase instruments the existing Next.js 16 production app with three monitoring services: Sentry (errors + performance + session replay), Vercel Speed Insights (Core Web Vitals), and Vercel Web Analytics (traffic). The project already has a partial Sentry setup -- `@sentry/nextjs` ^10.34.0 is installed, `sentry.server.config.ts` and `sentry.edge.config.ts` exist at root, `withSentryConfig` is configured in `next.config.ts` with a tunnel route at `/monitoring`, and error boundaries with `Sentry.captureException` exist in `RouteError.tsx` and `global-error.tsx`. However, several critical pieces are **missing**: no `instrumentation.ts` (required for server-side capture via Next.js hooks), no `instrumentation-client.ts` (replaces the old `sentry.client.config.ts` pattern), no session replay integration, and `@vercel/speed-insights` is not installed.

The existing `sentry.server.config.ts` has an `ignoreErrors` array that contradicts the user's decision to capture ALL errors -- this must be removed. The SDK also needs upgrading from ^10.34.0 to ^10.38.0 per MNTR-05. The `@vercel/analytics` component is already in `layout.tsx`, so Web Analytics is partially done.

**Primary recommendation:** Create `instrumentation.ts` and `instrumentation-client.ts` at project root, upgrade `@sentry/nextjs` to ^10.38.0, add `@vercel/speed-insights`, remove `ignoreErrors`, enable session replay with error-only sampling, and configure `onRequestError` export for server component error capture.

## Standard Stack

### Core

| Library                  | Version                    | Purpose                                             | Why Standard                                                                     |
| ------------------------ | -------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `@sentry/nextjs`         | ^10.38.0                   | Error tracking, performance tracing, session replay | Official Sentry SDK for Next.js; handles all three runtimes (client/server/edge) |
| `@vercel/speed-insights` | ^1.x (latest)              | Core Web Vitals (LCP, CLS, INP)                     | Official Vercel package; integrates with Vercel dashboard                        |
| `@vercel/analytics`      | ^1.6.1 (already installed) | Page views, referrers, top pages                    | Already in project; official Vercel Web Analytics                                |

### Supporting

| Library      | Version                    | Purpose                     | When to Use                                                          |
| ------------ | -------------------------- | --------------------------- | -------------------------------------------------------------------- |
| `web-vitals` | ^5.1.0 (already installed) | Client-side CWV measurement | Already used in `WebVitalsReporter`; can coexist with Speed Insights |

### Alternatives Considered

| Instead of                    | Could Use                | Tradeoff                                                                                                                  |
| ----------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Vercel Speed Insights         | Sentry performance alone | Speed Insights gives Vercel-native dashboard; Sentry gives trace-level detail. Using both is complementary, not redundant |
| `web-vitals` manual reporting | Speed Insights automatic | Speed Insights handles collection automatically; manual `web-vitals` reporter can be kept or removed                      |

**Installation:**

```bash
pnpm add @vercel/speed-insights
pnpm update @sentry/nextjs
```

## Architecture Patterns

### Current State (what exists)

```
/ (project root)
├── sentry.server.config.ts    # EXISTS - server init (needs cleanup)
├── sentry.edge.config.ts      # EXISTS - edge init (minimal)
├── next.config.ts              # EXISTS - withSentryConfig (has tunnel route)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # EXISTS - has <Analytics /> component
│   │   ├── global-error.tsx    # EXISTS - has Sentry.captureException
│   │   ├── error.tsx           # EXISTS - uses RouteError component
│   │   └── (customer)/debug/sentry/  # EXISTS - test page
│   ├── components/ui/
│   │   └── RouteError.tsx      # EXISTS - has Sentry.captureException
│   └── lib/
│       ├── utils/logger.ts     # EXISTS - structured logger with Sentry
│       └── web-vitals.tsx      # EXISTS - manual CWV reporting
```

### Target State (what to create/modify)

```
/ (project root)
├── instrumentation.ts          # NEW - server/edge registration + onRequestError
├── instrumentation-client.ts   # NEW - client-side Sentry init + replay
├── sentry.server.config.ts     # MODIFY - remove ignoreErrors, add environment
├── sentry.edge.config.ts       # MODIFY - add environment, consistent config
├── next.config.ts              # KEEP - already configured correctly
├── src/
│   ├── app/
│   │   ├── layout.tsx          # MODIFY - add <SpeedInsights />
│   │   └── global-error.tsx    # KEEP - already correct
```

### Pattern 1: Next.js Instrumentation Hook (Required for MNTR-01 + MNTR-02)

**What:** Next.js 15+ uses `instrumentation.ts` and `instrumentation-client.ts` as the standard entry points for SDK initialization. The old `sentry.client.config.ts` pattern is deprecated.
**When to use:** Always -- this is the only supported pattern for Next.js 16.
**Example:**

```typescript
// instrumentation.ts (project root)
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors from Server Components, middleware, and proxies
export const onRequestError = Sentry.captureRequestError;
```

```typescript
// instrumentation-client.ts (project root)
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: 0.2,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
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
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

// Instrument router navigations for performance tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

### Pattern 2: Vercel Speed Insights Component

**What:** Drop-in React component that automatically reports CWV to Vercel dashboard.
**When to use:** Add to root layout alongside existing `<Analytics />`.
**Example:**

```typescript
// Source: https://vercel.com/docs/speed-insights/package
import { SpeedInsights } from "@vercel/speed-insights/next";

// In layout.tsx body:
<SpeedInsights sampleRate={50} />
```

### Pattern 3: Error-Only Session Replay

**What:** Sentry buffers a recording in memory, only saving it when an error occurs. No full-session recording.
**When to use:** User explicitly requested error-only capture.
**Example:**

```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/session-replay/
Sentry.init({
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  // 0% session sampling = no recording unless error
  replaysSessionSampleRate: 0,
  // 100% error replay = always save when error occurs
  replaysOnErrorSampleRate: 1.0,
});
```

### Anti-Patterns to Avoid

- **Using `sentry.client.config.ts` instead of `instrumentation-client.ts`:** Deprecated in SDK v8+. The old file is silently ignored by Next.js 15+/Turbopack.
- **Setting `ignoreErrors` when user wants ALL errors captured:** Current `sentry.server.config.ts` has an `ignoreErrors` array filtering out network errors, ResizeObserver, etc. This contradicts the locked decision.
- **Accessing `window.Sentry` global for measurements:** The existing `web-vitals.tsx` does this (`"Sentry" in window`). With proper SDK init via `instrumentation-client.ts`, import `@sentry/nextjs` directly.
- **Duplicate error reporting:** `RouteError.tsx` already calls `Sentry.captureException`. The `onRequestError` hook in `instrumentation.ts` also captures server-side errors. These are complementary (client vs server), not duplicates.
- **100% `tracesSampleRate` in production:** Performance tracing generates spans for every request. At 100%, this burns through the free tier quota quickly. Use 10-20% for production.

## Don't Hand-Roll

| Problem                   | Don't Build                           | Use Instead                                     | Why                                                                                    |
| ------------------------- | ------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| Client-side error capture | Custom `window.onerror` handlers      | `instrumentation-client.ts` with Sentry SDK     | SDK handles unhandled rejections, React errors, source maps, breadcrumbs automatically |
| Server error capture      | Try/catch wrappers in every API route | `onRequestError` export in `instrumentation.ts` | Next.js hook catches all server component, middleware, proxy errors centrally          |
| Core Web Vitals dashboard | Custom analytics endpoint + database  | `@vercel/speed-insights`                        | Vercel provides the dashboard, scoring, and historical data automatically              |
| Session replay            | Screen recording library              | `Sentry.replayIntegration()`                    | Handles DOM diffing, privacy masking, network correlation, error linking               |
| Source map upload         | Manual `sentry-cli sourcemaps upload` | `withSentryConfig` in `next.config.ts`          | Already configured; handles upload automatically during build                          |
| Ad blocker bypass         | Custom proxy route                    | `tunnelRoute: "/monitoring"`                    | Already configured in `next.config.ts`; routes Sentry requests through Next.js         |

**Key insight:** The entire monitoring stack is "configure and forget" -- no custom plumbing needed. The SDK, Vercel packages, and Next.js instrumentation hooks handle everything.

## Common Pitfalls

### Pitfall 1: Missing `instrumentation.ts` breaks server-side capture

**What goes wrong:** Server-side errors (Server Components, API routes, middleware) silently fail to reach Sentry. Only client-side errors appear in dashboard.
**Why it happens:** Without `instrumentation.ts`, the `sentry.server.config.ts` and `sentry.edge.config.ts` files are never loaded. The SDK never initializes on the server.
**How to avoid:** Create `instrumentation.ts` at project root (not in `src/`) with the `register()` function and `onRequestError` export. Verify by hitting the existing `/api/debug/sentry` test endpoint.
**Warning signs:** "Sentry is not initialized" warnings in server logs; test errors not appearing in Sentry dashboard.

### Pitfall 2: File location matters -- root vs src

**What goes wrong:** Next.js can't find the instrumentation files, silently falls back to no-op.
**Why it happens:** `instrumentation.ts` and `instrumentation-client.ts` must be at the project root OR in `src/` (if using `src` directory pattern). This project uses `src/app/` for pages but config files (like `sentry.server.config.ts`) live at root.
**How to avoid:** Place both new files at project root alongside existing Sentry config files. This matches the existing pattern (`sentry.server.config.ts` is already at root).
**Warning signs:** No client-side Sentry events; check browser devtools Network tab for missing Sentry requests.

### Pitfall 3: `ignoreErrors` contradicts "capture ALL errors" requirement

**What goes wrong:** Filtered errors (network failures, ResizeObserver, AbortError) never reach Sentry. User expects to see everything.
**Why it happens:** Previous setup (Sprint 11) added an `ignoreErrors` array to reduce noise. User has now explicitly decided against filtering.
**How to avoid:** Remove the entire `ignoreErrors` array from `sentry.server.config.ts`. Do NOT add it to the new `instrumentation-client.ts`.
**Warning signs:** Missing error categories in Sentry dashboard.

### Pitfall 4: Session replay eats free tier quota

**What goes wrong:** Replay quota exhausted quickly, no replays available when you actually need them.
**Why it happens:** Setting `replaysSessionSampleRate` > 0 records sessions continuously, even without errors.
**How to avoid:** Set `replaysSessionSampleRate: 0` and `replaysOnErrorSampleRate: 1.0`. This is exactly the "error-only capture" the user requested. Only saves replay buffer when an error fires.
**Warning signs:** Sentry quota warnings; "replay quota exceeded" in billing dashboard.

### Pitfall 5: Speed Insights free tier limit (10,000 data points/month)

**What goes wrong:** Speed Insights stops collecting after 10,000 data points in the billing cycle.
**Why it happens:** Hobby plan has a hard cap of 10,000 data points/month with a 7-day reporting window. Each page view generates multiple data points (one per metric).
**How to avoid:** Set `sampleRate` prop on `<SpeedInsights />` to reduce collection. Recommendation: `sampleRate={50}` (50%) to stay within limits while getting statistically meaningful data.
**Warning signs:** Gaps in Speed Insights dashboard; "limit reached" notification from Vercel.

### Pitfall 6: Duplicate client-side initialization

**What goes wrong:** Sentry initialized twice, causing duplicate events, doubled quota consumption.
**Why it happens:** If both `sentry.client.config.ts` AND `instrumentation-client.ts` exist, or if Sentry.init() is called in multiple places.
**How to avoid:** Ensure NO `sentry.client.config.ts` file exists (it doesn't currently -- good). All client-side init goes in `instrumentation-client.ts` only.
**Warning signs:** Duplicate events in Sentry; "Sentry has been initialized more than once" console warning.

### Pitfall 7: `removeConsole` in next.config.ts affects breadcrumbs

**What goes wrong:** Console-based breadcrumbs are empty because `removeConsole` strips them in production.
**Why it happens:** `next.config.ts` has `removeConsole: { exclude: ["error", "warn"] }` in production. This removes `console.log`, `console.info`, `console.debug` -- which are breadcrumb sources.
**How to avoid:** This is acceptable -- error and warn are preserved. The breadcrumbs integration captures DOM events, fetch, navigation independently of console. Document this tradeoff.
**Warning signs:** Missing console.log breadcrumbs in production error events (expected behavior).

## Code Examples

### Complete `instrumentation.ts`

```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

### Complete `instrumentation-client.ts`

```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Send user IP + request headers for user context
  sendDefaultPii: true,

  // Performance: 20% of transactions in production, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,

  // Environment from Vercel deploy context
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Session Replay: error-only (buffer records, save on error)
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
  ],

  // Error-only replay: 0% session recording, 100% on error
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

// Instrument App Router navigations for performance tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

### Updated `sentry.server.config.ts` (remove ignoreErrors, add environment)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  debug: process.env.SENTRY_DEBUG === "true",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  integrations: [Sentry.extraErrorDataIntegration({ depth: 5 })],
  // NO ignoreErrors -- user wants ALL errors captured
});
```

### Updated `layout.tsx` additions

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";
// ... existing imports ...

// In body, alongside existing <Analytics />:
<SpeedInsights sampleRate={50} />
<Analytics />
```

## Discretion Recommendations

| Decision Area              | Recommendation                                                    | Rationale                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tunnel route               | **Keep** `/monitoring` (already configured)                       | Already in `next.config.ts`; bypasses ad blockers; no extra work                                                                                          |
| SDK loading                | **Eager** via `instrumentation-client.ts`                         | Standard pattern; loads with page; ensures errors from first render are caught                                                                            |
| Speed Insights sample rate | **50%** (`sampleRate={50}`)                                       | Hobby plan has 10,000 data points/month. 50% gives statistical significance while staying within limit                                                    |
| Sentry tracing sample rate | **20%** production, 100% dev                                      | Balances performance data coverage vs free tier span quota; 10% is too sparse for a low-traffic app                                                       |
| Environment tagging        | **All environments** via `NEXT_PUBLIC_VERCEL_ENV`                 | Vercel sets `preview`/`production`/`development`; tag all so you can filter in dashboard                                                                  |
| Release tracking           | **Vercel deploy SHA** via `VERCEL_GIT_COMMIT_SHA`                 | Automatic; no CI config needed. Sentry links releases to commits                                                                                          |
| Alert channels             | **Email only** (default)                                          | Solo dev; Slack is overkill. Sentry sends email for new issues by default                                                                                 |
| Alert thresholds           | **Every new issue** (default)                                     | Low-traffic app; every new unique error should be visible immediately                                                                                     |
| Error severity/tagging     | **Use existing `logger.ts` tags** (flowId, api)                   | Already structured; no new tagging needed                                                                                                                 |
| Issue assignment           | **Shared pool** (solo dev, no assignment rules)                   | One person; auto-assign is unnecessary                                                                                                                    |
| Auto-resolve               | **30 days** (Sentry default)                                      | If an error hasn't recurred in 30 days, mark resolved                                                                                                     |
| Auto-create GitHub issues  | **No** -- manual triage                                           | Low-traffic app; review errors in Sentry dashboard, create GH issues manually for real bugs                                                               |
| Weekly digest              | **Enable** weekly email summary                                   | Low-effort awareness; Sentry has this built-in                                                                                                            |
| User context               | **User ID only** (no email)                                       | Privacy-conscious; ID is sufficient for debugging; email adds PII risk                                                                                    |
| Session replay masking     | **maskAllText + maskAllInputs + blockAllMedia** (Sentry defaults) | Maximum privacy; form data, text content, and media are masked                                                                                            |
| PII scrubbing              | **Sentry defaults + scrub auth tokens in headers**                | Use `beforeSend` to strip `Authorization` header if present; Sentry auto-scrubs passwords                                                                 |
| IP address                 | **Store** (default Sentry behavior with `sendDefaultPii: true`)   | Useful for geo-debugging; can be disabled later if privacy concern arises                                                                                 |
| Cookie consent             | **No banner needed** -- legitimate interest basis                 | Error tracking is a legitimate interest under GDPR for maintaining service quality. No personal tracking for marketing. Add a privacy policy mention only |

## State of the Art

| Old Approach                             | Current Approach                | When Changed    | Impact                                                   |
| ---------------------------------------- | ------------------------------- | --------------- | -------------------------------------------------------- |
| `sentry.client.config.ts`                | `instrumentation-client.ts`     | SDK v8 (2024)   | Old file silently ignored by Next.js 15+/Turbopack       |
| `experimental.instrumentationHook: true` | Enabled by default              | Next.js 15      | No config flag needed in Next.js 16                      |
| FID (First Input Delay)                  | INP (Interaction to Next Paint) | Google CWV 2024 | INP is the standard responsiveness metric now            |
| `@sentry/nextjs` v7/v8                   | v10.38.0                        | 2025            | Major version bump; new features (logs, improved replay) |
| Manual `sentry-cli` source map upload    | `withSentryConfig` auto-upload  | SDK v8+         | Build plugin handles upload automatically                |
| `Sentry.captureRequestError`             | Same (stable)                   | SDK v8.28+      | `onRequestError` export pattern is stable                |

**Deprecated/outdated:**

- `sentry.client.config.ts`: Replaced by `instrumentation-client.ts`
- `instrumentationHook` experimental flag: Now default in Next.js 15+
- `excludeServerRoutes` in `withSentryConfig`: Not supported with Turbopack
- `@sentry/nextjs` < 10.38.0: User explicitly requires ^10.38.0

## Existing Code Inventory

Files that need modification:
| File | Current State | Required Change |
|------|---------------|-----------------|
| `sentry.server.config.ts` | Has `ignoreErrors`, V7 rollout tags, `debug` in dev | Remove `ignoreErrors`, remove V7-specific `beforeSend`, add `environment`, update `release` |
| `sentry.edge.config.ts` | Minimal (DSN + trace rate + debug) | Add `environment`, match server config pattern |
| `next.config.ts` | Already has `withSentryConfig` with tunnel | No changes needed |
| `src/app/layout.tsx` | Has `<Analytics />`, no Speed Insights | Add `<SpeedInsights sampleRate={50} />` |
| `src/app/global-error.tsx` | Has `Sentry.captureException` | Already correct |
| `src/components/ui/RouteError.tsx` | Has `Sentry.captureException` | Already correct |
| `src/lib/web-vitals.tsx` | Manual CWV reporting via `window.Sentry` | Can be simplified -- Speed Insights handles CWV now. Keep for dev console logging but remove Sentry global access pattern |
| `package.json` | `@sentry/nextjs` ^10.34.0, no `@vercel/speed-insights` | Upgrade Sentry, add Speed Insights |

Files to create:
| File | Purpose |
|------|---------|
| `instrumentation.ts` | Server/edge Sentry registration + `onRequestError` |
| `instrumentation-client.ts` | Client-side Sentry init + replay + router transitions |

## Free Tier Quota Awareness

| Service                    | Free Tier Limit                  | Risk Level            | Mitigation                                                                                |
| -------------------------- | -------------------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| Sentry Errors              | ~5,000/month (Developer plan)    | LOW (low-traffic app) | 100% sample rate is fine                                                                  |
| Sentry Replays             | ~50/month (Developer plan)       | MEDIUM                | Error-only replay (`replaysSessionSampleRate: 0`) keeps usage proportional to errors only |
| Sentry Spans (Performance) | ~100K/month (Developer plan)     | MEDIUM                | 20% `tracesSampleRate` keeps this manageable                                              |
| Vercel Speed Insights      | 10,000 data points/month (Hobby) | MEDIUM                | `sampleRate={50}` halves collection; 7-day reporting window                               |
| Vercel Web Analytics       | 50,000 events/month (Hobby)      | LOW                   | Auto page views only; low-traffic app stays well within limit                             |

Note: Sentry Developer plan exact quotas are not publicly listed on their pricing page. The numbers above are estimates based on community reports. The actual limits may differ. The SDK will show warnings when approaching quota limits.

## Open Questions

1. **Sentry Developer plan exact quotas**
   - What we know: Free tier exists, has limits, exact numbers not on pricing page
   - What's unclear: Exact monthly error/replay/span limits
   - Recommendation: Start with recommended sample rates; monitor usage in Sentry billing dashboard after first week of production

2. **`web-vitals.tsx` redundancy with Speed Insights**
   - What we know: Speed Insights handles CWV reporting to Vercel automatically. The existing `WebVitalsReporter` also reports via `sendBeacon` to `/api/analytics/vitals` and via `window.Sentry`.
   - What's unclear: Whether to remove `WebVitalsReporter` entirely or keep it for dev console logging
   - Recommendation: Keep `WebVitalsReporter` for dev console output, remove the production `sendBeacon` call and Sentry global access. Speed Insights + Sentry SDK handle production reporting.

3. **Sentry GitHub integration setup**
   - What we know: User wants source context + suspect commits in Sentry
   - What's unclear: Whether the Sentry GitHub app is already installed on the repo
   - Recommendation: Document the Sentry dashboard steps (Settings > Integrations > GitHub) as a manual task. This is a one-time setup in the Sentry web UI, not code.

## Sources

### Primary (HIGH confidence)

- Sentry Next.js Manual Setup docs (Context7 ID: `/websites/sentry_io_platforms_javascript_guides_nextjs`) - instrumentation patterns, session replay, withSentryConfig
- https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/ - complete file structure, instrumentation.ts, instrumentation-client.ts patterns
- https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v7-to-v8 - migration from sentry.client.config.ts to instrumentation-client.ts
- https://docs.sentry.io/platforms/javascript/guides/nextjs/session-replay/ - replay integration, sampling, privacy
- https://vercel.com/docs/speed-insights/limits-and-pricing - Hobby plan: 10,000 data points/month, 7-day window
- https://vercel.com/docs/analytics/limits-and-pricing - Hobby plan: 50,000 events/month, 1-month window
- https://vercel.com/docs/speed-insights/package - SpeedInsights component, sampleRate prop

### Secondary (MEDIUM confidence)

- https://www.npmjs.com/package/@sentry/nextjs - v10.38.0 confirmed as latest (published 2026-01-29)
- https://github.com/getsentry/sentry-javascript/releases - changelog for v10.38.0
- https://docs.sentry.io/pricing/ - pricing structure (paid plan quotas listed, free tier quotas not explicit)

### Tertiary (LOW confidence)

- Sentry Developer plan quotas (5K errors, 50 replays, 100K spans) - community estimates, not officially documented on pricing page. Needs validation after deployment.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - official docs, installed packages, Context7 verified
- Architecture: HIGH - official Sentry manual setup docs, verified against existing codebase
- Pitfalls: HIGH - identified from codebase analysis (ignoreErrors conflict, missing instrumentation files, free tier limits from official Vercel docs)
- Discretion recommendations: MEDIUM - based on best practices for solo dev, low-traffic app, free tier constraints

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (stable; Sentry SDK updates are incremental)
