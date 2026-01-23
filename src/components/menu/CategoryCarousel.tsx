"use client";

import React, { useRef, useCallback, useEffect, useState, useMemo } from "react";
import {
  motion,
  PanInfo,
  useMotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { MenuCategory } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface CategoryCarouselProps {
  /** Categories to display */
  categories: MenuCategory[];
  /** Currently active category slug (null for "All") */
  activeCategory: string | null;
  /** Callback when category is clicked */
  onCategoryClick: (slug: string | null) => void;
  /** Additional className */
  className?: string;
  /** Show "All" option */
  showAll?: boolean;
  /** Sticky positioning */
  sticky?: boolean;
}

// ============================================
// CATEGORY CHIP COMPONENT
// ============================================

interface CategoryChipProps {
  slug: string | null;
  name: string;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

function CategoryChip({ slug: _slug, name, isActive, onClick, index }: CategoryChipProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0 px-5 py-3 rounded-full",
        "font-body text-sm font-semibold",
        "min-h-[48px] min-w-[80px]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isActive
          ? "text-white"
          : "text-text-secondary hover:text-text-primary"
      )}
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={
        shouldAnimate
          ? { ...getSpring(spring.rubbery), delay: index * 0.05 }
          : undefined
      }
      whileHover={shouldAnimate && !isActive ? { scale: 1.05, y: -2 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
      aria-pressed={isActive}
    >
      {/* Active background with glow */}
      {isActive && (
        <motion.div
          layoutId="v7ActiveCategory"
          className="absolute inset-0 rounded-full bg-primary shadow-lg"
          initial={false}
          transition={shouldAnimate ? getSpring(spring.snappy) : { duration: 0 }}
          style={{
            boxShadow: "0 4px 20px rgba(164, 16, 52, 0.4)",
          }}
        />
      )}

      {/* Inactive hover background */}
      {!isActive && (
        <div className="absolute inset-0 rounded-full bg-surface-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Text */}
      <span className="relative z-dropdown">{name}</span>

      {/* Active glow pulse */}
      {isActive && shouldAnimate && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{
            opacity: [0.5, 0, 0.5],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.button>
  );
}

// ============================================
// MAIN CAROUSEL COMPONENT
// ============================================

export function CategoryCarousel({
  categories,
  activeCategory,
  onCategoryClick,
  className,
  showAll = true,
  sticky = true,
}: CategoryCarouselProps) {
  const { shouldAnimate } = useAnimationPreference();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll state
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Drag state for momentum (prepared for swipe implementation)
  const _x = useMotionValue(0);

  // Build tabs array - memoized to avoid useEffect deps warning
  const tabs = useMemo(() => [
    ...(showAll ? [{ slug: null, name: "All" }] : []),
    ...categories.map((cat) => ({ slug: cat.slug, name: cat.name })),
  ], [showAll, categories]);

  // Update fade indicators
  const updateFades = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftFade(scrollLeft > 10);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Initial and resize check
  useEffect(() => {
    updateFades();
    const container = scrollRef.current;
    if (!container) return;

    const observer = new ResizeObserver(updateFades);
    observer.observe(container);

    return () => observer.disconnect();
  }, [updateFades, categories]);

  // Scroll active category into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const activeIndex = tabs.findIndex((t) => t.slug === activeCategory);
    if (activeIndex === -1) return;

    const buttons = container.querySelectorAll("button");
    const activeButton = buttons[activeIndex];

    if (activeButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      if (
        buttonRect.left < containerRect.left + 50 ||
        buttonRect.right > containerRect.right - 50
      ) {
        activeButton.scrollIntoView({
          behavior: shouldAnimate ? "smooth" : "auto",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeCategory, tabs, shouldAnimate]);

  // Handle drag with momentum
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const container = scrollRef.current;
      if (!container) return;

      // Apply momentum
      const velocity = info.velocity.x;
      const momentum = velocity * 0.3;

      container.scrollBy({
        left: -momentum,
        behavior: shouldAnimate ? "smooth" : "auto",
      });

      updateFades();
    },
    [shouldAnimate, updateFades]
  );

  // Haptic feedback on category select
  const handleCategoryClick = useCallback(
    (slug: string | null) => {
      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onCategoryClick(slug);
    },
    [onCategoryClick]
  );

  return (
    <nav
      aria-label="Menu categories"
      className={cn(
        sticky && "sticky top-14 z-fixed",
        "bg-surface-primary/95 backdrop-blur-lg",
        "border-b border-border-subtle",
        className
      )}
    >
      <div className="relative">
        {/* Left fade */}
        <motion.div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-16 z-dropdown pointer-events-none",
            "bg-gradient-to-r from-surface-primary to-transparent"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: showLeftFade ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        />

        {/* Right fade */}
        <motion.div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-16 z-dropdown pointer-events-none",
            "bg-gradient-to-l from-surface-primary to-transparent"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: showRightFade ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        />

        {/* Scrollable container */}
        <motion.div
          ref={scrollRef}
          className={cn(
            "flex overflow-x-auto scrollbar-hide",
            "px-4 py-3 gap-2",
            "touch-pan-x"
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={updateFades}
          drag={shouldAnimate ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          {tabs.map((tab, index) => (
            <CategoryChip
              key={tab.slug ?? "all"}
              slug={tab.slug}
              name={tab.name}
              isActive={activeCategory === tab.slug}
              onClick={() => handleCategoryClick(tab.slug)}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </nav>
  );
}

export default CategoryCarousel;
