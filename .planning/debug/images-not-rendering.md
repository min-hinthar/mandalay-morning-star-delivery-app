---
status: awaiting_human_verify
trigger: "Cart drawer menu images not rendering. Google user content (googleusercontent.com) images not rendering in headers."
created: 2026-02-28T00:00:00Z
updated: 2026-02-28T00:10:00Z
---

## Current Focus

hypothesis: Confirmed -- missing referrerPolicy on external img tags + narrow googleusercontent.com hostname in remotePatterns
test: Fixes applied, awaiting human verification
expecting: Images render correctly in cart drawer and header after deployment
next_action: User verifies images render in cart drawer and header/navbar

## Symptoms

expected: Product images should render in cart drawer; Google profile avatars should render in header/navbar
actual: Images are not rendering - likely broken image, blank space, or Next.js image config error
errors: Likely Next.js hostname not configured for googleusercontent.com domain; possibly missing image domains in next.config
reproduction: Open the cart drawer to see missing product images; check the header for missing Google avatar
started: Unknown - may have never been fully configured or broke after a config change

## Eliminated

- hypothesis: CSP img-src blocking Google images
  evidence: CSP already includes *.google.com and *.googleusercontent.com wildcards -- covers all Google image domains
  timestamp: 2026-02-28T00:01:00Z

- hypothesis: Next.js 16 breaking change in remotePatterns
  evidence: remotePatterns config is valid -- omitting search allows all query params, drive.google.com hostname is configured, maximumRedirects default of 3 is sufficient for Google Drive redirects
  timestamp: 2026-02-28T00:06:00Z

- hypothesis: next/image components are misconfigured
  evidence: CardImage, ItemDetailSheet, SearchResultCard all use next/image correctly with drive.google.com URLs which are in remotePatterns. Server-side optimization fetches images without referrer issues.
  timestamp: 2026-02-28T00:07:00Z

## Evidence

- timestamp: 2026-02-28T00:01:00Z
  checked: next.config.ts remotePatterns
  found: drive.google.com and lh3.googleusercontent.com are configured. CSP img-src has *.googleusercontent.com and *.google.com wildcards.
  implication: CSP is broadly correct but remotePatterns only has lh3 subdomain, not wildcard

- timestamp: 2026-02-28T00:02:00Z
  checked: CartItem.tsx image rendering
  found: Uses plain <img src={item.imageUrl}> on line 148. No referrerPolicy attribute.
  implication: Browser sends referrer to Google, which may block the request

- timestamp: 2026-02-28T00:03:00Z
  checked: AccountIndicator.tsx avatar rendering
  found: Uses plain <img src={avatarUrl}> on line 224. No referrerPolicy attribute.
  implication: Same referrer issue. Google may block avatar loads from external origins

- timestamp: 2026-02-28T00:04:00Z
  checked: DrawerUserSection.tsx avatar rendering
  found: Uses plain <img src={user.avatar}> on line 49. Has onError handler but no referrerPolicy.
  implication: Same referrer issue for mobile drawer

- timestamp: 2026-02-28T00:05:00Z
  checked: Product image URLs in menu-image-urls.json
  found: All use drive.google.com/thumbnail?id=...&sz=w1000 format
  implication: These URLs redirect to lh3.googleusercontent.com. Redirect + referrer policy may cause issues

- timestamp: 2026-02-28T00:06:00Z
  checked: Next.js 16 image changes
  found: maximumRedirects defaults to 3 (was unlimited). qualities field now required (already configured). search property for remotePatterns omitted = all params allowed.
  implication: Redirect limit should handle Google Drive (typically 1-2 redirects). No breaking changes here.

- timestamp: 2026-02-28T00:07:00Z
  checked: CardImage.tsx, ItemDetailSheet.tsx, SearchResultCard.tsx
  found: These use next/image with drive.google.com URLs. remotePatterns configured.
  implication: next/image should work for menu page, but plain img tags in cart drawer may fail due to referrer blocking

- timestamp: 2026-02-28T00:08:00Z
  checked: Referrer-Policy header in next.config.ts
  found: strict-origin-when-cross-origin -- sends origin to cross-origin requests
  implication: Google Drive and Google User Content see the app's origin as referrer, may reject image requests

- timestamp: 2026-02-28T00:09:00Z
  checked: All <img> tags across codebase loading external images (17 files)
  found: None had referrerPolicy attribute set. All relied on the page-level Referrer-Policy header (strict-origin-when-cross-origin)
  implication: Systematic issue affecting all external image loading via plain img tags

## Resolution

root_cause: |
  Two contributing issues:
  1. All external <img> tags for Google Drive thumbnails and Google OAuth avatars lack referrerPolicy="no-referrer". The app sets Referrer-Policy: strict-origin-when-cross-origin via security headers, causing the browser to send the app origin as referrer to Google services. Google services (Drive thumbnails, User Content avatars) block or restrict image serving when receiving referrers from unknown external origins.
  2. remotePatterns in next.config.ts only configures lh3.googleusercontent.com specifically, but Google may use other subdomains (lh4, lh5, lh6) for avatar/image delivery. Needed wildcard **.googleusercontent.com for robustness.
  3. The CSP img-src already uses wildcards (*.google.com, *.googleusercontent.com) so CSP is not the blocking issue.

fix: |
  1. Changed remotePatterns hostname from "lh3.googleusercontent.com" to "**.googleusercontent.com" to cover all Google user content subdomains.
  2. Added referrerPolicy="no-referrer" to all 17 external <img> tags across the codebase to prevent Google services from rejecting image requests based on unknown referrer origins.

verification: Awaiting human verification -- user needs to confirm images render in cart drawer and header after deploying these changes.

files_changed:
  - next.config.ts
  - src/components/ui/cart/CartItem/CartItem.tsx
  - src/components/ui/cart/CartPage/SuggestionRow.tsx
  - src/components/ui/layout/AppHeader/AccountIndicator.tsx
  - src/components/ui/layout/MobileDrawer/DrawerUserSection.tsx
  - src/components/ui/layout/AdminLayout.tsx
  - src/components/ui/avatar.tsx
  - src/components/ui/menu/MenuAccordion.tsx
  - src/components/ui/menu/SearchAutocomplete.tsx
  - src/components/ui/orders/tracking/DriverCard.tsx
  - src/components/ui/orders/tracking/DeliveredScreen.tsx
  - src/components/ui/admin/photos/PhotoGrid.tsx
  - src/components/ui/admin/photos/PhotoMetadata.tsx
  - src/components/ui/admin/sections/ItemSelector.tsx
  - src/components/ui/admin/sections/SectionCard.tsx
  - src/app/(admin)/admin/menu/MenuItemsTable.tsx
  - src/app/(admin)/admin/menu/[id]/MenuItemPhotoSection.tsx
