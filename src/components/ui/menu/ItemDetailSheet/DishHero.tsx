"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "@/types/menu";
import { getCategoryEmoji } from "./helpers";

export interface DishHeroProps {
  item: MenuItem;
  onClose: () => void;
}

/**
 * DishHero — photo-first header for the item detail sheet.
 *
 * The food photo stays the hero (taller on mobile, Ken-Burns drift). A glass
 * close button floats OUTSIDE the clipped image (so its corner can never crop).
 * A floating glass title plate (name + Burmese + clay/amber price + accent rule,
 * over a faded dot-grid) overlaps the photo by a SMALL amount for layered depth
 * — texture, not a cover.
 */
export function DishHero({ item, onClose }: DishHeroProps) {
  return (
    <>
      {/* Photo — the hero. Close button is a sibling of the clip, never cropped. */}
      <div className="relative aspect-[4/3] shrink-0 sm:aspect-video">
        <div className="absolute inset-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="menu-modal-kenburns object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">{getCategoryEmoji(item.tags?.[0])}</span>
            </div>
          )}
          {/* Subtle bottom scrim so the overlapping plate edge blends into depth */}
          <div className="menu-modal-scrim absolute inset-x-0 bottom-0 h-1/3" aria-hidden="true" />
          {item.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-overlay-heavy">
              <Badge variant="default" size="lg">
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        {/* Close button — glass pill, ≥40px tap target, safe-area aware so the
            iOS status-bar / notch can never clip it */}
        <button
          onClick={onClose}
          className={cn(
            "absolute right-3 top-3 z-30",
            "flex h-11 w-11 items-center justify-center rounded-full",
            // surface-elevated + hero-ink/hero-card-strong are NOT remapped by the
            // sheet's .menu-paper, so the chip + X stay theme-true (light frosted
            // circle + dark X in light, dark circle + cream X in dark) instead of
            // the dark-on-dark meld text-inverse/surface-inverse inherited.
            "bg-surface-elevated/85 hover:bg-surface-elevated",
            "text-hero-ink shadow-lg ring-1 ring-hero-ink/10 md:backdrop-blur-sm dark:text-hero-card-strong",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Floating glass title plate — compact, small overlap for layered texture */}
      <div className="relative z-10 -mt-5 mx-4 overflow-hidden rounded-2xl border border-border bg-surface-primary shadow-lg">
        <span className="menu-modal-dots pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3 px-3.5 py-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-tight text-text-primary">
              {item.nameEn}
            </h2>
            {item.nameMy && <p className="font-burmese text-sm text-text-muted">{item.nameMy}</p>}
          </div>
          <p className="menu-modal-price shrink-0 font-display text-lg font-bold leading-tight">
            {formatPrice(item.basePriceCents)}
          </p>
        </div>
      </div>
    </>
  );
}

export default DishHero;
