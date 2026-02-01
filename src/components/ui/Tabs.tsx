"use client";

/**
 * Generic Tabs Component
 * Horizontal tabs with animated pill indicator
 *
 * Features:
 * - Horizontal layout with animated pill indicator (layoutId)
 * - Support for icons in tabs
 * - Motion animations with spring physics
 * - Accessible: role="tablist", aria-selected
 * - Scrollable on mobile
 *
 * @example
 * <Tabs
 *   tabs={[
 *     { id: 'delivery', label: 'Delivery', icon: <Truck /> },
 *     { id: 'operations', label: 'Operations', icon: <Settings2 /> },
 *   ]}
 *   activeTab="delivery"
 *   onTabChange={(id) => setActiveTab(id)}
 * />
 */

import { memo, useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";

export interface Tab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon to display before label */
  icon?: React.ReactNode;
}

export interface TabsProps {
  /** Array of tab configurations */
  tabs: Tab[];
  /** Currently active tab id */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Additional CSS classes for container */
  className?: string;
  /** Unique layout ID for animated pill (use when multiple Tabs on same page) */
  layoutId?: string;
}

export const Tabs = memo(function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  layoutId = "activeTab",
}: TabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  // Fade indicator states for overflow
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Handle scroll position for fade indicators
  const updateFadeIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isScrollable = scrollWidth > clientWidth;

    setShowLeftFade(isScrollable && scrollLeft > 10);
    setShowRightFade(isScrollable && scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Set up scroll and resize observers
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    updateFadeIndicators();

    // Scroll listener
    container.addEventListener("scroll", updateFadeIndicators, { passive: true });

    // Resize observer
    const resizeObserver = new ResizeObserver(updateFadeIndicators);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateFadeIndicators);
      resizeObserver.disconnect();
    };
  }, [updateFadeIndicators]);

  // Scroll active tab into view when it changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    const activeTab = activeTabRef.current;

    if (!container || !activeTab) return;

    let isMounted = true;
    let rafId: number | null = null;

    rafId = requestAnimationFrame(() => {
      if (!isMounted) return;

      const currentContainer = scrollContainerRef.current;
      const currentTab = activeTabRef.current;

      if (!currentContainer || !currentTab) return;

      const containerRect = currentContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;

      const tabOffsetLeft = currentTab.offsetLeft;
      const tabWidth = currentTab.offsetWidth;

      // Calculate target scroll position to center the tab
      const targetScrollLeft = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);

      // Clamp to valid scroll range
      const maxScroll = currentContainer.scrollWidth - containerWidth;
      const clampedScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));

      // Check if tab is already visible
      const currentScrollLeft = currentContainer.scrollLeft;
      const tabLeftRelativeToScroll = tabOffsetLeft - currentScrollLeft;
      const tabRightRelativeToScroll = tabLeftRelativeToScroll + tabWidth;
      const padding = 20;
      const isVisible = tabLeftRelativeToScroll >= padding && tabRightRelativeToScroll <= containerWidth - padding;

      if (!isVisible) {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        currentContainer.scrollTo({
          left: clampedScrollLeft,
          behavior: prefersReducedMotion || !shouldAnimate ? "auto" : "smooth",
        });
      }
    });

    return () => {
      isMounted = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [activeTab, shouldAnimate]);

  return (
    <div className={cn("relative", className)}>
      {/* Left fade indicator */}
      {showLeftFade && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8 z-10",
            "bg-gradient-to-r from-surface-secondary to-transparent",
            "pointer-events-none rounded-l-card-sm"
          )}
          aria-hidden="true"
        />
      )}

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Settings tabs"
        className={cn(
          "flex gap-1 p-1 overflow-x-auto scrollbar-hide",
          "bg-surface-secondary rounded-card-sm"
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex-shrink-0 px-4 py-2.5 min-h-[44px]",
                "rounded-input font-body text-sm font-medium",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {/* Animated pill background for active state */}
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 bg-surface-primary rounded-input shadow-sm"
                  transition={shouldAnimate ? { type: "spring", bounce: 0.2, duration: 0.4 } : { duration: 0 }}
                />
              )}

              {/* Tab content */}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right fade indicator */}
      {showRightFade && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-8 z-10",
            "bg-gradient-to-l from-surface-secondary to-transparent",
            "pointer-events-none rounded-r-card-sm"
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

export default Tabs;
