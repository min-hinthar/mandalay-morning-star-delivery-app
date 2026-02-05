import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
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
const CACHE_VERSION = "v1";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // Manual update control for update prompt (OFFLINE-11)
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Images - CacheFirst with 30-day expiration (OFFLINE-03)
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
    // Menu API - NetworkFirst with 5-minute network timeout (OFFLINE-04)
    {
      matcher: ({ url }) =>
        url.pathname === "/api/menu" || url.pathname.startsWith("/api/menu/"),
      handler: new NetworkFirst({
        cacheName: `menu-api-cache-${CACHE_VERSION}`,
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
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
});

// Listen for skip waiting message from update prompt (OFFLINE-11)
self.addEventListener("message", (event: MessageEvent) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
  }
});

serwist.addEventListeners();
