"use client";

import dynamic from "next/dynamic";
import { MapSkeleton } from "./MapSkeleton";
import { importWithRetry } from "@/lib/hooks/useDynamicImportWithRetry";
import { LoadingWithTimeout } from "@/components/ui/LoadingWithTimeout";

/**
 * Lazy-loaded RouteMap with viewport-triggered loading on route detail page.
 * Uses importWithRetry (3 retries, exponential backoff, Sentry logging)
 * and LoadingWithTimeout (15s timeout for mobile networks).
 */
export const LazyRouteMap = dynamic(
  () =>
    importWithRetry(
      () => import("@/components/ui/admin/routes/RouteMap").then((mod) => mod.RouteMap),
      "RouteMap"
    ),
  {
    loading: () => (
      <LoadingWithTimeout
        skeleton={<MapSkeleton height={400} />}
        timeoutMs={15000}
        timeoutMessage="Map taking longer than expected"
      />
    ),
    ssr: false,
  }
);

/**
 * Lazy-loaded DeliveryMap for tracking page (eager load -- map IS the content).
 * Uses importWithRetry (3 retries, exponential backoff, Sentry logging)
 * and LoadingWithTimeout (15s timeout for mobile networks).
 */
export const LazyDeliveryMap = dynamic(
  () =>
    importWithRetry(
      () => import("@/components/ui/orders/tracking/DeliveryMap").then((mod) => mod.DeliveryMap),
      "DeliveryMap"
    ),
  {
    loading: () => (
      <LoadingWithTimeout
        skeleton={<MapSkeleton height={300} />}
        timeoutMs={15000}
        timeoutMessage="Map taking longer than expected"
      />
    ),
    ssr: false,
  }
);
