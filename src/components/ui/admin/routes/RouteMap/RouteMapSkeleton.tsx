import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Skeleton placeholder for RouteMap */
export function RouteMapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("h-full rounded-card-sm bg-surface-muted animate-pulse", className)}>
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-text-muted">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    </div>
  );
}
