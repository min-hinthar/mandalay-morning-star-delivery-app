---
status: awaiting_human_verify
trigger: "Cart drawer menu images not rendering. Google user content (googleusercontent.com) images not rendering in headers."
created: 2026-02-28T00:00:00Z
updated: 2026-03-02T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED -- SW CacheFirst strategy for external images cached opaque (status 0) failure responses permanently. Hard reload bypassed SW.
test: Fixes applied and self-verified (typecheck, lint, format, tests, build all pass)
expecting: User confirms cart drawer images render correctly after deploy
next_action: Awaiting human verification in production

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

- timestamp: 2026-03-02T00:01:00Z
  checked: SW caching strategy for external images (sw.ts lines 47-68)
  found: CacheFirst + CacheableResponsePlugin({statuses: [0, 200]}) for drive.google.com, googleusercontent.com, supabase.co. Opaque cross-origin responses (status 0) are cached. CacheFirst never re-fetches once cached.
  implication: If ANY opaque request fails (empty body), the bad response is cached permanently. Matches symptom: blank images that hard reload fixes.

- timestamp: 2026-03-02T00:02:00Z
  checked: Serwist activate handler cleanup behavior (built sw.js line 407)
  found: deleteOutdatedCaches only targets caches containing "-precache-" substring. Runtime caches (external-images-v1, external-images-v2, images-cache-v1, etc.) are NEVER cleaned up on activation.
  implication: Bumping CACHE_VERSION creates new cache names but old caches linger. Old bad entries in v1 are not served (new requests go to v2), but v2 can also accumulate its own bad entries.

- timestamp: 2026-03-02T00:03:00Z
  checked: CartItem.tsx img tag (line 148-153)
  found: No onError handler. If image fails to load (or SW serves bad cached response), img shows blank space. No fallback to emoji.
  implication: Need onError handler to show emoji fallback when image load fails.

- timestamp: 2026-03-02T00:04:00Z
  checked: SuggestionRow.tsx img tag (line 47-51)
  found: Same issue -- no onError handler, no fallback on failed load.
  implication: Same fix needed.

## Resolution

root_cause: |
  Three-layer failure:
  1. (Previously fixed) Missing referrerPolicy="no-referrer" on img tags caused Google to reject requests from unknown referrers.
  2. (PRIMARY - this session) The SW uses CacheFirst + CacheableResponsePlugin({statuses: [0, 200]}) for external images. Cross-origin requests to drive.google.com / googleusercontent.com produce opaque responses (status 0). If ANY request fails (network blip, referrer rejection, transient Google error), the empty/failed opaque response gets cached by CacheFirst and is NEVER re-fetched. Hard reload bypasses SW, fetches from network, and works -- matching the exact user symptom.
  3. No onError handler on <img> tags in CartItem/SuggestionRow, so when SW serves a bad cached response, the img renders blank space instead of falling back to the emoji placeholder.

  Serwist's activate handler only cleans up precache entries (substring "-precache-"), NOT runtime caches like "external-images-v2". So bumping CACHE_VERSION v1->v2 created new cache buckets but old bad entries in v1 were never cleaned. Even v2 can accumulate bad entries.

fix: |
  1. Switch external images from CacheFirst to NetworkFirst with 3s timeout -- network is always tried first, cache is offline fallback only. Bad responses don't persist permanently.
  2. Remove CacheableResponsePlugin({statuses: [0, 200]}) -- NetworkFirst doesn't need it; it will naturally cache successful responses and fall back to cached versions.
  3. Bump CACHE_VERSION v2 -> v3 to bust any stale bad entries in the v2 external-images cache.
  4. Add onError fallback handlers to <img> tags in CartItem and SuggestionRow so if an image fails to load, the emoji fallback renders instead of blank space.
  5. Add activate handler to clean up old versioned runtime caches (external-images-v1, external-images-v2, etc.) on SW activation.

verification: |
  Self-verified:
  - TypeScript: 0 errors
  - ESLint: pass
  - Prettier: pass
  - Vitest: 433/433 tests pass
  - Build: success (SW compiles correctly)
  Awaiting human verification: deploy and confirm cart drawer images render

files_changed:
  - src/app/sw.ts
  - src/components/ui/cart/CartItem/CartItem.tsx
  - src/components/ui/cart/CartPage/SuggestionRow.tsx
