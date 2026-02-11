"use client";

import { Command } from "cmdk";
import { m } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { staggerItem } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";
import type { OrderHistoryItem } from "@/lib/hooks/useOrderHistorySearch";

/**
 * Format a date string into a human-readable relative time.
 * "2 hours ago", "3 days ago", "2 weeks ago", etc.
 */
function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export interface SearchOrderHistoryProps {
  /** Order history search results */
  results: OrderHistoryItem[];
  /** Callback when an order history item is selected (fills search with item name) */
  onSelectItem: (nameSnapshot: string) => void;
}

/**
 * "From your orders" section in the command palette.
 *
 * Renders below menu search results when a user's past order items
 * match the current query. Each item shows the name snapshot,
 * quantity, and relative date.
 */
export function SearchOrderHistory({
  results,
  onSelectItem,
}: SearchOrderHistoryProps) {
  if (results.length === 0) return null;

  return (
    <Command.Group heading="">
      {/* Section divider */}
      <div className="mx-4 my-1 border-t border-border/30" />

      {/* Section header */}
      <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <ShoppingBag className="h-3 w-3" />
        From your orders
      </div>

      {results.map((item, index) => (
        <Command.Item
          key={`order-${item.orderId}-${item.nameSnapshot}`}
          value={`order:${item.nameSnapshot}`}
          onSelect={() => onSelectItem(item.nameSnapshot)}
          className={cn(
            "relative flex cursor-pointer items-center gap-3",
            "px-4 py-2.5 text-sm outline-none",
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
            {/* Order icon with subtle background */}
            <div className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center",
              "rounded-lg bg-primary/8 dark:bg-primary/12"
            )}>
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
            </div>

            {/* Item details */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-text-primary">
                {item.nameSnapshot}
              </span>
              <span className="text-xs text-text-muted">
                {item.quantity > 1 && `${item.quantity}x \u00B7 `}
                {formatRelativeTime(item.placedAt)}
              </span>
            </div>
          </m.div>
        </Command.Item>
      ))}
    </Command.Group>
  );
}

export default SearchOrderHistory;
