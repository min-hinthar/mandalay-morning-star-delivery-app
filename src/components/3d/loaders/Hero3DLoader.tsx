"use client";

import { useProgress, Html } from "@react-three/drei";

/**
 * Branded loading indicator for 3D hero section.
 * Uses drei's Html to render DOM inside Canvas.
 * Shows indeterminate spinner (not percentage - unreliable for single large GLB).
 */
export function Hero3DLoader() {
  const { active } = useProgress();

  if (!active) return null;

  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        {/* Morning Star branded spinner - gold bowl animation */}
        <div className="relative w-16 h-16">
          {/* Outer ring - spinning */}
          <div className="absolute inset-0 rounded-full border-4 border-secondary/30 border-t-secondary animate-spin" />
          {/* Inner star icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-secondary animate-pulse"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
            </svg>
          </div>
        </div>
        <p className="text-white/70 text-sm font-medium">
          Loading deliciousness...
        </p>
      </div>
    </Html>
  );
}
