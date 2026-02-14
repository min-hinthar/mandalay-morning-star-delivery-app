# Feature Landscape: Production Deployment & Hardening

**Domain:** Production readiness for meal delivery PWA -- deployment, monitoring, CI/CD, performance, missing pages
**Researched:** 2026-02-13
**Confidence:** HIGH (verified against codebase, official docs, web research)

## Current State Assessment

| Area | Current State | Production-Ready? |
|------|---------------|-------------------|
| Deployment | No Vercel project linked; no custom domain | NO |
| Domain | Main site on Hostinger Website Builder (mandalaymorningstar.com) | Partial -- main site exists |
| Sentry monitoring | Installed (@sentry/nextjs 10.34.0), server + edge configs done, client disabled in dev due to Next.js 16 infinite loop | Partial -- production-only |
| Lighthouse CI | lighthouserc.js exists, GitHub Actions job exists, assertions at "warn" level only | Partial -- does not block PRs |
| CI pipeline | lint + typecheck + test + build + lighthouse(warn-only) | Partial -- no blocking perf gate |
| LCP performance | 8-11s (reported); hero section with animations, lazy-loaded Google Maps below fold | NO -- target is <2.5s |
| Lighthouse score | 30-45 (reported) | NO -- target is 90+ |
| Admin order detail | `/admin/orders/[id]` page does NOT exist; API route `/api/admin/orders/[id]/details` DOES exist | NO -- broken links on dashboard |
| Admin profile | `/admin/profile` page does NOT exist | NO -- no admin self-management |
| Social login ops | Supabase Auth supports Google/Apple natively; code may exist, but Google Cloud Console + Apple Developer Portal config needed | NO -- requires ops setup |
| Resend domain | Resend API key configured; domain NOT verified (no SPF/DKIM/DMARC on production domain) | NO -- emails may hit spam |
| Service worker | Custom SW built via esbuild (`scripts/build-sw.mjs`), manifest.json exists | Partial |
| Error boundaries | Limited error.tsx files, no global error boundary | Partial |

---

## Table Stakes (Must Have for Production Launch)

Features that are non-negotiable for going live. Missing any of these means the product is not production-ready.

### 1. Vercel Deployment + Custom Domain (delivery.mandalaymorningstar.com)

| Feature | Why Required | Complexity | Depends On |
|---------|-------------|------------|------------|
| Vercel project creation + Git integration | App is not deployed anywhere; cannot be accessed by users | LOW | Vercel account, GitHub repo access |
| Custom subdomain CNAME setup | `delivery.mandalaymorningstar.com` pointing to Vercel | LOW | Hostinger DNS panel access |
| Environment variables in Vercel | Supabase, Stripe, Sentry, Resend, Google Maps keys | LOW | All API keys already in .env.local |
| SSL/TLS certificate | Vercel provides automatic SSL via Let's Encrypt | FREE | Domain DNS propagation |
| Production branch deployment | Main branch auto-deploys to production | LOW | Vercel Git integration |
| Preview deployments for PRs | Each PR gets a preview URL for testing | FREE | Vercel default behavior |

**Key constraint -- Hostinger Website Builder DNS:**
- Main site (mandalaymorningstar.com) is on Hostinger Website Builder, NOT a traditional hosting plan
- Hostinger Website Builder manages DNS automatically for the root domain
- For a subdomain (delivery.mandalaymorningstar.com), add a **CNAME record** in Hostinger DNS zone editor pointing to `cname.vercel-dns.com`
- Do NOT change nameservers to Vercel (would break the main Hostinger Website Builder site)
- DNS propagation: 15 minutes to 48 hours
- Vercel auto-provisions SSL once DNS propagates

**Confidence:** HIGH -- verified via Vercel docs and Hostinger subdomain documentation.

### 2. Sentry Error Monitoring (Production-Ready)

| Feature | Why Required | Complexity | Depends On |
|---------|-------------|------------|------------|
| Fix client-side Sentry initialization | Currently disabled in dev due to "Maximum update depth exceeded" infinite loop with Next.js 16 | MEDIUM | @sentry/nextjs compatibility |
| Verify production Sentry works end-to-end | Server + edge configs exist but untested in production | LOW | Vercel deployment |
| Source map upload in CI/CD | Stack traces need readable function names, not minified code | LOW | SENTRY_AUTH_TOKEN in Vercel env |
| Sentry tunnel route verification | `/monitoring` tunnel route configured to bypass ad blockers | LOW | next.config.ts already configured |
| Error alerting rules | Slack/email notifications for new errors, error spikes | LOW | Sentry dashboard config |
| Session replay verification | `replaysOnErrorSampleRate: 1.0` configured; verify it captures replays | LOW | Production traffic |

**Current Sentry status (codebase-verified):**
- `sentry.server.config.ts`: tracesSampleRate 0.1 prod, ignoreErrors configured, extraErrorDataIntegration
- `sentry.edge.config.ts`: tracesSampleRate 0.1 prod
- `instrumentation-client.ts`: Production-only init with replayIntegration + browserTracingIntegration; `onRouterTransitionStart` DISABLED (causes infinite loop)
- `instrumentation.ts`: Server register + `onRequestError = Sentry.captureRequestError`
- `next.config.ts`: Sentry org/project configured, `tunnelRoute: "/monitoring"`, `widenClientFileUpload: true`
- **Known issue:** `@sentry/nextjs` client-side `onRouterTransitionStart` causes "Maximum update depth exceeded" with Next.js 16 / React 19. Keep it disabled until Sentry fixes this. The rest of client Sentry (error capture, replay, performance) works in production.

**Confidence:** HIGH -- verified against codebase files. Sentry has added Next.js 16 e2e tests, suggesting active compatibility work.

### 3. Lighthouse CI Performance Gate (Blocking Mode)

| Feature | Why Required | Complexity | Depends On |
|---------|-------------|------------|------------|
| Switch Lighthouse assertions from "warn" to "error" | Current "warn" mode means performance regressions ship silently | LOW | lighthouserc.js change |
| Set realistic initial thresholds | Current thresholds (LCP <2.5s, perf >0.9) are aspirational; need achievable-but-improving targets | LOW | Baseline measurement |
| Make Lighthouse CI a required check for PR merge | GitHub branch protection rule: require `lighthouse` check to pass | LOW | GitHub repo settings |
| Add Lighthouse score to PR comments | Visual performance report in PR for reviewer context | LOW | treosh/lighthouse-ci-action already configured with `uploadArtifacts: true` |

**Current Lighthouse CI config (codebase-verified):**
```
Assertions (all "warn" -- none block PRs):
- FCP: maxNumericValue 1500ms
- LCP: maxNumericValue 2500ms
- CLS: maxNumericValue 0.1
- TBT: maxNumericValue 200ms
- Performance score: minScore 0.9
- Accessibility score: minScore 0.95

URLs tested: /, /menu, /cart, /checkout
Runs: 3 per URL
Upload: temporary-public-storage
```

**Recommended approach:**
1. First, fix LCP to get performance score to 70+
2. Set initial blocking thresholds at the NEW baseline (e.g., perf >0.65, LCP <4000ms)
3. Tighten thresholds incrementally as performance improves
4. Keep accessibility at "error" level immediately (score >0.9)

**The "error" vs "warn" distinction:**
- `"warn"`: Prints warning in CI output but exit code 0 (pipeline passes)
- `"error"`: Exit code non-zero (pipeline fails, PR blocked if check is required)
- Changing from `"warn"` to `"error"` is a one-line change per assertion in lighthouserc.js

**Confidence:** HIGH -- verified via Lighthouse CI documentation and codebase config.

### 4. LCP Optimization (8-11s to <3s)

| Feature | Why Required | Complexity | Depends On |
|---------|-------------|------------|------------|
| Identify LCP element | Unknown what the actual LCP element is (hero image? text? animation?) | LOW | Lighthouse audit, Web Vitals |
| Hero section render optimization | Hero likely blocks on GSAP/Framer Motion initialization before paint | HIGH | Hero component refactor |
| Critical CSS extraction | Ensure above-the-fold styles are inlined, not loaded via external CSS | MEDIUM | Next.js handles most of this |
| Font loading optimization | Verify fonts use `next/font` with `display: swap` | LOW | Check existing font config |
| Image optimization for hero | If LCP is an image: `priority` attribute, proper sizing, AVIF/WebP | LOW | next.config.ts image config already has AVIF/WebP |
| Reduce client-side JS for initial render | Hero uses client components with GSAP; consider SSR-first approach | HIGH | Hero component architecture |
| Defer non-critical animations | GSAP/Framer Motion initialization should not block first paint | MEDIUM | Animation system refactor |
| Remove/defer Google Maps from homepage | Already lazy-loaded via `React.lazy()` but 369KB still loads eventually | LOW | Already done |
| Enable Partial Prerendering (PPR) | `ppr: true` commented out in next.config.ts; could improve TTFB | MEDIUM | Next.js 16 experimental feature |
| Bundle analysis and code splitting | `@next/bundle-analyzer` already installed; identify largest chunks | LOW | Run `pnpm analyze` |

**Root cause analysis (codebase-verified):**
The homepage has a heavy Hero component that is a client component with animations. The server component page.tsx does server-side data fetching, but the Hero renders client-side with GSAP. This means:
1. Server sends HTML shell
2. Client downloads React + GSAP + Framer Motion bundles
3. Client hydrates
4. GSAP initializes animations
5. LCP element finally paints

**LCP optimization priority order:**
1. Determine the actual LCP element (run Lighthouse, check "Largest Contentful Paint element")
2. If text: ensure font loads fast (preload, font-display: swap)
3. If image: add `priority`, proper `sizes`, preload hint
4. If animation-blocked: make Hero server-renderable for initial paint, hydrate animations after
5. Reduce JS bundle: check if Framer Motion + GSAP both needed for Hero
6. Consider PPR for static shell + streaming dynamic content

**Target:** LCP <2.5s (Google "Good"), Lighthouse performance >90.

**Confidence:** HIGH for diagnosis approach, MEDIUM for specific fix (need to identify actual LCP element first).

### 5. Admin Order Detail Page (/admin/orders/[id])

| Feature | Why Required | Complexity | Depends On |
|---------|-------------|------------|------------|
| Order detail page with full order info | Dashboard links to `/admin/orders/[id]` (line 263 of admin/page.tsx) but page doesn't exist -- 404 | MEDIUM | API route already exists (`/api/admin/orders/[id]/details`) |
| Customer info display | Name, email, phone for contacting about order issues | LOW | API response includes customer fields |
| Order items list with quantities and prices | Admin needs to see what was ordered | LOW | API response includes items array |
| Delivery address display | Admin needs to know where to deliver | LOW | API response includes address |
| Order status management | Change status (confirm, prepare, out for delivery, deliver) | LOW | API route `/api/admin/orders/[id]/status` already exists |
| Audit log display | See history of status changes, who made them | LOW | API response includes auditLog array |
| Driver assignment display | See which driver is assigned | LOW | API response includes assignedDriverName |
| Cancel/refund actions | Admin can cancel order, process refund | MEDIUM | API routes `/api/admin/orders/[id]/cancel` and `/refund` exist |
| Print-friendly order summary | For kitchen staff who print orders | LOW | CSS print styles |

**Existing API infrastructure (codebase-verified):**
- `GET /api/admin/orders/[id]/details` -- Returns complete order with customer, items, address, audit log, driver info
- `PATCH /api/admin/orders/[id]/status` -- Update order status
- `GET /api/admin/orders/[id]/items` -- Get order items
- `GET /api/admin/orders/[id]/driver` -- Get assigned driver
- `POST /api/admin/orders/[id]/cancel` -- Cancel order
- `POST /api/admin/orders/[id]/refund` -- Process refund

**All backend is done.** This is purely a frontend page that consumes the existing API.

**Pattern to follow:** The customer-facing order detail page (`/orders/[id]/page.tsx`) provides a good reference for layout and data flow. The admin version needs additional admin-specific features (status controls, audit log, cancel/refund actions).

**Confidence:** HIGH -- API routes verified in codebase.

### 6. Admin Profile Page (/admin/profile)

| Feature | Why Required | Complexity | Depends On |
|---------|-------------|------------|------------|
| Admin profile view/edit | Admin needs to manage their own name, email, phone | LOW | Supabase auth user data |
| Password/auth management | Change password, manage social logins | LOW | Supabase auth APIs |
| Activity log | Recent admin actions (status changes, refunds) | MEDIUM | audit_log table query |
| Notification preferences | Control what admin notifications they receive | LOW | New DB field or local storage |

**Complexity note:** This is a simple CRUD page. The customer-facing `/account` page (AccountClient component) can be adapted for admin context. Core difference: admin profile may include admin-specific fields and activity log.

**Confidence:** HIGH for basic profile, MEDIUM for activity log (depends on existing audit infrastructure).

### 7. Google OAuth + Apple Sign-In Production Configuration

| Feature | Why Required | Complexity | Depends On |
|---------|-------------|------------|------------|
| Google Cloud Console OAuth setup | Create OAuth 2.0 credentials for production domain | LOW | Google Cloud Console access |
| Google authorized redirect URIs | Add Supabase callback URL for production | LOW | Supabase project URL |
| Apple Developer account setup | Register App ID + Services ID for Sign in with Apple | MEDIUM | Apple Developer Program ($99/yr) |
| Apple client secret generation | Apple requires a new JWT secret every 6 months | LOW (but recurring) | Apple .p8 signing key |
| Supabase Auth provider configuration | Add Google/Apple credentials in Supabase dashboard | LOW | Both provider credentials |
| Production callback URL configuration | Ensure OAuth redirects work on delivery.mandalaymorningstar.com | LOW | Custom domain deployed |

**Critical Apple Sign-In note:** Apple OAuth requires regenerating the client secret every 6 months using the .p8 signing key. Set a calendar reminder. If the secret expires, Apple Sign-In will silently fail.

**Confidence:** HIGH -- verified via Supabase Auth docs for Google and Apple social login.

### 8. Resend Domain Verification (Email Deliverability)

| Feature | Why Required | Complexity | Depends On |
|---------|-------------|------------|------------|
| Add sending domain to Resend | Register mandalaymorningstar.com (or subdomain) in Resend dashboard | LOW | Resend account |
| Add SPF DNS record | Authorize Resend to send on behalf of domain | LOW | Hostinger DNS panel |
| Add DKIM DNS record | Email authentication for deliverability | LOW | Hostinger DNS panel |
| Add DMARC DNS record | Additional trust signal for mailbox providers | LOW | Hostinger DNS panel |
| Verify domain status in Resend | Wait for DNS propagation, confirm "Verified" status | LOW | DNS propagation (up to 72 hours) |
| Test email deliverability | Send test emails, check spam folder placement | LOW | Verified domain |

**Recommended sending domain:** Use a subdomain like `mail.mandalaymorningstar.com` or `updates.mandalaymorningstar.com` to isolate sending reputation from the main domain. This is Resend's recommended practice.

**DNS records to add (3 total):**
1. **SPF** (TXT record): Authorizes Resend IP addresses
2. **DKIM** (CNAME records, usually 2-3): Provides signing keys for email authentication
3. **DMARC** (TXT record, optional but recommended): Policy for failed authentication

Resend auto-generates the exact DNS record values when you add a domain in their dashboard.

**Confidence:** HIGH -- verified via Resend domain documentation.

---

## Differentiators (Elevate Beyond Minimum)

Features that go beyond the baseline and provide a polished production experience.

### 1. CI/CD Pipeline Hardening

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CSS linting in CI | `pnpm lint:css` exists but not in CI pipeline | LOW | Add to lint job |
| Prettier format check in CI | `pnpm format:check` exists but not in CI pipeline | LOW | Add to lint job |
| Dependency audit in CI | Check for known vulnerabilities on every PR | LOW | `pnpm audit --audit-level moderate` |
| Bundle size tracking | Track JS bundle size changes per PR, alert on >10% increases | MEDIUM | `@next/bundle-analyzer` already installed |
| E2E tests in CI | `pnpm test:e2e` exists but not in CI pipeline | HIGH | Requires Playwright in CI (browser install) |
| Sentry release tracking | Tag each deploy with a release version for error tracking | LOW | `SENTRY_RELEASE` env var in Vercel |
| Vercel deployment protection | Require successful CI checks before Vercel deploys | LOW | Vercel dashboard setting |

**Current CI gaps (codebase-verified):**
The GitHub Actions CI pipeline runs: `lint` -> `typecheck` -> `test` -> `build` -> `lighthouse(warn-only)`

Missing from CI:
- `pnpm lint:css` (Stylelint)
- `pnpm format:check` (Prettier)
- E2E tests (Playwright)
- Security audit
- Bundle size tracking

### 2. Performance Monitoring Dashboard

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Web Vitals reporting to Vercel Analytics | `@vercel/analytics` already installed; verify it reports CWV | LOW | May need Vercel Analytics enable |
| Sentry performance monitoring | Transaction tracing for API routes, page loads | LOW | Already configured at 10% sample rate |
| Custom performance alerts | Alert if LCP regresses above threshold in production | MEDIUM | Sentry alerts or Vercel Speed Insights |
| Real User Monitoring (RUM) | Track actual user performance, not just synthetic (Lighthouse) | LOW | `web-vitals` package already installed |

### 3. Production Security Hardening

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Content Security Policy headers | Prevent XSS, restrict script sources | MEDIUM | next.config.ts headers() |
| Rate limiting upgrade | Current in-memory Map won't work across Vercel serverless instances | MEDIUM | Replace with Vercel KV or Upstash Redis |
| Supabase RLS audit | Verify all tables have proper RLS policies before going public | MEDIUM | SQL audit script exists (`rls:test`) |
| API route auth audit | Verify all admin routes use `requireAdmin()` | LOW | Grep + manual review |
| Stripe webhook signature verification | Already implemented; verify in production | LOW | Test with Stripe CLI |

### 4. Database Production Readiness

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Supabase production project | Separate from development project | MEDIUM | Supabase dashboard |
| Database migration strategy | Apply migrations to production safely | LOW | Supabase CLI `db push` |
| Connection pooling | PgBouncer for handling serverless connection patterns | LOW | Supabase has built-in pooler |
| Backup verification | Verify Supabase automatic backups are enabled | LOW | Supabase dashboard |

---

## Anti-Features (Do NOT Build for This Milestone)

| Feature | Why It Seems Needed | Why Problematic | Alternative |
|---------|---------------------|-----------------|-------------|
| Custom monitoring dashboard | "We need to see everything" | Sentry + Vercel Analytics already provide dashboards; building custom is waste | Use Sentry for errors, Vercel for performance |
| Blue-green deployment | "Zero downtime deploys" | Vercel handles this automatically with atomic deployments | Vercel's default deployment strategy is already zero-downtime |
| Kubernetes/Docker containerization | "Production needs containers" | Vercel is serverless; containerization adds complexity with no benefit | Vercel serverless functions |
| Custom CDN configuration | "We need edge caching" | Vercel Edge Network handles this automatically | Vercel's built-in CDN |
| Database read replicas | "Production database needs replicas" | Overkill for a weekly delivery app; Supabase handles scaling | Supabase's built-in scaling |
| Full E2E test suite in CI | "Need complete test coverage" | Playwright in CI is slow (5-10 min), expensive, fragile; defer until test suite is mature | Run critical path E2E only, or run locally before merge |
| WebSocket real-time updates | "Orders should update in real-time" | Supabase Realtime exists but adds complexity; manual refresh works for weekly delivery model | Keep existing refresh button; consider Supabase Realtime post-launch |
| Multi-region deployment | "Need global availability" | Single region (US) is fine for LA-based meal delivery service | Vercel auto-selects closest region |
| Uptime monitoring (Pingdom/Better Uptime) | "Need to know when site is down" | Premature for launch; Vercel has built-in uptime monitoring on Pro plan | Check Vercel status page; add external monitoring post-launch if needed |
| Admin RBAC (role-based access control) | "Different admin permission levels" | Single admin (business owner) for now; RBAC adds complexity | Simple admin boolean check (already implemented via `requireAdmin()`) |

---

## Feature Dependencies

```
Vercel Deployment (FIRST -- everything depends on this)
    requires -> Vercel account
    requires -> GitHub repo linked
    requires -> Environment variables configured
    unlocks -> Custom domain, preview deploys, Sentry in production

Custom Domain (delivery.mandalaymorningstar.com)
    requires -> Vercel deployment (above)
    requires -> Hostinger DNS panel access
    requires -> CNAME record: delivery -> cname.vercel-dns.com
    unlocks -> OAuth redirect URLs, Resend domain verification

Sentry Production Verification
    requires -> Vercel deployment (SENTRY_AUTH_TOKEN in env)
    requires -> Production traffic to generate events
    independent of -> Custom domain (works with Vercel URL)

Lighthouse CI Blocking
    requires -> Baseline performance measurement (after LCP fix)
    requires -> lighthouserc.js threshold adjustments
    requires -> GitHub branch protection rules
    independent of -> Vercel deployment

LCP Optimization
    requires -> Lighthouse audit to identify LCP element
    requires -> Bundle analysis (`pnpm analyze`)
    blocks -> Lighthouse CI blocking thresholds (need good baseline first)
    independent of -> Vercel deployment (can develop locally)

Admin Order Detail Page
    requires -> Existing API routes (ALREADY DONE)
    requires -> Admin layout/components (ALREADY DONE)
    independent of -> Vercel deployment

Admin Profile Page
    requires -> Supabase auth APIs
    independent of -> Other features

Google OAuth Production Config
    requires -> Custom domain deployed (for redirect URLs)
    requires -> Google Cloud Console access
    requires -> Supabase dashboard access

Apple Sign-In Production Config
    requires -> Custom domain deployed (for redirect URLs)
    requires -> Apple Developer Program membership ($99/yr)
    requires -> Supabase dashboard access

Resend Domain Verification
    requires -> Hostinger DNS panel access (for SPF/DKIM/DMARC records)
    independent of -> Vercel deployment (DNS is separate)
    unlocks -> Reliable email delivery in production

CI/CD Hardening
    requires -> GitHub Actions workflow updates
    independent of -> Vercel deployment
```

### Critical Path

```
LCP Fix --> Lighthouse Baseline --> Lighthouse Blocking Thresholds --> CI Gate
Vercel Deploy --> Custom Domain --> OAuth Config + Resend DNS
Admin Pages --> No blockers (pure frontend work)
```

---

## Priority Matrix

### P0: Deploy Blockers (Cannot Launch Without)

| Feature | User Value | Effort | Why P0 |
|---------|-----------|--------|--------|
| Vercel deployment + env vars | CRITICAL | LOW | App is inaccessible without deployment |
| Custom domain CNAME | CRITICAL | LOW | Users need a URL |
| SSL certificate | CRITICAL | FREE | Automatic with Vercel |
| Sentry production verification | HIGH | LOW | Cannot debug production issues without monitoring |
| Resend domain verification | HIGH | LOW | Emails hit spam without SPF/DKIM |
| Admin order detail page | HIGH | MEDIUM | Dashboard links are broken (404) |

### P1: Launch Quality (Should Have Day 1)

| Feature | User Value | Effort | Why P1 |
|---------|-----------|--------|--------|
| LCP optimization | HIGH | HIGH | 8-11s LCP is unacceptable; users will bounce |
| Lighthouse CI blocking mode | MEDIUM | LOW | Prevent performance regressions after fix |
| Google OAuth production config | HIGH | LOW | Social login configured but not operational |
| Apple Sign-In production config | MEDIUM | MEDIUM | Apple Developer Program + recurring secret rotation |
| Admin profile page | MEDIUM | LOW | Admin needs self-management |
| Source map upload to Sentry | MEDIUM | LOW | Readable stack traces in production |

### P2: Hardening (Week 1 Post-Launch)

| Feature | User Value | Effort | Why P2 |
|---------|-----------|--------|--------|
| CI/CD pipeline gaps (lint:css, format:check) | LOW | LOW | Code quality enforcement |
| Rate limiting upgrade (Redis/KV) | MEDIUM | MEDIUM | Current in-memory rate limiter resets per serverless invocation |
| CSP headers | MEDIUM | MEDIUM | Security hardening |
| RLS audit | HIGH | MEDIUM | Security verification before public traffic |
| Performance monitoring dashboard | LOW | LOW | Already partially configured |

### P3: Optimization (Post-Launch)

| Feature | User Value | Effort | Why P3 |
|---------|-----------|--------|--------|
| Bundle size tracking in CI | LOW | MEDIUM | Nice to have for ongoing maintenance |
| E2E tests in CI | MEDIUM | HIGH | Test infrastructure needs maturation first |
| Database production project separation | MEDIUM | MEDIUM | Can launch on single project initially |
| Dependency security audit in CI | LOW | LOW | Automated vulnerability scanning |

---

## Feature Complexity Estimates

| Feature | Frontend | Backend | Ops/Infra | Total |
|---------|----------|---------|-----------|-------|
| Vercel deployment | None | None | 1-2 hours | LOW |
| Custom domain | None | None | 30 min + DNS wait | LOW |
| Sentry verification | None | None | 1 hour | LOW |
| Lighthouse CI blocking | None | None | 30 min config | LOW |
| LCP optimization | 2-4 days | None | None | HIGH |
| Admin order detail page | 1-2 days | None (API exists) | None | MEDIUM |
| Admin profile page | 0.5-1 day | None | None | LOW |
| Google OAuth config | None | None | 1-2 hours ops | LOW |
| Apple Sign-In config | None | None | 2-3 hours ops | MEDIUM |
| Resend domain verification | None | None | 30 min + DNS wait | LOW |
| CI/CD hardening | None | None | 1-2 hours | LOW |
| Rate limit upgrade | None | 0.5-1 day | Redis/KV setup | MEDIUM |
| CSP headers | None | 0.5 day | None | MEDIUM |
| RLS audit | None | 1 day | None | MEDIUM |

---

## Sources

### Vercel Deployment & Custom Domains
- [Vercel: Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) -- HIGH confidence
- [Vercel: Working with Domains](https://vercel.com/docs/domains/working-with-domains) -- HIGH confidence
- [Connect Hostinger Domain to Vercel](https://medium.com/@rajanraj8979/learn-how-to-connect-your-hostinger-domain-to-your-vercel-deployed-project-with-this-easy-966f082919f3) -- MEDIUM confidence
- [Hostinger: Connect Subdomain to Website Builder](https://www.hostinger.com/support/6976680-how-to-connect-a-subdomain-to-hostinger-website-builder/) -- HIGH confidence

### Sentry + Next.js
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/) -- HIGH confidence
- [Sentry React 19 Support](https://sentry.io/changelog/react-19-support/) -- HIGH confidence
- [Sentry Next.js Troubleshooting](https://docs.sentry.io/platforms/javascript/guides/nextjs/troubleshooting/) -- HIGH confidence
- [Sentry JavaScript Releases](https://github.com/getsentry/sentry-javascript/releases) -- HIGH confidence

### Lighthouse CI
- [Lighthouse CI Configuration](https://googlechrome.github.io/lighthouse-ci/docs/configuration.html) -- HIGH confidence
- [Lighthouse CI GitHub](https://github.com/GoogleChrome/lighthouse-ci) -- HIGH confidence
- [Lighthouse CI: Catch Performance Regressions](https://www.trevorlasn.com/blog/lighthouse-ci) -- MEDIUM confidence

### LCP Optimization
- [Next.js SEO: LCP](https://nextjs.org/learn/seo/web-performance/lcp) -- HIGH confidence
- [Core Web Vitals for React + Next.js: Real Fixes](https://rise.co/blog/core-web-vitals-for-react-next.js-sites-real-fixes-that-cut-lcp-by-50percent) -- MEDIUM confidence
- [Next.js Performance Tuning: Practical Fixes](https://www.qed42.com/insights/next-js-performance-tuning-practical-fixes-for-better-lighthouse-scores) -- MEDIUM confidence

### OAuth Production Setup
- [Supabase: Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) -- HIGH confidence
- [Supabase: Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple) -- HIGH confidence
- [Google OAuth Redirect with Vercel + Supabase](https://community.vercel.com/t/google-oauth-redirect-url-with-vercel-preview-urls-supabase/6345) -- MEDIUM confidence

### Resend Domain Verification
- [Resend: Managing Domains](https://resend.com/docs/dashboard/domains/introduction) -- HIGH confidence
- [Resend: Email Authentication Guide](https://resend.com/blog/email-authentication-a-developers-guide) -- HIGH confidence
- [Resend SPF/DKIM/DMARC Setup Guide](https://dmarcdkim.com/setup/how-to-setup-resend-spf-dkim-and-dmarc-records) -- MEDIUM confidence

---

*Feature research for: Production Deployment & Hardening*
*Researched: 2026-02-13*
