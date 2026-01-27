"use client";

import { Command } from "cmdk";
import { motion } from "framer-motion";
import Image from "next/image";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "@/types/menu";

export interface SearchResultsProps {
  /** Menu items to display */
  items: MenuItem[];
  /** Callback when an item is selected */
  onSelect: (item: MenuItem) => void;
}

/**
 * Search results list with thumbnails for the command palette
 *
 * Features:
 * - Thumbnail images (w-10 h-10 rounded-lg)
 * - Item name and price
 * - Selected state with bg-primary/10
 * - Keyboard navigation via cmdk
 */
export function SearchResults({ items, onSelect }: SearchResultsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Command.Group heading={null}>
      <div className="max-h-80 overflow-y-auto py-2">
        {items.map((item, index) => (
          <Command.Item
            key={item.id}
            value={item.nameEn}
            onSelect={() => onSelect(item)}
            className={cn(
              "relative flex cursor-pointer items-center gap-3 px-3 py-2.5 outline-none",
              "transition-all duration-150",
              "data-[selected=true]:bg-primary/10",
              "data-[selected=true]:scale-[1.01]"
            )}
          >
            <motion.div
              variants={staggerItem}
              initial="hidden"
              animate="visible"
              custom={index}
              transition={spring.gentle}
              className="flex w-full items-center gap-3"
            >
              {/* Thumbnail */}
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.nameEn}
                    fill
                    sizes="40px"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAME/8QAIBAAAgEEAQUAAAAAAAAAAAAAAQIAAwQRITESExQzUf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFREBAQAAAAAAAAAAAAAAAAAAAAH/2gAMAwEAAhEDEQA/ANlpS7G5ZWqAlV5GBjU5PUUyaYB4B4iIK//Z"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-muted">
                    <span className="text-lg font-medium">
                      {item.nameEn.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <span className="flex-1 truncate text-sm font-medium text-text-primary">
                {item.nameEn}
              </span>

              {/* Price */}
              <span className="text-sm text-text-muted">
                {formatPrice(item.basePriceCents)}
              </span>
            </motion.div>
          </Command.Item>
        ))}
      </div>
    </Command.Group>
  );
}

export default SearchResults;
