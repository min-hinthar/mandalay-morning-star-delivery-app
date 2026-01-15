"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { MenuItem } from "@/types/menu";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
}

const allergenLabels: Record<string, string> = {
  peanuts: "Peanuts",
  tree_nuts: "Tree Nuts",
  egg: "Egg",
  shellfish: "Shellfish",
  fish: "Fish",
  soy: "Soy",
  gluten_wheat: "Gluten",
  sesame: "Sesame",
  dairy: "Dairy",
};

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const hasAllergens = item.allergens && item.allergens.length > 0;
  const isInteractive = Boolean(onSelect) && !item.isSoldOut;

  return (
    <motion.div
      whileHover={isInteractive ? { y: -4, scale: 1.01 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card shadow-sm",
        "border-2 border-transparent",
        "transition-all duration-300 ease-out",
        isInteractive && [
          "cursor-pointer",
          "hover:shadow-xl hover:border-primary/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        ],
        item.isSoldOut && "opacity-70"
      )}
      onClick={() => isInteractive && onSelect?.(item)}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(item);
        }
      }}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
    >
      {/* Image Container */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-secondary/30 to-primary/5">
        {item.imageUrl ? (
          <>
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                isInteractive && "group-hover:scale-110"
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-muted-foreground">No image</span>
          </div>
        )}

        {/* Sold Out Overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Badge className="bg-white px-4 py-2 text-base font-bold text-foreground shadow-lg">
              Sold Out
            </Badge>
          </div>
        )}

        {/* Price Badge (floating) */}
        <div className="absolute bottom-3 right-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full bg-primary px-3 py-1.5 font-bold text-white shadow-lg"
          >
            {formatPrice(item.basePriceCents)}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-foreground leading-tight text-base group-hover:text-primary transition-colors">
            {item.nameEn}
          </h3>
          {item.nameMy && (
            <p className="text-sm text-muted-foreground font-burmese mt-0.5">
              {item.nameMy}
            </p>
          )}
        </div>

        {item.descriptionEn && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.descriptionEn}
          </p>
        )}

        {hasAllergens && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.allergens.slice(0, 3).map((allergen) => (
              <Badge
                key={allergen}
                variant="outline"
                className="text-xs bg-amber-50 text-amber-700 border-amber-200 font-medium"
              >
                {allergenLabels[allergen] || allergen}
              </Badge>
            ))}
            {item.allergens.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs bg-muted text-muted-foreground border-border"
              >
                +{item.allergens.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Hover indicator */}
      {isInteractive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
      )}
    </motion.div>
  );
}
