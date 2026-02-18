"use client";

/**
 * Stale Badge Component
 * Subtle amber badge showing relative timestamp of cached data
 *
 * Per CONTEXT.md:
 * - Subtle amber badge matching offline banner style
 * - Position: above menu grid (single badge, not per-item)
 * - Relative timestamp format: "Cached 2 hours ago", "Cached yesterday"
 * - Shown only when offline (not when online with stale data)
 */

import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export interface StaleBadgeProps {
  /** ISO timestamp of when data was cached */
  cachedAt: string;
  /** Additional className */
  className?: string;
}

export function StaleBadge({ cachedAt, className }: StaleBadgeProps) {
  // Calculate relative time
  const relativeTime = formatDistanceToNow(new Date(cachedAt), {
    addSuffix: true,
  });

  return (
    <Badge variant="status-warning" size="default" showIcon icon={Clock} className={className}>
      Cached {relativeTime}
    </Badge>
  );
}

export default StaleBadge;
