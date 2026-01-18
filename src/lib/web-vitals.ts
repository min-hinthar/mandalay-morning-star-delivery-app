/**
 * Web Vitals Instrumentation
 *
 * Tracks Core Web Vitals (LCP, FID, CLS, FCP, TTFB) and reports them
 * to analytics services (Sentry, console in dev).
 *
 * Targets:
 * - LCP: < 2.5s (Largest Contentful Paint)
 * - FID: < 100ms (First Input Delay) / INP: < 200ms
 * - CLS: < 0.1 (Cumulative Layout Shift)
 */

import type { Metric } from "web-vitals";

/**
 * Performance thresholds based on Google's Core Web Vitals
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },  // Replaced FID in 2024
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
} as const;

type MetricName = keyof typeof WEB_VITALS_THRESHOLDS;

/**
 * Determine performance rating based on metric value
 */
function getRating(name: MetricName, value: number): "good" | "needs-improvement" | "poor" {
  const threshold = WEB_VITALS_THRESHOLDS[name];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.needsImprovement) return "needs-improvement";
  return "poor";
}

/**
 * Format metric value for display
 */
function formatValue(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

/**
 * Report metric to console (dev) and Sentry (prod)
 */
function reportMetric(metric: Metric) {
  const { name, value, id, navigationType } = metric;
  const rating = getRating(name as MetricName, value);

  // Console logging in development
  if (process.env.NODE_ENV === "development") {
    const color = rating === "good" ? "\x1b[32m" : rating === "needs-improvement" ? "\x1b[33m" : "\x1b[31m";
    console.log(
      `%c[Web Vitals] ${name}: ${formatValue(name, value)} (${rating})`,
      `color: ${rating === "good" ? "#22c55e" : rating === "needs-improvement" ? "#eab308" : "#ef4444"}`
    );
  }

  // Report to Sentry in production
  if (typeof window !== "undefined" && "Sentry" in window) {
    const Sentry = (window as unknown as { Sentry: {
      setMeasurement: (name: string, value: number, unit: string) => void;
      addBreadcrumb: (options: { category: string; message: string; level: string; data: Record<string, unknown> }) => void;
    } }).Sentry;

    // Send as Sentry measurement
    Sentry.setMeasurement(name, value, name === "CLS" ? "" : "millisecond");

    // Add breadcrumb for context
    Sentry.addBreadcrumb({
      category: "web-vitals",
      message: `${name}: ${formatValue(name, value)}`,
      level: rating === "poor" ? "warning" : "info",
      data: {
        value,
        rating,
        id,
        navigationType,
      },
    });
  }

  // Send to analytics endpoint (customize as needed)
  if (process.env.NODE_ENV === "production") {
    // Beacon API for reliable delivery
    const body = JSON.stringify({
      name,
      value,
      rating,
      id,
      navigationType,
      url: window.location.href,
      timestamp: Date.now(),
    });

    // Use sendBeacon for fire-and-forget
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/vitals", body);
    }
  }
}

/**
 * Initialize web vitals tracking
 * Call this once in your app (e.g., in useEffect or app layout)
 */
export async function initWebVitals() {
  if (typeof window === "undefined") return;

  try {
    // web-vitals v4+ uses INP instead of FID
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import("web-vitals");

    // Core Web Vitals (2024 standard)
    onLCP(reportMetric);  // Largest Contentful Paint
    onINP(reportMetric);  // Interaction to Next Paint (replaced FID)
    onCLS(reportMetric);  // Cumulative Layout Shift

    // Additional metrics
    onFCP(reportMetric);  // First Contentful Paint
    onTTFB(reportMetric); // Time to First Byte

    if (process.env.NODE_ENV === "development") {
      console.log("[Web Vitals] Monitoring initialized");
    }
  } catch (error) {
    console.error("[Web Vitals] Failed to initialize:", error);
  }
}

/**
 * React hook for web vitals (client-side only)
 * Usage: useWebVitals() in your root layout or app component
 */
export function useWebVitals() {
  if (typeof window !== "undefined") {
    // Only run once
    if (!(window as unknown as { __WEB_VITALS_INIT__?: boolean }).__WEB_VITALS_INIT__) {
      (window as unknown as { __WEB_VITALS_INIT__: boolean }).__WEB_VITALS_INIT__ = true;
      initWebVitals();
    }
  }
}

/**
 * Get performance score summary
 * Useful for displaying in a performance dashboard
 */
export function getPerformanceScore(metrics: Record<string, number>): {
  score: number;
  breakdown: Record<string, { value: number; rating: string; weight: number }>;
} {
  const weights = {
    LCP: 0.25,
    FID: 0.25,
    CLS: 0.25,
    FCP: 0.15,
    TTFB: 0.10,
  };

  let totalWeight = 0;
  let weightedScore = 0;
  const breakdown: Record<string, { value: number; rating: string; weight: number }> = {};

  for (const [name, value] of Object.entries(metrics)) {
    const weight = weights[name as keyof typeof weights] || 0;
    const rating = getRating(name as MetricName, value);
    const score = rating === "good" ? 1 : rating === "needs-improvement" ? 0.5 : 0;

    breakdown[name] = { value, rating, weight };
    weightedScore += score * weight;
    totalWeight += weight;
  }

  return {
    score: totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0,
    breakdown,
  };
}
