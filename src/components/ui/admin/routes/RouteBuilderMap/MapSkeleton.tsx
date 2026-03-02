"use client";

import { MapPin } from "lucide-react";

export function MapSkeleton() {
  return (
    <div className="bg-surface-secondary rounded-xl animate-pulse h-full w-full min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-text-muted">
        <MapPin className="h-8 w-8 opacity-40" />
        <span className="text-sm opacity-40">Loading map...</span>
      </div>
    </div>
  );
}
