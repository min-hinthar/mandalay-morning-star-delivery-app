"use client";

import { AnimatePresence, m } from "framer-motion";
import { CartButton } from "@/components/ui/cart";
import { SearchInput } from "./SearchInput";
import { DietaryChipPicker } from "@/components/ui/account/SettingsTab/DietaryChipPicker";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

interface MenuHeaderProps {
  /** Callback when search query changes */
  onQueryChange: (query: string) => void;
  /** Callback when menu item is selected from autocomplete */
  onSelectItem?: (item: MenuItem) => void;
  /** Active dietary filter selections */
  dietaryFilters: string[];
  /** Callback when dietary filters change */
  onDietaryChange: (filters: string[]) => void;
}

// ============================================
// ANIMATION
// ============================================

const chipsRowVariants = {
  open: { height: "auto", opacity: 1 },
  closed: { height: 0, opacity: 0 },
};

// ============================================
// COMPONENT
// ============================================

export function MenuHeader({
  onQueryChange,
  onSelectItem,
  dietaryFilters,
  onDietaryChange,
}: MenuHeaderProps) {
  const { isCollapsed } = useScrollDirection({ threshold: 10 });

  return (
    <header
      className={cn(
        "sticky top-0 z-20",
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
        "bg-[var(--color-cream)] dark:bg-[var(--color-background)] sm:bg-[var(--color-cream)]/95 sm:dark:bg-[var(--color-background)]/95",
        "sm:backdrop-blur-lg border-b border-[var(--color-border)]"
      )}
    >
      {/* Top row: title + search + cart — always visible */}
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <h1 className="font-display text-lg text-brand-red sm:text-xl">Our Menu</h1>

        <div className="flex items-center gap-2">
          <SearchInput
            onQueryChange={onQueryChange}
            onSelectItem={onSelectItem}
            mobileCollapsible={false}
          />
          <CartButton />
        </div>
      </div>

      {/* Dietary chips row: collapses on scroll-down, expands on scroll-up */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <m.div
            key="dietary-chips"
            variants={chipsRowVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-auto max-w-5xl px-4 pb-2">
              <div className="overflow-x-auto no-scrollbar">
                <DietaryChipPicker selected={dietaryFilters} onChange={onDietaryChange} />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
