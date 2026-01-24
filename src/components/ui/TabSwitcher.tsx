/**
 * V5 Sprint 5: TabSwitcher Component
 *
 * Animated tab component with direction-aware content transitions.
 * Supports underline and pill variants with full accessibility.
 *
 * Features:
 * - Direction-aware slide animations
 * - Mobile swipe navigation
 * - Horizontal scroll with edge fades
 * - Keyboard navigation (arrow keys)
 * - ARIA tablist/tab/tabpanel roles
 * - Reduced motion support
 */

"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSwipeNavigation, triggerHaptic } from "@/lib/swipe-gestures";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export interface Tab {
  /** Unique identifier for the tab */
  id: string;
  /** Tab label text */
  label: string;
  /** Tab content to render */
  content: ReactNode;
  /** Optional icon to show before label */
  icon?: ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface TabSwitcherProps {
  /** Array of tab configurations */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when active tab changes */
  onChange: (id: string) => void;
  /** Visual variant */
  variant?: "underline" | "pill";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class for the container */
  className?: string;
  /** Additional class for the tab list */
  tabListClassName?: string;
  /** Additional class for the content area */
  contentClassName?: string;
  /** Only render active tab content (performance optimization) */
  lazy?: boolean;
  /** Enable swipe navigation on mobile */
  swipeEnabled?: boolean;
  /** Sticky tab list position */
  sticky?: boolean;
}

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const sizeConfig = {
  sm: {
    tab: "px-3 py-2 text-sm min-h-[36px]",
    indicator: "h-0.5",
    gap: "gap-1",
    icon: "h-4 w-4",
  },
  md: {
    tab: "px-4 py-2.5 text-sm min-h-[44px]",
    indicator: "h-0.5",
    gap: "gap-2",
    icon: "h-4 w-4",
  },
  lg: {
    tab: "px-5 py-3 text-base min-h-[52px]",
    indicator: "h-[3px]",
    gap: "gap-2",
    icon: "h-5 w-5",
  },
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const tabContentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
  }),
};

const reducedMotionVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

// ============================================
// TAB SWITCHER COMPONENT
// ============================================

export function TabSwitcher({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  size = "md",
  className,
  tabListClassName,
  contentClassName,
  lazy = false,
  swipeEnabled = true,
  sticky = false,
}: TabSwitcherProps) {
  const baseId = useId();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const prefersReducedMotion = useReducedMotion();

  // Track scroll position for edge fades
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Track direction for content animation
  const [direction, setDirection] = useState(0);
  const prevTabRef = useRef(activeTab);

  // Get current tab index
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === tabs.length - 1;

  // Swipe navigation hook
  const { motionProps: swipeProps, isDragging } = useSwipeNavigation({
    onNext: () => {
      if (!isLast) {
        const nextTab = tabs[activeIndex + 1];
        if (nextTab && !nextTab.disabled) {
          triggerHaptic("light");
          onChange(nextTab.id);
        }
      }
    },
    onPrev: () => {
      if (!isFirst) {
        const prevTab = tabs[activeIndex - 1];
        if (prevTab && !prevTab.disabled) {
          triggerHaptic("light");
          onChange(prevTab.id);
        }
      }
    },
    isFirst,
    isLast,
    disabled: !swipeEnabled || prefersReducedMotion === true,
  });

  const config = sizeConfig[size];

  // Update direction when tab changes
  useEffect(() => {
    const prevIndex = tabs.findIndex((t) => t.id === prevTabRef.current);
    const newDirection = activeIndex > prevIndex ? 1 : -1;
    setDirection(newDirection);
    prevTabRef.current = activeTab;
  }, [activeTab, activeIndex, tabs]);

  // Update scroll indicators
  const updateScrollIndicators = useCallback(() => {
    const container = tabListRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const threshold = 10;

    setShowLeftFade(scrollLeft > threshold);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - threshold);
  }, []);

  // Initialize and observe scroll
  useEffect(() => {
    const container = tabListRef.current;
    if (!container) return;

    updateScrollIndicators();

    const resizeObserver = new ResizeObserver(updateScrollIndicators);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [updateScrollIndicators, tabs]);

  // Scroll active tab into view
  useEffect(() => {
    const activeTabEl = tabRefs.current.get(activeTab);
    const container = tabListRef.current;

    if (activeTabEl && container) {
      const tabRect = activeTabEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTabEl.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab, prefersReducedMotion]);

  // Set tab ref
  const setTabRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      if (el) {
        tabRefs.current.set(id, el);
      } else {
        tabRefs.current.delete(id);
      }
    },
    []
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = tabs.findIndex((t) => t.id === activeTab);

      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowLeft":
          nextIndex = currentIndex - 1;
          break;
        case "ArrowRight":
          nextIndex = currentIndex + 1;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();

      // Find next enabled tab
      while (nextIndex >= 0 && nextIndex < tabs.length) {
        if (!tabs[nextIndex].disabled) {
          onChange(tabs[nextIndex].id);
          tabRefs.current.get(tabs[nextIndex].id)?.focus();
          return;
        }
        nextIndex += event.key === "ArrowLeft" || event.key === "Home" ? -1 : 1;
      }
    },
    [tabs, activeTab, onChange]
  );

  // Handle tab click
  const handleTabClick = useCallback(
    (id: string, disabled?: boolean) => {
      if (disabled) return;
      triggerHaptic("light");
      onChange(id);
    },
    [onChange]
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Tab List */}
      <div className={cn("relative", sticky && "sticky top-0 z-10bg-inherit")}>
        {/* Left fade indicator */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8 z-10pointer-events-none",
            "bg-gradient-to-r from-[var(--color-surface,#fff)] to-transparent",
            "dark:from-[var(--color-surface-primary-dark,#1a1918)]",
            "transition-opacity duration-150",
            showLeftFade ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* Right fade indicator */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-8 z-10pointer-events-none",
            "bg-gradient-to-l from-[var(--color-surface,#fff)] to-transparent",
            "dark:from-[var(--color-surface-primary-dark,#1a1918)]",
            "transition-opacity duration-150",
            showRightFade ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* Scrollable tab container */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Tabs"
          onKeyDown={handleKeyDown}
          onScroll={updateScrollIndicators}
          className={cn(
            "flex overflow-x-auto scrollbar-hide",
            "-webkit-overflow-scrolling-touch",
            config.gap,
            variant === "underline" && "border-b border-[var(--color-border,#e5e5e5)] dark:border-[var(--color-border-dark,#3a3837)]",
            variant === "pill" && "p-1 bg-[var(--color-surface-secondary,#f8f7f6)] dark:bg-[var(--color-surface-secondary-dark,#2a2827)] rounded-lg",
            tabListClassName
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const tabId = `${baseId}-tab-${tab.id}`;
            const panelId = `${baseId}-panel-${tab.id}`;

            return (
              <button
                key={tab.id}
                ref={setTabRef(tab.id)}
                id={tabId}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={panelId}
                aria-disabled={tab.disabled}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(tab.id, tab.disabled)}
                disabled={tab.disabled}
                className={cn(
                  "relative flex-shrink-0 flex items-center justify-center",
                  "font-medium whitespace-nowrap",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  "focus-visible:ring-[var(--color-interactive-primary,#D4A853)]",
                  config.tab,
                  // Variant-specific styles
                  variant === "underline" && [
                    isActive
                      ? "text-[var(--color-text-primary,#1a1918)] dark:text-[var(--color-text-primary-dark,#f8f7f6)]"
                      : "text-[var(--color-text-secondary,#4a4845)] dark:text-[var(--color-text-secondary-dark,#b5b3b0)]",
                    !tab.disabled && !isActive && "hover:text-[var(--color-text-primary,#1a1918)] dark:hover:text-[var(--color-text-primary-dark,#f8f7f6)]",
                  ],
                  variant === "pill" && [
                    "rounded-md",
                    isActive
                      ? "text-white"
                      : "text-[var(--color-text-secondary,#4a4845)] dark:text-[var(--color-text-secondary-dark,#b5b3b0)]",
                    !tab.disabled && !isActive && "hover:text-[var(--color-text-primary,#1a1918)] dark:hover:text-[var(--color-text-primary-dark,#f8f7f6)] hover:bg-[var(--color-surface-tertiary,#f0eeec)] dark:hover:bg-[var(--color-surface-tertiary-dark,#3a3837)]",
                  ],
                  // Disabled styles
                  tab.disabled && "opacity-50 cursor-not-allowed"
                )}
                data-testid={`tab-${tab.id}`}
              >
                {/* Pill background indicator */}
                {variant === "pill" && isActive && (
                  <motion.div
                    layoutId={`${baseId}-pill-indicator`}
                    className={cn(
                      "absolute inset-0 rounded-md",
                      "bg-[var(--color-interactive-primary,#D4A853)]",
                      "shadow-sm"
                    )}
                    initial={false}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 500, damping: 30 }
                    }
                  />
                )}

                {/* Tab content */}
                <span className={cn("relative z-10flex items-center", config.gap)}>
                  {tab.icon && (
                    <span className={cn(config.icon, "flex-shrink-0")}>
                      {tab.icon}
                    </span>
                  )}
                  {tab.label}
                </span>

                {/* Underline indicator */}
                {variant === "underline" && isActive && (
                  <motion.div
                    layoutId={`${baseId}-underline-indicator`}
                    className={cn(
                      "absolute bottom-0 left-0 right-0",
                      config.indicator,
                      "bg-[var(--color-interactive-primary,#D4A853)]",
                      "rounded-full"
                    )}
                    initial={false}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 500, damping: 30 }
                    }
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <motion.div
        className={cn("relative overflow-hidden", contentClassName)}
        {...(swipeEnabled && !prefersReducedMotion ? swipeProps : {})}
        style={isDragging ? { touchAction: "none" } : undefined}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const panelId = `${baseId}-panel-${tab.id}`;
            const tabId = `${baseId}-tab-${tab.id}`;

            // In lazy mode, only render active tab
            if (lazy && !isActive) return null;

            return (
              <motion.div
                key={tab.id}
                id={panelId}
                role="tabpanel"
                aria-labelledby={tabId}
                hidden={!isActive}
                tabIndex={0}
                custom={direction}
                variants={prefersReducedMotion ? reducedMotionVariants : tabContentVariants}
                initial="enter"
                animate={isActive ? "center" : "exit"}
                exit="exit"
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.2, ease: "easeOut" }
                }
                className={cn(
                  isActive ? "block" : "hidden",
                  "focus:outline-none"
                )}
                data-testid={`tabpanel-${tab.id}`}
              >
                {tab.content}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================
// CONTROLLED TAB STATE HOOK
// ============================================

export interface UseTabStateOptions {
  /** Initial active tab ID */
  defaultTab?: string;
  /** Controlled active tab ID */
  activeTab?: string;
  /** Callback when tab changes */
  onChange?: (id: string) => void;
}

export interface UseTabStateReturn {
  activeTab: string;
  setActiveTab: (id: string) => void;
  isControlled: boolean;
}

/**
 * Hook for managing tab state with optional controlled mode.
 *
 * @example
 * // Uncontrolled
 * const { activeTab, setActiveTab } = useTabState({ defaultTab: 'tab1' });
 *
 * // Controlled
 * const { activeTab, setActiveTab } = useTabState({
 *   activeTab: controlledTab,
 *   onChange: setControlledTab,
 * });
 */
export function useTabState({
  defaultTab = "",
  activeTab: controlledTab,
  onChange,
}: UseTabStateOptions = {}): UseTabStateReturn {
  const [internalTab, setInternalTab] = useState(defaultTab);
  const isControlled = controlledTab !== undefined;

  const activeTab = isControlled ? controlledTab : internalTab;

  const setActiveTab = useCallback(
    (id: string) => {
      if (!isControlled) {
        setInternalTab(id);
      }
      onChange?.(id);
    },
    [isControlled, onChange]
  );

  return { activeTab, setActiveTab, isControlled };
}

// ============================================
// TAB LIST ONLY COMPONENT
// ============================================

export interface TabListProps {
  /** Array of tab configurations (without content) */
  tabs: Array<{ id: string; label: string; icon?: ReactNode; disabled?: boolean }>;
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when active tab changes */
  onChange: (id: string) => void;
  /** Visual variant */
  variant?: "underline" | "pill";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class for the container */
  className?: string;
}

/**
 * Standalone tab list without content panels.
 * Useful when content is rendered separately (e.g., in a different area of the page).
 */
export function TabList({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  size = "md",
  className,
}: TabListProps) {
  const baseId = useId();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const prefersReducedMotion = useReducedMotion();

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const config = sizeConfig[size];

  const updateScrollIndicators = useCallback(() => {
    const container = tabListRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const threshold = 10;

    setShowLeftFade(scrollLeft > threshold);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - threshold);
  }, []);

  useEffect(() => {
    const container = tabListRef.current;
    if (!container) return;

    updateScrollIndicators();

    const resizeObserver = new ResizeObserver(updateScrollIndicators);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [updateScrollIndicators, tabs]);

  useEffect(() => {
    const activeTabEl = tabRefs.current.get(activeTab);
    const container = tabListRef.current;

    if (activeTabEl && container) {
      const tabRect = activeTabEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTabEl.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab, prefersReducedMotion]);

  const setTabRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      if (el) {
        tabRefs.current.set(id, el);
      } else {
        tabRefs.current.delete(id);
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowLeft":
          nextIndex = currentIndex - 1;
          break;
        case "ArrowRight":
          nextIndex = currentIndex + 1;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();

      while (nextIndex >= 0 && nextIndex < tabs.length) {
        if (!tabs[nextIndex].disabled) {
          onChange(tabs[nextIndex].id);
          tabRefs.current.get(tabs[nextIndex].id)?.focus();
          return;
        }
        nextIndex += event.key === "ArrowLeft" || event.key === "Home" ? -1 : 1;
      }
    },
    [tabs, activeTab, onChange]
  );

  return (
    <div className={cn("relative", className)}>
      {/* Left fade */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-6 z-10pointer-events-none",
          "bg-gradient-to-r from-[var(--color-surface,#fff)] to-transparent",
          "dark:from-[var(--color-surface-primary-dark,#1a1918)]",
          "transition-opacity duration-150",
          showLeftFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Right fade */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-6 z-10pointer-events-none",
          "bg-gradient-to-l from-[var(--color-surface,#fff)] to-transparent",
          "dark:from-[var(--color-surface-primary-dark,#1a1918)]",
          "transition-opacity duration-150",
          showRightFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Tab buttons */}
      <div
        ref={tabListRef}
        role="tablist"
        onKeyDown={handleKeyDown}
        onScroll={updateScrollIndicators}
        className={cn(
          "flex overflow-x-auto scrollbar-hide",
          "-webkit-overflow-scrolling-touch",
          config.gap,
          variant === "underline" && "border-b border-[var(--color-border,#e5e5e5)] dark:border-[var(--color-border-dark,#3a3837)]",
          variant === "pill" && "p-1 bg-[var(--color-surface-secondary,#f8f7f6)] dark:bg-[var(--color-surface-secondary-dark,#2a2827)] rounded-lg"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={setTabRef(tab.id)}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "relative flex-shrink-0 flex items-center justify-center",
                "font-medium whitespace-nowrap",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "focus-visible:ring-[var(--color-interactive-primary,#D4A853)]",
                config.tab,
                variant === "underline" && [
                  isActive
                    ? "text-[var(--color-text-primary,#1a1918)] dark:text-[var(--color-text-primary-dark,#f8f7f6)]"
                    : "text-[var(--color-text-secondary,#4a4845)] dark:text-[var(--color-text-secondary-dark,#b5b3b0)]",
                  !tab.disabled && !isActive && "hover:text-[var(--color-text-primary,#1a1918)] dark:hover:text-[var(--color-text-primary-dark,#f8f7f6)]",
                ],
                variant === "pill" && [
                  "rounded-md",
                  isActive
                    ? "text-white"
                    : "text-[var(--color-text-secondary,#4a4845)] dark:text-[var(--color-text-secondary-dark,#b5b3b0)]",
                  !tab.disabled && !isActive && "hover:bg-[var(--color-surface-tertiary,#f0eeec)] dark:hover:bg-[var(--color-surface-tertiary-dark,#3a3837)]",
                ],
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {variant === "pill" && isActive && (
                <motion.div
                  layoutId={`${baseId}-pill`}
                  className="absolute inset-0 rounded-md bg-[var(--color-interactive-primary,#D4A853)] shadow-sm"
                  initial={false}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 500, damping: 30 }
                  }
                />
              )}

              <span className={cn("relative z-10flex items-center", config.gap)}>
                {tab.icon && <span className={cn(config.icon, "flex-shrink-0")}>{tab.icon}</span>}
                {tab.label}
              </span>

              {variant === "underline" && isActive && (
                <motion.div
                  layoutId={`${baseId}-underline`}
                  className={cn(
                    "absolute bottom-0 left-0 right-0",
                    config.indicator,
                    "bg-[var(--color-interactive-primary,#D4A853)] rounded-full"
                  )}
                  initial={false}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 500, damping: 30 }
                  }
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
