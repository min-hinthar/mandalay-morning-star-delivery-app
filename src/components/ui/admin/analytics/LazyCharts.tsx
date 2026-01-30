"use client";

/**
 * Lazy-loaded chart components for admin analytics dashboards.
 * Uses next/dynamic to code-split recharts bundle from initial load.
 */

import dynamic from "next/dynamic";

// Chart loading skeleton
const ChartSkeleton = () => (
  <div className="h-80 w-full animate-pulse rounded-xl bg-charcoal-100" />
);

const GaugeSkeleton = () => (
  <div className="h-72 w-full animate-pulse rounded-xl bg-charcoal-100" />
);

// Lazy-loaded chart components
export const LazyDeliverySuccessChart = dynamic(
  () => import("./DeliverySuccessChart").then((mod) => mod.DeliverySuccessChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyETAAccuracyGauge = dynamic(
  () => import("./DeliverySuccessChart").then((mod) => mod.ETAAccuracyGauge),
  { loading: () => <GaugeSkeleton />, ssr: false }
);

export const LazyPeakHoursChart = dynamic(
  () => import("./PeakHoursChart").then((mod) => mod.PeakHoursChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyExceptionBreakdown = dynamic(
  () => import("./ExceptionBreakdown").then((mod) => mod.ExceptionBreakdown),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyPerformanceChart = dynamic(
  () => import("./PerformanceChart").then((mod) => mod.PerformanceChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);
