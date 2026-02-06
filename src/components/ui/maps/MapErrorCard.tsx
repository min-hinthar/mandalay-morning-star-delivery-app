"use client";

import { m } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface MapErrorCardProps {
  /** Error message to display */
  message: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Whether all retries are exhausted */
  isFinal?: boolean;
  /** Container height in pixels (default: 300) */
  height?: number;
  className?: string;
}

/**
 * Error card for map loading failures.
 * Matches RouteError styling: AlertTriangle in brand-red circle, retry button.
 * Shows permanent error text after max retries exhausted.
 */
export function MapErrorCard({
  message,
  onRetry,
  isFinal = false,
  height = 300,
  className,
}: MapErrorCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl bg-surface-muted p-6",
        className
      )}
      style={{ minHeight: height }}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-red/10">
        <AlertTriangle className="h-6 w-6 text-brand-red" />
      </div>
      <p className="mb-4 text-center text-sm text-text-secondary">{message}</p>
      {onRetry && !isFinal && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      )}
      {isFinal && (
        <p className="text-xs text-text-muted">
          Unable to load. Please refresh the page.
        </p>
      )}
    </m.div>
  );
}
