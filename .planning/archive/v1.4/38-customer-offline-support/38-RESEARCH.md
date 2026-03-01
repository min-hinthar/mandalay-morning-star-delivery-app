# Phase 38: Customer Offline Support - Research

**Researched:** 2026-02-04
**Domain:** Service Workers, PWA Caching, Offline-First Architecture
**Confidence:** HIGH

## Summary

Phase 38 implements offline support for customers using Serwist (@serwist/next), the maintained successor to next-pwa. The project already uses Next.js 16 with App Router and has an existing IndexedDB-based offline store for drivers (`offline-store.ts`) that provides a proven pattern for creating a customer-specific variant.

Key implementation decisions from CONTEXT.md:

- Fixed amber banner at top for offline indicator, slides down/up animation
- Stale badge above menu grid with relative timestamps ("Cached 2 hours ago")
- Stale-while-revalidate strategy, 24hr stale threshold, 50MB max, LRU eviction
- Update banner at bottom with 5-second auto-refresh countdown
- Cart works offline, checkout disabled

**Primary recommendation:** Use `@serwist/next` with custom runtime caching rules, explicitly avoiding HTML/RSC payload caching to prevent App Router conflicts. Create a separate customer IndexedDB store for menu data caching with timestamp-based staleness.

## Standard Stack

### Core

| Library       | Version | Purpose                            | Why Standard                                         |
| ------------- | ------- | ---------------------------------- | ---------------------------------------------------- |
| @serwist/next | latest  | Next.js service worker integration | Official Next.js PWA solution, successor to next-pwa |
| serwist       | latest  | Service worker runtime (dev dep)   | Core Serwist functionality                           |
| date-fns      | 4.1.0   | Relative timestamps                | Already in project, `formatDistanceToNow`            |

### Supporting

| Library       | Version | Purpose                  | When to Use                               |
| ------------- | ------- | ------------------------ | ----------------------------------------- |
| zustand       | 5.0.10  | Offline state management | Already in project for cart/driver stores |
| framer-motion | 12.26.1 | Banner animations        | Already in project                        |

### Alternatives Considered

| Instead of              | Could Use            | Tradeoff                                       |
| ----------------------- | -------------------- | ---------------------------------------------- |
| Serwist                 | Workbox directly     | Serwist wraps Workbox, optimized for Next.js   |
| IndexedDB               | localStorage         | localStorage has 5MB limit, no structured data |
| Custom online detection | react-detect-offline | Custom hook is simpler, no extra dependency    |

**Installation:**

```bash
pnpm add @serwist/next
pnpm add -D serwist
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  app/
    sw.ts                           # Service worker source
  lib/
    services/
      customer-offline-store.ts     # IndexedDB for menu cache
    hooks/
      useCustomerOfflineSync.ts     # Online/offline detection
  components/
    ui/
      offline/
        OfflineIndicator.tsx        # Top amber banner
        StaleBadge.tsx              # "Cached X ago" badge
        UpdatePrompt.tsx            # Bottom update banner
```

### Pattern 1: Service Worker Configuration

**What:** Configure Serwist with custom caching strategies per resource type
**When to use:** Initial service worker setup
**Example:**

```typescript
// Source: https://serwist.pages.dev/docs/next/getting-started
// app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import { Serwist, CacheFirst, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin } from "serwist";

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // Manual update control
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Images - CacheFirst with 30-day expiration (OFFLINE-03)
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new CacheFirst({
        cacheName: "images-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // Menu API - NetworkFirst with 5-minute stale (OFFLINE-04)
    {
      matcher: ({ url }) => url.pathname === "/api/menu",
      handler: new NetworkFirst({
        cacheName: "menu-api-cache",
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 1,
            maxAgeSeconds: 5 * 60, // 5 minutes
          }),
        ],
      }),
    },
    // Static assets - StaleWhileRevalidate (OFFLINE-05)
    {
      matcher: ({ request }) =>
        request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "font",
      handler: new StaleWhileRevalidate({
        cacheName: "static-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
    // Spread defaultCache for remaining Next.js assets
    ...defaultCache,
  ],
});

// Listen for skip waiting message (OFFLINE-11)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

serwist.addEventListeners();
```

### Pattern 2: Online/Offline Detection Hook

**What:** Custom React hook using navigator.onLine and event listeners
**When to use:** Any component needing online status
**Example:**

```typescript
// Source: https://peerlist.io/himanshuhere/articles/detecting-online-offline-status-in-react-with-typescript
// src/lib/hooks/useCustomerOfflineSync.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export function useCustomerOfflineSync() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Show "Back online" for 3 seconds
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
```

### Pattern 3: IndexedDB Menu Cache Store

**What:** Timestamp-based cache store following existing offline-store.ts pattern
**When to use:** Storing menu data for offline access with staleness tracking
**Example:**

```typescript
// Based on existing pattern: src/lib/services/offline-store.ts
// src/lib/services/customer-offline-store.ts
"use client";

const DB_NAME = "mms-customer-offline";
const DB_VERSION = 1;
const STORES = {
  MENU_CACHE: "menu-cache",
} as const;

interface MenuCache {
  id: "current"; // Single record
  data: unknown;
  cachedAt: string;
  version: string;
}

export const menuCache = {
  async save(data: unknown, version: string): Promise<void> {
    await addToStore(STORES.MENU_CACHE, {
      id: "current",
      data,
      cachedAt: new Date().toISOString(),
      version,
    } as MenuCache);
  },

  async get(): Promise<{ data: unknown; cachedAt: string; version: string } | null> {
    const cached = await getFromStore<MenuCache>(STORES.MENU_CACHE, "current");
    if (!cached) return null;
    return { data: cached.data, cachedAt: cached.cachedAt, version: cached.version };
  },

  isStale(cachedAt: string, thresholdHours = 24): boolean {
    const cacheTime = new Date(cachedAt).getTime();
    const now = Date.now();
    return now - cacheTime > thresholdHours * 60 * 60 * 1000;
  },
};
```

### Pattern 4: Service Worker Update Prompt

**What:** Detect waiting service worker and prompt user to update
**When to use:** When new service worker version is available
**Example:**

```typescript
// Source: https://developer.chrome.com/docs/workbox/handling-service-worker-updates
// src/components/ui/offline/UpdatePrompt.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowPrompt(true);
          }
        });
      });
    });

    // Check for existing waiting worker
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        setWaitingWorker(reg.waiting);
        setShowPrompt(true);
      }
    });
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      // Reload when new worker takes control
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }, [waitingWorker]);

  return { showPrompt, countdown, setCountdown, setShowPrompt, applyUpdate };
}
```

### Anti-Patterns to Avoid

- **Caching HTML/RSC payloads:** Causes App Router navigation issues; explicitly exclude document requests
- **Using skipWaiting: true by default:** Prevents controlled update experience; use message-based approach
- **Caching /api/auth routes:** Auth should always be network-only
- **Not checking for SSR:** Always guard navigator/window checks with typeof checks

## Don't Hand-Roll

| Problem                     | Don't Build             | Use Instead                       | Why                                           |
| --------------------------- | ----------------------- | --------------------------------- | --------------------------------------------- |
| Service worker registration | Custom SW setup         | @serwist/next withSerwistInit     | Handles Next.js specifics, manifest injection |
| Cache expiration            | Manual timestamp checks | ExpirationPlugin                  | Handles LRU, quota errors, cleanup            |
| Relative time formatting    | Custom date math        | date-fns formatDistanceToNow      | i18n support, edge cases handled              |
| IndexedDB wrapper           | Raw IndexedDB API       | Existing offline-store.ts pattern | Already proven in codebase                    |

**Key insight:** Service worker caching is deceptively complex. Browser cache quota, opaque response handling, and App Router RSC payloads create edge cases that Serwist handles.

## Common Pitfalls

### Pitfall 1: Caching RSC Payloads

**What goes wrong:** App Router requests include RSC header, caching these causes navigation to show raw JSON or infinite loading
**Why it happens:** Service worker intercepts all fetch requests including RSC prefetches
**How to avoid:** Explicitly exclude document requests and RSC requests from caching; do NOT cache any request with `Rsc: 1` header or `_rsc` parameter
**Warning signs:** Pages show JSON instead of HTML, navigation breaks after deployment

### Pitfall 2: Development Cache Hell

**What goes wrong:** Old service worker serves stale assets, "I changed the code but nothing changed!"
**Why it happens:** Service worker is installed and cached, updates require manual unregister
**How to avoid:** Disable Serwist in development: `disable: process.env.NODE_ENV === "development"`
**Warning signs:** Changes not appearing, DevTools shows old files

### Pitfall 3: Forced Page Refresh on Reconnect

**What goes wrong:** User filling form, goes offline then online, page reloads and loses data
**Why it happens:** Some PWA configs set `reloadOnOnline: true`
**How to avoid:** Set `reloadOnOnline: false`, let app handle reconnection gracefully
**Warning signs:** Customer complaints about lost cart/form data

### Pitfall 4: Quota Exceeded Errors

**What goes wrong:** Cache fills up, new assets fail to cache, app breaks offline
**Why it happens:** No cache size limits, images cached indefinitely
**How to avoid:** Set `maxEntries` on all caches, enable `purgeOnQuotaError: true`
**Warning signs:** Console errors about quota, IndexedDB errors

### Pitfall 5: Stale Cache on Menu Update

**What goes wrong:** Menu prices/items change but customers see old data
**Why it happens:** NetworkFirst still serves cache when network slow, no staleness indication
**How to avoid:** Track cache timestamp, show stale indicator, limit stale threshold to 24 hours
**Warning signs:** Customer orders item that's sold out, sees old prices

## Code Examples

### Next.js Config with Serwist

```typescript
// Source: https://serwist.pages.dev/docs/next/getting-started
// next.config.ts
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // OFFLINE-06: Do NOT cache HTML/RSC
  cacheOnNavigation: false,
});

const nextConfig: NextConfig = {
  // ... existing config
};

export default withSerwist(nextConfig);
```

### Offline Indicator Component

```typescript
// Following existing Toast.tsx pattern
// src/components/ui/offline/OfflineIndicator.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useCustomerOfflineSync } from "@/lib/hooks/useCustomerOfflineSync";
import { zIndex } from "@/lib/design-system/tokens/z-index";
import { cn } from "@/lib/utils/cn";

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useCustomerOfflineSync();
  const showBanner = !isOnline || wasOffline;
  const isReconnected = isOnline && wasOffline;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          role="alert"
          aria-live="polite"
          className={cn(
            "fixed top-0 left-0 right-0",
            "flex items-center justify-center gap-2",
            "px-4 py-3",
            isReconnected
              ? "bg-status-success text-text-inverse"
              : "bg-status-warning text-text-inverse"
          )}
          style={{ zIndex: zIndex.fixed }}
        >
          {isReconnected ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Back online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">You are offline</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Stale Badge Component

```typescript
// Using existing Badge component pattern
// src/components/ui/offline/StaleBadge.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCustomerOfflineSync } from "@/lib/hooks/useCustomerOfflineSync";

interface StaleBadgeProps {
  cachedAt: string | null;
}

export function StaleBadge({ cachedAt }: StaleBadgeProps) {
  const { isOnline } = useCustomerOfflineSync();

  // Only show when offline with cached data
  if (isOnline || !cachedAt) return null;

  const relativeTime = formatDistanceToNow(new Date(cachedAt), { addSuffix: true });

  return (
    <Badge variant="status-warning" showIcon icon={Clock} size="sm">
      Cached {relativeTime}
    </Badge>
  );
}
```

### TypeScript Configuration Updates

```json
// tsconfig.json additions
{
  "compilerOptions": {
    "types": ["@serwist/next/typings"],
    "lib": ["dom", "dom.iterable", "esnext", "webworker"]
  },
  "exclude": ["public/sw.js"]
}
```

## State of the Art

| Old Approach           | Current Approach                  | When Changed | Impact                                     |
| ---------------------- | --------------------------------- | ------------ | ------------------------------------------ |
| next-pwa               | @serwist/next                     | 2024         | next-pwa unmaintained, Serwist is the fork |
| workbox-window         | Serwist built-in                  | 2024         | Simpler API, same functionality            |
| Manual SW registration | withSerwistInit auto-registration | Current      | Less boilerplate                           |

**Deprecated/outdated:**

- next-pwa: No longer maintained, use @serwist/next instead
- workbox-build standalone: Serwist wraps and simplifies
- Service Worker caching HTML in App Router: Causes RSC conflicts, avoid

## Open Questions

1. **Cache Size Monitoring**
   - What we know: 50MB limit specified, ExpirationPlugin has maxEntries
   - What's unclear: No direct byte-based limit in Serwist
   - Recommendation: Estimate maxEntries based on average image size (~200KB = ~250 images for 50MB budget)

2. **Service Worker in Storybook**
   - What we know: Development should disable SW
   - What's unclear: Storybook isolation
   - Recommendation: Disable via environment check, mock useCustomerOfflineSync in stories

## Sources

### Primary (HIGH confidence)

- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started) - Installation, configuration, sw.ts structure
- [Serwist Runtime Caching](https://serwist.pages.dev/docs/serwist/runtime-caching/caching-strategies) - CacheFirst, NetworkFirst, StaleWhileRevalidate
- [Serwist ExpirationPlugin](https://serwist.pages.dev/docs/serwist/runtime-caching/plugins/expiration-plugin) - maxEntries, maxAgeSeconds, purgeOnQuotaError
- [Chrome Workbox Service Worker Updates](https://developer.chrome.com/docs/workbox/handling-service-worker-updates) - Update prompt pattern

### Secondary (MEDIUM confidence)

- [Next.js Caching Guide](https://nextjs.org/docs/app/guides/caching) - RSC cache behavior, conflicts
- [Building Offline Apps with Next.js and Serwist (DEV.to)](https://dev.to/sukechris/building-offline-apps-with-nextjs-and-serwist-2cbj) - Development tips, gotchas
- [Detecting Online/Offline in React](https://peerlist.io/himanshuhere/articles/detecting-online-offline-status-in-react-with-typescript) - navigator.onLine pattern
- [date-fns formatDistanceToNow](https://date-fns.org/docs/formatDistanceToNow) - Relative time API

### Tertiary (LOW confidence)

- GitHub discussions on RSC caching issues - Community workarounds, may be version-specific

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Serwist is well-documented, official Next.js PWA solution
- Architecture: HIGH - Patterns from official docs and existing codebase (offline-store.ts)
- Pitfalls: HIGH - Well-documented in community, verified with official sources

**Research date:** 2026-02-04
**Valid until:** 30 days (Serwist is stable)
