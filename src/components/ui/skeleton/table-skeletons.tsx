/**
 * SkeletonTableRow
 *
 * Pre-configured skeleton component for table rows.
 */

import { cn } from "@/lib/utils/cn";
import { Skeleton } from "./base";

// ============================================
// SKELETON TABLE ROW
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
