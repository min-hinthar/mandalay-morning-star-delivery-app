# Phase 62: Production Operations - Research

**Researched:** 2026-02-14
**Domain:** Production service configuration (OAuth, email deliverability, payment webhooks, SEO)
**Confidence:** HIGH

## Summary

This phase connects production services that already have code and infrastructure largely in place. The codebase already has Google OAuth sign-in (`SocialLoginButtons.tsx`), Resend email sending (`src/lib/email/`), Stripe webhook handling (`src/app/api/webhooks/stripe/route.ts`), Resend delivery webhooks (`src/app/api/webhooks/resend/route.ts`), and a two-tier health check system (`src/lib/health/`). DNS records for email (SPF/DKIM/DMARC) are reportedly already configured at Hostinger.

The main work is: (1) adding the production redirect URI to Supabase Google OAuth config, (2) updating the `EMAIL_FROM` sender name constant, (3) verifying Stripe webhook reachability from the Stripe dashboard, (4) creating `sitemap.ts` and `robots.ts` files, (5) adding Google Search Console verification metadata, and (6) extending the health endpoint with new checks. No new libraries needed.

**Primary recommendation:** This is a configuration-and-verification phase, not a build phase. Most tasks involve external dashboard configuration + code verification, not new feature code.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Google OAuth only -- Apple Sign-in deferred (no Apple Developer account ready)
- Consent screen published immediately with placeholder branding (no privacy policy yet -- users see "unverified app" warning until Phase 63)
- Consent screen name: "Mandalay Morning Star Delivery (Los Angeles)"
- Support email: admin@mandalaymorningstar.com
- Basic scopes only: email + openid + profile
- Existing GCP project with OAuth credentials -- just needs production redirect URI added
- Supabase Site URL already set to production domain
- Additional Redirect URLs include localhost for continued local dev
- OAuth works on production domain only -- preview deployments use email/password
- No branding yet on consent screen -- Phase 63 adds privacy policy, terms, logo
- Auth error fallback: redirect to email/password login with toast message
- Verification: manual test with personal Google account
- Sending domain: mandalaymorningstar.com (root domain, not subdomain)
- From address: admin@mandalaymorningstar.com
- Sender name: "Mandalay Morning Star Burmese Kitchen (Los Angeles)"
- Reply-To: same as From (admin@mandalaymorningstar.com)
- DNS records (SPF/DKIM/DMARC) already configured and working at Hostinger
- Existing Google Workspace on domain -- SPF record must include both `_spf.google.com` and `_spf.resend.com`
- Resend account and API key already exist
- RESEND_API_KEY already in Vercel production env vars
- EMAIL_FROM env var -- need to verify/update value in Vercel to `admin@mandalaymorningstar.com`
- admin@ inbox actively monitored via Google Workspace
- Webhook endpoint already configured in Stripe dashboard pointing to production URL
- STRIPE_WEBHOOK_SECRET already in Vercel production env vars
- All Stripe env vars (secret key, publishable key, webhook secret) set in Vercel
- Staying in sandbox mode -- NOT switching to live mode in this phase
- Same Stripe account for live mode later -- just key swap when ready
- Same webhook URL when switching to live -- only signing secret changes
- Verify webhook endpoint is reachable and signature validates (smoke test from Stripe dashboard)
- Webhook errors reported to both Sentry AND Vercel logs
- Sentry error capturing already exists in webhook handler
- Google Search Console verification via HTML meta tag (Next.js metadata API)
- Verification code not yet obtained -- will get during execution
- Sitemap.xml: add or verify (Next.js auto-generation)
- robots.txt: add to exclude auth-gated routes (/admin, /driver, /api)
- Extend existing /api/health to check new services

### Claude's Discretion
- DMARC policy level (recommend p=none for monitoring initially)
- Email deliverability verification method (test email vs testing service)
- Bounce notification handling (Resend dashboard vs webhook)
- Resend delivery webhook for email status tracking (based on existing email history feature)
- OAuth error toast message wording (generic vs technical hint)
- Setup documentation (code changes vs step-by-step guide)
- Sitemap pages (public-only vs all routes)
- robots.txt rules

### Deferred Ideas (OUT OF SCOPE)
- Apple Sign-in -- needs Apple Developer account setup (separate phase or backlog)
- Stripe live mode switch -- future task when ready for real payments
- OAuth on Vercel preview deployments -- not needed for production launch
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Purpose | Already In Codebase |
|---------|---------|---------------------|
| `@supabase/supabase-js` | OAuth via `signInWithOAuth` | Yes - `SocialLoginButtons.tsx` |
| `resend` | Transactional email API | Yes - `src/lib/email/client.ts` |
| `stripe` | Payment webhook verification | Yes - `src/lib/stripe/server.ts` |
| `next` (App Router) | Sitemap, robots.txt, metadata API | Yes - `next.config.ts` |
| `zod` | Env var validation in health checks | Yes - `src/lib/health/env.ts` |

### No New Packages Required

This phase requires zero new npm dependencies. All work is configuration, verification, and small code changes to existing modules.

## Architecture Patterns

### Current Project Structure (Relevant Files)
```
src/
├── app/
│   ├── api/
│   │   ├── health/route.ts          # Two-tier health endpoint
│   │   └── webhooks/
│   │       ├── stripe/route.ts      # Stripe webhook handler (idempotent)
│   │       └── resend/route.ts      # Resend delivery webhook handler
│   ├── auth/
│   │   ├── callback/route.ts        # OAuth + magic link callback
│   │   └── expired/page.tsx         # Expired link page
│   ├── (auth)/login/
│   │   └── LoginPageClient.tsx      # Login page with OAuth buttons
│   ├── layout.tsx                   # Root layout (metadata lives here)
│   ├── sitemap.ts                   # TO CREATE
│   └── robots.ts                    # TO CREATE
├── components/ui/auth/
│   ├── SocialLoginButtons.tsx       # Google + Apple OAuth buttons
│   ├── OAuthLoadingOverlay.tsx      # Loading state during OAuth redirect
│   └── AuthHandler.tsx              # Hash token processor
├── lib/
│   ├── email/
│   │   ├── constants.ts             # EMAIL_FROM, EMAIL_REPLY_TO (needs update)
│   │   ├── client.ts                # Resend singleton
│   │   └── send.ts                  # Send with retry, logging, prefs
│   ├── health/
│   │   ├── types.ts                 # Health response types (needs extension)
│   │   ├── env.ts                   # Env var validation (needs extension)
│   │   ├── checks.ts               # Deep service checks (needs extension)
│   │   └── index.ts                 # Barrel exports
│   └── stripe/server.ts            # Stripe client singleton
```

### Pattern 1: Next.js Metadata API for Search Console Verification
**What:** Add `verification.google` to the root layout metadata export
**When to use:** Google Search Console HTML meta tag verification
**Source:** Context7 - Next.js metadata API

```typescript
// src/app/layout.tsx - add to existing metadata export
export const metadata: Metadata = {
  // ...existing metadata...
  verification: {
    google: 'VERIFICATION_CODE_HERE', // From Search Console
  },
};
```

Generates: `<meta name="google-site-verification" content="VERIFICATION_CODE_HERE" />`

### Pattern 2: Next.js Programmatic Sitemap
**What:** Export a function from `src/app/sitemap.ts` returning URL array
**When to use:** Dynamic sitemap generation for SEO
**Source:** Context7 - Next.js sitemap file convention

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://mandalaymorningstar.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/menu`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
```

### Pattern 3: Next.js Programmatic robots.txt
**What:** Export a function from `src/app/robots.ts` returning rules
**When to use:** Control search engine crawling

```typescript
// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/driver/', '/api/', '/auth/', '/cart', '/checkout', '/account', '/orders'],
      },
    ],
    sitemap: 'https://mandalaymorningstar.com/sitemap.xml',
  };
}
```

### Pattern 4: OAuth Error Fallback to Email/Password Login
**What:** Auth callback already redirects to `/login?error=...` on OAuth failure
**Current state:** `src/app/auth/callback/route.ts` lines 30-37 handle `errorParam` by redirecting to login with error message. `LoginPageClient.tsx` lines 131-141 read `error` from search params and show a toast.
**Assessment:** This flow already works correctly. The auth callback returns a redirect to `/login?error=<message>` and the login page displays the error as a toast notification, then falls back to the email/password form.

### Anti-Patterns to Avoid
- **Hardcoding verification codes:** Use env vars for Google Search Console verification code so it can differ between environments
- **Blocking health checks on external services:** Keep health endpoint fast; deep checks are opt-in via `?deep=true`
- **Testing OAuth on preview deployments:** OAuth is production-domain only per user decision; don't add preview redirect URIs

## Discretion Recommendations

### DMARC Policy: `p=none` (monitoring mode)
**Recommendation:** Start with `p=none` for monitoring. This logs DMARC failures without rejecting email, letting you identify issues before enforcing.
```
v=DMARC1; p=none; rua=mailto:admin@mandalaymorningstar.com
```
Escalation path: `p=none` -> `p=quarantine` -> `p=reject` after monitoring confirms clean authentication. Google and Yahoo require DMARC to be published (any policy level satisfies the requirement).
**Confidence:** HIGH (Context7 Resend docs confirm this approach)

### Email Deliverability Verification: Send Test Email
**Recommendation:** Use the existing `/api/emails/test` endpoint to send a test email to admin@mandalaymorningstar.com from production. Check:
1. Email arrives (not in spam)
2. SPF passes (check email headers: `Authentication-Results` header)
3. DKIM passes (same header)
4. DMARC passes (same header)
**Why not a testing service:** The app already has a test email API route. Verifying with a real inbox is more reliable and simpler than configuring an external testing service.
**Confidence:** HIGH

### Bounce Notification Handling: Resend Dashboard (existing webhook)
**Recommendation:** Keep current setup. The Resend webhook handler at `/api/webhooks/resend/route.ts` already handles `email.bounced` and `email.complained` events, updating `notification_logs` status. The admin email dashboard at `/admin/emails` already shows delivery status. No additional bounce handling needed.
**Confidence:** HIGH (verified in codebase)

### OAuth Error Toast Wording: Generic with Sign-in Fallback
**Recommendation:** The current toast in `LoginPageClient.tsx` shows the raw error description from the OAuth provider. For production, use a user-friendly message:
- **Title:** "Google sign-in didn't work"
- **Description:** "Please try again or use the email link below."
The current behavior of showing the provider's error description can expose technical details. A generic message with clear fallback guidance is more appropriate.
**Confidence:** HIGH

### Sitemap Pages: Public Routes Only
**Recommendation:** Include only publicly accessible, non-auth-gated routes:
- `/` (homepage)
- `/menu` (menu page)
- `/privacy` (privacy policy)
- `/terms` (terms of service)
- `/login` (login page -- useful for SEO to show the entry point)

Exclude: `/admin/*`, `/driver/*`, `/cart`, `/checkout`, `/account`, `/orders/*`, `/api/*`, `/auth/*`
**Confidence:** HIGH

### robots.txt Rules
**Recommendation:** Allow all public routes, disallow auth-gated sections:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /driver/
Disallow: /api/
Disallow: /auth/
Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /orders
Disallow: /debug/
```
**Confidence:** HIGH

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap XML | Manual XML string construction | `src/app/sitemap.ts` with `MetadataRoute.Sitemap` return type | Next.js handles XML serialization, content-type headers, caching |
| robots.txt | Static text file | `src/app/robots.ts` with `MetadataRoute.Robots` return type | Programmatic control, type safety, auto-served |
| Search Console verification | Manual `<meta>` tag in `<head>` | `metadata.verification.google` in `layout.tsx` | Next.js metadata API handles deduplication and placement |
| OAuth redirect flow | Custom redirect handler | Supabase `signInWithOAuth` + `/auth/callback` route | Already implemented; Supabase handles PKCE flow |
| Webhook signature verification | Manual HMAC computation | `stripe.webhooks.constructEvent()` | Already implemented; handles timing-safe comparison |
| Email send with retry | Custom fetch + retry logic | Existing `sendEmail()` in `src/lib/email/send.ts` | Already has retry, logging, preference checks |

## Common Pitfalls

### Pitfall 1: Missing Supabase Redirect URL
**What goes wrong:** OAuth sign-in starts, Google authenticates user, but Supabase rejects the callback because the production redirect URL isn't in the allowed list.
**Why it happens:** Supabase requires explicit allowlisting of every redirect URL in project settings (Authentication > URL Configuration > Redirect URLs).
**How to avoid:** Add `https://mandalaymorningstar.com/auth/callback` to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs. Also keep `http://localhost:3000/auth/callback` for local dev.
**Warning signs:** OAuth redirects to an error page or shows "redirect_uri_mismatch" error.

### Pitfall 2: Google OAuth Callback URL Mismatch
**What goes wrong:** Google rejects the OAuth request with "redirect_uri_mismatch".
**Why it happens:** The authorized redirect URI in Google Cloud Console must exactly match what Supabase sends. Supabase uses `https://<project-ref>.supabase.co/auth/v1/callback` (NOT your app's `/auth/callback`).
**How to avoid:** In GCP Console > APIs & Services > Credentials > OAuth 2.0 Client ID, add `https://ukuzkhuppqwtrdkjqrkv.supabase.co/auth/v1/callback` as an authorized redirect URI. Your app's `/auth/callback` is handled separately by Supabase.
**Warning signs:** "Error 400: redirect_uri_mismatch" on Google consent screen.

### Pitfall 3: SPF Record Conflict with Google Workspace
**What goes wrong:** Adding Resend's SPF include overwrites Google Workspace's SPF, breaking Google Workspace email sending (or vice versa).
**Why it happens:** DNS allows only one SPF TXT record per domain. Multiple SPF records cause validation failures.
**How to avoid:** Merge into a single SPF record: `v=spf1 include:_spf.google.com include:_spf.resend.com ~all`. User confirmed this is already configured at Hostinger. Verify during execution.
**Warning signs:** SPF check fails in email headers (`spf=fail` or `spf=permerror`).

### Pitfall 4: EMAIL_FROM Sender Name Mismatch
**What goes wrong:** The `EMAIL_FROM` constant in code has a different sender name than what was decided.
**Why it happens:** The current constant is `"Mandalay Morning Star <admin@mandalaymorningstar.com>"` but the decision specifies sender name as `"Mandalay Morning Star Burmese Kitchen (Los Angeles)"`.
**How to avoid:** Update `src/lib/email/constants.ts` to use `"Mandalay Morning Star Burmese Kitchen (Los Angeles) <admin@mandalaymorningstar.com>"`.
**Warning signs:** Emails show wrong sender name in recipient's inbox.

### Pitfall 5: Stripe Webhook Signing Secret for Sandbox vs Live
**What goes wrong:** Planning to use the same webhook secret when switching to live mode.
**Why it happens:** Stripe generates a different signing secret for each webhook endpoint. The test mode and live mode endpoints are separate in Stripe dashboard.
**How to avoid:** User decision explicitly notes "only signing secret changes" when switching to live. Document this for future reference. Current sandbox webhook secret is already in Vercel env vars.
**Warning signs:** Signature verification fails after switching to live mode (HTTP 400 from webhook handler).

### Pitfall 6: Google Search Console Verification Code as Hardcoded String
**What goes wrong:** Verification code is hardcoded in `layout.tsx`, making it impossible to have different values per environment.
**Why it happens:** Verification code is environment-specific (production domain only).
**How to avoid:** Use an env var `GOOGLE_SITE_VERIFICATION` and reference it in the metadata. Since this is a public value (it's literally in the HTML), a `NEXT_PUBLIC_` prefix is fine but not required since `layout.tsx` is a server component.
**Warning signs:** None -- just a maintainability concern.

### Pitfall 7: NEXT_PUBLIC_APP_URL Still Points to Vercel Default Domain
**What goes wrong:** Email links, checkout success/cancel URLs, and other redirects point to `mandalay-morning-star-delivery-app.vercel.app` instead of the production domain.
**Why it happens:** `.env.local` currently has `NEXT_PUBLIC_APP_URL=https://mandalay-morning-star-delivery-app.vercel.app/`. Vercel production env vars may also need updating.
**How to avoid:** Verify `NEXT_PUBLIC_APP_URL` in Vercel production env vars is set to `https://mandalaymorningstar.com` (no trailing slash). The email constants fallback already defaults to `https://mandalaymorningstar.com`, but explicit env var is better.
**Warning signs:** Email "View Order" links go to vercel.app domain instead of production domain.

## Code Examples

### Example 1: Extend Health Check Types
```typescript
// src/lib/health/types.ts - extend HealthResponse.services
export interface HealthResponse {
  // ...existing fields...
  services: {
    supabase: ServiceStatus;
    stripe: ServiceStatus;
    resend: ServiceStatus;
    google_oauth: ServiceStatus;    // NEW
    search_console: ServiceStatus;  // NEW
  };
  // ...rest unchanged...
}
```

### Example 2: Google OAuth Health Check
```typescript
// src/lib/health/checks.ts - new check function
export async function checkGoogleOAuth(): Promise<ServiceStatus> {
  // Config-only check: verify required Supabase env vars are present
  // (actual OAuth testing requires browser interaction)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const configured = Boolean(supabaseUrl);

  if (!configured) {
    return { status: "down", configured: false };
  }

  return {
    status: "healthy",
    configured: true,
    // Can't test OAuth connectivity without browser redirect
  };
}
```

### Example 3: Update Email Sender Name
```typescript
// src/lib/email/constants.ts
export const EMAIL_FROM =
  "Mandalay Morning Star Burmese Kitchen (Los Angeles) <admin@mandalaymorningstar.com>";
```

### Example 4: Search Console Verification in Layout Metadata
```typescript
// src/app/layout.tsx - add to metadata export
export const metadata: Metadata = {
  // ...existing...
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};
```

## Existing Code Assessment

### What Already Works
| Feature | File | Status |
|---------|------|--------|
| Google OAuth sign-in button | `SocialLoginButtons.tsx` | Working -- calls `signInWithOAuth` with Google provider |
| OAuth callback handler | `auth/callback/route.ts` | Working -- exchanges code, handles errors, redirects |
| OAuth loading overlay | `OAuthLoadingOverlay.tsx` | Working -- shows provider-specific loading state |
| OAuth error display | `LoginPageClient.tsx` | Working -- reads `?error=` param, shows toast |
| Resend email sending | `lib/email/send.ts` | Working -- retry, logging, preference checks |
| Resend client singleton | `lib/email/client.ts` | Working -- lazy init with API key |
| Stripe webhook handler | `api/webhooks/stripe/route.ts` | Working -- signature verification, idempotency via `webhook_events` table |
| Resend webhook handler | `api/webhooks/resend/route.ts` | Working -- delivery status tracking |
| Health endpoint | `api/health/route.ts` | Working -- two-tier (config + deep), env validation |
| Env var validation | `lib/health/env.ts` | Working -- critical + important var schemas |
| Deep service checks | `lib/health/checks.ts` | Working -- Supabase, Stripe, Resend connectivity |
| Sentry error capturing | Webhook handlers | Working -- `logger.exception()` in catch blocks |

### What Needs Changes
| Change | File | Scope |
|--------|------|-------|
| Update EMAIL_FROM sender name | `src/lib/email/constants.ts` | 1 line |
| Add sitemap.ts | `src/app/sitemap.ts` | New file (~20 lines) |
| Add robots.ts | `src/app/robots.ts` | New file (~20 lines) |
| Add google-site-verification metadata | `src/app/layout.tsx` | 3 lines added to metadata export |
| Extend health types for new services | `src/lib/health/types.ts` | Add 2 service entries |
| Add Google OAuth + Search Console checks | `src/lib/health/checks.ts` | ~30 lines |
| Update health route to include new checks | `src/app/api/health/route.ts` | ~10 lines |
| Add env vars to validation | `src/lib/health/env.ts` | ~2 lines |

### What Needs External Configuration (No Code Changes)
| Task | Where | What |
|------|-------|------|
| Add production redirect URI to Supabase | Supabase Dashboard > Auth > URL Config | Add `https://mandalaymorningstar.com/**` |
| Add Supabase callback to Google OAuth | GCP Console > Credentials > OAuth Client | Add `https://ukuzkhuppqwtrdkjqrkv.supabase.co/auth/v1/callback` |
| Publish Google OAuth consent screen | GCP Console > OAuth Consent Screen | Publish to production |
| Verify NEXT_PUBLIC_APP_URL in Vercel | Vercel > Settings > Env Vars | Set to `https://mandalaymorningstar.com` |
| Verify EMAIL_FROM in Vercel | Vercel > Settings > Env Vars | Confirm `admin@mandalaymorningstar.com` |
| Verify Resend domain in Resend dashboard | Resend Dashboard > Domains | Confirm `mandalaymorningstar.com` verified |
| Send test webhook from Stripe dashboard | Stripe Dashboard > Webhooks | Click "Send test webhook" button |
| Obtain Google Search Console verification code | Google Search Console | Add property, copy verification code |
| Add GOOGLE_SITE_VERIFICATION to Vercel env vars | Vercel > Settings > Env Vars | Set verification code |
| Verify SPF record includes both Google and Resend | DNS check tool (e.g., MXToolbox) | Confirm merged SPF record |

## Webhook Event Subscriptions (Stripe)

Current handler processes these events (from `src/app/api/webhooks/stripe/route.ts`):
- `checkout.session.completed` -- confirms order, sends confirmation email
- `checkout.session.expired` -- cancels pending order
- `payment_intent.payment_failed` -- logs failure (no status change)
- `charge.refunded` -- cancels order (full refund) or logs (partial refund), sends refund email

**Planner should verify:** The Stripe dashboard webhook configuration subscribes to exactly these events. Extra subscriptions waste API calls; missing ones cause silent failures.

### Idempotency
The webhook handler already implements idempotency via the `webhook_events` table:
1. Check if `event_id` exists in `webhook_events`
2. If exists, return `{ received: true, duplicate: true }`
3. If not, insert (UNIQUE constraint is atomic guard)
4. Race condition handled: unique constraint violation = another instance processing

This is a solid pattern. No changes needed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static `sitemap.xml` file | `sitemap.ts` with `MetadataRoute.Sitemap` | Next.js 13+ (App Router) | Type-safe, dynamic sitemap generation |
| `meta` tags in `<head>` manually | `metadata.verification` export | Next.js 13+ | Automatic deduplication, SSR-safe |
| Static `robots.txt` file | `robots.ts` with `MetadataRoute.Robots` | Next.js 13+ | Programmatic, type-safe |
| Gmail no DMARC requirement | DMARC required for bulk senders | Feb 2024 | Must publish DMARC record |

## Open Questions

1. **NEXT_PUBLIC_APP_URL in Vercel Production**
   - What we know: Local `.env.local` has the Vercel default domain, not the production domain
   - What's unclear: Whether the Vercel production env var is already set to `https://mandalaymorningstar.com`
   - Recommendation: Verify during execution; update if needed. This affects email links, checkout URLs, and email constants fallback.

2. **Resend Domain Verification Status**
   - What we know: User says DNS records are configured and working. Resend API key exists.
   - What's unclear: Whether `mandalaymorningstar.com` shows as "verified" in Resend dashboard (vs a subdomain like `mail.mandalaymorningstar.com`)
   - Recommendation: Verify in Resend dashboard during execution. The `.env.example` mentions `mail.mandalaymorningstar.com` but the decision says root domain.

3. **Google OAuth Client ID Configuration**
   - What we know: Existing GCP project with OAuth credentials. User says "just needs production redirect URI added."
   - What's unclear: Whether the Supabase project's Google provider is already enabled with Client ID/Secret from GCP
   - Recommendation: Verify in Supabase Dashboard > Authentication > Providers > Google during execution.

## Sources

### Primary (HIGH confidence)
- Context7 `/supabase/supabase` -- Google OAuth signInWithOAuth, callback URL format
- Context7 `/websites/nextjs` -- Metadata verification, sitemap.ts, robots.ts file conventions
- Context7 `/websites/resend` -- SPF/DKIM/DMARC record configuration, domain verification
- Codebase files (read directly): `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/resend/route.ts`, `src/app/auth/callback/route.ts`, `src/lib/email/`, `src/lib/health/`, `src/components/ui/auth/`, `src/app/layout.tsx`

### Secondary (MEDIUM confidence)
- Supabase docs on OAuth callback URL format: `https://<project-ref>.supabase.co/auth/v1/callback`
- Google/Yahoo DMARC requirement (Feb 2024): widely documented across Resend, Google, industry sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed; all code exists
- Architecture: HIGH -- patterns verified against Next.js and Supabase docs via Context7
- Pitfalls: HIGH -- identified from codebase analysis and cross-referencing with docs
- Discretion items: HIGH -- recommendations based on existing codebase patterns and industry standards

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable configuration; no fast-moving dependencies)
