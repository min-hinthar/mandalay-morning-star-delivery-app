"use client";

import { useEffect, useState } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface LoadingWithTimeoutProps {
  /** The skeleton to show initially (ChartSkeleton or MapSkeleton) */
  skeleton: React.ReactNode;
  /** Threshold in ms before showing timeout message (10000 for charts, 15000 for maps) */
  timeoutMs: number;
  /** Custom timeout message */
  timeoutMessage?: string;
  className?: string;
}

/**
 * Shared loading wrapper that shows a skeleton initially,
 * then augments with a timeout message + retry button after the configured threshold.
 *
 * The retry button triggers window.location.reload() which remounts the component tree
 * and re-triggers the dynamic import.
 */
export function LoadingWithTimeout({
  skeleton,
  timeoutMs,
  timeoutMessage,
  className,
}: LoadingWithTimeoutProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs]);

  return (
    <div className={cn("relative", className)}>
      {skeleton}
      {timedOut && (
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-text-muted">
          <Clock className="h-4 w-4" />
          <span>{timeoutMessage ?? "Taking longer than expected..."}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="ml-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
