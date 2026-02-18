# OAuth Brand Verification Pre-Submission Check

**Date:** 2026-02-15
**Status:** Code prerequisites MET. Deployment required before submission.

## Verification Results

### 1. Privacy Policy Page

- **Local code:** `src/app/(public)/privacy/page.tsx` -- 272 lines, comprehensive
- **Content verified:** Google (OAuth), Sentry, Stripe, Resend, Vercel all disclosed
- **Scopes disclosed:** openid, email, profile (non-sensitive)
- **Production URL:** `https://delivery.mandalaymorningstar.com/privacy`
- **Deployed status:** OLD STUB CONTENT -- comprehensive rewrite NOT YET DEPLOYED

### 2. Terms of Service Page

- **Local code:** `src/app/(public)/terms/page.tsx` -- 232 lines, comprehensive
- **Content verified:** Food allergen disclaimer with "order at your own risk" language
- **Production URL:** `https://delivery.mandalaymorningstar.com/terms`
- **Deployed status:** OLD STUB CONTENT -- comprehensive rewrite NOT YET DEPLOYED

### 3. Homepage Footer Legal Links

- **Local code:** `src/components/ui/homepage/SiteFooter.tsx` -- links to /privacy and /terms
- **Layout integration:** `src/app/(public)/layout.tsx` includes SiteFooter
- **Deployed status:** SiteFooter NOT YET DEPLOYED (no /privacy or /terms links on live homepage)

### 4. OAuth Scopes Confirmation

- **File:** `src/components/ui/auth/SocialLoginButtons.tsx`
- **Scopes parameter:** NONE explicitly set (confirmed via grep)
- **Options set:** `queryParams: { access_type: "offline", prompt: "consent" }` -- these are NOT scopes
- **Effective scopes:** Supabase defaults only: `openid`, `email`, `profile`
- **Classification:** Non-sensitive scopes -- NO demo video required for verification

### 5. Google Cloud Console

- **URL:** https://console.cloud.google.com/apis/credentials/consent
- **Action needed:** User must configure consent screen and submit for verification

## Deployment Required

Plans 01 and 02 code exists locally but is NOT deployed to production. Before submitting for Google OAuth verification:

1. Push latest commits to main branch (or deploy with `vercel --prod`)
2. Verify privacy page shows comprehensive content at production URL
3. Verify terms page shows comprehensive content at production URL
4. Verify homepage footer has /privacy and /terms links
5. Then proceed with Google Cloud Console configuration
