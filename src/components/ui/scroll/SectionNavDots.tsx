"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useScrollSpy } from "@/lib/hooks/useScrollSpy";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { triggerHaptic } from "@/lib/swipe-gestures";
import { zClass } from "@/lib/design-system/tokens/z-index";
import { spring } from "@/lib/motion-tokens";

interface Section {
  /** Section element ID (must match the id attribute of the section) */
  id: string;
  /** Label shown on hover */
  label: string;
}

interface SectionNavDotsProps {
  /** Array of sections to navigate */
  sections: Section[];
  /** Additional CSS classes for the nav container */
  className?: string;
}

/**
 * iOS-style side navigation dots for scrolling between sections.
 *
 * Features:
 * - Fixed position on right side (visible on all screens)
 * - Unfilled ring dots with filled active state
 * - Hover reveals section label tooltip
 * - Snap-to-section scroll with haptic feedback
 * - Press-and-hold visual feedback like iOS
 * - Uses IntersectionObserver-based useScrollSpy
 *
 * @example
 * const sections = [
 *   { id: "hero", label: "Home" },
 *   { id: "how-it-works", label: "How It Works" },
 *   { id: "menu", label: "Menu" },
 * ];
 *
 * <SectionNavDots sections={sections} />
 */
export function SectionNavDots({ sections, className }: SectionNavDotsProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  // Get section IDs for scroll spy
  const sectionIds = useMemo(
    () => sections.map((s) => s.id),
    [sections]
  );

  // Track active section index
  const activeIndex = useScrollSpy(sectionIds);

  // Handle click: snap scroll to section with haptic feedback
  const handleClick = useCallback((index: number) => {
    // Trigger haptic feedback for tactile response
    triggerHaptic("medium");

    const el = document.getElementById(sections[index].id);
    if (el) {
      // Snap scroll to section
      el.scrollIntoView({
        behavior: shouldAnimate ? "smooth" : "auto",
        block: "start",
      });
    }
  }, [sections, shouldAnimate]);

  // Handle press start - iOS-style press feedback
  const handlePressStart = useCallback((index: number) => {
    setPressedIndex(index);
    // Light haptic on press start
    triggerHaptic("light");
  }, []);

  // Handle press end
  const handlePressEnd = useCallback(() => {
    setPressedIndex(null);
  }, []);

  // Don't render if no sections
  if (sections.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        // Fixed positioning, vertically centered on right
        "fixed right-3 md:right-4 lg:right-8 top-1/2 -translate-y-1/2",
        // Comfortable gap between dots
        "flex flex-col gap-3 md:gap-4",
        // Pill container styling
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
        "px-2.5 py-3 md:py-4 rounded-full",
        // eslint-disable-next-line no-restricted-syntax -- explicit colors needed for mobile CSS var resolution
        "bg-white/70 dark:bg-black/60 md:bg-white/60 md:dark:bg-black/50 md:backdrop-blur-md",
        "border border-border-subtle shadow-lg",
        // Z-index above content but below modals
        zClass.fixed,
        className
      )}
      aria-label="Section navigation"
    >
      {sections.map((section, index) => {
        const isActive = index === activeIndex;
        const isHovered = hoveredIndex === index;
        const isPressed = pressedIndex === index;

        return (
          <motion.button
            key={section.id}
            onClick={() => handleClick(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onMouseDown={() => handlePressStart(index)}
            onMouseUp={handlePressEnd}
            onTouchStart={() => handlePressStart(index)}
            onTouchEnd={handlePressEnd}
            // Larger touch target
            className="group relative flex items-center justify-center p-1.5"
            whileHover={shouldAnimate ? { scale: 1.2 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.85 } : undefined}
            transition={getSpring(spring.snappy)}
            aria-label={`Go to ${section.label}`}
            aria-current={isActive ? "true" : undefined}
          >
            {/* Tooltip label on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  className={cn(
                    "absolute right-full mr-4 px-3 py-1.5 rounded-lg z-10",
                    "text-xs font-semibold whitespace-nowrap",
                    // Dark tooltip with good contrast
                    "bg-gray-900 dark:bg-gray-100 text-text-inverse dark:text-gray-900",
                    "shadow-lg",
                    "pointer-events-none"
                  )}
                  initial={{ opacity: 0, x: 8, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.9 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {section.label}
                  {/* Arrow pointing right toward dot */}
                  <span
                    className={cn(
                      "absolute top-1/2 -right-1.5 -translate-y-1/2",
                      "w-0 h-0",
                      "border-t-[6px] border-b-[6px] border-l-[6px]",
                      "border-transparent border-l-gray-900 dark:border-l-gray-100"
                    )}
                  />
                </motion.span>
              )}
            </AnimatePresence>

            {/* Dot indicator - unfilled ring, filled when active */}
            <motion.span
              className={cn(
                "w-3 h-3 rounded-full",
                "transition-all duration-200",
                isActive
                  ? // Active: filled primary with glow
                    "bg-primary shadow-[0_0_8px_rgba(164,16,52,0.5)]"
                  : // Inactive: unfilled ring
                    "bg-transparent border-2 border-gray-400 dark:border-gray-500",
                // Hover state for inactive dots
                !isActive && isHovered && "border-primary dark:border-primary",
                // Pressed state - shrink effect handled by whileTap
                isPressed && !isActive && "border-primary/70"
              )}
              animate={{
                scale: isPressed ? 0.8 : 1,
              }}
              transition={{ duration: 0.1 }}
            />

            {/* Active indicator ring animation */}
            {isActive && shouldAnimate && (
              <motion.span
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={getSpring(spring.snappy)}
              >
                <span className="w-5 h-5 rounded-full border-2 border-primary/30" />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
