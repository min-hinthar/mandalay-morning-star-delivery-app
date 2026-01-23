"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
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
// SHIMMER ANIMATION
// ============================================

const shimmerAnimation = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear" as const,
    },
  },
};

// ============================================
// WAVE ANIMATION
// ============================================

const waveAnimation = {
  initial: { backgroundPosition: "200% 0" },
  animate: {
    backgroundPosition: "-200% 0",
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear" as const,
    },
  },
};

// ============================================
// PULSE ANIMATION
// ============================================

const pulseAnimation = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 0.3, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
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
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
            }}
            {...shimmerAnimation}
          />
          {withGrain && <GrainOverlay />}
        </div>
      );
    }

    // Wave variant
    if (variant === "wave") {
      return (
        <motion.div
          ref={ref}
          className={cn(baseClasses, "bg-gradient-to-r")}
          style={{
            width,
            height,
            backgroundImage:
              "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 25%, #e5e7eb 50%, #d1d5db 75%, #e5e7eb 100%)",
            backgroundSize: "200% 100%",
          }}
          {...waveAnimation}
        >
          {withGrain && <GrainOverlay />}
        </motion.div>
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
          <motion.div
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
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      );
    }

    // Pulse variant (default fallback)
    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        style={{ width, height }}
        {...pulseAnimation}
      >
        {withGrain && <GrainOverlay />}
      </motion.div>
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

// ============================================
// SKELETON TEXT
// Pre-configured for text blocks
// ============================================

export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Last line width percentage */
  lastLineWidth?: string;
  /** Line height */
  lineHeight?: number;
  /** Gap between lines */
  gap?: number;
  /** Class names */
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "75%",
  lineHeight = 16,
  gap = 8,
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col", className)} style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : "100%"}
          radius="sm"
          variant="shimmer"
        />
      ))}
    </div>
  );
}

// ============================================
// SKELETON AVATAR
// Pre-configured for avatars
// ============================================

export interface SkeletonAvatarProps {
  /** Avatar size */
  size?: number | "sm" | "md" | "lg" | "xl";
  /** Class names */
  className?: string;
}

const avatarSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  const actualSize = typeof size === "number" ? size : avatarSizes[size];

  return (
    <Skeleton
      width={actualSize}
      height={actualSize}
      radius="full"
      variant="shimmer"
      className={className}
    />
  );
}

// ============================================
// SKELETON CARD
// Pre-configured card layout
// ============================================

export interface SkeletonCardProps {
  /** Show image placeholder */
  withImage?: boolean;
  /** Image height */
  imageHeight?: number;
  /** Show avatar */
  withAvatar?: boolean;
  /** Number of text lines */
  textLines?: number;
  /** Class names */
  className?: string;
}

export function SkeletonCard({
  withImage = true,
  imageHeight = 160,
  withAvatar = false,
  textLines = 2,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-border-default overflow-hidden",
        className
      )}
    >
      {/* Image */}
      {withImage && (
        <Skeleton
          height={imageHeight}
          radius="none"
          variant="shimmer"
          withGrain
        />
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header with optional avatar */}
        <div className="flex items-center gap-3">
          {withAvatar && <SkeletonAvatar size="md" />}
          <div className="flex-1 space-y-2">
            <Skeleton height={18} width="70%" radius="sm" />
            {withAvatar && <Skeleton height={14} width="40%" radius="sm" />}
          </div>
        </div>

        {/* Text lines */}
        {textLines > 0 && (
          <SkeletonText lines={textLines} lineHeight={14} gap={6} />
        )}

        {/* Action area */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton height={14} width="30%" radius="sm" />
          <Skeleton height={32} width={80} radius="lg" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SKELETON MENU ITEM
// Pre-configured for menu items
// ============================================

export function SkeletonMenuItem({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-white rounded-xl border border-border-default",
        className
      )}
    >
      {/* Image */}
      <Skeleton
        width={80}
        height={80}
        radius="lg"
        variant="shimmer"
        withGrain
      />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton height={18} width="60%" radius="sm" />
        <Skeleton height={14} width="80%" radius="sm" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton height={20} width={60} radius="sm" />
          <Skeleton height={32} width={32} radius="full" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SKELETON TABLE ROW
// Pre-configured for table rows
// ============================================

export interface SkeletonTableRowProps {
  /** Number of columns */
  columns?: number;
  /** Row height */
  height?: number;
  /** Class names */
  className?: string;
}

export function SkeletonTableRow({
  columns = 4,
  height = 48,
  className,
}: SkeletonTableRowProps) {
  const columnWidths = ["30%", "25%", "20%", "15%", "10%"];

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 border-b border-border-subtle",
        className
      )}
      style={{ height }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={index}
          height={14}
          width={columnWidths[index % columnWidths.length]}
          radius="sm"
          variant="pulse"
        />
      ))}
    </div>
  );
}
