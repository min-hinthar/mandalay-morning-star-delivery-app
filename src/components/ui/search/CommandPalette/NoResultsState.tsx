"use client";

import { Command } from "cmdk";
import { m } from "framer-motion";
import { SearchX, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { formatPrice } from "@/lib/utils/format";
import Image from "next/image";
import type { MenuItem } from "@/types/menu";

export interface NoResultsStateProps {
  query: string;
  popularItems: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

/**
 * No-results state with popular items fallback.
 * Shown when query produces zero matches from both menu and order history.
 */
export function NoResultsState({ query, popularItems, onSelectItem }: NoResultsStateProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
      className="py-2"
    >
      {/* No results message */}
      <div className="px-4 py-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
          <SearchX className="h-5 w-5 text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-primary">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="mt-1 text-xs text-text-muted">Try a different search term</p>
      </div>

      {/* Popular items to browse */}
      {popularItems.length > 0 && (
        <Command.Group heading="">
          <div className="mx-4 border-t border-border/30" />
          <div className="flex items-center gap-1.5 px-4 py-2 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <TrendingUp className="h-3 w-3" />
            Try these instead
          </div>
          {popularItems.map((item, index) => (
            <Command.Item
              key={item.id}
              value={`no-results-popular:${item.nameEn}`}
              onSelect={() => onSelectItem(item)}
              className={cn(
                "relative flex cursor-pointer items-center gap-3",
                "px-4 py-2 outline-none",
                "transition-all duration-150",
                "data-[selected=true]:bg-primary/8 dark:data-[selected=true]:bg-primary/15"
              )}
            >
              <m.div
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                custom={index}
                className="flex w-full items-center gap-3"
              >
                {/* Thumbnail */}
                <div
                  className={cn(
                    "relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg",
                    "bg-surface-secondary ring-1 ring-border/10"
                  )}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.nameEn}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-text-muted">
                      <span className="text-base font-medium">{item.nameEn.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Name + Price */}
                <span className="flex-1 truncate text-sm font-medium text-text-primary">
                  {item.nameEn}
                </span>
                <span className="text-sm text-text-muted">{formatPrice(item.basePriceCents)}</span>
              </m.div>
            </Command.Item>
          ))}
        </Command.Group>
      )}
    </m.div>
  );
}

export default NoResultsState;
