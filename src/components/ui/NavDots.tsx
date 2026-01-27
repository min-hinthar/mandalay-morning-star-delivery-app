"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface NavDotsProps {
  /** Total number of items */
  total: number;
  /** Current active index */
  current: number;
  /** Callback when dot is clicked */
  onSelect: (index: number) => void;
  /** Labels for each dot (optional, shows on hover) */
  labels?: string[];
  /** Layout ID for shared animation (optional) */
  layoutId?: string;
  /** Maximum dots to display (default: 10) */
  maxDots?: number;
  /** Additional className for container */
  className?: string;
}

// ============================================
// DOT COMPONENT
// ============================================

interface DotProps {
  index: number;
  isActive: boolean;
  label?: string;
  layoutId?: string;
  onClick: () => void;
}

function Dot({ index, isActive, label, layoutId, onClick }: DotProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isActive
          ? "w-3 h-3 bg-primary"
          : "w-2 h-2 bg-text-muted/30 hover:bg-text-muted/50"
      )}
      whileHover={shouldAnimate ? { scale: 1.3 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
      transition={shouldAnimate ? getSpring(spring.snappy) : undefined}
      aria-label={label ? `Go to ${label}` : `Go to item ${index + 1}`}
      aria-current={isActive ? "true" : undefined}
    >
      {/* Active dot indicator with layoutId for smooth transition */}
      {isActive && layoutId && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-full bg-primary"
          initial={false}
          transition={shouldAnimate ? getSpring(spring.snappy) : { duration: 0 }}
          style={{
            boxShadow: "0 2px 8px rgba(164, 16, 52, 0.4)",
          }}
        />
      )}

      {/* Label tooltip on hover */}
      <AnimatePresence>
        {isHovered && label && (
          <motion.span
            className={cn(
              "absolute -top-9 left-1/2 -translate-x-1/2",
              "px-2.5 py-1.5 text-xs font-medium whitespace-nowrap",
              "bg-surface-primary/95 backdrop-blur-sm",
              "border border-border rounded-lg shadow-lg",
              "text-text-primary",
              "pointer-events-none z-10"
            )}
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {label}
            {/* Arrow pointer */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-primary border-r border-b border-border rotate-45" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * NavDots - Unified navigation dots component
 *
 * Features:
 * - Shadowed pill container with glassmorphism
 * - Hover labels appear above dots
 * - Smooth dot transition via layoutId
 * - Animation-preference aware
 * - Max dots with step calculation
 *
 * @example
 * <NavDots
 *   total={5}
 *   current={currentIndex}
 *   onSelect={setCurrentIndex}
 *   labels={["Home", "About", "Contact"]}
 *   layoutId="myCarouselDot"
 * />
 */
export function NavDots({
  total,
  current,
  onSelect,
  labels,
  layoutId,
  maxDots = 10,
  className,
}: NavDotsProps) {
  const { shouldAnimate } = useAnimationPreference();

  // Limit dots if too many items
  const displayedDots = Math.min(total, maxDots);
  const step = total > maxDots ? Math.floor(total / maxDots) : 1;
  const currentDotIndex = Math.floor(current / step);

  const handleDotClick = useCallback(
    (index: number) => {
      onSelect(index * step);
    },
    [onSelect, step]
  );

  if (total <= 1) return null;

  return (
    <motion.div
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "px-3 py-2",
        "bg-surface-primary/80 backdrop-blur-md",
        "rounded-full border border-border-subtle",
        "shadow-lg",
        className
      )}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {Array.from({ length: displayedDots }).map((_, i) => {
        const actualIndex = i * step;
        const isActive = currentDotIndex === i;
        const label = labels?.[actualIndex];

        return (
          <Dot
            key={i}
            index={actualIndex}
            isActive={isActive}
            label={label}
            layoutId={layoutId}
            onClick={() => handleDotClick(i)}
          />
        );
      })}
    </motion.div>
  );
}

export default NavDots;
