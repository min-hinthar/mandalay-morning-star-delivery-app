"use client";

import { Command } from "cmdk";
import type { FuseResultMatch } from "fuse.js";
import { m } from "framer-motion";
import Image from "next/image";
import { Star, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ALLERGEN_MAP } from "@/lib/constants/allergens";
import { formatPrice } from "@/lib/utils/format";
import { getCategoryEmoji } from "@/lib/search";
import type { EnrichedMenuItem } from "@/lib/search";
import { staggerDelay } from "@/lib/motion-tokens";
import { HighlightedText } from "./HighlightedText";

export interface SearchResultCardProps {
  /** Enriched menu item with category context */
  item: EnrichedMenuItem;
  /** Fuse.js match data for highlighting */
  matches?: readonly FuseResultMatch[];
  /** Callback when this card is selected */
  onSelect: (item: EnrichedMenuItem) => void;
  /** Index for stagger animation delay */
  index: number;
}

/**
 * Rich search result card with 64px thumbnail, match highlights,
 * category badge, dietary/allergen tags, sold-out state, and popularity indicator.
 *
 * Premium card design with layered depth, subtle shadows, and
 * staggered fade-in entrance animation via Framer Motion m.* components.
 */
export function SearchResultCard({
  item,
  matches,
  onSelect,
  index,
}: SearchResultCardProps) {
  const isSoldOut = item.isSoldOut;
  const isPopular = item.tags.includes("popular");

  // Filter displayable tags: exclude "popular" (own badge) and "contains_*" (duplicates allergens)
  const dietaryTags = item.tags.filter(
    (t) => t !== "popular" && t !== "featured" && !t.startsWith("contains_")
  );

  return (
    <Command.Item
      value={item.nameEn}
      onSelect={() => onSelect(item)}
      disabled={isSoldOut}
      className={cn(
        "relative cursor-pointer outline-none",
        "transition-colors duration-100",
        "data-[selected=true]:bg-primary/8 dark:data-[selected=true]:bg-primary/15",
        isSoldOut && "opacity-50 cursor-not-allowed"
      )}
    >
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 28,
          delay: staggerDelay(index, 0.04, 0.32),
        }}
        className={cn(
          "flex items-start gap-3 px-3 py-2.5",
          "group"
        )}
      >
        {/* Thumbnail: 64px square */}
        <div
          className={cn(
            "relative w-16 h-16 flex-shrink-0",
            "rounded-xl overflow-hidden",
            "bg-surface-secondary",
            "ring-1 ring-border/10",
            "shadow-sm"
          )}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-secondary">
              <span className="text-2xl leading-none">
                {getCategoryEmoji(item._categorySlug)}
              </span>
            </div>
          )}

          {/* Sold Out overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-primary/60">
              <span className="text-2xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content: name, category, tags */}
        <div className="flex-1 min-w-0 py-0.5">
          {/* Item name with match highlighting */}
          <p className="text-sm font-semibold text-text-primary truncate leading-snug">
            <HighlightedText
              text={item.nameEn}
              matches={matches}
              fieldKey="nameEn"
            />
          </p>

          {/* Category badge */}
          <span
            className={cn(
              "inline-flex items-center mt-1",
              "px-1.5 py-0.5 rounded-full",
              "text-2xs font-medium",
              "bg-surface-secondary/80 text-text-muted",
              "leading-none"
            )}
          >
            {item._categoryName}
          </span>

          {/* Dietary tags + allergen icon badges */}
          {(dietaryTags.length > 0 || item.allergens.length > 0) && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center",
                    "px-1.5 py-0.5 rounded-full",
                    "text-2xs font-medium leading-none",
                    tag === "vegetarian" && "bg-green-500/15 text-green-700 dark:text-green-400",
                    tag === "vegan" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                    (tag === "spicy" || tag === "very-spicy" || tag === "extra-spicy") && "bg-red-500/15 text-red-600 dark:text-red-400",
                    tag !== "vegetarian" && tag !== "vegan" && tag !== "spicy" && tag !== "very-spicy" && tag !== "extra-spicy" && "bg-surface-secondary text-text-muted"
                  )}
                >
                  {tag}
                </span>
              ))}
              {item.allergens.length > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-2xs font-medium leading-none bg-orange-500/10 text-orange-700 dark:text-orange-400"
                  title={item.allergens.map((a) => ALLERGEN_MAP[a]?.label || a).join(", ")}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {item.allergens.length > 1 ? `${item.allergens.length} allergens` : ALLERGEN_MAP[item.allergens[0]]?.label || item.allergens[0]}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right column: price + popularity badge */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 py-0.5">
          <span className="text-sm font-semibold text-text-primary tabular-nums">
            {formatPrice(item.basePriceCents)}
          </span>

          {isPopular && !isSoldOut && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5",
                "px-1.5 py-0.5 rounded-full",
                "text-2xs font-semibold leading-none",
                "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              )}
            >
              <Star className="w-2.5 h-2.5 fill-current" />
              Popular
            </span>
          )}
        </div>
      </m.div>
    </Command.Item>
  );
}

export default SearchResultCard;
