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
 * Compact iOS-style side navigation dots for scrolling between sections.
 *
 * Features:
 * - Fixed position on right side (visible on all screens)
 * - Filled opaque dots with larger active state
 * - Hover reveals section label tooltip (clears on selection)
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
    // Clear tooltip on selection
    setHoveredIndex(null);

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
        "fixed right-2 md:right-3 top-1/2 -translate-y-1/2",
        // Compact gap between dots
        "flex flex-col gap-2",
        // Compact pill container
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
        "px-1.5 py-2 rounded-full",
        // eslint-disable-next-line no-restricted-syntax -- explicit colors needed for mobile CSS var resolution
        "bg-white/80 dark:bg-black/70 md:bg-white/70 md:dark:bg-black/60 md:backdrop-blur-md",
        "border border-border-subtle/50 shadow-md",
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
            // Compact touch target
            className="group relative flex items-center justify-center p-1"
            whileHover={shouldAnimate ? { scale: 1.15 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
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

            {/* Dot indicator - filled opaque dots */}
            <motion.span
              className={cn(
                "rounded-full transition-all duration-150",
                isActive
                  ? // Active: larger primary dot
                    "w-2.5 h-2.5 bg-primary"
                  : // Inactive: smaller muted dot
                    "w-2 h-2 bg-gray-400 dark:bg-gray-500",
                // Hover state for inactive dots
                !isActive && isHovered && "bg-primary/70 dark:bg-primary/70",
                // Pressed state
                isPressed && !isActive && "bg-primary/50"
              )}
              animate={{
                scale: isPressed ? 0.85 : 1,
              }}
              transition={{ duration: 0.1 }}
            />
          </motion.button>
        );
      })}
    </nav>
  );
}
