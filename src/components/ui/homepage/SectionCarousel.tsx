"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { spring } from "@/lib/motion-tokens";
import { UnifiedMenuItemCard, MenuCardWrapper } from "@/components/ui/menu";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface SectionCarouselProps {
  /** Menu items to display */
  items: MenuItem[];
  /** Callback when item is selected */
  onItemSelect?: (item: MenuItem) => void;
  /** Set of favorite item IDs for quick lookup */
  favorites?: Set<string>;
  /** Callback for favorite toggle */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  /** Accent color for navigation arrows */
  accentColor?: string | null;
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
  accentColor?: string | null;
}

function ArrowButton({ direction, onClick, disabled, accentColor }: ArrowButtonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  const buttonStyle = accentColor
    ? {
        backgroundColor: `${accentColor}15`,
        borderColor: `${accentColor}30`,
        color: accentColor,
      }
    : {};

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
            // MOBILE: No backdrop-blur (Safari crashes)
            // eslint-disable-next-line no-restricted-syntax -- explicit colors needed for mobile CSS var resolution
            "bg-white dark:bg-black md:bg-white/80 md:dark:bg-black/80 md:backdrop-blur-md",
            "border border-border-subtle",
            "text-text-primary hover:text-primary",
            "shadow-lg hover:shadow-xl",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            direction === "left" ? "left-2 md:left-4" : "right-2 md:right-4"
          )}
          style={buttonStyle}
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

/**
 * Horizontal scrolling carousel for featured section items.
 * No auto-scroll, always-visible arrows, snap scrolling.
 * Shows ~3 items on desktop, ~1.5 on mobile.
 */
export function SectionCarousel({
  items,
  onItemSelect,
  favorites = new Set(),
  onFavoriteToggle,
  accentColor,
  className,
}: SectionCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update scroll state based on scroll position
  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  // Initial check and resize listener
  useEffect(() => {
    updateScrollState();

    const container = scrollRef.current;
    if (!container) return;

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [updateScrollState, items]);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    updateScrollState();
  }, [updateScrollState]);

  // Navigate left
  const handlePrev = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const card = container.querySelector("[data-carousel-card]") as HTMLElement;
    if (!card) return;

    const scrollAmount = card.offsetWidth + 16; // card width + gap
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  }, []);

  // Navigate right
  const handleNext = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const card = container.querySelector("[data-carousel-card]") as HTMLElement;
    if (!card) return;

    const scrollAmount = card.offsetWidth + 16; // card width + gap
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          "flex overflow-x-auto scrollbar-hide",
          "gap-4 md:gap-6",
          "px-4 md:px-6",
          "pt-4 pb-4",
          "-mt-2",
          "touch-pan-x"
        )}
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            data-carousel-card
            data-index={index}
            className={cn(
              "flex-shrink-0",
              "w-[280px] md:w-[320px]",
              "snap-start"
            )}
            style={{ scrollSnapAlign: "start" }}
          >
            <MenuCardWrapper
              itemId={item.id}
              index={index}
              replayOnScroll={false}
              animateMode="viewport"
            >
              <UnifiedMenuItemCard
                item={item}
                variant="homepage"
                onSelect={onItemSelect}
                isFavorite={favorites.has(item.id)}
                onFavoriteToggle={onFavoriteToggle}
                priority={index < 3}
              />
            </MenuCardWrapper>
          </div>
        ))}
      </div>

      {/* Navigation arrows - always visible when scrollable */}
      <ArrowButton
        direction="left"
        onClick={handlePrev}
        disabled={!canScrollLeft}
        accentColor={accentColor}
      />
      <ArrowButton
        direction="right"
        onClick={handleNext}
        disabled={!canScrollRight}
        accentColor={accentColor}
      />
    </div>
  );
}

export default SectionCarousel;
