# Pitfalls Research: v1.7 Production Deployment & Readiness

**Domain:** Production deployment, monitoring, CI/CD hardening, and performance optimization for existing Next.js 16 + React 19 delivery app
**Researched:** 2026-02-13
**Confidence:** HIGH (codebase audit + official docs + WebSearch verified)

---

## Critical Pitfalls

### Pitfall 1: Service Worker Serves Stale Content After Vercel Deployment

**What goes wrong:**
After deploying a new version to Vercel, users with an active service worker continue seeing the OLD version of the app. The SW's `StaleWhileRevalidate` strategy for scripts/styles serves cached bundles while fetching new ones in the background -- but the user never sees the update because they never "hard reload." In production, users can be stuck on stale code for hours or days. Worst case: stale JS calls API endpoints that changed shape, causing silent data corruption or cryptic errors.

**Why it happens:**
The current `sw.ts` uses `StaleWhileRevalidate` for script/style/font assets (lines 82-96) and `skipWaiting: false` (line 26). This means: (1) old cached JS is served immediately, (2) new SW installs but waits for all tabs to close before activating, (3) users who keep tabs open indefinitely never get the update. Next.js content-hashed filenames help for new chunks, but the HTML shell and RSC payloads may still be stale. The `useServiceWorker` hook only scopes the SW to `/driver` (line 37: `scope: "/driver"`), which means customer routes have NO SW-managed update prompt at all.

**How to avoid:**
- Change SW scope from `/driver` to `/` so all routes get SW update management
- Implement a user-facing "Update available" banner that calls `registration.waiting.postMessage({ type: 'SKIP_WAITING' })` when clicked
- For critical deployments (breaking API changes), use Vercel's `stale-while-revalidate` header on HTML responses, not the SW
- Add version metadata to the build (`NEXT_PUBLIC_APP_VERSION=git-sha`) and compare client version to server version on API responses
- Consider `skipWaiting: true` for initial production launch (simpler, less stale risk) and switch to manual update control later
- Add `/auth/callback` to the SW's navigation exclusion list -- magic links MUST NOT be served from cache

**Warning signs:**
- Users report "I see the old version" after deployment
- SW scope is `/driver` but feature expects whole-app coverage
- No "update available" UI exists
- Auth callback route (`/auth/callback`) not excluded from SW caching
- `precacheEntries` uses `Date.now()` as revision (build-sw.mjs line 42) -- every build invalidates ALL entries, causing unnecessary re-downloads

**Phase to address:** Deployment & SW Configuration phase

**Project context:** Current build-sw.mjs uses `Date.now()` for ALL revision hashes (line 42). This means every deployment invalidates all precached assets, even unchanged ones. Should use content hashes instead for efficient delta updates.

---

### Pitfall 2: Environment Variable Misconfiguration on Vercel

**What goes wrong:**
Deployment appears to succeed but critical features silently fail. Common failures: (1) Stripe webhooks reject all events (wrong `STRIPE_WEBHOOK_SECRET` -- production uses a different secret than local `stripe listen`), (2) OAuth redirects back to localhost (wrong `NEXT_PUBLIC_APP_URL`), (3) Sentry events never arrive (missing `NEXT_PUBLIC_SENTRY_DSN`), (4) Emails send from unverified domain (wrong `RESEND_API_KEY` or domain not verified), (5) Supabase auth redirects to wrong origin.

**Why it happens:**
This project requires 10+ environment variables (counted from `.env.example`), with different values for dev, preview, and production. Vercel environment variables are scoped per environment (Development, Preview, Production) but the UI makes it easy to set a variable for "all" when it should be production-only. The `NEXT_PUBLIC_` prefix distinction is critical but invisible at runtime -- a missing prefix means the variable exists server-side but is `undefined` in client bundles. Vercel requires a REDEPLOYMENT after changing env vars -- editing vars alone does nothing.

**How to avoid:**
- Create a deployment checklist with every env var and its expected value per environment
- Production-only variables that MUST differ from dev:
  | Variable | Dev Value | Production Value |
  |----------|-----------|------------------|
  | `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://delivery.mandalaymorningstar.com` |
  | `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
  | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
  | `STRIPE_WEBHOOK_SECRET` | From `stripe listen` | From Stripe Dashboard webhook endpoint |
  | `RESEND_API_KEY` | Test key | Production key (verified domain) |
  | `SENTRY_AUTH_TOKEN` | Not needed locally | Required for source map upload |
- After setting all env vars, trigger a manual redeploy (do NOT assume the next push will pick them up -- the build may be cached)
- Add a `/api/health` endpoint that validates all required env vars are present (NOT their values, just existence) -- run this after every deployment
- NEVER set `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` with `NEXT_PUBLIC_` prefix

**Warning signs:**
- Stripe dashboard shows webhook failures with signature mismatch errors
- OAuth login redirects to `http://localhost:3000` in production
- Sentry dashboard shows zero events after deployment
- Emails fail silently (Resend API returns success but delivery bounces due to unverified domain)
- `process.env.NEXT_PUBLIC_*` returns `undefined` in client components

**Phase to address:** Vercel Deployment Setup phase (FIRST -- block all other production config until env vars are verified)

---

### Pitfall 3: Supabase Auth Redirect URL Not Configured for Production Domain

**What goes wrong:**
Users click "Sign in with Google" or magic link email, Supabase processes authentication, then redirects to `http://localhost:3000/auth/callback` instead of the production domain. The user sees a broken page or connection refused error. OAuth flow is completely broken in production.

**Why it happens:**
Supabase auth redirect URLs are configured in TWO places and both must be correct:
1. **Supabase Dashboard > Auth > URL Configuration > Site URL** -- this is the default redirect origin
2. **Supabase Dashboard > Auth > URL Configuration > Redirect URLs** -- whitelist of allowed redirect destinations

The current code uses `window.location.origin` for OAuth redirects (SocialLoginButtons.tsx line 25: `redirectTo: \`${window.location.origin}/auth/callback?next=/login\``). This is correct -- it dynamically uses the current origin. BUT Supabase will reject the redirect if the production domain is not in the allowed redirect URLs list.

Additionally, Google OAuth requires the production redirect URI registered in Google Cloud Console, and Apple Sign In requires the domain verified in Apple Developer portal. Three separate provider consoles must be configured.

**How to avoid:**
- **Supabase Dashboard:**
  - Set Site URL to `https://delivery.mandalaymorningstar.com`
  - Add to Redirect URLs: `https://delivery.mandalaymorningstar.com/auth/callback**` (wildcard for query params)
  - Keep `http://localhost:3000/auth/callback**` for local dev
- **Google Cloud Console:**
  - Add Authorized JavaScript origin: `https://delivery.mandalaymorningstar.com`
  - Add Authorized redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback` (Supabase handles the Google callback, NOT your app directly)
  - Publish OAuth consent screen (move from "Testing" to "Production") -- without this, only test users can sign in
- **Apple Developer Portal:**
  - Register domain `delivery.mandalaymorningstar.com` and verify with `.well-known` file
  - Domain must NOT redirect (e.g., if Hostinger auto-redirects to www, Apple verification fails)
  - Configure Service ID with return URL pointing to Supabase callback
- Test the FULL flow end-to-end on a preview deployment before going live

**Warning signs:**
- OAuth works in local dev but fails in production
- Supabase logs show "redirect URL not allowed" errors
- Google OAuth shows "redirect_uri_mismatch" error
- Apple Sign In shows "Verification failed" during domain setup
- Google OAuth consent screen still in "Testing" mode (limits to 100 test users)

**Phase to address:** Social Login Ops Config phase

---

### Pitfall 4: Stripe Webhook Endpoint Fails in Production (Signature Verification + Deployment Protection)

**What goes wrong:**
Stripe sends webhook events to the production endpoint. Every event fails with either: (a) HTTP 405 Method Not Allowed, (b) signature verification failure (`No signatures found matching the expected signature`), or (c) Vercel deployment protection blocks the request entirely. Orders complete in Stripe but the app never knows -- no confirmation emails, no order status updates, no inventory adjustments.

**Why it happens:**
Three distinct failure modes converge:
1. **Wrong webhook secret:** Local development uses `stripe listen --forward-to` which generates a LOCAL secret (`whsec_...`). Production needs the secret from the Stripe Dashboard webhook endpoint. Using the wrong one = every signature check fails.
2. **Request body parsing:** Stripe signature verification requires the RAW request body. If middleware or the route handler parses JSON first (`await request.json()`), the raw body is consumed and signature verification fails. Must use `await request.text()`.
3. **Vercel Deployment Protection:** If enabled (common for preview deployments), Vercel adds an auth layer that blocks external POST requests. Stripe's webhook requests get a 401/403 before reaching your handler.

**How to avoid:**
- Create a SEPARATE webhook endpoint in Stripe Dashboard for production (do not reuse the local CLI endpoint)
- Copy the production endpoint's signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel Production environment
- Verify the webhook route uses `request.text()` for raw body, NOT `request.json()`:
  ```typescript
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  ```
- Disable Vercel Deployment Protection for production, OR add the webhook path to the bypass list
- Configure Stripe webhook to send events for: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.*`
- Test with `stripe trigger checkout.session.completed` against the production URL before going live

**Warning signs:**
- Stripe Dashboard > Webhooks shows red failure indicators
- Error: "No signatures found matching the expected signature for payload"
- HTTP 405 on webhook endpoint (handler doesn't export POST)
- Webhook events succeed locally with `stripe listen` but fail in production

**Phase to address:** Stripe Production Config phase

**Project context:** Existing webhook handling already has idempotency via UNIQUE constraint (documented in v1.6 key decisions). The signature verification and endpoint URL are the production-specific risks.

---

### Pitfall 5: Lighthouse CI Transition from Warn to Error Blocks ALL PRs

**What goes wrong:**
Changing Lighthouse CI assertions from `"warn"` to `"error"` immediately blocks every PR from merging. Current Lighthouse scores are 30-45 for performance (lighthouserc.js sets `minScore: 0.9`). The gap between current performance (30-45) and the assertion threshold (90) is enormous. Every PR fails CI regardless of its content.

**Why it happens:**
The existing `lighthouserc.js` has ambitious thresholds that were set as aspirational targets, not blocking gates:
- `categories:performance`: `minScore: 0.9` (current: 0.30-0.45)
- `largest-contentful-paint`: `maxNumericValue: 2500` (current: 8000-11000ms)
- `total-blocking-time`: `maxNumericValue: 200` (current: 5000-15000ms)

Switching `"warn"` to `"error"` with these thresholds means NOTHING can merge until LCP drops from 10s to 2.5s -- a multi-week optimization effort, not a config change.

**How to avoid:**
- NEVER change warn to error until thresholds match current baseline
- Implement a TWO-PHASE approach:
  1. **Phase A (immediate):** Set error thresholds at current baseline + 10% margin:
     ```js
     "categories:performance": ["error", { minScore: 0.25 }],  // Current: 30-45
     "largest-contentful-paint": ["error", { maxNumericValue: 12000 }],  // Current: 8-11s
     ```
     This prevents REGRESSIONS without blocking current work
  2. **Phase B (after LCP optimization):** Tighten thresholds progressively as performance improves
- Keep warn-level assertions at the ASPIRATIONAL targets so developers see the gap
- Run Lighthouse locally before changing CI thresholds to verify what will pass

**Warning signs:**
- Changing `"warn"` to `"error"` in lighthouserc.js without updating threshold values
- CI pipeline has been green (because everything was warn-only) and suddenly turns permanently red
- Team stops running Lighthouse because "it always fails anyway"
- Threshold values don't match measured baseline

**Phase to address:** CI/CD Hardening phase (AFTER LCP optimization, not before)

---

### Pitfall 6: Custom Domain DNS Misconfiguration (Hostinger + Vercel Split)

**What goes wrong:**
The main site (mandalaymorningstar.com) is on Hostinger Website Builder. The delivery app (delivery.mandalaymorningstar.com) needs to point to Vercel. Misconfiguring DNS causes: (a) the main site goes down when adding the subdomain, (b) the subdomain resolves to Hostinger instead of Vercel, (c) SSL certificate provisioning fails, (d) DNS propagation takes 24-48 hours and there's no way to test until it resolves.

**Why it happens:**
Hostinger manages the root domain's DNS. Adding a CNAME for `delivery` that points to `cname.vercel-dns.com` is straightforward in theory, but common mistakes include:
1. Entering the full domain (`delivery.mandalaymorningstar.com`) as the CNAME Name instead of just `delivery`
2. Forgetting the trailing period on the CNAME value (`cname.vercel-dns.com.`)
3. A conflicting A record for `delivery` that takes precedence over the CNAME
4. Hostinger's DNS panel has different UX than standard DNS managers -- the "Type" and "Name" fields may be unlabeled or positioned differently
5. Vercel domain verification fails because DNS hasn't propagated yet, and the developer panics and changes settings

**How to avoid:**
- Add the domain in Vercel FIRST (Project Settings > Domains > Add `delivery.mandalaymorningstar.com`)
- Vercel shows the exact DNS records needed -- copy them exactly
- In Hostinger DNS settings, add ONLY a CNAME record: Name=`delivery`, Value=`cname.vercel-dns.com`
- Do NOT change nameservers -- Hostinger's nameservers must stay for the main site
- Do NOT add an A record for the subdomain (CNAME handles it)
- Wait up to 48 hours for DNS propagation. Use `dig delivery.mandalaymorningstar.com CNAME` or dnschecker.org to verify
- Vercel will auto-provision SSL via Let's Encrypt once DNS resolves
- Test with a preview deployment first (`delivery-staging.mandalaymorningstar.com`) before the production subdomain

**Warning signs:**
- Main site (mandalaymorningstar.com) becomes unreachable after DNS changes
- Vercel shows "Invalid Configuration" for the domain
- `nslookup delivery.mandalaymorningstar.com` returns Hostinger IP instead of Vercel
- SSL certificate shows "Pending" in Vercel for more than 48 hours
- HTTPS works but the app shows Hostinger's default page instead of the Next.js app

**Phase to address:** DNS & Domain Setup phase (do early -- DNS propagation is a blocking dependency)

---

### Pitfall 7: Sentry Source Maps Not Uploading or Tunnel Route Conflicts

**What goes wrong:**
Sentry is configured in `next.config.ts` with `tunnelRoute: "/monitoring"` and `widenClientFileUpload: true`, but in production: (1) source maps don't upload because `SENTRY_AUTH_TOKEN` is missing or incorrect, (2) error stack traces show minified code (`at e.default (chunk-abc123.js:1:2345)`), or (3) the tunnel route `/monitoring` conflicts with an actual page route or API route. Client errors never reach Sentry because ad-blockers block the tunnel.

**Why it happens:**
Source map upload happens during `next build`, not at runtime. If `SENTRY_AUTH_TOKEN` is not available during the build step (common in CI where env vars may not be passed to the build command), source maps are silently not uploaded. The `silent: !process.env.CI` config (line 164) means build-time upload errors are hidden in local builds.

The tunnel route works by proxying Sentry requests through your Next.js server, bypassing ad-blockers. But if a future route or page is created at `/monitoring`, it will conflict. Additionally, if middleware is added later that intercepts `/monitoring` requests, Sentry tunnel breaks silently.

Missing `sentry.client.config.ts` file means the browser SDK is not initialized -- only server and edge errors are captured.

**How to avoid:**
- Ensure `SENTRY_AUTH_TOKEN` is set in Vercel's environment variables AND is available during the build step (not just runtime)
- Verify source maps uploaded successfully: Sentry Dashboard > Settings > Source Maps > check release artifacts
- Create `sentry.client.config.ts` at project root (currently missing) to capture browser errors:
  ```typescript
  import * as Sentry from "@sentry/nextjs";
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  ```
- Add `instrumentation.ts` at project root for server-side initialization (Next.js 16 pattern)
- Reserve the `/monitoring` path -- add an ESLint/CI check that prevents creating files at `src/app/monitoring/`
- If middleware is added in the future, exclude `/monitoring` from the middleware matcher:
  ```typescript
  export const config = { matcher: ["/((?!monitoring|_next).*)"] };
  ```
- Set `silent: false` in CI to surface source map upload errors

**Warning signs:**
- Sentry shows errors with minified stack traces
- Sentry Dashboard > Source Maps shows no artifacts for the latest release
- No `sentry.client.config.ts` file exists (currently the case in this project)
- Build logs show no Sentry upload activity
- Client-side errors (onClick handlers, API fetch failures) not appearing in Sentry

**Phase to address:** Sentry Monitoring Setup phase

**Project context:** `sentry.server.config.ts` and `sentry.edge.config.ts` exist but `sentry.client.config.ts` is MISSING. This means browser errors are NOT captured. The `@sentry/nextjs` v10.34.0 package is installed but client-side initialization is incomplete.

---

### Pitfall 8: LCP Optimization Stalls Because Root Cause is JS Bundle Size, Not Images

**What goes wrong:**
Team optimizes images, adds preload hints, enables compression, converts to Server Components -- and LCP barely moves. LCP stays at 8-11s because the bottleneck is JavaScript execution time (TBT: 5-15s), not resource loading. The LCP element renders quickly in HTML but is blocked by hydration of 282 client components.

**Why it happens:**
This project already completed extensive image optimization in v1.5 (LCP went from 19.9s to 10.9s). The remaining bottleneck is documented in PERFORMANCE.md: "Key bottlenecks identified: JS execution time, network latency, DOM size." Further image optimization has diminishing returns. The real issue:
- 282 client components need hydration before the page is interactive
- React Compiler adds Babel overhead to build but doesn't reduce runtime bundle size
- Framer Motion `domMax` features loader (~34KB) blocks initial render
- GSAP + ScrollTrigger add ~45KB that loads on every page
- The entire Zustand store tree hydrates on every page load

**How to avoid:**
- Profile with Chrome DevTools Performance tab, not just Lighthouse scores. Identify which scripts are executing during LCP
- Focus on reducing Total Blocking Time (TBT) first -- this is what keeps LCP high
- Specific high-impact optimizations for THIS project:
  1. **Route-level code splitting:** Ensure admin/driver/customer code never loads on each other's routes
  2. **Deferred hydration for below-fold components:** Use `Suspense` with lazy imports for anything not visible in the viewport
  3. **Move GSAP to dynamic import:** Only pages with scroll animations need GSAP. Currently imported globally
  4. **Partial Prerendering (PPR):** Next.js 16 supports PPR -- static shell renders instantly, dynamic parts stream in. This is the biggest single win for LCP
  5. **Edge runtime for API routes:** Moves server processing closer to users, reducing TTFB
- Do NOT chase Lighthouse 90+ on mobile with 4x CPU throttling -- set realistic targets (70+ is excellent for animation-heavy apps)
- Track Real User Metrics (RUM) via Vercel Analytics + web-vitals, not just synthetic Lighthouse

**Warning signs:**
- LCP optimization PRs focus on image optimization when images are already optimized
- Lighthouse Performance score doesn't improve despite individual metric improvements (TBT dominates the score)
- Team targets Lighthouse 90 on mobile for an animation-heavy app (unrealistic)
- No Chrome DevTools profiling done -- only Lighthouse runs

**Phase to address:** LCP Optimization phase (dedicated phase, not bundled with other work)

**Project context:** Vercel Analytics (`@vercel/analytics` v1.6.1) is already a dependency. web-vitals v5.1.0 is already installed. RUM infrastructure exists but may not be configured for production reporting.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `Date.now()` as precache revision in build-sw.mjs | Simple, always busts cache | Every deployment re-downloads ALL precached assets (~200 entries). Wastes bandwidth, slows first load after deploy | Never in production -- use content hashes |
| Skip health check endpoint | One less route to build | No automated way to verify deployment succeeded. Silent failures discovered by users | Never -- add `/api/health` before first production deploy |
| Using warn-only Lighthouse with aspirational thresholds | CI never fails | Developers ignore Lighthouse because it always warns. No regression prevention | Only acceptable during active LCP optimization work |
| Hard-coding `mandalaymorningstar.com` as email fallback URL | Emails work without env var | Wrong URL in staging/preview emails. Hard to test email flows in non-production | Acceptable if staging always uses production email domain |
| Keeping SW scope as `/driver` only | Simpler SW management | Customers get no offline support, no update prompts, no caching benefits | Only if offline features are driver-exclusive |
| Not creating `sentry.client.config.ts` | Fewer files, faster build | Zero browser error visibility in production. Only server errors captured | Never -- this must exist for production |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vercel + Hostinger DNS | Changing nameservers instead of adding CNAME | Add CNAME record `delivery` -> `cname.vercel-dns.com` in Hostinger. Keep Hostinger nameservers |
| Stripe test vs live keys | Using `sk_test_` in production env vars | Create separate Stripe webhook endpoint for production URL. Use `sk_live_` keys. Verify with Stripe Dashboard > Developers > Webhooks |
| Supabase auth redirects | Only configuring Site URL, forgetting Redirect URLs | Configure BOTH Site URL AND add production callback URL to Redirect URLs whitelist in Supabase Dashboard |
| Google OAuth consent screen | Leaving OAuth in "Testing" mode | Publish to "Production" in Google Cloud Console. Testing mode limits to 100 manually-added test users |
| Apple Sign In domain verification | Including `https://` prefix in domain field | Enter bare domain `delivery.mandalaymorningstar.com` without protocol prefix. Serve verification file without redirects |
| Resend domain verification | Verifying `mandalaymorningstar.com` but sending from `mail.mandalaymorningstar.com` | Verify the exact subdomain used as sender. DKIM domain alignment requires match between From header and verified domain |
| Sentry source maps + Vercel | `SENTRY_AUTH_TOKEN` set as runtime-only env var | Token must be available at BUILD TIME. In Vercel, env vars are available during build by default, but verify the build logs show upload activity |
| Vercel Deployment Protection + webhooks | Deployment Protection blocks Stripe/Resend webhook POST requests | Either disable Deployment Protection for production, or add webhook paths to the bypass allowlist |
| Service worker + Sentry tunnel | SW caches `/monitoring` POST requests | Add `/monitoring` to SW's navigation preload exclusion. SW should NEVER cache POST requests to the tunnel route |
| React Compiler + Sentry `ErrorBoundary` | Sentry's `ErrorBoundary` wraps components; React Compiler may optimize away the boundary | Use `@sentry/nextjs`'s built-in error boundary integration (withSentryConfig handles this). Don't manually wrap with Sentry's `ErrorBoundary` component |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Enabling PPR without testing dynamic components | Static shell renders with holes where dynamic content should be; content never streams in | Test each route's PPR behavior individually. Some patterns (useSearchParams in layout) force full dynamic rendering | First deployment with PPR enabled |
| Sentry Performance monitoring at 100% sample rate | Every request traced. Sentry bill spikes. App latency increases from tracing overhead | Use `tracesSampleRate: 0.1` in production (10%). Current server config already does this -- verify client config matches | >100 concurrent users |
| Vercel Analytics + web-vitals + Sentry Performance all active | Triple-reporting of the same metrics. Three SDKs competing for `PerformanceObserver` slots | Choose ONE for performance metrics. Use Vercel Analytics for Web Vitals, Sentry for error context only | Any production traffic |
| SW precaching all public assets | SW precaches 200+ entries on first visit. User downloads megabytes of assets they may never need | Precache only critical path: app shell, key pages (/menu, /cart). Use runtime caching for the rest | First visit on slow mobile connection |
| Running Lighthouse CI on all routes in CI | Build time increases by 10+ minutes (3 runs x 4 URLs x 30s each). CI pipeline becomes bottleneck | Lighthouse CI on 2 routes max in CI. Full suite runs nightly, not per-PR | >5 routes in Lighthouse config |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `SUPABASE_SERVICE_ROLE_KEY` set as `NEXT_PUBLIC_` | Service role key exposed in client bundle. Attacker has full DB access bypassing RLS | Audit all env vars. Service role key must NEVER have `NEXT_PUBLIC_` prefix. Add CI check that greps for exposed secrets |
| Stripe live keys committed to `.env` | Live API keys in git history. Anyone with repo access can charge customers | `.env` is gitignored (verify). `.env.example` has placeholder values only (verified -- current file is correct). Use Vercel env vars for production |
| OAuth redirect URI allows wildcard | Attacker crafts URL that redirects auth token to malicious site | Supabase Redirect URLs should list specific URLs, not `*`. Vercel preview URLs use unique hashes that change -- consider separate OAuth config for previews |
| Sentry DSN exposed via `NEXT_PUBLIC_` | Sentry DSN is public by design (events are filtered server-side), but an attacker could spam fake errors | Rate-limit Sentry ingestion. Use `beforeSend` to validate error format. Set up Sentry inbound filters for known spam patterns |
| `/api/health` endpoint exposes env var names | Health check reveals infrastructure details | Health endpoint should return only `{ status: "ok" }` or `{ status: "error", missing: ["STRIPE"] }` -- variable CATEGORY, not name/value |
| SW precaches API routes with auth tokens | Cached API responses contain auth-scoped data. Shared device = data leak | NEVER precache API routes that return user-specific data. Only cache public endpoints (menu, static assets) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Service worker update with no user notification | User on stale version, features broken, no way to know why | Show non-intrusive "New version available - tap to update" banner |
| Deploy during peak hours | Users experience errors during deployment rollover | Deploy during low-traffic hours. Vercel atomic deployments help, but DNS/CDN caching can still cause issues |
| OAuth consent screen missing app icon/name | Google sign-in shows "Sign in to unnamed app" -- users don't trust it | Configure OAuth consent screen with app name, icon, privacy policy URL, and support email before going live |
| Magic link email lands in spam | User can't log in. Support tickets spike | Verify Resend domain with SPF/DKIM/DMARC. Set up proper From name ("Morning Star Delivery <noreply@mail.mandalaymorningstar.com>") |
| SSL certificate pending during launch | Users see browser security warning. Immediate trust loss | Configure DNS 48+ hours before planned launch date. Verify SSL is active before announcing production URL |
| Error monitoring floods team with noise | Team ignores Sentry alerts. Critical errors buried in noise | Configure Sentry ignoreErrors (already partially done). Set up alert rules for new/regression errors only, not all errors |

## "Looks Done But Isn't" Checklist

- [ ] **Vercel deployment:** Env vars set for Production scope (not just Preview). Redeploy triggered after setting vars. Health endpoint returns OK
- [ ] **DNS:** `delivery.mandalaymorningstar.com` resolves to Vercel IP (not Hostinger). SSL certificate active (not pending). Main site still works
- [ ] **Stripe webhooks:** Production endpoint created in Stripe Dashboard. Production signing secret set in Vercel. Send test event from Stripe Dashboard -- verify it succeeds (not just local `stripe listen`)
- [ ] **Google OAuth:** Consent screen published to Production. Redirect URI matches Supabase callback URL. Test sign-in on production domain (not localhost)
- [ ] **Apple Sign In:** Domain verified. Service ID configured. Return URL set. Test on Safari (Apple requires it)
- [ ] **Resend emails:** Domain verified with SPF + DKIM records. Send test email. Check it arrives in inbox (not spam). DMARC record added
- [ ] **Sentry:** `sentry.client.config.ts` exists. Source maps visible in Sentry Dashboard. Trigger a test error -- verify it appears with readable stack trace. Tunnel route `/monitoring` responds
- [ ] **Lighthouse CI:** Thresholds match current baseline (not aspirational). One PR passes CI with error-level assertions. One PR with intentional regression fails CI
- [ ] **Service worker:** SW scope covers intended routes. Update prompt works (deploy, visit site, verify banner appears). Auth callback route NOT cached. `/monitoring` NOT cached
- [ ] **Social login full flow:** Google sign-in works end-to-end on production domain. Apple sign-in works on Safari. Magic link email arrives and clicking it logs user in
- [ ] **Stripe full flow:** Create a test purchase with live keys (use $0.50 test product). Verify webhook fires. Verify confirmation email sends. Verify order appears in admin dashboard

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale SW serving old content | MEDIUM | Push emergency SW update with `skipWaiting: true`. Add cache-busting query param to critical routes. Communicate to users: "hard refresh to update" |
| Wrong env vars in production | LOW | Fix in Vercel dashboard. Trigger redeploy. Verify with health endpoint. Total time: 5-10 minutes |
| Supabase auth redirect misconfigured | LOW | Add correct URL in Supabase Dashboard. Takes effect immediately (no deploy needed). Test and confirm |
| Stripe webhooks failing | MEDIUM | Fix endpoint/secret. Manually replay failed events from Stripe Dashboard (Events > filter by failed > resend). Verify idempotency prevents duplicates |
| Lighthouse CI blocking all PRs | LOW | Revert threshold change. Set to current baseline. Take 5 minutes to fix |
| DNS misconfigured, main site down | HIGH | Revert DNS changes in Hostinger immediately. DNS propagation may take hours. Have Hostinger support contact ready. Keep original DNS records documented before making changes |
| Source maps not uploaded | LOW | Set `SENTRY_AUTH_TOKEN` correctly. Trigger redeploy. New deploy uploads maps. Old errors stay minified (no fix for already-reported errors) |
| Client errors not captured by Sentry | MEDIUM | Create `sentry.client.config.ts`. Redeploy. Errors from before the fix are permanently lost |
| LCP optimization creates regressions | MEDIUM | Revert specific optimization PR. Run Lighthouse before/after to verify. Apply optimization more carefully with per-route testing |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Service worker stale content | SW Configuration | Deploy new version. Visit site in browser with existing SW. Verify "update available" banner appears within 60s |
| Environment variable misconfiguration | Vercel Deployment Setup (FIRST) | `/api/health` returns 200 with all services OK. Each integration tested individually |
| Supabase auth redirect | Social Login Ops Config | Sign in with Google on production domain. Callback redirects correctly. Session established |
| Stripe webhook failures | Stripe Production Config | Send test event from Stripe Dashboard. Webhook succeeds. Confirmation email fires |
| Lighthouse CI blocking PRs | CI/CD Hardening (AFTER LCP work) | Submit PR with no perf changes -- CI passes. Submit PR with intentional large bundle addition -- CI fails |
| DNS misconfiguration | DNS Setup (EARLY, before other config) | `dig` shows CNAME to Vercel. HTTPS works. Main site unaffected |
| Sentry source maps missing | Sentry Setup | Trigger error in production. Sentry shows readable stack trace with file names and line numbers |
| LCP optimization stalls | LCP Optimization (dedicated phase) | Chrome DevTools profile shows reduced TBT. Lighthouse LCP drops measurably (even if not to target) |
| Missing sentry.client.config.ts | Sentry Setup | Click a button that intentionally throws. Error appears in Sentry within 30s with component stack |
| Resend domain unverified | Email Production Config | Send transactional email from production. Check email headers: DKIM=pass, SPF=pass. Not in spam |
| Apple Sign In domain verification | Social Login Ops Config | Apple sign-in button works on production Safari. Full flow completes without errors |
| Google OAuth consent screen in Testing | Social Login Ops Config | Non-test-user can sign in with Google on production. No "unverified app" warning screen |

## Sources

### Vercel Deployment & DNS (HIGH confidence)
- [Vercel: Adding & Configuring Custom Domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Vercel: Troubleshooting Domains](https://vercel.com/docs/domains/troubleshooting)
- [Vercel: Methods to Bypass Deployment Protection](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection)
- [Vercel: Environment Variables](https://vercel.com/docs/environment-variables)
- [Hostinger to Vercel Connection Guide](https://medium.com/@rajanraj8979/learn-how-to-connect-your-hostinger-domain-to-your-vercel-deployed-project-with-this-easy-966f082919f3)
- [Complete Guide to Deploying Next.js on Vercel](https://eastondev.com/blog/en/posts/dev/20251220-nextjs-vercel-deploy-guide/)

### Sentry + Next.js (HIGH confidence)
- [Sentry: Next.js Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry: Source Maps for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)
- [Sentry: Troubleshooting Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/troubleshooting/)
- [Sentry: Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Sentry Tunnel Route Discussion (GitHub #9205)](https://github.com/getsentry/sentry-javascript/discussions/9205)
- [Sentry React 19 Support Changelog](https://sentry.io/changelog/react-19-support/)

### Stripe Webhooks (HIGH confidence)
- [Stripe: Set Up and Deploy a Webhook](https://docs.stripe.com/webhooks/quickstart)
- [Stripe Webhook 405 Error on Vercel](https://community.vercel.com/t/stripe-webhook-405-error/27898)
- [Stripe Webhook Issue in Next.js (GitHub Discussion #48885)](https://github.com/vercel/next.js/discussions/48885)
- [Configure Stripe for Production with Vercel (egghead.io)](https://egghead.io/lessons/supabase-configure-stripe-for-production-and-deploy-next-js-application-with-vercel)

### OAuth & Social Login (HIGH confidence)
- [Google OAuth Redirect URL with Vercel Preview URLs](https://community.vercel.com/t/google-oauth-redirect-url-with-vercel-preview-urls-supabase/6345)
- [Apple: Configure Sign in with Apple for the Web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web)
- [Apple: Configuring Your Environment for Sign in with Apple](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple)
- [Apple Developer Forums: Domain Verification](https://developer.apple.com/forums/thread/119616)

### Resend Domain Verification (HIGH confidence)
- [Resend: DMARC Implementation](https://resend.com/docs/dashboard/domains/dmarc)
- [Resend: Email Authentication Developer Guide](https://resend.com/blog/email-authentication-a-developers-guide)
- [SPF/DKIM/DMARC Common Setup Mistakes](https://www.infraforge.ai/blog/spf-dkim-dmarc-common-setup-mistakes)
- [DmarcDkim: Resend SPF/DKIM/DMARC Setup Guide](https://dmarcdkim.com/setup/how-to-setup-resend-spf-dkim-and-dmarc-records)

### Service Worker & PWA (MEDIUM confidence)
- [PWA Cache Behavior Issues (Infinity Interactive)](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)
- [Service Worker Lifecycle: Update & Version Control](https://www.zeepalm.com/blog/service-worker-lifecycle-explained-update-version-control)
- [Build a Next.js 16 PWA with Offline Support (LogRocket)](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started)

### Lighthouse CI (HIGH confidence)
- [Lighthouse CI: Catch Performance Regressions](https://www.trevorlasn.com/blog/lighthouse-ci)
- [Performance Budget for Next.js](https://medium.com/@mtorre4580/performance-budget-for-next-js-e34eb4fda11e)
- [Next.js Performance Tuning (QED42)](https://www.qed42.com/insights/next-js-performance-tuning-practical-fixes-for-better-lighthouse-scores)

### LCP Optimization (MEDIUM confidence)
- [Stop the Wait: Smashing LCP in Next.js](https://medium.com/@iamsandeshjain/stop-the-wait-a-developers-guide-to-smashing-lcp-in-next-js-634e2963f4c7)
- [Optimizing Next.js Performance: LCP, Render Delay & Hydration](https://www.iamtk.co/optimizing-nextjs-performance-lcp-render-delay-hydration)
- [Lighthouse 100 with Next.js: Missing Performance Checklist](https://medium.com/better-dev-nextjs-react/lighthouse-100-with-next-js-the-missing-performance-checklist-e87ee487775f)

### Project-Specific (HIGH confidence)
- Project `next.config.ts` -- Sentry tunnel route, image config, React Compiler enabled
- Project `sentry.server.config.ts` + `sentry.edge.config.ts` -- existing server/edge Sentry config
- Project `sw.ts` -- service worker caching strategies, `skipWaiting: false`
- Project `useServiceWorker.ts` -- SW scope limited to `/driver`
- Project `build-sw.mjs` -- `Date.now()` revision strategy
- Project `lighthouserc.js` -- current thresholds and warn-only assertions
- Project `.env.example` -- full env var inventory
- Project `SocialLoginButtons.tsx` -- OAuth redirect URL construction
- Project `auth/callback/route.ts` -- auth callback handler
- Project `PERFORMANCE.md` -- LCP baseline data and bottleneck analysis
- Project `ci.yml` -- current CI pipeline structure

---
*Pitfalls research for: v1.7 Production Deployment & Readiness*
*Researched: 2026-02-13*
