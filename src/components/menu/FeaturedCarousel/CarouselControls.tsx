"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { NavDots } from "@/components/ui/NavDots";

// ============================================
// TYPES
// ============================================

export interface CarouselControlsProps {
  /** Total number of items */
  totalItems: number;
  /** Current visible index */
  currentIndex: number;
  /** Callback for previous button */
  onPrev: () => void;
  /** Callback for next button */
  onNext: () => void;
  /** Callback when dot is clicked */
  onDotClick: (index: number) => void;
  /** Labels for dot indicators (item names) */
  dotLabels?: string[];
  /** Additional className */
  className?: string;
}

// ============================================
// ARROW BUTTON COMPONENT
// ============================================

interface ArrowButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}

function ArrowButton({ direction, onClick, disabled }: ArrowButtonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <AnimatePresence>
      {!disabled && (
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-20",
            "w-10 h-10 md:w-12 md:h-12",
            "flex items-center justify-center",
            "rounded-full",
            "bg-surface-primary/80 backdrop-blur-md",
            "border border-border-subtle",
            "text-text-primary hover:text-primary",
            "shadow-lg hover:shadow-xl",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            direction === "left" ? "left-2 md:left-4" : "right-2 md:right-4"
          )}
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          exit={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
          transition={shouldAnimate ? getSpring(spring.snappy) : undefined}
          aria-label={direction === "left" ? "Previous items" : "Next items"}
        >
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CarouselControls({
  totalItems,
  currentIndex,
  onPrev,
  onNext,
  onDotClick,
  dotLabels,
  className,
}: CarouselControlsProps) {
  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex >= totalItems - 1;

  return (
    <div className={cn("relative", className)}>
      {/* Arrow buttons */}
      <ArrowButton
        direction="left"
        onClick={onPrev}
        disabled={isAtStart}
      />
      <ArrowButton
        direction="right"
        onClick={onNext}
        disabled={isAtEnd}
      />

      {/* Dots indicator */}
      <div className="flex justify-center mt-6">
        <NavDots
          total={totalItems}
          current={currentIndex}
          onSelect={onDotClick}
          labels={dotLabels}
          layoutId="featuredCarouselDot"
        />
      </div>
    </div>
  );
}

export default CarouselControls;
