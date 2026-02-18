/**
 * SkeletonCard & SkeletonMenuItem
 *
 * Pre-configured skeleton components for card layouts and menu items.
 */

import { cn } from "@/lib/utils/cn";
import { Skeleton } from "./base";
import { SkeletonText } from "./text-skeletons";
import { SkeletonAvatar } from "./text-skeletons";

// ============================================
// SKELETON CARD
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
        "bg-surface-primary rounded-xl border border-border-default overflow-hidden",
        className
      )}
    >
      {/* Image */}
      {withImage && <Skeleton height={imageHeight} radius="none" variant="shimmer" withGrain />}

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
        {textLines > 0 && <SkeletonText lines={textLines} lineHeight={14} gap={6} />}

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
// ============================================

export function SkeletonMenuItem({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-surface-primary rounded-xl border border-border-default",
        className
      )}
    >
      {/* Image */}
      <Skeleton width={80} height={80} radius="lg" variant="shimmer" withGrain />

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
