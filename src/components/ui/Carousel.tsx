"use client";

import React, {
  useState,
  useRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import {
  motion,
  useMotionValue,
  useAnimation,
  PanInfo,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface CarouselProps {
  children: ReactNode[];
  /** Gap between items in pixels */
  gap?: number;
  /** Enable infinite loop */
  loop?: boolean;
  /** Auto-play interval in ms (0 to disable) */
  autoPlay?: number;
  /** Show navigation dots */
  showDots?: boolean;
  /** Show arrow buttons */
  showArrows?: boolean;
  /** Snap to items */
  snap?: boolean;
  /** Drag sensitivity multiplier */
  dragSensitivity?: number;
  /** Additional class names */
  className?: string;
  /** Callback when active index changes */
  onIndexChange?: (index: number) => void;
  /** Initial index */
  initialIndex?: number;
  /** Item width (auto calculates if not provided) */
  itemWidth?: number | "auto";
  /** Visible items count */
  visibleItems?: number;
  /** Enable haptic feedback */
  haptic?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      children,
      gap = 16,
      loop = false,
      autoPlay = 0,
      showDots = true,
      showArrows = true,
      snap: _snap = true,
      dragSensitivity = 1.5,
      className,
      onIndexChange,
      initialIndex = 0,
      itemWidth = "auto",
      visibleItems = 1,
      haptic = true,
    },
    ref
  ) => {
    const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [_containerWidth, setContainerWidth] = useState(0);
    const [calculatedItemWidth, setCalculatedItemWidth] = useState(0);
    const controls = useAnimation();

    const itemCount = children.length;
    const x = useMotionValue(0);

    // Spring-animated x position for smooth momentum
    const springX = useSpring(x, {
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    });

    // Calculate dimensions
    useEffect(() => {
      if (!containerRef.current) return;

      const updateDimensions = () => {
        const width = containerRef.current?.offsetWidth ?? 0;
        setContainerWidth(width);

        if (itemWidth === "auto") {
          const calculatedWidth = (width - gap * (visibleItems - 1)) / visibleItems;
          setCalculatedItemWidth(calculatedWidth);
        } else {
          setCalculatedItemWidth(itemWidth);
        }
      };

      updateDimensions();
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
    }, [itemWidth, gap, visibleItems]);

    // Calculate positions
    const slideWidth = calculatedItemWidth + gap;
    const maxX = 0;
    const minX = -(slideWidth * (itemCount - visibleItems));

    // Go to specific index
    const goToIndex = useCallback(
      (index: number, animated = true) => {
        let targetIndex = index;

        if (loop) {
          targetIndex = ((index % itemCount) + itemCount) % itemCount;
        } else {
          targetIndex = Math.max(0, Math.min(index, itemCount - visibleItems));
        }

        setActiveIndex(targetIndex);
        onIndexChange?.(targetIndex);

        const targetX = -targetIndex * slideWidth;

        if (animated && shouldAnimate) {
          controls.start({
            x: targetX,
            transition: getSpring(spring.default),
          });
        } else {
          x.set(targetX);
        }

        // Haptic feedback
        if (haptic && isFullMotion && "vibrate" in navigator) {
          navigator.vibrate(5);
        }
      },
      [
        loop,
        itemCount,
        visibleItems,
        slideWidth,
        shouldAnimate,
        controls,
        getSpring,
        x,
        haptic,
        isFullMotion,
        onIndexChange,
      ]
    );

    // Navigation
    const goNext = useCallback(() => {
      goToIndex(activeIndex + 1);
    }, [activeIndex, goToIndex]);

    const goPrev = useCallback(() => {
      goToIndex(activeIndex - 1);
    }, [activeIndex, goToIndex]);

    // Handle drag end with momentum
    const handleDragEnd = useCallback(
      (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        // Calculate momentum-based slide count
        const momentumSlides = Math.round(
          (velocity * dragSensitivity) / 1000
        );
        const offsetSlides = Math.round(offset / slideWidth);
        const totalSlides = Math.max(
          -1,
          Math.min(1, momentumSlides + (Math.abs(offsetSlides) > 0.3 ? offsetSlides : 0))
        );

        goToIndex(activeIndex - totalSlides);
      },
      [activeIndex, dragSensitivity, slideWidth, goToIndex]
    );

    // Auto-play
    useEffect(() => {
      if (autoPlay <= 0) return;

      const interval = setInterval(() => {
        goToIndex(activeIndex + 1);
      }, autoPlay);

      return () => clearInterval(interval);
    }, [autoPlay, activeIndex, goToIndex]);

    // Initial position
    useEffect(() => {
      x.set(-initialIndex * slideWidth);
    }, [initialIndex, slideWidth, x]);

    return (
      <div ref={ref} className={cn("relative", className)}>
        {/* Carousel Track Container */}
        <div
          ref={containerRef}
          className="overflow-hidden rounded-xl"
        >
          <motion.div
            className="flex cursor-grab active:cursor-grabbing"
            style={{ x: shouldAnimate ? springX : x, gap }}
            drag="x"
            dragConstraints={{ left: minX, right: maxX }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            animate={controls}
          >
            {React.Children.map(children, (child, index) => (
              <CarouselItem
                key={index}
                width={calculatedItemWidth}
                index={index}
                activeIndex={activeIndex}
                shouldAnimate={shouldAnimate}
              >
                {child}
              </CarouselItem>
            ))}
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        {showArrows && itemCount > visibleItems && (
          <>
            <CarouselArrow
              direction="prev"
              onClick={goPrev}
              disabled={!loop && activeIndex === 0}
              shouldAnimate={shouldAnimate}
            />
            <CarouselArrow
              direction="next"
              onClick={goNext}
              disabled={!loop && activeIndex >= itemCount - visibleItems}
              shouldAnimate={shouldAnimate}
            />
          </>
        )}

        {/* Dots Navigation */}
        {showDots && itemCount > visibleItems && (
          <CarouselDots
            count={itemCount - visibleItems + 1}
            activeIndex={activeIndex}
            onDotClick={goToIndex}
            shouldAnimate={shouldAnimate}
          />
        )}
      </div>
    );
  }
);

Carousel.displayName = "Carousel";

// ============================================
// CAROUSEL ITEM
// ============================================

interface CarouselItemProps {
  children: ReactNode;
  width: number;
  index: number;
  activeIndex: number;
  shouldAnimate: boolean;
}

function CarouselItem({
  children,
  width,
  index,
  activeIndex,
  shouldAnimate,
}: CarouselItemProps) {
  const isActive = index === activeIndex;
  const { getSpring } = useAnimationPreference();

  return (
    <motion.div
      className="flex-shrink-0"
      style={{ width }}
      animate={
        shouldAnimate
          ? {
              scale: isActive ? 1 : 0.95,
              opacity: isActive ? 1 : 0.7,
            }
          : undefined
      }
      transition={getSpring(spring.snappy)}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// CAROUSEL ARROW
// ============================================

interface CarouselArrowProps {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
  shouldAnimate: boolean;
}

function CarouselArrow({
  direction,
  onClick,
  disabled,
  shouldAnimate,
}: CarouselArrowProps) {
  const { getSpring } = useAnimationPreference();
  const isPrev = direction === "prev";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-dropdown",
        "w-10 h-10 rounded-full",
        "bg-white/90 backdrop-blur-sm",
        "border border-border-default/60",
        "shadow-lg shadow-text-primary/10",
        "flex items-center justify-center",
        "text-text-primary hover:text-primary",
        "transition-colors duration-150",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isPrev ? "left-3" : "right-3"
      )}
      whileHover={shouldAnimate && !disabled ? { scale: 1.1 } : undefined}
      whileTap={shouldAnimate && !disabled ? { scale: 0.9 } : undefined}
      transition={getSpring(spring.snappy)}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isPrev ? "" : "rotate-180"}
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </motion.button>
  );
}

// ============================================
// CAROUSEL DOTS
// ============================================

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
  onDotClick: (index: number) => void;
  shouldAnimate: boolean;
}

function CarouselDots({
  count,
  activeIndex,
  onDotClick,
  shouldAnimate,
}: CarouselDotsProps) {
  const { getSpring } = useAnimationPreference();

  return (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === activeIndex;

        return (
          <motion.button
            key={index}
            onClick={() => onDotClick(index)}
            className={cn(
              "h-2 rounded-full transition-colors duration-150",
              isActive
                ? "bg-primary"
                : "bg-border-strong hover:bg-text-muted"
            )}
            animate={
              shouldAnimate
                ? {
                    width: isActive ? 24 : 8,
                    scale: isActive ? 1 : 0.9,
                  }
                : { width: isActive ? 24 : 8 }
            }
            transition={getSpring(spring.snappy)}
            whileHover={shouldAnimate ? { scale: 1.2 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.8 } : undefined}
          />
        );
      })}
    </div>
  );
}

// ============================================
// MENU CATEGORY CAROUSEL
// Pre-styled variant for menu categories
// ============================================

export interface CategoryCarouselProps {
  categories: Array<{
    id: string;
    name: string;
    icon?: ReactNode;
    count?: number;
  }>;
  activeId?: string;
  onCategorySelect?: (id: string) => void;
  className?: string;
}

export function CategoryCarousel({
  categories,
  activeId,
  onCategorySelect,
  className,
}: CategoryCarouselProps) {
  const activeIndex = categories.findIndex((c) => c.id === activeId);
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <Carousel
      className={className}
      gap={12}
      showDots={false}
      showArrows={false}
      visibleItems={3}
      initialIndex={Math.max(0, activeIndex)}
    >
      {categories.map((category) => {
        const isActive = category.id === activeId;

        return (
          <motion.button
            key={category.id}
            onClick={() => onCategorySelect?.(category.id)}
            className={cn(
              "w-full py-3 px-4 rounded-xl",
              "flex flex-col items-center gap-2",
              "transition-colors duration-150",
              isActive
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-white border border-border-default text-text-primary hover:border-primary/30"
            )}
            whileHover={shouldAnimate ? { y: -2 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            transition={getSpring(spring.snappy)}
          >
            {category.icon && (
              <span className={cn("text-2xl", isActive ? "text-secondary" : "")}>
                {category.icon}
              </span>
            )}
            <span className="text-sm font-medium truncate w-full text-center">
              {category.name}
            </span>
            {category.count !== undefined && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-surface-tertiary text-text-muted"
                )}
              >
                {category.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </Carousel>
  );
}

export default Carousel;
