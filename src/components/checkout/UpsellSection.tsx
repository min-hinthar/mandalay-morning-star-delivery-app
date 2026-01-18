"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import type { MenuItem } from "@/types/menu";

interface UpsellSectionProps {
  /** Items to suggest as upsells */
  items: MenuItem[];
  /** Callback when item is added */
  onAddItem: (item: MenuItem) => void;
  /** Currently added item IDs */
  addedItemIds?: Set<string>;
  /** Maximum items to display */
  maxItems?: number;
  /** Optional class name */
  className?: string;
}

/**
 * UpsellSection - "Goes well with" recommendations
 *
 * V5 Design Tokens:
 * - Interactive: var(--color-interactive-primary)
 * - Accent: var(--color-accent-secondary)
 * - Surface: var(--color-surface), var(--color-surface-muted)
 */
export function UpsellSection({
  items,
  onAddItem,
  addedItemIds = new Set(),
  maxItems = 4,
  className,
}: UpsellSectionProps) {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-interactive-primary)]/10">
          <Sparkles className="h-4 w-4 text-[var(--color-interactive-primary)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            Goes well with
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Complete your meal
          </p>
        </div>
      </div>

      {/* Upsell Items Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item) => (
            <UpsellItem
              key={item.id}
              item={item}
              isAdded={addedItemIds.has(item.id)}
              onAdd={() => onAddItem(item)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface UpsellItemProps {
  item: MenuItem;
  isAdded: boolean;
  onAdd: () => void;
}

function UpsellItem({ item, isAdded, onAdd }: UpsellItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 transition-all duration-200",
        "bg-[var(--color-surface)]",
        isAdded
          ? "border-[var(--color-accent-secondary)] shadow-[var(--shadow-glow-jade)]"
          : "border-[var(--color-border)] hover:border-[var(--color-interactive-primary)]/50 hover:shadow-md"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-[var(--color-surface-muted)]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.nameEn}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-[var(--color-text-muted)]">No image</span>
          </div>
        )}

        {/* Add Button Overlay */}
        <motion.button
          type="button"
          onClick={onAdd}
          disabled={isAdded}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-all duration-200",
            isAdded
              ? "bg-[var(--color-accent-secondary)]/80"
              : "bg-black/0 group-hover:bg-black/30"
          )}
          aria-label={isAdded ? `${item.nameEn} added to cart` : `Add ${item.nameEn} to cart`}
        >
          <motion.div
            initial={false}
            animate={{
              scale: isAdded ? 1 : isHovered ? 1 : 0,
              opacity: isAdded ? 1 : isHovered ? 1 : 0,
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isAdded
                ? "bg-white text-[var(--color-accent-secondary)]"
                : "bg-[var(--color-interactive-primary)] text-white"
            )}
          >
            {isAdded ? (
              <Check className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </motion.div>
        </motion.button>

        {/* Added Badge */}
        {isAdded && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 rounded-full bg-[var(--color-accent-secondary)] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm"
          >
            Added
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">
          {item.nameEn}
        </h4>
        <p className="mt-0.5 text-sm font-bold text-[var(--color-interactive-primary)]">
          +{formatPrice(item.basePriceCents)}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * UpsellSection Skeleton for loading states
 */
export function UpsellSectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-[var(--color-surface-muted)] animate-shimmer" />
        <div className="space-y-1">
          <div className="h-4 w-24 rounded bg-[var(--color-surface-muted)] animate-shimmer" />
          <div className="h-3 w-20 rounded bg-[var(--color-surface-muted)] animate-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <div className="aspect-square bg-[var(--color-surface-muted)] animate-shimmer" />
            <div className="p-2.5 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-[var(--color-surface-muted)] animate-shimmer" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-surface-muted)] animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
