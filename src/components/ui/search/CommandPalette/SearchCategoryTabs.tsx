"use client";

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
 * - Active tab: solid primary pill — background and label live on the SAME
 *   button (self-contained active state). The previous separately-measured
 *   indicator div left the near-white label on the bare palette surface on
 *   first paint / measurement miss: light-on-light invisible in light mode
 *   (the documented menu-tab gotcha, mirrored to light theme).
 * - Inactive tabs: subtle secondary background with hover state
 * - Horizontal scroll with hidden scrollbar for many categories
 */
export function SearchCategoryTabs({ tabs, activeTab, onTabChange }: SearchCategoryTabsProps) {
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
        />

        {/* Category tabs */}
        {tabs.map((tab) => (
          <TabPill
            key={tab.slug}
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

function TabPill({ label, isActive, onClick }: TabPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-shrink-0",
        "px-3 py-1.5 rounded-full",
        "text-xs font-medium",
        "transition-colors duration-200",
        "whitespace-nowrap",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-surface-secondary/60 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      )}
    >
      {label}
    </button>
  );
}

export default SearchCategoryTabs;
