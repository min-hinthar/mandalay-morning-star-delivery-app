"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
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
 * iOS-style expandable scroll indicator that fans out on hover.
 *
 * Features:
 * - Default: Compact dots only, minimal styling
 * - Hover/touch: Expands leftward revealing section labels
 * - Staggered animation for labels
 * - Snap-to-section scroll with haptic feedback
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
  const [isExpanded, setIsExpanded] = useState(false);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get section IDs for scroll spy
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  // Track active section index
  const activeIndex = useScrollSpy(sectionIds);

  // Handle click: snap scroll to section with haptic feedback
  const handleClick = useCallback(
    (index: number) => {
      triggerHaptic("medium");

      const el = document.getElementById(sections[index].id);
      if (el) {
        el.scrollIntoView({
          behavior: shouldAnimate ? "smooth" : "auto",
          block: "start",
        });
      }
    },
    [sections, shouldAnimate]
  );

  // Expand handlers
  const handleExpand = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsExpanded(true);
  }, []);

  const handleCollapse = useCallback(() => {
    // Delay collapse slightly for better UX
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 150);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback(() => {
    handleExpand();
    triggerHaptic("light");
  }, [handleExpand]);

  const handleTouchEnd = useCallback(() => {
    // Longer delay on touch to allow tap selection
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 800);
  }, []);

  // Don't render if no sections
  if (sections.length === 0) {
    return null;
  }

  return (
    <m.nav
      className={cn(
        // Fixed positioning on right
        "fixed right-2 md:right-3 top-1/2 -translate-y-1/2",
        // Flex column layout
        "flex flex-col gap-1.5",
        // Z-index above content but below modals
        zClass.fixed,
        className
      )}
      onMouseEnter={handleExpand}
      onMouseLeave={handleCollapse}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Section navigation"
    >
      {/* Background container - animates in on expand */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            className={cn(
              "absolute inset-0 -inset-x-1 -inset-y-1 rounded-xl",
              // MOBILE CRASH PREVENTION: No backdrop-blur on mobile
              // eslint-disable-next-line no-restricted-syntax -- explicit colors needed for mobile CSS var resolution
              "bg-white/90 dark:bg-black/85 md:bg-white/80 md:dark:bg-black/75 md:backdrop-blur-md",
              "border border-border-subtle/50 shadow-lg"
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* Section buttons */}
      {sections.map((section, index) => {
        const isActive = index === activeIndex;

        return (
          <m.button
            key={section.id}
            onClick={() => handleClick(index)}
            className={cn(
              "relative flex items-center justify-end gap-2",
              "py-1 px-1.5",
              "rounded-lg transition-colors duration-100",
              isExpanded && "hover:bg-primary/10 dark:hover:bg-primary/20"
            )}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            transition={getSpring(spring.snappy)}
            aria-label={`Go to ${section.label}`}
            aria-current={isActive ? "true" : undefined}
          >
            {/* Label - animate in/out with stagger */}
            <AnimatePresence>
              {isExpanded && (
                <m.span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isActive ? "text-primary font-semibold" : "text-text-secondary"
                  )}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{
                    duration: 0.12,
                    delay: index * 0.02,
                    ease: "easeOut",
                  }}
                >
                  {section.label}
                </m.span>
              )}
            </AnimatePresence>

            {/* Dot indicator */}
            <m.span
              className={cn(
                "rounded-full flex-shrink-0 transition-all duration-150",
                isActive ? "w-2.5 h-2.5 bg-primary" : "w-2 h-2 bg-gray-400 dark:bg-gray-500"
              )}
              animate={{
                scale: isActive && isExpanded ? 1.1 : 1,
              }}
              transition={{ duration: 0.1 }}
            />
          </m.button>
        );
      })}
    </m.nav>
  );
}
