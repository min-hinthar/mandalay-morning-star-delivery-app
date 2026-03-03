import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
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
// Bumped v1→v2 to bust stale opaque failure responses cached before the
// referrerPolicy="no-referrer" fix (commit e3ae7892). Hard reload bypassed
// the SW and worked; normal loads served the bad CacheFirst entry.
const CACHE_VERSION = "v2";

// Navigation handler - NetworkFirst with 3s timeout for page navigations
const navigationHandler = new NetworkFirst({
  cacheName: `navigations-${CACHE_VERSION}`,
  networkTimeoutSeconds: 3,
});

// Denylist: routes excluded from SW navigation interception
const denylist = [
  /^\/auth\//, // OAuth callbacks
  /^\/monitoring/, // Sentry tunnel
  /^\/api\//, // All API routes
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // Manual update control for update prompt (OFFLINE-11)
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // External images (Google Drive, Supabase Storage) - CacheFirst (OFFLINE-03)
    // Uses CacheableResponsePlugin to cache opaque cross-origin responses (status 0)
    {
      matcher: ({ url }) =>
        url.hostname.includes("drive.google.com") ||
        url.hostname.includes("googleusercontent.com") ||
        url.hostname.includes("supabase.co") ||
        url.hostname.includes("supabase.com"),
      handler: new CacheFirst({
        cacheName: `external-images-${CACHE_VERSION}`,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200], // 0 = opaque response (cross-origin)
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
    ...defaultCache.filter((entry) => {
      // OFFLINE-06: Exclude document requests to prevent App Router conflicts
      const urlPattern = entry.matcher?.toString() || "";
      return !urlPattern.includes("document");
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

// Listen for skip waiting message from update prompt (OFFLINE-11)
self.addEventListener("message", (event: MessageEvent) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
  }
});

serwist.addEventListeners();
