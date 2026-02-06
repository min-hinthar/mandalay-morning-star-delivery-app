"use client";

/**
 * CancelledState Component
 *
 * Display state for cancelled orders.
 */

import { m } from "framer-motion";
import { XCircle } from "lucide-react";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export function CancelledState() {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className="rounded-2xl border border-status-error/30 bg-status-error/5 p-5"
    >
      <div className="flex items-center gap-4">
        <m.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={getSpring(spring.ultraBouncy)}
          className="w-14 h-14 rounded-full bg-status-error/10 flex items-center justify-center"
        >
          <XCircle className="h-7 w-7 text-status-error" />
        </m.div>
        <div>
          <p className="font-semibold text-lg text-status-error">Order Cancelled</p>
          <p className="text-sm text-status-error/80 mt-0.5">
            This order has been cancelled. Contact support for help.
          </p>
        </div>
      </div>
    </m.div>
  );
}
