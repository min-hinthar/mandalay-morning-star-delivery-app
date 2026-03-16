"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";

interface UseDriverReorderStopsOptions {
  routeId: string;
  onError?: () => void;
}

export function useDriverReorderStops({ routeId, onError }: UseDriverReorderStopsOptions) {
  const [isReordering, setIsReordering] = useState(false);

  const reorderStops = useCallback(
    async (stopOrder: { stopId: string; stopIndex: number }[]) => {
      setIsReordering(true);
      try {
        const response = await fetch(`/api/driver/routes/${routeId}/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stopOrder }),
        });
        if (!response.ok) {
          toast({ message: "Failed to save stop order", type: "error" });
          onError?.();
          return;
        }
        // Silent save on success -- no toast per admin pattern
      } catch {
        toast({ message: "Failed to save stop order", type: "error" });
        onError?.();
      } finally {
        setIsReordering(false);
      }
    },
    [routeId, onError],
  );

  return { reorderStops, isReordering };
}
