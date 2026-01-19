"use client";

import { useWebVitals } from "@/lib/web-vitals";

/**
 * Client component to initialize web vitals monitoring.
 * Add this to your root layout for automatic CWV tracking.
 */
export function WebVitalsReporter() {
  useWebVitals();
  return null;
}
