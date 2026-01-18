"use client";

import { useEffect } from "react";
import { useWebVitals } from "@/lib/web-vitals";

/**
 * Client component to initialize web vitals monitoring.
 * Add this to your root layout for automatic CWV tracking.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    useWebVitals();
  }, []);

  return null;
}
