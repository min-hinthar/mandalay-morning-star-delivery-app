# Stack Research: v2.0 Production Deployment & Performance

**Domain:** Meal delivery PWA - production deployment, monitoring, CI/CD, performance optimization
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

The existing stack already includes most production deployment tooling in partially-configured states. Sentry (`@sentry/nextjs@10.34.0`) is installed but missing the `instrumentation-client.ts` file (v10 requirement) and `instrumentation.ts` file. Vercel Analytics (`@vercel/analytics@1.6.1`) is integrated but Speed Insights is not. Lighthouse CI (`@lhci/cli@0.15.1`) runs on PRs but warn-only with temporary public storage. Chromatic (`chromatic` + `@chromatic-com/storybook@5.0.0`) is configured but never wired into CI. The primary work is **completing partial setups**, not adding new tools. The single genuinely new addition is `@vercel/speed-insights`. For LCP (currently 8-11s), the fix is architectural, not a new library -- the `domMax` import in `providers.tsx` synchronously loads ~25KB of framer-motion features that block rendering.

---

## New Dependencies (Install These)

### Production Monitoring

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @vercel/speed-insights | ^1.3.1 | Real User Monitoring (RUM) for Core Web Vitals on Vercel | Complements `@vercel/analytics` (already installed). Provides Vercel dashboard with LCP/FID/CLS/TTFB per-route breakdowns from real users. Zero config -- drop-in `<SpeedInsights />` component. The existing custom `WebVitalsReporter` + `/api/analytics/vitals` endpoint duplicates what Speed Insights does natively on Vercel, but without a dashboard. |

**Installation:**
```bash
pnpm add @vercel/speed-insights
```

**Integration:**
```typescript
// src/app/layout.tsx - add next to existing <Analytics />
import { SpeedInsights } from "@vercel/speed-insights/next";

// In body:
<Analytics />
<SpeedInsights />
```

---

## Existing Dependencies (Complete Their Setup)

### 1. Sentry Error Monitoring -- INCOMPLETE SETUP

**Installed:** `@sentry/nextjs@10.34.0` (latest: `10.38.0`)
**Status:** Partially configured. Missing critical files.

| What Exists | What's Missing |
|-------------|---------------|
| `sentry.server.config.ts` | `instrumentation-client.ts` (client-side init -- v10 uses this, NOT `sentry.client.config.ts`) |
| `sentry.edge.config.ts` | `instrumentation.ts` (registers server/edge configs + `onRequestError`) |
| `src/app/global-error.tsx` | Source map upload in CI (SENTRY_AUTH_TOKEN not set in GitHub Actions) |
| `next.config.ts` withSentryConfig | Sentry tunnel route not tested in production |
| `.env.example` has SENTRY_DSN | Release tagging (SENTRY_RELEASE not set) |

**Action required:**

1. **Create `instrumentation.ts`** (project root):
```typescript
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

2. **Create `instrumentation-client.ts`** (project root):
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
});
```

3. **Update version** to `^10.38.0` for latest Next.js 16 fixes.

4. **Add SENTRY_AUTH_TOKEN to GitHub Actions secrets** for source map uploads during CI build.

5. **Set SENTRY_RELEASE** in Vercel build env: `SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA`.

**Why not a new library:** Sentry is already the right choice and already installed. The issue is incomplete configuration, not wrong tooling.

### 2. Lighthouse CI -- WARN-ONLY, NO TREND TRACKING

**Installed:** `@lhci/cli@0.15.1` (latest, same version)
**Status:** Functional but underutilized.

| What Exists | What to Improve |
|-------------|-----------------|
| `lighthouserc.js` with mobile + desktop profiles | Switch some assertions from `warn` to `error` for regression gating |
| CI workflow job (runs on PRs) | Add GitHub Status Check integration for PR blocking |
| Temporary public storage uploads | Consider LHCI server for trend tracking (optional) |
| 3 runs per URL, 4 URLs | Add auth-gated routes once Vercel deploy previews work |

**Recommendation: Keep temporary-public-storage** for now. LHCI server requires hosting infrastructure (PostgreSQL + Node.js) that adds operational complexity. Temporary storage gives you per-PR comparison links. Transition to LHCI server only if you need 30+ day trend analysis.

**Change assertions to block on severe regressions:**
```javascript
// lighthouserc.js -- change from warn to error for critical thresholds
"largest-contentful-paint": ["error", { maxNumericValue: 4000 }], // block if >4s
"cumulative-layout-shift": ["error", { maxNumericValue: 0.25 }],  // block if >0.25
// Keep warn for aspirational targets
"largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],  // warn if >2.5s
```

### 3. Chromatic Visual Regression -- CONFIGURED, NOT IN CI

**Installed:** `chromatic` (in devDependencies), `@chromatic-com/storybook@5.0.0`
**Status:** Config file exists (`chromatic.config.js`), Storybook addon wired, but no CI workflow.

| What Exists | What to Add |
|-------------|-------------|
| `chromatic.config.js` with viewports, TurboSnap, delay, diff threshold | GitHub Actions workflow to run on PRs |
| `pnpm chromatic` script | `CHROMATIC_PROJECT_TOKEN` secret in GitHub Actions |
| Storybook 10.1.11 with `@chromatic-com/storybook` addon | PR status check for visual diffs |

**CI workflow to add:**
```yaml
# .github/workflows/chromatic.yml
name: Chromatic
on: pull_request
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for TurboSnap
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          onlyChanged: true
          exitOnceUploaded: true
```

**Pricing note:** Chromatic free tier = 5,000 snapshots/month. With ~50 stories, 5 viewports, TurboSnap enabled, expect ~250-500 snapshots per PR. At 2-3 PRs/week, well within free tier. First paid tier is $149/month for 35,000 snapshots -- unlikely needed for this project size.

**Why Chromatic over Playwright visual regression:** Chromatic eliminates OS-dependent baseline drift (Mac vs Linux font rendering). Playwright screenshot tests require maintaining platform-specific baselines and dealing with anti-aliasing differences. Chromatic runs in consistent cloud infrastructure. The project already has Storybook + Chromatic configured -- just needs CI wiring.

---

## LCP Optimization -- Architectural Changes, Not New Libraries

**Current LCP:** 8-11s (JS execution bottleneck identified)
**Target LCP:** < 2.5s

The LCP problem is NOT missing tooling. It's the existing stack configuration. Key findings:

### Root Cause Analysis

| Issue | Impact | Fix |
|-------|--------|-----|
| `domMax` synchronous import in `providers.tsx` | +25KB on critical path, blocks first render | Switch to async `domAnimation` with dynamic `domMax` upgrade |
| Google Fonts loaded via `next/font/google` with full charset | Blocks text rendering until font loads | Already using `display: "swap"` and `preload: true` -- GOOD |
| `ServiceWorkerRegistration` in initial render tree | Runs SW registration during hydration | Move to `useEffect` with `requestIdleCallback` |
| `WebVitalsReporter` component in render tree | Initializes web-vitals library during render | Already async import -- LOW impact |
| Sentry client bundle (when `instrumentation-client.ts` added) | ~30KB added to client bundle | Use `Sentry.lazyLoadIntegration()` for replay, defer tracing init |

### Recommended Changes (No New Dependencies)

**1. LazyMotion async feature loading:**
```typescript
// src/app/providers.tsx -- CHANGE THIS
// Before (synchronous, blocks render):
import { LazyMotion, domMax } from "framer-motion";
<LazyMotion features={domMax} strict>

// After (async, non-blocking):
const loadFeatures = () =>
  import("framer-motion").then((mod) => mod.domMax);
<LazyMotion features={loadFeatures} strict>
```
This defers ~25KB of framer-motion features to after initial render. Components using `m.div` still work -- they render static HTML until features load, then animate.

**2. Dynamic imports for heavy below-fold components:**
```typescript
// Already partially done for maps and charts:
// src/components/ui/maps/LazyMaps.tsx
// src/components/ui/admin/analytics/LazyCharts.tsx

// Also dynamically import:
// - GSAP-dependent components (ScrollChoreographer, ParallaxLayer, RevealOnScroll)
// - Recharts (already optimizePackageImports, but consider next/dynamic)
```

**3. `@next/bundle-analyzer` is already installed.** Use `pnpm analyze` to identify remaining large chunks. Target: First Load JS < 100KB per route.

### Tools Already in Place (Use Them)

| Tool | Status | Purpose |
|------|--------|---------|
| `@next/bundle-analyzer@16.1.3` | Installed | `pnpm analyze` to identify large chunks |
| `web-vitals@5.1.0` | Installed | Client-side CWV measurement |
| React Compiler (`babel-plugin-react-compiler@1.0.0`) | Enabled | Auto-memoization, reduces re-renders |
| `next.config.ts` `optimizePackageImports` | Configured | Tree-shaking for lucide, framer-motion, radix, recharts, date-fns |
| `next.config.ts` `modularizeImports` | Configured | Lucide icon tree-shaking |
| `next.config.ts` `compiler.removeConsole` | Configured | Strips console.log in production |
| Image optimization (avif/webp, cache TTL) | Configured | Next.js Image component optimization |

---

## Vercel Deployment -- No New Dependencies

Vercel deployment is a platform configuration task, not a code dependency.

### Required Configuration

| Area | Action | Where |
|------|--------|-------|
| Custom domain | Add `delivery.mandalaymorningstar.com` in Vercel dashboard | Vercel > Project Settings > Domains |
| DNS | Add CNAME record pointing to `cname.vercel-dns.com` | Domain registrar |
| SSL | Automatic -- Vercel provisions Let's Encrypt cert | No action needed |
| Environment variables | Set all `.env.example` vars in Vercel dashboard | Vercel > Project Settings > Environment Variables |
| OAuth redirect URLs | Update Google/Apple OAuth to include production domain | Google Cloud Console / Apple Developer |
| Stripe webhook | Add production webhook URL | Stripe Dashboard > Webhooks |
| Supabase redirect URLs | Add production domain to allowed redirect URLs | Supabase Dashboard > Auth > URL Configuration |
| Resend domain verification | Verify `mail.mandalaymorningstar.com` | Resend Dashboard > Domains |

### Environment Variables for Vercel

```
# Required (from .env.example)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_MAPS_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_WEBHOOK_SECRET
CRON_SECRET
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
NEXT_PUBLIC_APP_URL=https://delivery.mandalaymorningstar.com

# Vercel-specific (auto-set or manual)
SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA  # Set via build command
VERCEL=1  # Auto-set by Vercel
```

### `vercel.json` (Optional)

Not strictly required -- Next.js on Vercel works zero-config. Only create if you need:
- Custom headers (already handled in `next.config.ts`)
- Cron jobs (already defined -- verify Vercel cron format)
- Redirect rules

---

## Supporting Libraries (Already Installed, Verify Versions)

| Library | Installed | Latest | Action |
|---------|-----------|--------|--------|
| @sentry/nextjs | 10.34.0 | 10.38.0 | **Update** -- includes Next.js 16.1 fixes |
| @vercel/analytics | 1.6.1 | 1.6.1 | Current |
| @lhci/cli | 0.15.1 | 0.15.1 | Current |
| @chromatic-com/storybook | 5.0.0 | 5.0.1 | Minor update, optional |
| web-vitals | 5.1.0 | 5.1.0 | Current |
| @next/bundle-analyzer | 16.1.3 | 16.1.3 | Current |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @vercel/speed-insights | Custom web-vitals + own dashboard | If NOT deploying to Vercel; if you need cross-provider RUM |
| Chromatic (visual regression) | Playwright `toHaveScreenshot()` | If you want zero-cost, self-hosted visual testing AND can tolerate OS-dependent baseline drift |
| Chromatic (visual regression) | Percy by BrowserStack | If you need cross-browser visual testing (Safari, Firefox); Percy starts at $399/month |
| Sentry (error monitoring) | Vercel Log Drain + Axiom | If you want infrastructure-level logging instead of application-level error tracking; different concern |
| LHCI temporary storage | LHCI server (self-hosted) | If you need 30+ day performance trend analysis and private report storage |
| Keep `web-vitals` + `WebVitalsReporter` | Remove in favor of Speed Insights only | Keep both -- `web-vitals` gives dev console output, Speed Insights gives prod dashboard |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Datadog / New Relic | Massive overhead for a small delivery app; Sentry + Vercel Analytics covers monitoring | Sentry (errors) + Vercel Analytics (traffic) + Speed Insights (performance) |
| Partytown (move 3P scripts to web worker) | App has minimal 3P scripts (no ads, no heavy analytics); added complexity for negligible gain | Focus on reducing first-party JS bundle |
| `critters` (critical CSS inlining) | Next.js 16 already optimizes CSS delivery with built-in CSS ordering; manual critical CSS is fragile with Tailwind 4 | Trust Next.js CSS optimization + Tailwind JIT |
| Preact (smaller React alternative) | Incompatible with React 19 features (React Compiler, Server Components) | Keep React 19; fix LCP via bundle optimization, not framework swap |
| `next-pwa` | Deprecated; conflicts with Serwist which is already installed | Serwist (already configured) |
| BundleWatch / Bundlesize | LHCI assertions already cover bundle size regression detection | @lhci/cli assertions |
| Playwright visual regression (alongside Chromatic) | Redundant -- Chromatic already configured. Running both wastes CI minutes | Chromatic for visual regression, Playwright for functional E2E |

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @sentry/nextjs@^10.38.0 | Next.js 16.1.x | Sentry e2e tests include Next.js 16 test apps. Peer dependency added. |
| @sentry/nextjs@^10.38.0 | React 19 | Full support since v10. `instrumentation-client.ts` replaces `sentry.client.config.ts`. |
| @vercel/speed-insights@^1.3.1 | Next.js 16, React 19 | Drop-in component, framework-agnostic internal API. |
| @vercel/speed-insights@^1.3.1 | @vercel/analytics@1.6.1 | Complementary, not conflicting. Analytics = traffic, Speed Insights = performance. |
| chromatic@^15.1.0 | Storybook 10.1.x | Storybook 6.5+ required. Current Storybook 10.1.11 fully supported. |
| @lhci/cli@0.15.1 | Next.js 16 | Runs Lighthouse against built app via `pnpm start`; framework-agnostic. |
| web-vitals@5.1.0 | React 19 | Library is framework-agnostic; uses PerformanceObserver API. |

---

## Installation Summary

```bash
# New dependency (1 package, ~5KB client bundle)
pnpm add @vercel/speed-insights

# Update existing (patch version bump)
pnpm add @sentry/nextjs@^10.38.0

# Dev dependency update (optional)
pnpm add -D @chromatic-com/storybook@^5.0.1
```

**Total new client bundle impact:** ~5KB (Speed Insights component)
**Total new server bundle impact:** 0KB

---

## Configuration Required

### Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `instrumentation.ts` | Sentry server/edge registration + error capture | HIGH -- Sentry doesn't capture server errors without this |
| `instrumentation-client.ts` | Sentry client-side init (replaces missing sentry.client.config.ts) | HIGH -- client errors not tracked without this |
| `.github/workflows/chromatic.yml` | Visual regression testing on PRs | MEDIUM |
| `vercel.json` | Only if cron config or custom headers needed beyond next.config.ts | LOW |

### Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/app/layout.tsx` | Add `<SpeedInsights />` component | HIGH |
| `src/app/providers.tsx` | Switch `domMax` from sync to async import | HIGH (LCP fix) |
| `lighthouserc.js` | Add `error`-level assertions for regression blocking | MEDIUM |
| `.github/workflows/ci.yml` | Add SENTRY_AUTH_TOKEN secret, set SENTRY_RELEASE | MEDIUM |
| `next.config.ts` | No changes needed (Sentry config already present) | NONE |

### GitHub Secrets to Add

| Secret | Purpose |
|--------|---------|
| `SENTRY_AUTH_TOKEN` | Source map upload during CI builds |
| `CHROMATIC_PROJECT_TOKEN` | Visual regression testing |

### Vercel Environment Variables

All variables from `.env.example` plus:
- `SENTRY_RELEASE` = `$VERCEL_GIT_COMMIT_SHA`
- `NEXT_PUBLIC_APP_URL` = `https://delivery.mandalaymorningstar.com`

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Sentry setup completion | HIGH | Official docs verified via WebFetch. v10 file structure confirmed: `instrumentation-client.ts` + `instrumentation.ts`. |
| Vercel deployment | HIGH | Standard Vercel + Next.js deployment. Custom subdomain is DNS config, not code. |
| Speed Insights addition | HIGH | npm version verified (1.3.1). Drop-in component, same pattern as existing `<Analytics />`. |
| Lighthouse CI improvements | HIGH | Already functional; changes are assertion threshold tuning, not infrastructure. |
| Chromatic CI wiring | HIGH | Config already exists. Just needs GitHub Actions workflow + secret. |
| LCP optimization | MEDIUM | `domMax` async loading is well-documented pattern. Actual LCP improvement depends on profiling -- 8-11s LCP likely has multiple causes beyond framer-motion. Need `pnpm analyze` output to identify all contributors. |
| Visual regression (Chromatic free tier sufficiency) | MEDIUM | 5,000 snapshots/month estimate based on current story count. May need re-evaluation as stories grow. |

---

## Sources

- [Sentry Next.js Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/) -- confirmed `instrumentation-client.ts` + `instrumentation.ts` file structure (HIGH confidence)
- [Sentry v9-to-v10 Migration](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v9-to-v10/) -- FID removed, use INP; `sendDefaultPii` gating; OpenTelemetry v2 (HIGH confidence)
- [Sentry npm](https://www.npmjs.com/package/@sentry/nextjs) -- v10.38.0 latest, verified via `npm view` (HIGH confidence)
- [Vercel Speed Insights docs](https://vercel.com/docs/speed-insights) -- RUM metrics, dashboard integration (HIGH confidence)
- [Vercel Speed Insights npm](https://www.npmjs.com/package/@vercel/speed-insights) -- v1.3.1 latest, verified via `npm view` (HIGH confidence)
- [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain) -- CNAME setup, auto-SSL (HIGH confidence)
- [Chromatic pricing](https://www.chromatic.com/pricing) -- 5,000 free snapshots/month, $149/month first paid tier (MEDIUM confidence, may change)
- [Chromatic vs Playwright comparison](https://www.chromatic.com/compare/playwright) -- OS-dependent baseline issue with Playwright screenshots (MEDIUM confidence, vendor source)
- [Framer Motion bundle size reduction](https://motion.dev/docs/react-reduce-bundle-size) -- `domMax` ~25KB, `domAnimation` ~15KB, async loading pattern (HIGH confidence)
- [Lighthouse CI getting started](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md) -- temporary storage vs LHCI server tradeoffs (HIGH confidence)
- [treosh/lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action) -- GitHub Actions integration (HIGH confidence)
- [Next.js instrumentation-client convention](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client) -- Next.js 16 file convention for client instrumentation (HIGH confidence)
- Codebase analysis: `package.json`, `next.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `global-error.tsx`, `lighthouserc.js`, `chromatic.config.js`, `.github/workflows/ci.yml`, `src/app/providers.tsx`, `src/app/layout.tsx`, `src/lib/web-vitals.tsx`

---
*Stack research for: v2.0 Production Deployment & Performance*
*Researched: 2026-02-13*
