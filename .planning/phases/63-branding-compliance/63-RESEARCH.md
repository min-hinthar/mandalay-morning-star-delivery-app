# Phase 63: Branding & Compliance - Research

**Researched:** 2026-02-14
**Domain:** Homepage branding, legal pages, footer, Google OAuth brand verification
**Confidence:** HIGH

## Summary

This phase transforms placeholder legal pages into comprehensive branded documents, upgrades the existing homepage footer to include legal links and business listings, adds privacy/terms agreement text to the login page's OAuth flow, and prepares guidance for Google OAuth brand verification submission.

The codebase is well-structured for these changes. Privacy (`/privacy`) and terms (`/terms`) pages exist as stubs. The homepage already has a full footer (`FooterCTA.tsx`, 246 lines) with contact info, hours, and social links. The login page's `MagicLinkForm` already has terms/privacy agreement text, but the `SocialLoginButtons` component does not. Business data (address, email, phone, hours) already exists in the codebase across several files.

**Primary recommendation:** Rewrite `/privacy` and `/terms` page content comprehensively, expand `FooterCTA.tsx` to include legal links and business listings, add agreement text near the Google/Apple OAuth buttons on the login page, and produce an OAuth verification checklist document.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Tone: Professional + warm & personal -- blend of credibility and family-run charm
- Emphasize all three: meal subscription service, authentic Burmese cuisine, local LA delivery
- Full business name: "Mandalay Morning Star Burmese Kitchen"
- Show physical address on homepage (address already in codebase)
- Business has a physical location (not delivery-only)
- Existing brand assets (logo, colors, images) -- no new assets needed
- Testimonials/social proof already on homepage -- keep as-is
- Food photos/menu preview already on homepage -- keep as-is
- Claude drafts all homepage copy
- Both /privacy and /terms pages already exist -- update content comprehensively
- Full branded pages -- match app's design system (header, footer, proper layout)
- Update content to cover all data practices: Google OAuth, Sentry, Vercel Speed Insights, Stripe, Resend
- Data sharing: Only service providers -- no selling or external sharing
- Effective date: 2026-02-14
- Contact email: Use existing email from codebase
- Governing law: California (business is in Los Angeles)
- Food allergy/liability disclaimer: Include in Terms of Service
- Homepage already has a footer -- expand to full footer
- Full footer: legal links, contact info, business listings, hours, copyright, attribution
- Business listings: Yelp, Google Maps, Uber Eats, DoorDash, GrubHub (Claude searches for URLs during implementation)
- Business hours: Already in codebase -- display in footer
- Copyright: "(C) 2026 Mandalay Morning Star Burmese Kitchen"
- Attribution tagline: "Cooked with Love [heart] for the Burmese [Myanmar flag] Community of Los Angeles [bear]"
- Footer scope: Public pages only (homepage, /menu, /privacy, /terms) -- not in the logged-in app
- Login page: Add "By signing in you agree to our Privacy Policy and Terms" with links
- Match existing app design language
- App is already published (not in testing mode)
- Only email + profile scopes expected (Claude confirms from codebase)
- No demo video available
- Developer/support email: Use existing from codebase

### Claude's Discretion

- Homepage "about" section presence and content
- CTA design and placement
- "How it works" steps section
- Level of business detail (delivery days, pricing)
- Google Sign-in mention in copy
- Contact info display approach
- CCPA/CPRA inclusion
- Age restriction policy
- Refund/cancellation placement
- Cookie policy in privacy page
- Footer column layout and responsive behavior
- OAuth console guidance format
- Whether consent screen checklist is needed

### Deferred Ideas (OUT OF SCOPE)

- Cookie consent banner -- new UI capability, should be its own implementation task
  </user_constraints>

## Standard Stack

### Core (Already in Project)

| Library         | Version         | Purpose                                   | Relevance                                                       |
| --------------- | --------------- | ----------------------------------------- | --------------------------------------------------------------- |
| Next.js         | 16 (App Router) | Page routing, metadata, server components | Legal pages are server components in `(public)` route group     |
| React           | 19              | UI rendering                              | All components use React                                        |
| Tailwind CSS v4 | Latest          | Styling                                   | `@theme inline` in `globals.css`; footer tokens already defined |
| Framer Motion   | Latest          | Animations                                | FooterCTA already uses `m` components                           |
| Lucide React    | Latest          | Icons                                     | Footer icons (MapPin, Phone, Mail, Clock, etc.)                 |

### Supporting (Already in Project)

| Library      | Version  | Purpose          | Relevance                               |
| ------------ | -------- | ---------------- | --------------------------------------- |
| `next/link`  | Built-in | Internal linking | Privacy/terms links in footer and login |
| `next/image` | Built-in | Optimized images | Logo already used in AuthCard           |

### No New Dependencies Required

This phase is purely content and layout work. All necessary libraries are already installed.

## Architecture Patterns

### Current Page Structure

```
src/app/
  (public)/
    page.tsx              # Homepage (server component, 129 lines)
    layout.tsx            # Public layout (client, CartOverlays)
    privacy/page.tsx      # Stub (22 lines) -- NEEDS REWRITE
    terms/page.tsx        # Stub (22 lines) -- NEEDS REWRITE
    menu/page.tsx         # Menu page (17 lines)
  (auth)/
    login/
      page.tsx            # Server component, redirects if authed
      LoginPageClient.tsx # Client component with auth card
    layout.tsx            # Auth layout (DomMaxProvider)
  layout.tsx              # Root layout (header, providers, analytics)
```

### Current Homepage Section Flow

```
page.tsx (server) renders:
  HomePageWrapper (client, scroll spy)
    Hero              # Animated hero with CTA
    SettingsNudgeBanner
    HowItWorksSection # Lazy loaded (Google Maps)
    MenuSection       # Featured menu items
    TestimonialsCarousel
    CTABanner
    FooterCTA         # <-- THIS IS THE FOOTER TO EXPAND
```

### Pattern: Footer is Public-Only

The footer (`FooterCTA`) is rendered ONLY in the homepage `page.tsx`. The menu page, privacy page, and terms page do NOT currently render a footer. The root layout has `HeaderWrapper` but no footer. For footer on all public pages, the footer should either:

- **Option A:** Move into `(public)/layout.tsx` so it renders on all public routes
- **Option B:** Import and render in each public page individually

**Recommendation:** Option A -- add footer to `(public)/layout.tsx`. This is clean and automatic. However, the homepage currently renders its own `FooterCTA` which includes the CTA section above the footer info section. The solution is to split:

1. A shared `PublicFooter` component (info section: legal links, contact, hours, listings, copyright)
2. Keep `FooterCTA` on homepage only (the CTA call-to-action section)

### Pattern: Legal Pages as Server Components

Privacy and terms pages should remain server components (no `"use client"`) since they are static content. Use the existing design system classes (`font-display`, `font-body`, `text-primary`, `bg-background`, etc.).

### Pattern: Login Agreement Text

The `MagicLinkForm` already has agreement text (line 147-157). The `SocialLoginButtons` component does NOT. Agreement text should be added to the login page at a level that covers BOTH auth methods -- likely in `LoginPageClient.tsx` or within the `AuthCard` wrapper.

### Existing Business Data Locations

| Data            | Location                                      | Value                                                 |
| --------------- | --------------------------------------------- | ----------------------------------------------------- |
| Address         | `src/types/address.ts` KITCHEN_LOCATION       | 750 Terrado Plaza, Suite 33, Covina, CA 91723         |
| Address         | `src/lib/email/constants.ts` BUSINESS_ADDRESS | Same                                                  |
| Email (admin)   | `src/lib/email/constants.ts` EMAIL_REPLY_TO   | admin@mandalaymorningstar.com                         |
| Email (contact) | `FooterCTA.tsx` hardcoded                     | hello@mandalaymorningstar.com                         |
| Phone           | `FooterCTA.tsx` hardcoded                     | (626) 123-4567                                        |
| Brand Name      | Email constants EMAIL_FROM                    | "Mandalay Morning Star Burmese Kitchen (Los Angeles)" |
| App URL         | `src/lib/email/constants.ts` APP_URL          | https://mandalaymorningstar.com                       |
| Store Hours     | `settings-defaults.ts` DEFAULT_SETTINGS       | Mon-Fri 9-9, Sat 10-10, Sun 10-8                      |
| Delivery        | `FooterCTA.tsx` hardcoded                     | Saturday 11AM-7PM, cutoff Friday 3PM                  |
| Logo            | `public/logo.png`                             | Exists                                                |
| Icons           | `public/icons/icon-192.png`, `icon-512.png`   | Exist                                                 |
| Brand Colors    | `src/lib/email/constants.ts` BRAND_COLORS     | primary #A41034, secondary #EBCD00, etc.              |

### Anti-Patterns to Avoid

- **Hardcoding business data in multiple places:** Use existing constants/imports. Address is already in `KITCHEN_LOCATION` and `BUSINESS_ADDRESS`. Don't create new copies.
- **Making legal pages client components:** They don't need interactivity. Keep as server components for SEO and performance.
- **Over-engineering the footer:** Don't create a complex state-driven footer. It's static content with links.
- **Putting footer in root layout:** The footer should NOT appear on admin, driver, customer authenticated pages. Only public pages.

## Don't Hand-Roll

| Problem                | Don't Build            | Use Instead                           | Why                                                 |
| ---------------------- | ---------------------- | ------------------------------------- | --------------------------------------------------- |
| Legal page content     | Custom legal generator | Draft content directly                | Small business, straightforward data practices      |
| Footer layout          | Complex grid system    | Tailwind grid/flex                    | Already used in current FooterCTA                   |
| SVG flags/icons        | Custom icon system     | Inline SVG or emoji                   | Attribution tagline needs Myanmar flag, heart, bear |
| Business listings URLs | Automated scraper      | Manual research during implementation | Only 5 URLs to find                                 |

## Common Pitfalls

### Pitfall 1: Footer in Wrong Layout Scope

**What goes wrong:** Footer renders on admin/driver/customer authenticated pages
**Why it happens:** Putting footer in root `layout.tsx` instead of `(public)/layout.tsx`
**How to avoid:** Add footer to `(public)/layout.tsx` only
**Warning signs:** Footer visible on `/admin`, `/driver`, `/cart`, `/checkout` pages

### Pitfall 2: Legal Page Content Too Generic

**What goes wrong:** Privacy policy doesn't name specific services, fails Google verification
**Why it happens:** Using template privacy policy without customization
**How to avoid:** Explicitly name each data processor: Google (OAuth), Sentry (error monitoring + session replays), Vercel (analytics + speed insights), Stripe (payments), Resend (emails). Include specific data collected by each.
**Warning signs:** Google reviewer rejects for vague privacy policy

### Pitfall 3: Missing Agreement Text on Social Login

**What goes wrong:** Google OAuth buttons don't show terms/privacy agreement
**Why it happens:** `MagicLinkForm` has it but `SocialLoginButtons` doesn't
**How to avoid:** Add agreement text that covers ALL auth methods -- either in `LoginPageClient.tsx` below both components, or inside `AuthCard` itself
**Warning signs:** Users can sign in via Google without seeing terms agreement

### Pitfall 4: FooterCTA File Exceeds 400 Lines

**What goes wrong:** ESLint max-lines warning fires
**Why it happens:** Adding legal links, business listings, attribution to existing 246-line file
**How to avoid:** Split the footer:

- `FooterCTA.tsx` keeps the top CTA section (homepage-only)
- New `PublicFooter.tsx` or `SiteFooter.tsx` has the info section (all public pages)
  **Warning signs:** File exceeds 400 lines after edits

### Pitfall 5: Dynamic Year in Copyright

**What goes wrong:** Copyright shows wrong year or causes hydration mismatch
**Why it happens:** `new Date().getFullYear()` runs differently on server vs client
**How to avoid:** The current FooterCTA already uses `{new Date().getFullYear()}` and it works because it's a client component. If the new footer is a server component, this is fine too (renders once on server).

### Pitfall 6: OAuth Scopes Assumption

**What goes wrong:** Assuming scopes beyond email/profile
**Why it happens:** Not verifying what Supabase actually requests
**How to avoid:** Confirmed from codebase: `SocialLoginButtons.tsx` calls `signInWithOAuth` with NO explicit scopes (line 22-29). Supabase's default Google scopes are `openid email profile` (non-sensitive). No additional scopes are requested.
**Verification:** The `queryParams` only set `access_type: "offline"` and `prompt: "consent"` -- these are NOT scopes.

### Pitfall 7: Sentry Session Replay Disclosure

**What goes wrong:** Privacy policy doesn't disclose session recordings
**Why it happens:** Overlooking Sentry replay integration
**How to avoid:** `instrumentation-client.ts` shows `Sentry.replayIntegration` is active with `maskAllText: true`, `maskAllInputs: true`, `blockAllMedia: true`. Replays only capture on errors (`replaysOnErrorSampleRate: 1.0`, `replaysSessionSampleRate: 0`). Disclose this specifically.

## Code Examples

### Legal Page Structure Pattern

```tsx
// src/app/(public)/privacy/page.tsx
// Source: codebase pattern from existing pages
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Mandalay Morning Star Burmese Kitchen",
  description: "How we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-background text-text-primary">
      <article className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: February 14, 2026</p>

        {/* Sections with semantic heading hierarchy */}
        <section className="space-y-6">
          <h2 className="text-xl font-display font-semibold mt-8">Information We Collect</h2>
          <p className="font-body text-text-secondary leading-relaxed">...content...</p>
        </section>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </article>
    </main>
  );
}
```

### Footer Link Section Pattern

```tsx
// Pattern for adding legal links to footer info section
// Source: existing FooterCTA.tsx structure
<div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
  <Link href="/privacy" className="text-footer-text-muted hover:text-secondary transition-colors">
    Privacy Policy
  </Link>
  <Link href="/terms" className="text-footer-text-muted hover:text-secondary transition-colors">
    Terms of Service
  </Link>
</div>
```

### Login Agreement Text Pattern

```tsx
// Source: existing MagicLinkForm.tsx lines 147-157
<p className="text-center text-xs text-muted-foreground leading-relaxed">
  By signing in, you agree to our{" "}
  <Link
    href="/terms"
    className="underline underline-offset-2 hover:text-text-primary transition-colors"
  >
    Terms of Service
  </Link>{" "}
  and{" "}
  <Link
    href="/privacy"
    className="underline underline-offset-2 hover:text-text-primary transition-colors"
  >
    Privacy Policy
  </Link>
  .
</p>
```

### Attribution Tagline SVG Pattern

```tsx
// Myanmar flag and California bear as inline SVGs or emojis
// User requested: "Cooked with Love [heart] for the Burmese [Myanmar flag] Community of Los Angeles [bear]"
// Emoji approach (simplest):
<p className="text-xs text-footer-text-muted">
  Cooked with Love {"❤️"} for the Burmese {"🇲🇲"} Community of Los Angeles {"🐻"}
</p>
// Note: User explicitly specified emojis. SVG alternative if emoji rendering is inconsistent.
```

## Discretion Recommendations

### CCPA/CPRA: Mention but Don't Claim Compliance

**Recommendation:** Do NOT include a CCPA compliance section. The business likely falls below the $26.6M revenue threshold and 100K consumer threshold. Instead, include a brief statement: "California residents may have additional rights under state law. Contact us for more information." This avoids false compliance claims while acknowledging California residence.
**Confidence:** HIGH (based on CCPA thresholds for small businesses)

### Age Restriction: 13+ Minimum

**Recommendation:** Include a brief clause in Terms of Service: "You must be at least 13 years old to use this service." This is standard for any service collecting personal data (COPPA compliance baseline). No need for a full age gate UI.
**Confidence:** HIGH

### Refund/Cancellation Policy: In Terms of Service

**Recommendation:** Include a refund/cancellation section within Terms of Service. Cover: order cancellation before cutoff, no refunds after delivery, damaged items policy, contact admin email for disputes. Keep it brief and practical.
**Confidence:** HIGH

### Cookie Policy: Brief Section in Privacy Policy

**Recommendation:** Include a brief "Cookies and Similar Technologies" section in the privacy policy. Mention: session cookies for authentication, analytics cookies (Vercel), error monitoring (Sentry). Don't claim to have a cookie consent mechanism (deferred). Keep it informational.
**Confidence:** HIGH

### Footer Layout: 4-Column Grid

**Recommendation:** Expand the current 3-column grid to 4 columns on desktop (contact, hours, listings, legal). On mobile, stack in 1 column. This matches the existing responsive pattern.
**Confidence:** MEDIUM (depends on how much content fits)

### Homepage "About" Section: Not Needed

**Recommendation:** Skip a separate "about" section. The Hero already communicates the brand ("Authentic Burmese Cuisine Delivered to Your Door"), the HowItWorksSection explains the process, the TestimonialsCarousel provides social proof, and the footer has contact info. Adding more text would dilute the homepage flow.
**Confidence:** HIGH

### Google Sign-in Mention in Copy: Not in Homepage

**Recommendation:** Don't mention Google Sign-in on the homepage. It's an implementation detail, not a selling point. The login page already has "Continue with Google" button.
**Confidence:** HIGH

### OAuth Console Guidance: Checklist in Research

**Recommendation:** Provide a clear checklist of manual steps the user needs to take in Google Cloud Console. This is not code -- it's guidance for the human operator.
**Confidence:** HIGH

## Google OAuth Brand Verification Checklist

### Prerequisites (Code Changes This Phase Delivers)

- [ ] Homepage clearly explains app purpose (meal delivery subscription)
- [ ] Homepage links to `/privacy` with comprehensive privacy policy
- [ ] Homepage links to `/terms` with terms of service
- [ ] Privacy policy specifically discloses Google OAuth data usage
- [ ] Privacy policy hosted at `https://mandalaymorningstar.com/privacy`
- [ ] Terms of service hosted at `https://mandalaymorningstar.com/terms`
- [ ] Domain `mandalaymorningstar.com` verified in Google Search Console (Phase 62)

### Manual Steps (Human Operator, Post-Deployment)

1. Go to [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > OAuth consent screen
2. Under "App information":
   - App name: "Mandalay Morning Star Burmese Kitchen"
   - User support email: `admin@mandalaymorningstar.com`
3. Under "App domain":
   - Application home page: `https://mandalaymorningstar.com`
   - Application privacy policy: `https://mandalaymorningstar.com/privacy`
   - Application terms of service: `https://mandalaymorningstar.com/terms`
4. Under "Authorized domains": Add `mandalaymorningstar.com`
5. Under "Developer contact information": `admin@mandalaymorningstar.com`
6. Upload app logo (120x120 PNG recommended) -- use existing `public/logo.png`
7. Verify scopes are only: `openid`, `email`, `profile` (non-sensitive)
8. Click "Submit for verification" -- processing takes 2-3 business days
9. No demo video needed for non-sensitive scopes (email + profile only)

### What Verification Removes

- The "unverified app" warning screen users see before consenting
- The "This app isn't verified" banner with the proceed-anyway link
- After verification: clean consent screen with app logo and name

## File Impact Analysis

| File                                                        | Action                                    | Current Lines | Expected Lines | Risk   |
| ----------------------------------------------------------- | ----------------------------------------- | ------------- | -------------- | ------ |
| `src/app/(public)/privacy/page.tsx`                         | Rewrite content                           | 22            | ~200-300       | LOW    |
| `src/app/(public)/terms/page.tsx`                           | Rewrite content                           | 22            | ~200-300       | LOW    |
| `src/components/ui/homepage/FooterCTA.tsx`                  | Extract shared footer section OR split    | 246           | Split needed   | MEDIUM |
| `src/app/(public)/layout.tsx`                               | Add shared footer                         | 13            | ~20            | LOW    |
| `src/app/(public)/page.tsx`                                 | Possible minor adjustment if footer moves | 129           | ~130           | LOW    |
| `src/app/(auth)/login/LoginPageClient.tsx`                  | Add agreement text                        | 156           | ~165           | LOW    |
| NEW: `src/components/ui/homepage/SiteFooter.tsx` or similar | Shared footer component                   | 0             | ~200-300       | LOW    |

### File Splitting Strategy

The `FooterCTA.tsx` (246 lines) contains two distinct sections:

1. **Top CTA section** (lines 50-118): "Ready to Taste Authentic Burma?" with order buttons -- homepage only
2. **Bottom info section** (lines 120-242): Contact, hours, social, copyright -- should be on all public pages

**Split plan:**

- Keep `FooterCTA.tsx` with just the CTA section (homepage-only, ~120 lines)
- New `SiteFooter.tsx` with the info section expanded: add legal links, business listings, attribution, updated copyright (~250-350 lines)
- `(public)/layout.tsx` imports `SiteFooter`
- Homepage `page.tsx` keeps `FooterCTA` (CTA section only), footer info comes from layout

**Alternative:** Keep `FooterCTA` intact on homepage, add `SiteFooter` to layout but hide it on homepage to avoid duplication. The layout approach is cleaner.

## Privacy Policy Content Outline

### Required Sections (from locked decisions)

1. **Introduction** -- Business name, effective date, what this policy covers
2. **Information We Collect**
   - Account info (name, email, profile photo via Google OAuth)
   - Order data (delivery address, order history, payment info via Stripe)
   - Device/usage data (browser, IP, pages visited)
3. **How We Use Your Information** -- Order fulfillment, communication, improvement
4. **Third-Party Service Providers**
   - **Google OAuth:** Name, email, profile photo for authentication
   - **Stripe:** Payment processing (card data stays with Stripe)
   - **Resend:** Transactional email delivery
   - **Sentry:** Error monitoring, performance tracking, session replays (on errors only, all text/inputs masked, all media blocked)
   - **Vercel:** Web analytics (via Analytics) and performance monitoring (via Speed Insights)
5. **Data Sharing** -- Only with above service providers; never sold
6. **Data Retention** -- How long data is kept
7. **Cookies and Similar Technologies** -- Session cookies, analytics, error monitoring
8. **Your Rights** -- Access, correction, deletion requests
9. **California Residents** -- Brief acknowledgment of potential state rights
10. **Children's Privacy** -- Not directed at children under 13
11. **Changes to This Policy** -- Notification of updates
12. **Contact Us** -- admin@mandalaymorningstar.com, physical address

### Sentry-Specific Disclosure (Critical for Transparency)

From `instrumentation-client.ts`:

- `sendDefaultPii: true` -- sends personally identifiable information
- `replayIntegration` with `maskAllText: true`, `maskAllInputs: true`, `blockAllMedia: true`
- Replay only on errors: `replaysOnErrorSampleRate: 1.0`, session rate `0`
- Browser tracing: `browserTracingIntegration()`
- Breadcrumbs: console, DOM, fetch, history, XHR

Disclosure should note: "When errors occur, we may capture anonymized session recordings to diagnose issues. All text, form inputs, and media are masked in these recordings."

## Terms of Service Content Outline

### Required Sections

1. **Introduction** -- Acceptance of terms, business identity
2. **Service Description** -- Weekly Burmese meal subscription, Saturday delivery
3. **Account Terms** -- Registration via Google or email, accuracy of information
4. **Ordering and Payment** -- Order cutoff, Stripe processing, pricing
5. **Delivery** -- Coverage area, Saturday delivery window, address accuracy
6. **Cancellation and Refunds** -- Before cutoff vs after, damaged items
7. **Food Safety and Allergens** -- Disclaimer, cross-contamination warning, customer responsibility
8. **User Conduct** -- Acceptable use
9. **Intellectual Property** -- Content ownership
10. **Limitation of Liability** -- Standard disclaimer
11. **Governing Law** -- California, Los Angeles County
12. **Changes to Terms** -- Notification
13. **Contact** -- admin@mandalaymorningstar.com, physical address

## Open Questions

1. **Business Listing URLs**
   - What we know: User wants Yelp, Google Maps, Uber Eats, DoorDash, GrubHub links
   - What's unclear: Actual URLs for this specific business on these platforms
   - Recommendation: Research/search during implementation. Use placeholder if not findable, with TODO comment.

2. **Phone Number Accuracy**
   - What we know: `(626) 123-4567` appears in FooterCTA (looks like a placeholder)
   - What's unclear: Whether this is the real business phone number
   - Recommendation: Use as-is since it's already in the codebase. Flag for user to verify.

3. **Contact Email: hello@ vs admin@**
   - What we know: Two emails exist -- `hello@mandalaymorningstar.com` in footer, `admin@mandalaymorningstar.com` in email system
   - What's unclear: Which should be the public-facing contact email
   - Recommendation: Use `admin@mandalaymorningstar.com` for legal pages (matches email system). Keep `hello@` in footer for general contact if desired.

4. **Logo for Google Console**
   - What we know: `public/logo.png` exists. Google requires 120x120 PNG.
   - What's unclear: Whether existing logo meets 120x120 requirement
   - Recommendation: Note in checklist that user should verify logo dimensions before upload.

## Sources

### Primary (HIGH confidence)

- Codebase analysis of: `FooterCTA.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `LoginPageClient.tsx`, `SocialLoginButtons.tsx`, `AuthCard.tsx`, `instrumentation-client.ts`, `sentry.server.config.ts`, `email/constants.ts`, `types/address.ts`, `settings-defaults.ts`, `layout.tsx`, `sitemap.ts`
- [Google Brand Verification Guide](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) -- Official requirements for consent screen verification
- [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google) -- Default scopes (openid, email, profile)

### Secondary (MEDIUM confidence)

- [Google OAuth 2.0 Policies](https://developers.google.com/identity/protocols/oauth2/policies) -- Policy compliance requirements
- [Google Cloud Verification Requirements](https://support.google.com/cloud/answer/13464321) -- Verification center requirements
- [CCPA Official FAQ](https://cppa.ca.gov/faq.html) -- Applicability thresholds ($26.6M revenue, 100K consumers)

### Tertiary (LOW confidence)

- Business listing URLs (Yelp, Google Maps, etc.) -- Will need to be researched during implementation
- Phone number accuracy -- `(626) 123-4567` may be a placeholder

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no new libraries, all patterns verified in codebase
- Architecture: HIGH -- clear file structure, layout patterns well-established
- Legal content: HIGH -- data practices confirmed from actual codebase configs
- OAuth verification: HIGH -- official Google docs consulted, scopes confirmed
- Pitfalls: HIGH -- verified against actual file sizes and patterns

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable domain, no fast-moving dependencies)
