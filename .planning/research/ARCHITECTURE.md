# Architecture Research: Production Deployment Integration

**Domain:** Production deployment, monitoring, CI/CD, and performance optimization for existing Next.js 16 delivery app
**Researched:** 2026-02-13
**Confidence:** HIGH (verified against codebase + official Sentry/Vercel/Lighthouse CI docs)

---

## Current Architecture Inventory

Before defining integration points, here is what already exists and what is missing.

### Already Integrated (Partial)

| Component | Status | What Exists | What Is Missing |
|-----------|--------|-------------|-----------------|
| **Sentry SDK** | PARTIAL | `@sentry/nextjs@10.34.0` installed, `withSentryConfig` in `next.config.ts`, `global-error.tsx` captures errors, `RouteError` captures via `Sentry.captureException`, `logger.ts` uses Sentry breadcrumbs/messages, tunnel route `/monitoring` configured, debug test page exists | No `instrumentation.ts`, no `instrumentation-client.ts`, no `sentry.server.config.ts`, no `sentry.edge.config.ts` -- SDK is installed but never initialized |
| **Vercel Analytics** | PARTIAL | `@vercel/analytics@1.6.1` installed, `<Analytics />` in root layout | No `@vercel/speed-insights`, no `vercel.json` config |
| **Lighthouse CI** | PARTIAL | `@lhci/cli@0.15.1` installed, `lighthouserc.js` config exists, GitHub Actions workflow runs LHCI on PRs | All assertions are `warn` (non-blocking), no `error`-level gates |
| **Web Vitals** | COMPLETE | `web-vitals@5.1.0`, `WebVitalsReporter` client component, `/api/analytics/vitals` endpoint, Sentry measurement integration | Working but Sentry integration is dead code (SDK not initialized) |
| **Service Worker** | COMPLETE | Custom `build-sw.mjs` script, esbuild compilation, precache manifest | Build script runs as post-step in `pnpm build` |
| **GitHub Actions CI** | COMPLETE | `ci.yml` with lint, typecheck, test, build, lighthouse jobs | Build artifacts uploaded, LHCI downloads them |

### Not Yet Integrated

| Component | Status | Notes |
|-----------|--------|-------|
| **Vercel deployment** | NOT STARTED | No `vercel.json`, no preview/production config |
| **Sentry initialization** | NOT STARTED | SDK wrappers exist but init files missing |
| **LHCI blocking assertions** | NOT STARTED | Currently warn-only |
| **LCP optimization** | PARTIAL | Image optimization utilities exist, Hero is text+CSS gradient (good), but LCP = 11.7s on homepage mobile |
| **Middleware** | NOT STARTED | No `middleware.ts` exists |

---

## System Overview: Production Stack

```
                          GitHub PR
                              |
                    +---------+---------+
                    |   GitHub Actions  |
                    |                   |
                    | lint -> typecheck |
                    |      -> test      |
                    |      -> build     |
                    |      -> LHCI      |  <-- Upgrade: warn -> error
                    +---------+---------+
                              |
                              | (merge to main)
                              v
                    +-------------------+
                    |   Vercel Build    |  <-- NEW: vercel.json + env vars
                    |                   |
                    | next build        |
                    | build-sw.mjs      |  <-- Runs via "build" script
                    | Sentry source maps|  <-- NEW: SENTRY_AUTH_TOKEN
                    +-------------------+
                              |
              +---------------+---------------+
              v               v               v
        Production      Preview          Development
        (main)         (PR branches)     (local)
              |
              v
    +-------------------+
    |   Runtime Stack   |
    |                   |
    | Vercel Edge       |
    | Sentry monitoring |  <-- NEW: full initialization
    | Vercel Analytics  |
    | Service Worker    |
    | Web Vitals -> API |
    +-------------------+
```

---

## Integration 1: Sentry Full Initialization

### Problem

The `@sentry/nextjs` SDK is installed and `withSentryConfig` wraps `next.config.ts`, but the SDK is never initialized. All `Sentry.captureException()` calls throughout the codebase are no-ops. Source maps are uploaded (when `SENTRY_AUTH_TOKEN` is set) but never used.

### Required New Files

Per [Sentry manual setup docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/), four files must be created:

| File | Location | Runtime | Purpose |
|------|----------|---------|---------|
| `instrumentation-client.ts` | `src/` | Browser | Client SDK init (DSN, tracing, replay) |
| `sentry.server.config.ts` | Project root | Node.js | Server SDK init (DSN, tracing) |
| `sentry.edge.config.ts` | Project root | Edge | Edge SDK init (DSN) |
| `instrumentation.ts` | `src/` | Both | Next.js instrumentation hook, imports server/edge configs |

**Confidence:** HIGH -- verified against [Sentry v10 manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/) and [v9-to-v10 migration](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v9-to-v10/).

### File Contents Pattern

**`src/instrumentation-client.ts`** (Client -- runs in browser):

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
  environment: process.env.NODE_ENV,
});
```

**`sentry.server.config.ts`** (Server -- Node.js runtime):

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
});
```

**`sentry.edge.config.ts`** (Edge runtime):

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
});
```

**`src/instrumentation.ts`** (Next.js hook):

```typescript
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

### Modified Files

| File | Change | Why |
|------|--------|-----|
| `next.config.ts` | No changes needed | `withSentryConfig` already correct with org, project, authToken, tunnelRoute |
| `.env.example` | Already has `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` | No change |
| `src/lib/web-vitals.tsx` | Remove manual `window.Sentry` checks (lines 66-87) | SDK will be globally available after init, use proper `import * as Sentry` instead |
| `src/lib/utils/logger.ts` | No changes needed | Already uses `import * as Sentry` correctly |

### Data Flow After Integration

```
Browser Error
    |
    v
Sentry.captureException() (already in RouteError, global-error, logger)
    |
    v
Sentry Client SDK (NEW: initialized via instrumentation-client.ts)
    |
    v
POST /monitoring (tunnel route, bypasses ad blockers)
    |
    v
Next.js forwards to Sentry ingest
    |
    v
Sentry Dashboard (with source maps from build)
```

```
Server Error (API route, Server Component, Server Action)
    |
    v
onRequestError hook (NEW: instrumentation.ts)
    |
    v
Sentry Server SDK (NEW: initialized via sentry.server.config.ts)
    |
    v
Sentry ingest (direct, no tunnel needed server-side)
```

### Existing Code That Activates

Once Sentry is initialized, these existing integrations become active:

- `global-error.tsx` -- captures React render errors
- `RouteError.tsx` -- captures route-level errors (15 error boundaries)
- `logger.ts` -- structured logging with Sentry breadcrumbs/messages
- `web-vitals.tsx` -- CWV measurements sent to Sentry
- `api/debug/sentry/route.ts` -- test endpoint works
- `(customer)/debug/sentry/page.tsx` -- test page works

### Middleware Consideration

No `middleware.ts` exists. The Sentry docs note: if using Next.js middleware, exclude the tunnel route from interception. Since there is no middleware, this is not a concern. If middleware is added later, ensure `/monitoring` is excluded from the matcher.

---

## Integration 2: Vercel Deployment

### Problem

No Vercel configuration exists. The project builds with `pnpm build` which runs `next build && node scripts/build-sw.mjs`. Vercel needs to know the build command, environment variables, and framework settings.

### New Files

| File | Purpose |
|------|---------|
| `vercel.json` | Deployment configuration |

### vercel.json Configuration

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/cron/delivery-reminders",
      "schedule": "0 10 * * 6"
    }
  ]
}
```

**Key decisions:**

- **Build command**: `pnpm build` already chains `next build && node scripts/build-sw.mjs`. Vercel runs the build script from package.json, so the service worker build happens automatically.
- **Service worker headers**: SW must not be cached by CDN (stale SW = stale app). `no-cache` forces revalidation on every load.
- **Cron jobs**: Existing `/api/cron/delivery-reminders` needs scheduling. Vercel Cron runs on UTC.

### Environment Variables

Variables to configure in Vercel Dashboard (Project Settings > Environment Variables):

| Variable | Environments | Type |
|----------|-------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Plain text |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Sensitive |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Sensitive |
| `STRIPE_SECRET_KEY` | Production (live), Preview (test) | Sensitive |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production (live), Preview (test) | Plain text |
| `STRIPE_WEBHOOK_SECRET` | Production only | Sensitive |
| `RESEND_API_KEY` | Production only | Sensitive |
| `GOOGLE_MAPS_API_KEY` | Production, Preview | Sensitive |
| `NEXT_PUBLIC_SENTRY_DSN` | Production, Preview | Plain text |
| `SENTRY_AUTH_TOKEN` | Production, Preview | Sensitive |
| `CRON_SECRET` | Production only | Sensitive |
| `NEXT_PUBLIC_APP_URL` | Per-environment | Plain text |

**Per-environment strategy:**
- **Production**: Live Stripe keys, production Supabase, real Resend
- **Preview**: Test Stripe keys, same Supabase (or staging), Sentry enabled
- **Development**: Pulled via `vercel env pull .env.local`

### Build Pipeline Integration

```
Vercel Build Trigger (push to main / PR)
    |
    v
pnpm install --frozen-lockfile
    |
    v
pnpm build
    |
    +-- next build
    |       |
    |       +-- Compiles App Router pages
    |       +-- Generates static pages
    |       +-- React Compiler optimizes 282 client components
    |       +-- Sentry uploads source maps (SENTRY_AUTH_TOKEN)
    |       +-- Outputs .next/
    |
    +-- node scripts/build-sw.mjs
            |
            +-- esbuild compiles src/app/sw.ts -> public/sw.js
            +-- Generates precache manifest
            +-- Minifies in production
    |
    v
Vercel deploys .next/ + public/
```

### No Modifications Needed

| Component | Why No Change |
|-----------|---------------|
| `next.config.ts` | Already configured for production (compress, image optimization, removeConsole) |
| `package.json` build script | `pnpm build` already chains next build + SW build |
| Static assets | `public/` directory deploys automatically |
| API routes | App Router API routes deploy as Vercel Serverless Functions automatically |
| Cron routes | Already use `CRON_SECRET` header verification |

---

## Integration 3: Lighthouse CI Blocking Assertions

### Problem

Current `lighthouserc.js` uses `warn` for all assertions. PRs with performance regressions pass CI. The goal is to make critical metrics block merges.

### Modified Files

| File | Change |
|------|--------|
| `lighthouserc.js` | Change select assertions from `warn` to `error` |
| `.github/workflows/ci.yml` | Add env vars for LHCI, ensure non-zero exit blocks merge |

### Assertion Level Strategy

Per [Lighthouse CI configuration docs](https://googlechrome.github.io/lighthouse-ci/docs/configuration.html):

- `error` = non-zero exit code = PR blocked
- `warn` = printed to stderr = PR not blocked
- `off` = not checked

**Recommended assertion levels:**

```javascript
assertions: {
  // BLOCKING -- these regressions break user experience
  "largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.15 }],
  "categories:performance": ["error", { minScore: 0.7 }],
  "categories:accessibility": ["error", { minScore: 0.9 }],

  // WARNING -- aspirational targets, do not block
  "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
  "total-blocking-time": ["warn", { maxNumericValue: 300 }],
  "categories:performance": ["warn", { minScore: 0.9 }],
}
```

**Rationale for thresholds:**

| Metric | Current Threshold | New Error Threshold | New Warn Threshold | Rationale |
|--------|-------------------|---------------------|---------------------|-----------|
| LCP | 2500ms (warn) | 4000ms (error) | 2500ms (warn) | Error at "poor" boundary; warn at "good" boundary |
| CLS | 0.1 (warn) | 0.15 (error) | 0.1 (warn) | Error at midpoint; warn at "good" boundary |
| FCP | 1500ms (warn) | -- | 2000ms (warn) | Keep as warn -- too variable in CI |
| TBT | 200ms (warn) | -- | 300ms (warn) | Keep as warn -- CI CPU varies |
| Perf score | 0.9 (warn) | 0.7 (error) | 0.9 (warn) | Error at hard floor; warn at aspirational target |
| A11y score | 0.95 (warn) | 0.9 (error) | 0.95 (warn) | Error ensures basic accessibility |

**Key principle:** Error thresholds are set at the "clearly broken" boundary, not the "aspirational" boundary. This prevents CI flakiness while catching real regressions.

### GitHub Actions Workflow Change

The existing `ci.yml` lighthouse job uses `treosh/lighthouse-ci-action@v12` which already exits non-zero on `error` assertions. No workflow change needed for blocking -- the assertion level change in `lighthouserc.js` is sufficient.

However, the workflow should be updated to:
1. Ensure the lighthouse job is a required status check in GitHub branch protection
2. Add `LHCI_GITHUB_APP_TOKEN` for PR status comments (optional but recommended)

### Aggregation Strategy

Current config uses 3 runs per URL. With error assertions, the aggregation method matters.

**Recommendation:** Use `median` (default) aggregation. This means the median of 3 runs must pass. This is more stable than `pessimistic` (which requires the worst run to pass) and more reliable than `optimistic` (which only needs the best run to pass).

---

## Integration 4: LCP Optimization

### Current LCP State

From the Lighthouse JSON data (`lighthouse-homepage-mobile-after-3.json`):

| Page | LCP (mobile) | FCP (mobile) | Target |
|------|-------------|-------------|--------|
| Homepage (`/`) | 11.7s | 2.9s | <2.5s |
| Menu (`/menu`) | Unknown (not in data) | Unknown | <2.5s |

### LCP Element Analysis: Homepage

The homepage Hero is a **text-based section with CSS gradients** (no images). The LCP element is likely the large headline text:

```
"Authentic Burmese Cuisine Delivered to Your Door"
```

rendered by `HeroContent.tsx` inside `Hero.tsx`.

**Why LCP is 11.7s despite no hero image:**

1. **Hero is a Client Component** (`"use client"`) -- requires full JS bundle download + hydration before text renders
2. **Framer Motion animations** -- `m.div` elements with `initial={{ opacity: 0 }}` mean the text is **invisible until JS executes**
3. **Animation cascade** -- Headline has staggered character animation (AnimatedHeadline), subheadline has `delay: 0.5`, stats have `delay: 1.0+`
4. **LazyMotion domMax** -- entire Framer Motion feature set loaded before any animation starts
5. **Provider chain** -- ThemeProvider > DynamicThemeProvider > QueryProvider > LazyMotion > AnimationProvider must all mount before Hero renders

### LCP Fix Strategy

**Root cause:** Text content hidden behind `initial: { opacity: 0 }` in Client Components. Browser sees empty div until JS hydrates and animation runs.

**Fix 1: Server-Rendered Visible Text (HIGH IMPACT)**

Extract the static headline and subheadline into a Server Component that renders immediately. Overlay the animation on top.

```
BEFORE:
  Server HTML: <div data-framer-motion> (empty, opacity: 0)
  After JS:    <div> Authentic Burmese... (visible after ~5s)

AFTER:
  Server HTML: <h1> Authentic Burmese... (visible at FCP)
  After JS:    Animation enhances existing text
```

**Implementation approach:**

| Component | Change | Impact |
|-----------|--------|--------|
| `Hero.tsx` | Extract headline/subheadline as Server Component children passed as props | Text visible at FCP |
| `HeroContent.tsx` | Accept `children` slot for server-rendered text, animate opacity from 1 (not 0) | Removes render-blocking animation |
| `page.tsx` (homepage) | Pass static text as children to Hero | Server-rendered LCP element |

**Fix 2: Remove opacity:0 Initial State (MEDIUM IMPACT)**

Change animation pattern from "fade in from invisible" to "enhance from visible":

```typescript
// BEFORE (text invisible until JS runs):
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}

// AFTER (text visible immediately, JS enhances):
// Use CSS for initial state, animate enhancement only
className="opacity-100"  // Visible in SSR HTML
initial={false}  // Skip initial state in Framer Motion
animate={{ y: 0 }}  // Only animate position, not visibility
```

**Fix 3: Preconnect and Resource Hints (LOW IMPACT)**

Already partially implemented. Existing preconnects in layout:
- `fonts.googleapis.com`
- `fonts.gstatic.com`
- Supabase URL

Additional optimization: ensure fonts load before LCP text by verifying `font-display: swap` is working (already configured in Inter/Playfair font setup).

**Fix 4: Critical CSS Inlining (LOW IMPACT)**

Next.js 16 with Turbopack should inline critical CSS automatically. Verify by checking if the hero gradient background renders without FOUC.

### LCP Fix for Menu Page

The menu page uses Server Component (`MenuPage`) with Suspense boundary:

```typescript
export default function MenuPage() {
  return (
    <main>
      <Suspense fallback={<MenuSkeleton />}>
        <MenuContent />
      </Suspense>
    </main>
  );
}
```

**LCP element:** Likely the first menu item card image.

**Optimizations:**
- `priority` prop on first 4 menu item images (existing `shouldPriorityLoad` utility)
- Verify `fetchPriority="high"` on above-fold images
- Ensure `MenuSkeleton` has proper dimensions to prevent CLS

### LCP Measurement Integration

The existing `WebVitalsReporter` already tracks LCP via `web-vitals` library. Once Sentry is initialized:

```
LCP measurement (web-vitals)
    |
    v
reportMetric() in web-vitals.tsx
    |
    +-- Sentry.setMeasurement("LCP", value, "millisecond")
    +-- Sentry.addBreadcrumb({ category: "web-vitals" })
    +-- sendBeacon("/api/analytics/vitals")
    |
    v
Sentry Performance Dashboard (real user data)
Vitals API endpoint (aggregation)
```

---

## Component Boundaries and New File Inventory

### New Files

| File | Location | Purpose | Runtime |
|------|----------|---------|---------|
| `src/instrumentation-client.ts` | App root | Sentry client SDK init | Browser |
| `sentry.server.config.ts` | Project root | Sentry server SDK init | Node.js |
| `sentry.edge.config.ts` | Project root | Sentry edge SDK init | Edge |
| `src/instrumentation.ts` | App root | Next.js instrumentation hook | Both |
| `vercel.json` | Project root | Vercel deployment config | Build |

### Modified Files

| File | Change | Category |
|------|--------|----------|
| `lighthouserc.js` | Add `error` assertions alongside existing `warn` | CI/CD |
| `.github/workflows/ci.yml` | Minor: ensure LHCI env vars set | CI/CD |
| `src/lib/web-vitals.tsx` | Replace `window.Sentry` check with proper import | Monitoring |
| `src/components/ui/homepage/Hero/Hero.tsx` | Refactor for server-renderable LCP text | Performance |
| `src/components/ui/homepage/Hero/HeroContent.tsx` | Accept children slot, remove opacity:0 initial | Performance |
| `src/app/(public)/page.tsx` | Pass static text to Hero as server-rendered children | Performance |
| `.env.example` | No changes needed (already has Sentry vars) | Config |

### Unchanged Files (Confirmed)

| File | Why No Change |
|------|---------------|
| `next.config.ts` | Sentry wrapper, bundle analyzer, image config all correct |
| `package.json` | Build script already chains next build + SW build |
| `src/app/layout.tsx` | Analytics component already present |
| `src/app/global-error.tsx` | Sentry captureException already correct |
| `src/lib/utils/logger.ts` | Sentry import pattern already correct |
| `src/components/ui/RouteError.tsx` | Sentry captureException already correct |
| `src/app/providers.tsx` | No monitoring-related providers needed |
| `scripts/build-sw.mjs` | Works as-is with Vercel |
| `.husky/pre-commit` | Local-only, no deployment impact |

---

## Data Flow Changes

### New: Error Monitoring Flow

```
Client Error (React, JS)
    |
    v
Sentry Client SDK (instrumentation-client.ts)
    |
    v
POST /monitoring (tunnel route, existing in next.config.ts)
    |
    v
Sentry Ingest -> Sentry Dashboard
    |
    +-- Alert rules (configurable in Sentry UI)
    +-- Issue tracking
    +-- Performance traces
    +-- Session replay (on error)
```

```
Server Error (API route, Server Component)
    |
    v
onRequestError (instrumentation.ts)
    |
    v
Sentry Server SDK (sentry.server.config.ts)
    |
    v
Direct HTTPS to Sentry Ingest
```

### Modified: Web Vitals Flow

```
BEFORE:
  web-vitals -> window.Sentry check (FAILS, SDK not init'd) -> sendBeacon to /api/analytics/vitals

AFTER:
  web-vitals -> Sentry SDK (properly init'd) -> measurements + breadcrumbs
                                              -> sendBeacon to /api/analytics/vitals (unchanged)
```

### New: Build-time Source Map Flow

```
pnpm build (on Vercel)
    |
    v
next build
    |
    v
withSentryConfig (existing wrapper)
    |
    +-- Compiles application
    +-- Generates source maps
    +-- Uploads source maps to Sentry (SENTRY_AUTH_TOKEN)
    +-- Strips source maps from deployment (default)
    |
    v
Vercel serves minified JS without source maps
Sentry dashboard shows readable stack traces
```

### New: Performance Gate Flow

```
PR opened
    |
    v
GitHub Actions CI (existing ci.yml)
    |
    v
build job -> uploads .next artifact (existing)
    |
    v
lighthouse job -> downloads artifact, runs LHCI (existing)
    |
    v
LHCI assertions (CHANGED: error level)
    |
    +-- LCP > 4000ms? -> EXIT 1 -> PR blocked
    +-- CLS > 0.15?   -> EXIT 1 -> PR blocked
    +-- Perf < 0.7?   -> EXIT 1 -> PR blocked
    +-- A11y < 0.9?   -> EXIT 1 -> PR blocked
    |
    +-- LCP > 2500ms? -> WARN only (aspirational)
    +-- TBT > 300ms?  -> WARN only (aspirational)
```

---

## Build Order

Based on dependency analysis:

### Phase 1: Sentry Initialization (Foundation)

**Rationale:** All monitoring depends on SDK init. Existing code already uses Sentry -- it just needs to be turned on.

**Files:** 4 new, 1 modified
**Risk:** LOW -- additive only, no existing behavior changes
**Dependency:** None
**Validation:** Visit `/debug/sentry`, trigger test error, verify in Sentry dashboard

### Phase 2: Vercel Deployment Configuration

**Rationale:** Deployment enables production monitoring. Must happen before LCP optimization can be measured in production.

**Files:** 1 new (`vercel.json`)
**Risk:** LOW -- configuration only
**Dependency:** Phase 1 (Sentry env vars must be set)
**Validation:** Deploy preview, verify build succeeds, check SW serves correctly

### Phase 3: LCP Optimization

**Rationale:** Fix LCP before making it a blocking gate. Current 11.7s would immediately fail any error assertion.

**Files:** 3 modified (Hero components + homepage)
**Risk:** MEDIUM -- changes above-fold rendering, must test visual fidelity
**Dependency:** Phase 2 (need production Lighthouse baseline)
**Validation:** Local Lighthouse run, verify LCP < 4000ms, visual regression check

### Phase 4: Lighthouse CI Blocking

**Rationale:** Gate should be the last thing enabled, after metrics are already passing.

**Files:** 1 modified (`lighthouserc.js`), 1 modified (`ci.yml`)
**Risk:** LOW -- configuration only, but wrong thresholds could block all PRs
**Dependency:** Phase 3 (metrics must pass before gating)
**Validation:** Open test PR, verify LHCI runs with error assertions, confirm PR status reflects pass/fail

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Sentry Init in layout.tsx

**What people do:** Put `Sentry.init()` in the root layout or a client component.

**Why wrong:** Layout runs after hydration. Server errors before hydration are missed. Edge runtime errors are missed entirely.

**Do this instead:** Use `instrumentation.ts` + `instrumentation-client.ts` as designed by the SDK.

### Anti-Pattern 2: Error-Level Assertions at Aspirational Targets

**What people do:** Set `["error", { maxNumericValue: 2500 }]` for LCP.

**Why wrong:** Lighthouse CI in GitHub Actions runs on shared runners with variable CPU. LCP of 2500ms locally often measures as 3500ms in CI. This creates flaky gates that developers learn to ignore or disable.

**Do this instead:** Error thresholds at "clearly broken" boundaries (4000ms LCP). Warn thresholds at aspirational targets (2500ms LCP). Tighten error thresholds gradually over months as the app improves.

### Anti-Pattern 3: Hiding LCP Behind Animation

**What people do:** Use `initial={{ opacity: 0 }}` on the LCP element, making it invisible until JS runs.

**Why wrong:** LCP measures when the largest visible content appears. Content hidden by `opacity: 0` is not "visible." The browser waits until the animation sets `opacity: 1`, which requires: HTML download + JS bundle download + parse + hydration + animation start. This is why a text-only hero has 11.7s LCP.

**Do this instead:** Render LCP content visible in server HTML. Enhance with animation after hydration, but never hide content that was already visible.

### Anti-Pattern 4: Blocking Source Map Upload on Slow CI

**What people do:** Make source map upload synchronous and required during build.

**Why wrong:** Sentry upload can fail due to network issues, rate limits, or transient errors. If build fails because of Sentry, the entire deployment is blocked.

**Do this instead:** The existing `withSentryConfig` defaults handle this correctly -- `silent: !process.env.CI` logs in CI, and source map upload failure does not block the build. Keep this behavior.

### Anti-Pattern 5: Different Build Commands for Vercel vs Local

**What people do:** Override the build command in `vercel.json` with something different from `package.json`.

**Why wrong:** Creates "works locally, fails in deployment" scenarios. The service worker build script is chained in `package.json`'s `build` script. Overriding means the SW might not build.

**Do this instead:** `vercel.json` uses `"buildCommand": "pnpm build"` which runs the same command as local development.

---

## Scaling Considerations

| Concern | At Current Scale | At 10x Traffic | At 100x Traffic |
|---------|-----------------|----------------|-----------------|
| Sentry events | Free tier sufficient | 10% sample rate keeps costs low | Reduce to 1% tracing, keep 100% errors |
| Vercel bandwidth | Hobby/Pro tier | Pro tier with edge caching | Enterprise with ISR |
| Lighthouse CI | 3 runs per PR | 3 runs (unchanged) | Consider dedicated LHCI server |
| Source maps | Upload per build | Upload per build (unchanged) | Consider self-hosted Sentry |
| Web Vitals API | Low traffic endpoint | Add rate limiting | Move to analytics service |

---

## Sources

**Sentry (HIGH confidence):**
- [Sentry Next.js Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/) -- file structure, init patterns, tunnel route
- [Sentry v9 to v10 Migration](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v9-to-v10/) -- breaking changes, OpenTelemetry v2
- [Next.js Instrumentation Guide](https://nextjs.org/docs/app/guides/instrumentation) -- register() function, runtime detection

**Vercel (HIGH confidence):**
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables) -- env config, per-environment settings
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) -- framework detection, build process
- [Vercel Build Configuration](https://vercel.com/docs/builds/configure-a-build) -- buildCommand, installCommand

**Lighthouse CI (HIGH confidence):**
- [Lighthouse CI Configuration](https://googlechrome.github.io/lighthouse-ci/docs/configuration.html) -- assertion levels, aggregation, budgets
- [treosh/lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action) -- GitHub Actions integration
- [CSS-Tricks: Continuous Performance Analysis](https://css-tricks.com/continuous-performance-analysis-with-lighthouse-ci-and-github-actions/)

**LCP Optimization (MEDIUM confidence -- general patterns, not Next.js 16 specific):**
- [Optimizing Next.js Performance: LCP, Render Delay & Hydration](https://www.iamtk.co/optimizing-nextjs-performance-lcp-render-delay-hydration)
- [Next.js Performance Optimization 2025 Playbook](https://pagepro.co/blog/nextjs-performance-optimization-in-9-steps/)
- [Optimizing Core Web Vitals in NextJS App Router 2025](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025)

**Existing Codebase (HIGH confidence -- directly examined):**
- `next.config.ts` -- Sentry wrapper, image config, experimental features
- `src/app/layout.tsx` -- Analytics component, font config, providers
- `src/app/global-error.tsx` -- Sentry error capture
- `src/lib/web-vitals.tsx` -- Web Vitals reporter
- `src/lib/utils/logger.ts` -- Structured logger with Sentry
- `src/components/ui/RouteError.tsx` -- Route error boundary with Sentry
- `lighthouserc.js` -- Current LHCI config
- `.github/workflows/ci.yml` -- Current CI pipeline
- `scripts/build-sw.mjs` -- Service worker build
- `src/components/ui/homepage/Hero/Hero.tsx` -- Hero client component
- `src/components/ui/homepage/Hero/HeroContent.tsx` -- Hero text content
- `src/app/(public)/page.tsx` -- Homepage server component
- `.env.example` -- Environment variable inventory

---
*Architecture research for: Production Deployment Integration*
*Researched: 2026-02-13*
