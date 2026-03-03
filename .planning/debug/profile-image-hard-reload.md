---
status: awaiting_human_verify
trigger: "profile-image-hard-reload"
created: 2026-03-02T00:00:00Z
updated: 2026-03-02T00:45:00Z
---

## Current Focus

hypothesis: CONFIRMED -- Service Worker CacheFirst strategy cached a stale opaque (status: 0) failure response for the Google OAuth avatar URL. Hard reload bypasses SW so image works; normal loads serve the bad cache entry.
test: Bumped CACHE_VERSION v1→v2 to bust stale SW cache; added onError fallback to AccountIndicator.
expecting: After hard reload (or next SW registration), users get fresh image requests. Even if image still fails, initials show instead of broken icon.
next_action: Human verify the fix resolves the broken avatar issue

## Symptoms

expected: Profile avatar image in the header should render correctly on first load and on client-side navigations without needing a hard reload.
actual: Shows broken image icon. Only renders correctly after hard reload (Ctrl+F5 / cache bypass).
errors: Broken image icon visible — likely the img src is either empty, wrong, or the image hasn't loaded yet when the component renders.
reproduction: Run pnpm dev, navigate to any route group (admin/customer/driver), observe broken avatar image in header, then hard reload — image appears correctly.
started: After v1.9 milestone completion. Likely existed for a while since it affects all route groups.

## Eliminated

- hypothesis: Missing referrerPolicy on img tags
  evidence: referrerPolicy="no-referrer" was already applied in commit e3ae7892 to all img tags including AccountIndicator, DrawerUserSection, AdminLayout. Fix was committed but SW cache still holds stale failure responses from before the fix.
  timestamp: 2026-03-02T00:15:00Z

- hypothesis: Wrong avatar URL or hydration timing issue
  evidence: AccountIndicator correctly shows skeleton while isLoading=true, only renders img when user.user_metadata.avatar_url is truthy. No hydration mismatch. Driver avatarUrl comes from server-rendered layout via React context. Admin layout has no avatar (uses AdminNav which has no avatar).
  timestamp: 2026-03-02T00:20:00Z

- hypothesis: next/image remotePatterns misconfiguration
  evidence: **.supabase.co and **.googleusercontent.com are both configured with correct pathnames. Driver uses unoptimized which bypasses next/image entirely. AccountIndicator uses plain img tag, not next/image.
  timestamp: 2026-03-02T00:22:00Z

- hypothesis: CSP blocking img-src
  evidence: img-src directive includes https://*.supabase.co and https://*.googleusercontent.com. CSP does not block these.
  timestamp: 2026-03-02T00:23:00Z

## Evidence

- timestamp: 2026-03-02T00:05:00Z
  checked: AccountIndicator.tsx
  found: Uses useAuth hook (starts null, isLoading true), shows skeleton while loading, shows img tag with referrerPolicy="no-referrer" once user is set. NO onError handler on img tag — broken image shows as browser broken icon with no fallback.
  implication: If image fails for any reason, broken icon shows instead of initials fallback.

- timestamp: 2026-03-02T00:10:00Z
  checked: src/app/sw.ts - Service Worker
  found: external-images-v1 cache uses CacheFirst strategy with CacheableResponsePlugin accepting status: 0 (opaque cross-origin responses). Matcher includes googleusercontent.com and supabase.co. 30-day expiration.
  implication: CRITICAL -- CacheFirst means the FIRST response is stored permanently (up to 30 days). If a failed opaque response (status 0) was cached before the referrerPolicy fix (commit e3ae7892, Feb 28), the SW serves that cached failure on every subsequent normal load.

- timestamp: 2026-03-02T00:12:00Z
  checked: Hard reload behavior (Ctrl+F5)
  found: Hard reload (Ctrl+F5 with cache bypass) bypasses the Service Worker entirely -- the browser sends requests directly to the network, ignoring SW interception.
  implication: Hard reload forces a fresh network request to Google/Supabase, getting the actual image. This explains exactly why "hard reload works, normal load doesn't."

- timestamp: 2026-03-02T00:15:00Z
  checked: Commit e3ae7892 (fix: resolve Google-hosted image rendering)
  found: referrerPolicy="no-referrer" added to AccountIndicator, DrawerUserSection, AdminLayout. googleusercontent remotePattern widened to **. Fix committed Feb 28 2026.
  implication: The network-level fix is correct, but the SW cached a stale failure response BEFORE this fix was in. The SW cache has a 30-day TTL so it persists.

- timestamp: 2026-03-02T00:20:00Z
  checked: CACHE_VERSION constant in sw.ts
  found: CACHE_VERSION = "v1" -- cache name is "external-images-v1". No version bump was done after e3ae7892. The stale cache from before the fix is still being served.
  implication: Incrementing to v2 creates a new cache name "external-images-v2". The old "external-images-v1" cache entries are abandoned (Serwist cleanup deletes them). Users get fresh image requests on next load.

- timestamp: 2026-03-02T00:25:00Z
  checked: AccountIndicator.tsx img error handling
  found: No onError handler exists. If image src is truthy but image fails to load, browser shows broken icon. DrawerUserSection.tsx HAS an onError handler (lines 53-57) that shows initials fallback. AccountIndicator lacks this defensive pattern.
  implication: Secondary fix: add onError handler to AccountIndicator to show initials fallback if image fails, preventing broken icon regardless of caching state.

- timestamp: 2026-03-02T00:40:00Z
  checked: Self-verification -- lint, typecheck, format:check (changed files), tests
  found: ESLint clean, tsc --noEmit clean, Prettier clean on sw.ts + AccountIndicator.tsx, 432/432 tests pass.
  implication: Fix is mechanically correct, no regressions.

## Resolution

root_cause: |
  The Service Worker (Serwist) external-images cache (CacheFirst strategy) cached a stale opaque failure response (status: 0) for the Google OAuth avatar URL. This happened before commit e3ae7892 (Feb 28) added referrerPolicy="no-referrer" to the img tag. The referrerPolicy fix was correct at the network level, but the SW's CacheFirst strategy serves the cached failure on every subsequent normal page load.
  Hard reload (Ctrl+F5) bypasses the Service Worker entirely, forcing a fresh network request. With referrerPolicy="no-referrer" now in the HTML, the Google image server returns the actual image. This explains the exact symptom: works after hard reload, broken on normal load.
  Secondary issue: AccountIndicator has no onError fallback handler. DrawerUserSection correctly has one. AccountIndicator shows browser broken icon instead of initials when image fails.

fix: |
  1. Incremented CACHE_VERSION in sw.ts from "v1" to "v2". This creates new cache names for all SW caches, abandoning all stale v1 entries including the bad "external-images-v1" responses. On next SW registration, all image requests go fresh to the network.
  2. Added avatarError state + onError handler to AccountIndicator img tag. When the image fails to load, avatarError=true falls back to the initials span instead of showing the browser broken icon.

verification: Awaiting human verification in browser.
files_changed:
  - src/app/sw.ts
  - src/components/ui/layout/AppHeader/AccountIndicator.tsx
