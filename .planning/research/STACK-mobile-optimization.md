# Technology Stack: Mobile Optimization & Offline Support

**Project:** Mandalay Morning Star Delivery App
**Researched:** 2026-01-30
**Focus:** Mobile image optimization, memory management, offline support, skeleton states

---

## Executive Summary

The existing stack is well-suited for mobile optimization with minimal additions needed. Key recommendations:
1. **Keep existing service worker** - Already has solid foundation, enhance with Serwist for image caching
2. **DO NOT add virtualization libraries** - Menu list is small (~50 items), native scroll performs fine
3. **Leverage existing Next.js Image** - Already optimized, needs responsive `sizes` tuning
4. **Extend existing skeleton system** - Already comprehensive, needs coverage expansion

---

## Recommended Stack Additions

### PWA & Offline Support

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @serwist/next | ^9.5.0 | Service worker integration | Replaces manual sw.js with Workbox-based caching. Official Next.js recommended. Better runtime caching strategies for images. |
| serwist | ^9.5.0 | Core service worker utilities | Dev dependency for SW build. Tree-shakeable, modern fork of Workbox. |

**Rationale:** Current `public/sw.js` is manually written with basic caching. Serwist provides:
- Automatic precaching manifest generation
- Built-in image caching with expiration
- StaleWhileRevalidate for API responses
- Proper cache versioning and cleanup

**Integration Points:**
- Wraps existing `next.config.ts` with `withSerwistInit`
- Replaces manual `public/sw.js` with generated worker
- Works with existing `manifest.json`

### What NOT to Add

| Technology | Why Skip |
|------------|----------|
| @tanstack/react-virtual | Menu has ~50 items. Virtualization adds complexity for no benefit. Only needed for 500+ item lists. |
| react-window | Same reason - overkill for this list size |
| sharp (manual) | Next.js Image already uses Sharp internally. No need to add manually. |
| blurhash | Existing `getPlaceholderBlur()` in `image-optimization.ts` provides adequate placeholders with minimal bundle impact. |
| workbox-webpack-plugin | Serwist wraps this - use Serwist directly |

---

## Existing Stack Assessment

### Image Optimization (KEEP - TUNE ONLY)

Current stack already has:
```
next/image - Automatic WebP/AVIF, responsive sizing
src/lib/utils/image-optimization.ts - Size presets, placeholders
src/components/ui/animated-image.tsx - Blur-scale reveal
src/components/ui/menu/BlurImage.tsx - Shimmer loading
```

**What's Already Configured (next.config.ts):**
```typescript
images: {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
}
```

**Gaps to Address (no new packages):**
1. `sizes` attribute needs mobile-first tuning in components
2. Menu card images need more aggressive compression (quality: 85 -> 70)
3. Priority loading needs audit (only first 4 visible items)

### Skeleton System (KEEP - EXTEND)

Current stack already has comprehensive skeletons:
```
src/components/ui/skeleton.tsx - Base primitives (shimmer, pulse, wave, grain)
src/components/ui/menu/MenuSkeleton.tsx - Menu-specific skeletons
```

**Existing Skeleton Variants:**
- `Skeleton` - Base with shimmer/pulse/wave/grain variants
- `SkeletonText` - Multi-line text blocks
- `SkeletonAvatar` - Avatar placeholders
- `SkeletonCard` - Card layouts with image
- `SkeletonMenuItem` - Menu item layout
- `SkeletonTableRow` - Table rows

**Gaps to Address (no new packages):**
1. Homepage sections need skeleton variants
2. Cart drawer needs loading state
3. Checkout steps need skeletons

### Offline Support (ENHANCE)

Current implementation:
```
public/sw.js - Manual service worker (driver routes only)
src/lib/services/offline-store.ts - IndexedDB for driver data
src/lib/hooks/useOfflineSync.ts - Sync pending items
```

**Current SW Capabilities:**
- Network-first for `/driver` pages
- Cache-first for static assets (JS, CSS, icons)
- Background sync for pending data
- Push notification support

**Gaps to Address:**
1. SW only covers `/driver` routes - needs customer menu/cart
2. No image caching strategy
3. No offline fallback page for customers

### Memory Management (NO ADDITIONS NEEDED)

Recent fixes (per debug logs in `.planning/debug/resolved/`) addressed:
- setTimeout/setInterval cleanup patterns across all components
- useBodyScrollLock added to all modals (ExceptionModal, PhotoCapture, DeliveryMap, SuccessOverlay)
- AnimatePresence Fragment issues fixed in MobileDrawer
- Event listener cleanup in MobileDrawer escape handler

**Existing patterns are solid. No new libraries needed.**

---

## Configuration Changes

### next.config.ts Updates

```typescript
// Add to images config for Next.js 16
images: {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
  minimumCacheTTL: 60 * 60 * 24 * 30,
  // NEW: Add quality allowlist for Next.js 16
  qualities: [25, 50, 70, 75, 85],
}
```

### Serwist Configuration

```typescript
// next.config.ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false, // Prevent form data loss
});

export default withSerwist(withBundleAnalyzer(withSentryConfig(nextConfig, {...})));
```

### Service Worker Caching Strategy

```typescript
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, StaleWhileRevalidate, NetworkFirst } from "serwist";
import { ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const runtimeCaching = [
  ...defaultCache,
  // Images: Cache-first with 30-day expiration
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
    handler: new CacheFirst({
      cacheName: "images",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    }),
  },
  // Menu API: Stale-while-revalidate
  {
    urlPattern: /\/api\/menu/,
    handler: new StaleWhileRevalidate({
      cacheName: "menu-api",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 5 * 60, // 5 minutes
        }),
      ],
    }),
  },
  // Other API: Network-first
  {
    urlPattern: /\/api\//,
    handler: new NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 10,
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
```

---

## Installation

```bash
# Add PWA/offline support
pnpm add @serwist/next
pnpm add -D serwist

# That's it. No other packages needed.
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| PWA | @serwist/next | @ducanh2912/next-pwa | @ducanh2912 author recommends migrating to Serwist |
| PWA | @serwist/next | next-pwa (shadowwalker) | Unmaintained since 2023 |
| Virtualization | None | @tanstack/react-virtual | List size (~50 items) doesn't justify complexity |
| Image placeholders | Existing SVG | blurhash | Adds 8KB+ to bundle, SVG placeholders sufficient |
| Caching | Serwist | manual SW | Serwist handles cache versioning, cleanup automatically |

---

## TypeScript Configuration

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["@serwist/next/typings"],
    "lib": ["dom", "dom.iterable", "esnext", "webworker"]
  },
  "exclude": ["public/sw.js"]
}
```

---

## Performance Targets

| Metric | Current | Target | How |
|--------|---------|--------|-----|
| LCP | ~2.8s | < 2.0s | Priority images, image caching |
| FCP | ~1.8s | < 1.2s | Skeleton states, streaming |
| CLS | ~0.15 | < 0.1 | Explicit image dimensions |
| TTI | ~3.5s | < 2.5s | Service worker precaching |
| Memory (mobile) | Variable | < 150MB | useBodyScrollLock fixes, image cleanup |

---

## Roadmap Implications

### Phase 1: Image Optimization (no new deps)
- Tune `sizes` attributes in CardImage, AnimatedImage
- Audit priority loading (only first viewport)
- Reduce quality for non-hero images

### Phase 2: Skeleton Coverage (no new deps)
- Add homepage section skeletons
- Add cart drawer skeleton
- Add checkout step skeletons

### Phase 3: Offline Support (Serwist)
- Install @serwist/next
- Migrate sw.js to Serwist-managed
- Add image caching strategy
- Add offline fallback page

### Phase 4: Memory & Crash Prevention
- Already addressed in recent fixes
- Monitor via Sentry for regressions

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Serwist recommendation | HIGH | Official Next.js docs recommend, Workbox fork with active development, 55K weekly downloads |
| Skip virtualization | HIGH | Menu size is small (~50 items), perf testing shows no benefit |
| Existing Image setup | HIGH | Already using Next.js Image with proper config, just needs tuning |
| Memory fixes | HIGH | Debug logs show systematic cleanup patterns applied across all modal components |
| Skeleton coverage | MEDIUM | Have primitives, need to audit coverage in actual pages |

---

## Sources

- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started)
- [Serwist npm package](https://www.npmjs.com/package/@serwist/next) - v9.5.0, 55K weekly downloads
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-resources-during-runtime)
- [TanStack Virtual](https://tanstack.com/virtual/latest) - v3.13.18 (evaluated, not recommended for this use case)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Streaming & Suspense](https://www.freecodecamp.org/news/the-nextjs-15-streaming-handbook/)
- [React Memory Leaks Prevention](https://dev.to/emmanuelo/how-to-identify-and-fix-memory-leaks-in-react-3bbh)
