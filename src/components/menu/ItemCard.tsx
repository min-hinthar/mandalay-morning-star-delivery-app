"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Star, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { ALLERGEN_MAP } from "@/lib/constants/allergens";
import type { MenuItem } from "@/types/menu";

interface ItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const tags = item.tags ?? [];
  const isPopular = tags.includes("featured") || tags.includes("popular");
  const hasAllergens = item.allergens && item.allergens.length > 0;

  const handleClick = () => {
    if (!item.isSoldOut) {
      onSelect(item);
    }
  };

  return (
    <motion.div
      whileHover={item.isSoldOut || shouldReduceMotion ? undefined : { y: -8, scale: 1.02 }}
      whileTap={item.isSoldOut || shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "group overflow-hidden rounded-2xl bg-white transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
          item.isSoldOut
            ? "cursor-not-allowed opacity-60 shadow-sm"
            : "cursor-pointer shadow-sm hover:shadow-premium"
        )}
        onClick={handleClick}
        tabIndex={item.isSoldOut ? -1 : 0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
          }
        }}
        role="button"
        aria-disabled={item.isSoldOut}
        aria-label={`${item.nameEn}${item.isSoldOut ? " - Sold Out" : ""}`}
      >
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {isPopular && !item.isSoldOut && (
            <Badge className="absolute left-3 top-3 z-10 border-0 bg-gold text-primary shadow-md">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Popular
            </Badge>
          )}

          {item.imageUrl && !imageError ? (
            <>
              {!imageLoaded && <Skeleton className="absolute inset-0" />}
              <Image
                src={item.imageUrl}
                alt={item.nameEn}
                fill
                className={cn(
                  "object-cover transition-all duration-500 ease-out",
                  imageLoaded ? "opacity-100" : "opacity-0",
                  !item.isSoldOut && "group-hover:scale-110"
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onLoadingComplete={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {/* Gradient overlay on hover */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent",
                  "opacity-0 transition-opacity duration-300",
                  !item.isSoldOut && "group-hover:opacity-100"
                )}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold/20 to-brand-red/10">
              <span className="text-sm text-muted">No image</span>
            </div>
          )}

          {/* Quick Add Button - Desktop only */}
          {!item.isSoldOut && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 right-3 z-10 hidden md:block"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <Plus className="w-4 h-4 text-brand-red" />
                <span className="text-sm font-medium text-brand-red">Add</span>
              </button>
            </motion.div>
          )}

          {item.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center glass bg-black/40">
              <Badge
                variant="secondary"
                className="bg-white/90 backdrop-blur-sm px-4 py-2 text-base text-foreground shadow-lg"
              >
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="mb-2">
            <h3 className="line-clamp-1 font-semibold text-foreground leading-tight">
              {item.nameEn}
            </h3>
            {item.nameMy && (
              <p className="font-burmese line-clamp-1 text-sm text-muted-foreground">
                {item.nameMy}
              </p>
            )}
          </div>

          {item.descriptionEn && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {item.descriptionEn}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-brand-red group-hover:text-gradient-gold transition-colors">
              {formatPrice(item.basePriceCents)}
            </span>

            {hasAllergens && (
              <TooltipProvider>
                <div className="flex gap-1">
                  {item.allergens.slice(0, 4).map((allergen) => {
                    const info = ALLERGEN_MAP[allergen];
                    if (!info) return null;

                    const IconComponent = info.icon;
                    return (
                      <Tooltip key={allergen}>
                        <TooltipTrigger asChild>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
                            <IconComponent className={cn("h-3.5 w-3.5", info.color)} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Contains {info.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {item.allergens.length > 4 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
                          <span className="text-xs font-medium text-amber-700">
                            +{item.allergens.length - 4}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {item.allergens
                            .slice(4)
                            .map((allergen) => ALLERGEN_MAP[allergen]?.label || allergen)
                            .join(", ")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
