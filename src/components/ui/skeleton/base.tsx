"use client";

/**
 * Skeleton Base Component
 *
 * Core skeleton loading animation with shimmer, pulse, wave, and grain variants.
 */

import { forwardRef } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface SkeletonProps {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Border radius */
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Animation variant */
  variant?: "shimmer" | "pulse" | "wave" | "grain";
  /** Show grain overlay texture */
  withGrain?: boolean;
  /** Additional class names */
  className?: string;
  /** Number of skeleton items (for repeat) */
  count?: number;
  /** Gap between items when count > 1 */
  gap?: number;
}

// ============================================
// RADIUS CONFIG
// ============================================

const radiusConfig = {
  none: "rounded-none",
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
};

// ============================================
// ANIMATIONS
// ============================================

// Bound shimmer to 10 cycles - skeletons should only show briefly during loading
const shimmerAnimation = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      duration: 1.5,
      repeat: 10,
      ease: "linear" as const,
    },
  },
};

// Bound wave to 10 cycles
const waveAnimation = {
  initial: { backgroundPosition: "200% 0" },
  animate: {
    backgroundPosition: "-200% 0",
    transition: {
      duration: 3,
      repeat: 10,
      ease: "linear" as const,
    },
  },
};

// Bound pulse to 10 cycles
const pulseAnimation = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 0.3, 0.6],
    transition: {
      duration: 1.5,
      repeat: 10,
      ease: "easeInOut" as const,
    },
  },
};

// ============================================
// GRAIN OVERLAY
// ============================================

function GrainOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// ============================================
// SINGLE SKELETON COMPONENT
// ============================================

const SingleSkeleton = forwardRef<HTMLDivElement, Omit<SkeletonProps, "count" | "gap">>(
  (
    {
      width = "100%",
      height = 20,
      radius = "md",
      variant = "shimmer",
      withGrain = false,
      className,
    },
    ref
  ) => {
    const { shouldAnimate } = useAnimationPreference();

    const baseClasses = cn(
      "relative overflow-hidden",
      "bg-surface-tertiary",
      radiusConfig[radius],
      className
    );

    // Non-animated fallback
    if (!shouldAnimate) {
      return (
        <div
          ref={ref}
          className={baseClasses}
          style={{ width, height }}
        />
      );
    }

    // Shimmer variant
    if (variant === "shimmer") {
      return (
        <div
          ref={ref}
          className={baseClasses}
          style={{ width, height }}
        >
          <m.div
            className="absolute inset-0 bg-gradient-shimmer"
            {...shimmerAnimation}
          />
          {withGrain && <GrainOverlay />}
        </div>
      );
    }

    // Wave variant
    if (variant === "wave") {
      return (
        <m.div
          ref={ref}
          className={cn(baseClasses, "bg-gradient-to-r")}
          style={{
            width,
            height,
            backgroundImage:
              "linear-gradient(90deg, var(--color-skeleton) 0%, var(--color-border-default) 25%, var(--color-skeleton) 50%, var(--color-border-default) 75%, var(--color-skeleton) 100%)",
            backgroundSize: "200% 100%",
          }}
          {...waveAnimation}
        >
          {withGrain && <GrainOverlay />}
        </m.div>
      );
    }

    // Grain variant (static with animated grain)
    if (variant === "grain") {
      return (
        <div
          ref={ref}
          className={baseClasses}
          style={{ width, height }}
        >
          <m.div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
            animate={{
              opacity: [0.2, 0.35, 0.2],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: 10,
              ease: "easeInOut",
            }}
          />
        </div>
      );
    }

    // Pulse variant (default fallback)
    return (
      <m.div
        ref={ref}
        className={baseClasses}
        style={{ width, height }}
        {...pulseAnimation}
      >
        {withGrain && <GrainOverlay />}
      </m.div>
    );
  }
);

SingleSkeleton.displayName = "SingleSkeleton";

// ============================================
// MAIN SKELETON COMPONENT
// ============================================

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ count = 1, gap = 8, ...props }, ref) => {
    if (count === 1) {
      return <SingleSkeleton ref={ref} {...props} />;
    }

    return (
      <div
        ref={ref}
        className="flex flex-col"
        style={{ gap }}
      >
        {Array.from({ length: count }).map((_, index) => (
          <SingleSkeleton key={index} {...props} />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";
