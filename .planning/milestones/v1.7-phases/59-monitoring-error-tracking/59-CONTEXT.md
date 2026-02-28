# Phase 59: Monitoring & Error Tracking - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Instrument the production app with Sentry error tracking, Vercel Speed Insights (Core Web Vitals), and Vercel Web Analytics (traffic). Errors are captured, source-mapped, and linked to GitHub. Performance metrics flow to dashboards. No new user-facing features.

</domain>

<decisions>
## Implementation Decisions

### Error capture scope

- Capture ALL client-side errors (no filtering of extension/third-party noise)
- React error boundaries auto-report to Sentry with component tree context
- Server-side API route errors go to both Sentry AND Vercel logs
- 100% error sample rate — every error captured
- Unhandled promise rejections captured alongside thrown errors
- Auto-breadcrumbs enabled: clicks, navigations, console logs, XHR/fetch

### Performance metrics

- Vercel Speed Insights enabled (standard Core Web Vitals: LCP, CLS, FID/INP)
- Vercel Web Analytics enabled (page views, referrers, top pages)
- Sentry performance tracing enabled on all routes

### Alert & triage behavior

- Sentry GitHub integration enabled — source context in errors, suspect commits
- No session replay initially... correction: session replay IS enabled (see below)

### Session replay

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

</decisions>

<specifics>
## Specific Ideas

- User explicitly wants Sentry GitHub integration with full linking (source context, suspect commits)
- Session replay enabled after initial "no" — user changed mind to enable error-only replays
- Vercel Web Analytics in addition to Speed Insights (both traffic and performance dashboards)
- No specific Sentry plan tier mentioned — Claude should work within free/developer tier limits

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 59-monitoring-error-tracking_
_Context gathered: 2026-02-13_
