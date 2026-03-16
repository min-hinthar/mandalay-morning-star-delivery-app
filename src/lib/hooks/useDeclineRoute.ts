"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";

interface UseDeclineRouteOptions {
  routeId: string;
  onSuccess?: () => void;
}

export function useDeclineRoute({ routeId, onSuccess }: UseDeclineRouteOptions) {
  const [isDeclining, setIsDeclining] = useState(false);

  const declineRoute = useCallback(
    async (reason?: string) => {
      setIsDeclining(true);
      try {
        const response = await fetch(`/api/driver/routes/${routeId}/decline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason || null }),
        });
        if (!response.ok) {
          toast({
            message: "Failed to decline route. Check your connection and try again.",
            type: "error",
          });
          return;
        }
        toast({ message: "Route declined", type: "success" });
        onSuccess?.();
      } catch {
        toast({
          message: "Failed to decline route. Check your connection and try again.",
          type: "error",
        });
      } finally {
        setIsDeclining(false);
      }
    },
    [routeId, onSuccess]
  );

  return { declineRoute, isDeclining };
}
