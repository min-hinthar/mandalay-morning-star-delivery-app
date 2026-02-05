"use client";

import { useState, useEffect } from "react";

/**
 * Device capability tiers for animation scaling
 * - low: <=4 GB memory OR <=4 CPU cores OR mobile Safari OR slow connection
 * - high: >4 GB memory AND >4 CPU cores (or desktop Safari) AND fast connection
 */
export type DeviceTier = "low" | "high";

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  };
}

/**
 * Detects device capability based on hardware specs and connection type.
 * Runs once on mount, no dynamic re-evaluation.
 *
 * Per CONTEXT.md:
 * - Low-power threshold: <=4 GB memory OR <=4 CPU cores
 * - Safari fallback: mobile Safari = low, desktop Safari = high
 * - prefers-reduced-motion users get same treatment as low-power
 * - Connection type: slow-2g/2g = low-power (ANIM-01)
 */
export function useDeviceCapability() {
  const [tier, setTier] = useState<DeviceTier>("high");
  const [isDetected, setIsDetected] = useState(false);

  useEffect(() => {
    // Detection runs once on mount
    const nav = navigator as NavigatorWithDeviceMemory;
    const memory = nav.deviceMemory ?? null;
    const cores = navigator.hardwareConcurrency ?? null;

    // Connection type detection (ANIM-01)
    const connectionType = nav.connection?.effectiveType ?? null;
    const isSlowConnection = connectionType === "slow-2g" || connectionType === "2g";

    // Safari detection (deviceMemory not supported)
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
    const isMobileSafari = isSafari && (/Mobile/.test(ua) || /iPad|iPhone|iPod/.test(ua));

    let detectedTier: DeviceTier;

    if (isMobileSafari) {
      // Mobile Safari always low-power
      detectedTier = "low";
    } else if (isSafari) {
      // Desktop Safari treat as high-power (unless slow connection)
      detectedTier = isSlowConnection ? "low" : "high";
    } else {
      // Chromium browsers with deviceMemory support
      // Low-power: <=4 GB memory OR <=4 CPU cores OR slow connection
      const isLowPower =
        (memory !== null && memory <= 4) ||
        (cores !== null && cores <= 4) ||
        isSlowConnection;
      detectedTier = isLowPower ? "low" : "high";
    }

    setTier(detectedTier);
    setIsDetected(true);
  }, []);

  return {
    tier,
    isDetected,
    isLowPower: tier === "low",
    isHighPower: tier === "high",
  };
}
