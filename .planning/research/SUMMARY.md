# Project Research Summary

**Project:** v2.0 Production Deployment & Performance
**Domain:** Production deployment, monitoring, CI/CD hardening, performance optimization
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

The delivery app is feature-complete but not production-ready. Research reveals that **most required production infrastructure is already partially configured but incomplete**. Sentry is installed but never initialized (missing client config files). Lighthouse CI runs but uses warn-only assertions that never block regressions. Chromatic is configured but not wired into CI. The primary challenge is **completing existing setups, not adding new technology**. The single genuinely new dependency is `@vercel/speed-insights` (5KB). Everything else is configuration, ops work, and performance optimization.

The critical path is deployment-first: Vercel deployment → custom domain → environment variable verification → complete Sentry setup. LCP optimization must happen before enabling Lighthouse CI blocking mode (current 8-11s would immediately fail any realistic threshold). The service worker has a critical scope limitation (`/driver` only) and uses `Date.now()` revision hashing that invalidates all cache on every deploy.

Key risks: (1) stale service worker content after deployment with no update mechanism, (2) environment variable misconfiguration causing silent failures, (3) OAuth redirect URLs not configured for production domain, (4) Stripe webhook endpoint using wrong signing secret, (5) Lighthouse CI transition from warn to error blocking all PRs if thresholds aren't reset to baseline first. All risks are **operational and configuration-based**, not architectural — meaning they're preventable with proper checklists and staging verification.

## Key Findings

### Recommended Stack

**No major new dependencies needed.** The existing stack already includes all production tooling in partially-configured states. The work is completing what's there:

**Core technologies:**
- **@sentry/nextjs@10.38.0** (upgrade from 10.34.0) — error monitoring — SDK installed but missing `instrumentation.ts` + `instrumentation-client.ts` for init; completing setup activates existing error capture code throughout the codebase
- **@vercel/speed-insights@^1.3.1** (NEW) — real user monitoring — complements existing `@vercel/analytics`; provides Vercel dashboard with per-route Core Web Vitals from actual users
- **Lighthouse CI** (existing) — performance gate — already runs on PRs but warn-only; needs assertion level change from `warn` to `error` after LCP baseline improves
- **Chromatic** (existing) — visual regression — config exists, Storybook integrated, just needs GitHub Actions workflow + secret

**What NOT to add:**
- Custom monitoring dashboard (Sentry + Vercel Analytics already provide dashboards)
- Docker/Kubernetes (Vercel is serverless; containerization adds zero value)
- LHCI server (temporary public storage sufficient; trend tracking is premature)
- Multi-region deployment (single US region fine for LA-based service)
- Blue-green deployment (Vercel handles atomic deployments by default)

### Expected Features

**Must have (P0 — deploy blockers):**
- Vercel deployment + custom domain (`delivery.mandalaymorningstar.com`) — app currently inaccessible
- Sentry production verification — cannot debug production issues without monitoring
- Resend domain verification (SPF/DKIM/DMARC) — emails hit spam without DNS records
- Admin order detail page (`/admin/orders/[id]`) — dashboard links are 404 (API exists, just need frontend page)
- OAuth production config (Google + Apple) — social login configured but redirect URLs point to localhost

**Should have (P1 — launch quality):**
- LCP optimization (8-11s → <2.5s) — architectural fix, not tooling; root cause is `domMax` synchronous import in `providers.tsx` blocking first render
- Lighthouse CI blocking mode — prevent performance regressions after baseline is fixed
- Admin profile page — admin self-management
- Source map upload to Sentry — readable stack traces

**Defer (P2 — post-launch hardening):**
- CI/CD pipeline gaps (CSS lint, format check, E2E tests in CI)
- Rate limiting upgrade (current in-memory Map doesn't work across serverless instances; needs Redis/Vercel KV)
- CSP headers
- RLS audit
- Bundle size tracking in CI

**Anti-features (do NOT build):**
- Full E2E test suite in CI (5-10 min per run, expensive, fragile; run critical path only)
- WebSocket real-time updates (weekly delivery model doesn't need it; manual refresh works)
- Admin RBAC (single admin for now; premature complexity)

### Architecture Approach

The existing Next.js 16 architecture is fundamentally sound. Integration points are well-defined but incomplete. No architectural changes needed — only configuration completion and optimization.

**Major components:**
1. **Sentry Error Monitoring** — SDK installed but not initialized; requires `instrumentation.ts` (server/edge) + `instrumentation-client.ts` (browser); activates existing `Sentry.captureException()` calls in 15+ error boundaries, logger, global-error
2. **Vercel Deployment Pipeline** — single `vercel.json` config file; service worker build via `build-sw.mjs` already chains in package.json build script; env vars managed via Vercel dashboard
3. **LCP Optimization** — root cause: Hero text hidden behind `opacity: 0` in Framer Motion animations until JS hydrates; fix is server-rendered visible text with animation enhancement after hydration, not hiding content
4. **Lighthouse CI Blocking** — change assertion levels from `warn` to `error` ONLY AFTER baseline improves; initial error thresholds at "clearly broken" boundary (LCP >4000ms), not aspirational (LCP >2500ms)

**Critical architectural finding:**
The service worker is scoped to `/driver` only (line 37 of `useServiceWorker.ts`). This means customer routes get no SW benefits (offline, update prompts, caching). Additionally, `build-sw.mjs` uses `Date.now()` for ALL revision hashes (line 42), invalidating all precached assets on every deploy instead of content-hashed delta updates.

### Critical Pitfalls

1. **Service Worker Serves Stale Content After Deployment** — SW scope is `/driver` only, no customer-facing update prompt exists, `StaleWhileRevalidate` + `skipWaiting: false` means users can stay on old version indefinitely; add "Update available" banner, change scope to `/`, exclude `/auth/callback` from caching, switch to content hashes for revision
2. **Environment Variable Misconfiguration on Vercel** — 10+ env vars with different dev/preview/production values; common failures: wrong Stripe webhook secret (prod vs `stripe listen`), OAuth redirects to localhost, missing `NEXT_PUBLIC_SENTRY_DSN`, Supabase auth redirects to wrong origin; requires deployment checklist + `/api/health` validation endpoint
3. **Supabase Auth Redirect URL Not Configured** — production domain must be added to Supabase Dashboard Redirect URLs whitelist AND Google Cloud Console AND Apple Developer Portal; three separate provider consoles to configure; test full OAuth flow on preview deploy before production
4. **Stripe Webhook Signature Verification Fails** — production needs separate webhook endpoint with different signing secret than local `stripe listen`; must use `request.text()` for raw body NOT `request.json()`; Vercel Deployment Protection may block webhook POST requests
5. **Lighthouse CI Transition Blocks All PRs** — current performance score 30-45, thresholds set at 90; switching warn→error without resetting thresholds blocks every PR; must set error thresholds at baseline+10% margin first, tighten incrementally

## Implications for Roadmap

Based on research, suggested phase structure with strict ordering:

### Phase 1: Deployment Foundation & Environment Setup
**Rationale:** Everything depends on working deployment. Environment variables must be verified before any feature configuration (OAuth, Stripe, Sentry). DNS propagation can take 48 hours — early setup is critical.

**Delivers:**
- Vercel project linked to GitHub
- Custom domain `delivery.mandalaymorningstar.com` with SSL
- All environment variables configured and verified
- `/api/health` endpoint for post-deploy validation

**Addresses pitfalls:**
- Environment variable misconfiguration (checklist + health endpoint)
- DNS misconfiguration (early setup allows time for propagation)

**Research flag:** **SKIP** — Vercel deployment is well-documented, standard Next.js pattern

### Phase 2: Monitoring & Error Tracking
**Rationale:** Must complete Sentry initialization before production traffic. Existing error capture code is already integrated but inactive. Source maps need upload infrastructure configured.

**Delivers:**
- `instrumentation.ts` + `instrumentation-client.ts` files
- Sentry SDK fully initialized (client + server + edge)
- Source maps uploading to Sentry
- `@vercel/speed-insights` integrated for RUM
- Web Vitals reporting to Sentry activated

**Addresses features:**
- Sentry production verification (P0)
- Source map upload (P1)

**Addresses pitfalls:**
- Sentry source maps not uploading
- Client errors not captured (missing client config)

**Research flag:** **SKIP** — Sentry Next.js integration is officially documented, high confidence

### Phase 3: LCP Optimization
**Rationale:** Must fix baseline BEFORE enabling Lighthouse CI blocking. Current 8-11s LCP fails any realistic threshold. Root cause identified: synchronous `domMax` import + `opacity: 0` animations blocking text render.

**Delivers:**
- Hero component refactored for server-rendered LCP text
- `domMax` → async `domAnimation` upgrade
- Animation pattern changed from "fade in from invisible" to "enhance from visible"
- LCP < 4000ms (error threshold boundary)
- Target: LCP < 2500ms (good boundary)

**Addresses features:**
- LCP optimization (P1)

**Addresses pitfalls:**
- LCP optimization stalls because root cause is JS bundle size not images
- Hiding LCP element behind `opacity: 0` animation

**Research flag:** **MODERATE** — Hero component architecture specific to this project; need bundle analysis (`pnpm analyze`) to identify all contributors beyond framer-motion

### Phase 4: Admin Pages (Frontend Only)
**Rationale:** Backend APIs already exist. Pure frontend work with no deployment dependencies. Can be done in parallel with Phase 3 if needed.

**Delivers:**
- `/admin/orders/[id]` page (order detail)
- `/admin/profile` page

**Addresses features:**
- Admin order detail page (P0)
- Admin profile page (P1)

**Addresses pitfalls:**
- None (pure frontend, APIs exist)

**Research flag:** **SKIP** — Standard CRUD pages, customer-facing `/orders/[id]` provides reference pattern

### Phase 5: Production Operations Configuration
**Rationale:** Requires custom domain from Phase 1 for OAuth redirect URLs. DNS records for Resend. Stripe production endpoint. Ops-heavy with multiple external dashboards.

**Delivers:**
- Google OAuth production credentials + consent screen published
- Apple Sign In domain verified + Service ID configured
- Resend domain verified (SPF + DKIM + DMARC DNS records)
- Stripe production webhook endpoint + signing secret

**Addresses features:**
- OAuth production config (P0)
- Resend domain verification (P0)

**Addresses pitfalls:**
- Supabase auth redirect URL not configured
- Stripe webhook signature verification fails
- Magic link email lands in spam (unverified domain)

**Research flag:** **SKIP** — Well-documented provider setup; Supabase/Google/Apple/Stripe/Resend docs are official and high quality

### Phase 6: Service Worker Hardening
**Rationale:** SW configuration affects user update experience post-launch. Must be correct before production traffic. Scope change + revision strategy fix are breaking changes that need testing.

**Delivers:**
- SW scope changed from `/driver` to `/`
- Content-hash based revision strategy (replace `Date.now()`)
- "Update available" banner UI
- `/auth/callback` excluded from SW caching
- `/monitoring` (Sentry tunnel) excluded from SW caching

**Addresses pitfalls:**
- Service worker serves stale content after deployment
- SW precaches `/monitoring` POST requests (breaks Sentry tunnel)

**Research flag:** **MODERATE** — SW update UX pattern needs design; content-hash strategy for precache manifest requires build script refactor

### Phase 7: CI/CD Hardening & Gates
**Rationale:** Performance gates are the LAST thing enabled, after metrics are passing. Error thresholds set at baseline from Phase 3. Chromatic setup is additive (doesn't block existing work).

**Delivers:**
- Lighthouse CI assertions changed from `warn` to `error` at baseline thresholds
- Chromatic GitHub Actions workflow + secret
- GitHub branch protection: require lighthouse + chromatic checks
- CSS lint + Prettier format check added to CI

**Addresses features:**
- Lighthouse CI blocking mode (P1)

**Addresses pitfalls:**
- Lighthouse CI transition blocks all PRs (thresholds reset to baseline first)

**Research flag:** **SKIP** — Lighthouse CI + Chromatic workflows are standard patterns

### Phase Ordering Rationale

**Strict dependencies:**
1. Deployment (Phase 1) must come first — everything needs working deployment
2. LCP fix (Phase 3) must precede CI gates (Phase 7) — can't gate on metrics that fail
3. Custom domain (Phase 1) must precede OAuth config (Phase 5) — redirect URLs need production domain

**Parallelizable work:**
- Phase 2 (Sentry) + Phase 4 (Admin Pages) can run concurrently after Phase 1
- Phase 3 (LCP) can overlap with Phase 5 (Ops Config) — different concerns

**Why ops config comes after LCP:**
OAuth/Stripe/Resend setup is ops-heavy with multiple dashboards and DNS propagation waits. LCP optimization is code-heavy with measurable results. Keeping them separate reduces context switching and allows different skill sets (frontend dev vs ops) to work in parallel if needed.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (LCP Optimization):** Bundle analysis required to identify all JS bottlenecks beyond framer-motion; Chrome DevTools profiling to confirm domMax is primary culprit; may discover additional contributors (GSAP, Zustand hydration)
- **Phase 6 (Service Worker):** Update UX pattern needs design; content-hash precache strategy may need esbuild plugin or build script rework; SW lifecycle testing strategy (skipWaiting vs manual control)

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Vercel deployment is well-documented
- **Phase 2:** Sentry Next.js integration is official docs
- **Phase 4:** Standard Next.js pages consuming existing APIs
- **Phase 5:** Provider docs (Google/Apple/Stripe/Resend) are authoritative
- **Phase 7:** Lighthouse CI + Chromatic have established GitHub Actions patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing dependencies verified via package.json; new dependency (@vercel/speed-insights) version confirmed via npm; Sentry v10 file structure verified against official docs |
| Features | HIGH | P0/P1/P2 priorities verified against codebase audit (missing pages, broken links, incomplete configs); feature dependencies mapped |
| Architecture | HIGH | Integration points identified via codebase analysis; Sentry init files missing (verified); SW scope limitation found (line 37 of useServiceWorker.ts); LCP root cause confirmed (domMax synchronous import, opacity:0 animations) |
| Pitfalls | HIGH | Service worker stale content verified (skipWaiting:false + StaleWhileRevalidate + scope:/driver); env var failure modes documented from official Vercel/Supabase/Stripe troubleshooting guides; DNS pitfalls from Hostinger+Vercel integration guides |

**Overall confidence:** HIGH

### Gaps to Address

**LCP optimization actual impact:**
Research identifies `domMax` synchronous import and `opacity: 0` animations as root causes, but actual LCP improvement magnitude is uncertain until profiling. Current 8-11s has multiple potential contributors (282 client components hydrating, GSAP, Zustand store). Bundle analysis (`pnpm analyze`) is required during Phase 3 planning to identify all contributors beyond framer-motion.

**Service worker update UX:**
Pattern for "Update available" banner exists but design specifics (toast vs banner, wording, dismiss behavior, timing) need product decision during Phase 6 planning.

**Lighthouse CI baseline variability:**
Lighthouse scores on GitHub Actions shared runners vary due to CPU throttling. Setting initial error thresholds requires running LHCI multiple times to establish stable baseline range. Phase 7 planning should run 10+ lighthouse iterations to determine safe threshold.

**OAuth preview URL strategy:**
Vercel preview URLs use unique hashes that change per deployment. Google/Apple OAuth redirect URIs are strict — wildcards not allowed. Separate OAuth app for previews vs production, or test OAuth on staging subdomain only? Decision deferred to Phase 5 planning.

## Sources

### Primary (HIGH confidence)
- [Sentry Next.js Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/) — instrumentation file structure
- [Sentry v9-to-v10 Migration](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v9-to-v10/) — file naming changes
- [Vercel Custom Domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain) — DNS setup
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables) — per-environment config
- [Lighthouse CI Configuration](https://googlechrome.github.io/lighthouse-ci/docs/configuration.html) — assertion levels
- [Framer Motion Bundle Size](https://motion.dev/docs/react-reduce-bundle-size) — domMax vs domAnimation
- [Supabase Auth: Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth: Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Stripe Webhook Setup](https://docs.stripe.com/webhooks/quickstart)
- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction)
- [Chromatic Pricing](https://www.chromatic.com/pricing) — free tier snapshot limits
- Codebase analysis: package.json, next.config.ts, sentry configs, lighthouserc.js, sw.ts, useServiceWorker.ts, build-sw.mjs, Hero components, providers.tsx

### Secondary (MEDIUM confidence)
- [Hostinger to Vercel Connection](https://medium.com/@rajanraj8979/learn-how-to-connect-your-hostinger-domain-to-your-vercel-deployed-project-with-this-easy-966f082919f3) — subdomain CNAME pattern
- [Chromatic vs Playwright](https://www.chromatic.com/compare/playwright) — OS baseline drift comparison (vendor source)
- [Service Worker Lifecycle](https://www.zeepalm.com/blog/service-worker-lifecycle-explained-update-version-control) — skipWaiting behavior
- [LCP Optimization Patterns](https://www.iamtk.co/optimizing-nextjs-performance-lcp-render-delay-hydration) — general Next.js patterns (not v16-specific)

### Tertiary (LOW confidence, needs validation)
- Bundle size impact estimates — framer-motion domMax ~25KB, GSAP ~45KB (cited from docs but actual impact depends on tree-shaking)
- LCP improvement magnitude after fixes — research identifies root causes but actual result depends on profiling

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*
