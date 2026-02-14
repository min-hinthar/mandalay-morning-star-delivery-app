---
phase: 59-monitoring-error-tracking
verified: 2026-02-14T08:15:00Z
status: gaps_found
score: 7/8 must-haves verified
gaps:
  - truth: "Real user Core Web Vitals (LCP, CLS, INP) are visible in Vercel Speed Insights dashboard"
    status: failed
    reason: "@vercel/speed-insights installed but not committed to package.json"
    artifacts:
      - path: "package.json"
        issue: "Missing @vercel/speed-insights dependency entry"
    missing:
      - "Add @vercel/speed-insights to package.json dependencies"
      - "Commit updated package.json and pnpm-lock.yaml"
---

# Phase 59: Monitoring & Error Tracking Verification Report

**Phase Goal:** Production errors are captured, triaged, and linked to source code with readable stack traces
**Verified:** 2026-02-14T08:15:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Client-side errors (uncaught exceptions, unhandled promise rejections) are captured by Sentry with component stack traces | ✓ VERIFIED | instrumentation-client.ts has Sentry.init with replayIntegration, breadcrumbsIntegration, browserTracingIntegration. No production guard. DSN configured. |
| 2 | Server-side and Edge runtime errors are captured by Sentry with source-mapped stack traces | ✓ VERIFIED | sentry.server.config.ts and sentry.edge.config.ts exist with Sentry.init, environment, release. instrumentation.ts imports both via register(). |
| 3 | Session replay buffer records and saves replay on error (error-only mode) | ✓ VERIFIED | instrumentation-client.ts has replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 1.0 |
| 4 | Auto-breadcrumbs capture clicks, navigations, console logs, XHR/fetch | ✓ VERIFIED | instrumentation-client.ts has breadcrumbsIntegration with console, dom, fetch, history, xhr all set to true |
| 5 | ALL errors are captured with no ignoreErrors filtering | ✓ VERIFIED | sentry.server.config.ts contains comment "// NO ignoreErrors — capture ALL errors", no ignoreErrors array found in any config |
| 6 | Real user Core Web Vitals (LCP, CLS, INP) are visible in Vercel Speed Insights dashboard | ✗ FAILED | SpeedInsights component imported and rendered in layout.tsx, but @vercel/speed-insights NOT in package.json dependencies |
| 7 | Page views and referrer data are visible in Vercel Web Analytics dashboard | ✓ VERIFIED | Analytics component rendered in layout.tsx, @vercel/analytics in package.json dependencies |
| 8 | SpeedInsights component renders in production layout alongside existing Analytics component | ✓ VERIFIED | layout.tsx imports and renders both SpeedInsights (line 91) and Analytics (line 92) |

**Score:** 7/8 truths verified (one dependency not committed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| instrumentation-client.ts | Client-side Sentry init with replay, breadcrumbs, environment, router transitions | ✓ VERIFIED | 29 lines, contains replayIntegration, breadcrumbsIntegration, environment, release, onRouterTransitionStart export |
| sentry.server.config.ts | Server-side Sentry init without ignoreErrors | ✓ VERIFIED | 13 lines, no ignoreErrors, has environment/release, extraErrorDataIntegration |
| sentry.edge.config.ts | Edge runtime Sentry init with environment | ✓ VERIFIED | 9 lines, has environment/release, tracesSampleRate |
| src/app/layout.tsx | Root layout with SpeedInsights and Analytics components | ✓ VERIFIED | 96 lines, imports both from @vercel packages, renders both before closing body tag |
| src/lib/web-vitals.tsx | Dev-only CWV console reporter (production reporting removed) | ✓ VERIFIED | 155 lines, no sendBeacon, no window.Sentry, has dev-mode console.log, exports WebVitalsReporter |
| package.json | @vercel/speed-insights dependency | ✗ FAILED | Missing @vercel/speed-insights in dependencies (only @vercel/analytics present) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| instrumentation.ts | sentry.server.config.ts | dynamic import in register() | ✓ WIRED | Line 5: await import("./sentry.server.config") |
| instrumentation.ts | sentry.edge.config.ts | dynamic import in register() | ✓ WIRED | Line 9: await import("./sentry.edge.config") |
| instrumentation-client.ts | Sentry dashboard | DSN environment variable | ✓ WIRED | Line 4: dsn: process.env.NEXT_PUBLIC_SENTRY_DSN |
| src/app/layout.tsx | @vercel/speed-insights | SpeedInsights component import | ✓ WIRED | Line 5: import { SpeedInsights } from "@vercel/speed-insights/next", line 91: renders component |
| src/app/layout.tsx | @vercel/analytics | Analytics component import (already exists) | ✓ WIRED | Line 4: import { Analytics } from "@vercel/analytics/react", line 92: renders component |
| next.config.ts | Sentry source maps | withSentryConfig wrapper | ✓ WIRED | withSentryConfig wraps nextConfig with authToken, tunnelRoute, widenClientFileUpload |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| MNTR-01: Sentry client-side errors captured via instrumentation-client.ts | ✓ SATISFIED | None - client init verified |
| MNTR-02: Sentry server/edge errors captured via instrumentation.ts | ✓ SATISFIED | None - server/edge init verified |
| MNTR-03: Source maps uploaded to Sentry on every build | ✓ SATISFIED | None - withSentryConfig verified |
| MNTR-04: @vercel/speed-insights integrated for real user monitoring | ✗ BLOCKED | Package installed in node_modules but not in package.json |
| MNTR-05: Sentry SDK updated to ^10.38.0 | ✓ SATISFIED | None - pnpm list shows 10.38.0 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/lib/web-vitals.tsx | 63, 91 | console.log statements | Info | Intentional dev-mode logging (guarded by NODE_ENV check) |

No blocking anti-patterns found.

### Human Verification Required

#### 1. Client-side error capture in Sentry dashboard

**Test:** Open browser DevTools, execute `throw new Error("Test client error")` in console
**Expected:** Error appears in Sentry dashboard with browser info, component stack trace, and replay available
**Why human:** Requires live Sentry project and dashboard access

#### 2. Server-side error capture in Sentry dashboard

**Test:** Trigger a server error (e.g., visit a route that throws an error in getServerSideProps or API route)
**Expected:** Error appears in Sentry dashboard with server-side stack trace showing original TypeScript file names (not minified)
**Why human:** Requires deployed environment and live Sentry project

#### 3. Core Web Vitals in Vercel Speed Insights dashboard

**Test:** Deploy to Vercel, wait for real user traffic (or use Lighthouse/WebPageTest to simulate)
**Expected:** LCP, CLS, INP data appears in Vercel project dashboard under "Speed Insights" tab
**Why human:** Requires deployed environment, real user traffic, and Vercel dashboard access

#### 4. Vercel Web Analytics traffic data

**Test:** Deploy to Vercel, generate page views
**Expected:** Page views, top pages, referrer data visible in Vercel project dashboard under "Analytics" tab
**Why human:** Requires deployed environment and Vercel dashboard access

#### 5. Session replay recording on error

**Test:** Trigger client-side error, check Sentry event for replay attachment
**Expected:** Sentry event has replay available showing 30s before error with privacy masking applied
**Why human:** Requires live Sentry project and replay playback

#### 6. Source map verification

**Test:** Trigger server error, check stack trace in Sentry
**Expected:** Stack trace shows original TypeScript file names and line numbers (e.g., src/app/api/health/route.ts:42) not minified JS
**Why human:** Requires deployed build with source maps uploaded and live Sentry project

### Gaps Summary

**1 gap blocking goal achievement:**

The @vercel/speed-insights package was installed (present in node_modules) and integrated into the layout.tsx component, but the package.json dependency entry was not committed. This means:

- pnpm install on a fresh clone will NOT install @vercel/speed-insights
- The build will fail with "Module not found: Can't resolve '@vercel/speed-insights/next'"
- MNTR-04 requirement cannot be satisfied

**Root cause:** Plan 59-02 Task 1 installed the package (pnpm add @vercel/speed-insights) but the resulting package.json change was either:
1. Not staged/committed, OR
2. Lost during a git operation

**Fix required:** Add @vercel/speed-insights to package.json dependencies and commit both package.json and pnpm-lock.yaml.

---

_Verified: 2026-02-14T08:15:00Z_
_Verifier: Claude (gsd-verifier)_
