"use client";

import { memo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export type ValidationStatus = "sold-out" | "unavailable";

export interface ValidationOverlayProps {
  status: ValidationStatus;
  onRemove: () => void;
}

const statusConfig = {
  "sold-out": {
    label: "Sold Out",
    Icon: AlertTriangle,
    badgeBg: "bg-amber-500",
    badgeText: "text-text-inverse",
  },
  unavailable: {
    label: "Unavailable",
    Icon: XCircle,
    badgeBg: "bg-red-500",
    badgeText: "text-text-inverse",
  },
} as const;

export const ValidationOverlay = memo(function ValidationOverlay({
  status,
  onRemove,
}: ValidationOverlayProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const config = statusConfig[status];
  const Icon = config.Icon;

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove();
    },
    [onRemove]
  );

  return (
    <AnimatePresence>
      <m.div
        initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        transition={shouldAnimate ? getSpring(spring.gentle) : undefined}
        className={cn(
          "absolute inset-0 z-10 rounded-2xl overflow-hidden",
          "bg-surface-inverse/40 dark:bg-surface-inverse/60 backdrop-blur-[1px]",
          "flex flex-col items-center justify-between py-3"
        )}
      >
        {/* Status badge - top right */}
        <div className="w-full flex justify-end px-3">
          <m.div
            initial={shouldAnimate ? { scale: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1 } : undefined}
            transition={
              shouldAnimate
                ? {
                    type: "spring",
                    stiffness: 350,
                    damping: 8,
                    mass: 1,
                    delay: 0.1,
                  }
                : undefined
            }
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
              "text-xs font-semibold shadow-md",
              config.badgeBg,
              config.badgeText
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </m.div>
        </div>

        {/* Remove button - bottom center */}
        <button
          type="button"
          onClick={handleRemove}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl",
            "text-sm font-medium",
            "bg-red-500/20 text-text-inverse border border-red-400/40",
            "hover:bg-red-500/30 active:bg-red-500/40",
            "transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          )}
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
      </m.div>
    </AnimatePresence>
  );
});

export default ValidationOverlay;
