/**
 * V4 Sprint 3: Enhanced Skeleton Components
 *
 * Loading placeholders with contextual animations:
 * - Shimmer: gradient translateX animation for initial load (1.5s infinite)
 * - Pulse: subtle opacity/scale pulse for refetch (0.5s once)
 *
 * Prevents layout shift, matches actual content dimensions.
 */

"use client";

import { cn } from "@/lib/utils/cn";
import { type HTMLAttributes } from "react";

// ============================================
// BASE SKELETON
// ============================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Loading context - determines default animation
   * - "initial": First load, uses shimmer (default)
   * - "refetch": Subsequent loads, uses pulse
   */
  context?: "initial" | "refetch";
  /**
   * Animation type (overrides context-based default)
   * - "pulse": Subtle opacity/scale pulse (0.5s)
   * - "shimmer": Gradient slide animation (1.5s infinite)
   * - "scale-pulse": Scale-based pulse for refetch (0.5s once)
   * - "none": No animation
   */
  animation?: "pulse" | "shimmer" | "scale-pulse" | "none";
  /** Shape variant */
  variant?: "rect" | "circle" | "line";
  /** Width (CSS value) */
  width?: string | number;
  /** Height (CSS value) */
  height?: string | number;
}

export function Skeleton({
  context = "initial",
  animation,
  variant = "rect",
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  // Auto-select animation based on context when not explicitly set
  const effectiveAnimation =
    animation ?? (context === "refetch" ? "scale-pulse" : "shimmer");

  const baseClasses = "bg-[var(--color-surface-muted)]";

  const animationClasses = {
    pulse: "animate-pulse",
    shimmer: "animate-shimmer relative overflow-hidden",
    "scale-pulse": "animate-scale-pulse",
    none: "",
  };

  const variantClasses = {
    rect: "rounded-[var(--radius-md)]",
    circle: "rounded-full",
    line: "rounded-[var(--radius-sm)] h-4",
  };

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[effectiveAnimation],
        variantClasses[variant],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

// ============================================
// COMPOUND SKELETONS
// ============================================

/**
 * Menu item card skeleton - matches ItemCard layout
 */
export function MenuItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)]">
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-none" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton variant="line" width="75%" height={20} />
        {/* Subtitle */}
        <Skeleton variant="line" width="50%" height={16} />
        {/* Description */}
        <Skeleton variant="line" width="100%" height={16} />

        {/* Price and actions */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton width={64} height={24} />
          <div className="flex gap-2">
            <Skeleton variant="circle" width={32} height={32} />
            <Skeleton variant="circle" width={32} height={32} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Category tab skeleton
 */
export function CategoryTabSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          width={80 + Math.random() * 40}
          height={36}
          className="rounded-full flex-shrink-0"
        />
      ))}
    </div>
  );
}

/**
 * Cart item skeleton
 */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      {/* Thumbnail */}
      <Skeleton width={64} height={64} className="flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton variant="line" width="70%" height={16} />
        <Skeleton variant="line" width="40%" height={14} />

        <div className="flex items-center justify-between pt-1">
          <Skeleton width={48} height={20} />
          <Skeleton width={80} height={28} />
        </div>
      </div>
    </div>
  );
}

/**
 * KPI card skeleton for admin dashboard
 */
export function KPICardSkeleton() {
  return (
    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
      {/* Value */}
      <Skeleton width={80} height={36} className="mb-2" />
      {/* Label */}
      <Skeleton variant="line" width={60} height={14} className="mb-2" />
      {/* Comparison */}
      <Skeleton variant="line" width={48} height={14} />
    </div>
  );
}

/**
 * Driver route card skeleton
 */
export function DriverCardSkeleton() {
  return (
    <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="line" width="60%" height={18} />
          <Skeleton variant="line" width="40%" height={14} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton height={48} />
        <Skeleton height={48} />
        <Skeleton height={48} />
      </div>
    </div>
  );
}

/**
 * Order tracking skeleton
 */
export function OrderTrackingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Map placeholder */}
      <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />

      {/* Status steps */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="circle" width={32} height={32} />
            <div className="flex-1 space-y-1">
              <Skeleton variant="line" width="50%" height={16} />
              <Skeleton variant="line" width="30%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Form input skeleton
 */
export function FormFieldSkeleton({ hasLabel = true }: { hasLabel?: boolean }) {
  return (
    <div className="space-y-2">
      {hasLabel && <Skeleton variant="line" width={80} height={14} />}
      <Skeleton height={44} />
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 p-3 border-b border-[var(--color-border)]">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="line"
          className="flex-1"
          height={16}
        />
      ))}
    </div>
  );
}

/**
 * Text paragraph skeleton
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="line"
          width={i === lines - 1 ? "60%" : "100%"}
          height={16}
        />
      ))}
    </div>
  );
}

// ============================================
// SKELETON GROUP
// ============================================

interface SkeletonGridProps {
  count: number;
  skeleton: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function SkeletonGrid({
  count,
  skeleton,
  columns = 2,
  className,
}: SkeletonGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridClasses[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeleton}</div>
      ))}
    </div>
  );
}
