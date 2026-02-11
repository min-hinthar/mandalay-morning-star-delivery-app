"use client";

import { m } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface InlineErrorCardProps {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function InlineErrorCard({
  message = "Failed to load data",
  onRetry,
}: InlineErrorCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={getSpring(spring.default)}
      className="flex flex-col items-center gap-4 rounded-xl border border-status-error/20 bg-status-error/5 p-6 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-error/10">
        <AlertTriangle className="h-6 w-6 text-status-error" />
      </div>

      <p className="text-sm font-medium text-text-secondary">{message}</p>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </m.div>
  );
}
