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
 * DishHero — editorial header for the item detail sheet.
 *
 * Full-bleed Ken-Burns image + legibility scrim, a glass close button that
 * lives OUTSIDE the clipped image (so the corner can never crop it), and a
 * floating glass title plate that overlaps the image for depth (name + Burmese
 * + clay/amber price + accent rule, over a faded dot-grid).
 */
export function DishHero({ item, onClose }: DishHeroProps) {
  return (
    <>
      {/* Hero image — clipped separately from the close button */}
      <div className="relative aspect-video shrink-0">
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
          {/* Legibility scrim under the floating title plate */}
          <div className="menu-modal-scrim absolute inset-x-0 bottom-0 h-2/3" aria-hidden="true" />
          {item.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-overlay-heavy">
              <Badge variant="default" size="lg">
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        {/* Close button — glass pill, ≥44px tap target, clear of the corner */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 z-20",
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-surface-inverse/55 hover:bg-surface-inverse/75",
            "text-text-inverse shadow-lg",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-primary/60"
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Floating glass title plate — overlaps the image for editorial depth */}
      <div className="relative z-10 -mt-12 mx-4 overflow-hidden rounded-2xl border border-border bg-surface-primary shadow-xl">
        <span className="menu-modal-dots pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative p-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">{item.nameEn}</h2>
          {item.nameMy && <p className="font-burmese text-text-muted">{item.nameMy}</p>}
          <p className="menu-modal-price mt-1 font-display text-2xl font-bold">
            {formatPrice(item.basePriceCents)}
          </p>
          {/* Clay/amber accent rule — After Dark divider */}
          <div className="menu-modal-rule mt-3 h-px w-full" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}

export default DishHero;
