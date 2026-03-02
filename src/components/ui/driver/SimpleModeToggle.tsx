/**
 * SimpleModeToggle - Toggle switch for simple mode on driver profile page
 *
 * Accessible toggle with clear explanation of what simple mode does.
 * Uses SimpleModeProvider context for optimistic state management.
 */

"use client";

import { m } from "framer-motion";
import { Smartphone } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useSimpleMode } from "./SimpleModeProvider";

export function SimpleModeToggle() {
  const { isSimpleMode, toggleSimpleMode } = useSimpleMode();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn(
        "rounded-2xl border border-border shadow-card p-5",
        "bg-surface-primary/80 backdrop-blur-sm"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-teal/10">
          <Smartphone className="h-5 w-5 text-accent-teal" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-body text-base font-semibold text-text-primary">Simple Mode</h3>

            {/* Toggle Switch */}
            <button
              role="switch"
              aria-checked={isSimpleMode}
              aria-label="Toggle simple mode"
              onClick={toggleSimpleMode}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-fast",
                isSimpleMode ? "bg-accent-teal" : "bg-surface-tertiary"
              )}
            >
              <m.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                  "pointer-events-none block h-5 w-5 rounded-full bg-surface-primary shadow-sm",
                  "mt-1",
                  isSimpleMode ? "ml-6" : "ml-1"
                )}
              />
            </button>
          </div>

          <p className="mt-1 font-body text-sm text-text-secondary">
            Shows only essential delivery info — perfect for new or occasional drivers. Hides
            earnings, schedule, and history tabs.
          </p>

          <p className="mt-2 font-body text-xs text-text-muted">
            {isSimpleMode ? "On" : "Off"} —{" "}
            {isSimpleMode ? "showing essentials only" : "showing all features"}
          </p>
        </div>
      </div>
    </m.div>
  );
}
