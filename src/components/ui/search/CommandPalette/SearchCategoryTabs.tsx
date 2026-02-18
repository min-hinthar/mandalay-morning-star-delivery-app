"use client";

import { useRef, useState, useEffect, useCallback, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface SearchCategoryTabsProps {
  /** Available category tabs with result counts */
  tabs: { slug: string; name: string; count: number }[];
  /** Currently active tab slug (null = "All") */
  activeTab: string | null;
  /** Callback when tab changes */
  onTabChange: (slug: string | null) => void;
}

/**
 * Horizontal scrolling category tab bar for search result filtering.
 *
 * - "All" tab always first (activeTab === null)
 * - Active tab: solid primary background with smooth CSS transition
 * - Inactive tabs: subtle secondary background with hover state
 * - Horizontal scroll with hidden scrollbar for many categories
 */
export function SearchCategoryTabs({ tabs, activeTab, onTabChange }: SearchCategoryTabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const updateIndicatorPosition = useCallback(() => {
    const key = activeTab ?? "__all__";
    const activeButton = tabRefs.current.get(key);
    if (!activeButton) {
      setIndicatorStyle(null);
      return;
    }
    setIndicatorStyle({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });
  }, [activeTab]);

  useEffect(() => {
    updateIndicatorPosition();
  }, [updateIndicatorPosition]);

  if (tabs.length === 0) return null;

  const totalCount = tabs.reduce((sum, tab) => sum + tab.count, 0);

  return (
    <div className="overflow-x-auto scrollbar-hide border-b border-border/20">
      <div className="relative flex gap-1 px-3 py-2">
        {/* CSS-transitioned pill indicator */}
        {indicatorStyle && (
          <div
            className="absolute rounded-full bg-primary shadow-sm transition-all duration-200 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              top: 8,
              height: "calc(100% - 16px)",
            }}
            aria-hidden="true"
          />
        )}

        {/* All tab */}
        <TabPill
          ref={(el) => {
            if (el) {
              tabRefs.current.set("__all__", el);
            } else {
              tabRefs.current.delete("__all__");
            }
          }}
          label={`All (${totalCount})`}
          isActive={activeTab === null}
          onClick={() => onTabChange(null)}
        />

        {/* Category tabs */}
        {tabs.map((tab) => (
          <TabPill
            key={tab.slug}
            ref={(el) => {
              if (el) {
                tabRefs.current.set(tab.slug, el);
              } else {
                tabRefs.current.delete(tab.slug);
              }
            }}
            label={`${tab.name} (${tab.count})`}
            isActive={activeTab === tab.slug}
            onClick={() => onTabChange(tab.slug)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// TAB PILL SUBCOMPONENT
// ============================================

interface TabPillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabPill = forwardRef<HTMLButtonElement, TabPillProps>(function TabPill(
  { label, isActive, onClick },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0",
        "px-3 py-1.5 rounded-full",
        "text-xs font-medium",
        "transition-colors duration-100",
        "whitespace-nowrap",
        isActive
          ? "text-primary-foreground"
          : "bg-surface-secondary/60 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      )}
    >
      {/* Label text (above indicator) */}
      <span className="relative z-10">{label}</span>
    </button>
  );
});

export default SearchCategoryTabs;
