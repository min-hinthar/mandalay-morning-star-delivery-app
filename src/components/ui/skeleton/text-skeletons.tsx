/**
 * SkeletonText & SkeletonAvatar
 *
 * Pre-configured skeleton components for text blocks and avatars.
 */

import { cn } from "@/lib/utils/cn";
import { Skeleton } from "./base";

// ============================================
// SKELETON TEXT
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
