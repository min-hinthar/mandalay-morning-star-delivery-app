"use client";

import { useState, useEffect } from "react";
import { getGPUTier, type TierResult } from "detect-gpu";

export function useGPUTier() {
  const [tier, setTier] = useState<TierResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getGPUTier().then((result) => {
      if (mounted) {
        setTier(result);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    tier,
    isLoading,
    // Tier 2+ = 30+ fps capable, good for 3D
    // Tier 0-1 = low-end, show 2D fallback
    shouldRender3D: tier ? tier.tier >= 2 : true, // Optimistic default while loading
    isMobile: tier?.isMobile ?? false,
    gpuName: tier?.gpu ?? "Unknown",
    fps: tier?.fps ?? 0,
  };
}
