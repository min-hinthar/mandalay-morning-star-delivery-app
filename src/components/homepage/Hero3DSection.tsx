"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useGPUTier } from "@/components/3d";

// Dynamic import with SSR disabled - prevents WebGL errors during SSR
const Hero3DCanvas = dynamic(
  () => import("@/components/3d").then((m) => m.Hero3DCanvas),
  {
    ssr: false,
    loading: () => <Hero2DFallback isLoading />,
  }
);

interface Hero2DFallbackProps {
  isLoading?: boolean;
}

/**
 * 2D fallback for low-end devices or while loading.
 * Shows the same dish as a high-quality image with subtle motion.
 */
function Hero2DFallback({ isLoading = false }: Hero2DFallbackProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background gradient for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-secondary/10 via-transparent to-transparent" />

      {/* Food image with subtle float animation */}
      <motion.div
        className="relative w-[80%] max-w-md aspect-square"
        animate={
          shouldAnimate && !isLoading
            ? {
                y: [0, -10, 0],
                rotate: [0, 1, 0, -1, 0],
              }
            : undefined
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Glow behind image */}
        <div className="absolute inset-0 blur-3xl bg-secondary/20 rounded-full scale-75" />

        {/* The food image */}
        <img
          src="/images/hero-dish-2d.jpg"
          alt="Authentic Burmese rice bowl"
          className="relative w-full h-full object-contain drop-shadow-2xl"
          style={{
            filter: isLoading ? "blur(4px)" : "none",
            transition: "filter 0.3s ease-out",
          }}
        />

        {/* Loading shimmer overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}
      </motion.div>
    </div>
  );
}

export interface Hero3DSectionProps {
  className?: string;
}

/**
 * Conditional 3D/2D hero content based on device capability.
 *
 * Behavior:
 * - While GPU tier detecting: Show 2D with loading state
 * - GPU tier 0-1 (low-end): Show 2D fallback permanently
 * - GPU tier 2+ (capable): Show 3D Canvas
 *
 * The 2D fallback is NOT a failure state - it's a designed experience
 * for devices where 3D would cause poor performance.
 */
export function Hero3DSection({ className }: Hero3DSectionProps) {
  const { shouldRender3D, isLoading } = useGPUTier();

  // Still detecting GPU capability - show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <Hero2DFallback isLoading />
      </div>
    );
  }

  // Low-end device - show optimized 2D experience
  if (!shouldRender3D) {
    return (
      <div className={className}>
        <Hero2DFallback />
      </div>
    );
  }

  // Capable device - show full 3D experience
  return (
    <div className={className}>
      <Hero3DCanvas />
    </div>
  );
}
