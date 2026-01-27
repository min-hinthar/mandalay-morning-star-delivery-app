"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useScrollSpy } from "@/lib/hooks/useScrollSpy";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { zClass } from "@/design-system/tokens/z-index";

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
 * Side navigation dots for scrolling between sections.
 *
 * Features:
 * - Fixed position on right side (visible on all screens)
 * - Responsive sizing (smaller on mobile)
 * - Active section highlighted
 * - Hover reveals section label with arrow pointer
 * - Click scrolls to section (smooth or instant based on motion preference)
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
  const { shouldAnimate } = useAnimationPreference();

  // Get section IDs for scroll spy
  const sectionIds = useMemo(
    () => sections.map((s) => s.id),
    [sections]
  );

  // Track active section index
  const activeIndex = useScrollSpy(sectionIds);

  // Handle click: scroll to section
  const handleClick = (index: number) => {
    const el = document.getElementById(sections[index].id);
    if (el) {
      el.scrollIntoView({
        behavior: shouldAnimate ? "smooth" : "auto",
        block: "start",
      });
    }
  };

  // Don't render if no sections
  if (sections.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        // Fixed positioning, vertically centered on right
        "fixed right-2 md:right-4 lg:right-8 top-1/2 -translate-y-1/2",
        // Show on all screens, smaller gap on mobile
        "flex flex-col gap-2 md:gap-3",
        // Pill container styling - smaller on mobile
        "px-1.5 md:px-2 py-2 md:py-3 rounded-full",
        "bg-surface-primary/80 backdrop-blur-md",
        "border border-border-subtle shadow-lg",
        // Z-index above content but below modals
        zClass.fixed,
        className
      )}
      aria-label="Section navigation"
    >
      {sections.map((section, index) => (
        <motion.button
          key={section.id}
          onClick={() => handleClick(index)}
          className="group relative flex items-center justify-end"
          whileHover={shouldAnimate ? { scale: 1.2 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
          aria-label={`Go to ${section.label}`}
          aria-current={index === activeIndex ? "true" : undefined}
        >
          {/* Label on hover - dark tooltip with arrow */}
          <span
            className={cn(
              "absolute right-full mr-2 px-2 py-1 rounded",
              "text-[10px] md:text-xs font-medium whitespace-nowrap",
              // Dark tooltip style
              "bg-text-primary/90 text-surface-primary",
              "shadow-sm",
              // Hover reveal animation
              "opacity-0 group-hover:opacity-100",
              "translate-x-2 group-hover:translate-x-0",
              "pointer-events-none",
              shouldAnimate
                ? "transition-all duration-200 ease-out"
                : "transition-none"
            )}
          >
            {section.label}
            {/* Arrow pointing right toward dot */}
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-text-primary/90" />
          </span>

          {/* Dot indicator - responsive size */}
          <span
            className={cn(
              "w-2 h-2 md:w-3 md:h-3 rounded-full",
              shouldAnimate
                ? "transition-colors duration-200"
                : "transition-none",
              index === activeIndex
                ? "bg-primary"
                : "bg-text-muted/30 group-hover:bg-text-muted/60"
            )}
          />
        </motion.button>
      ))}
    </nav>
  );
}
