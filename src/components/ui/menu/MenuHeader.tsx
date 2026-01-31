"use client";

import { motion } from "framer-motion";
import { CartButton } from "@/components/ui/cart";
import { SearchInput } from "./SearchInput";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "@/types/menu";

interface MenuHeaderProps {
  /** Callback when search query changes */
  onQueryChange?: (query: string) => void;
  /** Callback when menu item is selected from autocomplete */
  onSelectItem?: (item: MenuItem) => void;
  /** Whether search is currently active (for header visibility) */
  isSearchActive?: boolean;
}

export function MenuHeader({
  onQueryChange,
  onSelectItem,
  isSearchActive = false,
}: MenuHeaderProps) {
  const { isCollapsed } = useScrollDirection({ threshold: 10 });

  return (
    <motion.header
      initial={false}
      animate={{
        y: isCollapsed && !isSearchActive ? -64 : 0,
      }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "sticky top-0 z-20 h-14",
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
        "bg-[var(--color-cream)] dark:bg-[var(--color-background)] sm:bg-[var(--color-cream)]/95 sm:dark:bg-[var(--color-background)]/95",
        "sm:backdrop-blur-lg border-b border-[var(--color-border)]"
      )}
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4">
        <h1 className="font-display text-lg text-brand-red sm:text-xl">
          Our Menu
        </h1>

        <div className="flex items-center gap-2">
          <SearchInput
            onQueryChange={onQueryChange}
            onSelectItem={onSelectItem}
            mobileCollapsible
          />
          <CartButton />
        </div>
      </div>
    </motion.header>
  );
}
