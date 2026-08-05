import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";

import { AUTHED_PATH_PREFIXES, isUncacheablePath } from "./sw-denylist";
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  CacheableResponsePlugin,
  NavigationRoute,
  Serwist,
} from "serwist";

// TypeScript declarations for service worker globals
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

// Cache version for invalidation control (OFFLINE-12)
// v1→v2: bust stale opaque failures from before referrerPolicy="no-referrer" fix
// v2→v3: switched external images from CacheFirst to NetworkFirst -- bust any
//        bad opaque responses that CacheFirst permanently cached in v2
// v3→v4: stopped caching opaque (status 0) responses for external images.
//        Images now routed through next/image proxy (same-origin, status 200).
// v4→v5: authed routes left the navigation denylist late (audit D7) — old
//        navigations-v4 caches hold admin/driver/account HTML (PII) that must
//        be purged, not just no longer written.
const CACHE_VERSION = "v5";

// Navigation handler - NetworkFirst with 3s timeout for page navigations
const navigationHandler = new NetworkFirst({
  cacheName: `navigations-${CACHE_VERSION}`,
  networkTimeoutSeconds: 3,
});

// Denylist: routes excluded from SW navigation interception
//
// The authed prefixes are a privacy boundary, not a perf choice (audit D7):
// NetworkFirst wrote their HTML into Cache Storage, where the last admin's
// dashboard, a driver's manifest, or a customer's account/orders pages —
// names, addresses, phone numbers — outlived logout on a shared device, and
// stayed readable to any script that got past the CSP. Denylisted
// navigations go straight to the network, so offline these routes show the
// browser error page instead of the /offline fallback — the correct trade
// for authed PII (they are unusable offline anyway; the public menu keeps
// its offline support). Prefix scope rationale (incl. why the public
// /driver/onboard invite-token page is DELIBERATELY covered) lives in
// ./sw-denylist.ts. NOTE this list only guards HARD navigations — the RSC
// soft-nav/prefetch half of the same boundary is enforced below where
// defaultCache is spread.
const denylist = [
  /^\/auth\//, // OAuth callbacks
  /^\/monitoring/, // Sentry tunnel
  /^\/api\//, // All API routes
  ...AUTHED_PATH_PREFIXES,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // Manual update control for update prompt (OFFLINE-11)
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // External images (Google Drive, Supabase Storage) - NetworkFirst (OFFLINE-03)
    // Images should be routed through next/image proxy (same-origin) to avoid
    // opaque cross-origin response issues. This handler is a safety net for any
    // direct external image requests that still occur.
    // IMPORTANT: Only cache status 200 (not opaque status 0). Opaque responses
    // hide the real HTTP status -- a 403/429 rate-limit from Google appears as
    // status 0, indistinguishable from success. Caching bad opaque responses
    // causes images to stay broken until cache expires.
    {
      matcher: ({ url }) =>
        url.hostname.includes("drive.google.com") ||
        url.hostname.includes("googleusercontent.com") ||
        url.hostname.includes("supabase.co") ||
        url.hostname.includes("supabase.com"),
      handler: new NetworkFirst({
        cacheName: `external-images-${CACHE_VERSION}`,
        networkTimeoutSeconds: 5,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [200], // Only cache verified successful responses
          }),
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // Same-origin images - CacheFirst with 30-day expiration (OFFLINE-03)
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new CacheFirst({
        cacheName: `images-cache-${CACHE_VERSION}`,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 250, // ~50MB budget at ~200KB average
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // Menu API - NetworkFirst with 15-minute cache TTL (OFFLINE-04)
    {
      matcher: ({ url }) => url.pathname === "/api/menu" || url.pathname.startsWith("/api/menu/"),
      handler: new NetworkFirst({
        cacheName: `menu-api-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 15 * 60, // 15 minutes
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
        cacheName: `static-assets-${CACHE_VERSION}`,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
    // Spread defaultCache for remaining Next.js assets (but NOT document/RSC)
    ...defaultCache
      .filter((entry) => {
        // OFFLINE-06: Exclude document requests to prevent App Router conflicts
        const urlPattern = entry.matcher?.toString() || "";
        return !urlPattern.includes("document");
      })
      // The OTHER half of the D7 privacy boundary: App-Router SOFT
      // navigations and Link prefetches are RSC fetches (`RSC: 1` header,
      // not `mode: "navigate"`), so they bypass the NavigationRoute denylist
      // entirely and land in defaultCache's `pages-rsc` /
      // `pages-rsc-prefetch` handlers — and defaultCache's `apis` handler
      // caches ALL same-origin GET /api/* JSON (`/api/account/profile`,
      // `/api/orders` — the same PII class as the pages). Wrap every
      // function matcher so same-origin authed pages AND all /api/ paths
      // are never cached by ANY defaultCache handler; the public menu's
      // offline support is unaffected because the explicit menu-api-cache
      // handler above wins first-match. Regex matchers (fonts, cross-origin)
      // pass through untouched.
      .map((entry): RuntimeCaching => {
        const original = entry.matcher;
        if (typeof original !== "function") return entry;
        return {
          ...entry,
          matcher: (args) =>
            args.sameOrigin && isUncacheablePath(args.url.pathname) ? false : original(args),
        };
      }),
  ],
  // Offline fallback for document requests when both network and cache fail
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

// Register NavigationRoute with denylist for safe navigation caching
serwist.registerRoute(new NavigationRoute(navigationHandler, { denylist }));

// Clean up old versioned runtime caches on activation (OFFLINE-12)
// Serwist only cleans up precache entries; runtime caches with old CACHE_VERSION linger.
(self as unknown as ServiceWorkerGlobalScope).addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const currentSuffix = `-${CACHE_VERSION}`;
      const versionedPrefixes = [
        "external-images-",
        "images-cache-",
        "menu-api-cache-",
        "static-assets-",
        "navigations-",
      ];
      // Serwist's own RSC/page caches are UNVERSIONED, and until the D7 fix
      // they accumulated authed-page payloads (soft navigations + Link
      // prefetches). Purge them on every activation — activation only fires
      // when a new SW version installs, so this costs one cold soft-nav per
      // deploy and guarantees any pre-fix PII entries are gone.
      const serwistPageCaches = ["pages-rsc", "pages-rsc-prefetch", "pages", "apis"];
      const toDelete = cacheNames.filter((name) => {
        // Only target our versioned caches that don't match current version
        return (
          versionedPrefixes.some(
            (prefix) => name.startsWith(prefix) && !name.endsWith(currentSuffix)
          ) || serwistPageCaches.includes(name)
        );
      });
      return Promise.all(toDelete.map((name) => caches.delete(name)));
    })
  );
});

// Listen for skip waiting message from update prompt (OFFLINE-11)
self.addEventListener("message", (event: MessageEvent) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
  }
});

// ── Web Push: order-status notifications ──────────────────
interface PushNotificationPayload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

(self as unknown as ServiceWorkerGlobalScope).addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushNotificationPayload = {};
  try {
    payload = event.data.json() as PushNotificationPayload;
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "Mandalay Morning Star";
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url || "/" },
    })
  );
});

(self as unknown as ServiceWorkerGlobalScope).addEventListener(
  "notificationclick",
  (event: NotificationEvent) => {
    event.notification.close();
    const target = (event.notification.data as { url?: string } | undefined)?.url || "/";

    event.waitUntil(
      (async () => {
        const swScope = self as unknown as ServiceWorkerGlobalScope;
        const windows = await swScope.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of windows) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await (client as WindowClient).navigate(target);
            } catch {
              // Cross-origin or navigation blocked — focus is enough.
            }
          }
          return;
        }
        if (swScope.clients.openWindow) await swScope.clients.openWindow(target);
      })()
    );
  }
);

serwist.addEventListeners();
