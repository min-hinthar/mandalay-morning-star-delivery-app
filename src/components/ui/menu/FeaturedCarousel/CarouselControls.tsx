"use client";

import { m, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface CarouselControlsProps {
  /** Total number of items */
  totalItems: number;
  /** Current visible index */
  currentIndex: number;
  /** Callback when dot is clicked */
  onDotClick: (index: number) => void;
  /** Labels for dot indicators (item names) */
  dotLabels?: string[];
  /** Additional className */
  className?: string;
}

// ============================================
// ARROW BUTTON (warm paper — overlays the cards)
// ============================================

export interface ArrowButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}

export function ArrowButton({ direction, onClick, disabled }: ArrowButtonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <AnimatePresence>
      {!disabled && (
        <m.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={cn(
            "absolute top-1/2 z-20 -translate-y-1/2",
            "hidden h-10 w-10 items-center justify-center sm:flex md:h-11 md:w-11",
            "rounded-full hero-surface-paper",
            "text-hero-ink hover:text-hero-clay",
            "shadow-md transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/60",
            direction === "left" ? "left-1 md:left-2" : "right-1 md:right-2"
          )}
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          exit={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
          transition={shouldAnimate ? getSpring(spring.snappy) : undefined}
          aria-label={direction === "left" ? "Previous items" : "Next items"}
        >
          <Icon className="h-5 w-5" />
        </m.button>
      )}
    </AnimatePresence>
  );
}

// ============================================
// DOTS — editorial clay pills (the active one stretches)
// ============================================

export function CarouselControls({
  totalItems,
  currentIndex,
  onDotClick,
  dotLabels,
  className,
}: CarouselControlsProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <div className={cn("mt-5 flex justify-center", className)}>
      <div className="flex items-center gap-1.5" aria-label="Featured dishes">
        {Array.from({ length: totalItems }).map((_, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={i}
              type="button"
              aria-current={isActive ? "true" : undefined}
              aria-label={dotLabels?.[i] ?? `Go to item ${i + 1}`}
              onClick={() => onDotClick(i)}
              className="group grid place-items-center py-1.5 focus-visible:outline-none"
            >
              <m.span
                className={cn(
                  "block h-1.5 rounded-full transition-colors",
                  isActive
                    ? "bg-hero-clay"
                    : "bg-hero-ink/20 group-hover:bg-hero-ink/35 group-focus-visible:ring-2 group-focus-visible:ring-hero-clay/60"
                )}
                animate={shouldAnimate ? { width: isActive ? 22 : 6 } : undefined}
                style={shouldAnimate ? undefined : { width: isActive ? 22 : 6 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CarouselControls;
