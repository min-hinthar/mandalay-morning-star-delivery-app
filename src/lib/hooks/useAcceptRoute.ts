"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";

interface UseAcceptRouteOptions {
  routeId: string;
  onSuccess?: () => void;
}

export function useAcceptRoute({ routeId, onSuccess }: UseAcceptRouteOptions) {
  const [isAccepting, setIsAccepting] = useState(false);

  const acceptRoute = useCallback(async () => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/driver/routes/${routeId}/accept`, {
        method: "POST",
      });
      if (!response.ok) {
        toast({
          message: "Failed to accept route. Check your connection and try again.",
          type: "error",
        });
        return;
      }
      toast({ message: "Route accepted!", type: "success" });
      onSuccess?.();
    } catch {
      toast({
        message: "Failed to accept route. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setIsAccepting(false);
    }
  }, [routeId, onSuccess]);

  return { acceptRoute, isAccepting };
}
