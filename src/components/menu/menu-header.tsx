"use client";

import { motion } from "framer-motion";
import { CartButton } from "@/components/ui/cart";
import { SearchInput } from "./SearchInput";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { cn } from "@/lib/utils/cn";

interface MenuHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  isSearching?: boolean;
}

export function MenuHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching = false,
}: MenuHeaderProps) {
  const { isCollapsed } = useScrollDirection({ threshold: 10 });
  const isSearchActive = searchQuery.length > 0;

  return (
    <motion.header
      initial={false}
      animate={{
        y: isCollapsed && !isSearchActive ? -64 : 0,
      }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "sticky top-0 z-20 h-14",
        "bg-[var(--color-cream)]/95 dark:bg-[var(--color-background)]/95",
        "backdrop-blur-lg border-b border-[var(--color-border)]"
      )}
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4">
        <h1 className="font-display text-lg text-brand-red sm:text-xl">
          Our Menu
        </h1>

        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onClearSearch}
            isLoading={isSearching}
          />
          <CartButton />
        </div>
      </div>
    </motion.header>
  );
}
