/**
 * DeliveryMapSkeleton Component
 *
 * Skeleton placeholder for DeliveryMap while loading.
 */

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function DeliveryMapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[var(--color-surface-muted)] animate-pulse",
        className
      )}
      style={{ minHeight: 300 }}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    </div>
  );
}
