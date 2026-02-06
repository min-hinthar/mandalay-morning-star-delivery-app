"use client";

/**
 * Lazy-loaded chart components for admin analytics dashboards.
 * Uses next/dynamic with importWithRetry for resilient code-splitting.
 * Each chart shows a rich ChartSkeleton with per-chart labels,
 * wrapped in LoadingWithTimeout (10s) for timeout messaging.
 */

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartSkeleton";
import { LoadingWithTimeout } from "@/components/ui/LoadingWithTimeout";
import { importWithRetry } from "@/lib/hooks/useDynamicImportWithRetry";

// --- Lazy-loaded chart components ---

export const LazyDeliverySuccessChart = dynamic(
  () =>
    importWithRetry(
      () =>
        import("./DeliverySuccessChart").then(
          (mod) => mod.DeliverySuccessChart
        ),
      "DeliverySuccessChart"
    ),
  {
    loading: () => (
      <LoadingWithTimeout
        skeleton={
          <ChartSkeleton label="Loading delivery success chart..." height={300} />
        }
        timeoutMs={10000}
        timeoutMessage="Charts taking longer than expected"
      />
    ),
    ssr: false,
  }
);

export const LazyETAAccuracyGauge = dynamic(
  () =>
    importWithRetry(
      () =>
        import("./DeliverySuccessChart").then((mod) => mod.ETAAccuracyGauge),
      "ETAAccuracyGauge"
    ),
  {
    loading: () => (
      <LoadingWithTimeout
        skeleton={
          <ChartSkeleton label="Loading ETA accuracy..." height={200} />
        }
        timeoutMs={10000}
        timeoutMessage="Charts taking longer than expected"
      />
    ),
    ssr: false,
  }
);

export const LazyPeakHoursChart = dynamic(
  () =>
    importWithRetry(
      () =>
        import("./PeakHoursChart").then((mod) => mod.PeakHoursChart),
      "PeakHoursChart"
    ),
  {
    loading: () => (
      <LoadingWithTimeout
        skeleton={
          <ChartSkeleton label="Loading peak hours chart..." height={250} />
        }
        timeoutMs={10000}
        timeoutMessage="Charts taking longer than expected"
      />
    ),
    ssr: false,
  }
);

export const LazyExceptionBreakdown = dynamic(
  () =>
    importWithRetry(
      () =>
        import("./ExceptionBreakdown").then((mod) => mod.ExceptionBreakdown),
      "ExceptionBreakdown"
    ),
  {
    loading: () => (
      <LoadingWithTimeout
        skeleton={
          <ChartSkeleton label="Loading exception breakdown..." height={250} />
        }
        timeoutMs={10000}
        timeoutMessage="Charts taking longer than expected"
      />
    ),
    ssr: false,
  }
);

export const LazyPerformanceChart = dynamic(
  () =>
    importWithRetry(
      () =>
        import("./PerformanceChart").then((mod) => mod.PerformanceChart),
      "PerformanceChart"
    ),
  {
    loading: () => (
      <LoadingWithTimeout
        skeleton={
          <ChartSkeleton label="Loading performance chart..." height={300} />
        }
        timeoutMs={10000}
        timeoutMessage="Charts taking longer than expected"
      />
    ),
    ssr: false,
  }
);

export const LazyRevenueChart = dynamic(
  () =>
    importWithRetry(
      () =>
        import("../RevenueChart").then((mod) => mod.RevenueChart),
      "RevenueChart"
    ),
  {
    loading: () => (
      <LoadingWithTimeout
        skeleton={
          <ChartSkeleton label="Loading revenue chart..." height={300} />
        }
        timeoutMs={10000}
        timeoutMessage="Charts taking longer than expected"
      />
    ),
    ssr: false,
  }
);
