"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { UnifiedMenuItemCard } from "@/components/menu/UnifiedMenuItemCard";
import { MenuCardWrapper } from "@/components/menu/MenuCardWrapper";
import { CarouselControls } from "./CarouselControls";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface FeaturedCarouselProps {
  /** Featured menu items to display */
  items: MenuItem[];
  /** Auto-scroll interval in ms (0 to disable) */
  autoScrollInterval?: number;
  /** Callback when item is selected */
  onItemSelect?: (item: MenuItem) => void;
  /** Set of favorite item IDs for quick lookup */
  favorites?: Set<string>;
  /** Callback for favorite toggle */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_AUTO_SCROLL_INTERVAL = 4000;
const RESUME_DELAY = 2000;

// ============================================
// CUSTOM HOOK: useInterval
// ============================================

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Update callback ref on every render
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up interval
  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FeaturedCarousel({
  items,
  autoScrollInterval = DEFAULT_AUTO_SCROLL_INTERVAL,
  onItemSelect,
  favorites = new Set(),
  onFavoriteToggle,
  className,
}: FeaturedCarouselProps) {
  const { shouldAnimate } = useAnimationPreference();
  const scrollRef = useRef<HTMLDivElement>(null);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track visible cards via IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // ==========================================
  // AUTO-SCROLL LOGIC
  // ==========================================

  const scrollToNext = useCallback(() => {
    const container = scrollRef.current;
    if (!container || items.length === 0) return;

    // Get card width (first card)
    const firstCard = container.querySelector("[data-carousel-card]") as HTMLElement;
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    const gap = 16; // gap-4
    const scrollAmount = cardWidth + gap;

    // Check if at end
    const isAtEnd =
      container.scrollLeft + container.clientWidth >=
      container.scrollWidth - 10;

    if (isAtEnd) {
      // Scroll back to start
      container.scrollTo({ left: 0, behavior: shouldAnimate ? "smooth" : "auto" });
    } else {
      container.scrollBy({
        left: scrollAmount,
        behavior: shouldAnimate ? "smooth" : "auto",
      });
    }
  }, [items.length, shouldAnimate]);

  // Auto-scroll interval
  useInterval(
    scrollToNext,
    autoScrollInterval > 0 && !isPaused && !userHasScrolled
      ? autoScrollInterval
      : null
  );

  // ==========================================
  // PAUSE/RESUME HANDLERS
  // ==========================================

  const handlePause = useCallback(() => {
    setIsPaused(true);
    // Clear any pending resume timer
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const handleResume = useCallback(() => {
    // Don't resume if user manually scrolled
    if (userHasScrolled) return;

    // Delay resume to let user finish interacting
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, RESUME_DELAY);
  }, [userHasScrolled]);

  // ==========================================
  // MANUAL SCROLL DETECTION
  // ==========================================

  const handleScroll = useCallback(() => {
    // Mark user has scrolled to disable auto-scroll permanently
    // (Only if triggered by user drag/swipe, not programmatic)
  }, []);

  const handleUserScroll = useCallback(() => {
    setUserHasScrolled(true);
  }, []);

  // ==========================================
  // INTERSECTION OBSERVER FOR INDEX TRACKING
  // ==========================================

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(index)) {
              setCurrentIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    // Observe all cards
    cardRefs.current.forEach((card) => {
      observerRef.current?.observe(card);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items]);

  // ==========================================
  // NAVIGATION HANDLERS
  // ==========================================

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container) return;

      const card = cardRefs.current.get(index);
      if (!card) return;

      card.scrollIntoView({
        behavior: shouldAnimate ? "smooth" : "auto",
        block: "nearest",
        inline: "start",
      });

      // Mark as user scroll
      setUserHasScrolled(true);
    },
    [shouldAnimate]
  );

  const handlePrev = useCallback(() => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToIndex(newIndex);
  }, [currentIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    const newIndex = Math.min(items.length - 1, currentIndex + 1);
    scrollToIndex(newIndex);
  }, [currentIndex, items.length, scrollToIndex]);

  const handleDotClick = useCallback(
    (index: number) => {
      scrollToIndex(index);
    },
    [scrollToIndex]
  );

  // ==========================================
  // CARD REF SETTER
  // ==========================================

  const setCardRef = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      if (el) {
        cardRefs.current.set(index, el);
      } else {
        cardRefs.current.delete(index);
      }
    },
    []
  );

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  // ==========================================
  // RENDER
  // ==========================================

  if (items.length === 0) return null;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
    >
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          "flex overflow-x-auto scrollbar-hide",
          "gap-4 md:gap-6",
          "px-4 md:px-6",
          "pt-4 pb-4", // Space for 3D tilt effect and shadows
          "-mt-2", // Compensate for visual alignment
          "touch-pan-x"
        )}
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
        onScroll={handleScroll}
        onTouchMove={handleUserScroll}
        onWheel={handleUserScroll}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            ref={(el) => setCardRef(index, el as HTMLDivElement)}
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

      {/* Controls */}
      <CarouselControls
        totalItems={items.length}
        currentIndex={currentIndex}
        onPrev={handlePrev}
        onNext={handleNext}
        onDotClick={handleDotClick}
        dotLabels={items.map((item) => item.nameEn)}
      />
    </div>
  );
}

export default FeaturedCarousel;
