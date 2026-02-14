# Phase 62: Production Operations - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Social login, transactional email, payment webhooks, and search indexing work on the production domain. DNS and OAuth are already configured and live — this phase focuses on code changes, verification, and health endpoint extensions.

</domain>

<decisions>
## Implementation Decisions

### OAuth Rollout
- Google OAuth only — Apple Sign-in deferred (no Apple Developer account ready)
- Consent screen published immediately with placeholder branding (no privacy policy yet — users see "unverified app" warning until Phase 63)
- Consent screen name: "Mandalay Morning Star Delivery (Los Angeles)"
- Support email: admin@mandalaymorningstar.com
- Basic scopes only: email + openid + profile
- Existing GCP project with OAuth credentials — just needs production redirect URI added
- Supabase Site URL already set to production domain
- Additional Redirect URLs include localhost for continued local dev
- OAuth works on production domain only — preview deployments use email/password
- No branding yet on consent screen — Phase 63 adds privacy policy, terms, logo
- Auth error fallback: redirect to email/password login with toast message
- Verification: manual test with personal Google account

### Email Domain & Deliverability
- Sending domain: mandalaymorningstar.com (root domain, not subdomain)
- From address: admin@mandalaymorningstar.com
- Sender name: "Mandalay Morning Star Burmese Kitchen (Los Angeles)"
- Reply-To: same as From (admin@mandalaymorningstar.com)
- DNS records (SPF/DKIM/DMARC) already configured and working at Hostinger
- Existing Google Workspace on domain — SPF record must include both `_spf.google.com` and `_spf.resend.com`
- Resend account and API key already exist
- RESEND_API_KEY already in Vercel production env vars
- EMAIL_FROM env var — need to verify/update value in Vercel to `admin@mandalaymorningstar.com`
- admin@ inbox actively monitored via Google Workspace

### Stripe Webhook
- Webhook endpoint already configured in Stripe dashboard pointing to production URL
- STRIPE_WEBHOOK_SECRET already in Vercel production env vars
- All Stripe env vars (secret key, publishable key, webhook secret) set in Vercel
- Staying in sandbox mode — NOT switching to live mode in this phase
- Same Stripe account for live mode later — just key swap when ready
- Same webhook URL when switching to live — only signing secret changes
- Verify webhook endpoint is reachable and signature validates (smoke test from Stripe dashboard)
- Webhook errors reported to both Sentry AND Vercel logs
- Sentry error capturing already exists in webhook handler
- Check webhook handler for idempotency handling during planning
- Check which webhook events are subscribed during planning

### Search Console & SEO
- Google Search Console verification via HTML meta tag (Next.js metadata API)
- Verification code not yet obtained — will get during execution
- Sitemap.xml: add or verify (Next.js auto-generation)
- robots.txt: add to exclude auth-gated routes (/admin, /driver, /api)

### Health Endpoint Extensions
- Extend existing /api/health to check new services:
  - Resend domain verification status
  - Google OAuth config validation (env vars present, redirect URL configured)
  - Stripe webhook signing secret configured
  - Search Console meta tag presence

### Claude's Discretion
- DMARC policy level (recommend p=none for monitoring initially)
- Email deliverability verification method (test email vs testing service)
- Bounce notification handling (Resend dashboard vs webhook)
- Resend delivery webhook for email status tracking (based on existing email history feature)
- OAuth error toast message wording (generic vs technical hint)
- Setup documentation (code changes vs step-by-step guide)
- Sitemap pages (public-only vs all routes)
- robots.txt rules

</decisions>

<specifics>
## Specific Ideas

- Google Workspace coexists on mandalaymorningstar.com — SPF must be merged: `v=spf1 include:_spf.google.com include:_spf.resend.com ~all`
- Auth error should redirect to email/password login, not show a dead-end error page
- Health endpoint should give a comprehensive view of all production service health
- Stripe stays sandbox until explicit live-mode cutover (separate future task)

</specifics>

<deferred>
## Deferred Ideas

- Apple Sign-in — needs Apple Developer account setup (separate phase or backlog)
- Stripe live mode switch — future task when ready for real payments
- OAuth on Vercel preview deployments — not needed for production launch

</deferred>

---

*Phase: 62-production-operations*
*Context gathered: 2026-02-14*
