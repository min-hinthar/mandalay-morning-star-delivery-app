"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  /** Callback for previous button */
  onPrev: () => void;
  /** Callback for next button */
  onNext: () => void;
  /** Callback when dot is clicked */
  onDotClick: (index: number) => void;
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
// DOTS INDICATOR COMPONENT
// ============================================

interface DotsIndicatorProps {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
}

function DotsIndicator({ total, current, onDotClick }: DotsIndicatorProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Limit dots if too many items
  const maxDots = 10;
  const displayedDots = Math.min(total, maxDots);
  const step = total > maxDots ? Math.floor(total / maxDots) : 1;
  const currentDotIndex = Math.floor(current / step);

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {Array.from({ length: displayedDots }).map((_, i) => {
        const isActive = currentDotIndex === i;

        return (
          <motion.button
            key={i}
            type="button"
            onClick={() => onDotClick(i * step)}
            className={cn(
              "relative rounded-full transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isActive
                ? "w-3 h-3 bg-primary"
                : "w-2 h-2 bg-text-muted/30 hover:bg-text-muted/50"
            )}
            whileHover={shouldAnimate ? { scale: 1.2 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
            transition={shouldAnimate ? getSpring(spring.snappy) : undefined}
            aria-label={`Go to item ${i * step + 1}`}
            aria-current={isActive ? "true" : undefined}
          >
            {/* Active dot indicator with layoutId for smooth transition */}
            {isActive && (
              <motion.div
                layoutId="activeCarouselDot"
                className="absolute inset-0 rounded-full bg-primary"
                initial={false}
                transition={shouldAnimate ? getSpring(spring.snappy) : { duration: 0 }}
                style={{
                  boxShadow: "0 2px 8px rgba(164, 16, 52, 0.4)",
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
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
      <DotsIndicator
        total={totalItems}
        current={currentIndex}
        onDotClick={onDotClick}
      />
    </div>
  );
}

export default CarouselControls;
