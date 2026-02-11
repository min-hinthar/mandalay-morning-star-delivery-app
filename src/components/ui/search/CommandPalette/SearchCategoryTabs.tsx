"use client";

import { m } from "framer-motion";
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
 * - Active tab: solid primary background with smooth layoutId indicator
 * - Inactive tabs: subtle secondary background with hover state
 * - Horizontal scroll with hidden scrollbar for many categories
 */
export function SearchCategoryTabs({
  tabs,
  activeTab,
  onTabChange,
}: SearchCategoryTabsProps) {
  if (tabs.length === 0) return null;

  const totalCount = tabs.reduce((sum, tab) => sum + tab.count, 0);

  return (
    <div className="overflow-x-auto scrollbar-hide border-b border-border/20">
      <div className="flex gap-1 px-3 py-2">
        {/* All tab */}
        <TabPill
          label={`All (${totalCount})`}
          isActive={activeTab === null}
          onClick={() => onTabChange(null)}
          layoutId="search-tab-indicator"
        />

        {/* Category tabs */}
        {tabs.map((tab) => (
          <TabPill
            key={tab.slug}
            label={`${tab.name} (${tab.count})`}
            isActive={activeTab === tab.slug}
            onClick={() => onTabChange(tab.slug)}
            layoutId="search-tab-indicator"
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
  layoutId: string;
}

function TabPill({ label, isActive, onClick, layoutId }: TabPillProps) {
  return (
    <button
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
      {/* Animated active indicator */}
      {isActive && (
        <m.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-full bg-primary shadow-sm"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 32,
          }}
        />
      )}

      {/* Label text (above indicator) */}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

export default SearchCategoryTabs;
