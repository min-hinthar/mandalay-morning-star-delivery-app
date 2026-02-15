# Phase 64: Service Worker Hardening - Research

**Researched:** 2026-02-14
**Domain:** Service worker caching, offline UX, PWA update lifecycle, IndexedDB cart persistence
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Update Banner UX**
- Bottom toast position (consistent with existing toast system)
- Keep auto-reload countdown behavior (10-second countdown)
- Countdown pauses on user interaction (typing, scrolling), resumes after idle
- Dismissible -- re-shows on next navigation
- Force-reload after 3 dismissals (no more dismiss option)
- Defer banner on /cart and /checkout pages (don't interrupt order flow)
- Countdown + "Update Now" button (user can speed it up)
- Progress bar + text countdown (visual shrinking bar alongside "Reloading in 8s")
- Friendly copy: "A fresher version is ready!" + countdown
- Include version number in banner (e.g., "v1.7.2 is ready!")
- Subtle vibration on mobile when banner first appears
- Post-update: brief success toast ("Updated to latest version!")
- Same update behavior for all roles (customer, admin, driver)

**Cache Invalidation Strategy**
- Content-hash per file (not build timestamp) -- only changed assets re-downloaded on deploy
- Menu API cache TTL extended to 15 minutes (from 5 minutes)
- Admin pages: same caching as customer pages (admin API calls are NetworkFirst anyway)
- Silent eviction when cache quota exceeded (current ExpirationPlugin behavior)
- No "Clear Cache" button -- update mechanism handles staleness
- Admin menu cache-bust mechanism: admins can force-invalidate menu cache when updating menu
- Cache hit/miss metrics reported to Sentry/analytics for TTL tuning

**Route Exclusions**
- Auth callback and Sentry tunnel routes excluded from SW interception
- Claude determines which additional routes are dangerous to cache (Stripe webhooks, health endpoint, etc.)

**Offline Fallback Behavior**
- Show last cached version of page when offline (with offline indicator)
- Persistent banner at top of page: "You're offline -- showing cached content" (warning style, red/warning vs blue/info for update)
- When NO cached version exists: branded offline page with links to cached pages
- Offline page is precached (always available)
- Reconnection: "Back online!" toast + manual refresh (user chooses when to refresh)
- Non-queueable actions (Place Order) disabled with tooltip: "You're offline. Connect to place your order."

**Cart Offline Queue**
- Cart actions (add/remove/modify) queueable while offline
- Migrate cart persistence from localStorage to IndexedDB (Zustand persist middleware)
- Offline-queued cart items show "pending sync" badge until confirmed synced
- On reconnect: brief "Cart synced!" toast
- Sync failure: error toast + keep item in cart marked as "unavailable" (user removes manually)

### Claude's Discretion
- Version number source (package.json vs git hash vs timestamp)
- Countdown reset behavior on dismiss + re-show
- Banner animation style (slide up, fade in)
- Banner visual style/color treatment
- Precache scope (app shell only vs broader public assets)
- Content-hash scope (all assets vs JS/CSS only)
- Image cache limits (current 250/30d or adjusted)
- Payment API caching exclusion approach
- Cache-bust mechanism implementation (query param vs server header)
- Cache metrics granularity level
- Background precache behavior (immediate vs on-demand)
- Cross-origin request interception policy
- Font caching strategy
- Driver route special treatment (leveraging Phase 56 offline sync)
- Auth path exclusion scope (/auth/callback only vs /auth/*)
- Health endpoint caching strategy
- Document request caching approach (bypass vs NetworkFirst)
- Pages to precache beyond /, /menu, /cart
- Offline queue implementation (Background Sync API vs custom IndexedDB)
- Push notification offline handling
- Offline page asset strategy (precache vs inline)
- Slow network detection
- Cart localStorage -> IndexedDB migration approach
- Auto-retry on offline page
- Offline/update banner priority when both active

### Deferred Ideas (OUT OF SCOPE)
- Full offline mutation queue for Place Order (cart-only queue for now)
- Profile/settings offline mutations
- Push notification offline action queuing (if not handled in Phase 64)
</user_constraints>

## Summary

This phase transforms the service worker from a basic caching layer into a production-hardened PWA infrastructure. The codebase already has a functioning SW at `src/app/sw.ts` built with Serwist v9.5.4 via a custom esbuild script (`scripts/build-sw.mjs`), registered at root scope `/` in `ServiceWorkerRegistration.tsx`, and a 5-second `UpdatePrompt` component. The driver app has a parallel registration at `/driver` scope via `useServiceWorker.ts` with full IndexedDB-backed offline sync (Phase 56). The critical gap: the build script uses `Date.now()` for precache revisions (every deploy invalidates ALL cached assets), the update banner lacks interaction-pause/dismissal logic/version display, there is no offline fallback page, and the cart persists to localStorage instead of IndexedDB.

The implementation touches five domains: (1) replace `Date.now()` revisions with `@serwist/build` `getManifest()` content-hash generation, (2) rewrite `UpdatePrompt` with 10s countdown, interaction pause, dismissal tracking, progress bar, version display, and page-aware deferral, (3) add `NavigationRoute` with denylist for excluded routes and `fallbacks` for offline page, (4) create branded offline fallback page, (5) migrate cart store from localStorage to IndexedDB via `idb-keyval` + Zustand `createJSONStorage`.

**Primary recommendation:** Use `@serwist/build` `getManifest()` in `build-sw.mjs` to generate content-hashed precache entries, add `NavigationRoute` with `denylist` for auth/monitoring/webhook/health routes, and use `idb-keyval` for the cart IndexedDB migration.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| serwist | ^9.5.4 | SW runtime: precaching, caching strategies, routing | Fork of Workbox; already in use |
| @serwist/next | ^9.5.4 | `defaultCache` runtime caching presets for Next.js | Already provides base cache rules |
| @serwist/build | ^9.5.4 | Build-time manifest generation with content hashes | **Already installed as transitive dep of @serwist/next**; provides `getManifest()` |
| esbuild | ^0.27.2 | SW bundling (Turbopack incompatible with @serwist/next plugin) | Already in use in `build-sw.mjs` |
| zustand | ^5.0.10 | State management with `persist` middleware | Already manages cart state |
| framer-motion | ^12.26.1 | Banner animations | Already used in UpdatePrompt |

### New Dependencies Required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| idb-keyval | ^6.2.1 | Tiny (~600B) IndexedDB wrapper for Zustand persist | Cart localStorage -> IndexedDB migration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| idb-keyval | Raw IndexedDB (like driver offline-store) | idb-keyval is 600B, simpler API, Zustand docs recommend it; raw IDB adds boilerplate for simple key-value needs |
| idb-keyval | zustand-indexeddb | Community package with less adoption; idb-keyval is the Zustand-recommended approach |
| @serwist/build getManifest | Manual crypto.createHash in build script | getManifest handles globbing, hashing, size filtering, dedup automatically; manual approach is error-prone |
| Background Sync API | Custom IndexedDB queue | Background Sync has no Safari/Firefox support; custom queue already exists in driver offline-store pattern; use custom queue |

**Installation:**
```bash
pnpm add idb-keyval
```

## Architecture Patterns

### Current Service Worker Architecture
```
src/
├── app/
│   └── sw.ts                          # SW source (Serwist runtime)
├── components/ui/offline/
│   ├── index.ts                       # Barrel export
│   ├── ServiceWorkerRegistration.tsx   # Root-scope registration (/)
│   ├── UpdatePrompt.tsx               # Current 5s countdown banner
│   ├── OfflineIndicator.tsx           # Online/offline banner
│   └── StaleBadge.tsx                 # Cached data age badge
├── lib/
│   ├── hooks/
│   │   ├── useServiceWorker.ts        # Driver-scope registration (/driver)
│   │   ├── useOfflineSync.ts          # Driver offline queue sync
│   │   └── useCustomerOfflineSync.ts  # Customer online/offline detection
│   ├── services/
│   │   ├── offline-store/             # Driver IndexedDB (Phase 56)
│   │   │   ├── db.ts                  # IDB open/CRUD
│   │   │   ├── stores.ts             # Store operations
│   │   │   ├── sync.ts               # Sync pending items
│   │   │   └── retry.ts              # Exponential backoff
│   │   └── customer-offline-store.ts  # Customer menu cache (IDB)
│   └── stores/
│       └── cart-store.ts              # Zustand + localStorage persist
├── scripts/
│   └── build-sw.mjs                   # esbuild + Date.now() manifest
└── public/
    └── sw.js                          # Built output
```

### Target Architecture After Phase 64
```
src/
├── app/
│   ├── sw.ts                          # Enhanced: NavigationRoute, denylist, fallbacks
│   └── offline/
│       └── page.tsx                   # NEW: Branded offline fallback page
├── components/ui/offline/
│   ├── index.ts                       # Barrel (add OfflineFallback)
│   ├── ServiceWorkerRegistration.tsx   # Enhanced: version tracking
│   ├── UpdatePrompt.tsx               # REWRITE: 10s, pause, dismiss, progress, version
│   ├── OfflineIndicator.tsx           # Enhanced: "showing cached content" variant
│   ├── OfflinePage.tsx                # NEW: Branded offline page component
│   └── StaleBadge.tsx                 # Unchanged
├── lib/
│   ├── hooks/
│   │   ├── useServiceWorker.ts        # Consolidate: single registration for all scopes
│   │   ├── useOfflineSync.ts          # Unchanged (driver)
│   │   ├── useCustomerOfflineSync.ts  # Unchanged
│   │   └── useUpdateBanner.ts         # NEW: interaction pause, dismiss tracking, page awareness
│   ├── services/
│   │   ├── offline-store/             # Unchanged (driver)
│   │   ├── customer-offline-store.ts  # Unchanged
│   │   └── cart-idb-storage.ts        # NEW: idb-keyval StateStorage for Zustand
│   └── stores/
│       └── cart-store.ts              # MODIFIED: IndexedDB storage + migration
├── scripts/
│   └── build-sw.mjs                   # REWRITE: @serwist/build getManifest() for content hashes
└── public/
    └── sw.js                          # Built output (content-hashed entries)
```

### Pattern 1: Content-Hash Precache Manifest with @serwist/build
**What:** Replace `Date.now()` revision with `getManifest()` content-hash generation
**When to use:** Build time, in `build-sw.mjs`
**Example:**
```typescript
// Source: https://serwist.pages.dev/docs/build/inject-manifest
// Source: https://serwist.pages.dev/docs/serwist/guide/precaching
import { getManifest } from "@serwist/build";

const { manifestEntries, count, size } = await getManifest({
  globDirectory: "public",
  globPatterns: ["**/*.{js,css,png,jpg,jpeg,webp,avif,svg,ico,woff,woff2}"],
  globIgnores: ["sw.js", "sw.js.map"],
  // Assets with hash in filename don't need revision
  dontCacheBustURLsMatching: /\.[a-f0-9]{8,}\./,
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
  // Add key pages as additional entries
  additionalPrecacheEntries: [
    { url: "/", revision: gitRevision },
    { url: "/menu", revision: gitRevision },
    { url: "/cart", revision: gitRevision },
    { url: "/offline", revision: gitRevision },
  ],
});

// manifestEntries format:
// [{ url: "/icons/icon-192.png", revision: "a3f2e8..." }, ...]
// [{ url: "/styles/app.0c9a31.css", revision: null }]  // hash in URL
```

### Pattern 2: NavigationRoute with Denylist
**What:** Handle navigation requests with fallback, excluding dangerous routes
**When to use:** In `sw.ts`, after Serwist constructor
**Example:**
```typescript
// Source: https://serwist.pages.dev/docs/serwist/runtime-caching/routing/navigation-route
import { NavigationRoute, NetworkFirst } from "serwist";

const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: "navigations-v1",
    networkTimeoutSeconds: 3,
  }),
  {
    denylist: [
      /^\/auth\/callback/,
      /^\/monitoring/,         // Sentry tunnel route
      /^\/api\//,              // All API routes
    ],
  }
);

serwist.registerRoute(navigationRoute);
```

### Pattern 3: Offline Fallback with setCatchHandler
**What:** Serve branded offline page when network AND cache both fail
**When to use:** In `sw.ts`
**Example:**
```typescript
// Source: https://serwist.pages.dev/docs/serwist/runtime-caching/routing
serwist.setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const match = await serwist.matchPrecache("/offline");
    return match || Response.error();
  }
  return Response.error();
});
```

### Pattern 4: Zustand Persist with idb-keyval (IndexedDB)
**What:** Replace localStorage with IndexedDB for cart persistence
**When to use:** In cart-store.ts
**Example:**
```typescript
// Source: https://github.com/pmndrs/zustand/blob/v5.0.8/docs/integrations/persisting-store-data.md
import { get, set, del } from "idb-keyval";
import { createJSONStorage, StateStorage } from "zustand/middleware";

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

// In cart store:
persist(storeFunction, {
  name: "mms-cart",
  storage: createJSONStorage(() => idbStorage),
  partialize: (state) => ({ items: state.items }),
});
```

### Pattern 5: Interaction-Aware Update Banner
**What:** Pause countdown on user interaction, resume after idle
**When to use:** In UpdatePrompt rewrite
**Example:**
```typescript
// Listen for user interaction to pause countdown
useEffect(() => {
  if (!showPrompt || isPaused) return;

  const pause = () => setIsPaused(true);
  const events = ["scroll", "keydown", "touchstart", "mousedown"];
  events.forEach(e => window.addEventListener(e, pause, { passive: true }));

  return () => {
    events.forEach(e => window.removeEventListener(e, pause));
  };
}, [showPrompt, isPaused]);

// Resume after idle period (e.g., 3 seconds)
useEffect(() => {
  if (!isPaused) return;
  const timer = setTimeout(() => setIsPaused(false), 3000);
  return () => clearTimeout(timer);
}, [isPaused]);
```

### Anti-Patterns to Avoid
- **Date.now() as revision:** Every deploy re-downloads ALL assets regardless of changes. Use content hashes.
- **skipWaiting: true in constructor:** Causes mid-session code swaps. Use manual skip-waiting via message pattern (already correct in codebase).
- **Caching document requests with CacheFirst:** Stale HTML breaks hydration. Use NetworkFirst or bypass.
- **Caching auth/webhook routes:** Auth callbacks need fresh redirects; webhooks need signature verification from raw body.
- **Synchronous localStorage assumption after IndexedDB migration:** IndexedDB is async; store won't hydrate on first render. Must handle hydration delay.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Precache manifest generation | Manual file hashing in build script | `@serwist/build` `getManifest()` | Handles globbing, hashing (md5), size limits, dedup, URL normalization |
| IndexedDB key-value storage | Raw IndexedDB open/transaction/objectStore | `idb-keyval` (~600B) | Promise-based API, handles upgrades, no store setup needed |
| Navigation route matching | Custom `fetch` event handler with URL parsing | `NavigationRoute` from serwist | Handles mode=navigate detection, allowlist/denylist, falls through correctly |
| Cache versioning | Manual cache name tracking + deletion | Serwist precache lifecycle | Automatic old cache cleanup on SW activation |
| Offline detection | Custom navigator.onLine polling | Existing `useCustomerOfflineSync` + `OfflineIndicator` | Already built and tested in Phase 56 |

**Key insight:** The codebase already has most offline infrastructure from Phase 56 (driver app). Phase 64 extends it to all routes rather than rebuilding from scratch.

## Common Pitfalls

### Pitfall 1: Dual Service Worker Registration Conflict
**What goes wrong:** `ServiceWorkerRegistration.tsx` registers at `/` scope, `useServiceWorker.ts` registers at `/driver` scope. Two registrations for the same SW file creates confusion -- the `/` scope SW controls all routes including `/driver`, making the `/driver` scope registration redundant.
**Why it happens:** Phase 56 added driver-specific registration before root-scope existed.
**How to avoid:** Consolidate to single root-scope registration in `ServiceWorkerRegistration.tsx`. Remove the `/driver` scope registration from `useServiceWorker.ts` or refactor it to only listen for messages/updates without re-registering.
**Warning signs:** `navigator.serviceWorker.getRegistrations()` returns 2+ registrations.

### Pitfall 2: IndexedDB Async Hydration Flash
**What goes wrong:** After migrating cart from localStorage (sync) to IndexedDB (async), the cart appears empty on first render until hydration completes.
**Why it happens:** Zustand's `createJSONStorage` with async storage hydrates in a microtask, not synchronously.
**How to avoid:** Use Zustand's `onRehydrateStorage` callback to track hydration state. Show skeleton/loading state during hydration. Consider migrating existing localStorage data to IndexedDB on first load.
**Warning signs:** Cart count shows 0 momentarily, then jumps to correct count.

### Pitfall 3: Offline Page Not Available (Not Precached)
**What goes wrong:** The offline fallback page returns a generic browser error because it wasn't in the precache manifest.
**Why it happens:** Next.js App Router pages are dynamically rendered; they're not static files in `public/`. The offline page URL must be explicitly added to `additionalPrecacheEntries`.
**How to avoid:** Create offline page as a static route. Add it to `additionalPrecacheEntries` in build script. Verify with Lighthouse or DevTools > Application > Cache Storage.
**Warning signs:** `serwist.matchPrecache("/offline")` returns undefined in setCatchHandler.

### Pitfall 4: Sentry Tunnel Route Caching
**What goes wrong:** SW intercepts `/monitoring` requests (Sentry tunnel), caches or modifies them, breaking Sentry error reporting.
**Why it happens:** The Sentry tunnel is configured as `tunnelRoute: "/monitoring"` in `next.config.ts`. Without explicit exclusion, the SW may try to cache these POST requests.
**How to avoid:** Add `/^\/monitoring/` to the NavigationRoute denylist AND ensure no runtime caching matcher captures `/monitoring`. API routes (POST) won't match `NavigationRoute` (GET navigate mode only), but a broad `fetch` handler could.
**Warning signs:** Sentry events stop appearing in dashboard after SW hardening deploy.

### Pitfall 5: Update Banner During Checkout
**What goes wrong:** Auto-reload during payment flow causes failed Stripe session, lost cart state.
**Why it happens:** Countdown-based auto-reload doesn't check which page the user is on.
**How to avoid:** Check `window.location.pathname` against deferral list (`/cart`, `/checkout`). Suppress banner entirely on these routes. Show it on next navigation to a non-sensitive page.
**Warning signs:** Customer reports payment failure after seeing update banner.

### Pitfall 6: Content-Hash Scope Mismatch
**What goes wrong:** Next.js `_next/static/` chunks already have content hashes in filenames, but the build script generates redundant revision hashes for them, bloating the manifest.
**Why it happens:** `getManifest()` runs against `public/` dir which doesn't contain Next.js build output. Next.js chunks are served from `.next/static/` which maps to `/_next/static/` at runtime.
**How to avoid:** Only use `getManifest()` for `public/` assets. Next.js build output is handled by `defaultCache` runtime caching (StaleWhileRevalidate for scripts/styles). The `dontCacheBustURLsMatching` regex handles hash-named files.
**Warning signs:** Precache manifest contains hundreds of `_next/static/` entries.

## Code Examples

### Example 1: Revised build-sw.mjs with Content Hashing
```javascript
// scripts/build-sw.mjs
import { getManifest } from "@serwist/build";
import { build } from "esbuild";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(__dirname, "..");
const gitRevision = spawnSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf-8",
}).stdout.trim() || crypto.randomUUID();

// Generate content-hashed manifest from public/
const { manifestEntries, count, size } = await getManifest({
  globDirectory: resolve(projectRoot, "public"),
  globPatterns: ["**/*.{png,jpg,jpeg,webp,avif,svg,ico,woff,woff2}"],
  globIgnores: ["sw.js", "sw.js.map", "videos/**"],
  dontCacheBustURLsMatching: /\.[a-f0-9]{8,}\./,
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  additionalPrecacheEntries: [
    { url: "/", revision: gitRevision },
    { url: "/menu", revision: gitRevision },
    { url: "/cart", revision: gitRevision },
    { url: "/offline", revision: gitRevision },
  ],
});

// Build with esbuild, inject manifest
await build({
  entryPoints: [SW_SRC],
  outfile: SW_DEST,
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  format: "iife",
  target: ["chrome90", "firefox90", "safari15"],
  define: {
    "self.__SW_MANIFEST": JSON.stringify(manifestEntries),
  },
  banner: {
    js: `// Built: ${new Date().toISOString()} | Entries: ${count} | Size: ${size}`,
  },
});
```

### Example 2: Enhanced sw.ts with NavigationRoute and Fallbacks
```typescript
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import { Serwist, NavigationRoute, NetworkFirst } from "serwist";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // ... existing cache rules (images, menu API, static assets)
    ...defaultCache.filter(/* exclude document handlers */),
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Navigation: NetworkFirst with denylist for excluded routes
serwist.registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "navigations-v1",
      networkTimeoutSeconds: 3,
    }),
    {
      denylist: [
        /^\/auth\//,            // Auth callback + expired
        /^\/monitoring/,        // Sentry tunnel
        /^\/api\//,             // All API routes (handled separately)
      ],
    }
  )
);

serwist.addEventListeners();
```

### Example 3: Cart IDB Storage with Migration
```typescript
// src/lib/services/cart-idb-storage.ts
import { get, set, del } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

export const cartIDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Migration: check localStorage first on initial read
    const idbValue = await get(name);
    if (idbValue) return idbValue as string;

    // Migrate from localStorage if exists
    if (typeof window !== "undefined") {
      const lsValue = localStorage.getItem(name);
      if (lsValue) {
        await set(name, lsValue);
        localStorage.removeItem(name);
        return lsValue;
      }
    }
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
```

### Example 4: Version Number from package.json at Build Time
```javascript
// In build-sw.mjs or next.config.ts
import { readFileSync } from "fs";
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const APP_VERSION = pkg.version; // "0.1.0"

// Expose as env var in next.config.ts:
// env: { NEXT_PUBLIC_APP_VERSION: pkg.version }
// Or inject into SW build:
// define: { "self.__APP_VERSION": JSON.stringify(pkg.version) }
```

## Codebase-Specific Findings

### Current State (What Exists)
| Component | File | Status | Issue |
|-----------|------|--------|-------|
| SW source | `src/app/sw.ts` | Working | No NavigationRoute, no denylist, no fallback |
| Build script | `scripts/build-sw.mjs` | Working | Uses `Date.now()` for ALL revisions |
| Root registration | `ServiceWorkerRegistration.tsx` | Working | No version tracking |
| Driver registration | `useServiceWorker.ts` | Working | Redundant `/driver` scope |
| Update banner | `UpdatePrompt.tsx` | Working | 5s countdown, no pause, no version, no page deferral |
| Offline indicator | `OfflineIndicator.tsx` | Working | Basic online/offline, no "cached content" messaging |
| Driver offline store | `lib/services/offline-store/` | Complete | IndexedDB + retry + sync (Phase 56) |
| Customer offline store | `lib/services/customer-offline-store.ts` | Working | Menu cache only |
| Cart store | `lib/stores/cart-store.ts` | Working | localStorage via Zustand persist |
| Toast system | `lib/hooks/useToastV8.ts` + `Toast.tsx` | Working | Imperative API: `toast({ message, type })` |

### Routes to Exclude from SW Interception
| Route | Reason | Type |
|-------|--------|------|
| `/auth/callback` | OAuth code exchange, must hit server fresh | Server redirect |
| `/auth/*` | All auth routes should bypass SW | Auth flow |
| `/monitoring` | Sentry tunnel (configured in `next.config.ts` line 175) | POST to Sentry |
| `/api/webhooks/stripe` | Stripe signature verification requires raw body | Webhook POST |
| `/api/webhooks/resend` | Resend webhook delivery | Webhook POST |
| `/api/health` | Health check must always be live | GET |
| `/api/checkout/session` | Stripe session creation | POST |
| `/api/cron/*` | Cron job endpoints | Server-side |

**Note:** API routes (`/api/*`) are POST/PATCH/DELETE which won't match `NavigationRoute` (mode=navigate only). The denylist in NavigationRoute only matters for GET document requests. Runtime caching matchers that use `request.destination` or URL matching handle API exclusions. Current SW only has specific matchers (images, menu API, static assets), so unmatched API routes already fall through to network.

### Precache Scope Recommendation
| Asset | Strategy | Rationale |
|-------|----------|-----------|
| `/icons/icon-192.png` | Precache (content-hash) | App icon, small, critical |
| `/icons/icon-512.png` | Precache (content-hash) | App icon, used for install |
| `/logo.png` | Precache (content-hash) | Brand logo, critical |
| `/manifest.json` | Precache (git revision) | PWA manifest |
| `/`, `/menu`, `/cart` | Precache (git revision) | Core customer pages |
| `/offline` | Precache (git revision) | Offline fallback (mandatory) |
| `/images/sunset_ubein.png` | Runtime cache (CacheFirst) | 2MB, too large to precache |
| `/_next/static/**` | Runtime cache (StaleWhileRevalidate via defaultCache) | Next.js build output, already hashed |

### Version Number Recommendation
**Use `package.json` version** (currently `"0.1.0"`).
- Stable, human-readable, meaningful to users
- Already in `package.json`, no extra tooling needed
- Expose as `NEXT_PUBLIC_APP_VERSION` environment variable in `next.config.ts`
- Git hash is too long/cryptic for user-facing banner
- Timestamp conveys no meaning ("v1706803200"?)

### Cart Migration Strategy
**One-time transparent migration with fallback:**
1. Custom `StateStorage` wrapper checks IndexedDB first via `idb-keyval`
2. If empty, checks localStorage for existing `"mms-cart"` key
3. If found in localStorage, writes to IndexedDB, deletes from localStorage
4. All subsequent reads/writes go to IndexedDB
5. Zustand `onRehydrateStorage` callback tracks hydration completion
6. Cart UI shows skeleton during async hydration (sub-100ms in practice)

### Offline Queue for Cart
**Use custom IndexedDB queue (not Background Sync API):**
- Background Sync has no Safari or Firefox support (Chromium-only)
- Project already has an IndexedDB queue pattern in `offline-store/` (driver app)
- Cart actions are local-first (Zustand state) -- they don't need server sync
- The cart IS the offline queue: items persist in IndexedDB, sync when user places order online
- "Pending sync" badge is purely a UI indicator -- cart state is already persisted
- No actual queue needed for add/remove/modify since cart is client-side state

**Clarification:** The "cart offline queue" requirement translates to:
1. Cart persists in IndexedDB (survives SW cache clear, app close)
2. Cart actions work offline (they already do -- it's client-side state)
3. Visual indicator ("pending sync" badge) shows items added while offline
4. On reconnect, show "Cart synced!" toast (cart was never un-synced, just offline)
5. The "sync" concept only applies if menu prices changed while offline -- validate on reconnect

### Admin Menu Cache-Bust Mechanism
**Server header approach (recommended over query param):**
- Admin menu save API (`/api/admin/menu`) returns `X-Menu-Cache-Version` header
- Client-side: after menu update, call `caches.open("menu-api-cache-v1")` and delete matching entries
- Or: bump a version key in Supabase that the menu API checks, returning `Cache-Control: no-cache` when version changes
- Simpler: menu API already uses `NetworkFirst` -- cache is just a 15min fallback, not the primary source

### Cache Metrics Implementation
**Lightweight approach using existing analytics:**
- Add `performance.mark()` / `performance.measure()` in SW fetch handler
- Report via existing `/api/analytics/vitals` endpoint
- Track: cache hit rate per cache name, average response time, precache success rate
- Use Sentry breadcrumbs for individual cache events (LOW granularity recommended to avoid noise)

### Banner Priority (Offline vs Update)
**Offline banner wins, update banner deferred:**
- If offline: show offline banner (top, warning style)
- If update available while offline: suppress update banner (can't reload without network)
- If online + update available: show update banner (bottom toast position)
- Both banners never show simultaneously

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Date.now()` revision for all | Content-hash per file | Phase 64 | Only changed files re-downloaded |
| 5s auto-reload countdown | 10s with interaction pause | Phase 64 | Better UX, no mid-action reloads |
| No offline fallback | Branded offline page + NavigationRoute | Phase 64 | Graceful offline degradation |
| localStorage cart | IndexedDB cart via idb-keyval | Phase 64 | Survives cache clear, better SW integration |
| Separate /driver and / SW registrations | Single / registration | Phase 64 | No duplicate registration conflict |

**Deprecated/outdated:**
- `@serwist/next` Webpack plugin approach: Not compatible with Turbopack. Custom esbuild build already in use.
- Workbox (pre-Serwist): Serwist is the maintained fork, already in use.

## Open Questions

1. **Should `_next/static/` chunks be precached or only runtime-cached?**
   - What we know: Next.js generates uniquely hashed filenames. `defaultCache` already provides StaleWhileRevalidate for scripts/styles.
   - What's unclear: Whether precaching build output improves first-load for returning visitors vs just runtime caching.
   - Recommendation: Keep runtime caching only. Precaching Next.js build output is fragile (paths change per build) and `defaultCache` handles it well.

2. **How to handle the `/offline` page in Next.js App Router?**
   - What we know: App Router pages are server-rendered by default. The offline page must be precacheable as a static HTML document.
   - What's unclear: Whether to use `generateStaticParams` + `force-static`, or create a plain HTML file in `public/`.
   - Recommendation: Create as App Router page at `src/app/offline/page.tsx` with `export const dynamic = "force-static"`. This gets generated as static HTML at build time and can be precached by URL `/offline`.

3. **Dual registration cleanup -- will removing `/driver` scope break anything?**
   - What we know: `ServiceWorkerRegistration.tsx` already registers at `/` scope (controls all routes including `/driver`). `useServiceWorker.ts` registers a second time at `/driver` scope.
   - What's unclear: Whether driver features depend on the `/driver`-scoped registration specifically.
   - Recommendation: The root `/` scope SW controls `/driver/*` routes. Remove the scope parameter from `useServiceWorker.ts` and have it use `getRegistration()` instead of `register()`. Keep the message listeners and sync request handlers.

## Sources

### Primary (HIGH confidence)
- Serwist official docs (`/websites/serwist_pages_dev`) - precaching, NavigationRoute, fallbacks, caching strategies
- Zustand official docs (`/pmndrs/zustand/v5.0.8`) - persist middleware, custom IndexedDB storage with idb-keyval
- Codebase inspection - `sw.ts`, `build-sw.mjs`, `UpdatePrompt.tsx`, `cart-store.ts`, `offline-store/`, `next.config.ts`

### Secondary (MEDIUM confidence)
- [Serwist precaching guide](https://serwist.pages.dev/docs/serwist/guide/precaching) - manifest format, revision strategies
- [Serwist NavigationRoute docs](https://serwist.pages.dev/docs/serwist/runtime-caching/routing/navigation-route) - allowlist/denylist
- [Serwist @serwist/build docs](https://serwist.pages.dev/docs/build/inject-manifest) - injectManifest/getManifest
- [Zustand persist with idb-keyval discussion](https://github.com/pmndrs/zustand/discussions/2084) - migration patterns
- [Zustand IndexedDB discussion](https://github.com/pmndrs/zustand/discussions/1721) - async hydration considerations

### Tertiary (LOW confidence)
- Background Sync API browser support claims (based on web search, not verified against caniuse data directly)
- idb-keyval bundle size claim (~600B) -- from npm listing, not independently verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use or have official Zustand/Serwist documentation
- Architecture: HIGH - patterns verified from Serwist docs + existing codebase patterns
- Pitfalls: HIGH - identified from codebase inspection (dual registration, Date.now() revision, checkout flow)
- Cart migration: MEDIUM - idb-keyval + Zustand is documented but async hydration behavior needs runtime validation

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable libraries, no breaking changes expected)
